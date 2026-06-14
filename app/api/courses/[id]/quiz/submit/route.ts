export const dynamic = 'force-dynamic';
/**
 * Quiz Submission API Route
 * POST - Submit quiz answers and get results
 */

import { type NextRequest, NextResponse } from 'next/server';
import { QuizService } from '@/lib/services/quiz/quiz.service';
import { LessonRepository } from '@/lib/services/course/lesson.repository';
import { verifyIdToken } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

const quizService = new QuizService();
const lessonRepo = new LessonRepository();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const courseId = params.id;
  const spanId = traceLogger.startSpan('API', `POST /api/courses/${courseId}/quiz/submit`);

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid token' });
      return NextResponse.json({ success: false, error: 'Invalid authentication token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const body = await request.json();
    const { lessonId, answers, timeSpent } = body;

    if (!lessonId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    // Fetch the lesson to get the correct answers
    const lesson = await lessonRepo.getById(courseId, lessonId);

    if (lesson.type !== 'quiz' || !lesson.quizQuestions) {
      return NextResponse.json({ success: false, error: 'Lesson is not a quiz or has no questions' }, { status: 400 });
    }

    // Map correct answers from the lesson definition
    const correctAnswers = lesson.quizQuestions.map((q: any) => ({
      questionId: q.id,
      answer: q.correctAnswer,
      explanation: q.explanation,
    }));

    // Grade and save the quiz attempt
    const result = await quizService.submitQuiz(
      userId,
      lessonId,
      courseId,
      answers,
      correctAnswers,
      timeSpent || 0
    );

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit quiz' }, { status: 500 });
  }
}
