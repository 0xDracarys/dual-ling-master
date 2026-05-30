/**
 * Course Unpublish API Route
 * POST - Unpublish course (hide from students)
 *
 * Phase 3: Teacher Course Editing Feature
 */

import { type NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/course/course.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const courseService = new CourseService();

/**
 * POST /api/courses/[id]/unpublish
 * Unpublish course (teacher only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'POST /api/courses/[id]/unpublish', { courseId });

  try {
    traceLogger.log('info', 'API', 'Course unpublish request received', { courseId });

    // Get and verify Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing authorization header');
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      traceLogger.log('warn', 'API', 'Token verification failed', { error: error.message });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid token' });
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const teacherId = decodedToken.uid;
    const userRole = decodedToken.role;

    // Verify user is a teacher
    if (userRole !== 'teacher') {
      traceLogger.log('warn', 'API', 'Non-teacher attempted to unpublish course', {
        userId: teacherId,
        role: userRole,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        { success: false, error: 'Only teachers can unpublish courses' },
        { status: 403 }
      );
    }

    await courseService.unpublishCourse(courseId, teacherId);

    traceLogger.log('success', 'API', 'Course unpublished successfully', { courseId });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Course unpublished successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Course unpublish failed', {
      error: error.message,
      courseId,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    const statusCode = error.message.includes('Unauthorized')
      ? 403
      : error.message.includes('not found')
      ? 404
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: statusCode }
    );
  }
}
