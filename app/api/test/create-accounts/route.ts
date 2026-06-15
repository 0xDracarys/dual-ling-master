export const dynamic = 'force-dynamic';
/**
 * Test Account Creation API Route
 * POST - Create test accounts for development using Firebase Admin SDK
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();

    // 1. Create/Update testadmin@example.com (Admin)
    let adminUid = "";
    try {
      const adminRecord = await auth.getUserByEmail('testadmin@example.com');
      adminUid = adminRecord.uid;
      // Set role claim
      await auth.setCustomUserClaims(adminUid, { role: 'admin' });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const adminRecord = await auth.createUser({
          email: 'testadmin@example.com',
          password: 'password123',
          displayName: 'Super Admin',
        });
        adminUid = adminRecord.uid;
        await auth.setCustomUserClaims(adminUid, { role: 'admin' });
      } else {
        throw err;
      }
    }

    await db.collection('users').doc(adminUid).set({
      email: 'testadmin@example.com',
      username: 'testadmin',
      name: 'Super Admin',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    // 2. Create/Update sam@test2.com (Teacher with AI)
    let teacherUid = "";
    try {
      const teacherRecord = await auth.getUserByEmail('sam@test2.com');
      teacherUid = teacherRecord.uid;
      await auth.setCustomUserClaims(teacherUid, { role: 'teacher' });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const teacherRecord = await auth.createUser({
          email: 'sam@test2.com',
          password: 'Test21',
          displayName: 'Sam Teacher',
        });
        teacherUid = teacherRecord.uid;
        await auth.setCustomUserClaims(teacherUid, { role: 'teacher' });
      } else {
        throw err;
      }
    }

    await db.collection('users').doc(teacherUid).set({
      email: 'sam@test2.com',
      username: 'samteacher',
      name: 'Sam Teacher',
      role: 'teacher',
      aiEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Test accounts created/updated successfully',
      data: {
        admin: { email: 'testadmin@example.com', password: 'password123', role: 'admin' },
        teacher: { email: 'sam@test2.com', password: 'Test21', role: 'teacher', aiEnabled: true }
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create test accounts'
      },
      { status: 500 }
    );
  }
}
