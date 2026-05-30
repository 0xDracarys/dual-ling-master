/**
 * Video Progress Update API
 * POST /api/progress/video/update - Update video watch position
 * Phase 4: Class System - Week 1, Day 1
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { ProgressService } from '@/lib/services/progress/progress.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { z } from 'zod';

const updateVideoProgressSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  currentTime: z.number().min(0, 'Current time must be non-negative'),
  duration: z.number().positive('Duration must be positive'),
});

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/progress/video/update');

  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid authorization header');
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Missing or invalid token',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    traceLogger.log('info', 'API', 'Video progress update request', { userId });

    // Validate request body
    const body = await request.json();
    const validatedData = updateVideoProgressSchema.parse(body);

    // Update progress
    const progressService = new ProgressService();
    await progressService.updateVideoProgress(
      userId,
      validatedData.lessonId,
      validatedData.courseId,
      validatedData.currentTime,
      validatedData.duration
    );

    traceLogger.log('success', 'API', 'Video progress updated', {
      lessonId: validatedData.lessonId,
      currentTime: validatedData.currentTime,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: 'Video progress updated',
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      traceLogger.log('warn', 'API', 'Validation error', {
        errors: error.errors,
      });
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

    traceLogger.log('error', 'API', 'Video progress update failed', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
