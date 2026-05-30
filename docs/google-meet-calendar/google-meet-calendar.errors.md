# Google Meet & Calendar Integration - Error History

**Version:** 1.0.0  
**Created:** October 30, 2025  
**Last Updated:** October 30, 2025, 11:45 PM GMT+2  
**Purpose:** Track errors, root causes, solutions, and prevention methods

---

## 🐛 Error Log

### **ERROR-001: Students Not Displaying in Class Scheduling Modals (403 Unauthorized)**

**Error ID:** `GOOGLE-MEET-001`  
**Severity:** 🔴 **HIGH** (Blocks core feature - cannot schedule classes with students)  
**First Occurrence:** October 30, 2025  
**Last Occurrence:** October 30, 2025  
**Status:** ✅ **RESOLVED**

#### **Symptoms:**
1. Schedule Class Modal shows "No enrolled students" for all courses
2. Instant Meeting Modal shows "No enrolled students" for all courses
3. Console logs show repeated 403 errors:
   ```
   ❌ [Enrollment] Failed to get enrollments {
     error: 'Unauthorized: Only course owner can view enrollments'
   }
   GET /api/courses/[id]/enrollments 403 in XXXms
   ```
4. Multiple course IDs failing: `2l7VdVb0JbXRGs0zlgLb`, `0nztcJxev6uUoJDR2pk3`, etc.

#### **Root Cause Analysis:**
**Primary Cause:** Modal components fetch **ALL published courses** without filtering by teacherId

**Technical Flow:**
1. `ScheduleClassModal.tsx` calls `loadTeacherCourses()` → `GET /api/courses`
2. `/api/courses` returns ALL published courses (no teacherId filter applied)
3. User selects a course from dropdown (may not be owned by them)
4. Modal calls `loadEnrolledStudents(courseId)` → `GET /api/courses/[id]/enrollments`
5. Enrollment API validates ownership: `course.teacherId !== loggedInTeacherId`
6. API correctly returns 403: "Unauthorized: Only course owner can view enrollments"

**Why This Happens:**
- The `/api/courses` endpoint supports `teacherId` query parameter but modal doesn't use it
- Modal was designed to show all courses (generic component) but should only show teacher's courses

#### **Previous Failed Fix (October 30, 2025 - Early Morning):**
**Attempted Solution:** Changed `traceLogger.log('error')` to `log('warn')` in modal components
**Why It Failed:** This only prevented Next.js error boundary crashes but didn't fix the authorization issue
**Files Modified:**
- `components/teacher/schedule-class-modal.tsx` (3 changes)
- `components/teacher/instant-meeting-modal.tsx` (4 changes)
- `components/teacher/upcoming-classes-widget.tsx` (1 change)
- `app/teacher/classes/page.tsx` (3 changes)

**Result:** UI no longer crashes, but students still don't display (403 errors persist)

#### **Correct Solution (October 30, 2025 - Late Night):**
**Fix Applied:** Add `teacherId` query parameter to course fetching in both modals

**Code Changes:**

**File 1:** `components/teacher/schedule-class-modal.tsx` (Line ~149)
```tsx
// BEFORE (fetches ALL courses):
const response = await fetch('/api/courses', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// AFTER (fetches only teacher's courses):
const response = await fetch(`/api/courses?teacherId=${user?.uid}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**File 2:** `components/teacher/instant-meeting-modal.tsx` (Line ~119)
```tsx
// BEFORE (fetches ALL courses):
const response = await fetch('/api/courses', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// AFTER (fetches only teacher's courses):
const response = await fetch(`/api/courses?teacherId=${user?.uid}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

**Why This Works:**
1. `/api/courses` already supports `teacherId` filter (line 72 in `app/api/courses/route.ts`)
2. Filter is applied in `CourseService.getPublishedCourses()` via Firestore query
3. Only courses where `course.teacherId === user.uid` are returned
4. Teacher can now only select their own courses
5. Enrollment API will always succeed (teacher always owns their own courses)

