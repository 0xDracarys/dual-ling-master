/**
 * Course Type Definitions
 * Phase 3: Course & Enrollment Services
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// COURSE TYPES
// ============================================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  language: 'en' | 'lt';
  targetLanguage: 'en' | 'lt';
  level: 'beginner' | 'intermediate' | 'advanced';

  // Teacher info
  teacherId: string;
  teacherName: string;

  // Content
  lessonsCount: number;
  estimatedHours: number;
  thumbnailUrl?: string;

  // Publishing
  isPublished: boolean;
  publishedAt?: Timestamp;

  // Payment (future-ready, all free for now)
  isPaid: boolean;
  price?: number;
  currency?: string;
  stripeProductId?: string;
  stripePriceId?: string;

  // Analytics
  enrollmentCount: number;
  averageRating?: number;
  reviewCount?: number;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  language: 'en' | 'lt';
  targetLanguage: 'en' | 'lt';
  level: 'beginner' | 'intermediate' | 'advanced';
  teacherId: string;
  teacherName: string;
  estimatedHours: number;
  thumbnailUrl?: string;
}

export interface UpdateCourseData {
  title?: string;
  description?: string;
  language?: 'en' | 'lt';
  targetLanguage?: 'en' | 'lt';
  level?: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours?: number;
  thumbnailUrl?: string;
}

export interface CourseFilters {
  language?: 'en' | 'lt';
  targetLanguage?: 'en' | 'lt';
  level?: 'beginner' | 'intermediate' | 'advanced';
  teacherId?: string;
  isPaid?: boolean;
}

// ============================================================================
// LESSON TYPES
// ============================================================================

export interface LessonResource {
  id: string;
  type: 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx' | 'xlsx' | 'txt';
  title: string;
  description?: string;
  fileUrl: string;           // Firebase Storage URL (gs://)
  fileName: string;          // Original file name
  fileSize: number;          // Size in bytes
  mimeType: string;          // MIME type
  uploadedAt: Timestamp;
  uploadedBy: string;        // Teacher UID
}

export interface Lesson {
  id: string;
  courseId: string;

  // Content
  title: string;
  description: string;
  order: number;
  type: 'video' | 'reading' | 'quiz' | 'exercise';

  // Media
  videoUrl?: string;
  videoThumbnail?: string;
  duration?: number;
  contentMarkdown?: string;

  // Quiz data
  quizQuestions?: QuizQuestion[];
  passingScore?: number;

  // Resources (NEW - PDF/Document support)
  resources?: LessonResource[];

  // Publishing
  isPublished: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateLessonData {
  title: string;
  description: string;
  order: number;
  type: 'video' | 'reading' | 'quiz' | 'exercise';
  videoUrl?: string;
  videoThumbnail?: string;
  duration?: number;
  contentMarkdown?: string;
  quizQuestions?: QuizQuestion[];
  passingScore?: number;
  resources?: LessonResource[];  // NEW - Optional resources
}

export interface UpdateLessonData {
  title?: string;
  description?: string;
  order?: number;
  type?: 'video' | 'reading' | 'quiz' | 'exercise';
  videoUrl?: string;
  videoThumbnail?: string;
  duration?: number;
  contentMarkdown?: string;
  quizQuestions?: QuizQuestion[];
  passingScore?: number;
  isPublished?: boolean;
  resources?: LessonResource[];  // NEW - Optional resources
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

// ============================================================================
// ENROLLMENT TYPES
// ============================================================================

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;

  // Denormalized data
  userName: string;
  userEmail: string;
  courseTitle: string;
  teacherName: string;

  // Status
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: Timestamp;
  completedAt?: Timestamp;

  // Payment (all free for testing)
  paymentStatus: 'free' | 'pending' | 'completed' | 'failed' | 'refunded';
  paymentIntentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  paidAt?: Timestamp;

  // Progress
  completedLessonsCount: number;
  totalLessonsCount: number;
  progressPercentage: number;
  lastAccessedAt: Timestamp;
  currentLessonId?: string;

  // Quiz scores
  quizScores: Record<string, number>;
  averageQuizScore: number;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateEnrollmentData {
  userId: string;
  courseId: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  teacherName: string;
  totalLessonsCount: number;
}

// ============================================================================
// PROGRESS TYPES
// ============================================================================

export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;

  // Status
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt?: Timestamp;

  // Engagement
  timeSpent: number;
  viewCount: number;
  lastViewedAt: Timestamp;

  // Quiz results
  quizAttempts?: QuizAttempt[];
  bestQuizScore?: number;

  // Video progress
  videoProgress?: number;
  videoCompleted?: boolean;

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CompleteLessonData {
  timeSpent?: number;
  videoProgress?: number;
}

export interface QuizResult {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  passed: boolean;
  bestScore: number;
}

// ============================================================================
// QUIZ TYPES (Phase 4: Quiz System)
// ============================================================================

export interface QuizAttempt {
  id?: string;
  userId: string;
  lessonId: string;
  courseId: string;
  attemptNumber: number;
  score: number;
  totalQuestions: number;
  scorePercentage: number;
  passed: boolean;
  timeSpent: number;
  results: QuizQuestionResult[];
  submittedAt: Timestamp;
}

export interface QuizQuestionResult {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  explanation?: string;
}
