export const dynamic = 'force-dynamic';
/**
 * Admin Stats API Route
 * GET - Get platform statistics (admin view)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminDb, verifyIdToken } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/admin/stats');

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await verifyIdToken(token);
    } catch (error: any) {
      traceLogger.endSpan(spanId, 'error', { message: 'Invalid token' });
      return NextResponse.json({ success: false, error: 'Invalid authentication token' }, { status: 401 });
    }

    if (decodedToken.role !== 'admin') {
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json({ success: false, error: 'Forbidden - Admins only' }, { status: 403 });
    }

    const db = getAdminDb();
    
    // Perform aggregate queries for stats
    const [usersSnapshot, coursesSnapshot] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('courses').count().get()
    ]);

    // Also get counts by role
    const teachersSnapshot = await db.collection('users').where('role', '==', 'teacher').count().get();
    const studentsSnapshot = await db.collection('users').where('role', '==', 'student').count().get();
    
    // Also get published courses count
    const publishedCoursesSnapshot = await db.collection('courses').where('isPublished', '==', true).count().get();

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({
      success: true,
      data: {
        totalUsers: usersSnapshot.data().count,
        totalTeachers: teachersSnapshot.data().count,
        totalStudents: studentsSnapshot.data().count,
        totalCourses: coursesSnapshot.data().count,
        publishedCourses: publishedCoursesSnapshot.data().count,
        totalRevenue: 0, // Placeholder
      },
    });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
