# Phase 3: Course & Enrollment Services - Implementation Plan

**Status:** � **IN PROGRESS (65% Complete)**
**Version:** 2.0.0
**Created:** October 9, 2025
**Updated:** October 17, 2025
**Branch:** `firebase-migration`
**Estimated Duration:** 2-3 weeks (on track)

---

## 📊 Progress Summary

- ✅ **Week 1: Course Management** - 100% Complete
- ✅ **Week 1.5: Lesson Management** - 95% Complete
- ✅ **Week 2: Enrollment System** - 80% Complete
- 🟡 **Week 3: Progress Tracking** - 30% Complete

**Overall Phase 3 Progress:** 65% Complete

---

## 🎯 Mission Statement

Implement **Course Management**, **Enrollment**, and **Progress Tracking** services following the same conflict-free, service-isolated patterns established in Phase 2 (Authentication + Trace System).

**Architecture designed with future payment integration in mind** - all schemas and services will support paid/free courses without requiring major refactoring.

---

## 🏗️ Architecture Principles (Continued from Phase 2)

### **Service Isolation (Non-Negotiable)**
```
lib/services/
├── auth/                      ✅ Phase 2 Complete
│   ├── auth.service.ts
│   └── user.repository.ts
│
├── course/                    ⏳ Phase 3 - Week 1
│   ├── course.service.ts      (Business logic + trace logging)
│   └── course.repository.ts   (Firestore CRUD + trace logging)
│
├── enrollment/                ⏳ Phase 3 - Week 2
│   ├── enrollment.service.ts
│   └── enrollment.repository.ts
│
└── progress/                  ⏳ Phase 3 - Week 3
    ├── progress.service.ts
    └── progress.repository.ts
```

**Key Rules:**
- ✅ Each service has its own folder
- ✅ No cross-service imports (only types/interfaces)
- ✅ All services use traceLogger independently
- ✅ Merge conflicts impossible (different files)

### **Payment-Ready Architecture**

**Today:** All courses are free, no payment checks
**Future:** Add payment verification without touching existing code

**How?** Use a **feature flag + extensible schema**:
```typescript
// Course schema (designed for future payments)
interface Course {
  id: string;
  title: string;
  isPaid: boolean;              // ← Future: payment check here
  price?: number;               // ← Future: amount in cents
  currency?: string;            // ← Future: USD, EUR, etc.
  stripeProductId?: string;     // ← Future: Stripe integration
  ...
}

// Enrollment (designed for future payment verification)
interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Timestamp;
  paymentStatus: 'free' | 'pending' | 'completed' | 'failed'; // ← Ready for payments
  paymentIntentId?: string;     // ← Future: Stripe Payment Intent
  ...
}
```

**Migration path when adding payments:**
1. Create new `PaymentService` (separate file)
2. Update course creation to allow `isPaid: true`
3. Enrollment checks `paymentStatus` before granting access
4. **Zero changes to existing Course/Progress services**

---

## 📊 Data Models (Firestore Schema)

### **1. Courses Collection**

**Collection:** `courses`
**Document ID:** Auto-generated

```typescript
interface Course {
  // Core fields
  id: string;                    // Firestore document ID
  title: string;                 // "Spanish for Beginners"
  description: string;           // Long description
  language: 'en' | 'lt';         // Course language
  targetLanguage: 'en' | 'lt';   // Language being taught
  level: 'beginner' | 'intermediate' | 'advanced';

  // Teacher info
  teacherId: string;             // User UID of teacher
  teacherName: string;           // Denormalized for performance

  // Content
  lessonsCount: number;          // Total lessons in course
  estimatedHours: number;        // Estimated completion time
  thumbnailUrl?: string;         // Course cover image

  // Publishing
  isPublished: boolean;          // Draft vs Published
  publishedAt?: Timestamp;       // When course went live

  // Payment (future-ready)
  isPaid: boolean;               // false = free, true = requires payment
  price?: number;                // In cents (e.g., 1999 = $19.99)
  currency?: string;             // 'USD', 'EUR', etc.
  stripeProductId?: string;      // Stripe Product ID
  stripePriceId?: string;        // Stripe Price ID

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // User UID

  // Analytics (future)
  enrollmentCount?: number;      // Total enrollments
  averageRating?: number;        // 0-5 stars
  reviewCount?: number;
}
```

