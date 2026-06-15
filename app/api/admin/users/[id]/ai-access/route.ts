export const dynamic = 'force-dynamic';
/**
4:  * Admin Users AI Access API Route
5:  * PUT - Enable/Disable AI features access for a specific teacher
6:  */

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, verifyIdToken } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id;
  const spanId = traceLogger.startSpan('API', `PUT /api/admin/users/${userId}/ai-access`);

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
    const { aiEnabled } = body;

    const db = getAdminDb();
    // Update the teacher's user document in Firestore with aiEnabled property
    await db.collection('users').doc(userId).update({
      aiEnabled: !!aiEnabled,
      updatedAt: new Date()
    });

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({
      success: true,
      message: `AI course creation access ${aiEnabled ? 'enabled' : 'disabled'} for this teacher.`,
    });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: error.message || 'Failed to update AI access status' }, { status: 500 });
  }
}
