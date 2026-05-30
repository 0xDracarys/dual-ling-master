/**
 * Check specific enrollment causing scheduled class error
 */

import { getAdminDb } from '@/lib/firebase/admin';

async function checkEnrollment() {
  console.log('🔍 Checking enrollment for scheduled class issue...\n');
  
  const db = getAdminDb();
  const studentId = 'vtr2UUU22RfJxSeuwTyhYKgyD4G2';
  const courseId = 'chdAiCPOgXjeUAwnPuhn';
  
  try {
    // Query enrollments collection
    const enrollmentsSnapshot = await db
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .where('userId', '==', studentId)
      .get();

    console.log(`📊 Query: enrollments where courseId="${courseId}" AND userId="${studentId}"`);
    console.log(`📈 Results found: ${enrollmentsSnapshot.size}\n`);

    if (enrollmentsSnapshot.empty) {
      console.log('❌ NO ENROLLMENT DOCUMENT FOUND');
      console.log('   This student is NOT enrolled in this course.\n');
      
      // Check all enrollments for this course
      console.log('🔍 Checking ALL enrollments for this course...\n');
      const allEnrollments = await db
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .get();
      
      console.log(`📊 Total enrollments for course: ${allEnrollments.size}`);
      allEnrollments.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.userName || 'Unknown'} (${data.userId}): status=${data.status || 'N/A'}`);
      });
      
      return;
    }

    // Display enrollment details
    enrollmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`✅ Enrollment document found: ${doc.id}`);
      console.log(`\n📄 Document data:`);
      console.log(`   userId: ${data.userId}`);
      console.log(`   courseId: ${data.courseId}`);
      console.log(`   status: ${data.status} ${data.status === 'active' ? '✅' : '❌ (SHOULD BE "active")'}`);
      console.log(`   userName: ${data.userName || 'N/A'}`);
      console.log(`   userEmail: ${data.userEmail || 'N/A'}`);
      console.log(`   enrolledAt: ${data.enrolledAt?.toDate?.() || 'N/A'}`);
      console.log(`\n🔍 Diagnosis:`);
      
      if (data.status === 'active') {
        console.log('   ✅ Status is "active" - enrollment is valid');
      } else {
        console.log(`   ❌ Status is "${data.status}" - THIS IS THE PROBLEM!`);
        console.log('   🔧 FIX: Update the status field to "active"');
      }
      console.log('');
    });

    // Test validation query
    console.log('\n🔍 Testing the validation query (with status filter)...');
    const validationSnapshot = await db
      .collection('enrollments')
      .where('courseId', '==', courseId)
      .where('userId', 'in', [studentId])
      .where('status', '==', 'active')
      .get();

    console.log(`📈 Validation query results: ${validationSnapshot.size}`);
    if (validationSnapshot.size === 0) {
      console.log('❌ Validation query returns NO results');
      console.log('   This is why the scheduled class creation fails!');
    } else {
      console.log('✅ Validation query returns results - enrollment should work');
    }

  } catch (error) {
    console.error('❌ Error checking enrollment:', error);
  }
}

checkEnrollment()
  .then(() => {
    console.log('\n✨ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
