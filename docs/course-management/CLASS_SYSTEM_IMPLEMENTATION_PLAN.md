# Class System Implementation Plan

**Date:** October 20, 2025  
**Status:** 📋 **READY TO IMPLEMENT**  
**Phase:** Phase 4 - Student Learning Experience & Class Management  
**Estimated Duration:** 2-3 weeks  
**Priority:** HIGH - Core learning experience

---

## 🎯 Executive Summary

After completing Phase 3 (Course & Enrollment Services at 65%), the next major milestone is implementing a comprehensive **Class System** for students. This includes:

1. **Virtual Classroom Environment** - Interactive lesson player with progress tracking
2. **Live Class Sessions** - Real-time teacher-student interaction (optional Phase 5)
3. **Student Progress Tracking UI** - Visual dashboards and completion tracking
4. **Quiz System** - Interactive quizzes with immediate feedback
5. **Assignment Submission** - Student work upload and teacher grading
6. **Communication Features** - Class announcements, Q&A, discussions

This plan follows the same architectural principles established in Phase 2 & 3:
- ✅ Service isolation (no merge conflicts)
- ✅ Firebase/Firestore native
- ✅ Trace logging integration
- ✅ Payment-ready architecture

---

## 📊 Current State Analysis

### ✅ What's Already Working (From Phase 3)
- Firebase Authentication (registration, login, tokens)
- Course Management (create, edit, delete, publish)
- Lesson Management (create, edit, delete)
- Enrollment System (enroll, unenroll, view enrollments)
- Student Dashboard (basic enrollment display)
- Teacher Dashboard (course overview)

### 🟡 What's Partially Implemented
- Progress Tracking (API routes exist, UI incomplete)
- Lesson Player (basic structure, needs enhancement)
- Quiz System (data model exists, no UI/submission logic)

### ❌ What's Missing (This Phase's Focus)
- Interactive lesson player (video, reading, quiz types)
- Quiz submission and grading system
- Assignment upload and teacher feedback
- Class-specific communication tools
- Progress visualization (charts, reports)
- Achievement/badge system
- Lesson completion flow

---

## 🏗️ Architecture Overview

### Service Structure (Additions to Phase 3)

```
lib/services/
├── auth/                          ✅ Phase 2 Complete
├── course/                        ✅ Phase 3 Complete
├── enrollment/                    ✅ Phase 3 Complete
├── progress/                      🟡 Phase 3 - 30% Complete (THIS PHASE COMPLETES IT)
│   ├── progress.service.ts        🔨 Enhance with quiz/assignment logic
│   └── progress.repository.ts     🔨 Add query methods
├── quiz/                          ❌ NEW - This Phase
│   ├── quiz.service.ts            🆕 Quiz submission, grading, attempts
│   └── quiz.repository.ts         🆕 Firestore CRUD for quiz attempts
├── assignment/                    ❌ NEW - This Phase
│   ├── assignment.service.ts      🆕 Submit, grade, feedback
│   └── assignment.repository.ts   🆕 Firestore CRUD + Cloud Storage
└── notification/                  ❌ NEW - Phase 5 (Optional)
    ├── notification.service.ts    🆕 Class announcements, messages
    └── notification.repository.ts 🆕 Real-time notifications
```

---

## 📦 Data Models (Firestore Schema)

### 1. Enhanced Progress Collection

**Collection:** `progress`  
**Document ID:** `{userId}_{lessonId}`

```typescript
interface Progress {
  // Existing fields (Phase 3)
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Timestamp;
  timeSpent: number;
  viewCount: number;
  lastViewedAt: Timestamp;
  
  // NEW: Enhanced tracking
  videoProgress?: {
    currentTime: number;        // Last watched position (seconds)
    duration: number;           // Total video duration
    watchedSegments: Array<{    // Track which parts were watched
      start: number;
      end: number;
    }>;
    completed: boolean;         // 90%+ watched = completed
  };
  
  readingProgress?: {
    scrollPosition: number;     // Last scroll position (px)
    estimatedReadTime: number;  // Seconds spent reading
    completed: boolean;         // Reached end + spent min time
  };
  
  // Quiz attempts (enhanced)
  quizAttempts?: QuizAttempt[];
  bestQuizScore?: number;
  
  // Assignment submission
  assignmentSubmission?: {
    submittedAt: Timestamp;
    fileUrl?: string;           // Cloud Storage URL
    fileName?: string;
    fileSize?: number;
    status: 'submitted' | 'graded' | 'returned';
    grade?: number;             // 0-100
    feedback?: string;
    gradedAt?: Timestamp;
    gradedBy?: string;          // Teacher UID
  };
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

### 2. Quiz Attempts Collection

**Collection:** `quizAttempts`  
**Document ID:** Auto-generated

```typescript
interface QuizAttempt {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  enrollmentId: string;         // For quick enrollment lookup
  
