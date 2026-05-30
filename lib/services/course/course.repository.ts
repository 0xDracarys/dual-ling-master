/**
 * Course Repository
 * Handles Firestore CRUD operations for courses
 * Phase 3: Course & Enrollment Services
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import type { Course, CreateCourseData, UpdateCourseData, CourseFilters } from '@/lib/types/course.types';
import { Timestamp } from 'firebase-admin/firestore';

export class CourseRepository {
  // Lazy getter to avoid initialization at module import time
  private get collection() {
    return getAdminDb().collection('courses');
  }

  /**
   * Create a new course
   */
  async create(data: CreateCourseData): Promise<Course> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.create', {
      title: data.title,
      teacherId: data.teacherId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Creating course document');

      // Filter out undefined values (Firestore doesn't accept them)
      const cleanData: any = {};
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });

      const courseData = {
        ...cleanData,
        isPublished: true, // Auto-publish courses for testing (can be toggled later)
        isPaid: false, // All courses free for testing
        lessonsCount: 0,
        enrollmentCount: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: data.teacherId,
      };

      const docRef = await this.collection.add(courseData);
      const course = { id: docRef.id, ...courseData };

      traceLogger.log('success', 'Firestore', 'Course document created', {
        courseId: docRef.id,
      });
      traceLogger.endSpan(spanId, 'success');

      return course as Course;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Course creation failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get course by ID
   */
  async getById(id: string): Promise<Course> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.getById', { id });

    try {
      traceLogger.log('info', 'Firestore', `Fetching course: ${id}`);

      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        throw new Error('Course not found');
      }

      const course = { id: doc.id, ...doc.data() } as Course;

      traceLogger.log('success', 'Firestore', 'Course retrieved', {
        id,
        title: course.title,
      });
      traceLogger.endSpan(spanId, 'success');

      return course;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Course retrieval failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all published courses with optional filters
   */
  async getPublished(filters?: CourseFilters): Promise<Course[]> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.getPublished', filters ? { filters } : undefined);

    try {
      traceLogger.log('info', 'Firestore', 'Querying published courses', { filters });

      let query: any = this.collection.where('isPublished', '==', true);

      if (filters?.language) {
        query = query.where('language', '==', filters.language);
      }
      if (filters?.targetLanguage) {
        query = query.where('targetLanguage', '==', filters.targetLanguage);
      }
      if (filters?.level) {
        query = query.where('level', '==', filters.level);
      }
      if (filters?.teacherId) {
        query = query.where('teacherId', '==', filters.teacherId);
      }
      if (filters?.isPaid !== undefined) {
        query = query.where('isPaid', '==', filters.isPaid);
      }

      const snapshot = await query.get();
      const courses = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];

      traceLogger.log('success', 'Firestore', 'Published courses retrieved', {
        count: courses.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return courses;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Query failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all courses by teacher (including drafts)
   */
  async getByTeacher(teacherId: string): Promise<Course[]> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.getByTeacher', {
      teacherId,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Querying teacher courses');

      const snapshot = await this.collection
        .where('teacherId', '==', teacherId)
        .get();

      const courses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];

      traceLogger.log('success', 'Firestore', 'Teacher courses retrieved', {
        count: courses.length,
      });
      traceLogger.endSpan(spanId, 'success');

      return courses;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Query failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update course
   */
  async update(id: string, data: Partial<Course>): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.update', { id });

    try {
      traceLogger.log('info', 'Firestore', `Updating course: ${id}`);

      await this.collection.doc(id).update({
        ...data,
        updatedAt: Timestamp.now(),
      });

      traceLogger.log('success', 'Firestore', 'Course updated', { id });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Course update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Delete course
   */
  async delete(id: string): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.delete', { id });

    try {
      traceLogger.log('info', 'Firestore', `Deleting course: ${id}`);

      // TODO: Also delete all lessons subcollection
      await this.collection.doc(id).delete();

      traceLogger.log('success', 'Firestore', 'Course deleted', { id });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Course deletion failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Increment enrollment count
   */
  async incrementEnrollmentCount(id: string): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.incrementEnrollmentCount', { id });

    try {
      const course = await this.getById(id);
      await this.update(id, {
        enrollmentCount: course.enrollmentCount + 1,
      });

      traceLogger.log('success', 'Firestore', 'Enrollment count incremented', {
        id,
        newCount: course.enrollmentCount + 1,
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to increment count', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Decrement enrollment count (when student is removed)
   */
  async decrementEnrollmentCount(id: string): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.decrementEnrollmentCount', { id });

    try {
      const course = await this.getById(id);
      const newCount = Math.max(0, course.enrollmentCount - 1); // Prevent negative counts
      await this.update(id, {
        enrollmentCount: newCount,
      });

      traceLogger.log('success', 'Firestore', 'Enrollment count decremented', {
        id,
        oldCount: course.enrollmentCount,
        newCount,
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to decrement count', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Increment lesson count
   */
  async incrementLessonCount(id: string): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.incrementLessonCount', { id });

    try {
      const course = await this.getById(id);
      await this.update(id, {
        lessonsCount: course.lessonsCount + 1,
      });

      traceLogger.log('success', 'Firestore', 'Lesson count incremented', {
        id,
        newCount: course.lessonsCount + 1,
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to increment count', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
