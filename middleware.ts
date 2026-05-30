/**
 * Next.js Global Middleware
 *
 * Runs in Edge Runtime - generates trace IDs and adds them to headers.
 * Actual trace context storage happens in API routes (Node.js runtime).
 *
 * Important: This middleware runs in Edge Runtime, so it CANNOT use:
 * - Node.js crypto module (use Web Crypto API instead)
 * - AsyncLocalStorage (not available in Edge Runtime)
 * - Any Node.js-specific modules
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Global middleware function.
 * Generates or extracts trace ID and adds it to request headers.
 *
 * **GCP Compliance:** Generates 32-character hexadecimal trace IDs (no hyphens)
 * to match Google Cloud Trace format for proper log-trace correlation.
 *
 * @param request - The incoming request
 * @returns Response with trace ID headers
 */
export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Extract existing trace ID or generate a new one (GCP format: 32 hex chars)
  const existingTraceId = request.headers.get('x-trace-id');
  const traceId = existingTraceId || crypto.randomUUID().replace(/-/g, '');

  // Clone the request headers and add trace ID
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-trace-id', traceId);

  // Continue with the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add trace ID to response headers
  response.headers.set('x-trace-id', traceId);
  response.headers.set('Access-Control-Expose-Headers', 'x-trace-id');

  return response;
}

/**
 * Matcher configuration.
 * Only run on API routes for efficiency.
 */
export const config = {
  matcher: '/api/:path*',
};
