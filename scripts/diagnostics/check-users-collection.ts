/**
 * Check Firestore users collection for student profile data
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

async function checkUsersCollection() {
  console.log('\n🔍 Checking Firestore users collection\n');

  // Check a known student ID from the classes
  const studentIds = [
    '4Qa5P0ZaUQZrIWibt6vURjRGzg33',  // From instant meeting
    'vtr2UUU22RfJxSeuwTyhYKgyD4G2',  // From enrollment checks
  ];

  for (const studentId of studentIds) {
    const doc = await db.collection('users').doc(studentId).get();
    
    if (doc.exists) {
      const data = doc.data();
      console.log(`✅ User ${studentId} exists:`);
      console.log(`   Display Name: ${data?.displayName || 'N/A'}`);
      console.log(`   Email: ${data?.email || 'N/A'}`);
      console.log(`   Role: ${data?.role || 'N/A'}`);
      console.log(`   All fields: ${Object.keys(data || {}).join(', ')}\n`);
    } else {
      console.log(`❌ User ${studentId} NOT found in Firestore\n`);
    }
  }
}

checkUsersCollection()
  .then(() => {
    console.log('✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
