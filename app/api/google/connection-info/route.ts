export const dynamic = 'force-dynamic';
/**
 * Google Connection Info API Route
 * 
 * GET /api/google/connection-info
 * Returns device/connection information for the user's Google account.
 * Used to show "Last connected from: Chrome on Windows (192.168.x.x) on Oct 30"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminAuth } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('GoogleConnectionInfo', 'getConnectionInfo');

  try {
    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error', { message: 'Missing auth token' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Fetch user document
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.googleTokens) {
      traceLogger.log('info', 'GoogleConnectionInfo', 'User not connected', { userId });
      traceLogger.endSpan(spanId, 'success');
      return NextResponse.json({
        connected: false,
        message: 'Google account not connected',
      });
    }

    const { 
      userAgent, 
      lastUsedIp, 
      connectedAt, 
      lastUsedAt 
    } = userData.googleTokens;

    // Backward compatibility: Check if device fields exist (new schema)
    if (!userAgent || !lastUsedIp || !connectedAt) {
      traceLogger.log('info', 'GoogleConnectionInfo', 'Legacy token format detected', { 
        userId,
        hasUserAgent: !!userAgent,
        hasLastUsedIp: !!lastUsedIp,
        hasConnectedAt: !!connectedAt,
      });
      
      traceLogger.endSpan(spanId, 'success');
      return NextResponse.json({
        connected: true,
        legacy: true,
        message: 'Connected (legacy format - please reconnect to enable device tracking)',
      });
    }

    // Parse user agent to extract browser and OS
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/i);
    const osMatch = userAgent.match(/(Windows|Mac OS X|Linux|Android|iOS)/i);

    const connectionInfo = {
      connected: true,
      legacy: false,
      lastDevice: {
        browser: browserMatch ? browserMatch[1] : 'Unknown Browser',
        os: osMatch ? osMatch[1] : 'Unknown OS',
        ipPrefix: lastUsedIp.split('.').slice(0, 2).join('.') + '.x.x', // Privacy: hide last 2 octets
        connectedAt: connectedAt.toDate().toISOString(),
        lastUsedAt: lastUsedAt.toDate().toISOString(),
      }
    };

    traceLogger.log('info', 'GoogleConnectionInfo', 'Connection info retrieved', {
      userId,
      connected: true,
    });

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json(connectionInfo);

  } catch (error) {
    traceLogger.log('error', 'GoogleConnectionInfo', 'Failed to get connection info', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    traceLogger.endSpan(spanId, 'error', { message: 'Connection info fetch failed' });

    return NextResponse.json(
      { error: 'Failed to retrieve connection information' },
      { status: 500 }
    );
  }
}
