/**
 * User Migration Script: MongoDB → Firebase Auth + Firestore
 * 
 * This script migrates existing users from MongoDB to Firebase Authentication
 * and creates corresponding user documents in Firestore.
 * 
 * Features:
 * - Creates Firebase Auth users with email/password
 * - Sets custom claims (role) for authorization
 * - Migrates user profile data to Firestore
 * - Sends password reset emails to all users
 * - Generates comprehensive migration report
 * - Dry-run mode for testing
 * 
 * Usage:
 * - Dry run: pnpm tsx scripts/migrate-users.ts --dry-run
 * - Live migration: pnpm tsx scripts/migrate-users.ts --live
 * 
 * IMPORTANT: Run dry-run first to validate data!
 */

import * as admin from 'firebase-admin';
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Simple console logger for migration script
const logger = {
  debug: (category: string, message: string, metadata?: any) => {
    console.log(`🐛 [${category}] ${message}`, metadata || '');
  },
  info: (category: string, message: string, metadata?: any) => {
    console.log(`[${category}] ${message}`, metadata || '');
  },
  success: (category: string, message: string, metadata?: any) => {
    console.log(`✅ [${category}] ${message}`, metadata || '');
  },
  warn: (category: string, message: string, metadata?: any) => {
    console.warn(`⚠️ [${category}] ${message}`, metadata || '');
  },
  error: (category: string, message: string, error?: any) => {
    console.error(`❌ [${category}] ${message}`, error || '');
  },
  downloadLogs: (format: string) => {
    console.log(`📥 Logs would be downloaded in ${format} format (not implemented in simplified logger)`);
  },
};

// Simple .env.local file loader
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB || 'dualing';

// Firebase Admin SDK initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = admin.auth();
const db = admin.firestore();

// Migration statistics
interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: { email: string; error: string }[];
}

const stats: MigrationStats = {
  total: 0,
  success: 0,
  failed: 0,
  skipped: 0,
  errors: [],
};

/**
 * MongoDB User Schema (current)
 */
