/**
 * Progress Service
 * Business logic for lesson progress tracking
 * Phase 4: Class System - Week 1
 */

import { traceLogger } from '@/lib/tracing/trace-logger';
import { ProgressRepository } from './progress.repository';
import { EnrollmentRepository } from '../enrollment/enrollment.repository';
import type { Progress } from '@/lib/types/course.types';

export class ProgressService {
  private progressRepo = new ProgressRepository();
  private enrollmentRepo = new EnrollmentRepository();

  /**
   * Update video progress (called every 5-10 seconds from video player)
   */
  async updateVideoProgress(
    userId: string,
    lessonId: string,
    courseId: string,
    currentTime: number,
    duration: number
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Progress', 'updateVideoProgress', {
      userId,
      lessonId,
      currentTime,
      duration,
    });

    try {
      // Get or create progress document
      const progress = await this.progressRepo.getOrCreate(userId, lessonId, courseId);

      // Calculate completion (90% watched = completed)
      const watchedPercentage = (currentTime / duration) * 100;
      const isCompleted = watchedPercentage >= 90;

      traceLogger.log('info', 'Progress', 'Updating video progress', {
        watchedPercentage: Math.round(watchedPercentage),
        isCompleted,
      });

      // Update progress
      await this.progressRepo.update(progress.id, {
        videoProgress: currentTime,
        videoCompleted: isCompleted,
        status: isCompleted ? 'completed' : 'in_progress',
        lastViewedAt: new Date() as any,
      });

      // If just completed, update enrollment
      if (isCompleted && progress.status !== 'completed') {
        traceLogger.log('info', 'Progress', 'Lesson just completed, updating enrollment');
        await this.updateEnrollmentProgress(userId, courseId);
      }

      traceLogger.log('success', 'Progress', 'Video progress updated', {
        lessonId,
        watchedPercentage: Math.round(watchedPercentage),
        completed: isCompleted,
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Video progress update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update reading progress (called on scroll)
   */
  async updateReadingProgress(
    userId: string,
    lessonId: string,
    courseId: string,
    scrollPosition: number,
    timeSpent: number
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Progress', 'updateReadingProgress', {
      userId,
      lessonId,
      scrollPosition,
      timeSpent,
    });

    try {
      // Get or create progress document
      const progress = await this.progressRepo.getOrCreate(userId, lessonId, courseId);

      // Mark as completed if scrolled to bottom (scrollPosition is near max) 
      // AND spent minimum time (e.g., 30 seconds)
      const isCompleted = scrollPosition >= 90 && timeSpent >= 30;

      traceLogger.log('info', 'Progress', 'Updating reading progress', {
        scrollPosition,
        timeSpent,
        isCompleted,
      });

      // Update progress
      await this.progressRepo.update(progress.id, {
        status: isCompleted ? 'completed' : 'in_progress',
        timeSpent: (progress.timeSpent || 0) + timeSpent,
        lastViewedAt: new Date() as any,
      });

      // If just completed, update enrollment
      if (isCompleted && progress.status !== 'completed') {
        traceLogger.log('info', 'Progress', 'Lesson just completed, updating enrollment');
        await this.updateEnrollmentProgress(userId, courseId);
      }

      traceLogger.log('success', 'Progress', 'Reading progress updated');
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Reading progress update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Mark lesson complete (generic method)
   */
  async markLessonComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    timeSpent: number
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Progress', 'markLessonComplete', {
      userId,
      lessonId,
      timeSpent,
    });

    try {
      // Get enrollment
      traceLogger.log('info', 'Progress', 'Checking enrollment');
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (!enrollment) {
        throw new Error('Not enrolled in this course');
      }

      // Update progress
      traceLogger.log('info', 'Progress', 'Marking lesson as completed');
      const progress = await this.progressRepo.getOrCreate(userId, lessonId, courseId);

      await this.progressRepo.update(progress.id, {
        status: 'completed',
        completedAt: new Date() as any,
        timeSpent: (progress.timeSpent || 0) + timeSpent,
        lastViewedAt: new Date() as any,
      });

      // Update enrollment
      await this.updateEnrollmentProgress(userId, courseId);

      traceLogger.log('success', 'Progress', 'Lesson marked complete', { lessonId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Mark complete failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get progress for a specific lesson
   */
  async getProgress(userId: string, lessonId: string): Promise<Progress | null> {
    const spanId = traceLogger.startSpan('Progress', 'getProgress', {
      userId,
      lessonId,
    });

    try {
      const progressId = `${userId}_${lessonId}`;
      const progress = await this.progressRepo.getById(progressId);

      traceLogger.log('success', 'Progress', 'Progress retrieved');
      traceLogger.endSpan(spanId, 'success');

      return progress;
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Get progress failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all progress for a course
   */
  async getCourseProgress(userId: string, courseId: string): Promise<Progress[]> {
    const spanId = traceLogger.startSpan('Progress', 'getCourseProgress', {
      userId,
      courseId,
    });

    try {
      const progressRecords = await this.progressRepo.getByCourse(userId, courseId);

      traceLogger.log('success', 'Progress', 'Course progress retrieved', {
        count: progressRecords.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return progressRecords;
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Get course progress failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Private helper: Update enrollment progress when lesson is completed
   */
  private async updateEnrollmentProgress(
    userId: string,
    courseId: string
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Progress', 'updateEnrollmentProgress', {
      userId,
      courseId,
    });

    try {
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (!enrollment) {
        throw new Error('Enrollment not found');
      }

      // Get count of completed lessons
      const completedCount = await this.progressRepo.getCompletedCount(userId, courseId);

      // Calculate percentage
      const progressPercentage =
        enrollment.totalLessonsCount > 0
          ? (completedCount / enrollment.totalLessonsCount) * 100
          : 0;

      traceLogger.log('info', 'Progress', 'Updating enrollment progress', {
        completedCount,
        totalLessons: enrollment.totalLessonsCount,
        progressPercentage: Math.round(progressPercentage),
      });

      // Update enrollment
      await this.enrollmentRepo.update(enrollment.id, {
        completedLessonsCount: completedCount,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        lastAccessedAt: new Date() as any,
      });

      // Check if course is complete
      if (completedCount === enrollment.totalLessonsCount) {
        await this.enrollmentRepo.update(enrollment.id, {
          status: 'completed',
          completedAt: new Date() as any,
        });
        traceLogger.log('success', 'Progress', 'Course completed!', {
          enrollmentId: enrollment.id,
          courseId,
        });
      }

      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Update enrollment progress failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
