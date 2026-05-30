/**
 * Script to fix/update user profile documents in Firestore
 * Run with: npx tsx scripts/fix-user-profile.ts <userId>
 */

import { getAdminDb } from '../lib/firebase/admin';

const userId = process.argv[2];

if (!userId) {
  console.error('Usage: npx tsx scripts/fix-user-profile.ts <userId>');
  process.exit(1);
}

async function fixUserProfile() {
  const db = getAdminDb();
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    console.error(`User ${userId} not found in Firestore`);
    process.exit(1);
  }

  const currentData = userDoc.data();
  console.log('Current user data:', JSON.stringify(currentData, null, 2));

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

  console.log('\nApplying updates:', JSON.stringify(updates, null, 2));

  await userRef.update(updates);

  console.log('\n✅ User profile updated successfully');

  // Fetch and display updated document
  const updatedDoc = await userRef.get();
  console.log('\nUpdated user data:', JSON.stringify(updatedDoc.data(), null, 2));
}

fixUserProfile()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fixing user profile:', error);
    process.exit(1);
  });
