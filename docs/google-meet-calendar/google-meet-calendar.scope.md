# Google Meet & Calendar Integration - Scope Definition

**Status:** 📋 SCOPE DEFINED - READY FOR IMPLEMENTATION  
**Version:** 1.0.0  
**Created:** October 30, 2025  
**Last Updated:** October 30, 2025  
**Feature Owner:** ZenType Architect (J)

---

## ⚠️ CRITICAL: 99% CERTAINTY RULE ENFORCEMENT

**This scope file is your PRIMARY protection against breaking existing functionality.**

Before modifying ANY file:
1. ✅ Verify it's listed in "What IS in Scope" below
2. ✅ Check "Critical Areas" for line-specific warnings
3. ✅ Review "Interconnected Features" for dependencies
4. ❌ **NEVER** touch files in "What is NOT in Scope"

**If in doubt, STOP and reread this scope file.**

---

## 🎯 Feature Overview

**Goal:** Enable teachers to schedule classes with students using Google Meet and Google Calendar, with automatic recording storage and retention management.

**Core Capabilities:**
- Schedule one-time or recurring classes
- Start instant meetings
- Auto-generate Google Meet links
- Send calendar invites to students
- Store recordings in Google Drive
- Manage recording retention (30-day auto-delete or archive)

---

## ✅ What IS in Scope

### **NEW Files to Create (Will Not Break Anything)**

#### **Phase 5.1: Google OAuth & Calendar Integration**

```
lib/services/google/
├── google-auth.service.ts          # NEW - OAuth token management
├── google-calendar.service.ts      # NEW - Calendar event CRUD
└── __tests__/
    ├── google-auth.service.test.ts # NEW - Unit tests
    └── google-calendar.service.test.ts # NEW - Unit tests

app/api/google/
└── auth/
    └── callback/
        └── route.ts                # NEW - OAuth callback handler

app/teacher/settings/
└── google/
    └── page.tsx                    # NEW - Connect Google account page

components/teacher/
├── google-connect-button.tsx      # NEW - OAuth initiation button
└── google-connection-status.tsx   # NEW - Connection status indicator
```

#### **Phase 5.2: Class Scheduling Backend**

```
lib/repositories/
└── class.repository.ts             # NEW - Firestore CRUD for classes

lib/services/
└── class.service.ts                # NEW - Orchestrates Calendar + Firestore

app/api/classes/
├── route.ts                        # NEW - POST (create), GET (list)
├── [id]/
│   └── route.ts                    # NEW - GET, PUT, DELETE
└── instant/
    └── route.ts                    # NEW - POST (instant meeting)
```

#### **Phase 5.3: UI Components**

```
components/teacher/
├── schedule-class-modal.tsx        # NEW - Schedule class form
├── instant-meeting-modal.tsx       # NEW - Quick meeting starter
├── class-card.tsx                  # NEW - Class display card
├── upcoming-classes-widget.tsx     # NEW - Dashboard widget
├── class-list.tsx                  # NEW - List of classes
└── class-calendar-view.tsx         # NEW - Calendar embed

app/teacher/classes/
└── page.tsx                        # NEW - Main classes management page
```

#### **Phase 5.4: Recording Management**

```
lib/services/google/
├── google-drive.service.ts         # NEW - Drive API operations
└── __tests__/
    └── google-drive.service.test.ts # NEW - Unit tests

functions/src/
└── recordingCleanup.ts             # NEW - Cloud Function (daily cron)

app/api/classes/[id]/recording/
├── route.ts                        # NEW - GET recording details
└── archive/
    └── route.ts                    # NEW - POST keep forever

components/teacher/
├── recording-actions.tsx           # NEW - View/Archive/Delete buttons
└── recording-status-badge.tsx      # NEW - Expiry countdown
```

---

### **EXISTING Files to Modify (With Caution)**

#### **1. Firestore Collections (ADD NEW, Don't Touch Existing)**

**File:** N/A (Firestore schema, documented here)

**New Collection to Create:**
```typescript
// Collection: classes
// SAFE TO CREATE - No impact on existing collections
{
  id: string;
  courseId: string;                   // References existing courses collection
  lessonId?: string;                  // References existing lessons subcollection
  teacherId: string;                  // References existing users collection
  // ... full schema in PRD
}
```

**⚠️ CRITICAL:** This is a **NEW** collection. Do NOT modify existing collections:
- ❌ Do NOT modify `courses` collection structure
- ❌ Do NOT modify `lessons` subcollection structure
- ❌ Do NOT modify `users` collection structure
- ✅ You MAY add optional field to `users`: `googleTokens` (backward compatible)

