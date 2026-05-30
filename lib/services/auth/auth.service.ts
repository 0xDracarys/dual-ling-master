/**
 * Authentication Service (Firebase)
 * 
 * Handles all Firebase Authentication operations with integrated debug logging.
 * This service replaces the previous JWT-based authentication system.
 * 
 * Features:
 * - Email/password authentication
 * - Google Sign-In (OAuth)
 * - Password reset
 * - Email verification
 * - Custom claims (role-based access control)
 * - Integrated debug logging
 * 
 * @example
 * import { AuthService } from '@/lib/services/auth/auth.service';
 * 
 * const authService = new AuthService();
 * const user = await authService.registerUser(email, password, name);
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { UserRepository } from './user.repository';
import { traceLogger } from '@/lib/tracing/trace-logger';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'student' | 'teacher';
  language?: 'en' | 'lt';
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin';
  emailVerified: boolean;
  photoURL?: string;
}

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  /**
   * Register a new user with email and password
   */
  async registerUser(data: RegisterData): Promise<UserProfile> {
    const spanId = traceLogger.startSpan('Auth', 'registerUser', {
      emailDomain: data.email.split('@')[1]
    });

    try {
      traceLogger.log('info', 'Auth', 'Starting user registration', {
        emailDomain: data.email.split('@')[1],
        name: data.name
      });

      // Step 1: Create Firebase Auth user
      traceLogger.log('info', 'Auth', 'Creating Firebase Auth user');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      const firebaseUser = userCredential.user;
      traceLogger.log('success', 'Auth', 'Firebase Auth user created', { uid: firebaseUser.uid });

      // Step 2: Update display name
      traceLogger.log('info', 'Auth', 'Updating user profile');
      await updateProfile(firebaseUser, { displayName: data.name });
      traceLogger.log('success', 'Auth', 'User profile updated');

      // Step 3: Create Firestore user document
      traceLogger.log('info', 'Auth', 'Creating Firestore user document');
      const firestoreUser = await this.userRepo.create(firebaseUser.uid, {
        email: data.email,
        name: data.name,
        role: data.role || 'student',
        language: data.language || 'en',
        profilePicture: null,
        bio: null,
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          endDate: null,
        },
        stats: {
          coursesCompleted: 0,
          lessonsCompleted: 0,
          totalXP: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        preferences: {
          theme: 'system',
          emailNotifications: true,
          pushNotifications: true,
        },
      });

      traceLogger.log('success', 'Auth', 'Firestore user document created');

      // Step 4: Set custom claims (role) on Firebase token
      traceLogger.log('info', 'Auth', 'Setting custom claims for role-based access');
      const { getAdminAuth } = await import('@/lib/firebase/admin');
      await getAdminAuth().setCustomUserClaims(firebaseUser.uid, {
        role: data.role || 'student',
      });
      traceLogger.log('success', 'Auth', 'Custom claims set', {
        role: data.role || 'student',
      });

      // Step 5: Send email verification
      traceLogger.log('info', 'Auth', 'Sending email verification');
      await sendEmailVerification(firebaseUser);
      traceLogger.log('success', 'Auth', 'Email verification sent');

      traceLogger.endSpan(spanId, 'success');

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: data.name,
        role: data.role || 'student',
        emailVerified: false,
        photoURL: firebaseUser.photoURL || undefined,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Auth', 'Registration failed', error);
      traceLogger.endSpan(spanId, 'error', {
        message: error.message,
        stack: error.code ? `Error code: ${error.code}\n${error.stack}` : error.stack,
      });

      // Handle specific Firebase errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Use at least 6 characters');
      }

      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async loginWithEmail(
    email: string,
    password: string
  ): Promise<{ userProfile: UserProfile; idToken: string; refreshToken: string; tokenExpiresAt: number | null }> {
    const spanId = traceLogger.startSpan('Auth', 'loginWithEmail', {
      emailDomain: email.split('@')[1]
    });

    try {
      traceLogger.log('info', 'Auth', 'User login attempt', { emailDomain: email.split('@')[1] });

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  const refreshToken = firebaseUser.refreshToken;

      traceLogger.log('success', 'Auth', 'Firebase Auth login successful', { uid: firebaseUser.uid });

      // Get user role from Firestore
      traceLogger.log('info', 'Auth', 'Fetching user document from Firestore');
      const firestoreUser = await this.userRepo.getById(firebaseUser.uid);

      if (!firestoreUser) {
        traceLogger.log('error', 'Auth', 'User document not found in Firestore', { uid: firebaseUser.uid });
        traceLogger.endSpan(spanId, 'error', { message: 'User profile not found' });
        throw new Error('User profile not found');
      }

      if (!firestoreUser.role) {
        traceLogger.log('error', 'Auth', 'User document missing role field', {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
        });
        traceLogger.endSpan(spanId, 'error', { message: 'User profile is missing role information' });
        throw new Error('User profile is missing role information. Please contact support.');
      }

      const userRole = firestoreUser.role;

      traceLogger.log('success', 'Auth', 'User document retrieved');

      // Ensure Firebase custom claims include the latest role
      traceLogger.log('info', 'Auth', 'Syncing custom claims for role-based access', {
        uid: firebaseUser.uid,
        role: userRole,
      });

      try {
        const { getAdminAuth } = await import('@/lib/firebase/admin');
        const adminAuth = getAdminAuth();
        const userRecord = await adminAuth.getUser(firebaseUser.uid);
        const existingClaims = userRecord.customClaims || {};

        if (existingClaims.role !== userRole) {
          await adminAuth.setCustomUserClaims(firebaseUser.uid, {
            ...existingClaims,
            role: userRole,
          });
          traceLogger.log('success', 'Auth', 'Custom claims updated', {
            uid: firebaseUser.uid,
            role: userRole,
          });
        } else {
          traceLogger.log('debug', 'Auth', 'Custom claims already up to date', {
            uid: firebaseUser.uid,
            role: userRole,
          });
        }
      } catch (claimsError: any) {
        traceLogger.log('error', 'Auth', 'Failed to sync custom claims', {
          uid: firebaseUser.uid,
          error: claimsError.message,
        });
      }

      // Get Firebase ID token (force refresh to include latest claims)
      traceLogger.log('info', 'Auth', 'Getting Firebase ID token');
      let idToken: string;
      try {
        idToken = await firebaseUser.getIdToken(true);
      } catch (tokenError: any) {
        traceLogger.log('warn', 'Auth', 'Forced token refresh failed, using cached token', {
          uid: firebaseUser.uid,
          error: tokenError.message,
        });
        idToken = await firebaseUser.getIdToken();
      }

      let tokenExpiresAt: number | null = null;
      try {
        const tokenPayload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString('utf8')) as { exp?: number };
        tokenExpiresAt = tokenPayload.exp ? tokenPayload.exp * 1000 : null;
      } catch (decodeError) {
        traceLogger.log('warn', 'Auth', 'Unable to decode token expiration', {
          uid: firebaseUser.uid,
          error: decodeError instanceof Error ? decodeError.message : 'Unknown decode error',
        });
        tokenExpiresAt = null;
      }

      traceLogger.log('success', 'Auth', 'Firebase ID token retrieved');
      traceLogger.endSpan(spanId, 'success');

      const userProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firestoreUser.name,
        role: userRole,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL || undefined,
      };

      return {
        userProfile,
        idToken,
        refreshToken,
        tokenExpiresAt,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Auth', 'Login failed', error);
      traceLogger.endSpan(spanId, 'error', {
        message: error.message,
        stack: error.code ? `Error code: ${error.code}` : undefined,
      });

      if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password');
      }

      throw error;
    }
  }

  /**
   * Login with Google (OAuth)
   */
  async loginWithGoogle(): Promise<UserProfile> {
    traceLogger.log('info', 'Auth', 'Google Sign-In initiated');

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const firebaseUser = userCredential.user;

      traceLogger.log('info', 'Auth', 'Google Sign-In successful', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });

      // Check if user document exists
      let firestoreUser = await this.userRepo.getById(firebaseUser.uid);

      // Create user document if it doesn't exist (first-time Google login)
      if (!firestoreUser) {
        traceLogger.log('info', 'Auth', 'Creating new user document for Google user');

        firestoreUser = await this.userRepo.create(firebaseUser.uid, {
          email: firebaseUser.email!,
          name: firebaseUser.displayName || 'User',
          role: 'student',
          language: 'en',
          profilePicture: firebaseUser.photoURL,
          bio: null,
          subscription: {
            plan: 'free',
            status: 'active',
            startDate: new Date(),
            endDate: null,
          },
          stats: {
            coursesCompleted: 0,
            lessonsCompleted: 0,
            totalXP: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
          preferences: {
            theme: 'system',
            emailNotifications: true,
            pushNotifications: true,
          },
        });

        traceLogger.log('info', 'Auth', 'User document created for Google user', { uid: firebaseUser.uid });
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firestoreUser.name,
        role: firestoreUser.role,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL || undefined,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Auth', 'Google Sign-In failed', { error: error.message });

      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email');
      }

      throw error;
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    const spanId = traceLogger.startSpan('Auth', 'logout');

    try {
      const currentUser = auth.currentUser;
      traceLogger.log('info', 'Auth', 'User logout initiated', { uid: currentUser?.uid });

      await signOut(auth);

      traceLogger.log('success', 'Auth', 'User logged out successfully');
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Auth', 'Logout failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const spanId = traceLogger.startSpan('Auth', 'resetPassword', {
      emailDomain: email.split('@')[1]
    });

    try {
      traceLogger.log('info', 'Auth', 'Password reset requested', { emailDomain: email.split('@')[1] });

      await sendPasswordResetEmail(auth, email);

      traceLogger.log('success', 'Auth', 'Password reset email sent');
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Auth', 'Password reset failed', error);
      traceLogger.endSpan(spanId, 'error', {
        message: error.message,
        stack: error.code ? `Error code: ${error.code}` : undefined,
      });

      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address');
      }

      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(): Promise<void> {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('No user logged in');
    }

    traceLogger.log('info', 'Auth', 'Resending email verification', { uid: currentUser.uid });

    try {
      await sendEmailVerification(currentUser);
      traceLogger.log('info', 'Auth', 'Email verification sent', { email: currentUser.email });
    } catch (error: any) {
      traceLogger.log('error', 'Auth', 'Failed to send verification email', { error: error.message });
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      return null;
    }

    try {
      const firestoreUser = await this.userRepo.getById(firebaseUser.uid);

      if (!firestoreUser) {
        traceLogger.log('warn', 'Auth', 'User document not found', { uid: firebaseUser.uid });
        return null;
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        name: firebaseUser.displayName || firestoreUser.name,
        role: firestoreUser.role,
        emailVerified: firebaseUser.emailVerified,
        photoURL: firebaseUser.photoURL || undefined,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Auth', 'Failed to get current user', { error: error.message });
      return null;
    }
  }
}
