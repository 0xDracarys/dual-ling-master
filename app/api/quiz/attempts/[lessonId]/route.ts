import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { QuizService } from '@/lib/services/quiz/quiz.service';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const spanId = traceLogger.startSpan('API', 'GET /api/quiz/attempts/[lessonId]');

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

    // 2. Get lesson ID from params
    const { lessonId } = await params;

    if (!lessonId) {
      traceLogger.log('warn', 'API', 'Missing lesson ID');
      traceLogger.endSpan(spanId, 'error', { message: 'Missing lesson ID' });
      return NextResponse.json(
        { success: false, error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // 3. Get attempts
    const quizService = new QuizService();
    const attempts = await quizService.getAttempts(userId, lessonId);
    const bestScore = await quizService.getBestScore(userId, lessonId);

    traceLogger.log('success', 'API', 'Quiz attempts retrieved', {
      userId,
      lessonId,
      count: attempts.length,
      bestScore,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      data: {
        attempts,
        bestScore,
        totalAttempts: attempts.length,
      },
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Get quiz attempts failed', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get quiz attempts',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
