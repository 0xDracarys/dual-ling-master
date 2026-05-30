export const dynamic = 'force-dynamic';
/**
 * POST /api/classes/[id]/recording/archive
 * 
 * Keep recording forever (move to archive folder, prevent auto-deletion)
 * 
 * Security: Firebase Auth required, teacher role verified, ownership validated
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - CRITICAL AREA #5
 * @see docs/google-meet-calendar/google-meet-calendar.prd.md - Lines 686-720
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { googleDriveService } from '@/lib/services/google/google-drive.service';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const spanId = traceLogger.startSpan('API', 'POST /api/classes/[id]/recording/archive');

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
      return NextResponse.json({ error: 'Only teachers can archive recordings' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;
    const classId = params.id;

    traceLogger.log('info', 'API', 'Archiving class recording', {
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
      traceLogger.log('warn', 'API', 'No recording to archive', { classId });
      traceLogger.endSpan(spanId, 'error', { message: 'Not found' });
      return NextResponse.json({ error: 'No recording found for this class' }, { status: 404 });
    }

    // Check if already archived
    if (classData.recordingRetention?.archived) {
      traceLogger.log('info', 'API', 'Recording already archived', { classId });
      traceLogger.endSpan(spanId, 'success');
      return NextResponse.json({
        success: true,
        message: 'Recording is already archived',
      });
    }

    // Get or create archive folder
    const archiveFolderId = await googleDriveService.getOrCreateArchiveFolder(teacherId);

    // Move file to archive folder
    const fileId = classData.recordingDriveId;
    await googleDriveService.moveToArchive(teacherId, fileId, archiveFolderId);

    // Update Firestore (set archived flag)
    await classDoc.ref.update({
      'recordingRetention.archived': true,
      'recordingRetention.archivedAt': Timestamp.now(),
    });

    traceLogger.log('info', 'API', 'Recording archived successfully', {
      classId,
      fileId,
      archiveFolderId,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: 'Recording archived successfully - it will be kept forever',
    });
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to archive recording', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Archive recording failed' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to archive recording' },
      { status: 500 }
    );
  }
}
