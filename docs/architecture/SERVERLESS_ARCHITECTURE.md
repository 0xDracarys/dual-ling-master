# Serverless Architecture & Modular Development Strategy

**Status:** ✅ COMPLETE  
**Version:** 1.0.0  
**Last Updated:** October 8, 2025

---

## 🏗️ Architecture Philosophy

**Core Principles:**
1. **Service Isolation** - Each service (Auth, Database, Storage, Functions) is completely independent
2. **Zero Coupling** - Services communicate only through well-defined interfaces
3. **Parallel Development** - Multiple teams can work on different services simultaneously
4. **Conflict-Free Merging** - Clear boundaries prevent merge conflicts
5. **Serverless First** - Everything scales automatically, no server management

---

## 📦 Modular Project Structure

```
dual-ling/
├── 📁 app/                          # Next.js App Router (Frontend)
│   ├── (auth)/                      # Auth-related pages (isolated)
│   ├── (dashboard)/                 # User dashboard (isolated)
│   ├── (courses)/                   # Course pages (isolated)
│   └── api/                         # Next.js API routes (thin layer)
│
├── 📁 lib/                          # Shared libraries
│   ├── 🔐 firebase/                 # Firebase SDKs (READ-ONLY interfaces)
│   │   ├── config.ts                # Client SDK
│   │   └── admin.ts                 # Admin SDK
│   │
│   ├── 🔌 services/                 # SERVICE LAYER (Business Logic)
│   │   ├── auth.service.ts          # ✅ Authentication Service
│   │   ├── user.service.ts          # ✅ User Management Service
│   │   ├── course.service.ts        # ✅ Course Service
│   │   ├── enrollment.service.ts    # ✅ Enrollment Service
│   │   ├── progress.service.ts      # ✅ Progress Tracking Service
│   │   └── storage.service.ts       # ✅ File Upload Service
│   │
│   ├── 🗄️ repositories/             # DATA ACCESS LAYER (Database only)
│   │   ├── user.repository.ts       # Firestore: users collection
│   │   ├── course.repository.ts     # Firestore: courses collection
│   │   ├── enrollment.repository.ts # Firestore: enrollments collection
│   │   └── progress.repository.ts   # Firestore: progress collection
│   │
│   ├── 🛡️ middleware/               # Request interceptors
│   │   ├── auth.middleware.ts       # Firebase Auth verification
│   │   ├── rbac.middleware.ts       # Role-based access control
│   │   └── logger.middleware.ts     # Request logging
│   │
│   ├── 🎨 types/                    # TypeScript interfaces (shared)
│   │   ├── user.types.ts
│   │   ├── course.types.ts
│   │   └── common.types.ts
│   │
│   └── 🔧 utils/                    # Helper functions
│       ├── validators.ts
│       ├── formatters.ts
│       └── constants.ts
│
├── 📁 components/                   # React components (UI only)
│   ├── auth/                        # Auth UI components
│   ├── courses/                     # Course UI components
│   ├── shared/                      # Shared UI components
│   └── debug/                       # 🐛 Debug Panel Component
│
├── 📁 functions/                    # Cloud Functions (serverless)
│   ├── src/
│   │   ├── auth/                    # Auth-related functions
│   │   │   ├── onUserCreated.ts
│   │   │   └── sendVerificationEmail.ts
│   │   ├── courses/                 # Course-related functions
│   │   │   ├── onCoursePublished.ts
│   │   │   └── syncCourseStats.ts
│   │   ├── notifications/           # Email/push notifications
│   │   │   └── sendEnrollmentEmail.ts
│   │   └── scheduled/               # Cron jobs
│   │       └── dailyStats.ts
│   └── package.json                 # Separate dependencies
│
├── 📁 scripts/                      # Migration & dev scripts
│   ├── migrate-users.ts
│   ├── migrate-courses.ts
│   └── seed-data.ts
│
└── 📁 docs/                         # IKB Documentation
    └── SERVERLESS_ARCHITECTURE.md   # This document
```

---

## 🔌 Service Layer Architecture

### **What is the Service Layer?**

The Service Layer is the **single source of truth** for business logic. It sits between your API routes and the database, ensuring:
- ✅ No duplicate code
- ✅ Easy testing
- ✅ Consistent behavior
- ✅ Single place to change logic

### **Example: Authentication Service**

