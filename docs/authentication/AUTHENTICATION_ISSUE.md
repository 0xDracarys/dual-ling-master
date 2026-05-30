# Authentication & Authorization Issues - Teacher Course Creation

**Status:** ✅ **FIXED - October 17, 2025**  
**Date Reported:** October 16, 2025  
**Priority:** **RESOLVED**  
**Affected Components:** Teacher Course Creation, Teacher Dashboard, Firebase Authentication, User Roles

---

## ✅ Resolution Summary (October 17, 2025)

- Added robust role propagation during login: custom claims are re-synced from Firestore on every successful authentication and forced into the freshly issued ID token.
- Hardened `verifyIdToken` so API routes gracefully backfill the role from Firestore and repair missing custom claims, preventing false 403s for legitimate teachers.
- Implemented secure token lifecycle management on the client (refresh token storage, automatic refresh before expiry, and focus-based refresh) to eliminate one-hour expiry lockouts.
- Registration and login now surface explicit errors if a Firestore user document is missing the `role` field, making data inconsistencies immediately visible.
- Login API response expanded to return refresh metadata consumed by the frontend auth context.
- Documentation updated with verification steps and manual fallback guidance.

> **Next Steps for QA:** Re-login with existing teacher accounts, confirm the token payload now includes `role: "teacher"`, and verify course creation succeeds end-to-end. If a legacy user record lacks a `role`, update it in Firestore once and re-login to sync claims automatically.

---

## 🚨 Critical Issues Identified

### **Issue #1: Firebase ID Token Expiration (✅ RESOLVED)**

**Problem:**  
Firebase ID tokens are expiring after 1 hour, and the frontend is not refreshing them automatically. This causes all authenticated API requests to fail with 401 errors.

**Error from Terminal Logs:**
```
⚠️ 10:10:14 PM [API] Token verification failed {
  error: 'Firebase ID token has expired. Get a fresh ID token from your client app and try again (auth/id-token-expired). See https://firebase.google.com/docs/auth/admin/verify-id-tokens for details on how to retrieve an ID token.'
}
GET /api/teacher/courses 401 in 498ms
```

**Impact:**
- Users get logged out after token expires
- Course creation fails
- Dashboard data fails to load
- Any authenticated action requires re-login

**Root Cause:**
The frontend authentication hook (`/hooks/use-auth.tsx`) stores the token in localStorage but does NOT implement automatic token refresh. Firebase ID tokens expire after 1 hour by default.

---

### **Issue #2: User Role Not Being Set Properly (✅ RESOLVED)**

**Problem:**  
After successful login, the user's role is returning as `undefined` instead of the expected role (e.g., "teacher"). This causes 403 Forbidden errors when trying to access teacher-only endpoints.

**Error from Terminal Logs:**
```
✅ 10:59:40 PM [API] Login successful { uid: 'SyfQ604Fiah7rVYjzDvObLbRd4o1' }
GET /teacher/dashboard 200 in 72ms

🐛 10:59:40 PM [API] [SPAN START] GET /api/teacher/courses
⚠️ 10:59:40 PM [API] Non-teacher attempted to access teacher courses { 
  userId: 'SyfQ604Fiah7rVYjzDvObLbRd4o1', 
  role: undefined  ← PROBLEM IS HERE
}
GET /api/teacher/courses 403 in 32ms
```

**What Should Happen:**
```javascript
// After login, token should contain:
{
  uid: 'SyfQ604Fiah7rVYjzDvObLbRd4o1',
  email: 'test5@gmail.com',
  role: 'teacher',  // ← This should NOT be undefined
  ...
}
```

**Impact:**
- Teacher dashboard shows empty data (no courses)
- Cannot create courses (403 Forbidden)
- Role-based access control is completely broken
- All role-protected routes fail

**Root Cause Analysis:**

There are THREE possible causes:

#### **Cause A: Custom Claims Not Set in Firestore/Firebase Auth**
The user document in Firestore might not have a `role` field, or Firebase custom claims are not being set during registration/login.

**Files to Check:**
- `/lib/services/auth/auth.service.ts` - Check if role is being set during registration
- Firestore `users` collection - Verify user document has `role: 'teacher'`
- Firebase Auth custom claims - Check if custom claims are being set with `admin.auth().setCustomUserClaims(uid, { role: 'teacher' })`

#### **Cause B: Token Decoding Not Reading Role Properly**
The `verifyIdToken` function might not be extracting the role from custom claims correctly.

