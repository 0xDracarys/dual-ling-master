/**
 * POST /api/classes/instant
 * 
 * Start an instant meeting immediately
 * 
 * Security: Firebase Auth required, teacher role verified
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { classService } from '@/lib/services/class.service';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/classes/instant');

  try {
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
      return NextResponse.json({ error: 'Only teachers can start instant meetings' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;

    // Parse request body
    const body = await request.json();

    const {
      courseId,
      lessonId,
      title,
      description,
      duration,
      studentIds,
      externalEmails,
    } = body;

    // Validate required fields
    if (!courseId) {
      traceLogger.log('warn', 'API', 'Missing required field: courseId', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Missing courseId' });
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    if (!title) {
      traceLogger.log('warn', 'API', 'Missing required field: title', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Missing title' });
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // Validate duration if provided
    if (duration !== undefined && duration <= 0) {
      traceLogger.log('warn', 'API', 'Invalid duration', { duration });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid duration' });
      return NextResponse.json({ error: 'duration must be positive' }, { status: 400 });
    }

    traceLogger.log('info', 'API', 'Starting instant meeting', {
      teacherId,
      courseId,
      title,
    });

    // Start instant meeting
    const createdClass = await classService.startInstantMeeting({
      teacherId,
      courseId,
      lessonId,
      title,
      description,
      duration,
      studentIds: studentIds || [],
      externalEmails: externalEmails || [],
    });

    traceLogger.log('info', 'API', 'Instant meeting started successfully', {
      classId: createdClass.id,
      meetLink: createdClass.googleMeetLink,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      class: createdClass,
      meetLink: createdClass.googleMeetLink,
    });
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to start instant meeting', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Instant meeting failed' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start instant meeting' },
      { status: 500 }
    );
  }
}
