# Remediation Code - Security & GDPR Fixes
**Framework**: Next.js 14+, TypeScript, Firebase  
**Status**: Ready to implement  
**Last Updated**: 2025-11-11

---

## Overview

This document contains production-ready code samples to remediate the security vulnerabilities and GDPR violations documented in SECURITY_VULNERABILITIES.md and GDPR_COMPLIANCE_REPORT.md.

All code uses the existing tech stack: Next.js, TypeScript, Firebase, and shadcn/ui components.

---

## Fix #1: HttpOnly Cookies for Authentication

**Purpose**: Replace localStorage tokens with secure HttpOnly cookies  
**Vulnerability Fixed**: #1 (JWT in localStorage), #5 (No HttpOnly cookies)  
**Effort**: 6-8 hours  

### Backend: Token Generation (app/api/auth/login/route.ts)

```typescript
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // Authenticate user
    const user = await authenticateUser(email, password);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: '15m', algorithm: 'HS256', issuer: 'dual-ling-auth' }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      REFRESH_SECRET,
      { expiresIn: '7d', algorithm: 'HS256', issuer: 'dual-ling-auth' }
    );

    // Set secure HttpOnly cookies
    const cookieStore = await cookies();
    
    cookieStore.set('auth_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/api/auth/refresh',
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
    });
  }
}
```

### Backend: Token Validation Middleware (lib/middleware/auth-middleware.ts)

```typescript
import { cookies } from 'next/headers';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET!;

interface AuthPayload extends JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

// Token blacklist for revoked tokens (use Redis in production)
const revokedTokens = new Set<string>();

export async function verifyAuth(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return { authenticated: false, user: null };
    }

    // Check if token is revoked
    if (revokedTokens.has(token)) {
      return { authenticated: false, user: null };
    }

    // Verify token signature and claims
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'dual-ling-auth',
    }) as AuthPayload;

    // Validate token type and required claims
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    if (!decoded.sub || !decoded.role) {
      throw new Error('Missing required claims');
    }

    // Check expiration (jwt.verify already does this, but explicit)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp <= now) {
      throw new Error('Token expired');
    }

    return {
      authenticated: true,
      user: {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { authenticated: false, user: null };
  }
}

// Add to token revocation (for logout)
export function revokeToken(token: string) {
  revokedTokens.add(token);
  // In production, use Redis with expiration
  // redis.sadd('revoked_tokens', token);
  // redis.expire('revoked_tokens', TOKEN_TTL);
}

// Middleware for protected routes
export async function withAuth(req: NextRequest) {
  const { authenticated, user } = await verifyAuth(req);

  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Add user to request context
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', user!.id);
  requestHeaders.set('x-user-role', user!.role);

  return requestHeaders;
}
```

### Frontend: Remove localStorage, Use Cookies

```typescript
// Old code (lib/auth/login.ts)
// ❌ localStorage.setItem('auth_token', token);
// ❌ localStorage.setItem('user', JSON.stringify(user));

// New code - cookies are automatic with HttpOnly flag
export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Include cookies
  });

  const data = await response.json();
  
  // ✅ Token is automatically in HttpOnly cookie
  // No manual storage needed!
  
  return data.user;
}
```

### Frontend: Logout (app/auth/logout/page.tsx)

```typescript
import { cookies } from 'next/headers';

export async function logout() {
  try {
    // Call logout endpoint to revoke token
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    // Cookies are cleared by server
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}
```

---

## Fix #2: Firebase API Key Protection

**Purpose**: Move Firebase config to backend only  
**Vulnerability Fixed**: #2 (Firebase API Key exposure)  
**Effort**: 8-12 hours  

### Step 1: Backend Firebase Config (lib/firebase/admin.ts)

```typescript
import * as admin from 'firebase-admin';

// Initialize with service account (server-side only)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
```

### Step 2: Remove Client-Side Firebase Config

```typescript
// REMOVE THIS FILE: lib/firebase/client.ts
// ❌ Don't expose Firebase config to client
// ❌ Don't use: import firebase from 'firebase/app'
// ❌ Don't use: initializeApp(firebaseConfig)
```

### Step 3: Create Backend API Proxy

```typescript
// app/api/ai/teacher-bot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-middleware';
import { db } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  // Verify authentication
  const authHeaders = await withAuth(req);
  if (!authHeaders) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, mode } = await req.json();
    const userId = authHeaders.get('x-user-id')!;

    // Access Firebase through backend only
    // User cannot directly access Firebase credentials
    const response = await generateChatbotResponse(
      message,
      mode,
      userId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chatbot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Fix #3: Strict Token Validation

**Purpose**: Validate token signature, expiration, claims  
**Vulnerability Fixed**: #3 (Weak token validation)  
**Effort**: 3-4 hours  

### Token Validation Middleware (lib/middleware/token-validator.ts)

```typescript
import jwt, { JwtPayload } from 'jsonwebtoken';

