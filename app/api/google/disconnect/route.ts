/**
 * Google Disconnect API Route
 * 
 * Revokes Google OAuth tokens and disconnects teacher's account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAuthService } from '@/lib/services/google/google-auth.service';
import { getAdminAuth } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('GoogleDisconnect', 'disconnectAccount');

  try {
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('error', 'GoogleDisconnect', 'Missing or invalid authorization header');
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
      traceLogger.log('error', 'GoogleDisconnect', 'User is not a teacher', {
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

    // Revoke tokens
    await googleAuthService.revokeTokens(userId);

    traceLogger.log('info', 'GoogleDisconnect', 'Account disconnected', { userId });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: 'Google account disconnected successfully',
    });
  } catch (error) {
    traceLogger.log('error', 'GoogleDisconnect', 'Failed to disconnect', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Disconnect failed' });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
