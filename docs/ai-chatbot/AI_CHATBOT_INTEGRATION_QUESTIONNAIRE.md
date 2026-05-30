# AI Chatbot Integration - Implementation Questionnaire

**Date:** October 21, 2025  
**Status:** ✅ COMPLETE - Ready for Integration Planning  
**Purpose:** Detailed application architecture documentation for Firebase AI Logic & Gemini API integration

---

## 📋 Application Overview

**Project Name:** DualLing (Lithuanian-English Language Learning Platform)  
**Current Status:** 65% migrated from MongoDB to Firebase/Firestore  
**Production URL:** https://ltus-acadamy--paji-duolingo.europe-west4.hosted.app  
**Repository:** github.com/mantassteckis/dual-ling

---

## 🎯 Questionnaire Responses

### **Question 1: Primary Technology Stack (Frontend)**

**Answer:** **React 18 with Next.js 14 (App Router)**

**Detailed Breakdown:**
- **Framework:** Next.js 14.x (using App Router, not Pages Router)
- **UI Library:** React 19.2.0
- **Language:** TypeScript 5.9.3
- **Styling:** 
  - TailwindCSS 3.4.18
  - shadcn/ui components (Radix UI primitives)
  - Custom component library in `/components/ui/`
- **State Management:** 
  - React hooks (useState, useEffect, useContext)
  - Custom authentication hook: `/hooks/use-auth.ts`
- **Routing:** Next.js App Router (file-based routing in `/app/` directory)
- **Form Handling:** react-hook-form 7.65.0 + zod validation

**Frontend File Structure:**
```
app/
├── page.tsx                    # Homepage
├── layout.tsx                  # Root layout with auth provider
├── globals.css                 # TailwindCSS styles
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
├── courses/page.tsx            # Course listing
├── course/
│   ├── [id]/page.tsx          # Course detail page
│   └── [id]/lesson/[lessonId]/page.tsx  # Lesson player
├── dashboard/page.tsx          # Student dashboard
└── teacher/
    ├── dashboard/page.tsx
    ├── course/
    │   ├── create/page.tsx
    │   └── edit/[id]/page.tsx

components/
├── ui/                         # shadcn/ui components
├── navigation/                 # Navbar, footer
├── lessons/                    # Lesson viewer, quiz components
└── teacher/                    # Teacher-specific components
```

**Key Frontend Dependencies:**
- `firebase` (10.14.1) - Firebase JS SDK for authentication & Firestore
- `lucide-react` - Icon library
- `recharts` - Data visualization for progress tracking
- `sonner` - Toast notifications
- `next-themes` - Theme management

---

### **Question 2: Backend Implementation**

**Answer:** **Hybrid - Next.js API Routes + Firebase Cloud Functions (planned)**

**Current Implementation (Active):**
- **Primary Backend:** Next.js API Routes (App Router)
  - Runtime: Node.js (serverless on Firebase App Hosting)
  - Location: `/app/api/` directory
  - Deployment: Firebase App Hosting (Cloud Run under the hood)
  
**Backend Structure:**
```
app/api/
├── auth/
│   ├── login/route.ts          # POST - User login
│   └── register/route.ts       # POST - User registration
├── courses/
│   ├── route.ts                # GET (all), POST (create)
│   └── [id]/
│       ├── route.ts            # GET, PUT, DELETE
│       ├── enroll/route.ts     # POST - Enroll in course
│       ├── publish/route.ts    # POST - Publish course
│       └── lessons/
│           ├── route.ts        # GET (all), POST (create)
│           └── [lessonId]/route.ts  # GET, PUT, DELETE
├── students/
│   ├── enrolled-courses/route.ts    # GET - User enrollments
│   └── progress/route.ts            # POST - Update progress
├── progress/
│   ├── reading/update/route.ts      # POST - Reading progress
│   └── video/update/route.ts        # POST - Video progress
├── quiz/
│   ├── submit/route.ts              # POST - Submit quiz
│   └── attempts/[lessonId]/route.ts # GET - Quiz attempts
├── teacher/
│   ├── courses/route.ts             # GET - Teacher's courses
│   └── recent-activity/route.ts     # GET - Recent enrollments
└── admin/
    ├── stats/route.ts               # GET - Admin statistics
    └── users/route.ts               # GET, PUT, DELETE users
```

**Backend Architecture Pattern:**
- **Service Layer Pattern:** 
  ```
  lib/services/
  ├── auth/
  │   ├── user.repository.ts    # Firestore CRUD operations
  │   └── auth.service.ts       # Business logic
  ├── course/
  │   ├── course.repository.ts
  │   ├── lesson.repository.ts
  │   └── course.service.ts
  ├── enrollment/
  │   ├── enrollment.repository.ts
  │   └── enrollment.service.ts
  └── progress/
      ├── progress.repository.ts
      └── progress.service.ts
  ```

**Authentication & Authorization:**
- **Firebase Admin SDK** for token verification
- JWT tokens issued by Firebase Authentication
- Custom middleware for role-based access control (RBAC)
- Role claims stored in Firebase Auth custom claims: `student`, `teacher`, `admin`

**Example API Route Structure:**
```typescript
// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { CourseService } from '@/lib/services/course/course.service';

export const dynamic = 'force-dynamic'; // Force dynamic rendering

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    
    const courseService = new CourseService();
    const courses = await courseService.getAllCourses();
    
    return NextResponse.json({ success: true, courses });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Planned Cloud Functions (Future Phase 4+):**
- Background job: `sendEnrollmentEmail` (email notifications)
- Scheduled task: `aggregateCourseStats` (daily statistics)
- File processing: `processVideoUpload` (video transcoding)

---

### **Question 3: Course Content Storage**

**Answer:** **Cloud Firestore + Firebase Storage**

**Database: Cloud Firestore**

**Collections Structure:**
```
firestore/
├── users/
│   └── {userId}/                    # Document per user
│       ├── enrollments/             # Subcollection
│       ├── progress/                # Subcollection
│       └── quizAttempts/            # Subcollection
├── courses/
│   └── {courseId}/                  # Document per course
│       └── lessons/                 # Subcollection
│           └── {lessonId}/
│               ├── (lesson data)
│               └── quizQuestions[]  # Array field
└── enrollments/                     # Top-level for cross-user queries
    └── {enrollmentId}/
