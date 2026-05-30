/**
 * Test Users List API Route
 * GET - List all users for testing
 *
 * TODO: Implement with Firebase UserRepository (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'User listing not yet implemented in Firebase migration',
      data: {
        users: [],
      },
    },
    { status: 501 } // Not Implemented
  );
}