#### **Prevention Methods:**
1. **Client-Side Validation Rule:** Any component that fetches courses for teacher actions MUST filter by `teacherId`
2. **Code Review Checklist:** Before committing teacher components, verify:
   - [ ] Does this component fetch courses?
   - [ ] Is it for a teacher-only action (schedule, edit, delete)?
   - [ ] Does the API call include `?teacherId=${user.uid}` parameter?
3. **API Design Pattern:** Teacher-specific endpoints should require `teacherId` in body/params, not rely on client filtering
4. **Testing Protocol:** Always test modals with Playwright MCP using a real teacher account with multiple courses

#### **Files Changed:**
- ✅ `components/teacher/schedule-class-modal.tsx` (Line ~149 - added teacherId param)
- ✅ `components/teacher/instant-meeting-modal.tsx` (Line ~119 - added teacherId param)
- ✅ `docs/google-meet-calendar/google-meet-calendar.errors.md` (This file - error documentation)
- ✅ `docs/google-meet-calendar/google-meet-calendar.current.md` (Updated lessons learned)

#### **Verification Steps:**
1. ✅ Hard refresh browser (Cmd+Shift+R) to clear cached API responses
2. ✅ Open Schedule Class Modal
3. ✅ Select a course from dropdown
4. ✅ Verify students appear in "Select Students" section
5. ✅ Check console: No 403 errors
6. ✅ Open Instant Meeting Modal
7. ✅ Select a course from dropdown
8. ✅ Verify students appear under "Participants" section
9. ✅ Check console: No 403 errors

#### **Testing Notes:**
- **Test Account:** test12@test.com (Teacher role)
- **Expected Behavior:** Only courses created by test12 appear in dropdown
- **Expected Behavior:** Students enrolled in selected course appear immediately
- **Expected Behavior:** No 403 errors in console or terminal logs

---

### **ERROR-002: Meeting Submission Fails with "Students not enrolled" (500 Error)**

**Error ID:** `GOOGLE-MEET-002`  
**Severity:** 🔴 **HIGH** (Blocks meeting creation - teacher cannot schedule classes)  
**First Occurrence:** October 30, 2025  
**Last Occurrence:** October 30, 2025  
**Status:** ✅ **RESOLVED**

#### **Symptoms:**
1. Students display correctly in modal (✅ 2 enrollments retrieved)
2. Meeting submission fails with 500 error
3. Terminal logs show:
   ```
   ❌ [ClassService] Failed to schedule class {
     error: 'Students not enrolled: WIQtmqsD5kXFEeift9uIETjQO8d2_9J1ykBTcLiVFjC0tHSpy'
   }
   POST /api/classes 500 in 930ms
   ```
4. Error message contains concatenated string `userId_courseId` format

#### **Root Cause Analysis:**
**Primary Cause:** Modal mapping enrollment data incorrectly - used enrollment document ID instead of student's userId

**Technical Flow:**
1. Enrollment API returns array of `Enrollment` objects
2. Enrollment schema:
   - `id`: Document ID in format `{userId}_{courseId}` (e.g., `WIQtmqsD5kXFEeift9uIETjQO8d2_9J1ykBTcLiVFjC0tHSpy`)
   - `userId`: Actual student's Firebase UID (e.g., `WIQtmqsD5kXFEeift9uIETjQO8d2`)
   - `userName`, `userEmail`: Denormalized fields
3. Modal incorrectly mapped: `id: e.studentId || e.id` → used document ID
4. Submitted `studentIds` array contained document IDs (with courseId appended)
5. Backend `validateStudentEnrollments()` queries:
   ```typescript
   .where('studentId', 'in', studentIds)  // Looking for userId
   ```
6. Query fails because `studentIds` contains document IDs, not userIds
7. Validation throws: "Students not enrolled: {documentId}"

**Why This Happens:**
- Enrollment schema uses `userId` field, not `studentId`
- Modal assumed API would return `studentId` or used `id` as fallback
- Document ID format `{userId}_{courseId}` was passed to validation logic

#### **Solution:**
**Fix Applied:** Map enrollment data using correct field names from Enrollment schema

**Code Changes:**