```

**Course Document Schema:**
```typescript
// firestore: courses/{courseId}
{
  title: string,
  description: string,
  teacherId: string,                // Firebase UID
  teacherName: string,              // Denormalized
  language: 'Lithuanian' | 'English',
  level: 'beginner' | 'intermediate' | 'advanced',
  thumbnail: string,                // Firebase Storage URL
  price: number,
  currency: string,
  isPublished: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  enrollmentCount: number,
  averageRating: number,
  lessonsCount: number,             // Denormalized
  tags: string[]
}
```

**Lesson Document Schema:**
```typescript
// firestore: courses/{courseId}/lessons/{lessonId}
{
  title: string,
  description: string,
  type: 'reading' | 'video' | 'quiz' | 'exercise',
  order: number,
  duration: number,                 // minutes
  isPublished: boolean,
  createdAt: Timestamp,
  
  // Type-specific content
  content: {
    text?: string,                  // Markdown for reading lessons
    videoUrl?: string,              // Firebase Storage URL
    duration?: number
  },
  
  // Quiz questions (if type === 'quiz')
  quizQuestions?: [
    {
      id: string,
      question: string,
      type: 'multiple-choice',
      options: string[],
      correctAnswer: string,        // Index as string
      explanation: string,
      points: number
    }
  ]
}
```

**File Storage: Firebase Storage**

**Bucket Structure:**
```
gs://paji-duolingo.firebasestorage.app/
├── users/
│   └── {userId}/
│       └── profile.jpg
├── courses/
│   └── {courseId}/
│       ├── thumbnail.jpg
│       └── lessons/
│           └── {lessonId}/
│               ├── video.mp4
│               └── resources/
│                   └── document.pdf
```

**Storage Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /courses/{courseId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'teacher';
    }
  }
}
```

**Current Storage Usage:**
- Course thumbnails: ~50-200KB per image (WebP format)
- Lesson videos: 10-100MB per video (MP4 format)
- PDF resources: 1-5MB per document
- Total storage: <1GB currently

---

### **Question 4: Database Relationships Management**

**Answer:** **Document References + Denormalization Strategy**

**Relationship Patterns:**

#### **1. Teacher → Courses (One-to-Many)**
```typescript
// Course document stores teacherId
{
  courseId: "abc123",
  teacherId: "firebase_uid_xyz",
  teacherName: "John Doe",           // Denormalized for fast reads
  title: "Spanish 101"
}

// Query: Get all courses by a teacher
const teacherCourses = await db.collection('courses')
  .where('teacherId', '==', userId)
  .where('isPublished', '==', true)
  .get();
```

#### **2. Course → Lessons (One-to-Many via Subcollection)**
```typescript
// Lessons stored as subcollection
Path: courses/{courseId}/lessons/{lessonId}

// Query: Get all lessons for a course
const lessons = await db.collection('courses')
  .doc(courseId)
  .collection('lessons')
  .orderBy('order', 'asc')
  .get();

// Benefits:
// - Automatic cleanup (delete course = delete lessons)
// - Better data locality
// - Efficient pagination
```

#### **3. Student → Enrollments (One-to-Many)**
```typescript
// Dual structure for efficient queries

// Option A: Top-level collection
enrollments/{enrollmentId}
{
  userId: "student_uid",
  courseId: "course_id",
  courseName: "Spanish 101",         // Denormalized
  enrolledAt: Timestamp,
  status: "active",
  progress: 45,                      // Percentage
  lastAccessedAt: Timestamp
}

// Query 1: All enrollments for a student
await db.collection('enrollments')
  .where('userId', '==', studentId)
  .where('status', '==', 'active')
  .get();

// Query 2: All students enrolled in a course
await db.collection('enrollments')
  .where('courseId', '==', courseId)
  .get();

// Composite indexes required:
// - (userId, status)
// - (courseId, status)
```

#### **4. Student → Progress (One-to-Many via Subcollection)**
```typescript
// Nested under user document
users/{userId}/progress/{progressId}
{
  courseId: "course_id",
  lessonId: "lesson_id",
  lessonTitle: "Lesson 1",           // Denormalized
  completed: true,
  score: 85,
  timeSpent: 25,                     // minutes
  lastAttemptAt: Timestamp,
  attempts: 2
}

// Query: Get all progress for a student in a course
await db.collection('users')
  .doc(userId)
  .collection('progress')
  .where('courseId', '==', courseId)
  .get();
```

**Denormalization Strategy:**

We denormalize frequently-accessed fields to reduce read operations:

| Denormalized Field | Primary Location | Copied To | Update Trigger |
|-------------------|------------------|-----------|----------------|
| `teacherName` | `users/{userId}` | `courses/{courseId}` | User profile update |
| `courseName` | `courses/{courseId}` | `enrollments/{id}` | Course update |
| `lessonTitle` | `lessons/{id}` | `progress/{id}` | Lesson update |
| `enrollmentCount` | Calculated | `courses/{courseId}` | New enrollment |

**Reference Pattern:**
```typescript
// Using DocumentReference for joins
interface Course {
  courseId: string;
  teacherId: string;
  teacherRef: DocumentReference;    // Direct reference
}

// Fetching teacher data
const course = await db.collection('courses').doc(courseId).get();
const teacher = await course.data().teacherRef.get();
```

---

### **Question 5: Course Creation/Modification API**

**Answer:** **RESTful API via Next.js API Routes**

**API Type:** REST-based with JSON payloads  
**Authentication:** Firebase JWT Bearer tokens  
**Authorization:** Custom claims (role-based)

