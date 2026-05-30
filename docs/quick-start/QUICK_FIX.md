# 🔧 QUICK FIX: Token Issue

## Problem
Your old login stored a fake token `"firebase-auth-token"` in localStorage.
The API is receiving this fake token and rejecting it.

## Solution: Log Out and Log Back In

### Step 1: Clear Browser Data
```
1. Open browser DevTools (F12)
2. Go to Application tab → Local Storage
3. Find and delete:
   - auth_token
   - auth_user
4. OR just run in console:
   localStorage.clear()
```

### Step 2: Login Again
```
1. Go to /auth/login
2. Login with your teacher account
3. This will now save the REAL Firebase ID token
```

### Step 3: Try Creating Course
```
1. Go to /teacher/course/create
2. Fill in course details
3. Click "Create Course"
✅ Should work now!
```

---

## What Was Fixed

**Before (Broken)**:
```javascript
// Old login code saved this:
login("firebase-auth-token", user) // ❌ Fake token
```

**After (Fixed)**:
```javascript
// New login code saves this:
login(data.token, user) // ✅ Real Firebase ID token from backend
```

The backend now returns:
```json
{
  "success": true,
  "token": "eyJhbGci..." // <- Real Firebase JWT
}
```

---

## Why This Happened

1. You logged in BEFORE I fixed the token system
2. Old token was saved to localStorage
3. Frontend keeps using old token until you logout

---

## Quick Test in Browser Console

```javascript
// Check what token you currently have
console.log(localStorage.getItem('auth_token'))

// If it says "firebase-auth-token" - that's the problem!
// Clear it:
localStorage.clear()

// Then login again
```

---

**TL;DR: Just logout and login again! 🎉**