---

#### **2. User Collection Extension**

**File:** `lib/repositories/user.repository.ts` (if exists) OR direct Firestore update

**What to Add:**
```typescript
// ADD to User interface (backward compatible - optional field)
interface User {
  // ... existing fields ...
  googleTokens?: {                    // NEW - Optional, won't break existing users
    accessToken: string;
    refreshToken: string;
    expiresAt: Timestamp;
    scope: string;
  }
}
```

**⚠️ CRITICAL RULES:**
- ✅ Field MUST be optional (`?`)
- ✅ All existing users without this field MUST continue working
- ✅ Test login flow for users WITHOUT googleTokens
- ❌ Do NOT make this field required
- ❌ Do NOT break existing authentication flow

**Testing Checklist:**
- [ ] Existing user can login without googleTokens field
- [ ] New user registration works without googleTokens
- [ ] Teacher can connect Google account (adds googleTokens)
- [ ] Teacher without Google account can still use platform

---

#### **3. Teacher Dashboard - Add Widget**

**File:** `app/teacher/dashboard/page.tsx`

**What to Add:**
```typescript
// ADD new widget to dashboard grid (non-breaking addition)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* EXISTING WIDGETS - DO NOT MODIFY */}
  <CourseStatsCard />
  <StudentStatsCard />
  <RecentActivityCard />
  
  {/* NEW WIDGET - ADD AT END */}
  <UpcomingClassesWidget />
</div>
```

