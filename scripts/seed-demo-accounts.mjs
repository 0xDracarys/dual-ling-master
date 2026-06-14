/**
 * Seed Demo Accounts for Dual-Ling Platform
 * Run with: node scripts/seed-demo-accounts.mjs
 *
 * Creates the following demo accounts in Firebase:
 *  - super.admin@dualliing.com   (admin)
 *  - admin@dualliing.com         (admin)
 *  - teacher@dualliing.com       (teacher)
 *  - student@dualliing.com       (student)
 *
 * All passwords: Demo@2025!
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';


const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually parse .env.local
const envPath = resolve(__dirname, '../.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"([\s\S]*)"$/, '$1');
    if (!process.env[key]) process.env[key] = val;
  }
} catch (e) {
  console.warn('Could not read .env.local:', e.message);
}


// ─── Init Firebase Admin ─────────────────────────────────────────────────────
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Missing Firebase Admin credentials in .env.local');
    process.exit(1);
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const auth = getAuth();
const db = getFirestore();

// ─── Demo Accounts ────────────────────────────────────────────────────────────
const DEMO_PASSWORD = 'Demo@2025!';

const demoAccounts = [
  {
    email: 'super.admin@dualliing.com',
    displayName: 'Super Admin',
    username: 'superadmin',
    role: 'admin',
    firstName: 'Super',
    lastName: 'Admin',
    bio: 'Platform super administrator — full access to all features.',
  },
  {
    email: 'admin@dualliing.com',
    displayName: 'Admin User',
    username: 'adminuser',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    bio: 'Platform administrator managing users, courses and analytics.',
  },
  {
    email: 'teacher@dualliing.com',
    displayName: 'Evelina Teacher',
    username: 'evelina_teacher',
    role: 'teacher',
    firstName: 'Evelina',
    lastName: 'Teacher',
    bio: 'English language teacher with 5+ years of experience. Creator of multiple English courses.',
  },
  {
    email: 'student@dualliing.com',
    displayName: 'Demo Student',
    username: 'demo_student',
    role: 'student',
    firstName: 'Demo',
    lastName: 'Student',
    bio: 'Language learner enrolled in English beginner courses.',
  },
];

// ─── Helper: Create or Update User ───────────────────────────────────────────
async function upsertUser(account) {
  const { email, displayName, username, role, firstName, lastName, bio } = account;

  let uid;
  let action;

  try {
    // Try to get existing user
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    action = 'updated';

    // Update the auth user
    await auth.updateUser(uid, {
      displayName,
      password: DEMO_PASSWORD,
      emailVerified: true,
    });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      // Create new user
      const created = await auth.createUser({
        email,
        password: DEMO_PASSWORD,
        displayName,
        emailVerified: true,
      });
      uid = created.uid;
      action = 'created';
    } else {
      throw err;
    }
  }

  // Set custom claims for role-based auth
  await auth.setCustomUserClaims(uid, { role });

  // Upsert Firestore user document
  const now = Timestamp.now();
  await db.collection('users').doc(uid).set(
    {
      uid,
      email,
      username,
      displayName,
      firstName,
      lastName,
      bio,
      role,
      isActive: true,
      emailVerified: true,
      enrolledCourses: [],
      completedCourses: [],
      // Required by UserRepository schema
      name: displayName,
      language: 'en',
      profilePicture: null,
      subscription: {
        plan: 'free',
        status: 'active',
        startDate: now,
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
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    },
    { merge: true }
  );


  return { uid, action };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🚀 Seeding Demo Accounts for Dual-Ling Platform\n');
  console.log('━'.repeat(60));

  const results = [];

  for (const account of demoAccounts) {
    try {
      const { uid, action } = await upsertUser(account);
      console.log(`✅ [${account.role.padEnd(7)}] ${action.padEnd(7)} → ${account.email} (uid: ${uid})`);
      results.push({ ...account, uid, action });
    } catch (err) {
      console.error(`❌ Failed for ${account.email}: ${err.message}`);
    }
  }

  console.log('\n' + '━'.repeat(60));
  console.log('\n📋 DEMO ACCOUNT CREDENTIALS\n');
  console.log('━'.repeat(60));
  console.log(`${'ROLE'.padEnd(14)} ${'EMAIL'.padEnd(35)} PASSWORD`);
  console.log('─'.repeat(60));

  for (const acc of demoAccounts) {
    const roleLabel = `[${acc.role}]`.padEnd(14);
    console.log(`${roleLabel} ${acc.email.padEnd(35)} ${DEMO_PASSWORD}`);
  }

  console.log('\n📌 DASHBOARDS:');
  console.log('  Admin/Super Admin → http://localhost:3000/admin/dashboard');
  console.log('  Teacher           → http://localhost:3000/teacher/dashboard');
  console.log('  Student           → http://localhost:3000/dashboard');
  console.log('  Demo Info Page    → http://localhost:3000/demo');
  console.log('\n' + '━'.repeat(60));
  console.log('\n✨ Done! All demo accounts are ready.\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
