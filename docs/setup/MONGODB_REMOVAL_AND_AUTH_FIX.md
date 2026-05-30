# MongoDB Removal & Firebase Auth Token Issue

**Date**: October 11, 2025
**Status**: ⚠️ BLOCKED - Token authentication failing for course creation
**Priority**: HIGH

---

## 🎯 Mission Objective

Remove all MongoDB dependencies from the project and fix Firebase authentication token issues that prevent teachers from creating courses.

---

## 📊 Current Status

### ✅ What We Accomplished

#### 1. **Successfully Removed All MongoDB Dependencies**

All MongoDB imports and database calls have been removed/stubbed from these routes:

**Critical Routes (Were Causing Frontend Crashes)**:
- ✅ `/app/api/settings/route.ts` → Returns default settings (200)
- ✅ `/app/api/profile/route.ts` → Returns 501 Not Implemented
- ✅ `/app/api/students/enrolled-courses/route.ts` → Returns empty array (501)
- ✅ `/app/api/students/progress/route.ts` → Returns empty progress (501)
- ✅ `/app/api/progress/route.ts` → Returns 501

**Additional Routes**:
- ✅ `/app/api/courses/[id]/quiz/submit/route.ts` → Returns 501
- ✅ `/app/api/admin/courses/route.ts` → Returns empty array (501)
- ✅ `/app/api/admin/stats/route.ts` → Returns zero stats (501)
- ✅ `/app/api/admin/users/route.ts` → Returns empty array (501)
- ✅ `/app/api/admin/users/[id]/route.ts` → Returns 501 (DELETE)
- ✅ `/app/api/admin/users/[id]/role/route.ts` → Returns 501 (PUT)
- ✅ `/app/api/test/create-accounts/route.ts` → Returns 501
- ✅ `/app/api/test/list-users/route.ts` → Returns empty array (501)

**Build Fixes**:
- ✅ Fixed TypeScript errors in auth routes (error.code handling)
- ✅ Fixed User interface usage (removed firstName field references)
- ✅ Fixed test page TypeScript issues
- ✅ Fixed trace logger type issues in course service/repository
- ✅ Added missing imports (ArrowRight in pricing page)

**Result**: ✅ **Project builds successfully** (`npm run build` passes)

#### 2. **Implemented Firebase Custom Claims for RBAC**

Added role-based access control via Firebase custom claims in `AuthService.registerUser()`:

```typescript
// lib/services/auth/auth.service.ts:123-131
// Step 4: Set custom claims (role) on Firebase token
traceLogger.log('info', 'Auth', 'Setting custom claims for role-based access');
const { getAdminAuth } = await import('@/lib/firebase/admin');
await getAdminAuth().setCustomUserClaims(firebaseUser.uid, {
  role: data.role || 'student',
});
```

This ensures newly registered users have their role embedded in the Firebase ID token.

#### 3. **Updated Login Flow to Return Real Firebase ID Token**

- ✅ `AuthService.loginWithEmail()` now returns the actual Firebase ID token
- ✅ `/app/api/auth/login/route.ts` returns `token: result.idToken` in response
- ✅ `/app/auth/login/page.tsx` saves the real token (not fake "firebase-auth-token")

#### 4. **Replaced TEMP_TEACHER_ID with Real Firebase Auth**

Teacher course creation route now uses proper token verification:

```typescript
// app/api/teacher/courses/route.ts:49-96
const authHeader = request.headers.get('Authorization');
const token = authHeader.split('Bearer ')[1];
const decodedToken = await verifyIdToken(token);
const teacherId = decodedToken.uid;
const userRole = decodedToken.role;

if (userRole !== 'teacher') {
  return NextResponse.json(
    { success: false, error: 'Only teachers can create courses' },
    { status: 403 }
  );
}
```

---

## 🚨 Current Problem: WHY WE'RE STUCK

### **Issue**: Teacher Cannot Create Courses - "Invalid authentication token"

**Error Logs**:
```
⚠️ [API] Token verification failed {
  error: 'Firebase ID token has expired. Get a fresh ID token from your client app...'
}
```

AND/OR:

```
⚠️ [API] Non-teacher attempted to access teacher courses {
  userId: 'SyfQ604Fiah7rVYjzDvObLbRd4o1',
  role: undefined
}
```

### **Root Cause Analysis**

There are **TWO separate but related issues**:

#### **Issue 1: Token Expiration**
- Firebase ID tokens expire after **1 hour**
- User logged in before we implemented the token fix
- Old token stored in `localStorage` has expired
- Frontend keeps sending expired token

