/**
 * Student Enrolled Courses API Routes
 * GET - Get all courses a student is enrolled in
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
  const spanId = traceLogger.startSpan('API', 'GET /api/students/enrolled-courses');

  try {
    traceLogger.log('info', 'API', 'Student enrolled courses request received');

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

    traceLogger.log('info', 'API', 'Fetching student enrollments', { userId });
    const enrollments = await enrollmentService.getStudentEnrollments(userId);

    traceLogger.log('success', 'API', 'Enrollments retrieved', { count: enrollments.length });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        data: {
          enrollments,
          count: enrollments.length,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get enrollments', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get enrollments',
      },
      { status: 500 }
    );
  }
}

