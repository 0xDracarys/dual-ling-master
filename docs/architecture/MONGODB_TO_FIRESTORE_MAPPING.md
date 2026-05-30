# MongoDB to Firestore Mapping Guide

**Status:** 🔴 IN PROGRESS  
**Version:** 1.0.0  
**Last Updated:** October 8, 2025

---

## 📋 Overview

This document provides a comprehensive mapping strategy for migrating from MongoDB collections to Cloud Firestore. It covers data structure transformation, query patterns, indexing strategies, and migration scripts.

---

## 🔄 Core Concept Differences

### MongoDB vs Firestore

| Aspect | MongoDB | Firestore |
|--------|---------|-----------|
| **Data Model** | Collections → Documents | Collections → Documents → Subcollections |
| **Document ID** | `_id` (ObjectId) | Auto-generated string or custom |
| **References** | ObjectId references | DocumentReference |
| **Queries** | Rich query language | Limited query operators |
| **Transactions** | Multi-document transactions | Batch writes, transactions |
| **Indexes** | Created on demand | Required for complex queries |
| **Schema** | Flexible (Mongoose for validation) | Flexible (validate in code/Security Rules) |
| **Real-time** | Change streams | Built-in real-time listeners |

---

## 🗂️ Collection-by-Collection Migration

### 1. **users** → **users**

#### MongoDB Schema
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  email: "user@example.com",
  password: "hashed_password",
  name: "John Doe",
  role: "student",
  profilePicture: "url",
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z"),
  isActive: true,
  lastLogin: ISODate("2025-01-01T00:00:00Z"),
  preferences: {
    language: "en",
    theme: "dark",
    notifications: true
  }
}
```

#### Firestore Structure
```javascript
// Document path: users/{userId}
{
  email: "user@example.com",
  // password: REMOVED - Firebase Auth handles this
  name: "John Doe",
  role: "student",
  profilePicture: "gs://bucket/users/userId/profile.jpg",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true,
  lastLogin: Timestamp,
  preferences: {
    language: "en",
    theme: "dark",
    notifications: true
  }
}
```

#### Migration Notes
- **Document ID:** Use Firebase Auth UID as document ID (not MongoDB ObjectId)
- **Password:** Remove from Firestore; migrate to Firebase Authentication
- **Timestamps:** Convert MongoDB ISODate to Firestore Timestamp
- **Profile Pictures:** Move to Firebase Storage, store reference URL

#### Migration Script Pseudocode
```javascript
// For each user in MongoDB:
1. Create Firebase Auth user (email/password)
2. Get Firebase UID
3. Create Firestore document at users/{uid}
4. Upload profile picture to Storage (if exists)
5. Map all other fields
6. Create index on email field
```

---

### 2. **courses** → **courses**

#### MongoDB Schema
```javascript
{
  _id: ObjectId("507f191e810c19729de860ea"),
  title: "Spanish for Beginners",
  description: "Learn Spanish from scratch",
  teacherId: ObjectId("507f1f77bcf86cd799439011"),
  language: "Spanish",
  level: "beginner",
  thumbnail: "url",
  price: 49.99,
  currency: "USD",
  isPublished: true,
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z"),
  enrollmentCount: 150,
  rating: 4.5,
  tags: ["spanish", "beginner", "conversation"]
}
```

#### Firestore Structure
```javascript
// Document path: courses/{courseId}
{
  title: "Spanish for Beginners",
  description: "Learn Spanish from scratch",
  teacherId: "firebase_uid_of_teacher", // Reference to users/{teacherId}
  teacherRef: DocumentReference, // Direct reference for joins
  language: "Spanish",
  level: "beginner",
  thumbnail: "gs://bucket/courses/courseId/thumbnail.jpg",
  price: 49.99,
  currency: "USD",
  isPublished: true,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  enrollmentCount: 150,
  rating: 4.5,
  tags: ["spanish", "beginner", "conversation"],
  stats: {
    totalLessons: 20,
    totalDuration: 480 // minutes
  }
}

