/**
 * Admin User Role Management API Route
 * PUT - Update user role
 *
 * TODO: Implement with Firebase UserRepository and setCustomUserClaims (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json(
    {
      success: false,
      error: 'User role update not yet implemented in Firebase migration',
      message: 'Use Firebase Admin SDK setCustomUserClaims() to update roles',
    },
    { status: 501 } // Not Implemented
  );
}
