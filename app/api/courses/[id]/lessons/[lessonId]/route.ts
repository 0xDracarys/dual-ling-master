export const dynamic = 'force-dynamic';
/**
 * Individual Lesson API Routes
 * GET - Get single lesson by ID
 * PUT - Update lesson
 * DELETE - Delete lesson
 *
 * Phase 3 Week 1.5: Firebase Migration
 */

import { type NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/course/course.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';
import { z } from 'zod';

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin
export const dynamic = 'force-dynamic';

const courseService = new CourseService();

const updateLessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  order: z.number().int().positive().optional(),
  type: z.enum(['video', 'reading', 'quiz', 'exercise']).optional(),
  videoUrl: z.string().url().optional(),
  videoThumbnail: z.string().url().optional(),
  duration: z.number().positive().optional(),
  contentMarkdown: z.string().optional(),
  content: z.object({
    text: z.string().optional(),
    videoUrl: z.string().optional(),
    questions: z.array(z.any()).optional(),
  }).optional(),
  quizQuestions: z.array(z.any()).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
});

/**
 * GET /api/courses/[id]/lessons/[lessonId]
 * Get single lesson by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const { id: courseId, lessonId } = await params;
  const spanId = traceLogger.startSpan('API', 'GET /api/courses/[id]/lessons/[lessonId]', {
    courseId,
    lessonId,
  });

  try {
    traceLogger.log('info', 'API', 'Fetching lesson details', { courseId, lessonId });

    // Get lesson through CourseService
    const course = await courseService.getCourseById(courseId, true);
    const lesson = course.lessons?.find((l) => l.id === lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    traceLogger.log('success', 'API', 'Lesson retrieved successfully', {
      lessonId,
      title: lesson.title,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        lesson,
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get lesson', {
      error: error.message,
      courseId,
      lessonId,
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
 * PUT /api/courses/[id]/lessons/[lessonId]
 * Update lesson (teacher only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const { id: courseId, lessonId } = await params;
  const spanId = traceLogger.startSpan('API', 'PUT /api/courses/[id]/lessons/[lessonId]', {
    courseId,
    lessonId,
  });

  try {
    traceLogger.log('info', 'API', 'Lesson update request received', { courseId, lessonId });

    // Verify Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Missing or invalid token');
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const teacherId = decodedToken.uid;

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      throw new Error('Unauthorized: Teacher access required');
    }

    const body = await request.json();
    traceLogger.log('debug', 'API', 'Request body parsed', {
      hasTitle: !!body.title,
      type: body.type,
    });

    // Validate input
    const validatedData = updateLessonSchema.parse(body);

    const updatedLesson = await courseService.updateLesson(
      courseId,
      lessonId,
      teacherId,
      validatedData
    );

    traceLogger.log('success', 'API', 'Lesson updated successfully', {
      lessonId,
      title: updatedLesson.title,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson updated successfully',
        lesson: updatedLesson,
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

    traceLogger.log('error', 'API', 'Lesson update failed', {
      error: error.message,
      courseId,
      lessonId,
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
 * DELETE /api/courses/[id]/lessons/[lessonId]
 * Delete lesson (teacher only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const { id: courseId, lessonId } = await params;
  const spanId = traceLogger.startSpan('API', 'DELETE /api/courses/[id]/lessons/[lessonId]', {
    courseId,
    lessonId,
  });

  try {
    traceLogger.log('info', 'API', 'Lesson deletion request received', { courseId, lessonId });

    // Verify Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Missing or invalid token');
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const teacherId = decodedToken.uid;

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      throw new Error('Unauthorized: Teacher access required');
    }

    await courseService.deleteLesson(courseId, lessonId, teacherId);

    traceLogger.log('success', 'API', 'Lesson deleted successfully', { courseId, lessonId });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson deleted successfully',
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Lesson deletion failed', {
      error: error.message,
      courseId,
      lessonId,
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