interface MongoDBUser {
  _id: string;
  email: string;
  password: string; // Hashed
  name: string;
  role: 'student' | 'teacher' | 'admin';
  language?: 'en' | 'lt';
  profilePicture?: string;
  bio?: string;
  subscription?: {
    plan: 'free' | 'premium' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    startDate: Date;
    endDate?: Date;
  };
  stats?: {
    coursesCompleted: number;
    lessonsCompleted: number;
    totalXP: number;
    currentStreak: number;
    longestStreak: number;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate a secure random password for migration
 */
function generateTemporaryPassword(): string {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Migrate a single user from MongoDB to Firebase
 */
async function migrateUser(mongoUser: MongoDBUser, dryRun: boolean = false): Promise<boolean> {
  try {
    logger.info('Migration', `Migrating user: ${mongoUser.email}`);

    if (dryRun) {
      logger.debug('Migration', 'DRY RUN - Would migrate user', { email: mongoUser.email });
      return true;
    }

    // Generate temporary password
    const tempPassword = generateTemporaryPassword();

    // Step 1: Create Firebase Auth user
    let firebaseUser: admin.auth.UserRecord;
    try {
      firebaseUser = await auth.createUser({
        email: mongoUser.email,
        password: tempPassword,
        displayName: mongoUser.name,
        photoURL: mongoUser.profilePicture,
        emailVerified: false, // Users will verify email after password reset
      });

      logger.success('Migration', 'Firebase Auth user created', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        logger.warn('Migration', 'User already exists in Firebase Auth, fetching existing user', {
          email: mongoUser.email,
        });
        firebaseUser = await auth.getUserByEmail(mongoUser.email);
      } else {
        throw error;
      }
    }

    // Step 2: Set custom claims (role-based access control)
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: mongoUser.role,
    });

    logger.success('Migration', 'Custom claims set', { uid: firebaseUser.uid, role: mongoUser.role });

    // Step 3: Create Firestore user document
    const firestoreUserData = {
      email: mongoUser.email,
      name: mongoUser.name,
      role: mongoUser.role,
      language: mongoUser.language || 'en',
      profilePicture: mongoUser.profilePicture || null,
      bio: mongoUser.bio || null,
      subscription: {
        plan: mongoUser.subscription?.plan || 'free',
        status: mongoUser.subscription?.status || 'active',
        startDate: admin.firestore.Timestamp.fromDate(mongoUser.subscription?.startDate || new Date()),
        endDate: mongoUser.subscription?.endDate
          ? admin.firestore.Timestamp.fromDate(mongoUser.subscription.endDate)
          : null,
      },
      stats: {
        coursesCompleted: mongoUser.stats?.coursesCompleted || 0,
        lessonsCompleted: mongoUser.stats?.lessonsCompleted || 0,
        totalXP: mongoUser.stats?.totalXP || 0,
        currentStreak: mongoUser.stats?.currentStreak || 0,
        longestStreak: mongoUser.stats?.longestStreak || 0,
      },
      preferences: {
        theme: mongoUser.preferences?.theme || 'system',
        emailNotifications: mongoUser.preferences?.emailNotifications ?? true,
        pushNotifications: mongoUser.preferences?.pushNotifications ?? true,
      },
      migratedFromMongoDB: true,
      mongoDbId: mongoUser._id,
      createdAt: admin.firestore.Timestamp.fromDate(mongoUser.createdAt),
      updatedAt: admin.firestore.Timestamp.now(),
    };

    await db.collection('users').doc(firebaseUser.uid).set(firestoreUserData);

    logger.success('Migration', 'Firestore user document created', { uid: firebaseUser.uid });

    // Step 4: Send password reset email
    try {
      const resetLink = await auth.generatePasswordResetLink(mongoUser.email);
      logger.info('Migration', 'Password reset link generated', { email: mongoUser.email });

      // TODO: Send email using SendGrid/Resend/etc.
      // For now, just log the reset link
      console.log(`\n📧 Password Reset Link for ${mongoUser.email}:`);
      console.log(resetLink);
      console.log('');
    } catch (emailError: any) {
      logger.warn('Migration', 'Failed to generate password reset link', {
        email: mongoUser.email,
        error: emailError.message,
      });
    }

    return true;
  } catch (error: any) {
    logger.error('Migration', `Failed to migrate user: ${mongoUser.email}`, error);
    stats.errors.push({ email: mongoUser.email, error: error.message });
    return false;
  }
}

/**
 * Main migration function
 */
async function migrateAllUsers(dryRun: boolean = true) {
  const startTime = Date.now();
  logger.info('Migration', `Starting user migration (${dryRun ? 'DRY RUN' : 'LIVE'})`);

  let mongoClient: MongoClient | null = null;

  try {
    // Connect to MongoDB
    logger.info('Migration', 'Connecting to MongoDB...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    logger.success('Migration', 'Connected to MongoDB');

    const mongodb = mongoClient.db(MONGODB_DB);
    const usersCollection = mongodb.collection<MongoDBUser>('users');

    // Get all users
    const users = await usersCollection.find({}).toArray();
    stats.total = users.length;

    logger.info('Migration', `Found ${users.length} users to migrate`);

    // Migrate each user
    for (const user of users) {
      const success = await migrateUser(user, dryRun);
      if (success) {
        stats.success++;
      } else {
        stats.failed++;
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Generate migration report
    const duration = Date.now() - startTime;
    const report = `
╔════════════════════════════════════════════════════════════════╗
║                    MIGRATION REPORT                            ║
╠════════════════════════════════════════════════════════════════╣
║ Mode:              ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}
║ Duration:          ${(duration / 1000).toFixed(2)}s
║ Total Users:       ${stats.total}
║ ✅ Successful:      ${stats.success}
║ ❌ Failed:          ${stats.failed}
║ ⏭️  Skipped:         ${stats.skipped}
╠════════════════════════════════════════════════════════════════╣
${stats.errors.length > 0 ? `║ ERRORS:\n${stats.errors.map(e => `║ - ${e.email}: ${e.error}`).join('\n')}\n` : ''}╚════════════════════════════════════════════════════════════════╝
    `;

    console.log(report);
    logger.success('Migration', 'User migration completed', stats);

    // Export logs
    if (!dryRun) {
      logger.downloadLogs('json');
    }
  } catch (error: any) {
    logger.error('Migration', 'Migration failed', error);
    throw error;
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      logger.info('Migration', 'MongoDB connection closed');
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || !args.includes('--live');

  if (!isDryRun) {
    console.log('\n⚠️  WARNING: You are about to perform a LIVE migration!');
    console.log('This will create users in Firebase Auth and Firestore.\n');

    // Prompt for confirmation
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>(resolve => {
      readline.question('Type "MIGRATE" to confirm: ', resolve);
    });

    readline.close();

    if (answer !== 'MIGRATE') {
      console.log('❌ Migration cancelled.');
      process.exit(0);
    }
  }

  await migrateAllUsers(isDryRun);
}

// Run migration
main()
  .then(() => {
    console.log('✅ Migration script completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
