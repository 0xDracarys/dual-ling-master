/**
 * User Repository (Firebase Admin SDK - Server-side)
 * 
 * Data access layer for user documents in Firestore using Admin SDK.
 * Use this for server-side operations (API routes, server components).
 * 
 * @example
 * import { AdminUserRepository } from '@/lib/services/auth/user.repository.admin';
 * 
 * const userRepo = new AdminUserRepository();
 * const user = await userRepo.getById(uid);
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import type { FirestoreUser, CreateUserData, UpdateUserData } from './user.repository';

export class AdminUserRepository {
  private collectionName = 'users';

  /**
   * Get user by ID
   */
  async getById(uid: string): Promise<FirestoreUser | null> {
    const spanId = traceLogger.startSpan('Firestore', 'users.getById', { uid });

    try {
      traceLogger.log('info', 'Firestore', `Fetching user by ID: ${uid}`);

      const db = getAdminDb();
      const userDoc = await db.collection(this.collectionName).doc(uid).get();

      if (!userDoc.exists) {
        traceLogger.log('warn', 'Firestore', 'User not found', { uid });
        traceLogger.endSpan(spanId, 'success');
        return null;
      }

      const data = userDoc.data() as any;
      traceLogger.log('success', 'Firestore', 'User fetched successfully');
      traceLogger.endSpan(spanId, 'success');

      // Convert Firestore Timestamps to Date objects
      return {
        ...data,
        subscription: data.subscription ? {
          ...data.subscription,
          startDate: data.subscription.startDate?.toDate ? data.subscription.startDate.toDate() : (data.subscription.startDate?._seconds ? new Date(data.subscription.startDate._seconds * 1000) : new Date()),
          endDate: data.subscription.endDate ? (data.subscription.endDate?.toDate ? data.subscription.endDate.toDate() : new Date(data.subscription.endDate._seconds * 1000)) : null,
        } : {
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: null,
        },
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt?._seconds ? new Date(data.updatedAt._seconds * 1000) : new Date()),
      } as FirestoreUser;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to fetch user', error);
      traceLogger.endSpan(spanId, 'error', {
        message: error.message || 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<FirestoreUser | null> {
    traceLogger.log('info', 'Firestore', 'Fetching user by email', { email });

    try {
      const db = getAdminDb();
      const snapshot = await db
        .collection(this.collectionName)
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        traceLogger.log('warn', 'Firestore', 'User not found', { email });
        return null;
      }

      const data = snapshot.docs[0].data() as any;
      traceLogger.log('info', 'Firestore', 'User fetched successfully', { email });

      return {
        ...data,
        subscription: data.subscription ? {
          ...data.subscription,
          startDate: data.subscription.startDate?.toDate ? data.subscription.startDate.toDate() : (data.subscription.startDate?._seconds ? new Date(data.subscription.startDate._seconds * 1000) : new Date()),
          endDate: data.subscription.endDate ? (data.subscription.endDate?.toDate ? data.subscription.endDate.toDate() : new Date(data.subscription.endDate._seconds * 1000)) : null,
        } : {
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: null,
        },
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt?._seconds ? new Date(data.createdAt._seconds * 1000) : new Date()),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt?._seconds ? new Date(data.updatedAt._seconds * 1000) : new Date()),
      } as FirestoreUser;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to fetch user by email', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(uid: string, data: CreateUserData): Promise<FirestoreUser> {
    const spanId = traceLogger.startSpan('Firestore', 'users.create', { uid });

    try {
      traceLogger.log('info', 'Firestore', `Creating user document: ${uid}`);

      const db = getAdminDb();
      const now = new Date();
      const userData: any = {
        ...data,
        subscription: {
          ...data.subscription,
          startDate: data.subscription.startDate,
          endDate: data.subscription.endDate || null,
        },
        createdAt: now,
        updatedAt: now,
      };

      await db.collection(this.collectionName).doc(uid).set(userData);

      traceLogger.log('success', 'Firestore', 'User document created');
      traceLogger.endSpan(spanId, 'success');

      return {
        ...data,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'User creation failed', error);
      traceLogger.endSpan(spanId, 'error', {
        message: error.message || 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update user document
   */
  async update(uid: string, data: UpdateUserData): Promise<void> {
    traceLogger.log('info', 'Firestore', 'Updating user document', { uid, fields: Object.keys(data) });

    try {
      const db = getAdminDb();
      const updateData: any = {
        ...data,
        updatedAt: new Date(),
      };

      await db.collection(this.collectionName).doc(uid).update(updateData);

      traceLogger.log('info', 'Firestore', 'User document updated', { uid });
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to update user', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete user document
   */
  async delete(uid: string): Promise<void> {
    traceLogger.log('info', 'Firestore', 'Deleting user document', { uid });

    try {
      const db = getAdminDb();
      await db.collection(this.collectionName).doc(uid).delete();
      traceLogger.log('info', 'Firestore', 'User document deleted', { uid });
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to delete user', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user stats
   */
  async updateStats(uid: string, stats: Partial<FirestoreUser['stats']>): Promise<void> {
    traceLogger.log('info', 'Firestore', 'Updating user stats', { uid, stats });

    try {
      const db = getAdminDb();
      await db.collection(this.collectionName).doc(uid).update({
        stats,
        updatedAt: new Date(),
      });

      traceLogger.log('info', 'Firestore', 'User stats updated', { uid });
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to update user stats', { error: error.message });
      throw error;
    }
  }
}
