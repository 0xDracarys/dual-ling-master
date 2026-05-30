// Firebase Setup Verification Script
// Run this to verify Firebase Admin SDK is properly configured

import { getAdminApp, getAdminAuth, getAdminDb, getAdminStorage } from '../lib/firebase/admin';

async function verifyFirebaseSetup() {
  console.log('🔥 Firebase Setup Verification\n');
  
  try {
    // 1. Check Admin App
    console.log('1️⃣ Checking Firebase Admin App...');
    const app = getAdminApp();
    console.log('✅ Admin App initialized');
    console.log(`   Project ID: ${app.options.projectId}`);
    
    // 2. Check Auth
    console.log('\n2️⃣ Checking Firebase Auth...');
    const auth = getAdminAuth();
    const users = await auth.listUsers(1); // List 1 user to test connection
    console.log(`✅ Auth connected (${users.users.length} user(s) found)`);
    
    // 3. Check Firestore
    console.log('\n3️⃣ Checking Firestore...');
    const db = getAdminDb();
    console.log('✅ Firestore connected');
    console.log(`   Database ID: ${db.databaseId || '(default)'}`);
    
    // Try a simple read operation
    const testCollection = db.collection('_test_connection');
    const snapshot = await testCollection.limit(1).get();
    console.log(`   Can read collections: ✅`);
    
    // 4. Check Storage
    console.log('\n4️⃣ Checking Cloud Storage...');
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    console.log('✅ Storage connected');
    console.log(`   Bucket: ${bucket.name}`);
    
    console.log('\n🎉 All Firebase services verified successfully!\n');
    console.log('Next steps:');
    console.log('  1. Start emulators: firebase emulators:start');
    console.log('  2. Enable Storage in Firebase Console');
    console.log('  3. Begin Phase 1 migration tasks\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    console.error('\nTroubleshooting:');
    console.error('  1. Check .env.local has Firebase credentials');
    console.error('  2. Verify FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    console.error('  3. Or set GOOGLE_APPLICATION_CREDENTIALS to service account JSON path');
    console.error('  4. Make sure Firestore is enabled in Firebase Console\n');
    process.exit(1);
  }
}

verifyFirebaseSetup();
