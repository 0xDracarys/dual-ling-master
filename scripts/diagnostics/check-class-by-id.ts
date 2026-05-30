/**
 * Check specific class by ID
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
const classId = 'Esw1yvH9pEdypXc5IIfe';

async function checkClassById() {
  console.log(`\n🔍 Checking class: ${classId}\n`);

  const doc = await db.collection('classes').doc(classId).get();

  if (!doc.exists) {
    console.log('❌ Class does NOT exist in database');
  } else {
    const data = doc.data();
    console.log('✅ Class EXISTS in database');
    console.log(`   Status: ${data?.status}`);
    console.log(`   Course ID: ${data?.courseId || 'N/A'}`);
    console.log(`   Start Time: ${data?.startTime?.toDate().toISOString()}`);
    console.log(`   Teacher ID: ${data?.teacherId}`);
    console.log(`   Type: ${data?.type || 'N/A'}`);
    console.log(`   Participants: ${data?.participants?.studentIds?.length || 0} students`);
  }
}

checkClassById()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
