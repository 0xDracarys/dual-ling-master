/**
 * Class Service
 * 
 * Orchestrates class scheduling operations between ClassRepository,
 * GoogleCalendarService, and EnrollmentService.
 * 
 * Responsibilities:
 * - Validate teacher permissions
 * - Create/update/cancel classes
 * - Sync with Google Calendar
 * - Manage enrollments
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md
 */

import { ClassRepository, Class, CreateClassData } from '@/lib/repositories/class.repository';
import { googleCalendarService } from './google/google-calendar.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { getAdminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

interface ScheduleClassInput {
  teacherId: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description?: string;
  startTime: Date;
  duration: number;              // Minutes
  timezone: string;
  studentIds?: string[];         // Enrolled students
  externalEmails?: string[];     // External participants
  recordingEnabled?: boolean;
}

interface ScheduleRecurringClassInput extends ScheduleClassInput {
  recurrence: {
    pattern: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
    daysOfWeek?: number[];       // [0-6] for weekly (0 = Sunday)
    endDate?: Date;
  };
}

interface InstantMeetingInput {
  teacherId: string;
  courseId: string;
  lessonId?: string;
  title: string;
  description?: string;
  duration?: number;             // Minutes (default 60)
  studentIds?: string[];
  externalEmails?: string[];
}

export class ClassService {
  private classRepository: ClassRepository;

  constructor() {
    this.classRepository = new ClassRepository();
  }