**⚠️ CRITICAL RULES:**
- ✅ Add widget at END of grid (doesn't shift existing layout)
- ✅ Use consistent styling (copy existing card classes)
- ✅ Widget should be optional (if no classes, show "Schedule your first class")
- ❌ Do NOT modify existing widget code
- ❌ Do NOT change grid layout breakpoints
- ❌ Do NOT modify existing dashboard state/hooks

**Lines to Modify:** Approximately lines 80-120 (grid section)

**Testing Checklist:**
- [ ] Existing dashboard widgets still render correctly
- [ ] New widget appears without breaking layout
- [ ] Dashboard loads without errors for teachers with 0 classes
- [ ] Dashboard responsive design intact (mobile/tablet/desktop)

---

#### **4. Course Edit Page - Add Classes Tab**

**File:** `app/teacher/course/edit/[id]/page.tsx`

**What to Add:**
```typescript
// ADD new tab to existing tab navigation
<Tabs defaultValue="general">
  <TabsList>
    {/* EXISTING TABS - DO NOT MODIFY */}
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="lessons">Lessons</TabsTrigger>
    <TabsTrigger value="students">Students</TabsTrigger>
    
    {/* NEW TAB - ADD AT END */}
    <TabsTrigger value="classes">Classes</TabsTrigger>
  </TabsList>
  
  {/* EXISTING TAB CONTENT - DO NOT MODIFY */}
  <TabsContent value="general">...</TabsContent>
  <TabsContent value="lessons">...</TabsContent>
  <TabsContent value="students">...</TabsContent>
  
  {/* NEW TAB CONTENT - ADD AT END */}
  <TabsContent value="classes">
    <ClassesForCourseSection courseId={courseId} />
  </TabsContent>
</Tabs>
```

**⚠️ CRITICAL RULES:**
- ✅ Add tab at END (doesn't break existing tab order)
- ✅ Use existing Tabs component from shadcn/ui
- ✅ Component should handle "no classes" state gracefully
- ❌ Do NOT modify existing tab content
- ❌ Do NOT change tab styling or behavior
- ❌ Do NOT modify course edit logic in other tabs

**Lines to Modify:** Approximately lines 150-200 (tabs section)

**Testing Checklist:**
- [ ] All existing tabs still work (General, Lessons, Students)
- [ ] New Classes tab appears and is clickable
- [ ] Switching between tabs doesn't break state
- [ ] Course edit page loads correctly for courses with/without classes

---

#### **5. Navigation Bar - Add Classes Link**

**File:** `components/navigation/navbar.tsx`

**What to Add:**
```typescript
// ADD link to teacher navigation section
{user?.role === 'teacher' && (
  <>
    {/* EXISTING LINKS - DO NOT MODIFY */}
    <Link href="/teacher/dashboard">Dashboard</Link>
    <Link href="/teacher/courses">Courses</Link>
    <Link href="/teacher/students">Students</Link>
    
    {/* NEW LINK - ADD AT END */}
    <Link href="/teacher/classes">Classes</Link>
  </>
)}
```

**⚠️ CRITICAL RULES:**
- ✅ Add link only for teachers (`role === 'teacher'`)
- ✅ Use existing Link component styling
- ✅ Place at end of teacher nav section
- ❌ Do NOT modify existing navigation links
- ❌ Do NOT change navbar layout or mobile menu
- ❌ Do NOT affect student/admin navigation

**Lines to Modify:** Approximately lines 50-70 (teacher nav section)

**Testing Checklist:**
- [ ] Classes link appears for teachers only
- [ ] Link navigates to /teacher/classes correctly
- [ ] Existing navigation links still work
- [ ] Mobile menu still functional
- [ ] Active link highlighting works

---

#### **6. Environment Variables (ADD ONLY)**

**File:** `.env.local` (local development)

**What to Add:**
```bash
# EXISTING VARIABLES - DO NOT MODIFY OR REMOVE
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... other existing vars ...

# NEW VARIABLES - ADD AT END
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/auth/callback
```

**File:** Firebase App Hosting environment variables (production)

**What to Add via Firebase Console:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

**⚠️ CRITICAL RULES:**
- ✅ Add variables without removing existing ones
- ✅ Never commit `.env.local` to git (already in .gitignore)
- ✅ Document all new variables in README
- ❌ Do NOT modify existing Firebase variables
- ❌ Do NOT change variable names (breaks existing code)

**Testing Checklist:**
- [ ] Existing features work with new variables added
- [ ] OAuth flow reads variables correctly
- [ ] Production deployment succeeds with new env vars

---

#### **7. Firestore Security Rules (ADD NEW RULES)**

**File:** `firestore.rules`

**What to Add:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // EXISTING RULES - DO NOT MODIFY
    match /users/{userId} { ... }
    match /courses/{courseId} { ... }
    match /enrollments/{enrollmentId} { ... }
    
    // NEW RULES - ADD AT END
    match /classes/{classId} {
      // Teachers can read their own classes
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.teacherId;
      
      // Teachers can create classes
      allow create: if request.auth != null && 
        request.auth.token.role == 'teacher' &&
        request.auth.uid == request.resource.data.teacherId;
      
      // Teachers can update/delete their own classes
      allow update, delete: if request.auth != null && 
        request.auth.uid == resource.data.teacherId;
      
      // Students can read classes they're enrolled in
      allow read: if request.auth != null &&
        request.auth.uid in resource.data.participants.studentIds;
    }
  }
}
```

**⚠️ CRITICAL RULES:**
- ✅ Add rules at END of file
- ✅ Test rules with Firebase Emulator before deploying
- ✅ Ensure rules don't conflict with existing patterns
- ❌ Do NOT modify existing collection rules
- ❌ Do NOT change rule structure for users/courses/enrollments

**Testing Checklist:**
- [ ] Existing rules still work (test user login, course access)
- [ ] New rules allow teacher CRUD operations
- [ ] New rules prevent unauthorized access
- [ ] Rules tested with Firebase Emulator

---

## ❌ What is NOT in Scope

### **PROTECTED FILES - DO NOT TOUCH**

#### **Authentication System**
```
❌ lib/services/auth/auth.service.ts
❌ lib/services/auth/user.repository.ts
❌ lib/firebase/admin.ts
❌ app/api/auth/login/route.ts
❌ app/api/auth/register/route.ts
❌ hooks/use-auth.tsx
❌ components/auth/protected-route.tsx
❌ middleware.ts (except adding trace context if needed)
```

**Why Protected:** Core authentication flow. Breaking this locks ALL users out.

---

#### **Course Management System**
```
❌ lib/repositories/course.repository.ts
❌ lib/services/course.service.ts
❌ app/api/courses/route.ts
❌ app/api/courses/[id]/route.ts
❌ app/teacher/courses/page.tsx
```

**Why Protected:** Course CRUD operations. Breaking this prevents course creation/editing.

**Exception:** You MAY reference `CourseRepository.getById()` to fetch course data for class scheduling.

---

#### **Enrollment System**
```
❌ lib/repositories/enrollment.repository.ts
❌ lib/services/enrollment.service.ts
❌ app/api/courses/[id]/enroll/route.ts
❌ app/api/enrollments/route.ts
```

**Why Protected:** Student enrollment flow. Breaking this prevents students from joining courses.

**Exception:** You MAY call `EnrollmentRepository.getEnrolledStudents(courseId)` to fetch student lists.

---

#### **Lesson System**
```
❌ lib/repositories/lesson.repository.ts
❌ lib/services/lesson.service.ts
❌ app/api/courses/[id]/lessons/route.ts
❌ app/course/[id]/lesson/[lessonId]/page.tsx
```

**Why Protected:** Lesson delivery system. Breaking this prevents students from learning.

**Exception:** You MAY reference `LessonRepository.getById()` to link classes to lessons.

---

#### **Progress Tracking System**
```
❌ lib/repositories/progress.repository.ts
❌ lib/services/progress.service.ts
❌ app/api/progress/video/update/route.ts
❌ app/api/progress/reading/update/route.ts
```

**Why Protected:** Student progress tracking. Breaking this loses learning data.

---

#### **AI Chatbot System**
```
❌ app/api/ai/teacher-bot/route.ts
❌ app/teacher/ai-assistant/page.tsx
❌ lib/services/ai/gemini.service.ts
```

**Why Protected:** AI course generation. Breaking this disables AI features.

---

#### **Debug & Logging System**
```
❌ lib/utils/debug-logger.ts
❌ lib/tracing/trace-logger.ts
❌ lib/tracing/trace-storage.ts
❌ components/debug/debug-panel.tsx
```

**Why Protected:** Production debugging. Breaking this blinds us to errors.

**Exception:** You SHOULD use these utilities in your new code:
```typescript
import { traceLogger } from '@/lib/tracing/trace-logger';
const spanId = traceLogger.startSpan('GoogleCalendar', 'createEvent');
```

---

#### **PDF Upload System**
```
❌ components/teacher/resource-upload.tsx
❌ components/lessons/resource-list.tsx
❌ app/api/courses/[id]/lessons/[lessonId]/resources/route.ts
```

**Why Protected:** Just deployed and verified. Don't risk breaking it.

---

#### **Student Dashboard**
```
❌ app/dashboard/page.tsx
❌ components/dashboard/student-stats.tsx
❌ components/dashboard/enrolled-courses.tsx
```

**Why Protected:** Student experience. Breaking this affects all students.

---

#### **Configuration Files**
```
❌ next.config.js (unless adding env var reference)
❌ tailwind.config.js
❌ tsconfig.json
❌ package.json (unless adding Google API packages)
❌ firebase.json
❌ .firebaserc
```

**Why Protected:** Build configuration. Breaking this prevents deployment.

**Exception:** You MAY add new dependencies to `package.json`:
- `googleapis` (Google APIs client)
- `@google-cloud/functions-framework` (Cloud Functions)

---

## 🔗 Interconnected Features

### **Feature: Course Management**
**Connection:** Classes reference courses via `courseId`

**What This Feature Expects:**
- `CourseRepository.getById(courseId)` returns course with `teacherId`
- Teacher ownership validation: `course.teacherId === user.uid`

**What You Must NOT Break:**
- ❌ Do NOT modify Course schema
- ❌ Do NOT change CourseRepository methods
- ✅ You MAY call existing read methods

**Testing:**
- [ ] Verify course ownership check works
- [ ] Test with courses owned by different teachers
- [ ] Ensure scheduling fails for courses teacher doesn't own

---

### **Feature: Enrollment System**
**Connection:** Classes fetch enrolled students via `courseId`

**What This Feature Expects:**
- `EnrollmentRepository.getEnrolledStudents(courseId)` returns array of student UIDs + emails
- Enrollments collection has `userId`, `courseId`, `status: 'active'`

**What You Must NOT Break:**
- ❌ Do NOT modify Enrollment schema
- ❌ Do NOT change EnrollmentRepository methods
- ✅ You MAY call existing read methods

**Testing:**
- [ ] Verify student list fetch works
- [ ] Test with courses with 0 students (edge case)
- [ ] Ensure external participants don't conflict with enrolled students

---

### **Feature: Lesson System**
**Connection:** Classes can be linked to specific lessons

**What This Feature Expects:**
- `LessonRepository.getById(courseId, lessonId)` returns lesson with `title`
- Lessons are stored as subcollection: `courses/{courseId}/lessons/{lessonId}`

**What You Must NOT Break:**
- ❌ Do NOT modify Lesson schema
- ❌ Do NOT change LessonRepository methods
- ✅ You MAY call existing read methods

**Testing:**
- [ ] Verify lesson linking works
- [ ] Test class without lesson (lessonId optional)
- [ ] Ensure class title auto-fills from lesson

---

### **Feature: Authentication System**
**Connection:** All API endpoints require Firebase token verification

**What This Feature Expects:**
- All API routes verify token: `await getAdminAuth().verifyIdToken(token)`
- Token includes custom claims: `decodedToken.role === 'teacher'`
- `teacherId` from token matches class owner

**What You Must NOT Break:**
- ❌ Do NOT modify token verification logic
- ❌ Do NOT change role-based access patterns
- ✅ You MUST follow existing auth patterns in new API routes

**Testing:**
- [ ] All new API endpoints require authentication
- [ ] Teacher role verification works
- [ ] Non-teachers cannot access class endpoints

---

## ⚠️ Critical Areas to Pay Attention To

### **CRITICAL AREA #1: Google OAuth Token Storage**

**File:** `lib/services/google/google-auth.service.ts` (NEW)

**Risk Level:** 🔴 HIGH RISK

**Why Critical:** OAuth tokens grant access to teacher's Google account. Security breach risk.

**Requirements:**
1. **NEVER log full tokens** (only first 10 chars for debugging)
2. **Store tokens encrypted** (Firebase does this automatically in Firestore)
3. **Refresh tokens before expiry** (Google tokens expire after 1 hour)
4. **Handle token revocation** (teacher disconnects Google account)
5. **Scope limitation** (only request minimal permissions needed)

**Code Pattern - Token Logging:**
```typescript
// ❌ NEVER DO THIS
console.log('Access token:', accessToken);