  // Attempt metadata
  attemptNumber: number;        // 1, 2, 3...
  startedAt: Timestamp;
  submittedAt: Timestamp;
  timeSpent: number;            // Seconds
  
  // Answers
  answers: Record<string, string>; // { questionId: userAnswer }
  
  // Grading
  score: number;                // 0-100 percentage
  correctAnswers: number;       // Count
  totalQuestions: number;       // Count
  passed: boolean;              // Score >= passingScore
  
  // Question-level results
  questionResults: Array<{
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    explanation?: string;       // Show after submission
  }>;
  
  // Metadata
  createdAt: Timestamp;
}
```

**Firestore Indexes Required:**
```javascript
// Index 1: User's quiz attempts for a course
{
  collection: 'quizAttempts',
  fields: [
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'courseId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'DESCENDING' }
  ]
}

// Index 2: Lesson-specific attempts
{
  collection: 'quizAttempts',
  fields: [
    { fieldPath: 'lessonId', order: 'ASCENDING' },
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'attemptNumber', order: 'ASCENDING' }
  ]
}
```

---

### 3. Assignments Collection (NEW)

**Collection:** `assignments`  
**Document ID:** Auto-generated

```typescript
interface Assignment {
  id: string;
  courseId: string;
  lessonId: string;
  
  // Assignment details
  title: string;
  description: string;
  instructions: string;         // Markdown supported
  
  // Requirements
  maxFileSize: number;          // Bytes (e.g., 10MB)
  allowedFileTypes: string[];   // ['pdf', 'docx', 'txt']
  maxAttempts: number;          // 0 = unlimited
  
  // Deadlines
  dueDate?: Timestamp;
  lateSubmissionAllowed: boolean;
  latePenalty?: number;         // Percentage reduction per day
  
  // Grading
  totalPoints: number;          // Default 100
  passingPoints: number;        // Default 70
  rubric?: Array<{
    criterion: string;
    description: string;
    points: number;
  }>;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;            // Teacher UID
}
```

---

### 4. Assignment Submissions Collection (NEW)

**Collection:** `assignmentSubmissions`  
**Document ID:** `{userId}_{assignmentId}_{attemptNumber}`

```typescript
interface AssignmentSubmission {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  assignmentId: string;
  enrollmentId: string;
  
  // Submission metadata
  attemptNumber: number;
  submittedAt: Timestamp;
  isLate: boolean;
  
  // File details
  fileUrl: string;              // Cloud Storage path
  fileName: string;
  fileSize: number;
  fileType: string;
  
  // Status
  status: 'submitted' | 'grading' | 'graded' | 'returned' | 'resubmission_requested';
  
  // Grading
  grade?: number;               // 0-totalPoints
  percentage?: number;          // 0-100
  passed?: boolean;
  feedback?: string;            // Teacher comments
  rubricScores?: Record<string, number>; // { criterionId: score }
  
  // Grading metadata
  gradedAt?: Timestamp;
  gradedBy?: string;            // Teacher UID
  gradedByName?: string;
  
