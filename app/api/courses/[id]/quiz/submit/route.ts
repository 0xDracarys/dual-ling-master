export const dynamic = 'force-dynamic';
/**
 * Quiz Submission API Route
 * POST - Submit quiz answers and get results
 *
 * TODO: Implement with Firebase CourseRepository and ProgressService (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;

  return NextResponse.json(
    {
      success: false,
      error: 'Quiz submission not yet implemented in Firebase migration',
      message: 'This feature will be implemented with Firebase ProgressService',
    },
    { status: 501 } // Not Implemented
  );
}
