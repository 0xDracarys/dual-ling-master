/**
 * Teacher Recent Activity API Route
 * GET - Get recent enrollments and activity for teacher's courses
 * Phase 3: Dashboard Enhancement
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';

// Force dynamic rendering - prevents build-time prerendering with Firebase Admin
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/teacher/recent-activity');

  try {
    traceLogger.log('info', 'API', 'Teacher recent activity request received');

    // Get and verify Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing authorization header');
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      traceLogger.log('warn', 'API', 'Token verification failed', { error: error.message });
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid token' });
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    const teacherId = decodedToken.uid;
    const userRole = decodedToken.role;

    // Verify user is a teacher
    if (userRole !== 'teacher') {
      traceLogger.log('warn', 'API', 'Non-teacher attempted to access teacher activity', {
        userId: teacherId,
        role: userRole,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        { success: false, error: 'Only teachers can access this endpoint' },
        { status: 403 }
      );
    }

    const db = getAdminDb();

    // Get teacher's courses
    const coursesSnapshot = await db
      .collection('courses')
      .where('teacherId', '==', teacherId)
      .get();

    const courseIds = coursesSnapshot.docs.map(doc => doc.id);

    if (courseIds.length === 0) {
      traceLogger.log('info', 'API', 'Teacher has no courses yet');
      traceLogger.endSpan(spanId, 'success');
      return NextResponse.json(
        {
          success: true,
          data: {
            recentEnrollments: [],
            recentCourses: [],
          },
        },
        { status: 200 }
      );
    }

    // Get recent enrollments for teacher's courses
    // Fetch enrollments for each course and combine them (avoids complex index requirements)
    const enrollmentPromises = courseIds.map(courseId =>
      db
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .orderBy('enrolledAt', 'desc')
        .limit(5)
        .get()
    );

    const enrollmentSnapshots = await Promise.all(enrollmentPromises);
    
    // Flatten all enrollments and sort by enrolledAt
    const allEnrollments = enrollmentSnapshots
      .flatMap(snapshot => snapshot.docs)
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userName: data.userName,
          courseTitle: data.courseTitle,
          enrolledAt: data.enrolledAt?.toDate ? data.enrolledAt.toDate() : null,
          enrolledAtTimestamp: data.enrolledAt?.toMillis ? data.enrolledAt.toMillis() : 0,
        };
      })
      .sort((a, b) => b.enrolledAtTimestamp - a.enrolledAtTimestamp)
      .slice(0, 10);

    const recentEnrollments = allEnrollments.map(({ enrolledAtTimestamp, ...rest }) => rest);

    // Get recently created courses
    const recentCoursesSnapshot = await db
      .collection('courses')
      .where('teacherId', '==', teacherId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentCourses = recentCoursesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : null,
      };
    });

    traceLogger.log('success', 'API', 'Recent activity retrieved', {
      enrollmentsCount: recentEnrollments.length,
      coursesCount: recentCourses.length,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json(
      {
        success: true,
        data: {
          recentEnrollments,
          recentCourses,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get recent activity', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get recent activity',
      },
      { status: 500 }
    );
  }
}
