export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { AdminUserRepository } from '@/lib/services/auth/user.repository.admin';
import type { UpdateUserData } from '@/lib/services/auth/user.repository';
import { getAdminAuth } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', '/api/settings [GET]');

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('error', 'API', 'Missing or invalid Authorization header');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const userRepo = new AdminUserRepository();
    const user = await userRepo.getById(userId);

    if (!user) {
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Use default structure populated with actual user data if it exists
    const settings = {
      notifications: {
        email: true,
        push: true,
        courseUpdates: true,
        achievements: true,
        ...user.preferences?.emailNotifications ? { email: user.preferences.emailNotifications } : {},
        ...user.preferences?.pushNotifications ? { push: user.preferences.pushNotifications } : {},
      },
      privacy: {
        profileVisibility: "public",
        showProgress: true,
        showAchievements: true
      },
      preferences: {
        language: user.language || "en",
        theme: user.preferences?.theme || "light",
        timezone: "UTC"
      }
    };

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', '/api/settings [PUT]');

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    
    // Map settings back to user document fields
    const userRepo = new AdminUserRepository();
    const user = await userRepo.getById(userId);
    
    if (!user) {
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updatePayload: UpdateUserData = {
      language: body.preferences?.language as 'en' | 'lt',
      preferences: {
        ...user.preferences,
        theme: body.preferences?.theme as 'light' | 'dark' | 'system',
        emailNotifications: body.notifications?.email,
        pushNotifications: body.notifications?.push,
      }
    };

    await userRepo.update(userId, updatePayload);

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: 'Failed to update settings' }, { status: 500 });
  }
}
