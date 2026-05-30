export const dynamic = 'force-dynamic';
/**
 * Student Progress API Routes
 * GET - Get student progress for all enrolled courses
 * POST - Update progress (future implementation)
 * Phase 3: Enrollment Services Implementation
 */

import { type NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '@/lib/services/enrollment/enrollment.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin
export const dynamic = 'force-dynamic';

const enrollmentService = new EnrollmentService();

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/students/progress');

  try {
    traceLogger.log('info', 'API', 'Student progress request received');

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

    const userId = decodedToken.uid;

    traceLogger.log('info', 'API', 'Fetching student progress', { userId });
    const enrollments = await enrollmentService.getStudentEnrollments(userId);

    // Calculate stats
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'completed').length;
    const activeCourses = enrollments.filter(e => e.status === 'active').length;

    traceLogger.log('success', 'API', 'Progress retrieved', { 
      totalCourses,
      completedCourses,
      activeCourses 
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        data: {
          progress: enrollments,
          totalCourses,
          completedCourses,
          activeCourses,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get progress', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get progress',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/students/progress');

  try {
    traceLogger.log('info', 'API', 'Progress update request received');

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

    const userId = decodedToken.uid;
    const body = await request.json();
    const { courseId, lessonId, completed, timeSpent } = body;

    if (!courseId || !lessonId) {
      traceLogger.log('warn', 'API', 'Missing required fields');
      traceLogger.endSpan(spanId, 'error', { message: 'Validation error' });
      return NextResponse.json(
        { success: false, error: 'courseId and lessonId are required' },
        { status: 400 }
      );
    }

    traceLogger.log('info', 'API', 'Marking lesson complete', { 
      userId, 
      courseId, 
      lessonId,
      completed,
      timeSpent 
    });

    // Import ProgressService here to avoid circular dependencies
    const { ProgressService } = await import('@/lib/services/progress/progress.service');
    const progressService = new ProgressService();

    // Mark lesson as complete
    await progressService.markLessonComplete(
      userId,
      courseId,
      lessonId,
      timeSpent || 0
    );

    traceLogger.log('success', 'API', 'Progress updated successfully', { 
      lessonId,
      completed 
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Progress updated successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to update progress', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update progress',
      },
      { status: 500 }
    );
  }
}