```typescript
// lib/services/auth.service.ts
export class AuthService {
  // ✅ All auth logic in ONE place
  
  async registerUser(email: string, password: string, name: string) {
    // 1. Create Firebase Auth user
    // 2. Create Firestore user document
    // 3. Send verification email
    // 4. Log event
  }
  
  async loginUser(email: string, password: string) {
    // 1. Verify credentials
    // 2. Generate token
    // 3. Update lastLogin timestamp
    // 4. Log event
  }
}
```

**Usage in API Route:**
```typescript
// app/api/auth/register/route.ts
import { AuthService } from '@/lib/services/auth.service';

export async function POST(req: Request) {
  const { email, password, name } = await req.json();
  const authService = new AuthService();
  const user = await authService.registerUser(email, password, name);
  return NextResponse.json(user);
}
```

**Usage in Cloud Function:**
```typescript
// functions/src/auth/onUserCreated.ts
import { AuthService } from '../../lib/services/auth.service'; // Same service!

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const authService = new AuthService();
  await authService.sendWelcomeEmail(user.uid);
});
```

---

## 🗄️ Repository Pattern (Data Access Layer)

### **What is Repository Pattern?**

Repositories handle **ONLY** database operations. No business logic, no validation, just pure CRUD.

```typescript
// lib/repositories/user.repository.ts
import { getAdminDb } from '@/lib/firebase/admin';

export class UserRepository {
  private collection = getAdminDb().collection('users');
  
  async create(uid: string, data: UserData) {
    await this.collection.doc(uid).set(data);
  }
  
  async findById(uid: string) {
    const doc = await this.collection.doc(uid).get();
    return doc.exists ? doc.data() : null;
  }
  
  async update(uid: string, data: Partial<UserData>) {
    await this.collection.doc(uid).update(data);
  }
  
  async delete(uid: string) {
    await this.collection.doc(uid).delete();
  }
}
```

**Why This Matters:**
- ✅ If you switch from Firestore to another DB, you only change repositories
- ✅ Services don't need to know about database structure
- ✅ Easy to mock for testing

---

## 🚀 Serverless Cloud Functions

### **When to Use Cloud Functions vs API Routes**

| Task | Use Cloud Function | Use API Route |
|------|-------------------|---------------|
| User creates account | ❌ API Route | ✅ Direct Firebase Auth |
| Send welcome email | ✅ Cloud Function (onUserCreated) | ❌ |
| Course enrollment | ✅ API Route | ❌ |
| Daily stats aggregation | ✅ Scheduled Function | ❌ |
| File upload | ✅ Storage Trigger | ❌ |
| User fetches courses | ❌ | ✅ API Route |

### **Cloud Functions Structure**

```typescript
// functions/src/index.ts (entry point)
export { onUserCreated } from './auth/onUserCreated';
export { onCoursePublished } from './courses/onCoursePublished';
export { dailyStatsAggregation } from './scheduled/dailyStats';
export { onVideoUploaded } from './storage/onVideoUploaded';
```

**Deployment:**
```bash
# Deploy ALL functions
firebase deploy --only functions

# Deploy ONLY auth functions (no conflicts!)
firebase deploy --only functions:onUserCreated,functions:sendVerificationEmail

# Deploy ONLY course functions
firebase deploy --only functions:onCoursePublished
```

---

## 🔒 Conflict-Free Development Strategy

### **Scenario 1: Two Devs Working on Different Services**

**Dev A:** Working on Authentication  
**Dev B:** Working on Course Management

```
Dev A changes:
├── lib/services/auth.service.ts         ✅ Only Auth
├── lib/repositories/user.repository.ts  ✅ Only Auth
├── app/api/auth/register/route.ts       ✅ Only Auth
└── components/auth/LoginForm.tsx        ✅ Only Auth

Dev B changes:
├── lib/services/course.service.ts       ✅ Only Courses
├── lib/repositories/course.repository.ts ✅ Only Courses
├── app/api/courses/route.ts             ✅ Only Courses
└── components/courses/CourseCard.tsx    ✅ Only Courses

MERGE: ✅ ZERO CONFLICTS (different files)
```

---

### **Scenario 2: Both Devs Need to Change Shared Files**

**Problem:** Both need to update `lib/types/common.types.ts`

**Solution: Atomic Commits + Communication**