**File 1:** `components/teacher/schedule-class-modal.tsx` (Line ~207)
```tsx
// BEFORE (incorrect mapping):
const students: EnrolledStudent[] = enrollmentsData.map((e: any) => ({
  id: e.studentId || e.id,  // ❌ Uses document ID
  name: e.studentName || e.userName || e.name || 'Unknown Student',
  email: e.studentEmail || e.email || '',
}));

// AFTER (correct mapping):
const students: EnrolledStudent[] = enrollmentsData.map((e: any) => ({
  id: e.userId,  // ✅ Uses actual student's Firebase UID
  name: e.userName || 'Unknown Student',
  email: e.userEmail || '',
}));
```

**File 2:** `components/teacher/instant-meeting-modal.tsx` (Line ~186)
```tsx
// Same fix applied - use e.userId instead of e.studentId || e.id
```

**Why This Works:**
1. Enrollment API returns full `Enrollment` objects with `userId` field
2. `userId` field contains the actual student's Firebase UID
3. Backend validation queries `enrollments.where('studentId', 'in', [userId1, userId2])`
4. Query now matches correctly (studentId in Firestore === userId from enrollment)
5. Validation passes, meeting creation succeeds

#### **Prevention Methods:**
1. **Schema Documentation Rule:** Always consult `lib/types/course.types.ts` before mapping API responses
2. **Type Safety:** Use TypeScript interfaces instead of `any` to catch field name mismatches at compile time
3. **Console Logging:** Log mapped data with clear labels to verify correct field extraction:
   ```typescript
   console.log('✅ [Modal] Mapped students:', { 
     rawEnrollment: enrollmentsData[0],
     mappedStudent: students[0],
     studentIdUsed: students[0].id
   });
   ```
4. **Backend Error Messages:** Include expected vs received format in validation errors:
   ```typescript
   throw new Error(`Students not enrolled. Expected userId format, received: ${notEnrolled.join(', ')}`);
   ```

#### **Files Changed:**
- ✅ `components/teacher/schedule-class-modal.tsx` (Line ~207 - fixed enrollment mapping)
- ✅ `components/teacher/instant-meeting-modal.tsx` (Line ~186 - fixed enrollment mapping)
- ✅ `docs/google-meet-calendar/google-meet-calendar.errors.md` (This file - error documentation)

#### **Verification Steps:**
1. ✅ Hard refresh browser (Cmd+Shift+R)
2. ✅ Open Schedule Class Modal or Instant Meeting Modal
3. ✅ Select a course with enrolled students
4. ✅ Verify students display (e.g., "2 enrolled students")
5. ✅ Select students and/or add external emails
6. ✅ Submit meeting/class creation
7. ✅ Check console: Should log student IDs in correct format (Firebase UID, not document ID)
8. ✅ Check terminal: Should show success (200 status), not "Students not enrolled" error
9. ✅ Verify meeting created in Firestore `classes` collection

#### **Testing Notes:**
- **Test Account:** test12@test.com (Teacher role)
- **Test Course:** Lithuanian Numbers & Counting (2 enrolled students)
- **Expected Behavior:** Meeting submission succeeds with 200 status
- **Expected Behavior:** No "Students not enrolled" errors in logs

#### **Related to ERROR-001:**
- ERROR-001 fixed students **not displaying** (403 authorization)
- ERROR-002 fixed meeting **submission failure** (500 validation)
- Both errors were in the same modals but different code paths
- Full fix requires both ERROR-001 and ERROR-002 solutions

---

### **ERROR-003: Backend Validation Uses Wrong Field Name (500 Error - CRITICAL)**

**Error ID:** `GOOGLE-MEET-003`  
**Severity:** � **CRITICAL** (Backend validation broken - all meeting submissions fail)  
**First Occurrence:** October 30, 2025  
**Last Occurrence:** October 31, 2025  
**Status:** ✅ **RESOLVED**

