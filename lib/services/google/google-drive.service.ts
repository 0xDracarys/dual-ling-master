/**
 * Google Drive Service
 * 
 * Manages Google Drive file operations for class recording management.
 * Handles listing, moving, deleting recording files.
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - CRITICAL AREA #3
 * @see docs/google-meet-calendar/google-meet-calendar.prd.md - Lines 686-720
 */

import { google } from 'googleapis';
import { googleAuthService } from './google-auth.service';
import { traceLogger } from '@/lib/tracing/trace-logger';

interface RecordingFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  mimeType: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
}

interface RecordingRetention {
  createdAt: Date;
  expiresAt: Date;
  archived: boolean;
  daysRemaining: number;
}

export class GoogleDriveService {
  /**
   * List recording files from Google Drive for a specific Meet link
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param meetLink - Google Meet link to search recordings for
   * @returns Array of recording files
   */
  async listRecordings(teacherId: string, meetLink: string): Promise<RecordingFile[]> {
    const spanId = traceLogger.startSpan('GoogleDrive', 'listRecordings');

    try {
      // Get valid access token
      const accessToken = await googleAuthService.getValidAccessToken(teacherId);

      // Initialize Drive API client
      const drive = google.drive({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Extract Meet code from link (e.g., "abc-defg-hij" from meet.google.com/abc-defg-hij)
      const meetCode = this.extractMeetCode(meetLink);

      // Query for recordings (Meet recordings are typically named with the Meet code)
      const response = await drive.files.list({
        auth,
        q: `name contains '${meetCode}' and mimeType contains 'video/' and trashed = false`,
        fields: 'files(id, name, webViewLink, webContentLink, mimeType, size, createdTime, modifiedTime)',
        orderBy: 'createdTime desc',
        pageSize: 100,
      });

      const files = response.data.files || [];

      traceLogger.log('info', 'GoogleDrive', 'Recordings listed', {
        teacherId,
        meetCode,
        fileCount: files.length,
      });

      traceLogger.endSpan(spanId, 'success');

      return files.map(file => ({
        id: file.id!,
        name: file.name!,
        webViewLink: file.webViewLink || '',
        webContentLink: file.webContentLink || '',
        mimeType: file.mimeType || '',
        size: file.size || '0',
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
      }));
    } catch (error) {
      traceLogger.log('error', 'GoogleDrive', 'Failed to list recordings', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
        meetLink: meetLink.split('/').pop(), // Log only the code part for privacy
      });
      traceLogger.endSpan(spanId, 'error', { message: 'List recordings failed' });
      throw error;
    }
  }

  /**
   * Get shareable download URL for a recording file
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param fileId - Google Drive file ID
   * @returns Shareable download URL
   */
  async getRecordingUrl(teacherId: string, fileId: string): Promise<string> {
    const spanId = traceLogger.startSpan('GoogleDrive', 'getRecordingUrl');

    try {
      // Get valid access token
      const accessToken = await googleAuthService.getValidAccessToken(teacherId);

      // Initialize Drive API client
      const drive = google.drive({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Get file metadata
      const response = await drive.files.get({
        auth,
        fileId,
        fields: 'webViewLink, webContentLink',
      });

      const url = response.data.webViewLink || response.data.webContentLink || '';

      if (!url) {
        throw new Error('Failed to generate shareable URL');
      }

      traceLogger.log('info', 'GoogleDrive', 'Recording URL retrieved', {
        teacherId,
        fileId,
      });

      traceLogger.endSpan(spanId, 'success');
      return url;
    } catch (error) {
      traceLogger.log('error', 'GoogleDrive', 'Failed to get recording URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
        fileId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Get recording URL failed' });
      throw error;
    }
  }

  /**
   * Move recording to archive folder (Keep Forever action)
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param fileId - Google Drive file ID
   * @param archiveFolderId - Archive folder ID (created per teacher)
   * @returns Success status
   */
  async moveToArchive(teacherId: string, fileId: string, archiveFolderId: string): Promise<boolean> {
    const spanId = traceLogger.startSpan('GoogleDrive', 'moveToArchive');

    try {
      // Get valid access token
      const accessToken = await googleAuthService.getValidAccessToken(teacherId);

      // Initialize Drive API client
      const drive = google.drive({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Get current parents
      const file = await drive.files.get({
        auth,
        fileId,
        fields: 'parents',
      });

      const previousParents = file.data.parents?.join(',') || '';

      // Move file to archive folder
      await drive.files.update({
        auth,
        fileId,
        addParents: archiveFolderId,
        removeParents: previousParents,
        fields: 'id, parents',
      });

      traceLogger.log('info', 'GoogleDrive', 'Recording moved to archive', {
        teacherId,
        fileId,
        archiveFolderId,
      });

      traceLogger.endSpan(spanId, 'success');
      return true;
    } catch (error) {
      traceLogger.log('error', 'GoogleDrive', 'Failed to move recording to archive', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
        fileId,
        archiveFolderId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Move to archive failed' });
      throw error;
    }
  }

  /**
   * Delete recording file from Google Drive
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param fileId - Google Drive file ID
   * @returns Success status
   */
  async deleteRecording(teacherId: string, fileId: string): Promise<boolean> {
    const spanId = traceLogger.startSpan('GoogleDrive', 'deleteRecording');

    try {
      // Get valid access token
      const accessToken = await googleAuthService.getValidAccessToken(teacherId);

      // Initialize Drive API client
      const drive = google.drive({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Delete file (moves to trash)
      await drive.files.delete({
        auth,
        fileId,
      });

      traceLogger.log('info', 'GoogleDrive', 'Recording deleted', {
        teacherId,
        fileId,
      });

      traceLogger.endSpan(spanId, 'success');
      return true;
    } catch (error) {
      traceLogger.log('error', 'GoogleDrive', 'Failed to delete recording', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
        fileId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Delete recording failed' });
      throw error;
    }
  }

  /**
   * Create archive folder for teacher if it doesn't exist
   * 
   * @param teacherId - Teacher's Firebase UID
   * @returns Archive folder ID
   */
  async getOrCreateArchiveFolder(teacherId: string): Promise<string> {
    const spanId = traceLogger.startSpan('GoogleDrive', 'getOrCreateArchiveFolder');

    try {
      // Get valid access token
      const accessToken = await googleAuthService.getValidAccessToken(teacherId);

      // Initialize Drive API client
      const drive = google.drive({ version: 'v3' });
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      const folderName = 'DualLing Archived Recordings';

      // Check if folder exists
      const searchResponse = await drive.files.list({
        auth,
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        pageSize: 1,
      });

      const existingFolder = searchResponse.data.files?.[0];

      if (existingFolder) {
        traceLogger.log('info', 'GoogleDrive', 'Archive folder found', {
          teacherId,
          folderId: existingFolder.id,
        });
        traceLogger.endSpan(spanId, 'success');
        return existingFolder.id!;
      }

      // Create folder if it doesn't exist
      const createResponse = await drive.files.create({
        auth,
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });

      const folderId = createResponse.data.id!;

      traceLogger.log('info', 'GoogleDrive', 'Archive folder created', {
        teacherId,
        folderId,
      });

      traceLogger.endSpan(spanId, 'success');
      return folderId;
    } catch (error) {
      traceLogger.log('error', 'GoogleDrive', 'Failed to get or create archive folder', {
        error: error instanceof Error ? error.message : 'Unknown error',
        teacherId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Get or create archive folder failed' });
      throw error;
    }
  }

  /**
   * Check retention status of a recording
   * 
   * @param createdAt - Recording creation timestamp
   * @param archived - Whether recording is archived
   * @returns Retention information
   */
  checkRetention(createdAt: Date, archived: boolean): RecordingRetention {
    const now = new Date();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(createdAt.getTime() + thirtyDaysInMs);
    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    return {
      createdAt,
      expiresAt,
      archived,
      daysRemaining: archived ? -1 : Math.max(0, daysRemaining), // -1 for archived (never expires)
    };
  }

  /**
   * Extract Meet code from Meet link
   * 
   * @param meetLink - Google Meet link (e.g., https://meet.google.com/abc-defg-hij)
   * @returns Meet code (e.g., "abc-defg-hij")
   */
  private extractMeetCode(meetLink: string): string {
    const spanId = traceLogger.startSpan('GoogleDrive', 'extractMeetCode');

    try {
      const url = new URL(meetLink);
      const code = url.pathname.replace('/', '');

      if (!code || code.length < 3) {
        throw new Error('Invalid Meet link format');
      }

      traceLogger.endSpan(spanId, 'success');
      return code;
    } catch (error) {
      traceLogger.log('error', 'GoogleDrive', 'Failed to extract Meet code', {
        error: error instanceof Error ? error.message : 'Unknown error',
        meetLink,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Extract Meet code failed' });
      throw new Error('Invalid Meet link format');
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();