  // Teacher actions
  needsRevision?: boolean;
  revisionNotes?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore Indexes Required:**
```javascript
// Index 1: Student's submissions for a course
{
  collection: 'assignmentSubmissions',
  fields: [
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'courseId', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'DESCENDING' }
  ]
}

// Index 2: Teacher grading queue
{
  collection: 'assignmentSubmissions',
  fields: [
    { fieldPath: 'courseId', order: 'ASCENDING' },
    { fieldPath: 'status', order: 'ASCENDING' },
    { fieldPath: 'submittedAt', order: 'ASCENDING' }
  ]
}
```

---

### 5. Class Announcements Collection (Phase 5 - Optional)

**Collection:** `announcements`  
**Document ID:** Auto-generated

```typescript
interface Announcement {
  id: string;
  courseId: string;
  teacherId: string;
  teacherName: string;
  
  // Content
  title: string;
  message: string;              // Markdown supported
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Targeting
  targetAudience: 'all' | 'specific_students';
  targetUserIds?: string[];     // If specific students
  
  // Status
  isPublished: boolean;
  publishedAt?: Timestamp;
  expiresAt?: Timestamp;        // Optional expiration
  
  // Engagement
  viewCount: number;
  viewedBy: string[];           // Array of user UIDs
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🔧 Service Implementation Plan

### Week 1: Complete Progress Tracking + Quiz System

#### Day 1-2: ProgressService Enhancement

**File:** `lib/services/progress/progress.service.ts`

**New/Enhanced Methods:**

```typescript
export class ProgressService {
  private progressRepo = new ProgressRepository();
  private enrollmentRepo = new EnrollmentRepository();
  private lessonRepo = new LessonRepository();

