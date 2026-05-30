/**
 * GET /api/classes/[id]/recording
 * 
 * Retrieve recording details for a class
 * 
 * Security: Firebase Auth required, teacher role verified, ownership validated
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - CRITICAL AREA #4
 * @see docs/google-meet-calendar/google-meet-calendar.prd.md - Lines 686-720
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { googleDriveService } from '@/lib/services/google/google-drive.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { z } from 'zod';

// Zod schema for response validation
const RecordingResponseSchema = z.object({
  recordingUrl: z.string().url(),
  recordingDriveId: z.string(),
  recordingRetention: z.object({
    createdAt: z.string(),
    expiresAt: z.string(),
    archived: z.boolean(),
    daysRemaining: z.number(),
  }),
  recordingMetadata: z.object({
    name: z.string(),
    size: z.string(),
    mimeType: z.string(),
  }),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const spanId = traceLogger.startSpan('API', 'GET /api/classes/[id]/recording');

  try {
    // Await params (Next.js 15 requirement)
    const params = await context.params;
    
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid authorization header', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Forbidden - Not a teacher', {
        userId: decodedToken.uid,
        role: decodedToken.role,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ error: 'Only teachers can access recordings' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;
    const classId = params.id;

    traceLogger.log('info', 'API', 'Fetching class recording', {
      classId,
      teacherId,
    });

    // Get class from Firestore
    const db = getFirestore();
    const classDoc = await db.collection('classes').doc(classId).get();

    if (!classDoc.exists) {
      traceLogger.log('warn', 'API', 'Class not found', { classId });
      traceLogger.endSpan(spanId, 'error', { message: 'Not found' });
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const classData = classDoc.data();

    // Verify ownership
    if (classData?.teacherId !== teacherId) {
      traceLogger.log('warn', 'API', 'Forbidden - Not class owner', {
        classId,
        ownerId: classData?.teacherId,
        requesterId: teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ error: 'Access denied - not your class' }, { status: 403 });
    }

    // Check if recording exists
    if (!classData.recordingUrl || !classData.recordingDriveId) {
      traceLogger.log('info', 'API', 'No recording available', { classId });
      traceLogger.endSpan(spanId, 'success');
      return NextResponse.json({
        success: true,
        hasRecording: false,
        message: 'No recording available for this class',
      });
    }

    // Get file metadata from Drive
    const fileId = classData.recordingDriveId;
    const url = await googleDriveService.getRecordingUrl(teacherId, fileId);

    // Get retention information
    const createdAt = classData.recordingRetention?.createdAt?.toDate() || new Date();
    const archived = classData.recordingRetention?.archived || false;
    const retention = googleDriveService.checkRetention(createdAt, archived);

    // Build response
    const response = {
      success: true,
      hasRecording: true,
      recordingUrl: url,
      recordingDriveId: fileId,
      recordingRetention: {
        createdAt: retention.createdAt.toISOString(),
        expiresAt: retention.expiresAt.toISOString(),
        archived: retention.archived,
        daysRemaining: retention.daysRemaining,
      },
      recordingMetadata: {
        name: classData.recordingMetadata?.name || 'Recording',
        size: classData.recordingMetadata?.size || '0',
        mimeType: classData.recordingMetadata?.mimeType || 'video/mp4',
      },
    };

    // Validate response
    RecordingResponseSchema.parse(response);

    traceLogger.log('info', 'API', 'Recording fetched successfully', {
      classId,
      daysRemaining: retention.daysRemaining,
      archived: retention.archived,
    });

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json(response);
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to fetch recording', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Fetch recording failed' });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid response data', details: error.errors },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recording' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes/[id]/recording
 * 
 * Delete recording immediately (before 30-day expiration)
 * 
 * Security: Firebase Auth required, teacher role verified, ownership validated
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const spanId = traceLogger.startSpan('API', 'DELETE /api/classes/[id]/recording');

  try {
    // Await params (Next.js 15 requirement)
    const params = await context.params;
    
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid authorization header', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Forbidden - Not a teacher', {
        userId: decodedToken.uid,
        role: decodedToken.role,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ error: 'Only teachers can delete recordings' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;
    const classId = params.id;

    traceLogger.log('info', 'API', 'Deleting class recording', {
      classId,
      teacherId,
    });

    // Get class from Firestore
    const db = getFirestore();
    const classDoc = await db.collection('classes').doc(classId).get();

    if (!classDoc.exists) {
      traceLogger.log('warn', 'API', 'Class not found', { classId });
      traceLogger.endSpan(spanId, 'error', { message: 'Not found' });
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    const classData = classDoc.data();

    // Verify ownership
    if (classData?.teacherId !== teacherId) {
      traceLogger.log('warn', 'API', 'Forbidden - Not class owner', {
        classId,
        ownerId: classData?.teacherId,
        requesterId: teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ error: 'Access denied - not your class' }, { status: 403 });
    }

    // Check if recording exists
    if (!classData.recordingDriveId) {
      traceLogger.log('warn', 'API', 'No recording to delete', { classId });
      traceLogger.endSpan(spanId, 'error', { message: 'Not found' });
      return NextResponse.json({ error: 'No recording found for this class' }, { status: 404 });
    }

    // Delete from Drive
    const fileId = classData.recordingDriveId;
    await googleDriveService.deleteRecording(teacherId, fileId);

    // Update Firestore (remove recording references)
    await classDoc.ref.update({
      recordingUrl: null,
      recordingDriveId: null,
      recordingRetention: null,
      recordingMetadata: null,
    });

    traceLogger.log('info', 'API', 'Recording deleted successfully', {
      classId,
      fileId,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: 'Recording deleted successfully',
    });
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to delete recording', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Delete recording failed' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete recording' },
      { status: 500 }
    );
  }
}