interface ValidatedToken extends JwtPayload {
  sub: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export function validateToken(token: string): ValidatedToken {
  try {
    // Strict verification with all checks
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      // Algorithm validation
      algorithms: ['HS256'],
      // Issuer validation
      issuer: 'dual-ling-auth',
      // Audience validation (if needed)
      audience: undefined,
      // Clock tolerance (prevent race conditions)
      clockTolerance: 0,
    }) as ValidatedToken;

    // Manual validation of critical claims
    const now = Math.floor(Date.now() / 1000);

    // Check expiration
    if (!decoded.exp || decoded.exp <= now) {
      throw new Error('Token expired');
    }

    // Check issued-at time (shouldn't be in future)
    if (!decoded.iat || decoded.iat > now) {
      throw new Error('Token issued in future');
    }

    // Validate required claims
    if (!decoded.sub || typeof decoded.sub !== 'string') {
      throw new Error('Invalid subject claim');
    }

    if (!decoded.role || !['student', 'teacher', 'admin'].includes(decoded.role)) {
      throw new Error('Invalid role claim');
    }

    if (!decoded.type || !['access', 'refresh'].includes(decoded.type)) {
      throw new Error('Invalid token type');
    }

    // Validate email format
    if (decoded.email && !isValidEmail(decoded.email)) {
      throw new Error('Invalid email claim');
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token signature');
    }
    throw error;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length < 254;
}

// Protected API endpoint example
export async function protectedEndpoint(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;

  if (!token) {
    return { status: 401, error: 'Missing token' };
  }

  try {
    const validatedUser = validateToken(token);
    return { status: 200, user: validatedUser };
  } catch (error) {
    return { status: 401, error: error instanceof Error ? error.message : 'Invalid token' };
  }
}
```

---

## Fix #4: Security Headers (next.config.js)

**Purpose**: Add security headers to all responses  
**Vulnerability Fixed**: #4 (Missing security headers)  
**Effort**: 1-2 hours  

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://identitytoolkit.googleapis.com",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          // XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions policy
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'usb=()',
            ].join(', '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## Fix #5: Account Deletion (Right to Erasure)

**Purpose**: Implement GDPR Article 17 - Right to erasure  
**Violation Fixed**: GDPR #2  
**Effort**: 4 hours  

### API Endpoint (app/api/user/delete-account/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withAuth } from '@/lib/middleware/auth-middleware';
import { db, auth } from '@/lib/firebase/admin';
import { logAuditEvent } from '@/lib/audit/logger';

export async function POST(req: NextRequest) {
  // Require authentication
  const authHeaders = await withAuth(req);
  if (!authHeaders) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = authHeaders.get('x-user-id')!;

  try {
    // Verify user identity (additional confirmation)
    const { password } = await req.json();
    const user = await db.collection('users').doc(userId).get();
    
    if (!user.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password before deletion
    const verified = await verifyPassword(password, user.data()?.passwordHash);
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Begin deletion process
    console.log(`Deleting account for user: ${userId}`);

    // 1. Delete user data from Firestore
    await db.collection('users').doc(userId).update({
      deletedAt: new Date(),
      email: null,
      firstName: null,
      lastName: null,
      phoneNumber: null,
      profilePicture: null,
      personalData: {},
    });

    // 2. Delete related course data
    const courses = await db
      .collection('courses')
      .where('studentIds', 'array-contains', userId)
      .get();

    for (const course of courses.docs) {
      await course.ref.update({
        studentIds: admin.firestore.FieldValue.arrayRemove(userId),
      });
    }

    // 3. Delete progress records
    const progress = await db
      .collection('progress')
      .where('userId', '==', userId)
      .get();

    for (const doc of progress.docs) {
      await doc.ref.delete();
    }

    // 4. Delete chat history
    const messages = await db
      .collection('messages')
      .where('userId', '==', userId)
      .get();

    for (const doc of messages.docs) {
      await doc.ref.delete();
    }

    // 5. Delete files from storage
    const files = await admin.storage().bucket().getFiles({
      prefix: `users/${userId}/`,
    });

    for (const file of files[0]) {
      await file.delete();
    }

    // 6. Delete Firebase Auth account
    await auth.deleteUser(userId);

    // 7. Log deletion for compliance
    await logAuditEvent({
      type: 'USER_ACCOUNT_DELETED',
      userId,
      timestamp: new Date(),
      reason: 'User-requested deletion (GDPR Article 17)',
    });

    // 8. Clear authentication cookies
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    cookieStore.delete('refresh_token');

    // 9. Send confirmation email
    await sendDeletionConfirmationEmail(user.data()?.email);

    return NextResponse.json({
      success: true,
      message: 'Your account has been permanently deleted',
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    await logAuditEvent({
      type: 'USER_DELETION_FAILED',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

async function verifyPassword(
  provided: string,
  hash: string
): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(provided, hash);
}

async function sendDeletionConfirmationEmail(email: string) {
  // Use email service (SendGrid, AWS SES, etc.)
  console.log(`Sending deletion confirmation to ${email}`);
}
```