**Course Management Endpoints:**

#### **1. Create Course**
```typescript
POST /api/courses
Authorization: Bearer <firebase_jwt_token>

Request Body:
{
  "title": "Spanish for Beginners",
  "description": "Learn Spanish from scratch",
  "language": "Spanish",
  "level": "beginner",
  "price": 49.99,
  "currency": "USD",
  "tags": ["spanish", "beginner", "conversation"]
}

Response (201 Created):
{
  "success": true,
  "courseId": "abc123xyz",
  "message": "Course created successfully"
}

Required Role: teacher | admin
```

#### **2. Update Course**
```typescript
PUT /api/courses/{courseId}
Authorization: Bearer <firebase_jwt_token>

Request Body:
{
  "title": "Spanish for Beginners - Updated",
  "description": "New description",
  "isPublished": false
}

Response (200 OK):
{
  "success": true,
  "message": "Course updated successfully"
}

Authorization Check:
- Must be course owner (teacherId === userId) OR admin
```

#### **3. Delete Course**
```typescript
DELETE /api/courses/{courseId}
Authorization: Bearer <firebase_jwt_token>

Response (200 OK):
{
  "success": true,
  "message": "Course deleted successfully"
}

Authorization Check:
- Must be course owner OR admin
- Cascade deletes all lessons (via Firestore subcollection cleanup)
```

#### **4. Publish Course**
```typescript
POST /api/courses/{courseId}/publish
Authorization: Bearer <firebase_jwt_token>

Response (200 OK):
{
  "success": true,
  "message": "Course published successfully"
}

Validation:
- Course must have at least 1 published lesson
- All required fields must be filled
```

**Lesson Management Endpoints:**

#### **5. Create Lesson**
```typescript
POST /api/courses/{courseId}/lessons
Authorization: Bearer <firebase_jwt_token>

Request Body:
{
  "title": "Lesson 1: Greetings",
  "description": "Learn basic greetings",
  "type": "video",
  "order": 1,
  "duration": 15,
  "content": {
    "videoUrl": "https://storage.googleapis.com/...",
    "duration": 15
  }
}

Response (201 Created):
{
  "success": true,
  "lessonId": "lesson_xyz",
  "message": "Lesson created successfully"
}
```

#### **6. Create Quiz Lesson**
```typescript
POST /api/courses/{courseId}/lessons
Authorization: Bearer <firebase_jwt_token>

Request Body:
{
  "title": "Quiz: Spanish Greetings",
  "type": "quiz",
  "order": 2,
  "quizQuestions": [
    {
      "id": "q1",
      "question": "What is 'Hello' in Spanish?",
      "type": "multiple-choice",
      "options": ["Hola", "Adiós", "Gracias", "Buenos días"],
      "correctAnswer": "0",
      "explanation": "Hola means Hello",
      "points": 10
    }
  ]
}

Response (201 Created):
{
  "success": true,
  "lessonId": "quiz_abc",
  "message": "Quiz lesson created successfully"
}
```

**Authentication Mechanism:**

```typescript
// Client-side: Attach token to requests
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const token = await auth.currentUser?.getIdToken();

const response = await fetch('/api/courses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(courseData)
});
```

```typescript
// Server-side: Verify token
import { verifyIdToken } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.split('Bearer ')[1];
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const decodedToken = await verifyIdToken(token);
  const userId = decodedToken.uid;
  const userRole = decodedToken.role; // Custom claim
  
  if (userRole !== 'teacher' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Proceed with course creation...
}
```

**API Documentation Format:**

All endpoints follow this pattern:
- **Authentication:** Required for all write operations
- **Authorization:** Role-based (student, teacher, admin)
- **Validation:** Zod schemas for request body validation
- **Error Handling:** Standardized error responses
- **Rate Limiting:** Not yet implemented (planned with Cloud Armor)

---

### **Question 6: File Upload Handling**

**Answer:** **Firebase Storage with Signed URLs**

**Current Implementation:**

#### **Upload Flow:**
```
1. Frontend requests signed upload URL from backend
2. Backend generates signed URL via Firebase Admin SDK
3. Frontend uploads file directly to Firebase Storage
4. Frontend notifies backend of successful upload
5. Backend updates Firestore with storage URL
```

**Implementation Example:**

```typescript
// Step 1: Frontend - Request upload URL
async function uploadFile(file: File, path: string) {
  // Get signed URL from backend
  const response = await fetch('/api/upload/signed-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type,
      path: path // e.g., 'courses/abc123/thumbnail'
    })
  });
  
  const { uploadUrl } = await response.json();
  
  // Step 2: Upload directly to Storage
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  
  return uploadUrl.split('?')[0]; // Return public URL
}
```

```typescript
// Backend - Generate signed URL
import { getStorage } from 'firebase-admin/storage';

export async function POST(req: NextRequest) {
  const { fileName, fileType, path } = await req.json();
  
  const bucket = getStorage().bucket();
  const file = bucket.file(`${path}/${fileName}`);
  
  const [signedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: fileType
  });
  
  return NextResponse.json({ uploadUrl: signedUrl });
}
```

**File Types Handled:**

| File Type | Location | Max Size | Format |
|-----------|----------|----------|--------|
| Course Thumbnails | `courses/{id}/thumbnail.jpg` | 2MB | JPEG, PNG, WebP |
| Lesson Videos | `courses/{id}/lessons/{lessonId}/video.mp4` | 100MB | MP4, WebM |
| PDF Resources | `courses/{id}/lessons/{lessonId}/resources/*.pdf` | 10MB | PDF |
| Profile Pictures | `users/{userId}/profile.jpg` | 1MB | JPEG, PNG |

