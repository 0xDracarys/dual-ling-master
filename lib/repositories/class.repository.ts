/**
 * ClassRepository - Firestore CRUD operations for classes collection
 * 
 * Handles database operations for scheduled classes, including filtering,
 * pagination, and querying by teacher/course/time range.
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { traceLogger } from '@/lib/tracing/trace-logger';

/**
 * Class Entity Type
 */
export interface Class {
  id: string;
  teacherId: string;
  courseId?: string;
  lessonId?: string;
  
  // Class details
  title: string;
  description?: string;
  type: 'one-time' | 'recurring';
  
  // Timing
  startTime: Timestamp;
  endTime: Timestamp;
  duration: number; // minutes
  timezone: string;
  
  // Google Integration
  googleCalendarEventId: string;
  googleMeetLink: string;
  
  // Participants
  participants: {
    studentIds: string[]; // Firestore UIDs
    externalEmails: string[]; // Non-platform users
  };
  
  // Recurrence (only for recurring classes)
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
    endDate?: Timestamp;
    parentEventId?: string; // Links to parent recurring event
  };
  
  // Recording
  recording: {
    enabled: boolean;
    url?: string;
    driveFileId?: string;
    status: 'pending' | 'available' | 'expired' | 'archived';
    expiresAt?: Timestamp;
    archived: boolean;
    archivedAt?: Timestamp;
  };
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export type CreateClassData = Omit<Class, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateClassData = Partial<Omit<Class, 'id' | 'teacherId' | 'createdAt' | 'createdBy'>>;

/**
 * ClassRepository - Database operations for classes
 */
export class ClassRepository {
  private db: Firestore;
  private collection: string = 'classes';

  constructor() {
    this.db = getAdminDb();
  }