```typescript
// lib/types/common.types.ts (before)
export interface ApiResponse {
  success: boolean;
  data?: any;
}

// Dev A adds auth-specific type (commits first)
export interface ApiResponse {
  success: boolean;
  data?: any;
}
export interface AuthResponse extends ApiResponse {
  token: string;
  user: User;
}

// Dev B pulls Dev A's changes, then adds course-specific type
export interface ApiResponse {
  success: boolean;
  data?: any;
}
export interface AuthResponse extends ApiResponse {
  token: string;
  user: User;
}
export interface CourseResponse extends ApiResponse {
  courses: Course[];
  total: number;
}

MERGE: ✅ NO CONFLICTS (additive changes)
```

---

### **Scenario 3: Cloud Functions Independence**

**Dev A:** Creates new auth function  
**Dev B:** Creates new course function

```
functions/
├── src/
│   ├── auth/
│   │   ├── onUserCreated.ts        ← Dev A
│   │   └── onUserDeleted.ts        ← Dev A (new)
│   └── courses/
│       ├── onCoursePublished.ts    ← Dev B
│       └── onCourseDeleted.ts      ← Dev B (new)

# Deploy independently
Dev A: firebase deploy --only functions:onUserDeleted
Dev B: firebase deploy --only functions:onCourseDeleted

DEPLOY: ✅ NO CONFLICTS (independent functions)
```

---

