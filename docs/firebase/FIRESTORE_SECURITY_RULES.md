# Firestore Security Rules

**Status:** 🔴 IN PROGRESS  
**Version:** 1.0.0  
**Last Updated:** October 8, 2025

---

## 📋 Overview

This document defines comprehensive Cloud Firestore security rules for the DualLing platform. These rules enforce data access control, data validation, and ensure OWASP compliance.

---

## 🔐 Security Principles

### Core Rules
1. **Deny by Default:** All access denied unless explicitly allowed
2. **Authentication Required:** Most operations require valid Firebase Auth token
3. **Role-Based Access Control (RBAC):** Use custom claims for role enforcement
4. **Data Validation:** Validate field types, required fields, and value ranges
5. **Least Privilege:** Users can only access their own data (with exceptions)

---

## 🗂️ Complete Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function hasRole(role) {
      return isAuthenticated() && request.auth.token.role == role;
    }
    
    function isAdmin() {
      return hasRole('admin');
    }
    
    function isTeacher() {
      return hasRole('teacher') || isAdmin();
    }
    
    function isStudent() {
      return hasRole('student') || isTeacher();
    }
    
    function isVerifiedTeacher() {
      return isTeacher() && request.auth.token.teacherVerified == true;
    }
    
    // Validate email format
    function isValidEmail(email) {
      return email.matches('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    }
    
    // Validate string length
    function isValidString(str, minLen, maxLen) {
      return str is string && str.size() >= minLen && str.size() <= maxLen;
    }
    
    // ==============================================
    // USERS COLLECTION
    // ==============================================
    match /users/{userId} {
      // Read: User can read own profile OR admin can read all
      allow read: if isOwner(userId) || isAdmin();
      
      // Create: Only during sign-up (via Cloud Function, not directly)
      allow create: if false; // Users created via Cloud Function only
      
      // Update: User can update own profile (with restrictions)
      allow update: if isOwner(userId) && 
                       validateUserUpdate(request.resource.data, resource.data);
      
      // Delete: Only admins can delete users
      allow delete: if isAdmin();
      
      // Validation for user updates
      function validateUserUpdate(newData, oldData) {
        // Required fields cannot be removed
        return newData.keys().hasAll(['email', 'name', 'role', 'createdAt', 'isActive']) &&
               // Email cannot be changed (managed by Firebase Auth)
               newData.email == oldData.email &&
               // Role cannot be self-elevated
               newData.role == oldData.role &&
               // CreatedAt cannot be changed
               newData.createdAt == oldData.createdAt &&
               // Name validation
               isValidString(newData.name, 1, 100) &&
               // ProfilePicture URL validation (if present)
               (!newData.keys().hasAny(['profilePicture']) || 
                newData.profilePicture.matches('^https?://.*'));
      }
      
      // Subcollection: User enrollments
      match /enrollments/{enrollmentId} {
        allow read: if isOwner(userId) || isAdmin();
        allow write: if isOwner(userId) || isAdmin();
      }
      
      // Subcollection: User progress
      match /progress/{progressId} {
        allow read: if isOwner(userId) || isAdmin();
        allow write: if isOwner(userId) || isAdmin();
        
        function validateProgress(data) {
          return data.keys().hasAll(['courseId', 'completed', 'lastAttemptAt']) &&
                 data.completed is bool &&
                 data.lastAttemptAt is timestamp;
        }
      }
      
      // Subcollection: Quiz attempts
      match /quizAttempts/{attemptId} {
        allow read: if isOwner(userId) || isAdmin();
        allow create: if isOwner(userId) && validateQuizAttempt(request.resource.data);
        allow update: if false; // Quiz attempts are immutable
        allow delete: if isAdmin();
        
        function validateQuizAttempt(data) {
          return data.keys().hasAll(['quizRef', 'courseId', 'lessonId', 'answers', 'score', 'attemptedAt']) &&
                 data.score >= 0 &&
                 data.answers is list;
        }
      }
    }
    
    // ==============================================
    // COURSES COLLECTION
    // ==============================================
    match /courses/{courseId} {
      // Read: Anyone can read published courses, teachers can read their own
      allow read: if resource.data.isPublished == true || 
                     isOwner(resource.data.teacherId) || 
                     isAdmin();
      
      // Create: Only verified teachers and admins
      allow create: if isVerifiedTeacher() && validateCourseCreate(request.resource.data);
      
      // Update: Only course owner (teacher) or admin
      allow update: if (isOwner(resource.data.teacherId) || isAdmin()) &&
                       validateCourseUpdate(request.resource.data, resource.data);
      
      // Delete: Only course owner or admin
      allow delete: if isOwner(resource.data.teacherId) || isAdmin();
      
      // Validation for course creation
      function validateCourseCreate(data) {
        return data.keys().hasAll(['title', 'description', 'teacherId', 'language', 'level', 'isPublished', 'createdAt']) &&
               isValidString(data.title, 5, 200) &&
               isValidString(data.description, 20, 5000) &&
               data.teacherId == request.auth.uid &&
               data.language in ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese'] &&
               data.level in ['beginner', 'intermediate', 'advanced'] &&
               data.isPublished is bool &&
               data.createdAt is timestamp;
      }
      
      // Validation for course updates
      function validateCourseUpdate(newData, oldData) {
        return newData.keys().hasAll(['title', 'description', 'teacherId', 'language', 'level', 'isPublished', 'createdAt']) &&
               // TeacherId cannot be changed
               newData.teacherId == oldData.teacherId &&
               // CreatedAt cannot be changed
               newData.createdAt == oldData.createdAt &&
               // Title validation
               isValidString(newData.title, 5, 200) &&
               // Description validation
               isValidString(newData.description, 20, 5000);
      }
      
      // Subcollection: Lessons
      match /lessons/{lessonId} {
        // Read: Same as parent course
        allow read: if get(/databases/$(database)/documents/courses/$(courseId)).data.isPublished == true ||
                       isOwner(get(/databases/$(database)/documents/courses/$(courseId)).data.teacherId) ||
                       isAdmin();
        
        // Write: Only course owner or admin
        allow write: if isOwner(get(/databases/$(database)/documents/courses/$(courseId)).data.teacherId) ||
                        isAdmin();
        
        // Subcollection: Quizzes
        match /quizzes/{quizId} {
          // Read: Same as parent lesson
          allow read: if get(/databases/$(database)/documents/courses/$(courseId)).data.isPublished == true ||
                         isOwner(get(/databases/$(database)/documents/courses/$(courseId)).data.teacherId) ||
                         isAdmin();
          
          // Write: Only course owner or admin
          allow write: if isOwner(get(/databases/$(database)/documents/courses/$(courseId)).data.teacherId) ||
                          isAdmin();
        }
      }
    }
    
    // ==============================================
    // ENROLLMENTS COLLECTION (Top-level)
    // ==============================================
    match /enrollments/{enrollmentId} {
      // Read: User can read own enrollments, teachers can read enrollments for their courses, admins read all
      allow read: if isOwner(resource.data.userId) ||
                     isOwner(get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.teacherId) ||
                     isAdmin();
      
      // Create: User can enroll themselves in a course
      allow create: if isAuthenticated() && 
                       request.resource.data.userId == request.auth.uid &&
                       validateEnrollmentCreate(request.resource.data);
      
      // Update: User can update own enrollment (progress), teacher/admin can update status
      allow update: if isOwner(resource.data.userId) ||
                       isOwner(get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.teacherId) ||
                       isAdmin();
      
      // Delete: Only admins can delete enrollments
      allow delete: if isAdmin();
      
      function validateEnrollmentCreate(data) {
        return data.keys().hasAll(['userId', 'courseId', 'enrolledAt', 'status', 'progress']) &&
               data.userId == request.auth.uid &&
               data.status == 'active' &&
               data.progress == 0 &&
               data.enrolledAt is timestamp;
      }
    }
    
    // ==============================================
    // ADMIN-ONLY COLLECTIONS
    // ==============================================
    match /settings/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    match /analytics/{document=**} {
      allow read: if isAdmin();
      allow write: if false; // Written by Cloud Functions only
    }
    
    match /logs/{document=**} {
      allow read: if isAdmin();
      allow write: if false; // Written by Cloud Functions only
    }
  }
}
```

---

## 🧪 Testing Security Rules

### Using Firebase Emulator

#### 1. Set up test data
```bash
# Start emulator with security rules
firebase emulators:start --only firestore

