/**
 * Google OAuth Authentication Service
 * 
 * Handles OAuth 2.0 flow for Google Calendar, Drive, and Meet APIs.
 * Manages token storage, refresh, and revocation.
 * 
 * @see docs/google-meet-calendar/google-meet-calendar.scope.md - CRITICAL AREA #1
 */

import { google } from 'googleapis';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { traceLogger } from '@/lib/tracing/trace-logger';

// OAuth 2.0 configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;

// OAuth scopes (least privilege principle)
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',     // Create/manage calendar events
  'https://www.googleapis.com/auth/drive.readonly',      // List recordings
  'https://www.googleapis.com/auth/drive.file',          // Manage app-created files
];

interface GoogleTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
  scope: string;
  // Device tracking (to detect token use from different device)
  deviceFingerprint: string;  // Hashed combination of User-Agent + IP prefix
  lastUsedIp: string;          // Last IP that successfully used this token
  userAgent: string;           // Browser/device info
  connectedAt: Timestamp;      // When token was originally authorized
  lastUsedAt: Timestamp;       // Last successful API call with this token
}

export class GoogleAuthService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth 2.0 authorization URL
   * 
   * @param userId - Teacher's Firebase UID (used as state parameter)
   * @returns Authorization URL for user to visit
   */
  getAuthorizationUrl(userId: string): string {
    const spanId = traceLogger.startSpan('GoogleAuth', 'getAuthorizationUrl');

    try {
      const url = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',           // Request refresh token
        scope: SCOPES,
        state: userId,                    // Include userId for validation in callback
        prompt: 'consent',                // Force consent screen to get refresh token
      });

      traceLogger.log('info', 'GoogleAuth', 'Authorization URL generated', {
        userId,
        scopeCount: SCOPES.length,
      });

      traceLogger.endSpan(spanId, 'success');
      return url;
    } catch (error) {
      traceLogger.log('error', 'GoogleAuth', 'Failed to generate auth URL', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Auth URL generation failed' });
      throw error;
    }
  }

  /**
   * Exchange authorization code for access/refresh tokens
   * 
   * @param code - Authorization code from OAuth callback
   * @returns Token data from Google
   */
  async exchangeCodeForTokens(code: string) {
    const spanId = traceLogger.startSpan('GoogleAuth', 'exchangeCodeForTokens');

    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      // SECURITY: Never log full tokens (only preview)
      traceLogger.log('info', 'GoogleAuth', 'Tokens exchanged successfully', {
        accessTokenPreview: tokens.access_token?.substring(0, 10) + '...',
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : null,
      });

      traceLogger.endSpan(spanId, 'success');
      return tokens;
    } catch (error) {
      traceLogger.log('error', 'GoogleAuth', 'Token exchange failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        codePreview: code.substring(0, 10) + '...',
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Token exchange failed' });
      throw error;
    }
  }

  /**
   * Generate device fingerprint (not cryptographically secure, just for detection)
   */
  private generateDeviceFingerprint(userAgent: string, ip: string): string {
    const ipPrefix = ip.split('.').slice(0, 2).join('.'); // e.g., "192.168"
    const combined = `${userAgent}:${ipPrefix}`;
    // Simple hash (not for security, just for comparison)
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36); // Base36 encoding for shorter string
  }

  /**
   * Store Google tokens in Firestore user document
   * 
   * @param userId - Teacher's Firebase UID
   * @param tokens - Token data from Google
   * @param requestInfo - Device/IP info from request
   */
  async storeTokens(
    userId: string, 
    tokens: any, 
    requestInfo: { userAgent: string; ip: string }
  ): Promise<void> {
    const spanId = traceLogger.startSpan('GoogleAuth', 'storeTokens');
    const db = getFirestore();

    try {
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Missing required tokens (access_token or refresh_token)');
      }

      const expiresAt = tokens.expiry_date
        ? Timestamp.fromMillis(tokens.expiry_date)
        : Timestamp.fromMillis(Date.now() + 3600 * 1000); // Default: 1 hour

      const now = Timestamp.now();
      const deviceFingerprint = this.generateDeviceFingerprint(requestInfo.userAgent, requestInfo.ip);

      const googleTokens: GoogleTokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope || SCOPES.join(' '),
        deviceFingerprint,
        lastUsedIp: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        connectedAt: now,
        lastUsedAt: now,
      };

      await db.collection('users').doc(userId).update({
        googleTokens,
        googleConnectedAt: Timestamp.now(),
      });

      traceLogger.log('info', 'GoogleAuth', 'Tokens stored in Firestore', {
        userId,
        expiresAt: expiresAt.toDate().toISOString(),
      });

      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'GoogleAuth', 'Failed to store tokens', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Token storage failed' });
      throw error;
    }
  }

  /**
   * Get valid access token for user (auto-refresh if expired)
   * 
   * @param userId - Teacher's Firebase UID
   * @param currentRequestInfo - Current device/IP info (optional for backward compatibility)
   * @returns Valid access token
   * @throws 'DEVICE_MISMATCH' if token was authorized on different device
   */
  async getValidAccessToken(
    userId: string, 
    currentRequestInfo?: { userAgent: string; ip: string }
  ): Promise<string> {
    const spanId = traceLogger.startSpan('GoogleAuth', 'getValidAccessToken');
    const db = getFirestore();

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.googleTokens) {
        throw new Error('User has not connected Google account');
      }

      const { 
        accessToken, 
        refreshToken, 
        expiresAt,
        deviceFingerprint: storedFingerprint,
        lastUsedIp,
        userAgent: storedUserAgent,
        connectedAt
      } = userData.googleTokens;

      // Device mismatch detection (if current request info provided)
      if (currentRequestInfo) {
        const currentFingerprint = this.generateDeviceFingerprint(
          currentRequestInfo.userAgent, 
          currentRequestInfo.ip
        );

        if (currentFingerprint !== storedFingerprint) {
          traceLogger.log('warn', 'GoogleAuth', 'Device mismatch detected', {
            userId,
            storedUserAgent,
            currentUserAgent: currentRequestInfo.userAgent,
            storedIp: lastUsedIp,
            currentIp: currentRequestInfo.ip,
            connectedAt: connectedAt.toDate().toISOString(),
          });

          // Throw specific error code that UI can detect
          const error: any = new Error('Token was authorized on a different device');
          error.code = 'DEVICE_MISMATCH';
          error.details = {
            lastDevice: {
              userAgent: storedUserAgent,
              ip: lastUsedIp,
              connectedAt: connectedAt.toDate().toISOString(),
            }
          };
          throw error;
        }

        // Update last used timestamp and IP (device hasn't changed)
        await db.collection('users').doc(userId).update({
          'googleTokens.lastUsedAt': Timestamp.now(),
          'googleTokens.lastUsedIp': currentRequestInfo.ip,
        });
      }
      const now = Date.now();
      const expiresAtMs = expiresAt.toMillis();

      // If token expires in <5 minutes, refresh it
      if (expiresAtMs - now < 5 * 60 * 1000) {
        traceLogger.log('info', 'GoogleAuth', 'Token expiring soon, refreshing', {
          userId,
          expiresIn: Math.floor((expiresAtMs - now) / 1000),
        });

        const newAccessToken = await this.refreshAccessToken(userId, refreshToken);
        traceLogger.endSpan(spanId, 'success');
        return newAccessToken;
      }

      traceLogger.log('info', 'GoogleAuth', 'Valid token retrieved', {
        userId,
        expiresIn: Math.floor((expiresAtMs - now) / 1000),
      });

      traceLogger.endSpan(spanId, 'success');
      return accessToken;
    } catch (error) {
      traceLogger.log('error', 'GoogleAuth', 'Failed to get valid token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Token retrieval failed' });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * 
   * @param userId - Teacher's Firebase UID
   * @param refreshToken - Google refresh token
   * @returns New access token
   */
  async refreshAccessToken(userId: string, refreshToken: string): Promise<string> {
    const spanId = traceLogger.startSpan('GoogleAuth', 'refreshAccessToken');
    const db = getFirestore();

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      // Update Firestore with new tokens
      const expiresAt = credentials.expiry_date
        ? Timestamp.fromMillis(credentials.expiry_date)
        : Timestamp.fromMillis(Date.now() + 3600 * 1000);

      await db.collection('users').doc(userId).update({
        'googleTokens.accessToken': credentials.access_token,
        'googleTokens.expiresAt': expiresAt,
      });

      traceLogger.log('info', 'GoogleAuth', 'Access token refreshed', {
        userId,
        newExpiresAt: expiresAt.toDate().toISOString(),
      });

      traceLogger.endSpan(spanId, 'success');
      return credentials.access_token;
    } catch (error) {
      traceLogger.log('error', 'GoogleAuth', 'Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Token refresh failed' });
      throw error;
    }
  }

  /**
   * Revoke Google tokens and disconnect account
   * 
   * @param userId - Teacher's Firebase UID
   */
  async revokeTokens(userId: string): Promise<void> {
    const spanId = traceLogger.startSpan('GoogleAuth', 'revokeTokens');
    const db = getFirestore();

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.googleTokens) {
        traceLogger.log('warn', 'GoogleAuth', 'No tokens to revoke', { userId });
        traceLogger.endSpan(spanId, 'success');
        return;
      }

      const { accessToken } = userData.googleTokens;

      // Revoke token with Google
      this.oauth2Client.setCredentials({
        access_token: accessToken,
      });
      await this.oauth2Client.revokeCredentials();

      // Remove tokens from Firestore
      await db.collection('users').doc(userId).update({
        googleTokens: null,
        googleConnectedAt: null,
        googleDisconnectedAt: Timestamp.now(),
      });

      traceLogger.log('info', 'GoogleAuth', 'Tokens revoked successfully', { userId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'GoogleAuth', 'Token revocation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Token revocation failed' });
      throw error;
    }
  }

  /**
   * Check if user has connected Google account
   * 
   * @param userId - Teacher's Firebase UID
   * @returns True if connected, false otherwise
   */
  async isConnected(userId: string): Promise<boolean> {
    const spanId = traceLogger.startSpan('GoogleAuth', 'isConnected');
    const db = getFirestore();

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      const connected = !!userData?.googleTokens?.accessToken;

      traceLogger.log('info', 'GoogleAuth', 'Connection status checked', {
        userId,
        connected,
      });

      traceLogger.endSpan(spanId, 'success');
      return connected;
    } catch (error) {
      traceLogger.log('error', 'GoogleAuth', 'Connection check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      traceLogger.endSpan(spanId, 'error', { message: 'Connection check failed' });
      throw error;
    }
  }
}

// Singleton instance
export const googleAuthService = new GoogleAuthService();
