export const dynamic = 'force-dynamic';
/**
 * User Profile API Routes
 * GET - Get user profile
 * PUT - Update user profile
 */

import { type NextRequest, NextResponse } from 'next/server';
import { AdminUserRepository } from '@/lib/services/auth/user.repository.admin';
import type { UpdateUserData } from '@/lib/services/auth/user.repository';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { z } from 'zod';
import { traceLogger } from '@/lib/tracing/trace-logger';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').nullable().optional(),
  profilePicture: z.string().url('Must be a valid URL').nullable().optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']),
      emailNotifications: z.boolean(),
      pushNotifications: z.boolean(),
    })
    .partial()
    .optional(),
});

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', '/api/profile [GET]');

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('error', 'API', 'Missing or invalid Authorization header');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase ID token
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    traceLogger.log('info', 'API', 'Fetching user profile', { userId });

    // Fetch user from Firestore
    const userRepo = new AdminUserRepository();
    const user = await userRepo.getById(userId);

    if (!user) {
      traceLogger.log('error', 'API', 'User not found', { userId });
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let enrolledCount = 0;
    let completedCount = 0;
    let teacherStats = null;

    try {
      // Fetch enrollment stats
      const db = getAdminDb();
      const enrollmentsSnapshot = await db
        .collection('enrollments')
        .where('userId', '==', userId)
        .get();

      const enrollments = enrollmentsSnapshot.docs.map((doc: any) => doc.data());
      enrolledCount = enrollments.length;
      completedCount = enrollments.filter((e: any) => e.status === 'completed').length;

      // Fetch teacher-specific stats if teacher
      if (user.role === 'teacher') {
        const coursesSnapshot = await db.collection('courses').where('teacherId', '==', userId).get();

        const courses = coursesSnapshot.docs.map((doc: any) => doc.data());
        const totalCourses = courses.length;
        const publishedCourses = courses.filter((c: any) => c.isPublished).length;

        let totalStudents = 0;
        for (const course of courses) {
          const enrollmentCount = course.enrollmentCount || 0;
          totalStudents += enrollmentCount;
        }

        teacherStats = {
          coursesCreated: totalCourses,
          publishedCourses,
          totalStudents,
          averageRating: 0, // Can be calculated later from reviews
        };
      }
    } catch (queryError: any) {
      // Log but don't fail if stats query fails
      traceLogger.log('warn', 'API', 'Failed to fetch enrollment/course stats', { error: queryError.message });
    }

    traceLogger.log('success', 'API', 'User profile fetched successfully', { userId });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      profile: {
        uid: userId,
        email: user.email,
        name: user.name,
        role: user.role,
        bio: user.bio,
        profilePicture: user.profilePicture,
        language: user.language,
        preferences: user.preferences,
        stats: {
          ...user.stats,
          coursesEnrolled: enrolledCount,
          coursesCompleted: completedCount,
        },
        teacherStats,
        subscription: user.subscription,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    // Log the full error for debugging
    console.error('[PROFILE-API] Full error:', error);
    traceLogger.log('error', 'API', 'Failed to fetch profile', { 
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch profile',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', '/api/profile [PUT]');

  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('error', 'API', 'Missing or invalid Authorization header');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase ID token
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      traceLogger.log('error', 'API', 'Validation error', {
        errors: validationResult.error.errors,
      });
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    traceLogger.log('info', 'API', 'Updating user profile', { userId, fields: Object.keys(updateData) });

    // Build type-safe update payload
    const updatePayload: UpdateUserData = {};
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.bio !== undefined) updatePayload.bio = updateData.bio;
    if (updateData.profilePicture !== undefined) updatePayload.profilePicture = updateData.profilePicture;
    if (updateData.preferences !== undefined) {
      // Fetch current preferences and merge
      const userRepo = new AdminUserRepository();
      const currentUser = await userRepo.getById(userId);
      if (currentUser) {
        updatePayload.preferences = {
          ...currentUser.preferences,
          ...updateData.preferences,
        };
      }
    }

    // Update user in Firestore
    const userRepo = new AdminUserRepository();
    await userRepo.update(userId, updatePayload);

    // Fetch updated user
    const updatedUser = await userRepo.getById(userId);

    if (!updatedUser) {
      traceLogger.log('error', 'API', 'User not found after update', { userId });
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    traceLogger.log('success', 'API', 'Profile updated successfully', { userId });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      profile: {
        uid: userId,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        bio: updatedUser.bio,
        profilePicture: updatedUser.profilePicture,
        language: updatedUser.language,
        preferences: updatedUser.preferences,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to update profile', { error: error.message });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
