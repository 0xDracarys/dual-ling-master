export const dynamic = 'force-dynamic';
/**
 * User Settings API Routes
 * GET - Get user settings
 * PUT - Update user settings
 *
 * TODO: Implement with Firebase UserRepository (Phase 3)
 * Currently disabled to avoid MongoDB dependency
 */

import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Default settings structure
  const defaultSettings = {
    notifications: {
      email: true,
      push: true,
      courseUpdates: true,
      achievements: true
    },
    privacy: {
      profileVisibility: "public",
      showProgress: true,
      showAchievements: true
    },
    preferences: {
      language: "en",
      theme: "light",
      timezone: "UTC"
    }
  };

  return NextResponse.json(
    {
      success: true,
      data: defaultSettings,
      message: 'Using default settings - Firebase implementation pending',
    },
    { status: 200 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Settings update not yet implemented in Firebase migration',
    },
    { status: 501 } // Not Implemented
  );
}
