/**
 * Google OAuth Callback Route
 * 
 * Handles OAuth 2.0 callback from Google after teacher authorizes access.
 * Exchanges authorization code for access/refresh tokens and stores in Firestore.
 * 
 * Flow:
 * 1. Teacher clicks "Connect Google Account"
 * 2. Redirected to Google consent screen
 * 3. Teacher approves access
 * 4. Google redirects to this route with authorization code
 * 5. We exchange code for tokens
 * 6. Store tokens in Firestore
 * 7. Redirect teacher back to settings page
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAuthService } from '@/lib/services/google/google-auth.service';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('GoogleAuthCallback', 'handleCallback');

  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');    // userId
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      traceLogger.log('error', 'GoogleAuthCallback', 'OAuth error from Google', {
        error,
        errorDescription: searchParams.get('error_description'),
      });

      traceLogger.endSpan(spanId, 'error', { message: 'OAuth error' });

      return NextResponse.redirect(
        new URL(
          `/teacher/settings/google?error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    // Validate required parameters
    if (!code || !state) {
      traceLogger.log('error', 'GoogleAuthCallback', 'Missing required parameters', {
        hasCode: !!code,
        hasState: !!state,
      });

      traceLogger.endSpan(spanId, 'error', { message: 'Missing parameters' });

      return NextResponse.redirect(
        new URL(
          '/teacher/settings/google?error=missing_parameters',
          request.url
        )
      );
    }

    const userId = state;

    // Extract device/IP info from request headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';

    traceLogger.log('info', 'GoogleAuthCallback', 'Processing OAuth callback', {
      userId,
      codePreview: code.substring(0, 10) + '...',
      userAgent: userAgent.substring(0, 50) + '...', // Log preview only
      ipPrefix: ip.split('.').slice(0, 2).join('.'), // Log prefix only (privacy)
    });

    // Exchange authorization code for tokens
    const tokens = await googleAuthService.exchangeCodeForTokens(code);

    // Store tokens in Firestore with device context
    await googleAuthService.storeTokens(userId, tokens, { userAgent, ip });

    traceLogger.log('info', 'GoogleAuthCallback', 'OAuth flow completed successfully', {
      userId,
    });

    traceLogger.endSpan(spanId, 'success');

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/teacher/settings/google?success=true', request.url)
    );
  } catch (error) {
    traceLogger.log('error', 'GoogleAuthCallback', 'OAuth callback failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    traceLogger.endSpan(spanId, 'error', {
      message: 'Callback processing failed',
    });

    // Redirect with error
    return NextResponse.redirect(
      new URL(
        `/teacher/settings/google?error=${encodeURIComponent('callback_failed')}`,
        request.url
      )
    );
  }
}
