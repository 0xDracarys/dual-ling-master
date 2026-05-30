/**
 * POST /api/classes
 * 
 * Schedule a new class (one-time or recurring)
 * 
 * Security: Firebase Auth required, teacher role verified
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { classService } from '@/lib/services/class.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { Class } from '@/lib/repositories/class.repository';

/**
 * Enrich classes with student profile information
 * Fetches student names from Firestore users collection
 * Returns array of student names for display in ClassCard
 */
async function enrichClassesWithStudentNames(classes: Class[]): Promise<any[]> {
  const db = getAdminDb();
  const enriched = [];

  for (const classItem of classes) {
    const studentIds = classItem.participants.studentIds || [];
    const studentNames = [];

    // Fetch student names
    for (const studentId of studentIds) {
      try {
        const userDoc = await db.collection('users').doc(studentId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          studentNames.push(userData?.name || userData?.displayName || 'Unknown Student');
        } else {
          studentNames.push('Unknown Student');
        }
      } catch (error) {
        console.error(`Failed to fetch student ${studentId}:`, error);
        studentNames.push('Unknown Student');
      }
    }

    enriched.push({
      ...classItem,
      studentNames, // Array of strings: ['John Doe', 'Jane Smith']
    });
  }

  return enriched;
}

/**
 * GET /api/classes
 * 
 * List teacher's classes with optional filters
 * 
 * Query params:
 * - type: 'upcoming' | 'past' (default: 'upcoming')
 * - days: number (default: 30 for both upcoming and past)
 * - courseId: string (optional - filter by specific course)
 * 
 * Security: Firebase Auth required, teacher role verified
 */
