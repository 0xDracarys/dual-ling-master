export const dynamic = 'force-dynamic';
/**
 * Individual Course API Routes
 * GET - Get single course by ID
 * PUT - Update course
 * DELETE - Delete course
 *
 * Phase 3 Week 1.5: Firebase Migration
 */

import { type NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/course/course.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';
import { z } from 'zod';

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin

const courseService = new CourseService();

// Zod schema for course updates
const updateCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  language: z.enum(['en', 'lt']).optional(),
  targetLanguage: z.enum(['en', 'lt']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedHours: z.number().positive().optional(),
  thumbnailUrl: z.string().url().optional(),
});

/**
 * GET /api/courses/[id]
 * Get single course by ID (with optional lessons)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'GET /api/courses/[id]', { courseId });

  try {
    traceLogger.log('info', 'API', 'Fetching course details', { courseId });

    // Check if client wants lessons included
    const { searchParams } = new URL(request.url);
    const includeLessons = searchParams.get('includeLessons') === 'true';

    const course = await courseService.getCourseById(courseId, includeLessons);

    traceLogger.log('success', 'API', 'Course retrieved successfully', {
      courseId,
      title: course.title,
      hasLessons: !!course.lessons,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        course,
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get course', {
      error: error.message,
      courseId,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: statusCode }
    );
  }
}

/**
 * PUT /api/courses/[id]
 * Update course (teacher only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'PUT /api/courses/[id]', { courseId });

  try {
    traceLogger.log('info', 'API', 'Course update request received', { courseId });

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
      traceLogger.log('warn', 'API', 'Non-teacher attempted to update course', {
        userId: teacherId,
        role: userRole,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        { success: false, error: 'Only teachers can update courses' },
        { status: 403 }
      );
    }

    const body = await request.json();
    traceLogger.log('debug', 'API', 'Request body parsed', {
      hasTitle: !!body.title,
      hasDescription: !!body.description,
    });

    // Validate input
    const validatedData = updateCourseSchema.parse(body);

    const updatedCourse = await courseService.updateCourse(
      courseId,
      teacherId,
      validatedData
    );

    traceLogger.log('success', 'API', 'Course updated successfully', {
      courseId,
      title: updatedCourse.title,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Course updated successfully',
        course: updatedCourse,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      traceLogger.log('warn', 'API', 'Validation error', { errors: error.errors });
      traceLogger.endSpan(spanId, 'error', { message: 'Validation failed' });
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    traceLogger.log('error', 'API', 'Course update failed', {
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

/**
 * DELETE /api/courses/[id]
 * Delete course (teacher only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'DELETE /api/courses/[id]', { courseId });

  try {
    traceLogger.log('info', 'API', 'Course deletion request received', { courseId });

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
      traceLogger.log('warn', 'API', 'Non-teacher attempted to delete course', {
        userId: teacherId,
        role: userRole,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        { success: false, error: 'Only teachers can delete courses' },
        { status: 403 }
      );
    }

    await courseService.deleteCourse(courseId, teacherId);

    traceLogger.log('success', 'API', 'Course deleted successfully', { courseId });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Course deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Course deletion failed', {
      error: error.message,
      courseId,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    const statusCode = error.message.includes('Unauthorized')
      ? 403
      : error.message.includes('not found')
      ? 404
      : error.message.includes('enrollments')
      ? 400
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
