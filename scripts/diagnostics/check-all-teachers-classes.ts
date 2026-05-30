/**
 * Check classes for ALL teachers to understand the data state
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

async function checkAllClasses() {
  console.log(`\n🔍 Checking ALL classes in database\n`);

  const snapshot = await db.collection('classes').get();

  console.log(`📊 Total classes (all teachers): ${snapshot.docs.length}\n`);

  const classesByTeacher = new Map<string, any[]>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    const teacherId = data.teacherId;
    
    if (!classesByTeacher.has(teacherId)) {
      classesByTeacher.set(teacherId, []);
    }
    
    classesByTeacher.get(teacherId)!.push({
      id: doc.id,
      ...data
    });
  });

  console.log(`👥 Number of teachers with classes: ${classesByTeacher.size}\n`);

  for (const [teacherId, classes] of classesByTeacher.entries()) {
    console.log(`\n📌 Teacher: ${teacherId}`);
    console.log(`   Total classes: ${classes.length}`);
    
    classes.forEach((classData, index) => {
      console.log(`   ${index + 1}. ${classData.id}`);
      console.log(`      Status: ${classData.status}`);
      console.log(`      Type: ${classData.type || 'N/A'}`);
      console.log(`      Start: ${classData.startTime.toDate().toISOString()}`);
      console.log(`      Course: ${classData.courseId || 'N/A'}`);
      console.log(`      Students: ${classData.participants?.studentIds?.length || 0}`);
    });
  }
}

checkAllClasses()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