// ✅ ALWAYS DO THIS
traceLogger.log('info', 'GoogleAuth', 'Token refreshed', {
  tokenPreview: accessToken.substring(0, 10) + '...',
  expiresIn: 3600
});
```

**Code Pattern - Token Refresh:**
```typescript
// ✅ Auto-refresh before API calls
async function ensureValidToken(userId: string) {
  const user = await UserRepository.getById(userId);
  if (!user.googleTokens) throw new Error('Not connected');
  
  const now = Date.now();
  const expiresAt = user.googleTokens.expiresAt.toMillis();
  
  // Refresh if expires in <5 minutes
  if (expiresAt - now < 5 * 60 * 1000) {
    await refreshAccessToken(userId);
  }
  
  return user.googleTokens.accessToken;
}
```

**Testing Checklist:**
- [ ] Tokens never logged in full
- [ ] Token refresh works automatically
- [ ] Expired tokens don't crash API calls
- [ ] Teacher can disconnect Google account
- [ ] Disconnecting revokes tokens in Google

---

### **CRITICAL AREA #2: Calendar Event Creation**

**File:** `lib/services/google/google-calendar.service.ts` (NEW)

**Risk Level:** 🟡 MEDIUM RISK

**Why Critical:** Incorrect event creation can spam students or create wrong meeting times.

**Requirements:**
1. **Validate timezone** (default to teacher's timezone, but verify)
2. **Validate attendee emails** (must be valid email format)
3. **Prevent duplicate events** (check if event already exists)
4. **Handle API rate limits** (Google Calendar API: 1 request/second per user)
5. **Store calendarEventId** (needed for updates/deletions)

**Code Pattern - Timezone Validation:**
```typescript
// ✅ Validate timezone
const validTimezones = Intl.supportedValuesOf('timeZone');
if (!validTimezones.includes(timezone)) {
  throw new Error(`Invalid timezone: ${timezone}`);
}
```

**Code Pattern - Email Validation:**
```typescript
// ✅ Validate all attendee emails
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
for (const email of attendeeEmails) {
  if (!emailRegex.test(email)) {
    throw new Error(`Invalid email: ${email}`);
  }
}
```

**Code Pattern - Rate Limiting:**
```typescript
// ✅ Handle rate limits gracefully
try {
  const event = await calendar.events.insert({ ... });
} catch (error) {
  if (error.code === 429) {
    // Rate limit exceeded, retry after delay
    await delay(1000);
    return createEvent(data); // Retry
  }
  throw error;
}
```

**Testing Checklist:**
- [ ] Events created with correct timezone
- [ ] Invalid emails rejected before API call
- [ ] Duplicate events prevented
- [ ] Rate limiting handled gracefully
- [ ] calendarEventId stored in Firestore

---

### **CRITICAL AREA #3: Student Email Privacy**

**File:** API routes creating classes (NEW)

**Risk Level:** 🔴 HIGH RISK

**Why Critical:** Student emails are PII. Must comply with GDPR.

**Requirements:**
1. **Only enrolled students** (verify enrollment before adding to class)
2. **External participant consent** (show warning: "External user will receive invite")
3. **Validate course ownership** (teacher must own course to schedule class)
4. **Log email domains only** (not full emails in logs)
5. **Respect opt-out** (if student opts out of emails in future)

**Code Pattern - Enrollment Verification:**
```typescript
// ✅ Verify all studentIds are enrolled
const enrollments = await EnrollmentRepository.getEnrolledStudents(courseId);
const enrolledIds = enrollments.map(e => e.userId);