// Subcollection: courses/{courseId}/lessons/{lessonId}
// (See lessons section below)
```

#### Migration Notes
- **Document ID:** Generate new Firestore ID or use slugified title
- **teacherId:** Map MongoDB ObjectId to Firebase UID
- **thumbnail:** Upload to Storage, store gs:// URL
- **Subcollections:** Move lessons into subcollection
- **Indexes:** Create composite indexes for queries like: `isPublished == true AND language == 'Spanish'`

---

### 3. **lessons** → **courses/{courseId}/lessons** (Subcollection)

#### MongoDB Schema
```javascript
{
  _id: ObjectId("507f191e810c19729de860eb"),
  courseId: ObjectId("507f191e810c19729de860ea"),
  title: "Lesson 1: Greetings",
  description: "Learn basic greetings",
  order: 1,
  type: "video",
  content: {
    videoUrl: "url",
    textContent: "...",
    duration: 15
  },
  resources: [
    { title: "PDF Guide", url: "url", type: "pdf" }
  ],
  createdAt: ISODate("2025-01-01T00:00:00Z"),
  updatedAt: ISODate("2025-01-01T00:00:00Z")
}
```

#### Firestore Structure
```javascript
// Document path: courses/{courseId}/lessons/{lessonId}
{
  title: "Lesson 1: Greetings",
  description: "Learn basic greetings",
  order: 1,
  type: "video",
  content: {
    videoUrl: "gs://bucket/courses/courseId/lessons/lessonId/video.mp4",
    textContent: "...",
    duration: 15
  },
  resources: [
    { 
      title: "PDF Guide", 
      url: "gs://bucket/courses/courseId/lessons/lessonId/guide.pdf", 
      type: "pdf" 
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### Migration Notes
- **Structure Change:** Move from top-level collection to subcollection under courses
- **Benefits:** Better data locality, automatic cleanup when course is deleted
- **Query Pattern:** `db.collection('courses').doc(courseId).collection('lessons').orderBy('order')`
- **Media Files:** Upload videos/resources to Storage with organized folder structure

---

### 4. **enrollments** → **enrollments**

#### MongoDB Schema
```javascript
{
  _id: ObjectId("507f191e810c19729de860ec"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  courseId: ObjectId("507f191e810c19729de860ea"),
  enrolledAt: ISODate("2025-01-01T00:00:00Z"),
  status: "active",
  progress: 35,
  lastAccessedAt: ISODate("2025-01-05T00:00:00Z"),
  completedLessons: [
    ObjectId("507f191e810c19729de860eb"),
    ObjectId("507f191e810c19729de860ed")
  ]
}
```

#### Firestore Structure (Option 1: Top-Level Collection)
```javascript
// Document path: enrollments/{enrollmentId}
{
  userId: "firebase_uid",
  userRef: DocumentReference, // users/{userId}
  courseId: "course_doc_id",
  courseRef: DocumentReference, // courses/{courseId}
  enrolledAt: Timestamp,
  status: "active",
  progress: 35,
  lastAccessedAt: Timestamp,
  completedLessons: [
    "lesson_id_1",
    "lesson_id_2"
  ],
  // Denormalized for faster queries
  courseName: "Spanish for Beginners",
  studentName: "John Doe"
}
```

#### Firestore Structure (Option 2: Subcollection under User)
```javascript
// Document path: users/{userId}/enrollments/{enrollmentId}
{
  courseId: "course_doc_id",
  courseRef: DocumentReference,
  enrolledAt: Timestamp,
  status: "active",
  progress: 35,
  lastAccessedAt: Timestamp,
  completedLessons: ["lesson_id_1", "lesson_id_2"],
  courseName: "Spanish for Beginners" // Denormalized
}
```

#### Recommendation
Use **Option 1** (top-level) for easier cross-user queries (e.g., "Show all enrollments for course X"). Use composite indexes on `userId` and `courseId`.

#### Migration Notes
- **Composite Index:** Create index on `(userId, status)` and `(courseId, status)`
- **completedLessons:** Map MongoDB ObjectIds to Firestore lesson IDs
- **Denormalization:** Consider adding course/user names for faster reads

---

### 5. **progress** → **users/{userId}/progress** (Subcollection)

#### MongoDB Schema
```javascript
{
  _id: ObjectId("507f191e810c19729de860ed"),
  userId: ObjectId("507f1f77bcf86cd799439011"),
  lessonId: ObjectId("507f191e810c19729de860eb"),
  courseId: ObjectId("507f191e810c19729de860ea"),
  completed: true,
  score: 85,
  timeSpent: 25,
  lastAttemptAt: ISODate("2025-01-05T00:00:00Z"),
  attempts: 2
}
```

#### Firestore Structure
```javascript
// Document path: users/{userId}/progress/{lessonId}
{
  courseId: "course_doc_id",
  courseRef: DocumentReference,
  lessonRef: DocumentReference, // courses/{courseId}/lessons/{lessonId}
  completed: true,
  score: 85,
  timeSpent: 25,
  lastAttemptAt: Timestamp,
  attempts: 2,
  // Denormalized
  lessonTitle: "Lesson 1: Greetings",
  courseTitle: "Spanish for Beginners"
}
```

#### Migration Notes
- **Document ID:** Use `{courseId}_{lessonId}` as document ID for uniqueness
- **Subcollection Benefit:** All user progress in one place
- **Query Pattern:** `db.collection('users').doc(userId).collection('progress').where('courseId', '==', courseId)`

---

### 6. **quizzes** → **courses/{courseId}/lessons/{lessonId}/quizzes** (Subcollection)

#### MongoDB Schema
```javascript
{
  _id: ObjectId("507f191e810c19729de860ee"),
  lessonId: ObjectId("507f191e810c19729de860eb"),
  questions: [
    {
      question: "What is 'Hello' in Spanish?",
      type: "multiple-choice",
      options: ["Hola", "Adiós", "Gracias", "Por favor"],
      correctAnswer: "Hola",
      explanation: "Hola means Hello",
      points: 10
    }
  ],
  passingScore: 70,
  timeLimit: 10,
  createdAt: ISODate("2025-01-01T00:00:00Z")
}
```

#### Firestore Structure
```javascript
// Document path: courses/{courseId}/lessons/{lessonId}/quizzes/{quizId}
{
  questions: [
    {
      questionId: "q1", // Add unique IDs
      question: "What is 'Hello' in Spanish?",
      type: "multiple-choice",
      options: ["Hola", "Adiós", "Gracias", "Por favor"],
      correctAnswer: "Hola",
      explanation: "Hola means Hello",
      points: 10
    }
  ],
  passingScore: 70,
  timeLimit: 10,
  createdAt: Timestamp,
  totalPoints: 10
}

// Subcollection for quiz attempts: 
// users/{userId}/quizAttempts/{attemptId}
{
  quizRef: DocumentReference,
  courseId: "course_doc_id",
  lessonId: "lesson_doc_id",
  answers: [
    { questionId: "q1", selectedAnswer: "Hola", isCorrect: true }
  ],
  score: 10,
  totalScore: 10,
  passed: true,
  attemptedAt: Timestamp,
  completedAt: Timestamp
}
```

#### Migration Notes
- **Deep Nesting:** Quizzes stored 3 levels deep
- **Quiz Attempts:** Store separately under user's subcollection
- **Security:** Use Firestore rules to prevent answer exposure before submission

---

### 7. **sessions** → Firebase Authentication (No Direct Migration)

#### Migration Strategy
- **Replace with Firebase Auth:** Firebase Authentication handles sessions automatically
- **Custom Claims:** Use Firebase Custom Claims for role-based access
- **Token Management:** Firebase SDK manages token refresh automatically
- **Migration:** No data migration needed; users will re-authenticate with new system

---

## 📊 Data Migration Strategy

### Phase 1: Preparation
1. **Audit MongoDB Data:** Export all collections, count documents
2. **Set Up Firebase Project:** Create project, enable Firestore, Storage, Auth
3. **Configure Security Rules:** Write initial Firestore security rules
4. **Create Indexes:** Define required composite indexes in Firestore

### Phase 2: Schema Migration
1. **Create Migration Scripts:** One script per collection
2. **Test with Sample Data:** Migrate 10-100 documents per collection
3. **Validate Data Integrity:** Ensure all fields mapped correctly
4. **Upload Media Files:** Migrate images/videos to Firebase Storage

### Phase 3: User Authentication Migration
1. **Export User Credentials:** Extract email/password hashes from MongoDB
2. **Import to Firebase Auth:** Use Firebase Admin SDK bulk import
3. **Send Password Reset Emails:** Ask users to set new passwords (if needed)

### Phase 4: Full Migration
1. **Schedule Maintenance Window:** Notify users of downtime
2. **Run Migration Scripts:** Execute all collection migrations
3. **Verify Data Completeness:** Compare document counts
4. **Test Application:** Smoke test all critical flows

### Phase 5: Cutover
1. **Update API Routes:** Point to Firestore instead of MongoDB
2. **Deploy New Version:** Push updated codebase
3. **Monitor Errors:** Watch logs for migration issues
4. **Keep MongoDB Read-Only:** Maintain as backup for 30 days

---

## 🔧 Migration Scripts (Pseudocode)

### Users Migration
```javascript
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

async function migrateUsers() {
  const mongoUsers = await mongoDb.collection('users').find().toArray();
  
  for (const user of mongoUsers) {
    // Create Firebase Auth user
    const firebaseUser = await admin.auth().createUser({
      email: user.email,
      password: user.password, // Or trigger password reset
      displayName: user.name,
      photoURL: user.profilePicture
    });
    
    // Set custom claims for role
    await admin.auth().setCustomUserClaims(firebaseUser.uid, {
      role: user.role
    });
    
    // Create Firestore user document
    await admin.firestore().collection('users').doc(firebaseUser.uid).set({
      email: user.email,
      name: user.name,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: admin.firestore.Timestamp.fromDate(user.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(user.updatedAt),
      isActive: user.isActive,
      lastLogin: admin.firestore.Timestamp.fromDate(user.lastLogin),
      preferences: user.preferences
    });
    
    console.log(`Migrated user: ${user.email}`);
  }
}
```

### Courses Migration
```javascript
async function migrateCourses() {
  const mongoCourses = await mongoDb.collection('courses').find().toArray();
  
  for (const course of mongoCourses) {
    // Upload thumbnail to Storage
    const thumbnailUrl = await uploadToStorage(
      course.thumbnail,
      `courses/${course._id}/thumbnail.jpg`
    );
    
    // Map teacherId
    const teacherFirebaseUid = await getFirebaseUid(course.teacherId);
    
    // Create Firestore course document
    const courseRef = await admin.firestore().collection('courses').add({
      title: course.title,
      description: course.description,
      teacherId: teacherFirebaseUid,
      teacherRef: admin.firestore().doc(`users/${teacherFirebaseUid}`),
      language: course.language,
      level: course.level,
      thumbnail: thumbnailUrl,
      price: course.price,
      currency: course.currency,
      isPublished: course.isPublished,
      createdAt: admin.firestore.Timestamp.fromDate(course.createdAt),
      updatedAt: admin.firestore.Timestamp.fromDate(course.updatedAt),
      enrollmentCount: course.enrollmentCount,
      rating: course.rating,
      tags: course.tags
    });
    
    console.log(`Migrated course: ${course.title} -> ${courseRef.id}`);
    
    // Store mapping for lessons migration
    await storeCourseIdMapping(course._id, courseRef.id);
  }
}
```

---

## 🔍 Query Pattern Changes

### MongoDB Query → Firestore Query

#### Example 1: Find all active enrollments for a user
**MongoDB:**
```javascript
db.enrollments.find({ 
  userId: ObjectId("..."), 
  status: "active" 
})
```

**Firestore:**
```javascript
db.collection('enrollments')
  .where('userId', '==', 'firebase_uid')
  .where('status', '==', 'active')
  .get()
```

#### Example 2: Get published courses by language
**MongoDB:**
```javascript
db.courses.find({ 
  isPublished: true, 
  language: "Spanish" 
}).sort({ rating: -1 })
```

**Firestore:**
```javascript
db.collection('courses')
  .where('isPublished', '==', true)
  .where('language', '==', 'Spanish')
  .orderBy('rating', 'desc')
  .get()
```
**Note:** Requires composite index on `(isPublished, language, rating)`

#### Example 3: Complex query with multiple conditions
**MongoDB:**
```javascript
db.courses.find({
  $or: [
    { level: "beginner" },
    { level: "intermediate" }
  ],
  price: { $lt: 50 }
})
```

**Firestore:**
```javascript
// Option 1: Client-side filtering
const courses = await db.collection('courses')
  .where('price', '<', 50)
  .get();
const filtered = courses.docs.filter(doc => 
  ['beginner', 'intermediate'].includes(doc.data().level)
);

// Option 2: Separate queries + merge
const beginnerCourses = await db.collection('courses')
  .where('level', '==', 'beginner')
  .where('price', '<', 50)
  .get();
const intermediateCourses = await db.collection('courses')
  .where('level', '==', 'intermediate')
  .where('price', '<', 50)
  .get();
```

---

## 🔐 Security Rules Mapping

### MongoDB → Firestore Security Rules

**MongoDB (Mongoose Middleware):**
```javascript
userSchema.pre('save', function(next) {
  if (this.role !== 'admin') {
    // Restrict certain fields
  }
  next();
});
```

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId 
                   || request.auth.token.role == 'admin';
    }
    
    match /courses/{courseId} {
      allow read: if resource.data.isPublished == true
                  || request.auth.uid == resource.data.teacherId;
      allow write: if request.auth.uid == resource.data.teacherId
                   || request.auth.token.role == 'admin';
    }
  }
}
```

---

## 📈 Index Strategy

### Required Indexes

1. **users:** `email` (automatic)
2. **courses:** 
   - `(isPublished, language)`
   - `(isPublished, language, rating)`
   - `teacherId`
3. **enrollments:**
   - `(userId, status)`
   - `(courseId, status)`
4. **progress:**
   - Collection group index on `userId`

---

## ✅ Migration Checklist

- [ ] Export all MongoDB collections
- [ ] Set up Firebase project
- [ ] Configure Firestore database
- [ ] Enable Firebase Authentication
- [ ] Create Firebase Storage buckets
- [ ] Write Firestore security rules
- [ ] Create required composite indexes
- [ ] Write migration scripts for each collection
- [ ] Test migration with sample data
- [ ] Migrate user authentication
- [ ] Migrate media files to Storage
- [ ] Run full data migration
- [ ] Verify data integrity
- [ ] Update all API routes
- [ ] Update frontend queries
- [ ] Deploy new version
- [ ] Monitor for errors
- [ ] Decommission MongoDB (after 30 days)

---

## 🔗 Related Documents

- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [GCP Services Architecture](./GCP_SERVICES_ARCHITECTURE.md)
- [Firestore Security Rules](./FIRESTORE_SECURITY_RULES.md)

---

**Document Owner:** ZenType Architect (J)  
**Next Review:** After test migration completion
