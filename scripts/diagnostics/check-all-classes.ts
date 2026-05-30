/**
 * Check ALL classes for a specific teacher (regardless of status)
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';

if (!getApps().length) {
  const serviceAccountPath = path.join(process.cwd(), 'paji-duolingo-firebase-adminsdk-fbsvc-efc8f93eb1.json');
  initializeApp({
    credential: cert(serviceAccountPath),
    projectId: 'paji-duolingo',
  });
}

const db = getFirestore();
const teacherId = 'JiK83SdNuiMkv4QaPfYm4FuNFCr2';

async function checkAllClasses() {
  console.log(`\n🔍 Checking ALL classes for teacher: ${teacherId}\n`);

  const snapshot = await db
    .collection('classes')
    .where('teacherId', '==', teacherId)
    .get();

  console.log(`📊 Total classes (all statuses): ${snapshot.docs.length}\n`);

  snapshot.docs.forEach((doc, index) => {
    const data = doc.data();
    console.log(`📌 Class ${index + 1}: ${doc.id}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Course ID: ${data.courseId || 'N/A'}`);
    console.log(`   Start Time: ${data.startTime.toDate().toISOString()}`);
    console.log(`   Type: ${data.type || 'N/A'}`);
    console.log(`   Participants: ${data.participants?.studentIds?.length || 0} students\n`);
  });
}

checkAllClasses()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