# Import test data
firebase emulators:export ./test-data
```

#### 2. Run automated tests
```typescript
// tests/firestore.rules.test.ts
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;
  
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });
  
  afterAll(async () => {
    await testEnv.cleanup();
  });
  
  describe('Users collection', () => {
    it('allows user to read own profile', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      await assertSucceeds(db.collection('users').doc('user123').get());
    });
    
    it('denies user reading another user profile', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      await assertFails(db.collection('users').doc('user456').get());
    });
    
    it('allows admin to read any user profile', async () => {
      const db = testEnv.authenticatedContext('admin123', { role: 'admin' }).firestore();
      await assertSucceeds(db.collection('users').doc('user456').get());
    });
  });
  
  describe('Courses collection', () => {
    it('allows reading published courses', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courses').doc('course1').set({
          title: 'Test Course',
          isPublished: true
        });
      });
      await assertSucceeds(db.collection('courses').doc('course1').get());
    });
    
    it('denies reading unpublished courses', async () => {
      const db = testEnv.authenticatedContext('user123').firestore();
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection('courses').doc('course2').set({
          title: 'Draft Course',
          isPublished: false,
          teacherId: 'teacher123'
        });
      });
      await assertFails(db.collection('courses').doc('course2').get());
    });
  });
});
```

---

## 🔧 Deploying Security Rules

### Development/Staging
```bash
# Deploy to staging
firebase use staging
firebase deploy --only firestore:rules
```

### Production
```bash
# Deploy to production (requires confirmation)
firebase use production
firebase deploy --only firestore:rules
```

### Rollback
```bash
# View rule history
firebase firestore:rules list

