# Current Architecture Overview (MongoDB-Based)

**Status:** ✅ COMPLETE  
**Version:** 1.0.0  
**Last Updated:** October 8, 2025

---

## 🏗️ Architecture Summary

DualLing currently operates on a **MongoDB Atlas** backend with a **Next.js 14** frontend, deployed on Vercel. This document provides a snapshot of the existing architecture before the Firebase/GCP migration.

---

## 📦 Technology Stack (Current State)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui components
- **State Management:** React hooks, Context API
- **Authentication:** Custom JWT-based auth with MongoDB sessions

### Backend
- **Runtime:** Next.js API Routes (Node.js)
- **Database:** MongoDB Atlas
- **ODM:** Mongoose (for schema modeling)
- **Authentication:** Custom implementation with bcrypt + JWT
- **File Storage:** Local/MongoDB GridFS (assumed)

### Infrastructure
- **Hosting:** Vercel (for Next.js app)
- **Database Hosting:** MongoDB Atlas
- **CDN:** Vercel Edge Network

---

## 🗂️ Database Structure (MongoDB)

### Collections Overview

#### 1. **users**
Primary user collection storing all user accounts.

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (hashed with bcrypt),
  name: String,
  role: String, // 'student', 'teacher', 'admin'
  profilePicture: String (URL or GridFS reference),
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  lastLogin: Date,
  preferences: {
    language: String,
    theme: String,
    notifications: Boolean
  }
}
```

#### 2. **courses**
All course information.

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  teacherId: ObjectId (ref: 'users'),
  language: String, // Target language
  level: String, // 'beginner', 'intermediate', 'advanced'
  thumbnail: String (URL),
  price: Number,
  currency: String,
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date,
  enrollmentCount: Number,
  rating: Number,
  tags: [String]
}
```

#### 3. **lessons**
Individual lessons within courses.

```javascript
{
  _id: ObjectId,
  courseId: ObjectId (ref: 'courses'),
  title: String,
  description: String,
  order: Number,
  type: String, // 'video', 'text', 'quiz', 'interactive'
  content: {
    videoUrl: String,
    textContent: String,
    duration: Number (minutes)
  },
  resources: [
    {
      title: String,
      url: String,
      type: String
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **enrollments**
Tracks user course enrollments.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  courseId: ObjectId (ref: 'courses'),
  enrolledAt: Date,
  status: String, // 'active', 'completed', 'cancelled'
  progress: Number, // Percentage (0-100)
  lastAccessedAt: Date,
  completedLessons: [ObjectId] (ref: 'lessons')
}
```

#### 5. **progress**
Detailed progress tracking for lessons.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  lessonId: ObjectId (ref: 'lessons'),
  courseId: ObjectId (ref: 'courses'),
  completed: Boolean,
  score: Number, // For quizzes
  timeSpent: Number (minutes),
  lastAttemptAt: Date,
  attempts: Number
}
```

#### 6. **quizzes**
Quiz questions and structure.

```javascript
{
  _id: ObjectId,
  lessonId: ObjectId (ref: 'lessons'),
  questions: [
    {
      question: String,
      type: String, // 'multiple-choice', 'true-false', 'fill-blank'
      options: [String],
      correctAnswer: String or [String],
      explanation: String,
      points: Number
    }
  ],
  passingScore: Number,
  timeLimit: Number (minutes),
  createdAt: Date
}
```

#### 7. **sessions** (if applicable)
User session management.

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'users'),
  token: String (JWT or session token),
  expiresAt: Date,
  createdAt: Date,
  ipAddress: String,
  userAgent: String
}
```

---

## 🔐 Authentication Flow (Current)

1. **Registration:**
   - User submits email + password
   - Password hashed with bcrypt
   - User document created in MongoDB
   - JWT token generated and returned

2. **Login:**
   - User submits credentials
   - Password verified against hashed value
   - JWT token generated with user ID + role
   - Token stored client-side (cookies or localStorage)

3. **Authorization:**
   - Middleware validates JWT on protected routes
   - User role checked against route permissions
   - Request proceeds or returns 401/403

---

## 📁 File Structure (Relevant Backend)

```
app/
├── api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── register/route.ts
│   ├── courses/
│   │   ├── route.ts (GET all, POST new)
│   │   └── [id]/route.ts (GET, PUT, DELETE)
│   ├── enrollment/
│   │   └── route.ts
│   ├── progress/
│   │   └── route.ts
│   ├── profile/
│   │   └── route.ts
│   └── teacher/
│       └── courses/route.ts
lib/
├── mongodb.ts (MongoDB connection utility)
├── auth.ts (JWT utilities, middleware)
└── models/
    ├── User.ts (Mongoose schema)
    ├── Course.ts
    ├── Lesson.ts
    ├── Enrollment.ts
    └── Progress.ts
```

---

## 🔄 Data Flow (Current)

### Example: User Enrolls in a Course

1. **Client Request:** `POST /api/enrollment` with `{ courseId, userId }`
2. **API Route:** Validates request, checks authentication
3. **Database Operations:**
   - Check if user already enrolled (query `enrollments`)
   - Check if course exists and is published (query `courses`)
   - Create new enrollment document
   - Increment `enrollmentCount` in course document
4. **Response:** Return enrollment confirmation + course details

---

## 🚨 Pain Points & Migration Drivers

### Current Issues
1. **Scalability:** MongoDB Atlas free tier limitations
2. **Cost:** Pricing increases with scale
3. **Authentication:** Custom JWT implementation lacks features (OAuth, MFA)
4. **Real-time Features:** Difficult to implement without additional services
5. **File Storage:** No integrated solution for media files
6. **Analytics:** No built-in tracking or insights
7. **Maintenance:** Manual schema migrations and backups

### Migration Goals
- Leverage Firebase's integrated ecosystem
- Reduce operational overhead
- Improve real-time capabilities
- Better authentication options
- Built-in analytics and monitoring
- Utilize €250 GCP credit effectively

---

## 📊 Current Metrics (Estimated)

- **Total Collections:** 7 primary collections
- **Estimated Documents:** < 10,000 across all collections
- **Database Size:** < 1GB
- **Active Users:** < 1,000
- **API Endpoints:** ~20 routes

---

## 🔗 Related Documents

- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [MongoDB to Firestore Mapping](./MONGODB_TO_FIRESTORE_MAPPING.md)
- [GCP Services Architecture](./GCP_SERVICES_ARCHITECTURE.md)

---

**Document Owner:** ZenType Architect (J)  
**Next Review:** Post-migration completion