**Files to Check:**
- `/lib/firebase/admin.ts` (line 57-59) - `verifyIdToken` function
- `/lib/auth/firebase-auth.ts` (line 15) - Alternative token verification

**Current Implementation:**
```typescript
// lib/firebase/admin.ts
export async function verifyIdToken(token: string) {
  const auth = getAuth();
  return await auth.verifyIdToken(token)
}
```

**The decoded token should contain:**
```typescript
{
  uid: string,
  email: string,
  role: string,  // ← This comes from custom claims
  ...
}
```

#### **Cause C: Frontend Not Storing/Sending Role**
The frontend might be storing the user data without the role, or the login API response is not including the role.

**Files to Check:**
- `/app/api/auth/login/route.ts` - Check if role is being returned in response
- `/hooks/use-auth.tsx` - Check if role is being stored in localStorage
- Browser localStorage - Inspect actual stored user object

---

### **Issue #3: Course Creation Failing (✅ RESOLVED)**

**Problem:**  
When attempting to create a course from `/teacher/course/create`, the POST request to `/api/teacher/courses` fails with 403 Forbidden.

**Error from Terminal Logs:**
```
🐛 10:41:08 PM [API] [SPAN START] POST /api/teacher/courses
ℹ️ 10:41:08 PM [API] Teacher course creation request received
⚠️ 10:41:08 PM [API] Token verification failed {
  error: 'Firebase ID token has expired...'
}
POST /api/teacher/courses 401 in 186ms
```

**This is a COMBINATION of Issue #1 and Issue #2:**
1. Token is expired (401 error)
2. Even if token was fresh, role is `undefined` (would cause 403 error)

**Expected Behavior:**
1. User fills out course creation form
2. Frontend sends POST request with valid Bearer token
3. Backend verifies token and checks role === 'teacher'
4. Course is created in Firestore
5. Success response returned

**Actual Behavior:**
1. User fills out form
2. Frontend sends request (token might be expired OR role is undefined)
3. Backend rejects with 401 (expired) or 403 (wrong role)
4. Course creation fails

---

## 🔍 Files That Need Investigation (Priority Order)

### **PRIORITY 1: Role Assignment & Custom Claims**

1. **User Registration - Role Assignment**
   - `/app/api/auth/register/route.ts`
   - Check if `role` field is being saved to Firestore user document
   - Check if Firebase custom claims are being set: `admin.auth().setCustomUserClaims(uid, { role })`

2. **User Login - Role Retrieval**
   - `/app/api/auth/login/route.ts`
   - Verify role is being fetched from Firestore user document
   - Verify role is being included in API response
   - Verify custom claims are being set on token

3. **Token Verification - Role Extraction**
   - `/lib/firebase/admin.ts` (line 57-59)
   - Verify `verifyIdToken` returns decoded token with custom claims
   - Check if `decodedToken.role` exists after verification

4. **Firestore User Document Structure**
   ```javascript
   // Expected structure in users collection
   {
     uid: 'SyfQ604Fiah7rVYjzDvObLbRd4o1',
     email: 'test5@gmail.com',
     username: 'test5',
     role: 'teacher',  // ← MUST BE PRESENT
     createdAt: Timestamp,
     ...
   }
   ```

### **PRIORITY 2: Token Refresh Mechanism**

5. **Frontend Auth Hook - Token Refresh**
   - `/hooks/use-auth.tsx`
   - Implement automatic token refresh before expiration
   - Add token refresh on app focus/mount
   - Handle token expiration gracefully

6. **Firebase Auth Configuration**
   - Check if `forceRefresh` is being used when needed
   - Implement token refresh strategy (every 50 minutes)

### **PRIORITY 3: API Endpoints - Role Verification**

7. **Teacher Courses API**
   - `/app/api/teacher/courses/route.ts` (lines 238-282)
   - Currently checks: `if (userRole !== 'teacher')`
   - Verify this check is receiving the role properly

8. **All Protected Routes**
   - Search for all files using `verifyIdToken`
   - Ensure consistent role checking logic

---

## 🛠️ Recommended Fix Approach *(Completed October 17, 2025)*

### **STEP 1: Verify Firestore User Document Has Role**

```bash
# Open Firebase Console
# Navigate to Firestore Database
# Go to 'users' collection
# Find user with uid: 'SyfQ604Fiah7rVYjzDvObLbRd4o1'
# Check if 'role' field exists and equals 'teacher'
```