# Rollback to previous version
firebase firestore:rules release projects/PROJECT_ID/releases/RELEASE_ID
```

---

## 🚨 Security Best Practices

### 1. **Always Validate Data**
- Check data types (`is string`, `is number`, etc.)
- Validate string lengths
- Ensure required fields are present
- Prevent injection attacks

### 2. **Limit `get()` Calls**
- Each `get()` counts as a document read
- Cache results when possible
- Avoid deep nesting of `get()` calls

### 3. **Use Custom Claims Wisely**
- Set custom claims via Cloud Functions
- Don't store sensitive data in claims (they're readable client-side)
- Refresh tokens after claim changes

### 4. **Deny by Default**
- Start with all access denied
- Explicitly allow only necessary operations

### 5. **Test Thoroughly**
- Write automated tests for all rules
- Test edge cases (empty strings, null values, etc.)
- Test with different user roles

---

## 🔍 Common Pitfalls & Solutions

### Pitfall 1: Allowing unrestricted writes
**Bad:**
```javascript
allow write: if isAuthenticated();
```
**Good:**
```javascript
allow write: if isAuthenticated() && 
               request.resource.data.userId == request.auth.uid &&
               validateData(request.resource.data);
```

### Pitfall 2: Not validating data types
**Bad:**
```javascript
allow create: if request.resource.data.name != null;
```
**Good:**
```javascript
allow create: if request.resource.data.name is string &&
                 request.resource.data.name.size() >= 1 &&
                 request.resource.data.name.size() <= 100;
```

### Pitfall 3: Overusing `get()` calls
**Bad:**
```javascript
// Multiple get() calls = performance impact
allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
```
**Good:**
```javascript
// Use custom claims instead
allow read: if request.auth.token.role == 'admin';
```

---

## 📊 Monitoring & Auditing

### Cloud Logging
```bash
# View security rule denials
gcloud logging read "resource.type=firestore_database AND protoPayload.status.code=7" --limit 50
```

### Firebase Console
- Navigate to Firestore → Rules → Usage
- View denied operations
- Identify unauthorized access attempts

---

## 🔗 Related Documents

- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [MongoDB to Firestore Mapping](./MONGODB_TO_FIRESTORE_MAPPING.md)
- [GCP Services Architecture](./GCP_SERVICES_ARCHITECTURE.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)

---

**Document Owner:** ZenType Architect (J)  
**Next Review:** After Phase 2 (Authentication Migration) completion
