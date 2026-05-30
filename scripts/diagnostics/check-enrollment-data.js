/**
 * Diagnostic Script: Check Enrollment Data Structure
 * 
 * This script checks the actual structure of enrollment documents in Firestore
 * to identify why the backend validation is failing.
 * 
 * Run with: node scripts/check-enrollment-data.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../paji-duolingo-firebase-adminsdk-fbsvc-efc8f93eb1.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkEnrollmentData() {
  console.log('🔍 Checking enrollment data structure...\n');

  // Course IDs from the logs
  const courseIds = [
    'mmUNzC2eRPfD2VaULIeG', // Lithuanian Food Vocabulary (working)
    'chdAiCPOgXjeUAwnPuhn'  // Quiz Testing Course (failing)
  ];

  for (const courseId of courseIds) {
    console.log(`\n📚 Course ID: ${courseId}`);
    console.log('─'.repeat(60));

    try {
      const enrollmentsSnapshot = await db
        .collection('enrollments')
        .where('courseId', '==', courseId)
        .where('status', '==', 'active')
        .get();

      console.log(`✅ Found ${enrollmentsSnapshot.docs.length} enrollments\n`);

      enrollmentsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Enrollment ${index + 1}:`);
        console.log(`  Document ID: ${doc.id}`);
        console.log(`  Has userId field: ${data.userId ? '✅ YES' : '❌ NO'}`);
        console.log(`  userId value: ${data.userId || 'undefined'}`);
        console.log(`  Has studentId field: ${data.studentId ? '✅ YES' : '❌ NO'}`);
        console.log(`  studentId value: ${data.studentId || 'undefined'}`);
        console.log(`  userName: ${data.userName || 'N/A'}`);
        console.log(`  userEmail: ${data.userEmail || 'N/A'}`);
        console.log(`  status: ${data.status || 'N/A'}`);
        console.log();
      });

      // Also check if querying by userId works
      if (enrollmentsSnapshot.docs.length > 0) {
        const firstEnrollment = enrollmentsSnapshot.docs[0].data();
        const userIdToCheck = firstEnrollment.userId || firstEnrollment.studentId || 'TEST_ID';

        console.log(`🔎 Testing query with userId: ${userIdToCheck}`);
        const testQuery = await db
          .collection('enrollments')
          .where('courseId', '==', courseId)
          .where('userId', 'in', [userIdToCheck])
          .where('status', '==', 'active')
          .get();

        console.log(`   Query result: ${testQuery.docs.length} documents found`);
        if (testQuery.docs.length === 0) {
          console.log('   ❌ Query by userId returned 0 results - FIELD MISSING OR MISMATCH!');
        } else {
          console.log('   ✅ Query by userId works correctly');
        }
      }

    } catch (error) {
      console.error(`❌ Error checking enrollments for ${courseId}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('💡 Diagnosis Complete');
  console.log('='.repeat(60));

  process.exit(0);
}

checkEnrollmentData().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