### Frontend Component (app/settings/delete-account/page.tsx)

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function DeleteAccountPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    setError('');
    setIsDeleting(true);

    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
        return;
      }

      // Redirect to goodbye page
      window.location.href = '/account-deleted';
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Delete Account</h1>
      <p className="text-gray-600 mb-6">
        This action is permanent. All your data will be deleted.
      </p>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            Delete My Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isDeleting}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={!password || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

---

## Fix #6: Data Export (GDPR Article 20)

**Purpose**: Implement right to data portability  
**Violation Fixed**: GDPR #3  
**Effort**: 4 hours  

### API Endpoint (app/api/user/export-data/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth-middleware';
import { db } from '@/lib/firebase/admin';
import { json2csv } from 'json-2-csv';

export async function GET(req: NextRequest) {
  const authHeaders = await withAuth(req);
  if (!authHeaders) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = authHeaders.get('x-user-id')!;
  const format = req.nextUrl.searchParams.get('format') || 'json'; // 'json' or 'csv'

  try {
    // Gather all user data
    const userData = await db.collection('users').doc(userId).get();
    const coursesData = await db
      .collection('courses')
      .where('studentIds', 'array-contains', userId)
      .get();
    const progressData = await db
      .collection('progress')
      .where('userId', '==', userId)
      .get();

    const exportData = {
      exportedAt: new Date().toISOString(),
      userProfile: userData.data(),
      enrolledCourses: coursesData.docs.map((doc) => doc.data()),
      learningProgress: progressData.docs.map((doc) => doc.data()),
    };

    if (format === 'csv') {
      // Convert to CSV
      const csv = json2csv(exportData.learningProgress);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="dual-ling-export.csv"',
        },
      });
    }

    // Default: JSON
    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="dual-ling-export.json"',
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
```

---

## Fix #7: Encryption for Sensitive Data

**Purpose**: Encrypt sensitive fields at rest  
**Vulnerability Fixed**: Security #7 (User data in localStorage), GDPR #4 (Insecure storage)  
**Effort**: 8-12 hours  

### Encryption Utility (lib/encryption/crypto.ts)

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

export function encryptField(plaintext: string): { encrypted: string; iv: string; authTag: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

export function decryptField(data: { encrypted: string; iv: string; authTag: string }): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(data.iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### Using Encryption (lib/firebase/user-repository.ts)

```typescript
import { encryptField, decryptField } from '@/lib/encryption/crypto';
import { db } from '@/lib/firebase/admin';

export async function createUser(userData: any) {
  const encryptedData = {
    email: encryptField(userData.email),
    firstName: encryptField(userData.firstName),
    lastName: encryptField(userData.lastName),
    phoneNumber: userData.phoneNumber ? encryptField(userData.phoneNumber) : null,
  };

  await db.collection('users').add(encryptedData);
}

export async function getUser(userId: string) {
  const doc = await db.collection('users').doc(userId).get();
  const data = doc.data();

  return {
    email: decryptField(data.email),
    firstName: decryptField(data.firstName),
    lastName: decryptField(data.lastName),
    phoneNumber: data.phoneNumber ? decryptField(data.phoneNumber) : null,
  };
}
```

---

## Implementation Checklist

- [ ] HttpOnly Cookies for auth tokens
- [ ] Backend Firebase proxy (no client exposure)
- [ ] Strict token validation middleware
- [ ] Security headers in next.config.js
- [ ] Account deletion endpoint + UI
- [ ] Data export endpoint + UI
- [ ] Field encryption for PII
- [ ] Privacy policy creation
- [ ] Consent management system
- [ ] Breach notification procedures
- [ ] DPA execution with providers
- [ ] Audit logging setup

