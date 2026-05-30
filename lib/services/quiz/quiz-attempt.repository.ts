/**
 * Quiz Attempt Repository
 * Firestore operations for quiz attempts
 * Phase 4: Quiz System - Week 1 Day 3
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import type { QuizAttempt } from '@/lib/types/course.types';

export class QuizAttemptRepository {
  // Lazy getter to avoid initialization at module import time
  private get collection() {
    return getAdminDb().collection('quiz_attempts');
  }

  /**
   * Create a new quiz attempt
   */
  async create(data: Omit<QuizAttempt, 'id'>): Promise<QuizAttempt> {
    const spanId = traceLogger.startSpan('Firestore', 'quiz_attempts.create', {
      userId: data.userId,
      lessonId: data.lessonId,
      attemptNumber: data.attemptNumber,
    });

    try {
      const sanitized = this.sanitizeData(data);
      const docRef = await this.collection.add(sanitized);
      const doc = await docRef.get();

      traceLogger.log('success', 'Firestore', 'Quiz attempt created', {
        id: docRef.id,
        score: data.score,
        attemptNumber: data.attemptNumber,
        passed: data.passed,
      });
      traceLogger.endSpan(spanId, 'success');

      return { id: docRef.id, ...doc.data() } as QuizAttempt;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Create quiz attempt failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all attempts for a user and lesson
   */
  async getByUserAndLesson(userId: string, lessonId: string): Promise<QuizAttempt[]> {
    const spanId = traceLogger.startSpan('Firestore', 'quiz_attempts.getByUserAndLesson', {
      userId,
      lessonId,
    });

    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('lessonId', '==', lessonId)
        .orderBy('submittedAt', 'desc')
        .get();

      const attempts = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuizAttempt[];

      traceLogger.log('success', 'Firestore', 'Quiz attempts retrieved', {
        count: attempts.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return attempts;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Get quiz attempts failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get a specific attempt by ID
   */
  async getById(id: string): Promise<QuizAttempt | null> {
    const spanId = traceLogger.startSpan('Firestore', 'quiz_attempts.getById', { id });

    try {
      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        traceLogger.log('info', 'Firestore', 'Quiz attempt not found', { id });
        traceLogger.endSpan(spanId, 'success');
        return null;
      }

      traceLogger.log('success', 'Firestore', 'Quiz attempt retrieved', { id });
      traceLogger.endSpan(spanId, 'success');

      return { id: doc.id, ...doc.data() } as QuizAttempt;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Get quiz attempt failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all attempts for a course (for analytics)
   */
  async getByCourse(userId: string, courseId: string): Promise<QuizAttempt[]> {
    const spanId = traceLogger.startSpan('Firestore', 'quiz_attempts.getByCourse', {
      userId,
      courseId,
    });

    try {
      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .orderBy('submittedAt', 'desc')
        .get();

      const attempts = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as QuizAttempt[];

      traceLogger.log('success', 'Firestore', 'Course quiz attempts retrieved', {
        count: attempts.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return attempts;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Get course quiz attempts failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Private: Sanitize data (remove undefined values)
   */
  private sanitizeData(data: any): any {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
}
