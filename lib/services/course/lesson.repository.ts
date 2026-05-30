/**
 * Lesson Repository
 * Handles Firestore CRUD operations for lessons (subcollection of courses)
 * Phase 3: Course & Enrollment Services
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import type { Lesson, CreateLessonData, UpdateLessonData } from '@/lib/types/course.types';
import { Timestamp } from 'firebase-admin/firestore';

export class LessonRepository {
  /**
   * Get lessons collection for a course
   */
  private getLessonsCollection(courseId: string) {
    return getAdminDb().collection('courses').doc(courseId).collection('lessons');
  }

  /**
   * Create a new lesson
   */
  async create(courseId: string, data: CreateLessonData): Promise<Lesson> {
    const spanId = traceLogger.startSpan('Firestore', 'lessons.create', {
      courseId,
      title: data.title,
      type: data.type,
    });

    try {
      traceLogger.log('info', 'Firestore', `Creating lesson in course: ${courseId}`);

      // Filter out undefined values (Firestore doesn't accept them)
      const cleanData: any = {};
      Object.keys(data).forEach((key) => {
        const value = (data as any)[key];
        if (value !== undefined) {
          cleanData[key] = value;
        }
      });

      const lessonData = {
        ...cleanData,
        courseId,
        isPublished: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await this.getLessonsCollection(courseId).add(lessonData);
      const lesson = { id: docRef.id, ...lessonData };

      traceLogger.log('success', 'Firestore', 'Lesson created', {
        lessonId: docRef.id,
        courseId,
      });
      traceLogger.endSpan(spanId, 'success');

      return lesson as Lesson;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Lesson creation failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get lesson by ID
   */
  async getById(courseId: string, lessonId: string): Promise<Lesson> {
    const spanId = traceLogger.startSpan('Firestore', 'lessons.getById', {
      courseId,
      lessonId,
    });

    try {
      traceLogger.log('info', 'Firestore', `Fetching lesson: ${lessonId}`);

      const doc = await this.getLessonsCollection(courseId).doc(lessonId).get();

      if (!doc.exists) {
        throw new Error('Lesson not found');
      }

      const lesson = { id: doc.id, ...doc.data() } as Lesson;

      traceLogger.log('success', 'Firestore', 'Lesson retrieved', {
        lessonId,
        title: lesson.title,
      });
      traceLogger.endSpan(spanId, 'success');

      return lesson;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Lesson retrieval failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get all lessons for a course
   */
  async getByCourse(courseId: string, publishedOnly: boolean = false): Promise<Lesson[]> {
    const spanId = traceLogger.startSpan('Firestore', 'lessons.getByCourse', {
      courseId,
      publishedOnly,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Querying course lessons');

      let query: any = this.getLessonsCollection(courseId).orderBy('order', 'asc');

      if (publishedOnly) {
        query = query.where('isPublished', '==', true);
      }

      const snapshot = await query.get();
      const lessons = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lesson[];

      traceLogger.log('success', 'Firestore', 'Lessons retrieved', {
        count: lessons.length,
        courseId,
      });
      traceLogger.endSpan(spanId, 'success');

      return lessons;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Query failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update lesson
   */
  async update(
    courseId: string,
    lessonId: string,
    data: Partial<Lesson>
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'lessons.update', {
      courseId,
      lessonId,
    });

    try {
      traceLogger.log('info', 'Firestore', `Updating lesson: ${lessonId}`);

      await this.getLessonsCollection(courseId).doc(lessonId).update({
        ...data,
        updatedAt: Timestamp.now(),
      });

      traceLogger.log('success', 'Firestore', 'Lesson updated', { lessonId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Lesson update failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Delete lesson
   */
  async delete(courseId: string, lessonId: string): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'lessons.delete', {
      courseId,
      lessonId,
    });

    try {
      traceLogger.log('info', 'Firestore', `Deleting lesson: ${lessonId}`);

      await this.getLessonsCollection(courseId).doc(lessonId).delete();

      traceLogger.log('success', 'Firestore', 'Lesson deleted', { lessonId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Lesson deletion failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Reorder lessons
   */
  async reorder(courseId: string, lessonOrders: { id: string; order: number }[]): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'lessons.reorder', {
      courseId,
      count: lessonOrders.length,
    });

    try {
      traceLogger.log('info', 'Firestore', 'Reordering lessons');

      const batch = getAdminDb().batch();
      const collection = this.getLessonsCollection(courseId);

      lessonOrders.forEach(({ id, order }) => {
        const docRef = collection.doc(id);
        batch.update(docRef, { order, updatedAt: Timestamp.now() });
      });

      await batch.commit();

      traceLogger.log('success', 'Firestore', 'Lessons reordered', {
        count: lessonOrders.length,
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Lesson reorder failed', {
        error: error.message,
      });
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
