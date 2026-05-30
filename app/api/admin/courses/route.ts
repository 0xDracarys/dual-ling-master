export const dynamic = 'force-dynamic';
/**
 * Admin Courses API Route
 * GET - Get all courses (admin view)
 *
 * TODO: Implement with Firebase CourseRepository (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Admin courses not yet implemented in Firebase migration',
      data: {
        courses: [],
      },
    },
    { status: 501 } // Not Implemented
  );
}
