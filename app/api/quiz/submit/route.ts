import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { QuizService } from '@/lib/services/quiz/quiz.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { z } from 'zod';

const quizAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string().min(1, 'Answer is required'),
  explanation: z.string().optional(),
});

const submitQuizSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
  answers: z.array(quizAnswerSchema).min(1, 'At least one answer is required'),
  correctAnswers: z.array(quizAnswerSchema).min(1, 'Correct answers are required'),
  timeSpent: z.number().min(0, 'Time spent must be non-negative'),
});

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/quiz/submit');

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
    const validation = submitQuizSchema.safeParse(body);

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

    const { lessonId, courseId, answers, correctAnswers, timeSpent } = validation.data;

    // 3. Submit quiz
    const quizService = new QuizService();
    const result = await quizService.submitQuiz(
      userId,
      lessonId,
      courseId,
      answers,
      correctAnswers,
      timeSpent
    );

    traceLogger.log('success', 'API', 'Quiz submitted successfully', {
      userId,
      lessonId,
      score: result.score,
      passed: result.passed,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: result,
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Quiz submission failed', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit quiz',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
