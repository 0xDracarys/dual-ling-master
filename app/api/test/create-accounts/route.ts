export const dynamic = 'force-dynamic';
/**
 * Test Account Creation API Route
 * POST - Create test accounts for development
 *
 * TODO: Implement with Firebase AuthService (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Test account creation not yet implemented in Firebase migration',
      message: 'Use Firebase Console to create test users manually',
    },
    { status: 501 } // Not Implemented
  );
}
