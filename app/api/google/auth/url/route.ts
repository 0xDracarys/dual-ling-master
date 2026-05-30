/**
 * Google OAuth Authorization URL API Route
 * 
 * Returns the OAuth 2.0 authorization URL for teachers to connect their Google account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAuthService } from '@/lib/services/google/google-auth.service';
import { getAdminAuth } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('GoogleAuthUrl', 'generateAuthUrl');

  try {
    // Verify Firebase token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('error', 'GoogleAuthUrl', 'Missing or invalid authorization header');
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
      traceLogger.log('error', 'GoogleAuthUrl', 'User is not a teacher', {
        userId: decodedToken.uid,
        role: decodedToken.role,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Forbidden' });
      return NextResponse.json(
        { error: 'Forbidden: Teacher role required' },
        { status: 403 }
      );
    }

    // Get userId from request body (optional, fallback to token)
    const body = await request.json();
    const userId = body.userId || decodedToken.uid;

    // Generate authorization URL
    const authUrl = googleAuthService.getAuthorizationUrl(userId);

    traceLogger.log('info', 'GoogleAuthUrl', 'Authorization URL generated', {
      userId,
    });

    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    traceLogger.log('error', 'GoogleAuthUrl', 'Failed to generate auth URL', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    traceLogger.endSpan(spanId, 'error', { message: 'Auth URL generation failed' });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