**Security Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Teachers can upload course content
    match /courses/{courseId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'teacher'
                   && request.resource.size < 100 * 1024 * 1024; // 100MB
    }
    
    // Users can upload their own profile pictures
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 1 * 1024 * 1024; // 1MB
    }
  }
}
```

**Optimizations:**
- **Client-side compression:** Images compressed before upload
- **Progressive upload:** Large videos support resumable uploads
- **CDN delivery:** Firebase Storage automatically uses Cloud CDN
- **Lazy loading:** Videos load only when lesson is accessed

---

### **Question 7: User Authentication & Authorization**

**Answer:** **Firebase Authentication + Custom Claims RBAC**

**Authentication System:**

#### **Provider:** Firebase Authentication
- **Primary Method:** Email/Password
- **Planned:** Google Sign-In, GitHub OAuth (Phase 5)
- **Session Management:** JWT tokens (1 hour expiry, auto-refresh)

**User Registration Flow:**
```typescript
// Client-side: Create user
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await createUserWithEmailAndPassword(
  auth,
  email,
  password
);

// Backend API: Set custom claims
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePass123",
  "name": "John Doe",
  "role": "student" // or "teacher"
}

// Server-side: Set custom claims
import { getAuth } from 'firebase-admin/auth';

const user = await getAuth().createUser({
  email,
  password,
  displayName: name
});

await getAuth().setCustomUserClaims(user.uid, {
  role: role, // 'student', 'teacher', 'admin'
  createdAt: Date.now()
});

// Create Firestore user document
await db.collection('users').doc(user.uid).set({
  email,
  name,
  role,
  createdAt: admin.firestore.FieldValue.serverTimestamp()
});
```

**Authentication Hook:**
```typescript
// hooks/use-auth.ts
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken();
        const idTokenResult = await firebaseUser.getIdTokenResult();
        
        setUser(firebaseUser);
        setToken(idToken);
        setRole(idTokenResult.claims.role);
      } else {
        setUser(null);
        setToken(null);
        setRole(null);
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  return { user, token, role, loading };
}
```

**Authorization Levels:**

| Role | Permissions | Example Users |
|------|-------------|---------------|
| `student` | - Enroll in courses<br>- View enrolled content<br>- Submit quizzes<br>- Track progress | Learners |
| `teacher` | - Create/edit/delete own courses<br>- Create lessons<br>- View enrollment analytics<br>- Grade assignments | Instructors |
| `admin` | - All teacher permissions<br>- Manage all courses<br>- Manage users<br>- View system analytics | Site administrators |

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function hasRole(role) {
      return isSignedIn() && request.auth.token.role == role;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId) || hasRole('admin');
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read: if resource.data.isPublished == true 
                  || isOwner(resource.data.teacherId)
                  || hasRole('admin');
      allow create: if hasRole('teacher') || hasRole('admin');
      allow update, delete: if isOwner(resource.data.teacherId) 
                             || hasRole('admin');
    }
    
    // Enrollments collection
    match /enrollments/{enrollmentId} {
      allow read: if isOwner(resource.data.userId) 
                  || hasRole('teacher') 
                  || hasRole('admin');
      allow create: if isSignedIn() 
                    && request.resource.data.userId == request.auth.uid;
      allow update, delete: if isOwner(resource.data.userId) 
                             || hasRole('admin');
    }
  }
}
```

**Token Refresh Mechanism:**
```typescript
// Automatic token refresh every 55 minutes
useEffect(() => {
  if (!user) return;
  
  const refreshInterval = setInterval(async () => {
    const newToken = await user.getIdToken(true); // Force refresh
    setToken(newToken);
  }, 55 * 60 * 1000); // 55 minutes
  
  return () => clearInterval(refreshInterval);
}, [user]);
```

---

### **Question 8: Google Cloud Platform Services**

**Answer:** **Yes - Multiple GCP Services in Use**

**Currently Active Services:**

| Service | Purpose | Usage |
|---------|---------|-------|
| **Cloud Firestore** | Primary database | Stores all application data |
| **Firebase Authentication** | User auth & identity | Manages user accounts & sessions |
| **Firebase Storage / Cloud Storage** | File storage | Course images, videos, PDFs |
| **Firebase App Hosting** | Frontend hosting | Next.js app deployed on Cloud Run |
| **Cloud Logging** | Structured logging | Application logs with trace correlation |
| **Cloud Trace** (Phase 1) | Distributed tracing | Request tracing & performance monitoring |
| **Cloud Monitoring** | Metrics & alerts | Resource usage, error rates |
| **Secret Manager** | Sensitive config | API keys, credentials (planned) |

**Planned Services (Phase 4+):**

| Service | Planned Use | Timeline |
|---------|-------------|----------|
| **Cloud Functions (2nd Gen)** | Background tasks | Phase 4 |
| **Cloud Pub/Sub** | Event-driven messaging | Phase 5 |
| **Cloud Tasks** | Async job queue | Phase 5 |
| **Cloud Scheduler** | Cron jobs | Phase 4 |
| **Cloud CDN** | Global content delivery | Phase 5 |
| **Cloud Armor** | DDoS protection, WAF | Phase 6 |
| **Firebase Analytics** | User behavior tracking | Phase 5 |
| **Cloud Translation API** | Auto-translate content | Phase 6 |

**GCP Project Configuration:**
```yaml
Project ID: paji-duolingo
Project Number: 189726325845
Region: europe-west4
Billing: €250 Google Cloud credit (3 months)
```

**Service Integration Architecture:**
```
┌─────────────────────────────────────────────────────┐
│           Firebase App Hosting (Cloud Run)          │
│              Next.js 14 Application                 │
└─────────────┬───────────────────────────────────────┘
              │
              ├─────────────────────────────────────┐
              │                                     │
              ▼                                     ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│   Cloud Firestore       │       │  Firebase Storage       │
│   (Database)            │       │  (Media Files)          │
└─────────────────────────┘       └─────────────────────────┘
              │                                     │
              ▼                                     ▼
┌─────────────────────────────────────────────────────────┐
│              Cloud Logging + Cloud Trace                │
│            (Observability & Monitoring)                 │
└─────────────────────────────────────────────────────────┘
```

