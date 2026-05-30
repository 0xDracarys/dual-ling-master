export const dynamic = 'force-dynamic';
/**
 * Course Lessons API Routes
 * GET - Get all lessons for a course
 * POST - Add a lesson to a course
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

const createLessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  order: z.number().int().positive().optional(),
  type: z.enum(['video', 'reading', 'quiz', 'exercise']),
  videoUrl: z.string().url().optional(),
  videoThumbnail: z.string().url().optional(),
  duration: z.number().positive().optional(),
  contentMarkdown: z.string().optional(),
  content: z.object({
    text: z.string().optional(),
    videoUrl: z.string().optional(),
    questions: z.array(z.any()).optional(),
    quizQuestions: z.array(z.any()).optional(), // Support both legacy and new format
    passingScore: z.number().min(0).max(100).optional(),
  }).optional(),
  quizQuestions: z.array(z.any()).optional(), // Legacy root-level format
  passingScore: z.number().min(0).max(100).optional(),
});

/**
 * GET /api/courses/[id]/lessons
 * Get all lessons for a course
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'GET /api/courses/[id]/lessons', { courseId });

  try {
    traceLogger.log('info', 'API', 'Fetching course lessons', { courseId });

    // Check if only published lessons should be returned
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('publishedOnly') === 'true';

    const lessons = await courseService.getCourseLessons(courseId, publishedOnly);

    traceLogger.log('success', 'API', 'Lessons retrieved successfully', {
      courseId,
      count: lessons.length,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        lessons,
        count: lessons.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get lessons', {
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
 * POST /api/courses/[id]/lessons
 * Add a lesson to a course (teacher only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'POST /api/courses/[id]/lessons', { courseId });

  try {
    traceLogger.log('info', 'API', 'Add lesson request received', { courseId });

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
    const validatedData = createLessonSchema.parse(body);

    // Get existing lesson count to determine order
    const existingLessons = await courseService.getCourseLessons(courseId, false);
    const nextOrder = existingLessons.length + 1;

    // Prepare lesson data with defaults
    const lessonData = {
      ...validatedData,
      description: validatedData.description || `Lesson: ${validatedData.title}`,
      order: validatedData.order || nextOrder,
    };

    const lesson = await courseService.addLesson(courseId, teacherId, lessonData);

    traceLogger.log('success', 'API', 'Lesson added successfully', {
      lessonId: lesson.id,
      courseId,
      title: lesson.title,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Lesson added successfully',
        lesson,
      },
      { status: 201 }
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

    traceLogger.log('error', 'API', 'Add lesson failed', {
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
