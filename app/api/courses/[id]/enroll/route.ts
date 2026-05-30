/**
 * Course Enrollment API Routes
 * POST - Enroll in a course
 *
 * Phase 3: Firebase Migration - Enrollment System
 */

import { type NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '@/lib/services/enrollment/enrollment.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin
export const dynamic = 'force-dynamic';

const enrollmentService = new EnrollmentService();

/**
 * POST /api/courses/[id]/enroll
 * Enroll authenticated user in a course
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;

  const spanId = traceLogger.startSpan('API', 'POST /api/courses/[id]/enroll', {
    courseId,
  });

  try {
    traceLogger.log('info', 'API', 'Enrollment request received', {
      courseId,
    });

    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid authorization header');
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Please log in to enroll',
        },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    traceLogger.log('info', 'API', 'Verifying Firebase token');
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      traceLogger.log('warn', 'API', 'Token verification failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid token' });
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid authentication token',
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || 'unknown@example.com';
    const userName = decodedToken.name || decodedToken.email || 'Student';

    traceLogger.log('info', 'API', 'User authenticated', {
      userId,
      userEmail,
    });

    // Check user role - students and teachers can enroll
    // (Teachers might want to preview their own courses)
    const userRole = decodedToken.role;
    if (userRole === 'admin') {
      traceLogger.log('warn', 'API', 'Admin attempted to enroll in course');
      // Admins can enroll for testing purposes
    }

    // Enroll student
    traceLogger.log('info', 'API', 'Enrolling user in course');
    const enrollment = await enrollmentService.enrollStudent(
      userId,
      courseId,
      userName,
      userEmail
    );

    traceLogger.log('success', 'API', 'Enrollment successful', {
      enrollmentId: enrollment.id,
      courseId,
      userId,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully enrolled in course',
        data: {
          enrollment,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Enrollment failed', {
      error: error.message,
      courseId,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    // Handle specific error cases
    if (error.message.includes('Already enrolled')) {
      return NextResponse.json(
        {
          success: false,
          error: 'You are already enrolled in this course',
        },
        { status: 400 }
      );
    }

    if (error.message.includes('unpublished')) {
      return NextResponse.json(
        {
          success: false,
          error: 'This course is not available for enrollment',
        },
        { status: 400 }
      );
    }

    if (error.message.includes('payment')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 402 } // Payment Required
      );
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to enroll in course',
      },
      { status: 500 }
    );
  }
}