**Current Integration Example:**
```typescript
// lib/tracing/logger.ts
import { Logging } from '@google-cloud/logging';

const logging = new Logging({
  projectId: process.env.GOOGLE_CLOUD_PROJECT
});

export function logWithTrace(message: string, traceId: string) {
  const log = logging.log('application-logs');
  const metadata = {
    resource: { type: 'cloud_run_revision' },
    trace: `projects/paji-duolingo/traces/${traceId}`,
    severity: 'INFO'
  };
  
  const entry = log.entry(metadata, { message });
  log.write(entry);
}
```

---

### **Question 9: Expected Usage Volume**

**Answer:** **Small-to-Medium Scale (Current), High-Growth Potential**

**Current Metrics (October 2025):**

| Metric | Current Volume | Notes |
|--------|---------------|-------|
| **Total Users** | ~50 | Early stage (migration phase) |
| **Active Courses** | 6 | Fully functional courses |
| **Total Lessons** | ~15 | Mix of video, reading, quiz |
| **Daily Active Users (DAU)** | 5-10 | Testing & early adoption |
| **Monthly Active Users (MAU)** | ~30 | |

**Expected Growth (6-12 months):**

| Metric | 6 Months | 12 Months |
|--------|----------|-----------|
| **Total Users** | 500-1,000 | 5,000-10,000 |
| **Active Courses** | 25-50 | 100-200 |
| **DAU** | 50-100 | 500-1,000 |
| **MAU** | 200-400 | 2,000-4,000 |

**Chatbot Usage Estimates:**

#### **Teacher Chatbot (Course Creation Assistant):**
- **Target Users:** Teachers only (~10-20% of total users)
- **Usage Frequency:** 
  - Active course creation phase: 5-10 interactions per course
  - Average course creation: 2-4 hours (with chatbot assistance)
  - Estimated requests: 50-100 per day (during peak)
- **Peak Times:** Evenings & weekends (teacher availability)
- **Request Types:**
  - Course structure planning
  - Lesson content generation
  - Quiz question creation
  - Learning objective optimization

#### **Student Chatbot (Learning Assistant):**
- **Target Users:** All students (~80% of total users)
- **Usage Frequency:**
  - Casual learners: 5-10 queries per session
  - Active learners: 20-50 queries per session
  - Average session: 30-45 minutes
  - Estimated requests: 200-500 per day (current), 2,000-5,000 (6 months)
- **Peak Times:** 
  - Weekday evenings: 6pm-10pm (local time)
  - Weekends: 10am-4pm
- **Request Types:**
  - Grammar explanations
  - Vocabulary lookup
  - Translation help
  - Cultural context questions
  - Pronunciation guidance

**API Request Volumes:**

| API Endpoint | Current (Daily) | 6 Months | 12 Months |
|--------------|----------------|----------|-----------|
| `/api/courses` | 50-100 | 500-1,000 | 5,000-10,000 |
| `/api/lessons` | 30-50 | 300-500 | 3,000-5,000 |
| `/api/quiz/submit` | 10-20 | 100-200 | 1,000-2,000 |
| `/api/progress` | 20-40 | 200-400 | 2,000-4,000 |
| **Total API Calls** | ~200 | ~2,000 | ~20,000 |

**Firestore Operations:**

| Operation | Current (Daily) | 6 Months | 12 Months |
|-----------|----------------|----------|-----------|
| Document Reads | 1,000-2,000 | 10,000-20,000 | 100,000-200,000 |
| Document Writes | 100-200 | 1,000-2,000 | 10,000-20,000 |
| Storage Downloads | 50-100 | 500-1,000 | 5,000-10,000 |

**Chatbot-Specific Volume Estimates:**

```yaml
Teacher Chatbot:
  Daily Requests (Current): 10-20
  Daily Requests (6 months): 100-200
  Daily Requests (12 months): 500-1,000
  Average Tokens per Request: 500-1,000
  Context Window: Last 5-10 conversation turns

Student Chatbot:
  Daily Requests (Current): 50-100
  Daily Requests (6 months): 500-1,000
  Daily Requests (12 months): 5,000-10,000
  Average Tokens per Request: 200-500
  Context Window: Current lesson + last 3 turns
```

**Cost Implications (Gemini API):**

Based on Gemini 1.5 Flash pricing:
- Input: $0.075 / 1M tokens
- Output: $0.30 / 1M tokens

**Conservative Estimate (6 months):**
```
Teacher Chatbot:
  - 150 requests/day × 750 tokens/request × 30 days
  = 3.375M tokens/month
  = $0.25/month (input) + $1.01/month (output)
  = ~$1.26/month

Student Chatbot:
  - 750 requests/day × 350 tokens/request × 30 days
  = 7.875M tokens/month
  = $0.59/month (input) + $2.36/month (output)
  = ~$2.95/month

Total: ~$4.21/month (well within budget)
```

---

### **Question 10: Data Privacy & Compliance**

**Answer:** **GDPR-Focused with Firebase Compliance**

**Compliance Requirements:**

#### **Primary Jurisdiction:**
- **Location:** European Union (Lithuania-based project)
- **Primary Regulation:** GDPR (General Data Protection Regulation)
- **Secondary:** ePrivacy Directive (Cookie Law)

#### **Firebase GDPR Compliance:**
Firebase provides built-in GDPR compliance features:

| Requirement | Firebase Solution |
|-------------|-------------------|
| **Data Residency** | europe-west4 region (Belgium) |
| **Right to Access** | Firestore queries + Firebase Auth export |
| **Right to Deletion** | Delete user API + cascading deletes |
| **Data Portability** | JSON export via Cloud Functions |
| **Consent Management** | Client-side cookie consent |
| **Data Processing Agreement** | Google Cloud DPA included |

**Data Categories & Sensitivity:**