  /**
   * Create a new class
   */
  async create(data: CreateClassData): Promise<Class> {
    const spanId = traceLogger.startSpan('ClassRepository', 'create');

    try {
      const docRef = this.db.collection(this.collection).doc();
      
      const classData: Class = {
        ...data,
        id: docRef.id,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await docRef.set(classData);

      traceLogger.log('info', 'ClassRepository', 'Class created', {
        classId: classData.id,
        teacherId: classData.teacherId,
        courseId: classData.courseId,
        type: classData.type,
      });

      traceLogger.endSpan(spanId, 'success');
      return classData;
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to create class', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Find class by ID
   */
  async findById(classId: string): Promise<Class | null> {
    const spanId = traceLogger.startSpan('ClassRepository', 'findById');

    try {
      const doc = await this.db.collection(this.collection).doc(classId).get();

      if (!doc.exists) {
        traceLogger.log('warn', 'ClassRepository', 'Class not found', { classId });
        traceLogger.endSpan(spanId, 'success');
        return null;
      }

      traceLogger.endSpan(spanId, 'success');
      return { id: doc.id, ...doc.data() } as Class;
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to find class', {
        classId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Find all classes for a teacher
   */
  async findByTeacher(teacherId: string, options?: {
    status?: 'scheduled' | 'completed' | 'cancelled';
    upcoming?: boolean;
    limit?: number;
  }): Promise<Class[]> {
    const spanId = traceLogger.startSpan('ClassRepository', 'findByTeacher');

    try {
      let query = this.db.collection(this.collection).where('teacherId', '==', teacherId);

      if (options?.status) {
        query = query.where('status', '==', options.status);
      }

      if (options?.upcoming !== undefined) {
        const now = Timestamp.now();
        query = options.upcoming
          ? query.where('startTime', '>=', now)
          : query.where('startTime', '<', now);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.orderBy('startTime', 'desc').get();
      const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));

      traceLogger.log('info', 'ClassRepository', 'Classes fetched for teacher', {
        teacherId,
        count: classes.length,
        options,
      });

      traceLogger.endSpan(spanId, 'success');
      return classes;
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to fetch teacher classes', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Find all classes for a specific course
   */
  async findByCourse(courseId: string, options?: {
    upcoming?: boolean;
    limit?: number;
  }): Promise<Class[]> {
    const spanId = traceLogger.startSpan('ClassRepository', 'findByCourse');

    try {
      let query = this.db.collection(this.collection).where('courseId', '==', courseId);

      if (options?.upcoming !== undefined) {
        const now = Timestamp.now();
        query = options.upcoming
          ? query.where('startTime', '>=', now)
          : query.where('startTime', '<', now);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.orderBy('startTime', 'desc').get();
      const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));

      traceLogger.log('info', 'ClassRepository', 'Classes fetched for course', {
        courseId,
        count: classes.length,
        options,
      });

      traceLogger.endSpan(spanId, 'success');
      return classes;
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to fetch course classes', {
        courseId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Update a class
   */
  async update(classId: string, data: UpdateClassData): Promise<void> {
    const spanId = traceLogger.startSpan('ClassRepository', 'update');

    try {
      const updateData = {
        ...data,
        updatedAt: Timestamp.now(),
      };

      await this.db.collection(this.collection).doc(classId).update(updateData);

      traceLogger.log('info', 'ClassRepository', 'Class updated', {
        classId,
        fields: Object.keys(data),
      });

      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to update class', {
        classId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Delete a class
   */
  async delete(classId: string): Promise<void> {
    const spanId = traceLogger.startSpan('ClassRepository', 'delete');

    try {
      await this.db.collection(this.collection).doc(classId).delete();

      traceLogger.log('info', 'ClassRepository', 'Class deleted', { classId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to delete class', {
        classId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Find upcoming classes (next 30 days)
   * Includes instant meetings that started recently (within last 10 minutes)
   */
  async findUpcoming(teacherId: string, days: number = 30): Promise<Class[]> {
    const spanId = traceLogger.startSpan('ClassRepository', 'findUpcoming');

    try {
      const now = Timestamp.now();
      const futureDate = Timestamp.fromMillis(now.toMillis() + days * 24 * 60 * 60 * 1000);
      
      // Allow 10-minute lookback for instant meetings that just started
      const lookbackMinutes = 10;
      const startTime = Timestamp.fromMillis(now.toMillis() - lookbackMinutes * 60 * 1000);

      // Query 1: Scheduled classes (future)
      const scheduledSnapshot = await this.db
        .collection(this.collection)
        .where('teacherId', '==', teacherId)
        .where('startTime', '>=', startTime)
        .where('startTime', '<=', futureDate)
        .where('status', '==', 'scheduled')
        .orderBy('startTime', 'asc')
        .get();

      // Query 2: In-progress instant meetings (just started)
      const inProgressSnapshot = await this.db
        .collection(this.collection)
        .where('teacherId', '==', teacherId)
        .where('status', '==', 'in-progress')
        .get();

      // Combine results
      const scheduledClasses = scheduledSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
      const inProgressClasses = inProgressSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));

      // Combine scheduled classes and ALL in-progress meetings
      // In-progress meetings should always be visible regardless of start time
      const allClasses = [...scheduledClasses];
      
      for (const inProgressClass of inProgressClasses) {
        // Include ALL in-progress classes (no time restriction)
        if (!allClasses.some(c => c.id === inProgressClass.id)) {
          allClasses.push(inProgressClass);
        }
      }

      // Sort by startTime
      const classes = allClasses.sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis());

      traceLogger.log('info', 'ClassRepository', 'Upcoming classes fetched', {
        teacherId,
        days,
        scheduledCount: scheduledClasses.length,
        inProgressCount: inProgressClasses.length,
        totalCount: classes.length,
      });

      traceLogger.endSpan(spanId, 'success');
      return classes;
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to fetch upcoming classes', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Find past classes (last 30 days)
   */
  async findPast(teacherId: string, days: number = 30): Promise<Class[]> {
    const spanId = traceLogger.startSpan('ClassRepository', 'findPast');

    try {
      const now = Timestamp.now();
      const pastDate = Timestamp.fromMillis(now.toMillis() - days * 24 * 60 * 60 * 1000);

      const snapshot = await this.db
        .collection(this.collection)
        .where('teacherId', '==', teacherId)
        .where('startTime', '>=', pastDate)
        .where('startTime', '<', now)
        .orderBy('startTime', 'desc')
        .get();

      const classes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));

      traceLogger.log('info', 'ClassRepository', 'Past classes fetched', {
        teacherId,
        days,
        count: classes.length,
      });

      traceLogger.endSpan(spanId, 'success');
      return classes;
    } catch (error) {
      traceLogger.log('error', 'ClassRepository', 'Failed to fetch past classes', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }
}

// Singleton instance
export const classRepository = new ClassRepository();