**Firestore Security Rules:**
```javascript
match /courses/{courseId} {
  // Anyone can read published courses
  allow read: if resource.data.isPublished == true;

  // Teachers can read their own drafts
  allow read: if request.auth != null
    && request.auth.uid == resource.data.teacherId;

  // Only teachers can create courses
  allow create: if request.auth != null
    && request.auth.token.role == 'teacher';

  // Only course owner can update
  allow update: if request.auth != null
    && request.auth.uid == resource.data.teacherId;

  // Only admins can delete
  allow delete: if request.auth != null
    && request.auth.token.role == 'admin';
}
```

---

### **2. Lessons Subcollection**

**Collection:** `courses/{courseId}/lessons`
**Document ID:** Auto-generated

```typescript
interface Lesson {
  id: string;
  courseId: string;              // Parent course

  // Content
  title: string;
  description: string;
  order: number;                 // Lesson sequence (1, 2, 3...)
  type: 'video' | 'reading' | 'quiz' | 'exercise';

  // Media
  videoUrl?: string;             // Firebase Storage URL
  videoThumbnail?: string;
  duration?: number;             // In seconds
  contentMarkdown?: string;      // For reading lessons

  // Quiz data (if type === 'quiz')
  quizQuestions?: QuizQuestion[];
  passingScore?: number;         // Minimum % to pass

  // Publishing
  isPublished: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options?: string[];            // For multiple choice
  correctAnswer: string;
  explanation?: string;          // Shown after answer
  points: number;
}
```

**Firestore Security Rules:**
```javascript
match /courses/{courseId}/lessons/{lessonId} {
  // Read if course is published OR user is enrolled OR user is teacher
  allow read: if get(/databases/$(database)/documents/courses/$(courseId)).data.isPublished == true
    || exists(/databases/$(database)/documents/enrollments/$(request.auth.uid + '_' + courseId))
    || get(/databases/$(database)/documents/courses/$(courseId)).data.teacherId == request.auth.uid;

  // Only course teacher can write
  allow write: if request.auth != null
    && get(/databases/$(database)/documents/courses/$(courseId)).data.teacherId == request.auth.uid;
}
```

---

### **3. Enrollments Collection**

**Collection:** `enrollments`
**Document ID:** `{userId}_{courseId}` (composite key)

```typescript
interface Enrollment {
  id: string;                    // userId_courseId
  userId: string;                // Student UID
  courseId: string;

  // Student info (denormalized)
  userName: string;
  userEmail: string;

  // Course info (denormalized)
  courseTitle: string;
  teacherName: string;

  // Enrollment status
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: Timestamp;
  completedAt?: Timestamp;

  // Payment (future-ready)
  paymentStatus: 'free' | 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;      // Stripe Payment Intent ID
  paymentAmount?: number;        // Amount paid (in cents)
  paymentCurrency?: string;
  paidAt?: Timestamp;

  // Progress
  completedLessonsCount: number; // How many lessons completed
  totalLessonsCount: number;     // Total lessons in course
  progressPercentage: number;    // 0-100
  lastAccessedAt: Timestamp;
  currentLessonId?: string;      // Last lesson accessed

  // Quiz scores
  quizScores: Record<string, number>; // { lessonId: score }
  averageQuizScore: number;      // Overall quiz average

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore Security Rules:**
```javascript
match /enrollments/{enrollmentId} {
  // Users can read their own enrollments
  allow read: if request.auth != null
    && enrollmentId.matches(request.auth.uid + '_.*');

  // Teachers can read enrollments for their courses
  allow read: if request.auth != null
    && request.auth.token.role == 'teacher'
    && resource.data.courseId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.teachingCourses;

  // Users can create enrollments for free courses
  allow create: if request.auth != null
    && request.auth.uid == request.resource.data.userId
    && get(/databases/$(database)/documents/courses/$(request.resource.data.courseId)).data.isPaid == false;

  // Users can update their own enrollments (progress)
  allow update: if request.auth != null
    && request.auth.uid == resource.data.userId;

  // Admins can delete
  allow delete: if request.auth != null
    && request.auth.token.role == 'admin';
}
```

---

### **4. Progress Collection**

**Collection:** `progress`
**Document ID:** `{userId}_{lessonId}`

```typescript
interface Progress {
  id: string;                    // userId_lessonId
  userId: string;
  courseId: string;
  lessonId: string;