for (const studentId of requestedStudentIds) {
  if (!enrolledIds.includes(studentId)) {
    throw new Error(`Student ${studentId} not enrolled in course`);
  }
}
```

**Code Pattern - Logging Privacy:**
```typescript
// ❌ NEVER LOG FULL EMAILS
console.log('Sending invites to:', studentEmails);

// ✅ LOG DOMAINS ONLY
const domains = studentEmails.map(e => e.split('@')[1]);
traceLogger.log('info', 'ClassScheduling', 'Invites sent', {
  studentCount: studentEmails.length,
  domains: [...new Set(domains)] // Unique domains
});
```

**Code Pattern - External Participant Warning:**
```typescript
// ✅ Frontend warning for external emails
{externalEmails.length > 0 && (
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>External Participants</AlertTitle>
    <AlertDescription>
      You are adding {externalEmails.length} external participant(s) 
      who are not enrolled in this course. They will receive calendar 
      invites with the meeting link.
    </AlertDescription>
  </Alert>
)}
```

**Testing Checklist:**
- [ ] Only enrolled students can be added
- [ ] Non-enrolled students rejected with clear error
- [ ] External emails show warning before adding
- [ ] No full emails in logs (only domains)
- [ ] Course ownership validated

---

### **CRITICAL AREA #4: Recording Auto-Deletion**

**File:** `functions/src/recordingCleanup.ts` (NEW Cloud Function)

**Risk Level:** 🔴 HIGH RISK

**Why Critical:** Deleting wrong files or failing to delete loses teacher data.

**Requirements:**
1. **Verify expiry date** (only delete if expiresAt < now AND archived === false)
2. **Double-check Drive file ID** (ensure it matches class recording)
3. **Update Firestore atomically** (delete file THEN update Firestore, not reverse)
4. **Handle Google Drive errors** (file already deleted, permission denied)
5. **Log all deletions** (audit trail for compliance)

**Code Pattern - Safe Deletion:**
```typescript
// ✅ Safe deletion with verification
export const recordingCleanup = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = getFirestore();
    const now = Timestamp.now();
    
    const expiredClasses = await db.collection('classes')
      .where('recordingRetention.expiresAt', '<', now)
      .where('recordingRetention.archived', '==', false)
      .where('recordingDriveId', '!=', null) // Must have recording
      .get();
    
    for (const doc of expiredClasses.docs) {
      const classData = doc.data();
      const { recordingDriveId, title, teacherId } = classData;
      
      // Verify expiry again (race condition protection)
      if (classData.recordingRetention.expiresAt.toMillis() >= now.toMillis()) {
        console.log(`Skipping ${doc.id}: Not yet expired`);
        continue;
      }
      
      // Verify not archived (double check)
      if (classData.recordingRetention.archived) {
        console.log(`Skipping ${doc.id}: Already archived`);
        continue;
      }
      
      try {
        // Step 1: Delete from Google Drive
        await drive.files.delete({ fileId: recordingDriveId });
        
        // Step 2: Update Firestore (atomic)
        await doc.ref.update({
          recordingUrl: null,
          recordingDriveId: null,
          'recordingRetention.deleted': true,
          'recordingRetention.deletedAt': now
        });
        
        // Step 3: Log success
        console.log(`Deleted recording: ${doc.id} (${title})`);
        
      } catch (error) {
        // Log error but continue with other deletions
        console.error(`Failed to delete ${doc.id}:`, error.message);
      }
    }
  });