  /**
   * Update video progress (called every 5-10 seconds)
   */
  async updateVideoProgress(
    userId: string,
    lessonId: string,
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
      const progress = await this.progressRepo.getOrCreate(userId, lessonId);
      
      // Calculate if 90% watched
      const watchedPercentage = (currentTime / duration) * 100;
      const completed = watchedPercentage >= 90;

      await this.progressRepo.update(progress.id, {
        'videoProgress.currentTime': currentTime,
        'videoProgress.duration': duration,
        'videoProgress.completed': completed,
        status: completed ? 'completed' : 'in_progress',
        lastViewedAt: new Date(),
        updatedAt: new Date(),
      });

      // If just completed, update enrollment
      if (completed && progress.status !== 'completed') {
        await this.updateEnrollmentProgress(userId, lessonId);
      }

      traceLogger.log('success', 'Progress', 'Video progress updated', {
        lessonId,
        watchedPercentage,
        completed
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Video progress update failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Update reading progress (called on scroll)
   */
  async updateReadingProgress(
    userId: string,
    lessonId: string,
    scrollPosition: number,
    timeSpent: number
  ): Promise<void> {
    // Similar pattern to video progress
    // Mark completed when scrolled to bottom + spent minimum time (e.g., 30 seconds)
  }

  /**
   * Mark lesson complete (generic)
   */
  async markLessonComplete(
    userId: string,
    courseId: string,
    lessonId: string,
    timeSpent: number
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Progress', 'markLessonComplete', {
      userId,
      lessonId
    });

    try {
      // Get enrollment
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (!enrollment) {
        throw new Error('Not enrolled in this course');
      }

      // Update progress
      const progress = await this.progressRepo.getOrCreate(userId, lessonId, courseId);
      await this.progressRepo.update(progress.id, {
        status: 'completed',
        completedAt: new Date(),
        timeSpent: (progress.timeSpent || 0) + timeSpent,
        updatedAt: new Date(),
      });

      // Update enrollment
      await this.updateEnrollmentProgress(userId, courseId);

      traceLogger.log('success', 'Progress', 'Lesson marked complete', { lessonId });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Progress', 'Mark complete failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Private helper: Update enrollment progress based on completed lessons
   */
  private async updateEnrollmentProgress(
    userId: string,
    courseId: string
  ): Promise<void> {
    const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
    const completedLessons = await this.progressRepo.getCompletedCount(userId, courseId);
    
    const progressPercentage = (completedLessons / enrollment.totalLessonsCount) * 100;

    await this.enrollmentRepo.update(enrollment.id, {
      completedLessonsCount: completedLessons,
      progressPercentage: Math.round(progressPercentage * 100) / 100,
      lastAccessedAt: new Date(),
      updatedAt: new Date(),
    });

    // Check if course is now complete
    if (completedLessons === enrollment.totalLessonsCount) {
      await this.enrollmentRepo.update(enrollment.id, {
        status: 'completed',
        completedAt: new Date(),
      });
    }
  }
}
```

---

#### Day 3-4: QuizService Implementation

**File:** `lib/services/quiz/quiz.service.ts`

```typescript
export class QuizService {
  private quizAttemptRepo = new QuizAttemptRepository();
  private lessonRepo = new LessonRepository();
  private progressService = new ProgressService();
  private enrollmentRepo = new EnrollmentRepository();

  /**
   * Submit quiz answers and calculate score
   */
  async submitQuiz(
    userId: string,
    courseId: string,
    lessonId: string,
    answers: Record<string, string>,
    timeSpent: number
  ): Promise<QuizResult> {
    const spanId = traceLogger.startSpan('Quiz', 'submitQuiz', {
      userId,
      lessonId,
      answerCount: Object.keys(answers).length
    });

    try {
      // Get enrollment
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (!enrollment) {
        throw new Error('Not enrolled in this course');
      }

      // Get lesson with quiz questions
      const lesson = await this.lessonRepo.getById(courseId, lessonId);
      if (!lesson.quizQuestions || lesson.quizQuestions.length === 0) {
        throw new Error('This lesson does not have a quiz');
      }

      // Get attempt number
      const previousAttempts = await this.quizAttemptRepo.getUserAttempts(userId, lessonId);
      const attemptNumber = previousAttempts.length + 1;

      // Grade quiz
      const questionResults: QuestionResult[] = [];
      let correctAnswers = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      lesson.quizQuestions.forEach(question => {
        const userAnswer = answers[question.id] || '';
        const isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += question.points;
        }
        
        totalPoints += question.points;

        questionResults.push({
          questionId: question.id,
          userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          points: isCorrect ? question.points : 0,
          explanation: question.explanation,
        });
      });

      const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
      const passed = score >= (lesson.passingScore || 70);

      // Save quiz attempt
      const attempt: QuizAttempt = {
        id: '', // Will be set by repository
        userId,
        courseId,
        lessonId,
        enrollmentId: enrollment.id,
        attemptNumber,
        startedAt: new Date(Date.now() - (timeSpent * 1000)),
        submittedAt: new Date(),
        timeSpent,
        answers,
        score: Math.round(score * 100) / 100,
        correctAnswers,
        totalQuestions: lesson.quizQuestions.length,
        passed,
        questionResults,
        createdAt: new Date(),
      };

      const savedAttempt = await this.quizAttemptRepo.create(attempt);

      // Update progress
      const progress = await this.progressService.getOrCreateProgress(userId, lessonId, courseId);
      const allAttempts = await this.quizAttemptRepo.getUserAttempts(userId, lessonId);
      const bestScore = Math.max(...allAttempts.map(a => a.score));

      await this.progressService.updateProgress(progress.id, {
        quizAttempts: allAttempts.length,
        bestQuizScore: bestScore,
        status: passed ? 'completed' : 'in_progress',
        completedAt: passed ? new Date() : undefined,
        updatedAt: new Date(),
      });

      // Update enrollment quiz scores
      const enrollmentQuizScores = { ...enrollment.quizScores, [lessonId]: bestScore };
      const avgQuizScore = Object.values(enrollmentQuizScores).reduce((a, b) => a + b, 0) / Object.keys(enrollmentQuizScores).length;

      await this.enrollmentRepo.update(enrollment.id, {
        quizScores: enrollmentQuizScores,
        averageQuizScore: Math.round(avgQuizScore * 100) / 100,
        lastAccessedAt: new Date(),
      });

      // If passed, update enrollment progress
      if (passed && progress.status !== 'completed') {
        await this.progressService.markLessonComplete(userId, courseId, lessonId, timeSpent);
      }

      traceLogger.log('success', 'Quiz', 'Quiz submitted and graded', {
        score,
        passed,
        attemptNumber
      });
      traceLogger.endSpan(spanId, 'success');

      return {
        attemptId: savedAttempt.id,
        score,
        correctAnswers,
        totalQuestions: lesson.quizQuestions.length,
        passed,
        bestScore,
        attemptNumber,
        questionResults,
      };
    } catch (error: any) {
      traceLogger.log('error', 'Quiz', 'Quiz submission failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Get user's quiz attempts for a lesson
   */
  async getQuizAttempts(
    userId: string,
    lessonId: string
  ): Promise<QuizAttempt[]> {
    return this.quizAttemptRepo.getUserAttempts(userId, lessonId);
  }

  /**
   * Get specific quiz attempt details
   */
  async getQuizAttempt(attemptId: string): Promise<QuizAttempt> {
    return this.quizAttemptRepo.getById(attemptId);
  }
}
```

---

### Week 2: Assignment System + Lesson Player

#### Day 1-2: AssignmentService Implementation

**File:** `lib/services/assignment/assignment.service.ts`

```typescript
export class AssignmentService {
  private assignmentRepo = new AssignmentRepository();
  private submissionRepo = new AssignmentSubmissionRepository();
  private enrollmentRepo = new EnrollmentRepository();
  private progressService = new ProgressService();

  /**
   * Submit assignment (with file upload to Cloud Storage)
   */
  async submitAssignment(
    userId: string,
    courseId: string,
    lessonId: string,
    assignmentId: string,
    file: File
  ): Promise<AssignmentSubmission> {
    const spanId = traceLogger.startSpan('Assignment', 'submitAssignment', {
      userId,
      assignmentId,
      fileName: file.name,
      fileSize: file.size
    });

    try {
      // Get enrollment
      const enrollment = await this.enrollmentRepo.getByUserAndCourse(userId, courseId);
      if (!enrollment) {
        throw new Error('Not enrolled in this course');
      }

      // Get assignment details
      const assignment = await this.assignmentRepo.getById(assignmentId);
      
      // Validate file
      this.validateFile(file, assignment);

      // Check previous attempts
      const previousAttempts = await this.submissionRepo.getUserSubmissions(userId, assignmentId);
      if (assignment.maxAttempts > 0 && previousAttempts.length >= assignment.maxAttempts) {
        throw new Error(`Maximum attempts (${assignment.maxAttempts}) reached`);
      }

      const attemptNumber = previousAttempts.length + 1;

      // Upload file to Cloud Storage
      const fileUrl = await this.uploadFile(file, userId, assignmentId, attemptNumber);

      // Check if late
      const now = new Date();
      const isLate = assignment.dueDate ? now > assignment.dueDate.toDate() : false;

      // Create submission
      const submission: AssignmentSubmission = {
        id: `${userId}_${assignmentId}_${attemptNumber}`,
        userId,
        courseId,
        lessonId,
        assignmentId,
        enrollmentId: enrollment.id,
        attemptNumber,
        submittedAt: now,
        isLate,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        status: 'submitted',
        createdAt: now,
        updatedAt: now,
      };

      const savedSubmission = await this.submissionRepo.create(submission);

      // Update progress
      await this.progressService.updateAssignmentStatus(userId, lessonId, {
        submittedAt: now,
        status: 'submitted',
      });

      traceLogger.log('success', 'Assignment', 'Assignment submitted', {
        assignmentId,
        attemptNumber
      });
      traceLogger.endSpan(spanId, 'success');

      return savedSubmission;
    } catch (error: any) {
      traceLogger.log('error', 'Assignment', 'Assignment submission failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Grade assignment (teacher only)
   */
  async gradeAssignment(
    submissionId: string,
    teacherId: string,
    teacherName: string,
    grade: number,
    feedback: string,
    rubricScores?: Record<string, number>
  ): Promise<void> {
    const spanId = traceLogger.startSpan('Assignment', 'gradeAssignment', {
      submissionId,
      grade
    });

    try {
      const submission = await this.submissionRepo.getById(submissionId);
      const assignment = await this.assignmentRepo.getById(submission.assignmentId);

      // Validate teacher owns course
      const course = await this.courseRepo.getById(submission.courseId);
      if (course.teacherId !== teacherId) {
        throw new Error('Unauthorized: Only course owner can grade assignments');
      }

      // Calculate percentage and pass/fail
      const percentage = (grade / assignment.totalPoints) * 100;
      const passed = grade >= assignment.passingPoints;

      // Update submission
      await this.submissionRepo.update(submissionId, {
        grade,
        percentage: Math.round(percentage * 100) / 100,
        passed,
        feedback,
        rubricScores,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy: teacherId,
        gradedByName: teacherName,
        updatedAt: new Date(),
      });

      // Update progress
      await this.progressService.updateAssignmentStatus(submission.userId, submission.lessonId, {
        status: 'graded',
        grade: percentage,
      });

      // If passed, mark lesson complete
      if (passed) {
        await this.progressService.markLessonComplete(
          submission.userId,
          submission.courseId,
          submission.lessonId,
          0 // No time tracked for grading
        );
      }

      traceLogger.log('success', 'Assignment', 'Assignment graded', {
        submissionId,
        grade,
        passed
      });
      traceLogger.endSpan(spanId, 'success');
    } catch (error: any) {
      traceLogger.log('error', 'Assignment', 'Assignment grading failed', error);
      traceLogger.endSpan(spanId, 'error', { message: error.message });
      throw error;
    }
  }

  /**
   * Private helper: Upload file to Cloud Storage
   */
  private async uploadFile(
    file: File,
    userId: string,
    assignmentId: string,
    attemptNumber: number
  ): Promise<string> {
    // Implementation using Firebase Storage
    // Path: assignments/{assignmentId}/{userId}/attempt_{attemptNumber}_{filename}
    // Returns: Download URL
  }

  /**
   * Private helper: Validate file against assignment requirements
   */
  private validateFile(file: File, assignment: Assignment): void {
    // Check file size
    if (file.size > assignment.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed (${assignment.maxFileSize} bytes)`);
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!assignment.allowedFileTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} not allowed. Allowed: ${assignment.allowedFileTypes.join(', ')}`);
    }
  }
}
```

---

#### Day 3-4: Lesson Player Component

**File:** `app/course/[id]/lesson/[lessonId]/page.tsx`

This is a comprehensive React component that handles all lesson types.

```typescript
"use client"

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { VideoPlayer } from '@/components/lessons/video-player'
import { ReadingContent } from '@/components/lessons/reading-content'
import { QuizInterface } from '@/components/lessons/quiz-interface'
import { AssignmentSubmission } from '@/components/lessons/assignment-submission'
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react'

export default function LessonPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { token, user } = useAuth()
  
  const courseId = params.id as string
  const lessonId = params.lessonId as string
  
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const startTime = useRef(Date.now())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonRes, lessonsRes, progressRes] = await Promise.all([
          fetch(`/api/courses/${courseId}/lessons/${lessonId}`),
          fetch(`/api/courses/${courseId}/lessons`),
          fetch(`/api/progress/lesson/${lessonId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        if (lessonRes.ok && lessonsRes.ok) {
          const lessonData = await lessonRes.json()
          const lessonsData = await lessonsRes.json()
          setLesson(lessonData.lesson)
          setLessons(lessonsData.lessons)
          
          if (progressRes.ok) {
            const progressData = await progressRes.json()
            setProgress(progressData.progress)
          }
        }
      } catch (error) {
        console.error('Error fetching lesson:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchData()
    }
  }, [courseId, lessonId, token])

  const handleComplete = async () => {
    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000)
    
    try {
      await fetch('/api/progress/lesson/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courseId,
          lessonId,
          timeSpent
        })
      })
      
      // Navigate to next lesson or course page
      const currentIndex = lessons.findIndex(l => l.id === lessonId)
      if (currentIndex < lessons.length - 1) {
        router.push(`/course/${courseId}/lesson/${lessons[currentIndex + 1].id}`)
      } else {
        router.push(`/course/${courseId}`)
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error)
    }
  }

  if (isLoading || !lesson) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{lesson.title}</CardTitle>
              {lesson.description && (
                <p className="text-gray-600 mt-2">{lesson.description}</p>
              )}
            </CardHeader>
            <CardContent>
              {/* Render based on lesson type */}
              {lesson.type === 'video' && (
                <VideoPlayer
                  videoUrl={lesson.content.videoUrl}
                  lessonId={lessonId}
                  userId={user?.uid}
                  onProgressUpdate={(currentTime, duration) => {
                    // Update progress every 5 seconds
                    fetch('/api/progress/video/update', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        lessonId,
                        currentTime,
                        duration
                      })
                    })
                  }}
                />
              )}
              
              {lesson.type === 'reading' && (
                <ReadingContent
                  content={lesson.content.text}
                  onScrollUpdate={(scrollPosition) => {
                    // Update reading progress
                  }}
                />
              )}
              
              {lesson.type === 'quiz' && (
                <QuizInterface
                  questions={lesson.quizQuestions}
                  lessonId={lessonId}
                  courseId={courseId}
                  token={token}
                  onSubmit={handleComplete}
                />
              )}
              
              {lesson.type === 'exercise' && lesson.assignment && (
                <AssignmentSubmission
                  assignment={lesson.assignment}
                  lessonId={lessonId}
                  courseId={courseId}
                  token={token}
                  onSubmit={handleComplete}
                />
              )}
            </CardContent>
          </Card>
          
          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              onClick={() => {
                const currentIndex = lessons.findIndex(l => l.id === lessonId)
                if (currentIndex > 0) {
                  router.push(`/course/${courseId}/lesson/${lessons[currentIndex - 1].id}`)
                }
              }}
              disabled={lessons.findIndex(l => l.id === lessonId) === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous Lesson
            </Button>
            
            {progress?.status !== 'completed' && (
              <Button onClick={handleComplete}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Complete
              </Button>
            )}
            
            <Button
              onClick={() => {
                const currentIndex = lessons.findIndex(l => l.id === lessonId)
                if (currentIndex < lessons.length - 1) {
                  router.push(`/course/${courseId}/lesson/${lessons[currentIndex + 1].id}`)
                }
              }}
              disabled={lessons.findIndex(l => l.id === lessonId) === lessons.length - 1}
            >
              Next Lesson
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Sidebar - Lesson List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lessons.map((l, index) => (
                  <Button
                    key={l.id}
                    variant={l.id === lessonId ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => router.push(`/course/${courseId}/lesson/${l.id}`)}
                  >
                    <span className="mr-2">{index + 1}.</span>
                    {l.title}
                    {progress?.status === 'completed' && (
                      <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

---

### Week 3: Progress Visualization + Communication Features

#### Day 1-2: Progress Reports UI

**File:** `app/progress/[courseId]/page.tsx`

Visual dashboard showing:
- Course completion percentage (circular progress chart)
- Lesson-by-lesson checklist with completion status
- Quiz scores timeline (line chart)
- Time spent per lesson (bar chart)
- Achievement badges
- Certificate of completion (if course completed)

---

#### Day 3-4: Teacher Grading Interface

**File:** `app/teacher/assignments/page.tsx`

Features:
- List of pending assignments to grade
- Filter by course, student, submission date
- Assignment viewer with submitted file
- Grading form with rubric checkboxes
- Bulk grading actions
- Grade export (CSV)

---

## 📋 Implementation Checklist

### Week 1: Progress & Quiz
- [ ] Enhance `ProgressService` with video/reading tracking
- [ ] Create `progress.repository.ts` query methods
- [ ] Create `QuizService` with submission and grading logic
- [ ] Create `QuizRepository` for Firestore operations
- [ ] Create `/api/progress/video/update` endpoint
- [ ] Create `/api/progress/reading/update` endpoint
- [ ] Create `/api/quiz/submit` endpoint
- [ ] Create `/api/quiz/attempts/[lessonId]` endpoint
- [ ] Test quiz submission flow end-to-end
- [ ] Verify progress updates on enrollment

### Week 2: Assignments & Lesson Player
- [ ] Create `AssignmentService` with file upload logic
- [ ] Create `AssignmentRepository` for Firestore operations
- [ ] Implement Cloud Storage integration for file uploads
- [ ] Create `/api/assignment/submit` endpoint
- [ ] Create `/api/assignment/grade` endpoint (teacher)
- [ ] Create Lesson Player page component
- [ ] Create `VideoPlayer` component with progress tracking
- [ ] Create `ReadingContent` component
- [ ] Create `QuizInterface` component
- [ ] Create `AssignmentSubmission` component
- [ ] Test all lesson types in player

### Week 3: Visualization & Grading
- [ ] Create Progress Report page with charts
- [ ] Integrate Chart.js or Recharts for visualizations
- [ ] Create Teacher Grading Dashboard
- [ ] Create Assignment Grading Interface
- [ ] Create Rubric Grading Component
- [ ] Add file download functionality for submissions
- [ ] Create grade export (CSV) functionality
- [ ] Test teacher grading flow

### Documentation
- [ ] Update `MAIN.md` with Phase 4 status
- [ ] Create `CLASS_SYSTEM.md` comprehensive guide
- [ ] Update `PENDING_TASKS.md` with completed items
- [ ] Create `PROGRESS_TRACKING_SYSTEM.md`
- [ ] Create `QUIZ_SYSTEM.md`
- [ ] Create `ASSIGNMENT_SYSTEM.md`

---

## 🚀 API Routes Summary

### Progress Tracking APIs
- `POST /api/progress/video/update` - Update video watch position
- `POST /api/progress/reading/update` - Update reading scroll position
- `POST /api/progress/lesson/complete` - Mark lesson complete
- `GET /api/progress/course/[courseId]` - Get all progress for a course

### Quiz APIs
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/quiz/attempts/[lessonId]` - Get user's quiz attempts
- `GET /api/quiz/attempt/[attemptId]` - Get specific attempt details

### Assignment APIs
- `POST /api/assignment/submit` - Submit assignment file
- `POST /api/assignment/grade` - Grade assignment (teacher)
- `GET /api/assignment/submissions/[assignmentId]` - Get all submissions (teacher)
- `GET /api/assignment/submission/[submissionId]` - Get specific submission
- `GET /api/assignment/file/[submissionId]` - Download submitted file

---

## 🔐 Security Considerations

### File Upload Security
1. **File Size Limits:** Enforce max file size (10MB default)
2. **File Type Validation:** Only allow whitelisted extensions
3. **Virus Scanning:** Consider integrating Cloud Storage virus scanning
4. **Access Control:** Only student who submitted can view their files
5. **Teacher Verification:** Only course owner can grade assignments

### Quiz Security
1. **No Answer Exposure:** Never send correct answers to frontend before submission
2. **Time Limits:** Optional time limits per quiz
3. **Attempt Limits:** Configurable max attempts per quiz
4. **Randomization:** Consider randomizing question order (Phase 5)

### Progress Tracking Security
1. **Token Verification:** All progress updates require valid Firebase token
2. **Enrollment Check:** Verify user is enrolled before tracking progress
3. **Rate Limiting:** Prevent abuse of progress update endpoints

---

## 📊 Success Metrics

Phase 4 is complete when:
- ✅ All lesson types (video, reading, quiz, assignment) fully functional
- ✅ Students can complete lessons and see progress
- ✅ Teachers can grade assignments and provide feedback
- ✅ Progress visualization shows real-time data
- ✅ Quiz submissions calculate scores correctly
- ✅ Assignment files upload to Cloud Storage
- ✅ No regressions in Phase 2/3 features
- ✅ All trace logging working
- ✅ Documentation complete

---

## 🔗 Related Documents

### Read Before Starting
- `WHATS_NEXT_AFTER_IAM_FIX.md` - Current status and priorities
- `PHASE_3_IMPLEMENTATION_PLAN.md` - Architecture patterns to follow
- `LESSON_MANAGEMENT_SYSTEM.md` - Existing lesson structure

### Update After Completion
- `MAIN.md` - Add Phase 4 to Recent Changes Log
- `PENDING_TASKS.md` - Mark completed items
- `PROJECT_STATUS_OCT_17_2025.md` - Update progress percentage

---

## 💡 Future Enhancements (Phase 5+)

### Live Classes (Real-Time)
- Video conferencing integration (Agora, Zoom SDK)
- Live chat during class
- Screen sharing
- Breakout rooms
- Recording and playback

### Gamification
- XP points system
- Leaderboards
- Achievement badges
- Streak tracking
- Daily challenges

### Social Features
- Class discussions/forums
- Peer review of assignments
- Study groups
- Direct messaging
- Collaborative learning

### Analytics
- Learning analytics dashboard
- Predictive analytics (at-risk students)
- Engagement heatmaps
- A/B testing for content

---

**Status:** 📋 **READY TO IMPLEMENT**  
**Priority:** HIGH - Core learning experience  
**Blockers:** None - Prerequisites complete (Phase 3 at 65%)  
**Next Action:** Begin Week 1 - ProgressService enhancement

---

**Prepared By:** ZenType Architect (J)  
**Date:** October 20, 2025  
**Based On:** WHATS_NEXT_AFTER_IAM_FIX.md, PHASE_3_IMPLEMENTATION_PLAN.md, PRD.md