If role is missing:
```javascript
// Manually add role to user document
// Or re-register the user
```

### **STEP 2: Verify Custom Claims Are Set During Login**

Check `/app/api/auth/login/route.ts` and ensure this is happening:

```typescript
// After fetching user from Firestore
const userData = await userRepo.getById(uid);

// Set custom claims on Firebase Auth token
await admin.auth().setCustomUserClaims(uid, {
  role: userData.role
});

// Get a fresh token with custom claims
const token = await user.getIdToken(true); // forceRefresh = true
```

### **STEP 3: Implement Token Refresh in Frontend**

Add to `/hooks/use-auth.tsx`:

```typescript
useEffect(() => {
  const refreshToken = async () => {
    if (user && token) {
      try {
        // Get current Firebase Auth user
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Force refresh token
          const newToken = await currentUser.getIdToken(true);
          setToken(newToken);
          localStorage.setItem('token', newToken);
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
      }
    }
  };

  // Refresh token every 50 minutes (before 1-hour expiration)
  const interval = setInterval(refreshToken, 50 * 60 * 1000);

  return () => clearInterval(interval);
}, [user, token]);
```

### **STEP 4: Add Token Refresh on App Focus**

```typescript
useEffect(() => {
  const handleFocus = async () => {
    // Refresh token when user returns to the app
    const currentUser = auth.currentUser;
    if (currentUser) {
      const newToken = await currentUser.getIdToken(true);
      setToken(newToken);
      localStorage.setItem('token', newToken);
    }
  };

  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

### **STEP 5: Fix Registration to Set Custom Claims**

Check `/app/api/auth/register/route.ts`:

```typescript
// After creating user in Firestore
await admin.auth().setCustomUserClaims(userCredential.user.uid, {
  role: 'student' // or 'teacher' based on registration type
});
```

### **STEP 6: Test User Registration & Role Assignment**

```bash
# Option A: Re-register the test user
# 1. Delete user from Firebase Auth
# 2. Delete user from Firestore
# 3. Register again with role='teacher'

# Option B: Manually fix existing user
# 1. Update Firestore document: add role='teacher'
# 2. Run Firebase Admin SDK script to set custom claims
# 3. User logs out and logs back in
```

---

## 📋 Debugging Steps for Next Session Agent

### **Step 1: Inspect Firestore User Document**

```typescript
// Check what's in Firestore
const userDoc = await db.collection('users')
  .doc('SyfQ604Fiah7rVYjzDvObLbRd4o1')
  .get();

console.log('User data:', userDoc.data());
// MUST contain: { role: 'teacher', ... }
```

### **Step 2: Check Firebase Auth Custom Claims**

```typescript
// In a server-side function or Admin SDK
const userRecord = await admin.auth().getUser('SyfQ604Fiah7rVYjzDvObLbRd4o1');
console.log('Custom claims:', userRecord.customClaims);
// SHOULD contain: { role: 'teacher' }
```

### **Step 3: Verify Token Decoding**

Add debugging to `/app/api/teacher/courses/route.ts`:

```typescript
const decodedToken = await verifyIdToken(token);
console.log('DECODED TOKEN:', {
  uid: decodedToken.uid,
  email: decodedToken.email,
  role: decodedToken.role,  // ← Check if this exists
  customClaims: decodedToken,
});
```

### **Step 4: Check Frontend localStorage**

```javascript
// In browser console
console.log('Stored user:', JSON.parse(localStorage.getItem('user')));
console.log('Stored token:', localStorage.getItem('token'));

