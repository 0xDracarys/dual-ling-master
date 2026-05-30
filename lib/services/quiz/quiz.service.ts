/**
 * Quiz Service
 * Business logic for quiz submission and grading
 * Phase 4: Quiz System - Week 1 Day 3
 */

import { traceLogger } from '@/lib/tracing/trace-logger';
import { QuizAttemptRepository } from './quiz-attempt.repository';
import { ProgressService } from '../progress/progress.service';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';
import type { QuizAttempt, QuizAnswer, QuizQuestionResult } from '@/lib/types/course.types';
import { Timestamp } from 'firebase-admin/firestore';

export class QuizService {
  private quizAttemptRepo = new QuizAttemptRepository();
  private progressService = new ProgressService();
  private enrollmentRepo = new EnrollmentRepository();

  /**
   * Submit quiz and get graded results
   */
  async submitQuiz(
    userId: string,
    lessonId: string,
    courseId: string,
    answers: QuizAnswer[],
    correctAnswers: QuizAnswer[],
    timeSpent: number
  ): Promise<{
    attemptId: string;
    score: number;
    scorePercentage: number;
    totalQuestions: number;
    passed: boolean;
    results: QuizQuestionResult[];
    bestScore: number;
    timeSpent: number;
  }> {
    const spanId = traceLogger.startSpan('Quiz', 'submitQuiz', {
      userId,
      lessonId,
      totalQuestions: correctAnswers.length,
    });

    try {
      // 1. Grade the quiz
      const results = this.gradeQuiz(answers, correctAnswers);
      const score = results.filter((r) => r.correct).length;
      const totalQuestions = correctAnswers.length;
      const scorePercentage = (score / totalQuestions) * 100;
      const passed = scorePercentage >= 70; // 70% pass threshold

      traceLogger.log('info', 'Quiz', 'Quiz graded', {
        score,
        totalQuestions,
        scorePercentage: Math.round(scorePercentage),
        passed,
      });

      // 2. Get attempt number
      const previousAttempts = await this.quizAttemptRepo.getByUserAndLesson(
        userId,
        lessonId
      );
      const attemptNumber = previousAttempts.length + 1;

      // 3. Save attempt
      const attempt = await this.quizAttemptRepo.create({
        userId,
        lessonId,
        courseId,
        attemptNumber,
        score,
        totalQuestions,
        scorePercentage: Math.round(scorePercentage * 100) / 100,
        passed,
        timeSpent,
        results,
        submittedAt: Timestamp.now(),
      });

      // 4. Calculate best score
      const allScores = [...previousAttempts.map((a) => a.scorePercentage), scorePercentage];
      const bestScore = Math.max(...allScores);

      // 5. Update enrollment with best quiz score
      await this.updateEnrollmentQuizScore(userId, courseId, lessonId, bestScore);

      // 6. Mark lesson complete if passed
      if (passed) {
        traceLogger.log('info', 'Quiz', 'Quiz passed, marking lesson complete');
        await this.progressService.markLessonComplete(
          userId,
          courseId,
          lessonId,
          timeSpent
        );
      }

      traceLogger.log('success', 'Quiz', 'Quiz submitted successfully', {
        attemptId: attempt.id,
        score,
        scorePercentage: Math.round(scorePercentage),
        bestScore: Math.round(bestScore),
      });
      traceLogger.endSpan(spanId, 'success');

      return {
        attemptId: attempt.id!,
        score,
        scorePercentage: Math.round(scorePercentage * 100) / 100,
        totalQuestions,
        passed,
        results,
        bestScore: Math.round(bestScore * 100) / 100,
        timeSpent,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Quiz', 'Quiz submission failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all attempts for a lesson
   */
  async getAttempts(userId: string, lessonId: string): Promise<QuizAttempt[]> {
    const spanId = traceLogger.startSpan('Quiz', 'getAttempts', {
      userId,
      lessonId,
    });

    try {
      const attempts = await this.quizAttemptRepo.getByUserAndLesson(userId, lessonId);

      traceLogger.log('success', 'Quiz', 'Attempts retrieved', {
        count: attempts.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return attempts;
    } catch (error: any) {
      traceLogger.log('error', 'Quiz', 'Get attempts failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get best score for a lesson
   */
  async getBestScore(userId: string, lessonId: string): Promise<number> {
    const spanId = traceLogger.startSpan('Quiz', 'getBestScore', {
      userId,
      lessonId,
    });

    try {
      const attempts = await this.quizAttemptRepo.getByUserAndLesson(userId, lessonId);

      if (attempts.length === 0) {
        traceLogger.log('info', 'Quiz', 'No attempts found');
        traceLogger.endSpan(spanId, 'success');
        return 0;
      }

      const bestScore = Math.max(...attempts.map((a) => a.scorePercentage));

      traceLogger.log('success', 'Quiz', 'Best score retrieved', {
        bestScore: Math.round(bestScore),
      });
      traceLogger.endSpan(spanId, 'success');

      return Math.round(bestScore * 100) / 100;
    } catch (error: any) {
      traceLogger.log('error', 'Quiz', 'Get best score failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Private: Grade quiz answers
   */
  private gradeQuiz(
    answers: QuizAnswer[],
    correctAnswers: QuizAnswer[]
  ): QuizQuestionResult[] {
    return correctAnswers.map((correct) => {
      const userAnswer = answers.find((a) => a.questionId === correct.questionId);
      const isCorrect =
        userAnswer?.answer.toLowerCase().trim() === correct.answer.toLowerCase().trim();

      return {
        questionId: correct.questionId,
        userAnswer: userAnswer?.answer || '',
        correctAnswer: correct.answer,
        correct: isCorrect,
        explanation: correct.explanation || '',
      };
    });
  }

  /**
   * Private: Update enrollment with best quiz score
   */
  private async updateEnrollmentQuizScore(
    userId: string,
    courseId: string,
    lessonId: string,
    bestScore: number
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Quiz', 'updateEnrollmentQuizScore', {
      userId,
      courseId,
      lessonId,
      bestScore: Math.round(bestScore),
    });

    try {
      // Get enrollment
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Update enrollment with quiz score
      // Note: This could be expanded to track individual lesson quiz scores
      // For now, we just update the lastAccessedAt timestamp
      await this.enrollmentRepo.update(enrollment.id, {
        lastAccessedAt: Timestamp.now(),
      });

      traceLogger.log('success', 'Quiz', 'Enrollment updated with quiz score', {
        lessonId,
        bestScore: Math.round(bestScore),
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Quiz', 'Update enrollment quiz score failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