  /**
   * Schedule a one-time class
   * 
   * Creates class in Firestore and Google Calendar with Meet link
   * 
   * @param input - Class scheduling data
   * @returns Created class
   */
  async scheduleClass(input: ScheduleClassInput): Promise<Class> {
    const spanId = traceLogger.startSpan('ClassService', 'scheduleClass');

    try {
      // Validate teacher owns the course
      await this.validateTeacherOwnership(input.teacherId, input.courseId);

      // Validate students are enrolled (if provided)
      if (input.studentIds && input.studentIds.length > 0) {
        await this.validateStudentEnrollments(input.courseId, input.studentIds);
      }

      // Collect all attendee emails
      const attendeeEmails = await this.collectAttendeeEmails(
        input.courseId,
        input.studentIds || [],
        input.externalEmails || []
      );

      traceLogger.log('info', 'ClassService', 'Creating one-time class', {
        teacherId: input.teacherId,
        courseId: input.courseId,
        title: input.title,
        startTime: input.startTime.toISOString(),
        attendeeCount: attendeeEmails.length,
      });

      // Create Google Calendar event with Meet link
      let calendarEvent;
      try {
        calendarEvent = await googleCalendarService.createOneTimeClass({
          teacherId: input.teacherId,
          title: input.title,
          description: input.description || '',
          startTime: input.startTime,
          duration: input.duration,
          timezone: input.timezone,
          attendeeEmails,
        });
      } catch (error: any) {
        // Detect device mismatch errors from Google Auth Service
        if (error.code === 'DEVICE_MISMATCH') {
          traceLogger.log('error', 'ClassService', 'Device mismatch detected', {
            teacherId: input.teacherId,
            lastDevice: error.details?.lastDevice,
          });

          // Re-throw with user-friendly message
          const deviceError: any = new Error(
            'Your Google account was authorized on a different device. Please reconnect from this device in Settings > Google Account.'
          );
          deviceError.code = 'DEVICE_MISMATCH';
          deviceError.details = error.details;
          throw deviceError;
        }

        // Re-throw other errors
        throw error;
      }

      // Calculate end time
      const endTime = new Date(input.startTime.getTime() + input.duration * 60 * 1000);

      // Store class in Firestore (convert Date to Timestamp)
      // CRITICAL: Only include lessonId if it's provided (Firestore doesn't accept undefined values)
      const classData: CreateClassData = {
        teacherId: input.teacherId,
        courseId: input.courseId,
        ...(input.lessonId && { lessonId: input.lessonId }),
        title: input.title,
        description: input.description,
        type: 'one-time',
        startTime: Timestamp.fromDate(input.startTime),
        endTime: Timestamp.fromDate(endTime),
        duration: input.duration,
        timezone: input.timezone,
        googleCalendarEventId: calendarEvent.id,
        googleMeetLink: calendarEvent.meetLink,
        participants: {
          studentIds: input.studentIds || [],
          externalEmails: input.externalEmails || [],
        },
        recording: {
          enabled: input.recordingEnabled || false,
          status: 'pending',
          archived: false,
        },
        status: 'scheduled',
        createdBy: input.teacherId,
      };

      const createdClass = await this.classRepository.create(classData);

      traceLogger.log('info', 'ClassService', 'One-time class created', {
        classId: createdClass.id,
        eventId: calendarEvent.id,
        meetLink: calendarEvent.meetLink,
      });

      traceLogger.endSpan(spanId, 'success');

      return createdClass;
    } catch (error) {
      traceLogger.log('error', 'ClassService', 'Failed to schedule class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId: input.teacherId,
        courseId: input.courseId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Class scheduling failed' });
      throw error;
    }
  }

  /**
   * Schedule a recurring class series
   * 
   * Creates parent event in Google Calendar and class series in Firestore
   * 
   * @param input - Recurring class data
   * @returns Created parent class
   */
  async scheduleRecurringClass(input: ScheduleRecurringClassInput): Promise<Class> {
    const spanId = traceLogger.startSpan('ClassService', 'scheduleRecurringClass');

    try {
      // Validate teacher owns the course
      await this.validateTeacherOwnership(input.teacherId, input.courseId);

      // Validate students are enrolled
      if (input.studentIds && input.studentIds.length > 0) {
        await this.validateStudentEnrollments(input.courseId, input.studentIds);
      }

      // Collect attendee emails
      const attendeeEmails = await this.collectAttendeeEmails(
        input.courseId,
        input.studentIds || [],
        input.externalEmails || []
      );

      traceLogger.log('info', 'ClassService', 'Creating recurring class', {
        teacherId: input.teacherId,
        courseId: input.courseId,
        title: input.title,
        pattern: input.recurrence.pattern,
        attendeeCount: attendeeEmails.length,
      });

      // Map 'bi-weekly' to 'biweekly' for Google Calendar API
      const googlePattern = input.recurrence.pattern === 'bi-weekly' ? 'biweekly' : input.recurrence.pattern;

      // Create Google Calendar recurring event
      const calendarEvent = await googleCalendarService.createRecurringClass({
        teacherId: input.teacherId,
        title: input.title,
        description: input.description || '',
        startTime: input.startTime,
        duration: input.duration,
        timezone: input.timezone,
        attendeeEmails,
        recurrence: {
          pattern: googlePattern,
          daysOfWeek: input.recurrence.daysOfWeek,
          endDate: input.recurrence.endDate,
        },
      });

      // Calculate end time
      const endTime = new Date(input.startTime.getTime() + input.duration * 60 * 1000);

      // Store parent class in Firestore (convert Date to Timestamp)
      // CRITICAL: Only include lessonId if it's provided (Firestore doesn't accept undefined values)
      const classData: CreateClassData = {
        teacherId: input.teacherId,
        courseId: input.courseId,
        ...(input.lessonId && { lessonId: input.lessonId }),
        title: input.title,
        description: input.description,
        type: 'recurring',
        startTime: Timestamp.fromDate(input.startTime),
        endTime: Timestamp.fromDate(endTime),
        duration: input.duration,
        timezone: input.timezone,
        googleCalendarEventId: calendarEvent.id,
        googleMeetLink: calendarEvent.meetLink,
        participants: {
          studentIds: input.studentIds || [],
          externalEmails: input.externalEmails || [],
        },
        recurrence: {
          pattern: input.recurrence.pattern,
          daysOfWeek: input.recurrence.daysOfWeek,
          endDate: input.recurrence.endDate ? Timestamp.fromDate(input.recurrence.endDate) : undefined,
        },
        recording: {
          enabled: input.recordingEnabled || false,
          status: 'pending',
          archived: false,
        },
        status: 'scheduled',
        createdBy: input.teacherId,
      };

      const createdClass = await this.classRepository.create(classData);

      traceLogger.log('info', 'ClassService', 'Recurring class created', {
        classId: createdClass.id,
        eventId: calendarEvent.id,
        pattern: input.recurrence.pattern,
      });

      traceLogger.endSpan(spanId, 'success');

      return createdClass;
    } catch (error) {
      traceLogger.log('error', 'ClassService', 'Failed to schedule recurring class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId: input.teacherId,
        courseId: input.courseId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Recurring class scheduling failed' });
      throw error;
    }
  }

  /**
   * Start instant meeting (no scheduling)
   * 
   * Creates immediate Google Meet with 60min duration
   * 
   * @param input - Instant meeting data
   * @returns Created class
   */
  async startInstantMeeting(input: InstantMeetingInput): Promise<Class> {
    const spanId = traceLogger.startSpan('ClassService', 'startInstantMeeting');

    try {
      // Validate teacher owns the course
      await this.validateTeacherOwnership(input.teacherId, input.courseId);

      // Validate students are enrolled
      if (input.studentIds && input.studentIds.length > 0) {
        await this.validateStudentEnrollments(input.courseId, input.studentIds);
      }

      // Collect attendee emails
      const attendeeEmails = await this.collectAttendeeEmails(
        input.courseId,
        input.studentIds || [],
        input.externalEmails || []
      );

      traceLogger.log('info', 'ClassService', 'Starting instant meeting', {
        teacherId: input.teacherId,
        courseId: input.courseId,
        title: input.title,
        attendeeCount: attendeeEmails.length,
      });

      // Create instant Google Meet
      const duration = input.duration || 60;  // Default 60 minutes
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      let calendarEvent;
      try {
        calendarEvent = await googleCalendarService.createInstantMeeting({
          teacherId: input.teacherId,
          title: input.title,
          description: input.description || '',
          duration,
          timezone,
          attendeeEmails,
        });
      } catch (error: any) {
        // Detect device mismatch errors from Google Auth Service
        if (error.code === 'DEVICE_MISMATCH') {
          traceLogger.log('error', 'ClassService', 'Device mismatch detected in instant meeting', {
            teacherId: input.teacherId,
            lastDevice: error.details?.lastDevice,
          });

          // Re-throw with user-friendly message
          const deviceError: any = new Error(
            'Your Google account was authorized on a different device. Please reconnect from this device in Settings > Google Account.'
          );
          deviceError.code = 'DEVICE_MISMATCH';
          deviceError.details = error.details;
          throw deviceError;
        }

        // Re-throw other errors
        throw error;
      }

      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // Store class in Firestore (instant meetings are 'one-time' type)
      // CRITICAL: Only include lessonId if it's provided (Firestore doesn't accept undefined values)
      const classData: CreateClassData = {
        teacherId: input.teacherId,
        courseId: input.courseId,
        ...(input.lessonId && { lessonId: input.lessonId }),
        title: input.title,
        description: input.description,
        type: 'one-time',
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        duration,
        timezone,
        googleCalendarEventId: calendarEvent.id,
        googleMeetLink: calendarEvent.meetLink,
        participants: {
          studentIds: input.studentIds || [],
          externalEmails: input.externalEmails || [],
        },
        recording: {
          enabled: false,  // Instant meetings don't auto-record
          status: 'pending',
          archived: false,
        },
        status: 'in-progress',
        createdBy: input.teacherId,
      };

      const createdClass = await this.classRepository.create(classData);

      traceLogger.log('info', 'ClassService', 'Instant meeting created', {
        classId: createdClass.id,
        eventId: calendarEvent.id,
        meetLink: calendarEvent.meetLink,
      });

      traceLogger.endSpan(spanId, 'success');

      return createdClass;
    } catch (error) {
      traceLogger.log('error', 'ClassService', 'Failed to start instant meeting', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId: input.teacherId,
        courseId: input.courseId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Instant meeting failed' });
      throw error;
    }
  }

  /**
   * Update scheduled class
   * 
   * Updates Firestore and syncs with Google Calendar
   * 
   * @param classId - Class ID
   * @param teacherId - Teacher ID (for permission check)
   * @param updates - Fields to update
   * @returns Updated class
   */
  async updateClass(
    classId: string,
    teacherId: string,
    updates: {
      title?: string;
      description?: string;
      startTime?: Date;
      duration?: number;
      studentIds?: string[];
      externalEmails?: string[];
    }
  ): Promise<Class> {
    const spanId = traceLogger.startSpan('ClassService', 'updateClass');

    try {
      // Fetch existing class
      const existingClass = await this.classRepository.findById(classId);
      if (!existingClass) {
        throw new Error(`Class not found: ${classId}`);
      }

      // Verify teacher ownership
      if (existingClass.teacherId !== teacherId) {
        throw new Error('Unauthorized: Teacher does not own this class');
      }

      traceLogger.log('info', 'ClassService', 'Updating class', {
        classId,
        teacherId,
        updates: Object.keys(updates),
      });

      // Validate courseId exists
      if (!existingClass.courseId) {
        throw new Error('Class has no associated course');
      }

      // If time/attendees changed, update Google Calendar
      if (updates.startTime || updates.duration || updates.studentIds || updates.externalEmails) {
        const attendeeEmails = await this.collectAttendeeEmails(
          existingClass.courseId,
          updates.studentIds || existingClass.participants.studentIds,
          updates.externalEmails || existingClass.participants.externalEmails
        );

        // Convert Timestamp to Date for Google Calendar API
        const existingStartDate = existingClass.startTime.toDate();
        const updatedStartTime = updates.startTime || existingStartDate;
        const updatedDuration = updates.duration || existingClass.duration;

        await googleCalendarService.updateClass(
          teacherId,
          existingClass.googleCalendarEventId,
          {
            title: updates.title || existingClass.title,
            description: updates.description || existingClass.description,
            startTime: updatedStartTime,
            duration: updatedDuration,
            timezone: existingClass.timezone,
            attendeeEmails,
          }
        );
      }

      // Update Firestore (convert Date to Timestamp)
      const updateData: Partial<Class> = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.startTime) {
        updateData.startTime = Timestamp.fromDate(updates.startTime);
        const newEndTime = new Date(
          updates.startTime.getTime() + (updates.duration || existingClass.duration) * 60 * 1000
        );
        updateData.endTime = Timestamp.fromDate(newEndTime);
      }
      if (updates.duration) {
        updateData.duration = updates.duration;
        const startDate = updates.startTime || existingClass.startTime.toDate();
        const newEndTime = new Date(startDate.getTime() + updates.duration * 60 * 1000);
        updateData.endTime = Timestamp.fromDate(newEndTime);
      }
      if (updates.studentIds || updates.externalEmails) {
        updateData.participants = {
          studentIds: updates.studentIds || existingClass.participants.studentIds,
          externalEmails: updates.externalEmails || existingClass.participants.externalEmails,
        };
      }

      const updatedClass = await this.classRepository.update(classId, updateData);

      traceLogger.log('info', 'ClassService', 'Class updated', {
        classId,
        fieldsUpdated: Object.keys(updateData),
      });

      traceLogger.endSpan(spanId, 'success');

      return updatedClass!;
    } catch (error) {
      traceLogger.log('error', 'ClassService', 'Failed to update class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        classId,
        teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Class update failed' });
      throw error;
    }
  }

  /**
   * Cancel scheduled class
   * 
   * Marks as cancelled in Firestore and removes from Google Calendar
   * 
   * @param classId - Class ID
   * @param teacherId - Teacher ID (for permission check)
   */
  async cancelClass(classId: string, teacherId: string): Promise<void> {
    const spanId = traceLogger.startSpan('ClassService', 'cancelClass');

    try {
      // Fetch existing class
      const existingClass = await this.classRepository.findById(classId);
      if (!existingClass) {
        throw new Error(`Class not found: ${classId}`);
      }

      // Verify teacher ownership
      if (existingClass.teacherId !== teacherId) {
        throw new Error('Unauthorized: Teacher does not own this class');
      }

      traceLogger.log('info', 'ClassService', 'Cancelling class', {
        classId,
        teacherId,
        eventId: existingClass.googleCalendarEventId,
      });

      // Cancel Google Calendar event
      await googleCalendarService.cancelClass(teacherId, existingClass.googleCalendarEventId);

      // Update Firestore status
      await this.classRepository.update(classId, { status: 'cancelled' });

      traceLogger.log('info', 'ClassService', 'Class cancelled', {
        classId,
      });

      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'ClassService', 'Failed to cancel class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        classId,
        teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Class cancellation failed' });
      throw error;
    }
  }

  /**
   * Get teacher's upcoming classes
   * 
   * @param teacherId - Teacher ID
   * @param days - Number of days ahead (default 7)
   * @returns List of upcoming classes
   */
  async getUpcomingClasses(teacherId: string, days: number = 7): Promise<Class[]> {
    const spanId = traceLogger.startSpan('ClassService', 'getUpcomingClasses');

    try {
      const classes = await this.classRepository.findUpcoming(teacherId, days);

      traceLogger.log('info', 'ClassService', 'Retrieved upcoming classes', {
        teacherId,
        days,
        count: classes.length,
      });

      traceLogger.endSpan(spanId, 'success');

      return classes;
    } catch (error) {
      traceLogger.log('error', 'ClassService', 'Failed to get upcoming classes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Upcoming classes fetch failed' });
      throw error;
    }
  }

  /**
   * Get teacher's past classes
   * 
   * @param teacherId - Teacher ID
   * @param days - Number of days back (default 30)
   * @returns List of past classes
   */
  async getPastClasses(teacherId: string, days: number = 30): Promise<Class[]> {
    const spanId = traceLogger.startSpan('ClassService', 'getPastClasses');

    try {
      const classes = await this.classRepository.findPast(teacherId, days);

      traceLogger.log('info', 'ClassService', 'Retrieved past classes', {
        teacherId,
        days,
        count: classes.length,
      });

      traceLogger.endSpan(spanId, 'success');

      return classes;
    } catch (error) {
      traceLogger.log('error', 'ClassService', 'Failed to get past classes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Past classes fetch failed' });
      throw error;
    }
  }

  // ===============================
  // Private Helper Methods
  // ===============================

  /**
   * Validate teacher owns the course
   */
  private async validateTeacherOwnership(teacherId: string, courseId: string): Promise<void> {
    const db = getAdminDb();
    const courseDoc = await db.collection('courses').doc(courseId).get();

    if (!courseDoc.exists) {
      throw new Error(`Course not found: ${courseId}`);
    }

    const course = courseDoc.data();
    if (course?.teacherId !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this course');
    }
  }

  /**
   * Validate students are enrolled in the course
   */
  private async validateStudentEnrollments(courseId: string, studentIds: string[]): Promise<void> {
    const db = getAdminDb();
    // CRITICAL FIX: Enrollment schema uses 'userId' field, not 'studentId'
    const enrollmentsSnapshot = await db
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .where('userId', 'in', studentIds)  // Changed from 'studentId' to 'userId'
      .where('status', '==', 'active')
      .get();

    const enrolledStudentIds = enrollmentsSnapshot.docs.map(doc => doc.data().userId);  // Changed from studentId to userId
    const notEnrolled = studentIds.filter(id => !enrolledStudentIds.includes(id));

    if (notEnrolled.length > 0) {
      throw new Error(`Students not enrolled: ${notEnrolled.join(', ')}`);
    }
  }

  /**
   * Collect all attendee emails (students + external)
   */
  private async collectAttendeeEmails(
    courseId: string,
    studentIds: string[],
    externalEmails: string[]
  ): Promise<string[]> {
    const emails: string[] = [];

    // Fetch student emails from enrollments
    if (studentIds.length > 0) {
      const db = getAdminDb();
      // CRITICAL FIX: Enrollment schema uses 'userId' field, not 'studentId'
      const enrollmentsSnapshot = await db
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .where('userId', 'in', studentIds)  // Changed from 'studentId' to 'userId'
        .where('status', '==', 'active')
        .get();

      const userIds = enrollmentsSnapshot.docs.map(doc => doc.data().userId);  // Changed from studentId to userId

      // Fetch user emails
      for (const userId of userIds) {
        const userDoc = await db.collection('users').doc(userId).get();
        const email = userDoc.data()?.email;
        if (email) {
          emails.push(email);
        }
      }
    }

    // Add external emails
    emails.push(...externalEmails);

    return emails;
  }
}

// Export singleton instance
export const classService = new ClassService();
