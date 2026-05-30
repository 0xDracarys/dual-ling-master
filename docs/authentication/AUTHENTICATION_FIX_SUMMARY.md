# Authentication Fix Summary

**Status:** ✅ Completed  
**Date:** October 17, 2025  
**Owner:** ZenType Architect (J)  

---

## 1. Overview

Critical authentication defects blocked teachers from creating courses because Firebase ID tokens were missing the `role` custom claim and expired after one hour without automatic refresh. This fix hardens both the backend and frontend so that role claims are always present, tokens are refreshed proactively, and client storage stays in sync with the server.

**Additional Fix (October 17, 2025 - Late):** Resolved Firestore validation errors where `undefined` values in course/lesson data were being rejected by Firestore's strict type validation.

---

## 2. Key Changes

### 2.1 Backend (Next.js API + Firebase Admin)
- **Role claim re-sync on login:** `AuthService.loginWithEmail` now verifies the Firestore user document, throws if the `role` field is absent, re-applies custom claims through Firebase Admin, and forces a fresh ID token that includes the claim. The function also returns the Firebase refresh token and computed expiry time.
- **Token verification guardrail:** `verifyIdToken` inspects decoded tokens for a missing `role`. When absent, it fetches the Firestore user document, injects the role into the decoded token, and repairs the custom claims in Firebase Auth. This prevents legacy tokens from triggering false 403 responses.
- **Firestore undefined value filtering:** All repository `create` and `update` methods now filter out `undefined` values before writing to Firestore, preventing validation errors. This affects:
  - `CourseRepository.create()` - filters undefined fields from course data
  - `LessonRepository.create()` - filters undefined fields from lesson data
  - `EnrollmentRepository.update()` - filters undefined fields from enrollment updates
  - Course creation API - conditionally includes `thumbnailUrl` only when defined

### 2.2 Frontend (React Auth Context)
- **Refresh token storage:** The auth context persists the Firebase refresh token (`auth_refresh_token`) alongside the ID token and user object.
- **Automatic refresh cycle:** Tokens self-refresh 5 minutes before expiration, on browser focus, and on visibility changes by calling the Firebase Secure Token endpoint. This keeps sessions alive without user intervention.
- **Graceful failure handling:** Invalid or revoked refresh tokens trigger a controlled logout while avoidable network errors simply log telemetry.

### 2.3 API Contract
- `/api/auth/login` now returns `{ token, refreshToken, tokenExpiresAt }` so the frontend can manage token refresh windows precisely.

---

## 3. Validation

### 3.1 Automated
- `pnpm lint` *(pass with warnings)* — ensures TypeScript, ESLint, and Next.js rules remain green (existing project warnings unchanged).

### 3.2 Manual QA Checklist
1. Clear browser storage for `localhost:3000` (cookies + localStorage).
2. Log in as teacher (`test6@gmail.com`).
3. Inspect `localStorage`:
   - `auth_user.role` should equal `"teacher"`.
   - `auth_token` decodes (via [jwt.io](https://jwt.io)) with payload containing `"role": "teacher"` and `exp` ≈ 1 hour ahead.
   - `auth_refresh_token` present and non-empty.
4. Wait >60 minutes or advance system clock 65 minutes, confirm auto-refresh keeps session alive (no forced logout, `auth_token` timestamp updates).
5. Visit `/teacher/dashboard` → courses load without 401/403 responses.
6. Create a test course → POST `/api/teacher/courses` succeeds, dashboard reflects the new course.

> **Tip:** If the decoded token still lacks a `role`, open Firestore → `users/{uid}` and ensure the document contains a `role` string (e.g., `"teacher"`). Update the field once, log out/in, and the claim will sync automatically.

---

## 4. Operational Notes
- **Legacy data:** Accounts created before October 2025 may be missing the `role` field. Once the field is added manually (or via backfill script), the claim repair logic will propagate the correct value on the next login.
- **Security posture:** Refresh tokens remain in `localStorage`; consider migrating to HTTP-only cookies in a future hardening phase if stricter security is required.
- **Firestore validation:** All `undefined` values are now filtered before Firestore writes. This prevents the "Cannot use undefined as a Firestore value" errors that were blocking course creation.

---

## 5. Follow-Up Suggestions
- Add a Firebase Admin script to backfill the `role` field for all existing users and to confirm custom claims alignment in bulk.
- Expand automated integration tests to cover the complete teacher login → course creation flow using the new token refresh utilities.
- Monitor auth-related logs for new warnings (`Auth` namespace) to catch edge cases early.
- Consider implementing Firestore settings to `ignoreUndefinedProperties` globally if preferred over manual filtering.

---

## 6. Rollback Plan
- Revert commits touching:
  - `lib/services/auth/auth.service.ts`
  - `app/api/auth/login/route.ts`
  - `lib/firebase/admin.ts`
  - `hooks/use-auth.tsx`
  - `app/auth/login/page.tsx`
  - `app/api/teacher/courses/route.ts`
  - `lib/services/course/course.repository.ts`
  - `lib/services/course/lesson.repository.ts`
  - `lib/services/enrollment/enrollment.repository.ts`
- Remove `auth_refresh_token` references from client storage.

Rollback reinstates the previous (buggy) behavior, so apply only if a regression is confirmed and cannot be hot-fixed quickly.
