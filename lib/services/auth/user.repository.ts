/**
 * User Repository (Firestore)
 * 
 * Data access layer for user documents in Firestore.
 * Handles all CRUD operations for the users collection.
 * 
 * @example
 * import { UserRepository } from '@/lib/services/auth/user.repository';
 * 
 * const userRepo = new UserRepository();
 * const user = await userRepo.getById(uid);
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { traceLogger } from '@/lib/tracing/trace-logger';

export interface FirestoreUser {
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  language: 'en' | 'lt';
  profilePicture: string | null;
  bio: string | null;
  subscription: {
    plan: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    startDate: Date;
    endDate: Date | null;
  };
  stats: {
    coursesCompleted: number;
    lessonsCompleted: number;
    totalXP: number;
    currentStreak: number;
    longestStreak: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  migratedFromMongoDB?: boolean;
  mongoDbId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserData = Omit<FirestoreUser, 'createdAt' | 'updatedAt' | 'migratedFromMongoDB' | 'mongoDbId'>;
export type UpdateUserData = Partial<CreateUserData>;

export class UserRepository {
  private collectionName = 'users';

  /**
   * Get user by ID
   */
  async getById(uid: string): Promise<FirestoreUser | null> {
    const spanId = traceLogger.startSpan('Firestore', 'users.getById', { uid });

    try {
      traceLogger.log('info', 'Firestore', `Fetching user by ID: ${uid}`);

      const userDoc = await getDoc(doc(db, this.collectionName, uid));

      if (!userDoc.exists()) {
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
          startDate: data.subscription.startDate?.toDate?.() ?? new Date(),
          endDate: data.subscription.endDate?.toDate?.() ?? null,
        } : {
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: null,
        },
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
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
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email)
      );

      const snapshot = await getDocs(q);

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
          startDate: data.subscription.startDate?.toDate?.() ?? new Date(),
          endDate: data.subscription.endDate?.toDate?.() ?? null,
        } : {
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: null,
        },
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
        updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
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

      const now = new Date();
      const userData: any = {
        ...data,
        subscription: {
          ...data.subscription,
          startDate: Timestamp.fromDate(data.subscription.startDate),
          endDate: data.subscription.endDate ? Timestamp.fromDate(data.subscription.endDate) : null,
        },
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      await setDoc(doc(db, this.collectionName, uid), userData);

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
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      // Convert Date objects to Timestamps
      if (data.subscription) {
        updateData.subscription = {
          ...data.subscription,
          startDate: data.subscription.startDate ? Timestamp.fromDate(data.subscription.startDate) : undefined,
          endDate: data.subscription.endDate ? Timestamp.fromDate(data.subscription.endDate) : null,
        };
      }

      await updateDoc(doc(db, this.collectionName, uid), updateData);

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
      await deleteDoc(doc(db, this.collectionName, uid));
      traceLogger.log('info', 'Firestore', 'User document deleted', { uid });
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to delete user', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all users with a specific role
   */
  async getByRole(role: 'student' | 'teacher' | 'admin'): Promise<FirestoreUser[]> {
    traceLogger.log('info', 'Firestore', 'Fetching users by role', { role });

    try {
      const q = query(
        collection(db, this.collectionName),
        where('role', '==', role)
      );

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          ...data,
          subscription: data.subscription ? {
            ...data.subscription,
            startDate: data.subscription.startDate?.toDate?.() ?? new Date(),
            endDate: data.subscription.endDate?.toDate?.() ?? null,
          } : {
            plan: 'free',
            status: 'active',
            startDate: new Date(),
            endDate: null,
          },
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        } as FirestoreUser;
      });

      traceLogger.log('info', 'Firestore', 'Users fetched by role', { role, count: users.length });

      return users;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to fetch users by role', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all users (Admin only)
   */
  async getAll(): Promise<FirestoreUser[]> {
    traceLogger.log('info', 'Firestore', 'Fetching all users');

    try {
      const q = query(collection(db, this.collectionName));
      const snapshot = await getDocs(q);
      
      const users = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          ...data,
          subscription: data.subscription ? {
            ...data.subscription,
            startDate: data.subscription?.startDate?.toDate?.() ?? new Date(),
            endDate: data.subscription?.endDate?.toDate?.() ?? null,
          } : {
            plan: 'free',
            status: 'active',
            startDate: new Date(),
            endDate: null,
          },
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        };
      });

      traceLogger.log('info', 'Firestore', 'All users fetched', { count: users.length });
      return users;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to fetch all users', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user stats
   */
  async updateStats(uid: string, stats: Partial<FirestoreUser['stats']>): Promise<void> {
    traceLogger.log('info', 'Firestore', 'Updating user stats', { uid, stats });

    try {
      await updateDoc(doc(db, this.collectionName, uid), {
        stats,
        updatedAt: serverTimestamp(),
      });

      traceLogger.log('info', 'Firestore', 'User stats updated', { uid });
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to update user stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Update user subscription
   */
  async updateSubscription(uid: string, subscription: FirestoreUser['subscription']): Promise<void> {
    traceLogger.log('info', 'Firestore', 'Updating user subscription', { uid, plan: subscription.plan });

    try {
      await updateDoc(doc(db, this.collectionName, uid), {
        subscription: {
          ...subscription,
          startDate: Timestamp.fromDate(subscription.startDate),
          endDate: subscription.endDate ? Timestamp.fromDate(subscription.endDate) : null,
        },
        updatedAt: serverTimestamp(),
      });

      traceLogger.log('info', 'Firestore', 'User subscription updated', { uid });
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Failed to update user subscription', { error: error.message });
      throw error;
    }
  }
}
