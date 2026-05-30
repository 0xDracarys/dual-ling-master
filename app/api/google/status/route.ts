export const dynamic = 'force-dynamic';
/**
 * Google Connection Status API Route
 * 
 * Returns connection status for the authenticated teacher.
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAuthService } from '@/lib/services/google/google-auth.service';
import { getAdminAuth } from '@/lib/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('GoogleStatus', 'checkStatus');

  try {
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('error', 'GoogleStatus', 'Missing or invalid authorization header');
      traceLogger.endSpan(spanId, 'error', { message: 'Unauthorized' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await getAdminAuth().verifyIdToken(token);

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('error', 'GoogleStatus', 'User is not a teacher', {
        userId: decodedToken.uid,
        role: decodedToken.role,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        { error: 'Forbidden: Teacher role required' },
        { status: 403 }
      );
    }

    const userId = decodedToken.uid;

    // Check connection status
    const isConnected = await googleAuthService.isConnected(userId);

    if (!isConnected) {
      traceLogger.log('info', 'GoogleStatus', 'User not connected', { userId });
      traceLogger.endSpan(spanId, 'success');
      return NextResponse.json({
        connected: false,
      });
    }

    // Get connection details from Firestore
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const googleTokens = userData?.googleTokens;
    const connectedAt = userData?.googleConnectedAt;

    traceLogger.log('info', 'GoogleStatus', 'User connected', { userId });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      connected: true,
      connectedAt: connectedAt?.toDate().toISOString(),
      expiresAt: googleTokens?.expiresAt?.toDate().toISOString(),
      scope: googleTokens?.scope,
    });
  } catch (error) {
    traceLogger.log('error', 'GoogleStatus', 'Failed to check status', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Status check failed' });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
