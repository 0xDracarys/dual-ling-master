# Phase 3: Pending Tasks & Known Issues

**Status:** 🔴 **ACTIVE**  
**Created:** October 17, 2025  
**Phase:** Phase 3 - Course & Enrollment System  
**Priority:** Track ongoing work and blockers

---

## ✅ **Recently Completed (October 17, 2025)**

### **Dashboard Field Mapping Fixed**
- [x] Updated teacher dashboard to use Firestore field names
- [x] Fixed `course.lessons.length` → `course.lessonsCount`
- [x] Fixed `course.enrolledStudents` → `course.enrollmentCount`
- [x] Fixed `course.rating` → `course.averageRating`
- [x] Updated local Course interface to match Firestore schema
- [x] Fixed course card key (`course._id` → `course.id`)
- [x] Fixed course links to use `course.id` instead of `course._id`

### **Lesson Management System Complete**
- [x] Lesson CRUD API endpoints (GET, POST, PUT, DELETE)
- [x] LessonRepository Firestore operations
- [x] Type-specific lesson content handling
- [x] Auto-generation of description and order fields
- [x] Validation with detailed error messages
- [x] Dialog UI transparency fix
- [x] Lesson creation modal improvements

### **Dashboard Real Data Implementation**
- [x] Created `/api/students/enrolled-courses` endpoint
- [x] Created `/api/students/progress` endpoint  
- [x] Created `/api/teacher/recent-activity` endpoint
- [x] Updated student dashboard to display enrolled courses
- [x] Updated teacher dashboard to show real course data
- [x] Fixed enrollment field mapping in student dashboard
- [x] Refactored teacher recent activity to avoid additional Firestore index
- [x] Created and deployed Firestore composite index (`userId + enrolledAt`)
- [x] **VERIFIED:** Student dashboard shows enrolled courses ✅
- [x] **VERIFIED:** Student enrollment data retrieves successfully ✅

### **Authentication & Authorization**
- [x] Fixed role claims syncing during login
- [x] Implemented automatic token refresh (client-side)
- [x] Fixed Firestore undefined value filtering
- [x] Verified teacher course creation workflow

### **Course Management APIs**
- [x] Added Firebase authentication to PUT `/api/courses/[id]`
- [x] Added Firebase authentication to DELETE `/api/courses/[id]`
- [x] Teachers can now update course title and description
- [x] Teachers can now delete their courses

---

## ✅ **Recently Resolved Issues (November 19, 2025)**

### **Phase 5 Critical Fixes - All Issues Verified Working** ✅
**Status:** Closed - No fixes required  
**Verification Date:** November 19, 2025  
**Verification Method:** Playwright MCP browser testing  

**Issue 1: Lesson Count Discrepancy** ✅
- **Original Report:** Dashboard shows 2 lessons, other pages show 1
- **Verification Result:** All pages show consistent lesson counts
- **Evidence:** Course edit page displays all 3 lessons with correct titles and types
- **Conclusion:** No discrepancy found. Working correctly.

**Issue 2: Teacher Recent Activity Not Displaying** ✅
- **Original Report:** Dashboard shows dummy/placeholder data
- **Verification Result:** Recent Activity section displays real enrollment data
- **Evidence:** 8 real activity entries with student names, course titles, accurate timestamps
- **Conclusion:** Already implemented and working. No fixes needed.

**Issue 3: Instant Meeting Visibility** ✅
- **Original Report:** Created instant meetings don't appear in classes list
- **Verification Result:** Instant meetings appear immediately after creation
- **Evidence:** Created test meeting, appeared in "Upcoming" tab within 3 seconds with "In Progress" status
- **Conclusion:** Working perfectly. Time filter is correct.

**Issue 4: Enrollment Validation** ✅
- **Original Report:** Some students can't be added to instant meetings
- **Verification Result:** Enrollment filtering working as designed
- **Evidence:** System correctly excludes students with `status: "completed"`, includes `status: "active"`
- **Conclusion:** This is correct behavior, not a bug.

**Documentation:**
- Full verification report: `/docs/phase-5-critical-fixes/phase-5-critical-fixes.current.md`
- Original requirements: `/docs/phase-5-critical-fixes/phase-5-critical-fixes.prd.md`
- Scope boundaries: `/docs/phase-5-critical-fixes/phase-5-critical-fixes.scope.md`

---

## 🔴 **Known Issues & Pending Tasks**

---

### **2. Lesson Management - Add/Edit/Delete Lessons** 🟡
**Priority:** P2 - Medium  
**Status:** Not Started

**Issue Description:**
- Course edit page shows lessons list but no management functions yet
- Teachers need ability to add new lessons to courses
- Teachers need ability to edit existing lesson content
- Teachers need ability to delete lessons
- Teachers need ability to reorder lessons

**Required API Endpoints:**
- [ ] POST `/api/courses/[courseId]/lessons` - Create new lesson
- [ ] PUT `/api/courses/[courseId]/lessons/[lessonId]` - Update lesson
- [ ] DELETE `/api/courses/[courseId]/lessons/[lessonId]` - Delete lesson
- [ ] PATCH `/api/courses/[courseId]/lessons/reorder` - Reorder lessons