| Data Type | Location | Sensitivity | Retention |
|-----------|----------|-------------|-----------|
| **Email Addresses** | Firebase Auth | PII | Account lifetime + 30 days |
| **Names** | Firestore `users/` | PII | Account lifetime + 30 days |
| **Learning Progress** | Firestore `progress/` | Non-sensitive | Account lifetime |
| **Course Content** | Firestore, Storage | Public/IP | Indefinite |
| **Quiz Answers** | Firestore `quizAttempts/` | Non-sensitive | Account lifetime |
| **Payment Info** | NOT stored | N/A | Never (Stripe handles) |

**Privacy Policies Implemented:**

1. **Data Minimization:**
   - Only collect essential user data (email, name, role)
   - No tracking pixels or unnecessary analytics (yet)
   - Profile pictures are optional

2. **User Consent:**
   - Cookie consent banner (required for EU users)
   - Terms of Service & Privacy Policy acceptance on registration
   - Opt-in for marketing emails

3. **Data Security:**
   - Firebase Authentication (bcrypt hashing, secure tokens)
   - HTTPS-only connections (enforced by Firebase)
   - Firestore Security Rules (role-based access)
   - No sensitive data in logs

4. **User Rights:**
   ```typescript
   // Right to Access (GDPR Article 15)
   GET /api/users/{userId}/data-export
   Returns: JSON with all user data
   
   // Right to Deletion (GDPR Article 17)
   DELETE /api/users/{userId}
   Deletes: Firebase Auth account + all Firestore data
   
   // Right to Rectification (GDPR Article 16)
   PUT /api/users/{userId}
   Updates: User profile information
   ```

**Planned Compliance Features (Phase 5):**

- [ ] **Audit Logs:** Log all data access/modifications
- [ ] **Data Anonymization:** Anonymize deleted user data (replace with placeholder)
- [ ] **Cookie Consent Management:** Granular consent (analytics, marketing)
- [ ] **Privacy-First Analytics:** Use Firebase Analytics (GDPR-compliant mode)
- [ ] **Regular Data Audits:** Quarterly review of stored data

**Student Data Protection:**

For educational platforms, additional considerations:
- **FERPA (US):** Not applicable (no US students currently)
- **COPPA (US):** Not applicable (18+ age restriction)
- **Parental Consent:** Not required (adult learners only)

**AI Chatbot Privacy Considerations:**

1. **Conversation Data:**
   - **Storage:** Firestore (user-specific subcollection)
   - **Retention:** 90 days (configurable)
   - **Access:** User only + admins for support
   - **Anonymization:** Remove PII before logging

2. **Gemini API Data Usage:**
   - Google does NOT use conversation data for training (per Gemini API terms)
   - Data sent to Google Cloud (europe-west1 endpoint preferred)
   - Zero data retention on Google's side (confirmed in API docs)

3. **Sensitive Information Filtering:**
   ```typescript
   // Prevent users from sharing sensitive data in chat
   const SENSITIVE_PATTERNS = [
     /\b\d{3}-\d{2}-\d{4}\b/, // SSN
     /\b\d{16}\b/,            // Credit card
     /password/i              // Passwords
   ];
   
   function sanitizeInput(message: string): string {
     for (const pattern of SENSITIVE_PATTERNS) {
       if (pattern.test(message)) {
         throw new Error('Please do not share sensitive personal information.');
       }
     }
     return message;
   }
   ```

**Compliance Checklist:**

- [x] Data stored in EU region (europe-west4)
- [x] HTTPS enforced across all services
- [x] Firestore Security Rules implemented
- [x] User authentication with secure tokens
- [x] Privacy Policy page created
- [x] Terms of Service page created
- [ ] Cookie consent banner implemented
- [ ] GDPR data export functionality
- [ ] GDPR data deletion functionality
- [ ] Audit logging system
- [ ] Regular security audits

---

## 📊 Summary & Key Insights

### **Technology Stack at a Glance:**
```yaml
Frontend:
  - React 19 + Next.js 14 (App Router)
  - TypeScript, TailwindCSS, shadcn/ui
  - Firebase JS SDK (10.14.1)

Backend:
  - Next.js API Routes (REST)
  - Firebase Admin SDK (12.7.0)
  - Service Layer Architecture
  - Deployed on Firebase App Hosting (Cloud Run)

Database:
  - Cloud Firestore (NoSQL)
  - Document/Subcollection structure
  - Real-time listeners enabled

Storage:
  - Firebase Storage / Cloud Storage
  - Direct uploads with signed URLs
  - CDN-backed delivery

Authentication:
  - Firebase Authentication
  - Email/Password (OAuth planned)
  - Custom claims for RBAC

Observability:
  - Cloud Logging (structured JSON)
  - Cloud Trace (distributed tracing)
  - Cloud Monitoring (metrics)

Region: europe-west4 (Belgium)
Project ID: paji-duolingo
```

### **Integration Points for AI Chatbots:**

1. **Teacher Chatbot:**
   - Hook into: `/api/courses`, `/api/lessons` endpoints
   - Access: Course creation forms, lesson editor UI
   - Context: Teacher's existing courses, lesson types, language focus
   - Output: Structured course/lesson data → Firestore

2. **Student Chatbot:**
   - Hook into: Lesson player UI, dashboard
   - Access: Current lesson content, user progress, enrolled courses
   - Context: Lesson type, language pair, student's history
   - Output: Conversational responses, quiz hints, grammar tips

### **Recommended Next Steps:**

1. **Read Documentation:** 
   - `/docs/GCP_SERVICES_ARCHITECTURE.md`
   - `/docs/API_ENDPOINTS.md` (to be created)
   - `/docs/FIRESTORE_SECURITY_RULES.md`

2. **Design AI Integration:**
   - Create PRD for Teacher Chatbot
   - Create PRD for Student Chatbot
   - Define API contracts for chatbot endpoints

3. **Prototype Development:**
   - Build teacher chatbot with Gemini 1.5 Flash
   - Test student chatbot with lesson context
   - Measure token usage & latency

---

## 🔗 Related Documentation

- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [GCP Services Architecture](./GCP_SERVICES_ARCHITECTURE.md)
- [Current Architecture Overview](./CURRENT_ARCHITECTURE.md)
- [MongoDB to Firestore Mapping](./MONGODB_TO_FIRESTORE_MAPPING.md)
- [Firebase App Hosting Deployment](./FIREBASE_APP_HOSTING_DEPLOYMENT_FIX.md)
- [Phase 4 Implementation Plan](./CLASS_SYSTEM_IMPLEMENTATION_PLAN.md)

---

**Document Owner:** ZenType Architect (J)  
**Date Created:** October 21, 2025  
**Status:** ✅ Complete - Ready for AI Integration Planning  
**Next Step:** Create PRD for AI Chatbot Features


----------------

suggestion from gemini
Detailed Implementation Guide for AI Chatbots in DualLing
Your current architecture, with Next.js API routes, Cloud Firestore, Firebase Storage, and Firebase Authentication with custom claims, provides a solid foundation for integrating AI capabilities. We can build upon this without needing to drastically change your core structure.

Core Components for AI Integration:
Firebase AI Logic SDK: This will be the primary tool on your frontend (React/Next.js) to interact with the Gemini API.
Gemini API: The generative model that will power the chatbot's understanding and response generation.
Next.js API Routes: These will act as a secure intermediary between your frontend and the Gemini API, handling authentication, authorization, and potentially data preparation.
Cloud Firestore: To store conversation history and potentially teacher persona data.
Firebase Storage: To handle the storage of uploaded PDF documents for the teacher bot.
Implementation Strategy:
We will implement the AI logic primarily on the backend using Next.js API routes. This approach offers several advantages:

Security: Your Gemini API key remains on the server and is not exposed in the frontend code.
Authentication and Authorization: You can leverage your existing Firebase Authentication and custom claims middleware to ensure only authorized users can access the chatbot features.
Data Preparation: You can easily access and process data from Firestore and Storage within your API routes before sending it to the Gemini API.
Flexibility: You can manage model parameters, handle different prompt types, and integrate with other services more easily on the backend.
Implementation Steps:
1. Set up Firebase AI Logic
In the Firebase Console: Go to the Firebase AI Logic page and follow the guided workflow to set up the required APIs for your chosen Gemini API provider (Gemini Developer API is recommended for ease of getting started).
Install the Firebase JS SDK: Ensure you have the firebase npm package installed in your Next.js project. You already have version 10.14.1, which should be sufficient, but keep it updated.
2. Implement the Teacher Chatbot (Course Creation Assistant)
This bot will primarily interact with your existing course and lesson creation API endpoints.

Frontend (Teacher Dashboard):
Create a new React component for the teacher chatbot interface.
This component will include an input area for text prompts and a file upload mechanism for PDFs.
When the teacher submits a prompt or uploads a file, the frontend will send this data to a new Next.js API route specifically for the teacher chatbot.
Backend (New Next.js API Route - e.g., /app/api/ai/teacher-bot/route.ts):
Authentication and Authorization: Implement your existing middleware to verify the Firebase JWT token and ensure the user has the teacher or admin role.
Receive Input: This route will receive the text prompt and/or the uploaded file data (or a reference to it in Storage).
Process Input for Gemini:
If a PDF is uploaded, use a library like pdf-parse (which you mentioned in your Genkit tutorial reference, and can be used in Node.js environments like your API routes) to extract text content from the PDF.
Combine the extracted text (from PDF or direct text input) with the teacher's prompt into a single, well-structured prompt for the Gemini API.
Prompt Design: Craft a detailed prompt that instructs the Gemini model to act as a course creation assistant. Include instructions on how to structure the output (e.g., suggest a course title, description, lesson outlines, quiz questions). You can even provide examples of successful course structures from your platform as part of the prompt context.
Initialize Firebase AI Logic: In this API route, initialize the Firebase AI Logic service and create a GenerativeModel instance.

Use code with caution.
import { initializeApp } from 'firebase-admin/app'; import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase-admin/ai'; import { getFirestore } from 'firebase-admin/firestore'; import { getStorage } from 'firebase-admin/storage';


    // Initialize Firebase Admin SDK (if not already initialized)
    if (!getApps().length) {
      initializeApp();
    }

    const ai = getAI(); // Use the default AI instance
    const model = getGenerativeModel(ai, { model: 'gemini-1.5-flash' }); // Choose an appropriate model
