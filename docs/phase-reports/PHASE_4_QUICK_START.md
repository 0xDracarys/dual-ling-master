# Phase 4: Class System - Quick Start Guide

**Date:** October 20, 2025  
**Status:** 🚀 **READY TO BEGIN**  
**Current Phase:** Phase 3 → Phase 4 Transition  
**Time to First Feature:** ~2 days

---

## 🎯 What You're Building

A complete **student learning experience** with:
- 📹 Video lessons with progress tracking
- 📖 Reading lessons with scroll tracking
- ✅ Interactive quizzes with instant grading
- 📝 Assignment submissions with teacher feedback
- 📊 Progress visualization and reports

---

## ⚡ Quick Decision: Where to Start?

### **Option 1: Complete Progress Tracking First** ✅ **RECOMMENDED**
**Why?** Foundation for all other features. Once progress tracking works, everything else builds on it.

**What You'll Build:**
- Video progress updates (save watch position every 5s)
- Reading progress (track scroll position)
- Lesson completion logic
- Enrollment progress calculation

**Time:** 2-3 days  
**Files to Create:** 
- Enhance `lib/services/progress/progress.service.ts`
- Add `lib/services/progress/progress.repository.ts` methods
- Create `app/api/progress/video/update/route.ts`
- Create `app/api/progress/reading/update/route.ts`
- Create `app/api/progress/lesson/complete/route.ts`

