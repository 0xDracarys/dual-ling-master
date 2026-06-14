export const dynamic = 'force-dynamic';
/**
 * Admin Users Role API Route
 * PUT - Update user role (admin view)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/services/auth/user.repository';
import { verifyIdToken, getAdminAuth } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

const userRepository = new UserRepository();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const spanId = traceLogger.startSpan('API', `PUT /api/admin/users/${userId}/role`);

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

    const body = await request.json();
    const { role } = body;

    if (!role || !['student', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json({ success: false, error: 'Invalid role provided' }, { status: 400 });
    }

    // Set custom claims in Firebase Auth
    try {
      const auth = getAdminAuth();
      const userRecord = await auth.getUser(userId);
      const currentClaims = userRecord.customClaims || {};
      
      await auth.setCustomUserClaims(userId, {
        ...currentClaims,
        role: role,
      });
    } catch (authError: any) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
    }

    // Update role in Firestore
    await userRepository.update(userId, { role });

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: error.message || 'Failed to update user role' }, { status: 500 });
  }
}