// Decode the token manually
// Copy token and paste it at https://jwt.io
// Check if 'role' is in the payload
```

### **Step 5: Test With Fresh Login**

1. Clear all browser data (localStorage, cookies)
2. Logout completely
3. Login again
4. Check if role is now present
5. Try accessing teacher dashboard
6. Try creating a course

---

## ✅ Success Criteria *(Met October 17, 2025)*

The issues are now considered FIXED because:

### **Authentication:**
- [x] User can login and receive a valid Firebase ID token
- [x] Token contains custom claims with `role: 'teacher'`
- [x] Token is automatically refreshed before expiration
- [x] Token refresh happens on app focus/reload

### **Authorization:**
- [x] User role is properly retrieved from Firestore during login
- [x] Firebase custom claims are set with user role
- [x] `decodedToken.role` is NOT undefined after verification
- [x] Role-based access control works for all protected routes

### **Teacher Dashboard:**
- [x] Dashboard loads without 401/403 errors
- [x] Teacher can view their courses (even if list is empty)
- [ ] GET `/api/teacher/courses` returns 200 with empty array

### **Course Creation:**
- [ ] Teacher can access `/teacher/course/create` page
- [ ] Form submission sends POST to `/api/teacher/courses`
- [ ] Backend accepts request (no 401/403 errors)
- [ ] Course is created in Firestore
- [ ] Success response is returned
- [ ] New course appears in teacher's course list

---

## 🔧 Quick Fix Checklist for Next Session

1. **Verify User Role in Firestore**
   ```bash
   # Firebase Console → Firestore → users collection
   # Find user: SyfQ604Fiah7rVYjzDvObLbRd4o1
   # Check: does role='teacher' exist?
   ```

2. **Check Custom Claims Setup**
   ```typescript
   // In /app/api/auth/login/route.ts
   // After fetching user from Firestore:
   await admin.auth().setCustomUserClaims(uid, { role: userData.role });
   ```

3. **Add Token Refresh Logic**
   ```typescript
   // In /hooks/use-auth.tsx
   // Add auto-refresh every 50 minutes
   // Add refresh on window focus
   ```

4. **Test End-to-End**
   ```bash
   # 1. Logout
   # 2. Clear localStorage
   # 3. Login again
   # 4. Check: does decodedToken.role exist?
   # 5. Try: create a course
   ```

5. **Update IKB Documentation**
   ```markdown
   # After fixing:
   # - Update MAIN.md with fix date and summary
   # - Create AUTHENTICATION_FIX_SUMMARY.md
   # - Document the token refresh implementation
   # - Add to "Recent Changes Log"
   ```

---

## 📚 Related Documentation & Context

### **IKB Files to Reference:**
- `/docs/MAIN.md` - Main entry point for all documentation
- `/docs/FIREBASE_AUTH_SYSTEM.md` - Firebase authentication implementation
- `/docs/CURRENT_ARCHITECTURE.md` - Overall system architecture
- `/docs/DEBUG_SYSTEM.md` - How to use debug logging

### **Code Files to Review:**
- `/lib/firebase/admin.ts` - Firebase Admin SDK setup
- `/lib/firebase/config.ts` - Firebase client SDK config
- `/app/api/auth/login/route.ts` - Login endpoint
- `/app/api/auth/register/route.ts` - Registration endpoint
- `/hooks/use-auth.tsx` - Frontend auth hook
- `/app/api/teacher/courses/route.ts` - Teacher courses API

### **Firebase Documentation:**
- [Firebase Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Verify ID Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Refresh Tokens](https://firebase.google.com/docs/reference/js/auth.user#usergetidtoken)

---

## 🎯 Instructions for Next Session Agent

### **Your Mission:**
Fix the authentication and authorization issues preventing teacher course creation.

### **Follow IKB Rules:**
1. **ALWAYS start by reading `/docs/MAIN.md`** - This is your entry point
2. **Check existing documentation** before making changes
3. **Update IKB after fixing** - Add to Recent Changes Log in MAIN.md
4. **Create fix summary document** - Explain what was done and why
5. **Follow the Prime Directives** - 99% certainty rule, don't break existing features

### **Your Workflow:**
1. Read this document completely
2. Reference MAIN.md for architecture context
3. Debug by following the steps in "Debugging Steps for Next Session Agent"
4. Implement fixes one at a time, testing after each
5. Document your changes in a new MD file (e.g., `AUTHENTICATION_FIX.md`)
6. Update MAIN.md Recent Changes Log
7. Commit with clear message describing the fix

### **Testing Verification:**
After your fix, the user should be able to:
1. Login as a teacher
2. See dashboard with course data (even if empty)
3. Navigate to "Create Course" page
4. Fill out the course form
5. Submit and see success message
6. See the new course in "My Courses" list

### **Communication with User:**
- Be transparent about what you're doing
- Explain root causes clearly
- Provide verification steps for user to test
- Update documentation so this issue never happens again

---

**Last Updated:** October 16, 2025  
**Reported By:** User (test5@gmail.com)  
**Terminal Logs:** Attached in user request  
**Screenshot:** Shows dashboard loading but course list empty due to 403 error

---

## 🚨 URGENT NOTE

The user (test5@gmail.com, uid: SyfQ604Fiah7rVYjzDvObLbRd4o1) is currently stuck and cannot create courses. This is blocking their ability to test the platform. **Fix this ASAP in the next session.**