```

**Testing Checklist:**
- [ ] Only expired AND non-archived recordings deleted
- [ ] Drive file deletion succeeds
- [ ] Firestore update succeeds
- [ ] Errors don't stop entire batch
- [ ] All deletions logged with audit trail
- [ ] Manual test: Set retention to 1 minute, verify deletion

---

### **CRITICAL AREA #5: Recurring Class Patterns**

**File:** `lib/services/google/google-calendar.service.ts` (NEW)

**Risk Level:** 🟡 MEDIUM RISK

**Why Critical:** Wrong recurrence pattern creates wrong schedule.

**Requirements:**
1. **Validate RRULE syntax** (must follow RFC 5545)
2. **Test weekly patterns** (most common use case)
3. **Handle end dates** (UNTIL or COUNT, not both)
4. **Verify timezone in RRULE** (ensure UTC conversion)
5. **Test edge cases** (Feb 29, daylight saving time)

**Code Pattern - Weekly Pattern:**
```typescript
// ✅ Correct weekly pattern
function buildWeeklyRecurrence(daysOfWeek: number[], endDate?: Date): string {
  // daysOfWeek: [0-6] where 0 = Sunday, 6 = Saturday
  const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const byDay = daysOfWeek.map(d => dayNames[d]).join(',');
  
  let rrule = `RRULE:FREQ=WEEKLY;BYDAY=${byDay}`;
  
  if (endDate) {
    const until = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    rrule += `;UNTIL=${until}`;
  }
  
  return rrule;
}

