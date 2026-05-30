export const dynamic = 'force-dynamic';
/**
 * Lesson Resources API Routes
 * POST - Upload resource (PDF, DOC, etc.)
 * GET - List lesson resources
 * 
 * Phase: PDF & Document Integration
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { getStorage } from 'firebase-admin/storage';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import type { LessonResource } from '@/lib/types/course.types';

// Force dynamic rendering

/**
 * POST /api/courses/[id]/lessons/[lessonId]/resources
 * Upload a resource file (PDF, DOC, DOCX, PPT, PPTX, TXT)
 * Teacher/Admin only
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id: courseId, lessonId } = await params;
    
    console.log('📥 [API] POST /resources received:', {
      courseId,
      lessonId,
      contentType: request.headers.get('content-type'),
      hasAuth: !!request.headers.get('authorization')
    });

    // 1. Verify authentication & teacher role
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.error('❌ [API] No token provided');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    console.log('🔑 [API] Verifying token...');
    const decodedToken = await verifyIdToken(token);
    console.log('✅ [API] Token verified:', {
      uid: decodedToken.uid,
      role: decodedToken.role
    });
    
    if (decodedToken.role !== 'teacher' && decodedToken.role !== 'admin') {
      console.error('❌ [API] Insufficient permissions:', decodedToken.role);
      return NextResponse.json(
        { error: 'Forbidden - Teacher access required' },
        { status: 403 }
      );
    }
    
    // 2. Parse multipart form data
    console.log('📦 [API] Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    
    console.log('📄 [API] Form data parsed:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      title,
      hasDescription: !!description
    });
    
    if (!file) {
      console.error('❌ [API] No file in form data');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // 3. Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLSX, TXT' },
        { status: 400 }
      );
    }
    
    // 4. Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 50MB' },
        { status: 400 }
      );
    }
    
    // 5. Verify lesson exists and get course ownership
    const db = getAdminDb();
    const lessonRef = db
      .collection('courses')
      .doc(courseId)
      .collection('lessons')
      .doc(lessonId);
    
    const lessonDoc = await lessonRef.get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    // 6. Verify course ownership (teacher owns the course)
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();
    
    if (!courseDoc.exists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    const courseData = courseDoc.data();
    if (courseData?.teacherId !== decodedToken.uid && decodedToken.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this course' },
        { status: 403 }
      );
    }
    
    // 7. Generate resource ID and storage path
    const resourceId = uuidv4();
    const fileExt = file.name.split('.').pop() || 'pdf';
    const storagePath = `courses/${courseId}/lessons/${lessonId}/resources/${resourceId}.${fileExt}`;
    
    // 8. Upload to Firebase Storage
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'paji-duolingo.firebasestorage.app';
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    console.log('☁️ [API] Uploading to Storage:', {
      bucketName,
      storagePath,
      fileSize: fileBuffer.length
    });
    
    const bucket = getStorage().bucket(bucketName);
    const storageFile = bucket.file(storagePath);
    await storageFile.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: decodedToken.uid,
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
          resourceId: resourceId
        }
      }
    });
    
    console.log('✅ [API] File uploaded to Storage');
    
    // 9. Get signed URL (1 year expiry for long-term access)
    console.log('🔗 [API] Generating signed URL...');
    const [signedUrl] = await storageFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
    });
    
    console.log('✅ [API] Signed URL generated');
    
    // 10. Create resource metadata with current timestamp (can't use serverTimestamp in arrayUnion)
    const resource: LessonResource = {
      id: resourceId,
      type: fileExt as LessonResource['type'],
      title: title || file.name,
      ...(description && { description }), // Only include description if it exists
      fileUrl: `gs://${bucket.name}/${storagePath}`,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: Timestamp.now(),
      uploadedBy: decodedToken.uid
    };
    
    // 11. Update Firestore lesson document with resource
    await lessonRef.update({
      resources: FieldValue.arrayUnion(resource),
      updatedAt: FieldValue.serverTimestamp()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Resource uploaded successfully',
      resource: {
        ...resource,
        uploadedAt: new Date(),
        downloadUrl: signedUrl
      }
    });
    
  } catch (error: any) {
    console.error('Resource upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload resource',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/courses/[id]/lessons/[lessonId]/resources
 * List all resources for a lesson
 * Authenticated users only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { id: courseId, lessonId } = await params;

    // 1. Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    await verifyIdToken(token);
    
    // 2. Get lesson document
    const db = getAdminDb();
    const lessonDoc = await db
      .collection('courses')
      .doc(courseId)
      .collection('lessons')
      .doc(lessonId)
      .get();
    
    if (!lessonDoc.exists) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    const lessonData = lessonDoc.data();
    const resources = lessonData?.resources || [];
    
    // 3. Generate download URLs for each resource (24-hour expiry)
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'paji-duolingo.firebasestorage.app';
    const bucket = getStorage().bucket(bucketName);
    const resourcesWithUrls = await Promise.all(
      resources.map(async (resource: LessonResource) => {
        try {
          // Extract path from gs:// URL
          const path = resource.fileUrl.replace(`gs://${bucket.name}/`, '');
          const file = bucket.file(path);
          
          // Generate signed URL
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
          });
          
          return {
            ...resource,
            downloadUrl: signedUrl
          };
        } catch (error) {
          console.error(`Error generating URL for resource ${resource.id}:`, error);
          return {
            ...resource,
            downloadUrl: null,
            error: 'Failed to generate download URL'
          };
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      resources: resourcesWithUrls,
      count: resourcesWithUrls.length
    });
    
  } catch (error: any) {
    console.error('Fetch resources error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch resources',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/courses/[id]/lessons/[lessonId]/resources/[resourceId]
 * Delete a specific resource (future implementation)
 * Teacher/Admin only
 */