  // Progress status
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Timestamp;

  // Engagement
  timeSpent: number;             // Total seconds spent
  viewCount: number;             // How many times accessed
  lastViewedAt: Timestamp;

  // Quiz results (if lesson has quiz)
  quizAttempts?: QuizAttempt[];
  bestQuizScore?: number;        // Highest score achieved

  // Video progress (if lesson has video)
  videoProgress?: number;        // Seconds watched
  videoCompleted?: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface QuizAttempt {
  attemptNumber: number;
  score: number;                 // 0-100
  answers: Record<string, string>; // { questionId: userAnswer }
  completedAt: Timestamp;
  timeSpent: number;             // Seconds
}
```

**Firestore Security Rules:**
```javascript
match /progress/{progressId} {
  // Users can read/write their own progress
  allow read, write: if request.auth != null
    && progressId.matches(request.auth.uid + '_.*');

  // Teachers can read progress for enrolled students in their courses
  allow read: if request.auth != null
    && request.auth.token.role == 'teacher'
    && exists(/databases/$(database)/documents/enrollments/$(resource.data.userId + '_' + resource.data.courseId));
}
```

---

## 🔧 Service Implementation Plan

### **Week 1: CourseService + Lessons**

#### **Day 1-2: CourseService**

**File:** `lib/services/course/course.service.ts`

```typescript
import { traceLogger } from '@/lib/tracing/trace-logger';
import { CourseRepository } from './course.repository';
import { LessonRepository } from './lesson.repository';

export class CourseService {
  private courseRepo = new CourseRepository();
  private lessonRepo = new LessonRepository();