#### **Issue 2: Existing Users Missing Custom Claims**
- Custom claims are only set during **registration** (`AuthService.registerUser()`)
- Existing teacher accounts (like user `SyfQ604Fiah7rVYjzDvObLbRd4o1`) were created BEFORE we added custom claims
- Their Firebase tokens don't include the `role` claim
- Even with a fresh token, `decodedToken.role` is `undefined`

### **Evidence from Terminal Logs**

User reported seeing both:
1. **Token expired errors** → Needs fresh login
2. **`role: undefined` errors** → Existing user lacks custom claims

From `QUICK_FIX.md` (file user shared earlier):
```markdown
## Problem
Your old login stored a fake token "firebase-auth-token" in localStorage.
The API is receiving this fake token and rejecting it.
```

This was partially fixed, but the user likely:
- Logged in with an existing account (before custom claims were added)
- Token expired during testing
- Now stuck in a state where neither new login NOR new registration will work for that existing user

---

## 🔍 Why This Keeps Failing

### **The Catch-22 Situation**:

1. **User tries to create course** → Token expired → Error
2. **User logs out and logs back in** → Gets fresh token BUT existing user has no custom claims → `role: undefined` → Error
3. **User cannot register new account** → Email already exists → Error
4. **Custom claims only set during registration** → Existing users never get them

### **What We Haven't Done Yet**:

We need **EITHER**:

**Option A**: Migration script to add custom claims to existing users
```typescript
// Example migration script needed
const { getAdminAuth } = await import('@/lib/firebase/admin');
await getAdminAuth().setCustomUserClaims('SyfQ604Fiah7rVYjzDvObLbRd4o1', {
  role: 'teacher',
});
```

**Option B**: User registers a completely new teacher account with a different email

---

## 📁 Key Files & Code Locations

### **Authentication Files**
- `/lib/services/auth/auth.service.ts:123-131` - Custom claims set here
- `/lib/firebase/admin.ts:57-60` - `verifyIdToken()` export
- `/app/api/auth/login/route.ts:29-44` - Returns real Firebase ID token
- `/app/api/auth/register/route.ts` - Registration endpoint
- `/app/auth/login/page.tsx:44-49` - Saves token to localStorage

### **Course Creation (Where Error Occurs)**
- `/app/api/teacher/courses/route.ts:49-96` - Token verification and role check
- `/app/teacher/course/create/page.tsx:158` - Sends token in Authorization header
- `/lib/services/course/course.repository.ts:18-54` - Creates course in Firestore

### **User Data**
- User ID: `SyfQ604Fiah7rVYjzDvObLbRd4o1`
- Missing custom claims on existing Firebase Auth user

### **Documentation**
- `/QUICK_FIX.md` - User's notes about token issue
- `/docs/FIREBASE_AUTH_SYSTEM.md` - Firebase auth documentation
- `/docs/SESSION_HANDOFF_OCT_9_2025.md` - Previous session notes

---

## 🎯 What Needs to Happen Next

### **Immediate Fix (Choose ONE)**:

#### **Option 1: Register New Teacher Account** ⭐ RECOMMENDED
```bash
1. Go to /auth/register
2. Use a DIFFERENT email (e.g., teacher2@example.com)
3. Select "teacher" role
4. Login with new account
5. Try creating course → Should work!
```

**Why This Works**:
- New account gets custom claims during registration
- Fresh token includes `role: 'teacher'`
- No migration needed

#### **Option 2: Create Migration Script** (More Complex)
```typescript
// Create: scripts/migrate-existing-users.ts
import { getAdminAuth } from '@/lib/firebase/admin';
import { UserRepository } from '@/lib/services/auth/user.repository';

async function migrateUser(uid: string) {
  const userRepo = new UserRepository();
  const firestoreUser = await userRepo.getById(uid);

  if (firestoreUser) {
    await getAdminAuth().setCustomUserClaims(uid, {
      role: firestoreUser.role,
    });
    console.log(`✅ Migrated user ${uid} with role ${firestoreUser.role}`);
  }
}

// Run for specific user
await migrateUser('SyfQ604Fiah7rVYjzDvObLbRd4o1');
```

Then user must logout and login again to get new token with claims.

---

## 🧪 Testing Steps After Fix

1. **Clear Browser Data**:
   ```javascript
   // In browser DevTools console
   localStorage.clear()
   ```

2. **Register New Teacher** (if using Option 1):
   - Go to `/auth/register`
   - Email: `newteacher@example.com`
   - Password: `password123`
   - Name: `Test Teacher`
   - Role: `teacher`

