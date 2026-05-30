"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordingCleanup = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const googleapis_1 = require("googleapis");
// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
/**
 * Scheduled function to clean up expired recordings
 * Runs daily at 2AM UTC (cron: "0 2 * * *")
 */
exports.recordingCleanup = functions.pubsub
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
    const errors = [];
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
        const recordings = [];
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
                const auth = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
                auth.setCredentials({
                    access_token: googleTokens.accessToken,
                    refresh_token: googleTokens.refreshToken,
                });
                const drive = googleapis_1.google.drive({ version: 'v3', auth });
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
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('💥 [RecordingCleanup] Fatal error in cleanup job', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            executionId: context.eventId,
        });
        // Re-throw to mark function execution as failed
        throw error;
    }
});
//# sourceMappingURL=recordingCleanup.js.map