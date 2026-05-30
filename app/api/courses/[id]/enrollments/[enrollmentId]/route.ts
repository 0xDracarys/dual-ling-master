/**
 * Individual Enrollment API Routes
 * DELETE - Remove student from course (teacher only)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { EnrollmentRepository } from '@/lib/services/enrollment/enrollment.repository';
import { CourseRepository } from '@/lib/services/course/course.repository';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const enrollmentRepo = new EnrollmentRepository();
const courseRepo = new CourseRepository();

/**
 * DELETE /api/courses/[id]/enrollments/[enrollmentId]
 * Remove a student from a course (teacher only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  const { id: courseId, enrollmentId } = await params;
  const spanId = traceLogger.startSpan('API', 'DELETE /api/courses/[id]/enrollments/[enrollmentId]', {
    courseId,
    enrollmentId,
  });

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
      traceLogger.log('warn', 'API', 'Non-teacher attempted to remove student');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Only teachers can remove students' },
        { status: 403 }
      );
    }

    // Verify course ownership
    const course = await courseRepo.getById(courseId);
    if (course.teacherId !== teacherId) {
      traceLogger.log('warn', 'API', 'Teacher attempted to remove student from another teacher\'s course');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'You can only remove students from your own courses' },
        { status: 403 }
      );
    }

    // Verify enrollment belongs to this course
    const enrollment = await enrollmentRepo.getById(enrollmentId);
    if (enrollment.courseId !== courseId) {
      traceLogger.log('warn', 'API', 'Enrollment does not belong to this course');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Invalid enrollment for this course' },
        { status: 400 }
      );
    }

    traceLogger.log('info', 'API', 'Removing student from course', {
      courseId,
      enrollmentId,
      studentName: enrollment.userName,
    });

    // Delete enrollment
    await enrollmentRepo.delete(enrollmentId);

    // Decrement course enrollment count
    await courseRepo.decrementEnrollmentCount(courseId);

    traceLogger.log('success', 'API', 'Student removed from course', {
      enrollmentId,
      studentName: enrollment.userName,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: `${enrollment.userName} has been removed from the course`,
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to remove student', { error: error.message });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    const statusCode = error.message.includes('Unauthorized') || error.message.includes('only') ? 403 :
                       error.message.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { success: false, error: error.message },
      { status: statusCode }
    );
  }
}
