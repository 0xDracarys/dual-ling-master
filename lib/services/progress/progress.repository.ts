/**
 * Progress Repository
 * Handles Firestore CRUD operations for lesson progress tracking
 * Phase 4: Class System - Week 1
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import type { Progress } from '@/lib/types/course.types';
import { Timestamp } from 'firebase-admin/firestore';

export class ProgressRepository {
  // Lazy getter to avoid initialization at module import time
  private get collection() {
    return getAdminDb().collection('progress');
  }

  /**
   * Get or create progress document (idempotent operation)
   * Document ID format: {userId}_{lessonId}
   */
  async getOrCreate(
    userId: string,
    lessonId: string,
    courseId: string
  ): Promise<Progress> {
    const progressId = `${userId}_${lessonId}`;
    const spanId = traceLogger.startSpan('Firestore', 'progress.getOrCreate', {
      progressId,
      userId,
      lessonId,
      courseId,
    });

    try {
      traceLogger.log('info', 'Firestore', `Checking progress: ${progressId}`);

      const docRef = this.collection.doc(progressId);
      const doc = await docRef.get();

      if (doc.exists) {
        const progress = doc.data() as Progress;
        traceLogger.log('success', 'Firestore', 'Progress found', { progressId });
        traceLogger.endSpan(spanId, 'success');
        return progress;
      }

      // Create new progress document
      traceLogger.log('info', 'Firestore', 'Creating new progress document');

      const newProgress: Progress = {
        id: progressId,
        userId,
        lessonId,
        courseId,
        status: 'not_started',
        timeSpent: 0,
        viewCount: 0,
        lastViewedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await docRef.set(newProgress);

      traceLogger.log('success', 'Firestore', 'Progress created', { progressId });
      traceLogger.endSpan(spanId, 'success');

      return newProgress;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'getOrCreate failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get progress by ID
   */
  async getById(id: string): Promise<Progress | null> {
    const spanId = traceLogger.startSpan('Firestore', 'progress.getById', { id });

    try {
      traceLogger.log('info', 'Firestore', `Fetching progress: ${id}`);

      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        traceLogger.log('info', 'Firestore', 'Progress not found');
        traceLogger.endSpan(spanId, 'success');
        return null;
      }

      const progress = doc.data() as Progress;

      traceLogger.log('success', 'Firestore', 'Progress retrieved', { id });
      traceLogger.endSpan(spanId, 'success');

      return progress;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Progress retrieval failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get count of completed lessons for a user in a course
   */
  async getCompletedCount(userId: string, courseId: string): Promise<number> {
    const spanId = traceLogger.startSpan('Firestore', 'progress.getCompletedCount', {
      userId,
      courseId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Counting completed lessons');

      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .where('status', '==', 'completed')
        .get();

      const count = snapshot.size;

      traceLogger.log('success', 'Firestore', 'Completed count retrieved', {
        count,
      });
      traceLogger.endSpan(spanId, 'success');

      return count;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'getCompletedCount failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all progress records for a user in a course
   */
  async getByCourse(userId: string, courseId: string): Promise<Progress[]> {
    const spanId = traceLogger.startSpan('Firestore', 'progress.getByCourse', {
      userId,
      courseId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Querying course progress');

      const snapshot = await this.collection
        .where('userId', '==', userId)
        .where('courseId', '==', courseId)
        .get();

      const progressRecords = snapshot.docs.map((doc) => doc.data() as Progress);

      traceLogger.log('success', 'Firestore', 'Course progress retrieved', {
        count: progressRecords.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return progressRecords;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Query failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update progress
   */
  async update(id: string, data: Partial<Progress>): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'progress.update', { id });

    try {
      traceLogger.log('info', 'Firestore', `Updating progress: ${id}`);

      // Filter out undefined values (Firestore doesn't accept them)
      const cleanData: any = {};
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });

      // Always update the updatedAt timestamp
      cleanData.updatedAt = Timestamp.now();

      await this.collection.doc(id).update(cleanData);

      traceLogger.log('success', 'Firestore', 'Progress updated', { id });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Progress update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Delete progress
   */
  async delete(id: string): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'progress.delete', { id });

    try {
      traceLogger.log('info', 'Firestore', `Deleting progress: ${id}`);

      await this.collection.doc(id).delete();

      traceLogger.log('success', 'Firestore', 'Progress deleted', { id });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Progress deletion failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