#### **Symptoms:**
1. ERROR-001 and ERROR-002 fixed, but meetings still fail
2. Error message shows: `Students not enrolled: T9Uy9hYru3VLBYBegiFNLwTw5UN2, JiK83SdNuiMkv4QaPfYm4FuiiXF3`
3. One of the IDs is the **teacher's ID** (JiK83SdNuiMkv4QaPfYm4FuiiXF3), not a student
4. API logs show: `✅ Course enrollments retrieved { count: 3 }`
5. But validation fails with: `Students not enrolled: <all selected student IDs>`

#### **Root Cause Analysis:**
**Primary Cause:** Backend validation querying wrong field name in Firestore

**Technical Flow:**
1. Modal correctly sends `studentIds: [userId1, userId2]` (after ERROR-002 fix)
2. `ClassService.validateStudentEnrollments()` queries:
   ```typescript
   .where('studentId', 'in', studentIds)  // ❌ WRONG FIELD
   ```
3. Enrollment schema uses `userId` field, NOT `studentId`
4. Firestore query returns 0 results (field doesn't exist)
5. Validation thinks NO students are enrolled
6. Throws error with all submitted student IDs

**Why This Wasn't Caught Earlier:**
- ERROR-002 fixed frontend mapping but backend still used wrong field
- The field name mismatch is easy to miss (`studentId` vs `userId`)
- Firestore doesn't error on non-existent fields, just returns empty results
- Original code was written assuming `studentId` field existed

#### **Solution:**
**Fix Applied:** Change Firestore query field from `studentId` to `userId` in both validation methods

**Code Changes:**

**File:** `lib/services/class.service.ts`

**Method 1:** `validateStudentEnrollments()` (Line ~631)
```typescript
// BEFORE ❌
const enrollmentsSnapshot = await db
  .collection('enrollments')
  .where('courseId', '==', courseId)
  .where('studentId', 'in', studentIds)  // Wrong field
  .where('status', '==', 'active')
  .get();

const enrolledStudentIds = enrollmentsSnapshot.docs.map(doc => doc.data().studentId);

// AFTER ✅
const enrollmentsSnapshot = await db
  .collection('enrollments')
  .where('courseId', '==', courseId)
  .where('userId', 'in', studentIds)  // Correct field from schema
  .where('status', '==', 'active')
  .get();

const enrolledStudentIds = enrollmentsSnapshot.docs.map(doc => doc.data().userId);
```

**Method 2:** `collectAttendeeEmails()` (Line ~659)
```typescript
// BEFORE ❌
const enrollmentsSnapshot = await db
  .collection('enrollments')
  .where('courseId', '==', courseId)
  .where('studentId', 'in', studentIds)  // Wrong field
  .where('status', '==', 'active')
  .get();

const userIds = enrollmentsSnapshot.docs.map(doc => doc.data().studentId);

// AFTER ✅
const enrollmentsSnapshot = await db
  .collection('enrollments')
  .where('courseId', '==', courseId)
  .where('userId', 'in', studentIds)  // Correct field from schema
  .where('status', '==', 'active')
  .get();

const userIds = enrollmentsSnapshot.docs.map(doc => doc.data().userId);
```

**Why This Works:**
1. Enrollment schema (from `lib/types/course.types.ts`):
   ```typescript
   interface Enrollment {
     id: string;              // Document ID: {userId}_{courseId}
     userId: string;          // ✅ This is the field we need
     courseId: string;
     userName: string;
     userEmail: string;
     // ... other fields
   }
   ```
2. Query now matches actual Firestore field names
3. Validation can find enrolled students
4. Email collection can fetch user emails
5. Meeting creation succeeds

#### **Prevention Methods:**
1. **Schema Adherence Rule:** Always reference TypeScript interfaces before writing Firestore queries
2. **Code Review Checklist:** Verify field names match schema exactly (case-sensitive)
3. **Testing Protocol:** Test with real Firestore data, not mocks (mocks hide field name mismatches)
4. **Naming Convention:** Consider using consistent naming (either `userId` everywhere or `studentId` everywhere, not mixed)
5. **Firestore Query Logging:** Log query results count to catch empty result sets:
   ```typescript
   console.log(`Query returned ${snapshot.docs.length} docs for field 'userId'`);
   ```

#### **Files Changed:**
- ✅ `lib/services/class.service.ts` (Line ~631 - validateStudentEnrollments)
- ✅ `lib/services/class.service.ts` (Line ~659 - collectAttendeeEmails)
- ✅ `docs/google-meet-calendar/google-meet-calendar.errors.md` (This file - error documentation)

#### **Verification Steps:**
1. ✅ Hard refresh browser (Cmd+Shift+R)
2. ✅ Open Schedule Class Modal
3. ✅ Select "Lithuanian Food Vocabulary" (3 enrolled students)
4. ✅ Select 2 students (do NOT include teacher ID)
5. ✅ Fill in required fields (date, time, duration)
6. ✅ Submit meeting creation
7. ✅ Check terminal: Should show `POST /api/classes 200 in XXXms` (NOT 500)
8. ✅ Check terminal: Should NOT see "Students not enrolled" error
9. ✅ Verify meeting created in Firestore `classes` collection
10. ✅ Verify Google Calendar event created (if OAuth connected)

#### **Testing Notes:**
- **Test Account:** test12@test.com (Teacher role)
- **Test Course:** Lithuanian Food Vocabulary (3 enrolled students)
- **Bug Discovery:** User submitted 2 valid students, validation failed for both
- **Expected Behavior:** Validation passes, meeting created successfully
- **Expected Behavior:** No student IDs in error logs

#### **Cascade of Errors:**
This was part of a 3-error cascade that had to be fixed in sequence:
1. **ERROR-001:** Frontend fetching wrong courses (fixed: teacherId filter)
2. **ERROR-002:** Frontend mapping wrong enrollment field (fixed: use userId)
3. **ERROR-003:** Backend querying wrong enrollment field (fixed: use userId in queries)

All three fixes are required for the feature to work end-to-end.

---

## �📊 Error Statistics

| Error ID | Occurrences | Status | Last Seen |
|----------|-------------|--------|-----------|
| GOOGLE-MEET-001 | 50+ (Oct 30) | ✅ RESOLVED | Oct 30, 2025, 11:45 PM |
| GOOGLE-MEET-002 | 10+ (Oct 30) | ✅ RESOLVED | Oct 30, 2025, 11:55 PM |
| GOOGLE-MEET-003 | 5+ (Oct 31) | ✅ RESOLVED | Oct 31, 2025, 12:10 AM |

---

## 🎓 Lessons Learned from This Error

### **Key Takeaway #1: Filter Early, Not Late**
**Mistake:** Fetching all data and hoping backend authorization will handle it  
**Correct Approach:** Filter data at the source (client-side query params) to prevent unauthorized requests

### **Key Takeaway #2: Logging Level Changes Are Symptomatic Fixes**
**Mistake:** Changing error logs to warnings to prevent UI crashes  
**Correct Approach:** Fix the root cause (authorization issue) instead of hiding the symptom

### **Key Takeaway #3: API Design Should Guide Client Usage**
**Mistake:** API supports filtering but client doesn't use it  
**Correct Approach:** Document required query params in API comments and enforce in components

### **Key Takeaway #4: Test with Real Data and Real Roles**
**Mistake:** Testing with mock data or admin accounts that bypass restrictions  
**Correct Approach:** Use Playwright MCP with real teacher accounts, multiple courses, and enrolled students

### **Key Takeaway #5: 403 Errors Are Authorization Failures, Not Bugs**
**Mistake:** Treating 403 as a bug to suppress  
**Correct Approach:** 403 means "you're not allowed to do this" - fix the permission model, not the error

---

## 🔗 Related Documentation

- [google-meet-calendar.current.md](./google-meet-calendar.current.md) - Implementation status
- [google-meet-calendar.scope.md](./google-meet-calendar.scope.md) - Scope boundaries
- [google-meet-calendar.prd.md](./google-meet-calendar.prd.md) - Product requirements
- [../MAIN.md](../MAIN.md) - IKB entry point

---

**Last Updated:** October 30, 2025, 11:45 PM GMT+2 by ZenType Architect (J)  
**Next Update:** When next error occurs or prevention method added