**Related Files:**
- `/app/teacher/course/edit/[id]/page.tsx` - Frontend (has LessonModal component)
- `/components/teacher/lesson-modal.tsx` - Lesson creation modal
- `/lib/services/course/lesson.service.ts` - Business logic
- `/lib/services/course/lesson.repository.ts` - Firestore operations

---

### **3. Course Publishing Workflow** 🟡
**Priority:** P2 - Medium  
**Status:** Not Started

**Issue Description:**
- Courses have `isPublished` field but no toggle functionality
- Need UI button to publish/unpublish courses
- Published courses should appear in student course browse page
- Unpublished courses should only be visible to teacher

**Required Changes:**
- [ ] Add publish/unpublish button to teacher course edit page
- [ ] Create PATCH `/api/courses/[courseId]/publish` endpoint
- [ ] Update course browse page to filter by `isPublished: true`
- [ ] Add validation: can only publish courses with at least 1 lesson

**Related Files:**
- `/app/teacher/course/edit/[id]/page.tsx` - Add publish button
- `/app/courses/page.tsx` - Filter published courses

---

### **4. Course Browse & Enrollment** 🟡
**Priority:** P2 - Medium  
**Status:** Partially Complete

**Current State:**
- Enrollment service exists and works
- Student can manually enroll via API
- No UI for browsing available courses
- No "Enroll" button on course detail pages

**Required Changes:**
- [ ] Update `/app/courses/page.tsx` to show published courses
- [ ] Add course filtering (by level, language, teacher)
- [ ] Add "Enroll" button to course detail page
- [ ] Implement enrollment confirmation modal
- [ ] Handle already-enrolled state (show "Go to Course" instead)
- [ ] Add enrollment success toast notification

**Related Files:**
- `/app/courses/page.tsx` - Course browse page
- `/app/course/[id]/page.tsx` - Course detail page
- `/lib/services/enrollment/enrollment.service.ts` - Enrollment logic

---

### **5. Lesson Viewing & Progress Tracking** 🟢
**Priority:** P3 - Low  
**Status:** Not Started

**Issue Description:**
- Students can see enrolled courses but can't access lessons yet
- Need lesson viewer page for text/video/quiz lessons
- Need progress tracking (mark lesson as complete)
- Need quiz submission and scoring

**Required Components:**
- [ ] Lesson viewer page `/course/[courseId]/lesson/[lessonId]`
- [ ] Text lesson renderer
- [ ] Video lesson player
- [ ] Quiz lesson interface with answer submission
- [ ] Progress update on lesson completion
- [ ] Next lesson navigation

**Related Files:**
- Create: `/app/course/[courseId]/lesson/[lessonId]/page.tsx`
- `/lib/services/enrollment/enrollment.service.ts` - Update progress methods

---

### **6. Firestore Index Management** 🟢
**Priority:** P3 - Low  
**Status:** Resolved (1 index created)

**Current State:**
- ✅ `userId + enrolledAt` index created (for student enrollments)
- ⏳ `courseId + enrolledAt` index NOT needed (query refactored)

**Note:** The second index was avoided by refactoring the teacher recent activity query to use parallel per-course queries instead of a single `where...in` query.

---

## 📋 **Recommended Next Session Priorities**

**Immediate (This Session):**
1. 🔴 **Fix teacher recent activity display** - High impact, should be quick fix
2. 🟡 **Test course update functionality** - Verify PUT endpoint works after auth fix

**Short-term (Next 1-2 Sessions):**
3. 🟡 **Implement lesson management** - Core teacher functionality
4. 🟡 **Add course publish/unpublish** - Required for student course discovery
5. 🟡 **Build course browse UI** - Students need to find courses

**Medium-term (Next 3-5 Sessions):**
6. 🟢 **Lesson viewer & progress tracking** - Student learning experience
7. 🟢 **Quiz system** - Assessment functionality

---

## 🔗 **Related Documentation**

- [Firestore Index Setup](./FIRESTORE_INDEX_SETUP.md) - Index configuration and troubleshooting
- [Authentication Fix Summary](./AUTHENTICATION_FIX_SUMMARY.md) - Auth implementation details
- [Phase 3 Status & Testing](./PHASE_3_STATUS_AND_TESTING.md) - Testing guidelines
- [Debug System](./DEBUG_SYSTEM.md) - Logging and debugging tools

---

## 📅 **Timeline**

| Date | Completed Tasks |
|------|----------------|
| Oct 17, 2025 | Dashboard real data, Firestore index, course PUT/DELETE auth |
| *Pending* | Teacher recent activity fix |
| *Pending* | Lesson management |
| *Pending* | Course publishing |
| *Pending* | Course browse UI |

---

**Last Updated:** October 17, 2025  
**Document Owner:** J (ZenType Architect)  
**Next Review:** After teacher recent activity fix
