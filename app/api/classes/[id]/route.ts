/**
 * PUT /api/classes/[id]
 * 
 * Update a scheduled class
 * 
 * Security: Firebase Auth required, teacher role verified, ownership validated
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { classService } from '@/lib/services/class.service';
import { traceLogger } from '@/lib/tracing/trace-logger';

/**
 * DELETE /api/classes/[id]
 * 
 * Cancel a scheduled class
 * 
 * Security: Firebase Auth required, teacher role verified, ownership validated
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const spanId = traceLogger.startSpan('API', 'DELETE /api/classes/[id]');

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
      return NextResponse.json({ error: 'Only teachers can cancel classes' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;
    const classId = params.id;

    traceLogger.log('info', 'API', 'Cancelling class', {
      classId,
      teacherId,
    });

    // Cancel class
    await classService.cancelClass(classId, teacherId);

    traceLogger.log('info', 'API', 'Class cancelled successfully', {
      classId,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: 'Class cancelled successfully',
    });
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to cancel class', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Cancel class failed' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel class' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const spanId = traceLogger.startSpan('API', 'PUT /api/classes/[id]');

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
      return NextResponse.json({ error: 'Only teachers can update classes' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;
    const classId = params.id;

    // Parse request body
    const body = await request.json();

    const {
      title,
      description,
      startTime,
      duration,
      studentIds,
      externalEmails,
    } = body;

    // Parse startTime if provided
    let startDate: Date | undefined;
    if (startTime) {
      startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        traceLogger.log('warn', 'API', 'Invalid startTime format', { startTime });
        traceLogger.endSpan(spanId, 'error', { message: 'Invalid startTime' });
        return NextResponse.json({ error: 'Invalid startTime format' }, { status: 400 });
      }
    }

    // Validate duration if provided
    if (duration !== undefined && duration <= 0) {
      traceLogger.log('warn', 'API', 'Invalid duration', { duration });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid duration' });
      return NextResponse.json({ error: 'duration must be positive' }, { status: 400 });
    }

    traceLogger.log('info', 'API', 'Updating class', {
      classId,
      teacherId,
      updates: Object.keys(body),
    });

    // Update class
    const updatedClass = await classService.updateClass(
      classId,
      teacherId,
      {
        title,
        description,
        startTime: startDate,
        duration,
        studentIds,
        externalEmails,
      }
    );

    traceLogger.log('info', 'API', 'Class updated successfully', {
      classId: updatedClass.id,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      class: updatedClass,
    });
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to update class', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Update class failed' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update class' },
      { status: 500 }
    );
  }
}
