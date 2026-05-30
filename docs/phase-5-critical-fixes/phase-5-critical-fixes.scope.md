# Phase 5: Critical Bug Fixes - Scope Document

**Version:** 1.0  
**Created:** November 19, 2025  
**Status:** 🔴 **ACTIVE** - Scope Defined  
**Enforces:** 99% Certainty Rule  

---

## ✅ **What IS in Scope**

### **Issue 1: Instant Meeting Enrollment & Visibility**
- Enrollment validation logic in `class.service.ts`
- Firestore enrollment query in `class.repository.ts`
- Frontend enrollment fetch in `instant-meeting-modal.tsx`
- Time filter logic in `class.repository.findUpcoming()`
- Classes list display in `app/teacher/classes/page.tsx`
- Enrollment status field verification in Firestore
- Error messages for enrollment validation failures

### **Issue 2: Teacher Recent Activity**
- Frontend API call in `app/teacher/dashboard/page.tsx`
- Recent activity API endpoint `/api/teacher/recent-activity/route.ts`
- Enrollment repository method `getTeacherRecentActivity()`
- Dashboard state management (useState for recentActivity)
- Error handling for failed API calls
- Console logging for debugging

### **Issue 3: Lesson Count Discrepancy**
- Lesson query logic in `lesson.repository.ts` method `getByCourse()`
- `publishedOnly` parameter usage across dashboard, course view, course edit
- Firestore subcollection queries for lessons
- Frontend lesson fetch in all 3 pages (dashboard, course view, course edit)
- Lesson document structure (especially `isPublished` field)
- Console logging for query results

### **Documentation**
- Update `phase-5-critical-fixes.current.md` after each fix
- Update `MAIN.md` with Phase 5 status
- Update `PENDING_TASKS.md` to mark resolved issues
- Create `phase-5-critical-fixes.errors.md` if errors occur

---

## ❌ **What is NOT in Scope**

### **Out of Scope Features**
- **Scheduled class booking** (separate from instant meetings)
- **Recurring class logic** (already fixed in previous phase)
- **Payment or subscription features**
- **Student dashboard improvements**
- **Course enrollment workflow** (for students)
- **Quiz or lesson content editing**
- **Google Calendar OAuth setup** (already complete)
- **Security audit remediation** (deferred to future phase)

### **Out of Scope Pages/Components**
- Student-facing course pages
- Lesson player/viewer
- Quiz submission interface
- Profile editing pages
- Settings pages
- Admin panel

### **Out of Scope Database Changes**
- Schema migrations (enrollment structure is correct)
- Adding new collections or subcollections
- Changing authentication logic
- Modifying Firestore security rules (unless absolutely necessary)

### **Out of Scope Third-Party Integrations**
- Google Meet API changes (we only fix visibility, not creation)
- Calendar API modifications
- Email notification system
- Payment gateway integration

---

## 🚨 **Critical Areas (99% Certainty Required)**

### **HIGH RISK: Enrollment Validation**
**File:** `lib/services/class.service.ts`  
**Method:** `validateStudentEnrollments(courseId, studentIds)`  
**Why Critical:** Changes could break all instant meeting creation  
**Risk:** False negatives (valid students rejected) or false positives (invalid students accepted)

**Before Changing:**
1. ✅ Verify enrollment document structure in Firestore console
2. ✅ Test with known working enrollments (2 students that work)
3. ✅ Add logging before modifying query logic
4. ✅ Test with edge cases (0 students, external emails only, mixed)

**Safe Changes:**
- ✅ Adding console.log statements
- ✅ Adding defensive null checks
- ✅ Improving error messages

**Unsafe Changes:**
- ❌ Removing `status == 'active'` filter without understanding impact
- ❌ Changing query structure (collection path, where clauses)
- ❌ Modifying studentIds array before validation

---

### **HIGH RISK: Time Filter Logic**
**File:** `lib/repositories/class.repository.ts`  
**Method:** `findUpcoming(teacherId, days)`  
**Why Critical:** Used by all teacher class pages; affects scheduled + instant meetings  
**Risk:** Breaking scheduled class display, showing too many/too few classes

