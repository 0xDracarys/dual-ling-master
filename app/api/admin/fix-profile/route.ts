export const dynamic = 'force-dynamic';
/**
 * Migration endpoint to fix user profiles
 * GET /api/admin/fix-profile?userId=<uid>
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase ID token
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const currentUserId = decodedToken.uid;

    // Get userId from query params (defaults to current user)
    const searchParams = request.nextUrl.searchParams;
    const targetUserId = searchParams.get('userId') || currentUserId;

    console.log('[FIX-PROFILE] Fixing profile for user:', targetUserId);

    const db = getAdminDb();
    const userRef = db.collection('users').doc(targetUserId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error('[FIX-PROFILE] User not found:', targetUserId);
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const currentData = userDoc.data();
    console.log('[FIX-PROFILE] Current data:', JSON.stringify(currentData, null, 2));

    // Update document with required fields
    const updates: any = {
      updatedAt: new Date(),
    };

    // Ensure required fields exist
    if (!currentData?.stats) {
      updates.stats = {
        coursesCompleted: 0,
        lessonsCompleted: 0,
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    if (!currentData?.subscription) {
      updates.subscription = {
        plan: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: null,
      };
    }

    if (!currentData?.preferences) {
      updates.preferences = {
        theme: 'system',
        emailNotifications: true,
        pushNotifications: true,
      };
    }

    if (currentData?.bio === undefined) {
      updates.bio = null;
    }

    if (currentData?.profilePicture === undefined) {
      updates.profilePicture = null;
    }

    if (!currentData?.language) {
      updates.language = 'en';
    }

    console.log('[FIX-PROFILE] Applying updates:', JSON.stringify(updates, null, 2));

    await userRef.update(updates);

    console.log('[FIX-PROFILE] Profile updated successfully');

    // Fetch and return updated document
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({
      success: true,
      message: 'Profile fixed successfully',
      profile: updatedData,
    });
  } catch (error: any) {
    console.error('[FIX-PROFILE] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix profile',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