// Example: Every Tuesday and Thursday until Dec 31, 2025
const rrule = buildWeeklyRecurrence([2, 4], new Date('2025-12-31T23:59:59Z'));
// Result: "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20251231T235959Z"
```

**Code Pattern - Validation:**
```typescript
// ✅ Validate recurrence pattern
if (recurrence) {
  if (!recurrence.pattern || !['daily', 'weekly', 'biweekly', 'monthly'].includes(recurrence.pattern)) {
    throw new Error('Invalid recurrence pattern');
  }
  
  if (recurrence.pattern === 'weekly' && (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0)) {
    throw new Error('Weekly recurrence requires daysOfWeek');
  }
  
  if (recurrence.endDate && recurrence.endDate <= new Date()) {
    throw new Error('End date must be in the future');
  }
}
```

**Testing Checklist:**
- [ ] Weekly pattern (Tue, Thu) creates correct RRULE
- [ ] Daily pattern works
- [ ] End date converts to UTC correctly
- [ ] "Never" end date (no UNTIL) works
- [ ] Edge case: Class on Feb 29 in non-leap year

---

## 📂 Files to Reference (Read-Only)

These files provide useful context but should NOT be modified:

### **Authentication Patterns**
```
✅ READ: lib/services/auth/auth.service.ts
   Why: Copy JWT verification pattern for new API routes
   
✅ READ: app/api/auth/login/route.ts
   Why: Copy Zod validation and error handling patterns
```

### **Repository Patterns**
```
✅ READ: lib/repositories/course.repository.ts
   Why: Copy Firestore CRUD patterns for ClassRepository
   
✅ READ: lib/repositories/enrollment.repository.ts
   Why: Copy query patterns for student list fetching
```

### **Service Layer Patterns**
```
✅ READ: lib/services/course.service.ts
   Why: Copy service orchestration patterns for ClassService
   
✅ READ: lib/services/enrollment.service.ts
   Why: Copy transaction patterns for class scheduling
```

### **UI Component Patterns**
```
✅ READ: components/teacher/resource-upload.tsx
   Why: Copy modal structure and form validation
   
✅ READ: app/teacher/courses/page.tsx
   Why: Copy page layout and data fetching patterns
```

### **Trace Logging Patterns**
```
✅ READ: lib/tracing/trace-logger.ts
   Why: Use traceLogger for all new code
   
✅ READ: lib/services/auth/auth.service.ts
   Why: See how to use startSpan/endSpan correctly