**Before Changing:**
1. ✅ Understand current query: `startTime >= now AND startTime <= now + X days`
2. ✅ Test with both instant and scheduled classes
3. ✅ Consider impact of changing lookback window (don't show old classes)
4. ✅ Verify Firestore index exists for new query pattern

**Safe Changes:**
- ✅ Adjusting lookback time from 0 to 10 minutes (small window)
- ✅ Adding separate query for in-progress classes
- ✅ Combining results with deduplication

**Unsafe Changes:**
- ❌ Removing time filter entirely (would show all historical classes)
- ❌ Changing `orderBy` without verifying index exists
- ❌ Modifying `teacherId` filter (would show other teachers' classes)

---

### **MEDIUM RISK: Frontend API Calls**
**Files:**
- `app/teacher/dashboard/page.tsx` (recent activity)
- `components/teacher/instant-meeting-modal.tsx` (enrollment fetch)
- `app/course/[id]/page.tsx` (lesson fetch)
- `app/teacher/course/edit/[id]/page.tsx` (lesson fetch)

**Why Critical:** Changes could break data loading, cause infinite loops, or expose errors to users  
**Risk:** Blank dashboards, missing data, poor UX

**Before Changing:**
1. ✅ Add console logging to track execution
2. ✅ Verify API endpoint exists and returns expected format
3. ✅ Test with browser DevTools Network tab open
4. ✅ Handle loading and error states properly

**Safe Changes:**
- ✅ Adding console.log statements
- ✅ Adding try-catch blocks
- ✅ Improving error messages

**Unsafe Changes:**
- ❌ Removing existing error handling
- ❌ Changing API endpoint URLs without verifying backend
- ❌ Removing auth token from requests
- ❌ Changing state update logic without testing

---

### **LOW RISK: Logging & Debugging**
**All Files:** Any file getting console.log, log.info, log.error  
**Why Low Risk:** Logging doesn't affect functionality, only observability  
**Risk:** Minimal - worst case is verbose logs

**Always Safe:**
- ✅ Adding console.log for debugging
- ✅ Adding log.info for successful operations
- ✅ Adding log.error for failures
- ✅ Including relevant context (IDs, counts, timestamps)

**Best Practices:**
- Prefix logs with feature name: `[InstantMeetingModal]`, `[LessonRepository]`
- Include operation status: 🔄 (loading), ✅ (success), ❌ (error)
- Log key data: IDs (first 8 chars), counts, timestamps
- Don't log sensitive data: full emails, tokens, passwords

---

## 🔗 **Interconnected Features & Dependencies**

### **Enrollment System**
**Depends On:**
- Firebase Authentication (user roles, tokens)
- Firestore enrollments collection
- Course ownership validation

**Affects:**
- Instant meeting creation
- Class scheduling
- Student management pages
- Teacher analytics

**Safe to Touch:**
- Enrollment status field updates (active, pending, suspended)
- Query filters (by courseId, userId, status)
- Error messages and logging

**Don't Touch:**
- Enrollment creation logic (separate feature)
- Payment/subscription logic (if exists)
- Enrollment deletion (separate safety checks needed)

---

### **Class System**
**Depends On:**
- Google Calendar API (Meet link generation)
- Enrollment system (student validation)
- Firebase Authentication (teacher identification)

**Affects:**
- Teacher classes page (list of all classes)
- Instant meeting workflow
- Scheduled class workflow
- Google Calendar sync

**Safe to Touch:**
- Time filter for displaying classes
- Status-based queries (in-progress, scheduled, completed)
- Frontend display logic

**Don't Touch:**
- Google Calendar event creation (working correctly)
- Recurrence rule logic (already fixed)
- Class deletion logic (separate safety checks)

---

### **Lesson System**
**Depends On:**
- Course ownership (only course owner can see unpublished)
- Firestore subcollections (courses/{id}/lessons)
- Order field for sorting

**Affects:**
- Dashboard course cards (lesson count)
- Course view page (lesson list)
- Course edit page (lesson management)
- Lesson creation workflow

**Safe to Touch:**
- Query filters (publishedOnly parameter)
- Frontend display logic
- Logging for debugging

**Don't Touch:**
- Lesson creation logic (separate feature)
- Lesson deletion logic (needs safety checks)
- Lesson content structure (type-specific fields)

---

## 📋 **Files You Will Modify**

### **Must Modify (Core Fixes)**
1. ✅ `lib/repositories/class.repository.ts`
   - Method: `findUpcoming()`
   - Change: Adjust time filter for instant meetings
   - Risk: MEDIUM

2. ✅ `app/teacher/dashboard/page.tsx`
   - Function: `fetchTeacherData()`
   - Change: Add recent activity API call
   - Risk: LOW

3. ✅ `lib/repositories/lesson.repository.ts`
   - Method: `getByCourse()`
   - Change: Add detailed logging
   - Risk: LOW (logging only)

### **May Modify (Conditional)**
4. ⚠️ `lib/services/class.service.ts`
   - Method: `validateStudentEnrollments()`
   - Change: Only if enrollment status is confirmed wrong
   - Risk: HIGH (only modify if absolutely necessary)

5. ⚠️ `components/teacher/instant-meeting-modal.tsx`
   - Change: Add status logging/display
   - Risk: LOW

6. ⚠️ `app/course/[id]/page.tsx`
   - Change: Remove publishedOnly filter (if that's the issue)
   - Risk: LOW

### **Must NOT Modify**
- ❌ `lib/services/google/google-calendar.service.ts` (Google API integration)
- ❌ `lib/services/enrollment/enrollment.service.ts` (enrollment creation)
- ❌ `lib/services/course/lesson.service.ts` (lesson creation)
- ❌ `firestore.rules` (security rules)
- ❌ Any authentication logic

---

## 🎯 **Validation Checklist**

Before committing any change, verify:

### **For Enrollment Fixes**
- [ ] Tested with 3 enrolled students (previously failing case)
- [ ] Tested with 2 enrolled students (previously working case)
- [ ] Tested with 0 enrolled students + external emails
- [ ] Error messages are clear and helpful
- [ ] No breaking changes to scheduled class creation
- [ ] Console logs confirm enrollment validation logic

### **For Instant Meeting Visibility**
- [ ] Instant meeting appears in classes list within 5 seconds
- [ ] Scheduled classes still appear correctly
- [ ] In-progress classes show correct status
- [ ] No duplicate classes in list
- [ ] Time filter doesn't show old classes (>10 minutes past)

### **For Teacher Recent Activity**
- [ ] API call appears in Network tab (browser DevTools)
- [ ] API returns 200 status with data
- [ ] Dashboard displays real student names (not dummy data)
- [ ] Error handling works (test with invalid token)
- [ ] Loading state shows while fetching

### **For Lesson Count Fix**
- [ ] Firestore console shows correct number of lessons
- [ ] Dashboard lesson count matches Firestore
- [ ] Course view lesson count matches Firestore
- [ ] Course edit lesson count matches Firestore
- [ ] Console logs show all lessons being retrieved

---

## 🔄 **Change Management**

### **Before Making Changes**
1. Read the relevant `.prd.md` section for the issue
2. Understand the root cause (don't guess!)
3. Add logging to confirm hypothesis
4. Test with existing working cases first
5. Check this scope document for restrictions

### **While Making Changes**
1. Change ONE file at a time
2. Test after each change
3. Commit working increments (not all at once)
4. Update `.current.md` with progress
5. If stuck for >15 minutes, stop and reassess

### **After Making Changes**
1. Run full test suite (if exists)
2. Manual testing with all test cases from PRD
3. Check browser console for errors
4. Check terminal logs for backend errors
5. Update documentation (current.md, PENDING_TASKS.md)
6. Commit with clear message describing fix

---

## 🚦 **Decision Framework**

### **When in Doubt:**
```
Question: Should I modify this file?
├─ Is it listed in "Must NOT Modify"? → ❌ DON'T TOUCH
├─ Is it listed in "Must Modify"? → ✅ PROCEED (follow guidance)
├─ Is it listed in "May Modify"? → ⚠️ ONLY IF NECESSARY
└─ Not listed? → ❌ STOP - Check with user first
```

### **When Changing Query Logic:**
```
Question: Should I change this Firestore query?
├─ Am I only adding logging? → ✅ SAFE
├─ Am I adjusting a time window by <1 hour? → ✅ PROBABLY SAFE (test thoroughly)
├─ Am I changing collection path or where clauses? → ❌ HIGH RISK (confirm root cause first)
├─ Am I removing existing filters? → ❌ VERY HIGH RISK (understand why it exists)
└─ Unsure? → ❌ STOP - Add logging first, don't modify query
```

### **When Adding Frontend Code:**
```
Question: Should I add this frontend code?
├─ Is it console.log for debugging? → ✅ ALWAYS SAFE
├─ Is it a new API call to existing endpoint? → ✅ SAFE (verify endpoint exists)
├─ Is it error handling (try-catch)? → ✅ SAFE (improves robustness)
├─ Does it change state management logic? → ⚠️ TEST THOROUGHLY
├─ Does it modify existing useEffect dependencies? → ❌ HIGH RISK (can cause loops)
└─ Unsure? → ⚠️ ASK FIRST
```

---

## 📞 **When to Ask for Help**

Stop and consult if:

1. **99% Certainty Rule Violated**
   - You're not sure if a change will break something
   - Root cause is unclear after adding logging
   - Multiple files need to change and dependencies are complex

2. **Unexpected Behavior**
   - Fix doesn't work after following PRD instructions
   - New errors appear after making a change
   - Tests fail for reasons unrelated to your change

3. **Scope Creep**
   - You discover the issue is bigger than documented
   - Fix requires changes to "Must NOT Modify" files
   - New related issues appear while fixing

4. **Security Concerns**
   - Change affects authentication or authorization
   - Change exposes user data in logs or error messages
   - Change modifies Firestore security rules

---

## 🎓 **Lessons Learned (From Previous Phases)**

### **From Recurring Class Bug Fix**
- ✅ **Always calculate derived fields** (like daysOfWeek) in frontend before API call
- ✅ **Add defensive logging** to catch missing parameters early
- ✅ **Test with all recurrence patterns** (weekly, biweekly, monthly)

### **From Authentication Fix**
- ✅ **Token refresh is critical** for long sessions
- ✅ **Role claims must sync** with Firestore user documents
- ✅ **Always check token expiry** before making authenticated requests

### **From Dashboard Real Data Implementation**
- ✅ **Verify API endpoints exist** before assuming frontend is calling them
- ✅ **Check browser Network tab** to see actual requests
- ✅ **Use consistent field naming** (lessonsCount vs lessons.length)

### **From Lesson Management System**
- ✅ **Subcollection queries need careful path construction**
- ✅ **Order field is critical** for consistent lesson display
- ✅ **publishedOnly filter affects visibility** - use carefully

---

## 📚 **Reference Documents**

**Must Read Before Starting:**
- [Phase 5 PRD](./phase-5-critical-fixes.prd.md) - Full requirements and solutions
- [Instant Meeting Investigation](../instant-meeting-issue/INSTANT_MEETING_ENROLLMENT_INVESTIGATION.md) - Root cause analysis
- [Pending Tasks](../reference/PENDING_TASKS.md) - Current known issues

**Reference During Work:**
- [MAIN.md](../MAIN.md) - Project structure and navigation
- [Architecture Overview](../architecture/CURRENT_ARCHITECTURE.md) - System design
- [Firebase Schema](../firebase/FIRESTORE_INDEX_SETUP.md) - Database structure

**Update After Completion:**
- [Phase 5 Current Status](./phase-5-critical-fixes.current.md) - Track progress
- [Pending Tasks](../reference/PENDING_TASKS.md) - Mark issues resolved
- [MAIN.md](../MAIN.md) - Update phase completion status

---

**Document Owner:** J (ZenType Architect)  
**Enforcement Level:** STRICT (99% Certainty Rule)  
**Last Updated:** November 19, 2025  
**Next Review:** After first fix implementation