**Start Here:** [Week 1 - Day 1-2 in CLASS_SYSTEM_IMPLEMENTATION_PLAN.md](#week-1-day-1-2-progressservice-enhancement)

---

### **Option 2: Build Quiz System First**
**Why?** Most visible feature to users. Immediate "wow" factor.

**What You'll Build:**
- Quiz submission API
- Auto-grading logic
- Quiz attempts history
- Score calculation

**Time:** 2-3 days  
**Dependencies:** Basic progress tracking (can use simplified version)

**Start Here:** [Week 1 - Day 3-4 in CLASS_SYSTEM_IMPLEMENTATION_PLAN.md](#week-1-day-3-4-quizservice-implementation)

---

### **Option 3: Build Lesson Player UI First**
**Why?** Frontend-first approach. See immediate visual results.

**What You'll Build:**
- Lesson player page
- Video player component
- Reading content component
- Lesson navigation

**Time:** 3-4 days  
**Dependencies:** Mock API responses initially, connect to real APIs later

**Start Here:** [Week 2 - Day 3-4 in CLASS_SYSTEM_IMPLEMENTATION_PLAN.md](#week-2-day-3-4-lesson-player-component)

---

## 🚀 Recommended Path: Option 1 (Progress Tracking)

### Step 1: Enhance ProgressService (2 hours)

**File:** `lib/services/progress/progress.service.ts`

Add these methods to the existing `ProgressService` class:

```typescript
/**
 * Update video progress (called every 5-10 seconds from video player)
 */
async updateVideoProgress(
  userId: string,
  lessonId: string,
  courseId: string,
  currentTime: number,
  duration: number
): Promise<void> {
  const spanId = traceLogger.startSpan('Progress', 'updateVideoProgress', {
    userId,
    lessonId,
    currentTime,
    duration
  });

  try {
    // Get or create progress document
    const progress = await this.progressRepo.getOrCreate(userId, lessonId, courseId);
    
    // Calculate completion (90% watched = completed)
    const watchedPercentage = (currentTime / duration) * 100;
    const isCompleted = watchedPercentage >= 90;

    // Update progress
    await this.progressRepo.update(progress.id, {
      'videoProgress.currentTime': currentTime,
      'videoProgress.duration': duration,
      'videoProgress.completed': isCompleted,
      status: isCompleted ? 'completed' : 'in_progress',
      lastViewedAt: new Date(),
      updatedAt: new Date(),
    });

    // If just completed, update enrollment
    if (isCompleted && progress.status !== 'completed') {
      await this.updateEnrollmentProgress(userId, courseId);
    }

    traceLogger.log('success', 'Progress', 'Video progress updated', {
      lessonId,
      watchedPercentage: Math.round(watchedPercentage),
      completed: isCompleted
    });
    traceLogger.endSpan(spanId, 'success');
  } catch (error: any) {
    traceLogger.log('error', 'Progress', 'Video progress update failed', error);
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    throw error;
  }
}

/**
 * Private helper: Update enrollment progress when lesson is completed
 */
private async updateEnrollmentProgress(
  userId: string,
  courseId: string
): Promise<void> {
  const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Get count of completed lessons
  const completedCount = await this.progressRepo.getCompletedCount(userId, courseId);
  
  // Calculate percentage
  const progressPercentage = (completedCount / enrollment.totalLessonsCount) * 100;

  // Update enrollment
  await this.enrollmentRepo.update(enrollment.id, {
    completedLessonsCount: completedCount,
    progressPercentage: Math.round(progressPercentage * 100) / 100,
    lastAccessedAt: new Date(),
    updatedAt: new Date(),
  });

  // Check if course is complete
  if (completedCount === enrollment.totalLessonsCount) {
    await this.enrollmentRepo.update(enrollment.id, {
      status: 'completed',
      completedAt: new Date(),
    });
    traceLogger.log('success', 'Progress', 'Course completed!', {
      enrollmentId: enrollment.id,
      courseId
    });
  }
}
```

---

### Step 2: Add Repository Methods (1 hour)

**File:** `lib/services/progress/progress.repository.ts`

Add these methods to `ProgressRepository`:

```typescript
/**
 * Get or create progress document (idempotent operation)
 */
async getOrCreate(
  userId: string,
  lessonId: string,
  courseId: string
): Promise<Progress> {
  const spanId = traceLogger.startSpan('Firestore', 'progress.getOrCreate', {
    userId,
    lessonId
  });

  try {
    const progressId = `${userId}_${lessonId}`;
    const docRef = db.collection('progress').doc(progressId);
    const doc = await docRef.get();

    if (doc.exists) {
      traceLogger.log('success', 'Firestore', 'Progress found', { progressId });
      traceLogger.endSpan(spanId, 'success');
      return { id: doc.id, ...doc.data() } as Progress;
    }

    // Create new progress document
    const newProgress: Partial<Progress> = {
      id: progressId,
      userId,
      lessonId,
      courseId,
      status: 'not_started',
      timeSpent: 0,
      viewCount: 0,
      lastViewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await docRef.set(newProgress);
    traceLogger.log('success', 'Firestore', 'Progress created', { progressId });
    traceLogger.endSpan(spanId, 'success');
    return newProgress as Progress;
  } catch (error: any) {
    traceLogger.log('error', 'Firestore', 'getOrCreate failed', error);
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    throw error;
  }
}

/**
 * Get count of completed lessons for a user in a course
 */
async getCompletedCount(userId: string, courseId: string): Promise<number> {
  const spanId = traceLogger.startSpan('Firestore', 'progress.getCompletedCount', {
    userId,
    courseId
  });

  try {
    const snapshot = await db
      .collection('progress')
      .where('userId', '==', userId)
      .where('courseId', '==', courseId)
      .where('status', '==', 'completed')
      .get();

    const count = snapshot.size;
    traceLogger.log('success', 'Firestore', 'Completed count retrieved', { count });
    traceLogger.endSpan(spanId, 'success');
    return count;
  } catch (error: any) {
    traceLogger.log('error', 'Firestore', 'getCompletedCount failed', error);
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    throw error;
  }
}
```

---

### Step 3: Create Video Progress API (30 minutes)

**File:** `app/api/progress/video/update/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { ProgressService } from '@/lib/services/progress/progress.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { z } from 'zod';

const updateVideoProgressSchema = z.object({
  lessonId: z.string().min(1),
  courseId: z.string().min(1),
  currentTime: z.number().min(0),
  duration: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/progress/video/update');

  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Missing or invalid token');
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Validate request body
    const body = await request.json();
    const validatedData = updateVideoProgressSchema.parse(body);

    // Update progress
    const progressService = new ProgressService();
    await progressService.updateVideoProgress(
      userId,
      validatedData.lessonId,
      validatedData.courseId,
      validatedData.currentTime,
      validatedData.duration
    );

    traceLogger.log('success', 'API', 'Video progress updated', {
      lessonId: validatedData.lessonId,
      currentTime: validatedData.currentTime
    });
    traceLogger.endSpan(spanId, 'success');

    return Response.json({
      success: true,
      message: 'Video progress updated'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      traceLogger.log('warn', 'API', 'Validation error', { errors: error.errors });
      traceLogger.endSpan(spanId, 'error', { message: 'Validation failed' });
      return Response.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    traceLogger.log('error', 'API', 'Video progress update failed', error);
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### Step 4: Test the Flow (30 minutes)

**Using curl:**

```bash
# 1. Login to get token
TOKEN=$(curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test5@gmail.com",
    "password": "test1234"
  }' | jq -r '.token')

# 2. Update video progress
curl -X POST "http://localhost:3000/api/progress/video/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "lessonId": "YOUR_LESSON_ID",
    "courseId": "YOUR_COURSE_ID",
    "currentTime": 120,
    "duration": 300
  }'

# Expected response:
# {
#   "success": true,
#   "message": "Video progress updated"
# }

# 3. Verify in Firestore Console
# Navigate to: https://console.firebase.google.com/project/paji-duolingo/firestore
# Collection: progress
# Document: {userId}_{lessonId}
# Check: videoProgress.currentTime = 120
```

---

## 📋 Day-by-Day Execution Plan

### **Day 1: Progress Tracking Foundation**
- [ ] Morning: Enhance `ProgressService` with `updateVideoProgress()`
- [ ] Afternoon: Add `getOrCreate()` and `getCompletedCount()` to repository
- [ ] Evening: Create `/api/progress/video/update` route
- [ ] Test: Verify progress updates work with curl

### **Day 2: Lesson Completion Logic**
- [ ] Morning: Add `updateReadingProgress()` to `ProgressService`
- [ ] Afternoon: Add `markLessonComplete()` method
- [ ] Evening: Create `/api/progress/lesson/complete` route
- [ ] Test: Complete a lesson and verify enrollment updates

### **Day 3: Quiz System (Part 1)**
- [ ] Morning: Create `QuizService` class structure
- [ ] Afternoon: Implement `submitQuiz()` method with grading logic
- [ ] Evening: Create `QuizAttemptRepository`
- [ ] Test: Manual quiz grading logic unit test

### **Day 4: Quiz System (Part 2)**
- [ ] Morning: Create `/api/quiz/submit` route
- [ ] Afternoon: Create `/api/quiz/attempts/[lessonId]` route
- [ ] Evening: Test quiz submission with curl
- [ ] Test: Verify quiz scores update enrollment

### **Day 5: Lesson Player UI**
- [ ] Morning: Create lesson player page structure
- [ ] Afternoon: Build `VideoPlayer` component with progress tracking
- [ ] Evening: Integrate video progress API calls
- [ ] Test: Watch video, verify progress saves every 5 seconds

---

## ✅ Success Criteria for Week 1

- [ ] Video progress updates every 5 seconds
- [ ] Lesson marked complete when 90% watched
- [ ] Enrollment progress updates automatically
- [ ] Quiz submission calculates correct score
- [ ] Quiz attempts stored in Firestore
- [ ] Best quiz score tracked on enrollment
- [ ] All trace logging working
- [ ] No errors in Cloud Logging

---

## 🆘 Common Issues & Solutions

### Issue 1: "Progress document not updating"
**Solution:** Check Firestore indexes. May need to create composite index for `userId + courseId + status`.

### Issue 2: "Video progress not saving"
**Solution:** Verify `Authorization` header is being sent with Bearer token. Check token hasn't expired (1 hour).

### Issue 3: "Enrollment progress not calculating"
**Solution:** Ensure `getCompletedCount()` query has correct field names. Verify `status === 'completed'` exactly.

### Issue 4: "Quiz grading returns wrong score"
**Solution:** Check answer comparison logic. Use `.toLowerCase().trim()` on both sides.

---

## 📚 Reference Documents

**Read These First:**
- `CLASS_SYSTEM_IMPLEMENTATION_PLAN.md` - Full technical spec
- `PHASE_3_IMPLEMENTATION_PLAN.md` - Architecture patterns
- `WHATS_NEXT_AFTER_IAM_FIX.md` - Current status

**For Specific Features:**
- Week 1: Progress + Quiz → Section "Week 1: Complete Progress Tracking + Quiz System"
- Week 2: Assignments + UI → Section "Week 2: Assignment System + Lesson Player"
- Week 3: Visualization → Section "Week 3: Progress Visualization + Communication Features"

---

## 💡 Pro Tips

1. **Use Trace Logging:** Every method should have `traceLogger.startSpan()` and `traceLogger.endSpan()`
2. **Test Incrementally:** Test each method immediately after writing it
3. **Firestore Console is Your Friend:** Verify data after every API call
4. **Commit Often:** One commit per working feature (e.g., "feat: Add video progress tracking")
5. **Mock First, Integrate Later:** For UI, use mock data first, then connect to real APIs

---

## 🚀 Ready to Start?

**Option 1 Chosen?** → Start with [Step 1: Enhance ProgressService](#step-1-enhance-progressservice-2-hours)

**Option 2 Chosen?** → Jump to [Quiz System in CLASS_SYSTEM_IMPLEMENTATION_PLAN.md](./CLASS_SYSTEM_IMPLEMENTATION_PLAN.md#day-3-4-quizservice-implementation)

**Option 3 Chosen?** → Jump to [Lesson Player in CLASS_SYSTEM_IMPLEMENTATION_PLAN.md](./CLASS_SYSTEM_IMPLEMENTATION_PLAN.md#day-3-4-lesson-player-component)

**Need Help?** → Check `WHATS_NEXT_AFTER_IAM_FIX.md` for current blockers or questions.

---

**Status:** 🚀 **READY TO CODE**  
**Estimated First Feature:** 2 hours (video progress tracking)  
**Estimated Week 1 Complete:** 4-5 days  
**Blockers:** None - all prerequisites met

---

**Prepared By:** ZenType Architect (J)  
**Date:** October 20, 2025  
**For:** Immediate implementation - start today!