## 📊 Dependency Graph (Service Boundaries)

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                   │
│  app/   components/   hooks/                             │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                API ROUTES (Thin Layer)                   │
│  app/api/auth/*   app/api/courses/*   app/api/users/*   │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│               SERVICE LAYER (Business Logic)             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Auth   │  │  Course  │  │   User   │              │
│  │ Service  │  │ Service  │  │ Service  │              │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘              │
└────────┼────────────┼─────────────┼────────────────────┘
         │            │             │
         ▼            ▼             ▼
┌─────────────────────────────────────────────────────────┐
│           REPOSITORY LAYER (Data Access)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   User   │  │  Course  │  │  Enroll  │              │
│  │   Repo   │  │   Repo   │  │   Repo   │              │
│  └─────┬────┘  └────┬─────┘  └────┬─────┘              │
└────────┼────────────┼─────────────┼────────────────────┘
         │            │             │
         ▼            ▼             ▼
┌─────────────────────────────────────────────────────────┐
│              FIREBASE (Infrastructure)                   │
│  Firestore   Auth   Storage   Functions                 │
└─────────────────────────────────────────────────────────┘
```

**Key Insight:** Each layer only depends on the layer below, never above.

---

## 🔧 Development Workflow

### **Feature Branch Strategy**

```bash
# Main branches
main                  # Production
firebase-migration    # Current migration work

# Feature branches (per service)
feature/auth-google-signin          # Only auth changes
feature/course-video-upload         # Only course changes
feature/debug-panel                 # Only debug changes
feature/enrollment-notifications    # Only enrollment changes
```

### **Pull Request Guidelines**

**PR Title Format:**
```
[Service] Brief description

Examples:
[Auth] Add Google Sign-In support
[Course] Add video upload to lessons
[Debug] Create debug panel component
[Enrollment] Send confirmation emails
```

**PR Description:**
```markdown
## Service: Authentication

### Changes:
- Added Google Sign-In provider
- Updated auth.service.ts with signInWithGoogle method
- Created GoogleSignInButton component

### Files Changed:
- lib/services/auth.service.ts
- components/auth/GoogleSignInButton.tsx
- app/api/auth/google/route.ts

### Dependencies:
- None (independent change)

### Testing:
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Manually tested in emulator

### Conflicts:
- None expected (only auth-related files)
```

---

## 🧪 Testing Strategy (Per Service)

```
tests/
├── unit/
│   ├── services/
│   │   ├── auth.service.test.ts       ← Test auth service
│   │   ├── course.service.test.ts     ← Test course service
│   │   └── user.service.test.ts       ← Test user service
│   └── repositories/
│       ├── user.repository.test.ts
│       └── course.repository.test.ts
├── integration/
│   ├── auth-flow.test.ts              ← E2E auth flow
│   └── course-enrollment.test.ts      ← E2E enrollment
└── e2e/
    └── playwright/                     ← Full user journeys
```

**Run tests per service:**
```bash
# Only auth tests
npm run test -- --testPathPattern=auth

# Only course tests
npm run test -- --testPathPattern=course

# All tests
npm run test
```

---

## 📦 NPM Scripts for Modular Development

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    
    "emulators": "firebase emulators:start",
    "emulators:auth": "firebase emulators:start --only auth",
    "emulators:firestore": "firebase emulators:start --only firestore",
    
    "deploy:all": "firebase deploy",
    "deploy:functions": "firebase deploy --only functions",
    "deploy:functions:auth": "firebase deploy --only functions:onUserCreated,functions:onUserDeleted",
    "deploy:functions:courses": "firebase deploy --only functions:onCoursePublished",
    "deploy:firestore": "firebase deploy --only firestore",
    "deploy:storage": "firebase deploy --only storage",
    
    "test": "jest",
    "test:auth": "jest --testPathPattern=auth",
    "test:courses": "jest --testPathPattern=course",
    "test:watch": "jest --watch"
  }
}
```

---

## 🔗 Service Communication (Event-Driven)

### **Problem:** Course Service needs to notify Enrollment Service

**❌ Bad (Direct Coupling):**
```typescript
// course.service.ts
import { EnrollmentService } from './enrollment.service'; // ❌ Coupling!

class CourseService {
  async publishCourse(courseId: string) {
    await this.courseRepo.update(courseId, { isPublished: true });
    
    // ❌ CourseService knows about EnrollmentService
    const enrollmentService = new EnrollmentService();
    await enrollmentService.notifyEnrolledUsers(courseId);
  }
}
```

**✅ Good (Event-Driven):**
```typescript
// course.service.ts
class CourseService {
  async publishCourse(courseId: string) {
    await this.courseRepo.update(courseId, { isPublished: true });
    
    // ✅ Emit event, don't call other services
    await this.eventBus.emit('course.published', { courseId });
  }
}

// functions/src/courses/onCoursePublished.ts
export const onCoursePublished = functions.firestore
  .document('courses/{courseId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    if (!oldData.isPublished && newData.isPublished) {
      // ✅ Separate function handles notification
      await notifyEnrolledUsers(context.params.courseId);
    }
  });
```

---

## 🎯 Checklist for Adding New Features

When adding a new feature, follow this checklist:

### 1. Define Service Boundaries
- [ ] What service does this belong to? (Auth/Course/User/etc.)
- [ ] Does it need a new service or extend existing?
- [ ] List all services it depends on

### 2. Create Types First
- [ ] Add interfaces in `lib/types/[service].types.ts`
- [ ] Export from `lib/types/index.ts`

### 3. Repository Layer
- [ ] Create/update repository in `lib/repositories/[service].repository.ts`
- [ ] Only CRUD operations, no business logic

### 4. Service Layer
- [ ] Create/update service in `lib/services/[service].service.ts`
- [ ] All business logic here
- [ ] Use repositories for data access

### 5. API Routes
- [ ] Create thin API route in `app/api/[service]/route.ts`
- [ ] Delegate to service layer immediately

### 6. Frontend Components
- [ ] Create UI components in `components/[service]/`
- [ ] Call API routes, not services directly

### 7. Cloud Functions (if needed)
- [ ] Create function in `functions/src/[service]/`
- [ ] Export from `functions/src/index.ts`

### 8. Tests
- [ ] Unit tests for service
- [ ] Unit tests for repository
- [ ] Integration tests for API route

### 9. Documentation
- [ ] Update IKB with new feature
- [ ] Add to MAIN.md recent changes

---

## 🚀 Quick Reference: Common Tasks

### **Add New API Endpoint**
```bash
1. Create service method: lib/services/[service].service.ts
2. Create API route: app/api/[service]/route.ts
3. Call service from route
4. Test with Postman
```

### **Add Cloud Function**
```bash
1. Create function: functions/src/[service]/[function].ts
2. Export in functions/src/index.ts
3. Deploy: firebase deploy --only functions:[functionName]
```

### **Change Database Schema**
```bash
1. Update types: lib/types/[service].types.ts
2. Update repository: lib/repositories/[service].repository.ts
3. Update Firestore rules: firestore.rules
4. Deploy rules: firebase deploy --only firestore:rules
```

---

## 📚 Related Documents

- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [GCP Services Architecture](./GCP_SERVICES_ARCHITECTURE.md)
- [Debug System Documentation](./DEBUG_SYSTEM.md) ← To be created
- [API Endpoints Reference](./API_ENDPOINTS.md) ← To be created

---

**Document Owner:** ZenType Architect (J)  
**Next Review:** After Phase 2 completion
