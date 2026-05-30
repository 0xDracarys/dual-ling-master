/**
 * Admin Users API Route
 * GET - Get all users (admin view)
 *
 * TODO: Implement with Firebase UserRepository (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Admin users list not yet implemented in Firebase migration',
      data: {
        users: [],
      },
    },
    { status: 501 } // Not Implemented
  );
}
