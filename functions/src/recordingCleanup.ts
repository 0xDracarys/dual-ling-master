/**
 * Recording Cleanup Cloud Function
 * 
 * Scheduled Cloud Function that runs daily at 2AM UTC to delete expired class recordings.
 * - Queries classes where recordingRetention.expiresAt < now AND archived === false
 * - Deletes recording from Google Drive
 * - Updates Firestore to remove recording references
 * - Extensive error handling with detailed logging
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - CRITICAL AREA #6
 * @see docs/google-meet-calendar/google-meet-calendar.prd.md - Lines 800-830
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface RecordingData {
  classId: string;
  recordingDriveId: string;
  teacherId: string;
  title: string;
  expiresAt: admin.firestore.Timestamp;
}

/**
 * Scheduled function to clean up expired recordings
 * Runs daily at 2AM UTC (cron: "0 2 * * *")
 */
export const recordingCleanup = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('🧹 [RecordingCleanup] Starting scheduled cleanup job', {
      timestamp: new Date().toISOString(),
      executionId: context.eventId,
    });

    const now = admin.firestore.Timestamp.now();
    let processedCount = 0;
    let deletedCount = 0;
    let errorCount = 0;
    const errors: Array<{ classId: string; error: string }> = [];

    try {
      // Query expired recordings
      const expiredRecordingsSnapshot = await db
        .collection('classes')
        .where('recordingRetention.expiresAt', '<', now)
        .where('recordingRetention.archived', '==', false)
        .get();

      console.log(`📊 [RecordingCleanup] Found ${expiredRecordingsSnapshot.size} expired recording(s)`, {
        count: expiredRecordingsSnapshot.size,
      });

      if (expiredRecordingsSnapshot.empty) {
        console.log('✅ [RecordingCleanup] No expired recordings to clean up');
        return null;
      }

      // Process each expired recording
      const recordings: RecordingData[] = [];
      expiredRecordingsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.recordingDriveId && data.teacherId) {
          recordings.push({
            classId: doc.id,
            recordingDriveId: data.recordingDriveId,
            teacherId: data.teacherId,
            title: data.title || 'Untitled Class',
            expiresAt: data.recordingRetention.expiresAt,
          });
        }
      });

      console.log(`🎯 [RecordingCleanup] Processing ${recordings.length} recording(s)`);

      // Process recordings sequentially to avoid rate limits
      for (const recording of recordings) {
        processedCount++;

        try {
          console.log(`🗑️  [RecordingCleanup] Deleting recording for class "${recording.title}"`, {
            classId: recording.classId,
            recordingDriveId: recording.recordingDriveId,
            teacherId: recording.teacherId,
            expiredAt: recording.expiresAt.toDate().toISOString(),
          });

          // Get teacher's Google tokens from Firestore
          const teacherDoc = await db.collection('teachers').doc(recording.teacherId).get();
          
          if (!teacherDoc.exists) {
            throw new Error('Teacher not found');
          }

          const teacherData = teacherDoc.data();
          const googleTokens = teacherData?.googleAuth?.tokens;

          if (!googleTokens || !googleTokens.accessToken) {
            throw new Error('Teacher Google tokens not found');
          }

          // Initialize Google Drive API
          const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
          );

          auth.setCredentials({
            access_token: googleTokens.accessToken,
            refresh_token: googleTokens.refreshToken,
          });

          const drive = google.drive({ version: 'v3', auth });

          // Delete file from Google Drive
          await drive.files.delete({
            fileId: recording.recordingDriveId,
          });

          console.log(`✅ [RecordingCleanup] Recording deleted from Drive`, {
            classId: recording.classId,
            recordingDriveId: recording.recordingDriveId,
          });

          // Update Firestore (remove recording references)
          await db.collection('classes').doc(recording.classId).update({
            recordingUrl: admin.firestore.FieldValue.delete(),
            recordingDriveId: admin.firestore.FieldValue.delete(),
            recordingRetention: admin.firestore.FieldValue.delete(),
            recordingMetadata: admin.firestore.FieldValue.delete(),
          });

          console.log(`✅ [RecordingCleanup] Firestore updated`, {
            classId: recording.classId,
          });

          deletedCount++;
        } catch (error) {
          errorCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          console.error(`❌ [RecordingCleanup] Failed to delete recording`, {
            classId: recording.classId,
            recordingDriveId: recording.recordingDriveId,
            error: errorMessage,
          });

          errors.push({
            classId: recording.classId,
            error: errorMessage,
          });

          // Continue with next recording even if one fails
          continue;
        }
      }

      // Log final summary
      console.log('🎉 [RecordingCleanup] Cleanup job completed', {
        timestamp: new Date().toISOString(),
        executionId: context.eventId,
        summary: {
          processed: processedCount,
          deleted: deletedCount,
          errors: errorCount,
        },
        errors: errors.length > 0 ? errors : undefined,
      });

      return null;
    } catch (error) {
      console.error('💥 [RecordingCleanup] Fatal error in cleanup job', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        executionId: context.eventId,
      });

      // Re-throw to mark function execution as failed
      throw error;
    }
  });
