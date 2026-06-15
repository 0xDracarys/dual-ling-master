export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

const DEFAULT_SETTINGS = {
  siteName: "English With Evelina",
  contactEmail: "evelina@englishwithevelina.lt",
  supportedLanguages: "en, lt",
  aiModel: "gemini-1.5-flash",
  maxFileSize: "10",
  maintenanceMode: false,
  aiEnabled: true,
  registrationOpen: true,
  emailNotifications: true,
  geminiApiKey: ""
};

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', '/api/admin/settings [GET]');

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('error', 'API', 'Missing or invalid Authorization header');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    if (decodedToken.role !== 'admin') {
      traceLogger.log('error', 'API', `User ${decodedToken.uid} is not admin`);
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const db = getAdminDb();
    const settingsDoc = await db.collection('system_settings').doc('global').get();

    let settings = { ...DEFAULT_SETTINGS };
    if (settingsDoc.exists) {
      settings = { ...settings, ...settingsDoc.data() };
    }

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({ success: true, data: settings }, { status: 200 });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: 'Failed to fetch admin settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', '/api/admin/settings [PUT]');

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    
    if (decodedToken.role !== 'admin') {
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const db = getAdminDb();
    
    // Validate / sanitize incoming fields slightly or just merge
    const updatePayload = {
      siteName: body.siteName ?? DEFAULT_SETTINGS.siteName,
      contactEmail: body.contactEmail ?? DEFAULT_SETTINGS.contactEmail,
      supportedLanguages: body.supportedLanguages ?? DEFAULT_SETTINGS.supportedLanguages,
      aiModel: body.aiModel ?? DEFAULT_SETTINGS.aiModel,
      maxFileSize: body.maxFileSize ?? DEFAULT_SETTINGS.maxFileSize,
      maintenanceMode: !!body.maintenanceMode,
      aiEnabled: !!body.aiEnabled,
      registrationOpen: !!body.registrationOpen,
      emailNotifications: !!body.emailNotifications,
      geminiApiKey: body.geminiApiKey ?? ""
    };

    await db.collection('system_settings').doc('global').set(updatePayload, { merge: true });

    traceLogger.endSpan(spanId, 'success');
    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error: any) {
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return NextResponse.json({ success: false, error: 'Failed to update admin settings' }, { status: 500 });
  }
}
