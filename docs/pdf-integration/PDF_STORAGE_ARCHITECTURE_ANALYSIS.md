# PDF Storage Architecture Analysis

## Current Implementation (Server-Side Upload)

### What We Built:
1. **Client → API Route → Firebase Storage** 
2. User uploads file to Next.js API (`/api/courses/[id]/lessons/[lessonId]/resources`)
3. API route receives file, authenticates user with custom token
4. API uploads to Firebase Storage using Admin SDK
5. API stores metadata in Firestore
6. API generates signed URL and returns to client

### Code Flow:
```typescript
// components/teacher/resource-upload.tsx
const formData = new FormData();
formData.append('file', selectedFile);

await fetch(`/api/courses/${courseId}/lessons/${lessonId}/resources`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// app/api/courses/[id]/lessons/[lessonId]/resources/route.ts
const bucket = getStorage().bucket(bucketName);
await bucket.file(storagePath).save(fileBuffer, { metadata });
```

## Firebase's Recommended Approach (Client-Side Upload)

### What Firebase Documentation Shows:
1. **Client → Firebase Storage directly**
2. User uploads file from browser using Firebase Storage Web SDK
3. Browser authenticates with Firebase Auth (ID token)
4. File uploads directly to Storage (bypasses server)
5. Security Rules validate upload permissions
6. Client gets download URL after completion

### Code Flow (from Firebase docs):
```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const storage = getStorage();
const storageRef = ref(storage, 'path/to/file.pdf');

uploadBytes(storageRef, file, metadata).then((snapshot) => {
  getDownloadURL(snapshot.ref).then((downloadURL) => {
    // Save downloadURL to Firestore
  });
});
```

## Problem Analysis

### Why Upload Button "Doesn't Do Anything"

**Root Cause**: We're using **custom token-based auth** (not Firebase Auth), but Firebase Storage expects **Firebase Authentication**.

Firebase Storage Security Rules:
```
match /courses/{courseId}/lessons/{lessonId}/resources/{resourceId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
                  request.auth.token.role in ['teacher', 'admin'];
}
```

The `request.auth` in these rules refers to **Firebase Auth users**, not our custom token system!

### Current Issues:

1. **Authentication Mismatch**:
   - App uses: Custom JWT tokens (issued by our API)
   - Firebase Storage expects: Firebase Auth ID tokens
   - Result: `request.auth` is `null` in Security Rules

2. **Upload Path Conflict**:
   - Server-side: Admin SDK bypasses Security Rules
   - Client-side: Web SDK enforces Security Rules
   - Current: Using Admin SDK but Storage bucket config may be off

3. **Bucket Configuration**:
   - Admin SDK needs explicit bucket name: `getStorage().bucket('paji-duolingo.firebasestorage.app')`
   - We added this, but it may not be working in production

## Two Possible Solutions

### Option A: Keep Server-Side Upload (Current Approach)

**Pros**:
- No Firebase Auth dependency
- Works with custom auth system
- Admin SDK bypasses Security Rules
- More control over uploads

**Cons**:
- Files pass through server (higher bandwidth/memory)
- No native progress tracking
- Requires API route maintenance
- Higher Cloud Run costs

**Fixes Needed**:
1. ✅ Add bucket name to Admin SDK (DONE)
2. ⚠️ Verify bucket initialization in Cloud Run
3. ⚠️ Add console.log to track upload attempts
4. ⚠️ Check if formData is being sent correctly

### Option B: Switch to Client-Side Upload (Firebase Way)

**Pros**:
- Recommended Firebase pattern
- Native progress tracking
- Lower server costs (no proxy)
- Better performance (direct upload)

**Cons**:
- **REQUIRES Firebase Authentication**
- Cannot use custom token auth
- Need to refactor entire auth system
- Breaking change for existing users

**Migration Steps**:
1. Migrate from custom auth to Firebase Auth
2. Set custom claims (`role: 'teacher'`) on Firebase users
3. Update all components to use Firebase Auth
4. Rewrite ResourceUpload to use Storage Web SDK
5. Test Security Rules with Firebase Auth

## Recommendation

### Short-Term: Fix Server-Side Upload (Option A)

**Why**: We already built the infrastructure, auth system works, just need debugging.

**Action Plan**:
1. Add detailed logging to API route
2. Verify bucket exists and is accessible
3. Test with small file first
4. Check if error is silent (catch block logging)
5. Validate formData parsing

### Long-Term: Consider Migration (Option B)

**Why**: Firebase's architecture is designed for client-side uploads. Fighting the framework is costly.

**When to consider**:
- If we need better performance
- If we want to reduce API costs
- If we're adding other Firebase Auth features
- If scale becomes an issue

## Next Steps (Debugging Current System)

1. **Add Console Logging**:
```typescript
// In ResourceUpload component
console.log('Upload starting:', { courseId, lessonId, file: selectedFile?.name });
console.log('Token:', token ? 'Present' : 'Missing');
console.log('FormData created:', formData.get('file'));
```

2. **Add API Route Logging**:
```typescript
// In route.ts
console.log('POST /resources received');
console.log('File received:', file?.name, file?.size);
console.log('Bucket name:', bucketName);
```

3. **Test Upload Flow**:
   - Open browser console
   - Click upload
   - Check Network tab for POST request
   - Check if request reaches API
   - Check API logs for errors

4. **Verify Bucket Access**:
```bash
# Check if bucket exists
firebase storage:list
```

## Decision Point

**Question for Team**: Do we want to fix the current system (server-side upload) or migrate to Firebase's recommended pattern (client-side upload)?

**If Fix**: Continue with current debugging (1-2 hours)
**If Migrate**: Plan 2-3 day auth system refactor

---

**Status**: Awaiting user decision on approach
**Date**: October 26, 2025
**Branch**: `feature/pdf-document-integration`
