/**
 * Teacher Courses API Routes
 * POST - Create new course with lessons
 * GET - Get all courses for the authenticated teacher
 *
 * Phase 3: Firebase Migration - Teacher Course Management
 */

import { type NextRequest, NextResponse } from 'next/server';
import { CourseService } from '@/lib/services/course/course.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';
import { z } from 'zod';

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin
export const dynamic = 'force-dynamic';

const courseService = new CourseService();

// Zod schema for course creation
const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  shortDescription: z.string().optional(),
  language: z.enum(['en', 'lt'], {
    errorMap: () => ({ message: 'Language must be either "en" (English) or "lt" (Lithuanian)' })
  }),
  targetLanguage: z.enum(['en', 'lt'], {
    errorMap: () => ({ message: 'Target language must be either "en" (English) or "lt" (Lithuanian)' })
  }),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDuration: z.number().positive().default(10),
  thumbnail: z.string().optional().transform(val => val === '' ? undefined : val).pipe(z.string().url().optional()),
  lessons: z.array(z.any()).default([]), // We'll handle lessons separately
})
  .refine((data) => data.language !== data.targetLanguage, {
    message: 'Course language and target language cannot be the same',
    path: ['targetLanguage'],
  });

/**
 * POST /api/teacher/courses
 * Create a new course (teacher only)
 */
export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/teacher/courses');

  try {
    traceLogger.log('info', 'API', 'Teacher course creation request received');

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
    const teacherName = decodedToken.name || decodedToken.email || 'Teacher';
    const userRole = decodedToken.role;

    // Verify user is a teacher
    if (userRole !== 'teacher') {
      traceLogger.log('warn', 'API', 'Non-teacher attempted to create course', {
        userId: teacherId,
        role: userRole,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        {
          success: false,
          error: 'Only teachers can create courses',
        },
        { status: 403 }
      );
    }

    traceLogger.log('info', 'API', 'Teacher authenticated', {
      teacherId,
      teacherName,
    });

    const body = await request.json();
    traceLogger.log('debug', 'API', 'Request body parsed', {
      hasTitle: !!body.title,
      hasDescription: !!body.description,
      category: body.category,
      lessonsCount: body.lessons?.length || 0,
    });

    // Validate input
    const validatedData = createCourseSchema.parse(body);

    // Map frontend schema to Firebase schema
    const courseData: any = {
      title: validatedData.title,
      description: validatedData.description,
      language: validatedData.language, // The language the course is taught IN
      targetLanguage: validatedData.targetLanguage, // The language students will LEARN
      level: validatedData.difficulty,
      estimatedHours: validatedData.estimatedDuration,
      teacherId,
      teacherName,
    };

    // Only include thumbnailUrl if it's defined (Firestore doesn't accept undefined)
    if (validatedData.thumbnail) {
      courseData.thumbnailUrl = validatedData.thumbnail;
    }

    traceLogger.log('debug', 'API', 'Course data prepared', {
      language: courseData.language,
      targetLanguage: courseData.targetLanguage,
      title: courseData.title,
    });

    // Create course
    const course = await courseService.createCourse(courseData);

    // Add lessons if provided
    const lessons = validatedData.lessons || [];
    let lessonsAddedCount = 0;

    for (let i = 0; i < lessons.length; i++) {
      const lesson = lessons[i];
      try {
        // Determine lesson type and prepare content
        const lessonType = lesson.type === 'text' ? 'reading' : lesson.type === 'video' ? 'video' : 'quiz';

        // Build lesson data with only defined fields
        const lessonData: any = {
          title: lesson.title || `Lesson ${i + 1}`,
          description: lesson.content?.text || lesson.content?.videoUrl || `Lesson ${i + 1} content`,
          order: lesson.order !== undefined ? lesson.order : i + 1,
          type: lessonType,
          duration: 30, // Default duration
        };

        // Only add optional fields if they exist
        if (lesson.content?.text) {
          lessonData.contentMarkdown = lesson.content.text;
        }
        if (lesson.content?.videoUrl) {
          lessonData.videoUrl = lesson.content.videoUrl;
        }
        if (lesson.content?.questions && lesson.content.questions.length > 0) {
          lessonData.quizQuestions = lesson.content.questions;
        }

        await courseService.addLesson(course.id, teacherId, lessonData);
        lessonsAddedCount++;

        traceLogger.log('success', 'API', 'Lesson added successfully', {
          lessonIndex: i,
          lessonTitle: lesson.title,
          lessonType,
        });
      } catch (lessonError: any) {
        traceLogger.log('warn', 'API', 'Failed to add lesson', {
          lessonIndex: i,
          error: lessonError.message,
        });
      }
    }

    traceLogger.log('success', 'API', 'Course created successfully', {
      courseId: course.id,
      title: course.title,
      lessonsRequested: lessons.length,
      lessonsAdded: lessonsAddedCount,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        data: {
          courseId: course.id,
          course,
          lessonsAdded: lessonsAddedCount,
        },
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

    traceLogger.log('error', 'API', 'Course creation failed', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create course',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/teacher/courses
 * Get all courses for the authenticated teacher
 */
export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/teacher/courses');

  try {
    traceLogger.log('info', 'API', 'Teacher courses request received');

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
      traceLogger.log('warn', 'API', 'Non-teacher attempted to access teacher courses', {
        userId: teacherId,
        role: userRole,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        {
          success: false,
          error: 'Only teachers can access this endpoint',
        },
        { status: 403 }
      );
    }

    const courses = await courseService.getTeacherCourses(teacherId);

    traceLogger.log('success', 'API', 'Teacher courses retrieved', {
      count: courses.length,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        data: {
          courses,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get teacher courses', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get courses',
      },
      { status: 500 }
    );
  }
}
