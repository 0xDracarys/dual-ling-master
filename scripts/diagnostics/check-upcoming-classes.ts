/**
 * Check all upcoming classes for a specific teacher
 * Used to debug visibility issues
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), 'paji-duolingo-firebase-adminsdk-fbsvc-efc8f93eb1.json');
  
  initializeApp({
    credential: cert(serviceAccountPath),
    projectId: 'paji-duolingo',
  });
}

const db = getFirestore();

async function checkUpcomingClasses() {
  const teacherId = 'JiK83SdNuiMkv4QaPfYm4FuNFCr2'; // Test 7 teacher

  console.log(`\n🔍 Checking upcoming classes for teacher: ${teacherId}\n`);

  const now = Timestamp.now();
  const futureDate30 = Timestamp.fromMillis(now.toMillis() + 30 * 24 * 60 * 60 * 1000);
  const futureDate7 = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000);

  console.log(`📅 Current time: ${now.toDate().toISOString()}`);
  console.log(`📅 7-day window ends: ${futureDate7.toDate().toISOString()}`);
  console.log(`📅 30-day window ends: ${futureDate30.toDate().toISOString()}\n`);

  // Fetch all scheduled classes
  const snapshot = await db
    .collection('classes')
    .where('teacherId', '==', teacherId)
    .where('status', '==', 'scheduled')
    .orderBy('startTime', 'asc')
    .get();

  console.log(`📊 Total scheduled classes: ${snapshot.docs.length}\n`);

  if (snapshot.docs.length === 0) {
    console.log('❌ No scheduled classes found in database');
    return;
  }

  // Analyze each class
  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    const startTime = data.startTime as Timestamp;
    const daysFromNow = (startTime.toMillis() - now.toMillis()) / (1000 * 60 * 60 * 24);

    const within7Days = startTime.toMillis() <= futureDate7.toMillis();
    const within30Days = startTime.toMillis() <= futureDate30.toMillis();

    console.log(`📌 Class ${index + 1}: ${doc.id}`);
    console.log(`   Course ID: ${data.courseId || 'N/A'}`);
    console.log(`   Start Time: ${startTime.toDate().toISOString()}`);
    console.log(`   Days from now: ${daysFromNow.toFixed(1)} days`);
    console.log(`   Within 7-day window: ${within7Days ? '✅ YES' : '❌ NO'}`);
    console.log(`   Within 30-day window: ${within30Days ? '✅ YES' : '❌ NO'}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Participants: ${data.participants?.studentIds?.length || 0} students\n`);
  });

  // Count by window
  const within7Count = snapshot.docs.filter(doc => {
    const startTime = doc.data().startTime as Timestamp;
    return startTime.toMillis() <= futureDate7.toMillis();
  }).length;

  const within30Count = snapshot.docs.filter(doc => {
    const startTime = doc.data().startTime as Timestamp;
    return startTime.toMillis() <= futureDate30.toMillis();
  }).length;

  console.log(`\n📈 Summary:`);
  console.log(`   Classes within 7 days: ${within7Count}`);
  console.log(`   Classes within 30 days: ${within30Count}`);
  console.log(`   Classes beyond 30 days: ${snapshot.docs.length - within30Count}\n`);
}

checkUpcomingClasses()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
