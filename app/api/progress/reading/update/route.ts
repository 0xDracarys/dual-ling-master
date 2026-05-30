export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { ProgressService } from '@/lib/services/progress/progress.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { z } from 'zod';

const updateReadingProgressSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  scrollPosition: z.number().min(0).max(100, 'Scroll position must be 0-100'),
  timeSpent: z.number().min(0, 'Time spent must be non-negative'),
});

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/progress/reading/update');

  try {
    // 1. Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid Authorization header');
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    traceLogger.log('info', 'API', 'User authenticated', { userId });

    // 2. Validate request body
    const body = await request.json();
    const validation = updateReadingProgressSchema.safeParse(body);

    if (!validation.success) {
      traceLogger.log('warn', 'API', 'Validation failed', {
        errors: validation.error.errors,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Validation error' });
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { lessonId, courseId, scrollPosition, timeSpent } = validation.data;

    // 3. Update reading progress
    const progressService = new ProgressService();
    await progressService.updateReadingProgress(
      userId,
      lessonId,
      courseId,
      scrollPosition,
      timeSpent
    );

    traceLogger.log('success', 'API', 'Reading progress updated', {
      userId,
      lessonId,
      scrollPosition,
      timeSpent,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: 'Reading progress updated',
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Reading progress update failed', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reading progress',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