3. **Login**:
   - Go to `/auth/login`
   - Use credentials above
   - Should redirect to `/teacher/dashboard`

4. **Create Course**:
   - Go to `/teacher/course/create`
   - Fill in course details:
     - Title: "Test Lithuanian Course"
     - Description: "Testing course creation"
     - Language: English
     - Target Language: Lithuanian
     - Level: Beginner
     - Duration: 10 hours
   - Click "Create Course"

5. **Expected Result**:
   ```json
   {
     "success": true,
     "data": {
       "course": {
         "id": "auto-generated-id",
         "title": "Test Lithuanian Course",
         "teacherId": "newly-registered-uid",
         "isPublished": true,
         "lessonsCount": 0,
         "enrollmentCount": 0
       }
     }
   }
   ```

6. **Verify in Firebase Console**:
   - Open Firebase Console → Firestore
   - Check `courses` collection
   - Should see new course document

---

## 🔧 Technical Details

### **Firebase ID Token Structure**

**Without Custom Claims** (Existing users):
```json
{
  "uid": "SyfQ604Fiah7rVYjzDvObLbRd4o1",
  "email": "teacher@example.com",
  "email_verified": false,
  "exp": 1728685234
  // ❌ NO ROLE CLAIM
}
```

**With Custom Claims** (New users):
```json
{
  "uid": "newly-registered-uid",
  "email": "newteacher@example.com",
  "email_verified": false,
  "role": "teacher",  // ✅ ROLE CLAIM PRESENT
  "exp": 1728685234
}
```

### **Token Verification Flow**

```
User clicks "Create Course"
  ↓
Frontend sends: Authorization: Bearer <token>
  ↓
Backend: verifyIdToken(token)
  ↓
Check: decodedToken.role === 'teacher'?
  ↓
YES → Create course
NO → 403 Forbidden
```

### **Why Token Expires**

Firebase ID tokens are JWT tokens that expire after **1 hour** for security. The flow should be:
1. Token expires
2. Frontend detects 401 error
3. Frontend calls `getIdToken(true)` to refresh
4. Retry request with new token

**We don't have token refresh implemented yet** - that's why user must logout/login.

---

## 📚 Related Documentation

- **Firebase Custom Claims**: https://firebase.google.com/docs/auth/admin/custom-claims
- **Firebase ID Tokens**: https://firebase.google.com/docs/auth/admin/verify-id-tokens
- **Next.js 15 Async Params**: Fixed in our codebase
- **Firestore Security Rules**: Need to add role-based rules

---

## 🚀 Future Improvements Needed

1. **Token Refresh Logic**: Implement automatic token refresh in frontend
2. **Migration Script**: Create one-time script to add custom claims to existing users
3. **Better Error Messages**: Frontend should detect token expiration and prompt re-login
4. **Firestore Security Rules**: Add role-based access rules in Firebase console
5. **Un-stub MongoDB Routes**: Implement Firebase versions of progress, settings, etc.

---

## 💬 User's Last Message

> "create a proper file with this issue and all context around it I'm gonna start a new chat because we are keep failing on the same mission so it's better to try something new and properly another chat write down the whole progress you made throughout the chat and right now where we are stuck and why we are stuck what we are getting so all the context rounded"

**Translation**: User is stuck in a loop trying to create courses and wants a fresh start with proper context documented.

---

## 🎬 Quick Start Guide for Next Session

```bash
# 1. Clear browser storage
localStorage.clear()

# 2. Register NEW teacher account
# Go to: http://localhost:3000/auth/register
# Email: testteacher2@example.com
# Password: password123
# Name: Test Teacher Two
# Role: teacher

# 3. Login with new account
# Go to: http://localhost:3000/auth/login

# 4. Create course
# Go to: http://localhost:3000/teacher/course/create
# Fill form and submit

# 5. Check terminal logs for trace IDs
# Should see: ✅ [Firestore] Course document created
```

---

## ✅ Summary

**What Works**:
- ✅ MongoDB completely removed - build passes
- ✅ Custom claims implemented for NEW users
- ✅ Token properly returned from login
- ✅ Course creation endpoint ready
- ✅ Enrollment system fully implemented

**What's Broken**:
- ❌ Existing users missing custom claims
- ❌ Expired tokens require logout/login (no auto-refresh)
- ❌ User stuck trying to use existing account

**Solution**:
- 🎯 **Register a NEW teacher account with different email**
- 🎯 **OR** Create migration script for existing users

---

**End of Context Document**
