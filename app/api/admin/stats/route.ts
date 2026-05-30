export const dynamic = 'force-dynamic';
/**
 * Admin Statistics API Route
 * GET - Get platform statistics (users, courses, enrollments)
 *
 * TODO: Implement with Firebase repositories (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Admin statistics not yet implemented in Firebase migration',
      data: {
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
        recentUsers: [],
        recentCourses: [],
      },
    },
    { status: 501 } // Not Implemented
  );
}