  async createCourse(data: CreateCourseData): Promise<Course> {
    const spanId = traceLogger.startSpan('Course', 'createCourse', {
      teacherId: data.teacherId,
      title: data.title
    });

    try {
      traceLogger.log('info', 'Course', 'Validating course data');
      this.validateCourseData(data);
      traceLogger.log('success', 'Course', 'Course data validated');

      traceLogger.log('info', 'Course', 'Creating course document');
      const course = await this.courseRepo.create({
        ...data,
        isPublished: false,
        isPaid: false, // Default to free
        lessonsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      traceLogger.log('success', 'Course', 'Course created', { courseId: course.id });

      traceLogger.endSpan(spanId, 'success');
      return course;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course creation failed', error);
      traceLogger.endSpan(spanId, 'error', {
        message: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  async publishCourse(courseId: string, teacherId: string): Promise<void> {
    const spanId = traceLogger.startSpan('Course', 'publishCourse', { courseId });

    try {
      // Verify teacher owns course
      const course = await this.courseRepo.getById(courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can publish');
      }

      // Verify course has lessons
      if (course.lessonsCount === 0) {
        throw new Error('Cannot publish course with no lessons');
      }

      await this.courseRepo.update(courseId, {
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      });

      traceLogger.log('success', 'Course', 'Course published', { courseId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Course publish failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async addLesson(courseId: string, lessonData: CreateLessonData): Promise<Lesson> {
    const spanId = traceLogger.startSpan('Course', 'addLesson', {
      courseId,
      lessonTitle: lessonData.title
    });

    try {
      const lesson = await this.lessonRepo.create(courseId, {
        ...lessonData,
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Increment course lesson count
      const course = await this.courseRepo.getById(courseId);
      await this.courseRepo.update(courseId, {
        lessonsCount: course.lessonsCount + 1,
        updatedAt: new Date(),
      });

      traceLogger.log('success', 'Course', 'Lesson added', { lessonId: lesson.id });
      traceLogger.endSpan(spanId, 'success');
      return lesson;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Add lesson failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async getPublishedCourses(filters?: CourseFilters): Promise<Course[]> {
    const spanId = traceLogger.startSpan('Course', 'getPublishedCourses', filters);

    try {
      const courses = await this.courseRepo.getPublished(filters);
      traceLogger.log('success', 'Course', 'Retrieved published courses', {
        count: courses.length
      });
      traceLogger.endSpan(spanId, 'success');
      return courses;
    } catch (error: any) {
      traceLogger.log('error', 'Course', 'Failed to get courses', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  // ... more methods (updateCourse, deleteCourse, getCourseDetails, etc.)
}
```

**File:** `lib/services/course/course.repository.ts`

```typescript
import { db } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';

export class CourseRepository {
  private collection = db.collection('courses');

  async create(data: CreateCourseData): Promise<Course> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.create');

    try {
      traceLogger.log('info', 'Firestore', 'Creating course document');
      const docRef = await this.collection.add(data);
      const course = { id: docRef.id, ...data };

      traceLogger.log('success', 'Firestore', 'Course document created', {
        courseId: docRef.id
      });
      traceLogger.endSpan(spanId, 'success');
      return course as Course;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Course creation failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async getById(id: string): Promise<Course> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.getById', { id });

    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        throw new Error('Course not found');
      }

      traceLogger.log('success', 'Firestore', 'Course retrieved', { id });
      traceLogger.endSpan(spanId, 'success');
      return { id: doc.id, ...doc.data() } as Course;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Course retrieval failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async getPublished(filters?: CourseFilters): Promise<Course[]> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.getPublished', filters);

    try {
      let query = this.collection.where('isPublished', '==', true);

      if (filters?.language) {
        query = query.where('language', '==', filters.language);
      }
      if (filters?.level) {
        query = query.where('level', '==', filters.level);
      }
      if (filters?.isPaid !== undefined) {
        query = query.where('isPaid', '==', filters.isPaid);
      }

      const snapshot = await query.get();
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Course[];

      traceLogger.log('success', 'Firestore', 'Published courses retrieved', {
        count: courses.length
      });
      traceLogger.endSpan(spanId, 'success');
      return courses;
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Query failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async update(id: string, data: Partial<Course>): Promise<void> {
    const spanId = traceLogger.startSpan('Firestore', 'courses.update', { id });

    try {
      await this.collection.doc(id).update(data);
      traceLogger.log('success', 'Firestore', 'Course updated', { id });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Firestore', 'Course update failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  // ... more methods
}
```

#### **Day 3: API Routes for Courses**

**File:** `app/api/courses/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { CourseService } from '@/lib/services/course/course.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { z } from 'zod';

const createCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  language: z.enum(['en', 'lt']),
  targetLanguage: z.enum(['en', 'lt']),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedHours: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/courses');

  try {
    traceLogger.log('info', 'API', 'Course creation request received');

    // TODO: Get teacher ID from Firebase Auth session
    // For now, we'll need to implement auth middleware first

    const body = await request.json();
    const validatedData = createCourseSchema.parse(body);

    const courseService = new CourseService();
    const course = await courseService.createCourse({
      ...validatedData,
      teacherId: 'TEMP_TEACHER_ID', // TODO: Get from auth
      teacherName: 'TEMP_NAME',      // TODO: Get from Firestore user
    });

    traceLogger.log('success', 'API', 'Course created successfully', {
      courseId: course.id
    });
    traceLogger.endSpan(spanId, 'success');

    return Response.json(
      { success: true, course },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'ZodError') {
      traceLogger.log('warn', 'API', 'Validation error', { errors: error.errors });
      traceLogger.endSpan(spanId, 'error', { message: 'Validation failed' });
      return Response.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    traceLogger.log('error', 'API', 'Course creation failed', error);
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'GET /api/courses');

  try {
    const courseService = new CourseService();
    const courses = await courseService.getPublishedCourses();

    traceLogger.log('success', 'API', 'Courses retrieved', { count: courses.length });
    traceLogger.endSpan(spanId, 'success');

    return Response.json({ success: true, courses });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get courses', error);
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

### **Week 2: EnrollmentService**

#### **Day 1-2: EnrollmentService**

**File:** `lib/services/enrollment/enrollment.service.ts`

```typescript
export class EnrollmentService {
  private enrollmentRepo = new EnrollmentRepository();
  private courseRepo = new CourseRepository();

  async enrollStudent(userId: string, courseId: string): Promise<Enrollment> {
    const spanId = traceLogger.startSpan('Enrollment', 'enrollStudent', {
      userId,
      courseId
    });

    try {
      // Check if course exists and is published
      traceLogger.log('info', 'Enrollment', 'Verifying course exists');
      const course = await this.courseRepo.getById(courseId);

      if (!course.isPublished) {
        throw new Error('Cannot enroll in unpublished course');
      }

      // Check if course is paid (future payment check here)
      if (course.isPaid) {
        traceLogger.log('warn', 'Enrollment', 'Attempted enrollment in paid course without payment');
        throw new Error('This course requires payment. Please complete checkout first.');
      }

      // Check if already enrolled
      traceLogger.log('info', 'Enrollment', 'Checking existing enrollment');
      const existingEnrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (existingEnrollment) {
        throw new Error('Already enrolled in this course');
      }

      // Create enrollment
      traceLogger.log('info', 'Enrollment', 'Creating enrollment document');
      const enrollment = await this.enrollmentRepo.create({
        userId,
        courseId,
        courseTitle: course.title,
        teacherName: course.teacherName,
        status: 'active',
        paymentStatus: 'free', // Free courses
        enrolledAt: new Date(),
        completedLessonsCount: 0,
        totalLessonsCount: course.lessonsCount,
        progressPercentage: 0,
        quizScores: {},
        averageQuizScore: 0,
        lastAccessedAt: new Date(),
      });

      // Increment course enrollment count
      await this.courseRepo.update(courseId, {
        enrollmentCount: (course.enrollmentCount || 0) + 1,
      });

      traceLogger.log('success', 'Enrollment', 'Student enrolled successfully', {
        enrollmentId: enrollment.id
      });
      traceLogger.endSpan(spanId, 'success');
      return enrollment;
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Enrollment failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async getStudentEnrollments(userId: string): Promise<Enrollment[]> {
    const spanId = traceLogger.startSpan('Enrollment', 'getStudentEnrollments', { userId });

    try {
      const enrollments = await this.enrollmentRepo.getByUser(userId);
      traceLogger.log('success', 'Enrollment', 'Enrollments retrieved', {
        count: enrollments.length
      });
      traceLogger.endSpan(spanId, 'success');
      return enrollments;
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Failed to get enrollments', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async unenroll(enrollmentId: string, userId: string): Promise<void> {
    const spanId = traceLogger.startSpan('Enrollment', 'unenroll', { enrollmentId });

    try {
      const enrollment = await this.enrollmentRepo.getById(enrollmentId);

      // Verify ownership
      if (enrollment.userId !== userId) {
        throw new Error('Unauthorized: Cannot unenroll other users');
      }

      // Update status to dropped
      await this.enrollmentRepo.update(enrollmentId, {
        status: 'dropped',
        updatedAt: new Date(),
      });

      traceLogger.log('success', 'Enrollment', 'Student unenrolled', { enrollmentId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Enrollment', 'Unenroll failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
```

---

### **Week 3: ProgressService**

#### **Day 1-2: ProgressService**

**File:** `lib/services/progress/progress.service.ts`

```typescript
export class ProgressService {
  private progressRepo = new ProgressRepository();
  private enrollmentRepo = new EnrollmentRepository();

  async markLessonComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    data: CompleteLessonData
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Progress', 'markLessonComplete', {
      userId,
      lessonId
    });

    try {
      // Verify enrollment
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (!enrollment) {
        throw new Error('Not enrolled in this course');
      }

      // Update progress
      const progress = await this.progressRepo.getOrCreate(userId, lessonId, courseId);
      await this.progressRepo.update(progress.id, {
        status: 'completed',
        completedAt: new Date(),
        timeSpent: (progress.timeSpent || 0) + (data.timeSpent || 0),
        updatedAt: new Date(),
      });

      // Update enrollment progress
      const completedCount = enrollment.completedLessonsCount + 1;
      const progressPercentage = (completedCount / enrollment.totalLessonsCount) * 100;

      await this.enrollmentRepo.update(enrollment.id, {
        completedLessonsCount: completedCount,
        progressPercentage,
        lastAccessedAt: new Date(),
        currentLessonId: lessonId,
        updatedAt: new Date(),
      });

      // Check if course is now complete
      if (completedCount === enrollment.totalLessonsCount) {
        await this.enrollmentRepo.update(enrollment.id, {
          status: 'completed',
          completedAt: new Date(),
        });
        traceLogger.log('success', 'Progress', 'Course completed!', {
          enrollmentId: enrollment.id
        });
      }

      traceLogger.log('success', 'Progress', 'Lesson marked complete', {
        lessonId,
        progressPercentage
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Mark complete failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  async submitQuiz(
    userId: string,
    courseId: string,
    lessonId: string,
    answers: Record<string, string>
  ): Promise<QuizResult> {
    const spanId = traceLogger.startSpan('Progress', 'submitQuiz', {
      userId,
      lessonId
    });

    try {
      // Get lesson to validate answers
      const lesson = await this.lessonRepo.getById(courseId, lessonId);
      if (!lesson.quizQuestions) {
        throw new Error('This lesson does not have a quiz');
      }

      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = lesson.quizQuestions.length;

      lesson.quizQuestions.forEach(q => {
        if (answers[q.id] === q.correctAnswer) {
          correctAnswers++;
        }
      });

      const score = (correctAnswers / totalQuestions) * 100;

      // Save quiz attempt
      const progress = await this.progressRepo.getOrCreate(userId, lessonId, courseId);
      const attempt: QuizAttempt = {
        attemptNumber: (progress.quizAttempts?.length || 0) + 1,
        score,
        answers,
        completedAt: new Date(),
        timeSpent: 0, // TODO: Track time
      };

      const quizAttempts = [...(progress.quizAttempts || []), attempt];
      const bestScore = Math.max(...quizAttempts.map(a => a.score));

      await this.progressRepo.update(progress.id, {
        quizAttempts,
        bestQuizScore: bestScore,
        updatedAt: new Date(),
      });

      // Update enrollment quiz average
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      const updatedScores = { ...enrollment.quizScores, [lessonId]: bestScore };
      const avgScore = Object.values(updatedScores).reduce((a, b) => a + b, 0) / Object.keys(updatedScores).length;

      await this.enrollmentRepo.update(enrollment.id, {
        quizScores: updatedScores,
        averageQuizScore: avgScore,
        lastAccessedAt: new Date(),
      });

      traceLogger.log('success', 'Progress', 'Quiz submitted', {
        score,
        passed: score >= (lesson.passingScore || 70)
      });
      traceLogger.endSpan(spanId, 'success');

      return {
        score,
        correctAnswers,
        totalQuestions,
        passed: score >= (lesson.passingScore || 70),
        bestScore,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Quiz submission failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }
}
```

---

## ✅ Phase 3 Checklist

### **Week 1: Course Management**
- [ ] Create `lib/services/course/course.service.ts` with trace logging
- [ ] Create `lib/services/course/course.repository.ts` with trace logging
- [ ] Create `lib/services/course/lesson.repository.ts` with trace logging
- [ ] Create `/app/api/courses/route.ts` (GET, POST)
- [ ] Create `/app/api/courses/[id]/route.ts` (GET, PUT, DELETE)
- [ ] Create `/app/api/courses/[id]/lessons/route.ts` (GET, POST)
- [ ] Test course CRUD operations
- [ ] Verify trace logging in terminal

### **Week 2: Enrollment System**
- [ ] Create `lib/services/enrollment/enrollment.service.ts` with trace logging
- [ ] Create `lib/services/enrollment/enrollment.repository.ts` with trace logging
- [ ] Create `/app/api/enrollment/route.ts` (POST - enroll)
- [ ] Create `/app/api/enrollment/[id]/route.ts` (DELETE - unenroll)
- [ ] Create `/app/api/students/enrollments/route.ts` (GET - my enrollments)
- [ ] Test enrollment flow
- [ ] Verify payment status logic (free courses only)

### **Week 3: Progress Tracking**
- [ ] Create `lib/services/progress/progress.service.ts` with trace logging
- [ ] Create `lib/services/progress/progress.repository.ts` with trace logging
- [ ] Create `/app/api/progress/lesson/complete/route.ts` (POST)
- [ ] Create `/app/api/progress/quiz/submit/route.ts` (POST)
- [ ] Create `/app/api/progress/[enrollmentId]/route.ts` (GET)
- [ ] Test lesson completion flow
- [ ] Test quiz submission flow
- [ ] Verify enrollment progress updates

### **Documentation**
- [ ] Update `PHASE_3_IMPLEMENTATION_PLAN.md` with implementation notes
- [ ] Update `ACTION_PLAN.md` with completed tasks
- [ ] Update `main.md` Recent Changes Log
- [ ] Create `COURSE_SYSTEM.md` (like FIREBASE_AUTH_SYSTEM.md)
- [ ] Update Firestore security rules in `firestore.rules`

---

## 🚀 Next Steps After Phase 3

### **Phase 4: Frontend Course UI**
- Course browsing page
- Course details page
- Lesson player (video/reading/quiz)
- Student dashboard with progress
- Teacher course management dashboard

### **Phase 5: Payment Integration (Future)**
When you're ready to add payments:
1. Create `PaymentService` (Stripe integration)
2. Update course creation UI to allow paid courses
3. Add checkout flow (Stripe Checkout or Payment Intents)
4. Update `EnrollmentService.enrollStudent()` to check payment
5. **Zero changes to Course/Progress services** ✅

---

## 🎯 Success Criteria

Phase 3 is complete when:
- ✅ All services implemented with trace logging
- ✅ All API routes working and tested
- ✅ Firestore security rules deployed
- ✅ Complete course creation → enrollment → progress flow working
- ✅ No regressions in authentication (Phase 2)
- ✅ Documentation updated
- ✅ Conflict-free parallel development verified

---

**Ready to begin?** Reply "start Phase 3" and I'll create the first service (CourseService).

**Need anything from you?**
- ✅ None - all prerequisites met (Firebase setup, trace system working)
- ⏳ You can test each service as I build them
- ⏳ Final user acceptance testing after Week 3

**Document Owner:** ZenType Architect (J)
**Status:** Ready to implement
**Next Action:** Create CourseService + CourseRepository