Use code with caution.

    *   **Send Prompt to Gemini:** Send the prepared prompt to the Gemini model using `model.generateContent()`.
    *   **Process Gemini's Response:** The Gemini model will return a response based on your prompt. This response should contain the suggested course structure and content.
    *   **Function Calling (for Course Creation):** This is where you integrate with your existing API.
        *   Define a `Tool` for the Gemini model that represents your course creation API endpoint (`POST /api/courses`). The tool definition will describe the function's name (`createCourse`), description, and the parameters it expects (matching your API request body schema).
        *   Include this tool when initializing the `GenerativeModel` instance:
            ```
const model = getGenerativeModel(ai, {
              model: 'gemini-1.5-flash',
              tools: [{
                functionDeclarations: [{
                  name: 'createCourse',
                  description: 'Creates a new course on the platform.',
                  parameters: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      language: { type: 'string', enum: ['Lithuanian', 'English'] },
                      level: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
                      price: { type: 'number' },
                      currency: { type: 'string' },
                      tags: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['title', 'description', 'language', 'level', 'price', 'currency']
                  }
                }]
              }]
            });
Use code with caution.

    *   When the Gemini model determines that the teacher's request can be fulfilled by creating a course, it will generate a `FunctionCall` as part of its response.
    *   Your API route will receive this `FunctionCall`. You will then need to execute this function call by making an internal request to your `POST /api/courses` endpoint, passing the parameters provided by the Gemini model.
    *   Send the result of the API call back to the Gemini model as a `FunctionResponse` to allow it to generate a final, user-friendly response confirming the course creation.
*   **Store Conversation History:** Save the teacher's prompt and the bot's response (including any function calls and results) in a Firestore subcollection under the teacher's user document (e.g., `users/{teacherId}/chatbotConversations`). This allows for multi-turn interactions.
*   **Send Response to Frontend:** Return the bot's response to the frontend to be displayed in the chat interface.
Use code with caution.
3. Implement the Student Chatbot (Learning Assistant)
This bot will provide assistance based on the student's enrolled courses and current lesson content.

Frontend (Lesson Player, Dashboard):
Create a new React component for the student chatbot interface.
This component will include an input area for text queries.
When the student submits a query, the frontend will send this data to a new Next.js API route for the student chatbot. Include information about the current course and lesson the student is viewing.
Backend (New Next.js API Route - e.g., /app/api/ai/student-bot/route.ts):
Authentication and Authorization: Verify the Firebase JWT token and ensure the user has the student role.
Receive Input: This route will receive the student's text query and the context of their current course and lesson.
Retrieve Relevant Content: Access Cloud Firestore to retrieve the content of the current lesson and potentially other relevant information from the course document.
Process Input for Gemini:
Combine the student's query with the retrieved lesson content and course information into a single prompt for the Gemini API.
Prompt Design: Craft a prompt that instructs the Gemini model to act as a helpful learning assistant with the persona of a teacher. Include instructions to answer questions based only on the provided course content and to maintain a helpful and encouraging tone. You can also include information about the specific teacher whose persona the bot is adopting.
Include the conversation history from Firestore to enable multi-turn chat.
Initialize Firebase AI Logic: Initialize the Firebase AI Logic service and create a GenerativeModel instance, potentially with a different model optimized for conversational responses.
Send Prompt to Gemini: Send the prepared prompt to the Gemini model using model.generateContent() or model.generateContentStream() for a more responsive experience.
Process Gemini's Response: The Gemini model will return a response based on the student's query and the provided context.
Store Conversation History: Save the student's query and the bot's response in a Firestore subcollection under the student's user document (e.g., users/{studentId}/chatbotConversations).
Send Response to Frontend: Return the bot's response to the frontend to be displayed.
4. Managing Teacher Personas
Firestore: Create a new collection (e.g., teacherPersonas) in Firestore to store information about each teacher's desired persona for the student bot. This could include:
Teacher's name and brief bio.
Teaching style description (e.g., formal, informal, encouraging).
Specific phrases or vocabulary to use.
You can link this to the teacherId in the users collection.
Backend (Student Bot API Route): When retrieving course information, also retrieve the associated teacher's persona data from the teacherPersonas collection and include it in the prompt sent to the Gemini API.
5. Handling PDF Processing (Teacher Bot)
Firebase Storage: You are already using Firebase Storage for file uploads, which is perfect for storing the teacher's PDF documents.
Next.js API Route: In your teacher bot API route, after the teacher uploads a PDF to Storage (using your existing signed URL process), you can retrieve the file from Storage within the API route and use pdf-parse to extract the text content.
6. Data Privacy and Compliance
Conversation History: Store conversation history in Firestore under the user's document to maintain data locality and control access using Firestore Security Rules. Implement a retention policy (e.g., 90 days as you planned) and a process for deleting this data.
PII in Prompts: Be mindful of sending Personally Identifiable Information (PII) in prompts to the Gemini API. While Google does not use this data for training, it's a good practice to minimize the amount of PII sent. Your existing sanitizeInput function is a good start.
Region: Ensure your Firebase AI Logic configuration uses the europe-west4 region if possible, aligning with your other services for data residency.
Potential Problems and How to Mitigate Them:
Prompt Engineering Complexity: Crafting effective prompts that consistently yield the desired output can be challenging.
Mitigation: Start with simple prompts and gradually increase complexity. Use Google AI Studio to experiment and iterate on your prompts before implementing them in your code. Provide clear instructions and examples in your prompts.
Gemini API Costs: While Gemini 1.5 Flash is cost-effective, usage volume can impact costs.
Mitigation: Monitor your Gemini API usage in the Google Cloud console. Implement per-user rate limits using Firebase App Check and potentially custom logic in your API routes. Optimize prompt length to minimize token usage.
Latency: API calls to the Gemini API can introduce latency.
Mitigation: Use streaming responses (generateContentStream) for the student chatbot to provide a more responsive user experience. Optimize your backend code for efficiency.
Model Hallucinations or Undesired Behavior: AI models can sometimes generate incorrect or inappropriate responses.
Mitigation: Implement safety settings when initializing the GenerativeModel. Carefully design your prompts to guide the model's behavior. Consider adding a layer of post-processing to the model's responses to filter or modify content if necessary. For the teacher bot, clearly indicate that the generated course structure is a suggestion that the teacher should review and edit.
Integration with Existing API: Ensuring the Gemini model correctly generates function calls that match your API schema requires careful tool definition.
Mitigation: Thoroughly test the function calling mechanism. Ensure your tool definitions accurately reflect your API endpoints and expected parameters.
How Your Existing Architecture Helps:
Next.js API Routes: Provides a perfect place to centralize your AI logic, handle authentication/authorization, and interact with other Firebase services.
Service Layer: Your existing service layer can be easily extended to include functions for interacting with the AI models and processing their responses before updating Firestore.
Firestore Security Rules: You can leverage your existing rules to secure access to conversation history and other AI-related data.
Firebase Authentication with Custom Claims: Simplifies role-based access control for your chatbot features.
Firebase Storage with Signed URLs: Provides a secure and efficient way to handle PDF uploads for the teacher bot.
By following these steps and leveraging your existing robust architecture, you can effectively integrate AI-powered chatbots into your DualLing platform, providing valuable assistance to both teachers and students. Remember to start with a minimal implementation and iterate based on testing and user feedback.

Let me know if you have any further questions or would like to dive deeper into any of these steps!

