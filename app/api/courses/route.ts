export const dynamic = 'force-dynamic';
/**
 * Courses API Routes
 * GET  /api/courses - Get all published courses
 * POST /api/courses - Create a new course (teachers only)
 *
 * Phase 3: Course & Enrollment Services
 * Migrated from MongoDB to Firebase/Firestore
 */

import { NextRequest } from 'next/server';
import { CourseService } from '@/lib/services/course/course.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken, getAdminDb } from '@/lib/firebase/admin';
import { z } from 'zod';

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin

// Validation schema for course creation
const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  language: z.enum(['en', 'lt'], { errorMap: () => ({ message: 'Language must be "en" or "lt"' }) }),
  targetLanguage: z.enum(['en', 'lt'], { errorMap: () => ({ message: 'Target language must be "en" or "lt"' }) }),
  level: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Level must be beginner, intermediate, or advanced' })
  }),
  estimatedHours: z.number().positive('Estimated hours must be positive'),
  thumbnailUrl: z.string().url().optional(),
  // SECURITY (pentest F-03): teacherId/teacherName are taken from the
  // verified token, never from the request body. They stay in the schema as
  // optional so older clients do not break, but their values are ignored.
  teacherId: z.string().optional(),
  teacherName: z.string().optional(),
});

/**
 * GET /api/courses
 * Get all published courses with optional filters
 *
 * Query params:
 * - language: 'en' | 'lt'
 * - targetLanguage: 'en' | 'lt'
 * - level: 'beginner' | 'intermediate' | 'advanced'
 * - teacherId: string
 */
export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/courses');

  try {
    traceLogger.log('info', 'API', 'Get published courses request received');

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filters: any = {};

    if (searchParams.get('language')) {
      filters.language = searchParams.get('language');
    }
    if (searchParams.get('targetLanguage')) {
      filters.targetLanguage = searchParams.get('targetLanguage');
    }
    if (searchParams.get('level')) {
      filters.level = searchParams.get('level');
    }
    if (searchParams.get('teacherId')) {
      filters.teacherId = searchParams.get('teacherId');
    }

    traceLogger.log('debug', 'API', 'Query filters', { filters });

    const courseService = new CourseService();
    const courses = await courseService.getPublishedCourses(filters);

    traceLogger.log('success', 'API', 'Courses retrieved successfully', {
      count: courses.length,
    });
    traceLogger.endSpan(spanId, 'success');

    return Response.json({
      success: true,
      courses,
      count: courses.length,
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get courses', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to retrieve courses',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses
 * Create a new course (teachers only)
 *
 * Request body:
 * {
 *   title: string,
 *   description: string,
 *   language: 'en' | 'lt',
 *   targetLanguage: 'en' | 'lt',
 *   level: 'beginner' | 'intermediate' | 'advanced',
 *   estimatedHours: number,
 *   thumbnailUrl?: string,
 *   teacherId: string,
 *   teacherName: string
 * }
 */
export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/courses');

  try {
    traceLogger.log('info', 'API', 'Course creation request received');

    // SECURITY (pentest F-03): This route previously had NO authentication —
    // anyone could publish a course under any teacher's identity. Require a
    // verified teacher/admin token and take the teacher identity from it.
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return Response.json(
        { success: false, error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }
    const decodedToken = await verifyIdToken(authHeader.split('Bearer ')[1]);
    if (decodedToken.role !== 'teacher' && decodedToken.role !== 'admin') {
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return Response.json(
        { success: false, error: 'Forbidden: Teacher role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    traceLogger.log('debug', 'API', 'Request body parsed', {
      hasTitle: !!body.title,
      hasDescription: !!body.description,
    });

    // Validate input
    traceLogger.log('info', 'API', 'Validating course data');
    const validatedData = createCourseSchema.parse(body);
    traceLogger.log('success', 'API', 'Validation passed');

    // Teacher identity comes from the token, never the body
    const teacherDoc = await getAdminDb().collection('users').doc(decodedToken.uid).get();
    const teacherName =
      (teacherDoc.exists ? (teacherDoc.data() as { name?: string })?.name : undefined) ||
      decodedToken.name ||
      'Teacher';

    // Create course
    const courseService = new CourseService();
    const course = await courseService.createCourse({
      ...validatedData,
      teacherId: decodedToken.uid,
      teacherName,
    });

    traceLogger.log('success', 'API', 'Course created successfully', {
      courseId: course.id,
      title: course.title,
    });
    traceLogger.endSpan(spanId, 'success');

    return Response.json(
      {
        success: true,
        message: 'Course created successfully',
        course,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      traceLogger.log('warn', 'API', 'Validation error', {
        errors: error.errors,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Validation failed' });

      return Response.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    traceLogger.log('error', 'API', 'Course creation failed', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to create course',
      },
      { status: 500 }
    );
  }
}
