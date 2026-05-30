# 🚀 Prompt for Next AI Session

Copy and paste this into your next chat with Claude:

---

Hello! I'm continuing work on the DualLing Firebase migration project. Before we start implementing the next phase, please:

## 📚 **Step 1: Review These Files (In Order)**

1. **`/docs/SESSION_HANDOFF_OCT_9_2025.md`** - Complete summary of what was accomplished and what's next
2. **`/docs/ACTION_PLAN.md`** - Current status (Phase 3 Week 1 complete)
3. **`/docs/PHASE_3_IMPLEMENTATION_PLAN.md`** - Full 3-week implementation roadmap
4. **`/docs/PHASE_3_STATUS_AND_TESTING.md`** - What's been built and how to test it
5. **`/docs/main.md`** - Central IKB hub (skim the recent changes log)

## 🎯 **Step 2: Understand Current State**

We are at: **Phase 3 Week 1 Complete**

**What's Done:**
- ✅ Course Service implemented (CourseService, CourseRepository, LessonRepository)
- ✅ `/api/courses` route working (GET all courses, POST create course)
- ✅ All trace logging implemented
- ✅ Dashboard UI issues fixed (dark theme resolved)
- ✅ All documentation updated

**What Needs to Be Done Next:**

**I want to continue with Phase 3 implementation.** Based on the plan in `PHASE_3_IMPLEMENTATION_PLAN.md`, we need to:

1. **Create Firestore collections** for all the data structures according to the plan
2. **Complete the Course API routes** (individual course routes, lesson routes)
3. **Implement Enrollment Service** (Week 2)
4. **Implement Progress Service** (Week 3)

## 🗂️ **Step 3: Firestore Collections Setup**

According to our architecture plan, we need these Firestore collections:

```
firestore/
├── courses/{courseId}                    ⏳ NEEDS SETUP
│   ├── lessons/{lessonId}                ⏳ NEEDS SETUP
│   └── quizzes/{quizId}                  ⏳ NEEDS SETUP
├── enrollments/{enrollmentId}            ⏳ NEEDS SETUP
├── users/{userId}                        ✅ EXISTS (from Phase 2)
│   └── progress/{progressId}             ⏳ NEEDS SETUP
```

**Please:**
1. Review the data structures in `/lib/types/course.types.ts`
2. Verify the Firestore security rules in `/firestore.rules`
3. Create/verify composite indexes needed for our queries

## 📋 **Step 4: Choose Implementation Path**

I want to proceed with: **[CHOOSE ONE]**

- [ ] **Option A (Recommended):** Complete Week 1.5 - Individual Course/Lesson API routes first
- [ ] **Option B:** Jump to Week 2 - Enrollment Service
- [ ] **Option C:** Jump to Week 3 - Progress Service

## ✅ **Step 5: Before You Start Coding**

1. Confirm you've read the session handoff document
2. Verify current Firestore collections status
3. Check if any security rules need updating
4. Review the trace logging pattern we're using
5. Ask me if you have any questions about the architecture

## 🔑 **Important Notes**

- **All courses must remain FREE** for testing (no payment enforcement)
- **Follow the existing trace logging pattern** (startSpan → operations → endSpan)
- **Keep services isolated** in separate folders (conflict-free development)
- **Update documentation** as you go (especially PHASE_3_STATUS_AND_TESTING.md)
- **Test with curl commands** after creating each API route

## 🛠️ **Environment**

- **Branch:** `firebase-migration`
- **Project:** paji-duolingo (Firebase)
- **Dev Server:** `npm run dev`
- **Debug Panel:** Press `Ctrl+Shift+D` to toggle

---

**Once you've reviewed everything, let me know you're ready and we'll proceed with the next implementation phase!**
