export const dynamic = 'force-dynamic';
/**
 * Admin User Management API Route
 * DELETE - Delete a user by ID
 *
 * TODO: Implement with Firebase UserRepository (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  return NextResponse.json(
    {
      success: false,
      error: 'User deletion not yet implemented in Firebase migration',
    },
    { status: 501 } // Not Implemented
  );
}
