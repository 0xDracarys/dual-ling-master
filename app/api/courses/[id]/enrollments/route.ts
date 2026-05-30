export const dynamic = 'force-dynamic';
/**
 * Course Enrollments API Routes
 * GET - Get all enrollments for a course (teacher only)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '@/lib/services/enrollment/enrollment.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';


const enrollmentService = new EnrollmentService();

/**
 * GET /api/courses/[id]/enrollments
 * Get all students enrolled in a course (teacher only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'GET /api/courses/[id]/enrollments', { courseId });

  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing authorization header');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const teacherId = decodedToken.uid;

    // Verify user is a teacher
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Non-teacher attempted to access enrollments');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Only teachers can view enrollments' },
        { status: 403 }
      );
    }

    traceLogger.log('info', 'API', 'Fetching course enrollments', { courseId, teacherId });

    // getCourseEnrollments already verifies course ownership
    const enrollments = await enrollmentService.getCourseEnrollments(courseId, teacherId);

    traceLogger.log('success', 'API', 'Enrollments retrieved', { count: enrollments.length });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      data: {
        enrollments,
        totalStudents: enrollments.filter(e => e.status === 'active').length,
      },
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get enrollments', { error: error.message });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    const statusCode = error.message.includes('Unauthorized') ? 403 :
                       error.message.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { success: false, error: error.message },
      { status: statusCode }
    );
  }
}