export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/classes');

  try {
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid authorization header', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Forbidden - Not a teacher', {
        userId: decodedToken.uid,
        role: decodedToken.role,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ error: 'Only teachers can view classes' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'upcoming';
    const daysParam = searchParams.get('days');
    const courseId = searchParams.get('courseId');

    let classes;

    if (type === 'upcoming') {
      const days = daysParam ? parseInt(daysParam) : 30;
      traceLogger.log('info', 'API', 'Fetching upcoming classes', {
        teacherId,
        days,
        courseId: courseId || 'all',
      });
      classes = await classService.getUpcomingClasses(teacherId, days);
    } else if (type === 'past') {
      const days = daysParam ? parseInt(daysParam) : 30;
      traceLogger.log('info', 'API', 'Fetching past classes', {
        teacherId,
        days,
        courseId: courseId || 'all',
      });
      classes = await classService.getPastClasses(teacherId, days);
    } else {
      traceLogger.log('warn', 'API', 'Invalid type parameter', { type });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid type' });
      return NextResponse.json(
        { error: 'type must be "upcoming" or "past"' },
        { status: 400 }
      );
    }

    // Filter by courseId if provided
    if (courseId) {
      classes = classes.filter((c) => c.courseId === courseId);
      traceLogger.log('info', 'API', 'Filtered classes by courseId', {
        courseId,
        filteredCount: classes.length,
      });
    }

    // Enrich classes with student names before serialization
    const enrichedClasses = await enrichClassesWithStudentNames(classes);

    // Serialize Firestore Timestamps to ISO strings for JSON response
    const serializedClasses = enrichedClasses.map((classItem) => ({
      ...classItem,
      startTime: classItem.startTime.toDate().toISOString(),
      endTime: classItem.endTime.toDate().toISOString(),
      createdAt: classItem.createdAt.toDate().toISOString(),
      updatedAt: classItem.updatedAt.toDate().toISOString(),
      ...(classItem.recurrence?.endDate && {
        recurrence: {
          ...classItem.recurrence,
          endDate: classItem.recurrence.endDate.toDate().toISOString(),
        },
      }),
      ...(classItem.recording?.expiresAt && {
        recording: {
          ...classItem.recording,
          expiresAt: classItem.recording.expiresAt.toDate().toISOString(),
        },
      }),
    }));

    traceLogger.log('info', 'API', 'Classes retrieved successfully', {
      count: serializedClasses.length,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      classes: serializedClasses,
    });
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to retrieve classes', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Retrieve classes failed' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve classes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/classes');

  try {
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing or invalid authorization header', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Forbidden - Not a teacher', {
        userId: decodedToken.uid,
        role: decodedToken.role,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ error: 'Only teachers can schedule classes' }, { status: 403 });
    }

    const teacherId = decodedToken.uid;

    // Parse request body
    const body = await request.json();

    const {
      courseId,
      lessonId,
      title,
      description,
      startTime,
      duration,
      timezone,
      studentIds,
      externalEmails,
      recordingEnabled,
      recurrence,
    } = body;

    // Validate required fields
    if (!courseId) {
      traceLogger.log('warn', 'API', 'Missing required field: courseId', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Missing courseId' });
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    if (!title) {
      traceLogger.log('warn', 'API', 'Missing required field: title', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Missing title' });
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    if (!startTime) {
      traceLogger.log('warn', 'API', 'Missing required field: startTime', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Missing startTime' });
      return NextResponse.json({ error: 'startTime is required' }, { status: 400 });
    }

    if (!duration || duration <= 0) {
      traceLogger.log('warn', 'API', 'Invalid duration', { duration });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid duration' });
      return NextResponse.json({ error: 'duration must be positive' }, { status: 400 });
    }

    if (!timezone) {
      traceLogger.log('warn', 'API', 'Missing required field: timezone', {});
      traceLogger.endSpan(spanId, 'error', { message: 'Missing timezone' });
      return NextResponse.json({ error: 'timezone is required' }, { status: 400 });
    }

    traceLogger.log('info', 'API', 'Scheduling class', {
      teacherId,
      courseId,
      title,
      hasRecurrence: !!recurrence,
    });

    // Parse startTime to Date
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      traceLogger.log('warn', 'API', 'Invalid startTime format', { startTime });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid startTime' });
      return NextResponse.json({ error: 'Invalid startTime format' }, { status: 400 });
    }

    let createdClass;

    // Check if recurring class
    if (recurrence) {
      // Validate recurrence pattern
      if (!['daily', 'weekly', 'bi-weekly', 'monthly'].includes(recurrence.pattern)) {
        traceLogger.log('warn', 'API', 'Invalid recurrence pattern', {
          pattern: recurrence.pattern,
        });
        traceLogger.endSpan(spanId, 'error', { message: 'Invalid recurrence pattern' });
        return NextResponse.json(
          { error: 'recurrence.pattern must be daily, weekly, bi-weekly, or monthly' },
          { status: 400 }
        );
      }

      // Parse endDate if provided
      let endDate: Date | undefined;
      if (recurrence.endDate) {
        endDate = new Date(recurrence.endDate);
        if (isNaN(endDate.getTime())) {
          traceLogger.log('warn', 'API', 'Invalid endDate format', {
            endDate: recurrence.endDate,
          });
          traceLogger.endSpan(spanId, 'error', { message: 'Invalid endDate' });
          return NextResponse.json({ error: 'Invalid endDate format' }, { status: 400 });
        }
      }

      // Schedule recurring class
      createdClass = await classService.scheduleRecurringClass({
        teacherId,
        courseId,
        lessonId,
        title,
        description,
        startTime: startDate,
        duration,
        timezone,
        studentIds: studentIds || [],
        externalEmails: externalEmails || [],
        recordingEnabled: recordingEnabled || false,
        recurrence: {
          pattern: recurrence.pattern,
          daysOfWeek: recurrence.daysOfWeek,
          endDate,
        },
      });
    } else {
      // Schedule one-time class
      createdClass = await classService.scheduleClass({
        teacherId,
        courseId,
        lessonId,
        title,
        description,
        startTime: startDate,
        duration,
        timezone,
        studentIds: studentIds || [],
        externalEmails: externalEmails || [],
        recordingEnabled: recordingEnabled || false,
      });
    }

    traceLogger.log('info', 'API', 'Class scheduled successfully', {
      classId: createdClass.id,
      meetLink: createdClass.googleMeetLink,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      class: createdClass,
    });
  } catch (error) {
    traceLogger.log('error', 'API', 'Failed to schedule class', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Schedule class failed' });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to schedule class' },
      { status: 500 }
    );
  }
}
