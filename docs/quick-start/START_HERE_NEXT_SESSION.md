═══════════════════════════════════════════════════════════════════
  � URGENT: AUTHENTICATION FIX REQUIRED - START HERE
═══════════════════════════════════════════════════════════════════

**Date:** October 16, 2025
**Priority:** 🔴 CRITICAL
**Issue:** User authentication broken - cannot create courses

Copy and paste this into your next chat with Claude:

---

Hello! I need URGENT help fixing a critical authentication issue in DualLing.

🚨 CRITICAL PROBLEM:
User role is undefined after login, blocking all teacher functionality.
Teacher cannot create courses (403 Forbidden errors).
Firebase tokens expire after 1 hour with no auto-refresh.

📋 READ THESE FILES FIRST (in order):

1. /docs/MAIN.md (IKB entry point - ALWAYS START HERE)
2. /docs/AUTHENTICATION_ISSUE.md (🔴 CRITICAL - Complete problem analysis)
3. /docs/FIREBASE_AUTH_SYSTEM.md (How auth should work)

🎯 WHAT'S BROKEN:
❌ decodedToken.role = undefined (should be 'teacher')
❌ GET /api/teacher/courses returns 403 Forbidden
❌ POST /api/teacher/courses returns 403 Forbidden
❌ Firebase tokens expire without refresh

🔧 WHAT NEEDS FIXING:
1. Set Firebase custom claims with user role during login
2. Implement automatic token refresh (every 50 minutes)
3. Verify Firestore user document has role='teacher'

🧪 TEST USER:
Email: test5@gmail.com
UID: SyfQ604Fiah7rVYjzDvObLbRd4o1
Role: Should be 'teacher' but currently undefined

� FILES TO EDIT:
- /app/api/auth/login/route.ts (add custom claims)
- /hooks/use-auth.tsx (add token refresh)
- Possibly /app/api/auth/register/route.ts

🎓 FOLLOW IKB RULES:
1. Read /docs/MAIN.md first
2. Read /docs/AUTHENTICATION_ISSUE.md for complete analysis
3. Fix incrementally, test after each change
4. Update IKB documentation after fixing
5. Follow 99% certainty rule

✅ SUCCESS CRITERIA:
User can login, navigate to dashboard, and create a course successfully.

Let's fix this ASAP! The user is blocked from testing the platform

📝 BEFORE CODING:
- Review the session handoff document
- Check current Firestore collections
- Verify security rules
- Ask if you have questions

🔑 IMPORTANT:
- Keep all courses FREE for testing
- Follow existing trace logging pattern
- Update docs as you code
- Test with curl commands

Once you've reviewed everything, confirm you're ready and we'll proceed!

---

For full details, see: NEXT_SESSION_PROMPT.md

═══════════════════════════════════════════════════════════════════
