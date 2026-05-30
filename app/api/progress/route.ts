/**
 * Course Progress API Routes
 * GET - Get user progress for courses/lessons
 */

import { type NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { ProgressRepository } from '@/lib/services/progress/progress.repository';
import { traceLogger } from '@/lib/tracing/trace-logger';

const progressRepo = new ProgressRepository();

/**
 * GET /api/progress?courseId=xxx
 * Fetch all lesson progress for a user in a specific course
 */
export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/progress');

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid Authorization header');
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Get courseId from query params
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'courseId query parameter is required' },
        { status: 400 }
      );
    }

    traceLogger.log('info', 'API', 'Fetching progress', { userId, courseId });

    // Fetch all progress for this user's course
    const progressList = await progressRepo.getByCourse(userId, courseId);

    // Create a map of lessonId -> progress for easy lookup
    const progressMap = progressList.reduce((acc: any, progress: any) => {
      acc[progress.lessonId] = {
        status: progress.status,
        videoProgress: progress.videoProgress,
        videoCompleted: progress.videoCompleted,
        completedAt: progress.completedAt,
        lastViewedAt: progress.lastViewedAt,
      };
      return acc;
    }, {});

    traceLogger.log('success', 'API', 'Progress fetched', {
      userId,
      courseId,
      progressCount: progressList.length,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      progress: progressMap,
      totalCompleted: progressList.filter((p: any) => p.status === 'completed').length,
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to fetch progress', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
