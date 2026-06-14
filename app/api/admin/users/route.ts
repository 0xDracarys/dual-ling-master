export const dynamic = 'force-dynamic';
/**
 * Admin Users API Route
 * GET - Get all users (admin view)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@/lib/services/auth/user.repository';
import { verifyIdToken } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

const userRepository = new UserRepository();

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/admin/users');

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

    const users = await userRepository.getAll();

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({
      success: true,
      data: { users },
    });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch users' }, { status: 500 });
  }
}