```

---

## 🧪 Testing Requirements

### **Before ANY Commit**

1. **Unit Tests** (if modifying backend logic)
   - [ ] All new service methods have unit tests
   - [ ] Mock Google APIs (don't make real API calls in tests)
   - [ ] Test error cases (API failures, invalid input)

2. **Integration Tests** (Playwright MCP)
   - [ ] Schedule one-time class → verify created
   - [ ] Start instant meeting → verify Meet link
   - [ ] Archive recording → verify moved
   - [ ] Test as teacher role (use test13 account)

3. **Manual Testing** (localhost:3000)
   - [ ] All new UI components render correctly
   - [ ] Forms validate input properly
   - [ ] Error messages display clearly
   - [ ] Loading states shown during API calls

4. **Regression Testing**
   - [ ] Login still works
   - [ ] Course creation still works
   - [ ] Lesson viewing still works
   - [ ] Teacher dashboard loads without errors
   - [ ] Student dashboard unaffected

5. **Security Testing**
   - [ ] Non-teachers cannot access class endpoints
   - [ ] Teachers cannot modify other teachers' classes
   - [ ] Invalid tokens rejected
   - [ ] Firestore rules enforced

---

## 🔐 Security Checklist

Before deploying to production:

### **OAuth Security**
- [ ] OAuth consent screen configured correctly
- [ ] Scopes limited to minimum required
- [ ] Redirect URI whitelisted in Google Cloud Console
- [ ] Client secret stored in environment variables (never in code)

### **API Security**
- [ ] All endpoints require Firebase authentication
- [ ] Teacher role verified on all teacher endpoints
- [ ] Course ownership validated before scheduling
- [ ] Input validation with Zod schemas
- [ ] Rate limiting considered (if needed)

### **Data Privacy**
- [ ] No full emails logged (only domains)
- [ ] No OAuth tokens logged (only previews)
- [ ] Student emails only visible to course owner
- [ ] Recording URLs only accessible to class owner
- [ ] GDPR compliance: 30-day retention, manual delete

### **Firestore Security**
- [ ] Security rules deployed and tested
- [ ] Rules prevent unauthorized reads
- [ ] Rules prevent unauthorized writes
- [ ] Rules tested with Firebase Emulator

---

## 🚀 Deployment Checklist

### **Before Deploying**

1. **Build Check**
   ```bash
   pnpm build
   ```
   - [ ] No TypeScript errors
   - [ ] No ESLint errors
   - [ ] Build completes successfully

2. **Environment Variables**
   - [ ] Local: `.env.local` has all Google variables
   - [ ] Production: Firebase App Hosting env vars configured

3. **Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```
   - [ ] Rules deployed successfully
   - [ ] Tested with Firebase Emulator first

4. **Cloud Functions** (Phase 5.4)
   ```bash
   firebase deploy --only functions
   ```
   - [ ] recordingCleanup function deployed
   - [ ] Scheduled trigger configured (daily 2AM UTC)

5. **Full Deployment**
   ```bash
   firebase deploy --only apphosting
   ```
   - [ ] Wait for "Deploy complete!" (don't interrupt)
   - [ ] Verify production URL loads

6. **Post-Deployment Verification**
   - [ ] Test OAuth flow in production
   - [ ] Schedule test class in production
   - [ ] Verify calendar invite received
   - [ ] Check Cloud Logging for errors

---

## 📚 Documentation Requirements

After feature completion:

1. **Update MAIN.md**
   - [ ] Add feature to Recent Changes Log
   - [ ] Update Table of Contents
   - [ ] Update timestamp

2. **Create google-meet-calendar.current.md**
   - [ ] Document implementation status
   - [ ] Note any known issues
   - [ ] Add lessons learned

3. **Create google-meet-calendar.errors.md** (if bugs found)
   - [ ] Document error with unique ID
   - [ ] Root cause analysis
   - [ ] Solution applied

4. **Update API_ENDPOINTS.md**
   - [ ] Document all new endpoints
   - [ ] Request/response schemas
   - [ ] Authentication requirements

5. **Create User Guide** (optional)
   - [ ] How to connect Google account
   - [ ] How to schedule classes
   - [ ] How to manage recordings

---

## 🎯 Definition of Done

**This feature is COMPLETE when:**

- [x] Scope file created and reviewed
- [ ] All "NEW Files to Create" exist and work
- [ ] All "EXISTING Files to Modify" updated correctly
- [ ] All "Critical Areas" tested thoroughly
- [ ] All "Testing Requirements" passed
- [ ] All "Security Checklist" items verified
- [ ] All "Deployment Checklist" items completed
- [ ] All "Documentation Requirements" fulfilled
- [ ] Playwright MCP verification successful
- [ ] Feature live-tested on localhost:3000
- [ ] Single verified commit pushed to master
- [ ] Production deployment successful
- [ ] No regressions in existing features

---

## 🔗 Related Documents

- [GOOGLE_MEET_CALENDAR_INTEGRATION_PRD.md](./google-meet-calendar.prd.md) - Full product requirements
- [GOOGLE_MEET_INTEGRATION_IMPLEMENTATION_SUMMARY.md](../GOOGLE_MEET_INTEGRATION_IMPLEMENTATION_SUMMARY.md) - Quick reference
- [MAIN.md](../MAIN.md) - IKB entry point
- [FIREBASE_AUTH_SYSTEM.md](../FIREBASE_AUTH_SYSTEM.md) - Authentication patterns to follow

---

**Last Updated:** October 30, 2025  
**Next Review:** After Phase 5.1 completion  
**Status:** ✅ READY FOR IMPLEMENTATION
