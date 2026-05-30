/**
 * Enrollment Repository
 * Handles Firestore CRUD operations for enrollments
 * Phase 3: Course & Enrollment Services - Week 2
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import type { Enrollment, CreateEnrollmentData } from '@/lib/types/course.types';
import { Timestamp } from 'firebase-admin/firestore';

export class EnrollmentRepository {
  // Lazy getter to avoid initialization at module import time
  private get collection() {
    return getAdminDb().collection('enrollments');
  }

  /**
   * Create a new enrollment
   * Document ID format: {userId}_{courseId}
   */
  async create(data: CreateEnrollmentData): Promise<Enrollment> {
    const enrollmentId = `${data.userId}_${data.courseId}`;
    const spanId = traceLogger.startSpan('Firestore', 'enrollments.create', {
      enrollmentId,
      userId: data.userId,
      courseId: data.courseId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Creating enrollment document');

      const enrollmentData = {
        id: enrollmentId,
        userId: data.userId,
        courseId: data.courseId,
        userName: data.userName,
        userEmail: data.userEmail,
        courseTitle: data.courseTitle,
        teacherName: data.teacherName,
        status: 'active' as const,
        enrolledAt: Timestamp.now(),
        paymentStatus: 'free' as const, // All courses free for testing
        completedLessonsCount: 0,
        totalLessonsCount: data.totalLessonsCount,
        progressPercentage: 0,
        lastAccessedAt: Timestamp.now(),
        quizScores: {},
        averageQuizScore: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await this.collection.doc(enrollmentId).set(enrollmentData);

      traceLogger.log('success', 'Firestore', 'Enrollment document created', {
        enrollmentId,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollmentData as Enrollment;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Enrollment creation failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   */
  async getById(id: string): Promise<Enrollment> {
    const spanId = traceLogger.startSpan('Firestore', 'enrollments.getById', { id });

    try {
      traceLogger.log('info', 'Firestore', `Fetching enrollment: ${id}`);

      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        throw new Error('Enrollment not found');
      }

      const enrollment = doc.data() as Enrollment;

      traceLogger.log('success', 'Firestore', 'Enrollment retrieved', { id });
      traceLogger.endSpan(spanId, 'success');

      return enrollment;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Enrollment retrieval failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get enrollment by user and course (composite key lookup)
   */
  async getByUserAndCourse(userId: string, courseId: string): Promise<Enrollment | null> {
    const enrollmentId = `${userId}_${courseId}`;
    const spanId = traceLogger.startSpan('Firestore', 'enrollments.getByUserAndCourse', {
      userId,
      courseId,
      enrollmentId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Checking enrollment status');

      const doc = await this.collection.doc(enrollmentId).get();

      if (!doc.exists) {
        traceLogger.log('info', 'Firestore', 'No enrollment found');
        traceLogger.endSpan(spanId, 'success');
        return null;
      }

      const enrollment = doc.data() as Enrollment;

      traceLogger.log('success', 'Firestore', 'Enrollment found', {
        status: enrollment.status,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollment;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Enrollment check failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all enrollments for a user
   */
  async getByUser(userId: string): Promise<Enrollment[]> {
    const spanId = traceLogger.startSpan('Firestore', 'enrollments.getByUser', {
      userId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Querying user enrollments');

      const snapshot = await this.collection
        .where('userId', '==', userId)
        .orderBy('enrolledAt', 'desc')
        .get();

      const enrollments = snapshot.docs.map((doc) => doc.data() as Enrollment);

      traceLogger.log('success', 'Firestore', 'User enrollments retrieved', {
        count: enrollments.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollments;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Query failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all enrollments for a course
   * Only returns active enrollments (filters out completed, dropped, suspended)
   */
  async getByCourse(courseId: string): Promise<Enrollment[]> {
    const spanId = traceLogger.startSpan('Firestore', 'enrollments.getByCourse', {
      courseId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Querying course enrollments');

      const snapshot = await this.collection
        .where('courseId', '==', courseId)
        .where('status', '==', 'active')
        .get();

      // Sort in memory since we can't use orderBy with the status filter without a composite index
      const enrollments = snapshot.docs
        .map((doc) => doc.data() as Enrollment)
        .sort((a, b) => {
          const aTime = a.enrolledAt?.toMillis?.() || 0;
          const bTime = b.enrolledAt?.toMillis?.() || 0;
          return bTime - aTime; // Descending order (newest first)
        });

      traceLogger.log('success', 'Firestore', 'Course enrollments retrieved', {
        count: enrollments.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return enrollments;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Query failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update enrollment
   */
  async update(id: string, data: Partial<Enrollment>): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'enrollments.update', { id });

    try {
      traceLogger.log('info', 'Firestore', `Updating enrollment: ${id}`);

      // Filter out undefined values (Firestore doesn't accept them)
      const cleanData: any = {};
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });

      await this.collection.doc(id).update({
        ...cleanData,
        updatedAt: Timestamp.now(),
      });

      traceLogger.log('success', 'Firestore', 'Enrollment updated', { id });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Enrollment update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Delete enrollment
   */
  async delete(id: string): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'enrollments.delete', { id });

    try {
      traceLogger.log('info', 'Firestore', `Deleting enrollment: ${id}`);

      await this.collection.doc(id).delete();

      traceLogger.log('success', 'Firestore', 'Enrollment deleted', { id });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Enrollment deletion failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
