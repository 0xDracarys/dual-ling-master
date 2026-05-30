# GCP Services Architecture

**Status:** 🔴 IN PROGRESS  
**Version:** 1.0.0  
**Last Updated:** October 8, 2025

---

## 🏗️ Architecture Overview

This document details how various Google Cloud Platform (GCP) services integrate to power the DualLing platform after the Firebase migration. It covers service interactions, data flow, deployment strategies, and best practices.

---

## 📊 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend (Vercel/Firebase Hosting)                     │
│  - React Components                                              │
│  - Firebase JS SDK                                               │
│  - Real-time Listeners                                           │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Firebase Authentication                                         │
│  - Email/Password Auth                                           │
│  - OAuth Providers (Google, GitHub)                              │
│  - Custom Claims (Roles)                                         │
│  - Session Management                                            │
└─────────────┬───────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API/BACKEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js API Routes                  Cloud Functions (2nd Gen)  │
│  - Server-side rendering             - Background jobs          │
│  - API endpoints                     - Email notifications       │
│  - Firebase Admin SDK                - Data aggregation          │
│  - Middleware                        - Scheduled tasks           │
└─────────────┬───────────────────────────┬───────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Cloud Firestore                     Firebase Storage           │
│  - users                             - Profile pictures          │
│  - courses                           - Course thumbnails         │
│  - enrollments                       - Lesson videos             │
│  - progress                          - Quiz resources            │
│  └── lessons (subcollection)         - PDF materials            │
│  └── quizzes (subcollection)                                    │
└─────────────┬───────────────────────────┬───────────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPPORTING SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│  Cloud Monitoring    Cloud Logging    Secret Manager            │
│  Cloud Scheduler     Cloud Tasks      Cloud CDN                 │
│  Firebase Analytics  Cloud Pub/Sub    Cloud Run (optional)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Service-by-Service Breakdown

### 1. **Cloud Firestore** (Primary Database)

#### Purpose
NoSQL document database for storing all application data.

#### Collections Structure
```
firestore/
├── users/
│   ├── {userId}/
│   │   ├── enrollments/ (subcollection)
│   │   ├── progress/ (subcollection)
│   │   └── quizAttempts/ (subcollection)
├── courses/
│   ├── {courseId}/
│   │   ├── lessons/ (subcollection)
│   │   │   └── {lessonId}/
│   │   │       └── quizzes/ (subcollection)
├── enrollments/ (top-level for cross-user queries)
```

#### Key Features Used
- **Real-time Listeners:** Course enrollment status, progress tracking
- **Composite Indexes:** Fast queries on multiple fields
- **Security Rules:** Role-based access control
- **Batch Writes:** Atomic updates across documents
- **Offline Support:** Mobile app caching (future)

#### Cost Optimization
- Use `get()` for one-time reads, `onSnapshot()` sparingly
- Implement pagination (limit queries to 25-50 documents)
- Cache frequently accessed data client-side
- Use collection group queries instead of multiple queries

#### Example Query
```typescript
// Get all published Spanish courses sorted by rating
const coursesRef = collection(db, 'courses');
const q = query(
  coursesRef,
  where('isPublished', '==', true),
  where('language', '==', 'Spanish'),
  orderBy('rating', 'desc'),
  limit(20)
);
const snapshot = await getDocs(q);
```

---

### 2. **Firebase Authentication**

#### Purpose
User authentication and authorization.

#### Features Used
- **Email/Password Auth:** Primary authentication method
- **OAuth Providers:** Google Sign-In, GitHub (optional)
- **Custom Claims:** Store user roles (student, teacher, admin)
- **Email Verification:** Verify new user emails
- **Password Reset:** Self-service password recovery
- **Session Management:** Automatic token refresh

#### Custom Claims Structure
```typescript
{
  role: 'student' | 'teacher' | 'admin',
  isPremium: boolean,
  teacherVerified: boolean // For teachers only
}
```

#### Security Rules Integration
```javascript
// Firestore rule using custom claims
match /courses/{courseId} {
  allow write: if request.auth.token.role == 'teacher' 
               || request.auth.token.role == 'admin';
}
```

#### Example Implementation
```typescript
// Set custom claims (Admin SDK)
await admin.auth().setCustomUserClaims(userId, {
  role: 'teacher',
  teacherVerified: true
});

// Client-side: Get custom claims
const idTokenResult = await user.getIdTokenResult();
const role = idTokenResult.claims.role;
```

---

### 3. **Firebase Storage / Cloud Storage**

#### Purpose
Store and serve media files (images, videos, PDFs, documents).

#### Bucket Structure
```
paji-duolingo.firebasestorage.app/
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
│                   ├── {uuid}.pdf
│                   ├── {uuid}.docx
│                   └── {uuid}.pptx
```

#### Resource Upload Implementation (✅ COMPLETE)
**Status:** Production ready as of October 26, 2025

**Supported File Types:**
- PDF (.pdf)
- Word (.doc, .docx)
- PowerPoint (.ppt, .pptx)
- Excel (.xlsx)
- Text (.txt)

**Upload Flow:**
1. Teacher selects file via drag-and-drop or file picker
2. Client sends multipart form data to API endpoint
3. Server validates file type and size (max 50MB)
4. File uploaded to Storage via Firebase Admin SDK
5. Signed URL generated (1-year expiry)
6. Resource metadata saved to Firestore lesson document
7. Students can download via signed URL

**Storage Path Pattern:**
```
courses/{courseId}/lessons/{lessonId}/resources/{uuid}.{extension}
```

**Benefits:**
- ✅ Hierarchical organization (easy to query/delete)
- ✅ UUID prevents filename conflicts
- ✅ Course/lesson isolation for security
- ✅ Scalable to millions of files

#### Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /courses/{courseId}/lessons/{lessonId}/resources/{fileName} {
      // Authenticated users can read
      allow read: if request.auth != null;
      
      // Only teachers can upload
      allow write: if request.auth != null 
                   && request.auth.token.role == 'teacher'
                   && request.resource.size <= 50 * 1024 * 1024  // 50MB max
                   && isValidDocumentType(fileName);
      
      function isValidDocumentType(filename) {
        return filename.matches('.*\\.(pdf|doc|docx|ppt|pptx|xlsx|txt)$');
      }
    }
  }
}
```

#### Features Used
- **Resumable Uploads:** Large video/document files
- **Signed URLs:** Secure access without authentication
- **Admin SDK Uploads:** Server-side upload bypasses client limits
- **Lifecycle Policies:** Auto-delete old versions
- **CDN Integration:** Fast global delivery via Cloud CDN

#### Cost Optimization
- Compress images before upload (WebP format)
- Use Cloud CDN for frequently accessed files
- Set cache headers (1 year for static assets)
- Implement video streaming (HLS/DASH) for large videos
- **Resource Files:** $0.026/GB/month storage, $0.12/GB download (very cost-efficient)

---

### 4. **Cloud Functions (2nd Generation)**

#### Purpose
Serverless backend logic for background tasks and event-driven workflows.

#### Key Functions

##### Function 1: `onUserCreated`
**Trigger:** Firebase Auth user creation  
**Purpose:** Initialize user profile in Firestore

```typescript
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  await admin.firestore().collection('users').doc(user.uid).set({
    email: user.email,
    name: user.displayName || '',
    role: 'student', // Default role
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isActive: true
  });
});
```

##### Function 2: `sendEnrollmentEmail`
**Trigger:** Firestore write on `enrollments` collection  
**Purpose:** Send confirmation email when user enrolls in a course

```typescript
export const sendEnrollmentEmail = functions.firestore
  .document('enrollments/{enrollmentId}')
  .onCreate(async (snap, context) => {
    const enrollment = snap.data();
    const user = await admin.firestore().collection('users').doc(enrollment.userId).get();
    const course = await admin.firestore().collection('courses').doc(enrollment.courseId).get();
    
    // Send email using SendGrid/Mailgun
    await sendEmail({
      to: user.data().email,
      subject: `Welcome to ${course.data().title}!`,
      template: 'enrollment-confirmation'
    });
  });
```

##### Function 3: `aggregateCourseStats`
**Trigger:** Cloud Scheduler (daily at midnight)  
**Purpose:** Update course statistics (enrollment count, avg rating)

```typescript
export const aggregateCourseStats = functions.pubsub
  .schedule('0 0 * * *') // Daily at midnight
  .onRun(async (context) => {
    const courses = await admin.firestore().collection('courses').get();
    
    for (const course of courses.docs) {
      const enrollments = await admin.firestore()
        .collection('enrollments')
        .where('courseId', '==', course.id)
        .where('status', '==', 'active')
        .get();
      
      await course.ref.update({
        enrollmentCount: enrollments.size,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });
```

##### Function 4: `generateCourseCertificate`
**Trigger:** HTTP request  
**Purpose:** Generate PDF certificate when user completes course

```typescript
export const generateCourseCertificate = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated');
  
  const { courseId } = data;
  const userId = context.auth.uid;
  
  // Check if user completed course
  const enrollment = await admin.firestore()
    .collection('enrollments')
    .where('userId', '==', userId)
    .where('courseId', '==', courseId)
    .where('status', '==', 'completed')
    .get();
  
  if (enrollment.empty) {
    throw new functions.https.HttpsError('failed-precondition', 'Course not completed');
  }
  
  // Generate PDF certificate (using puppeteer or similar)
  const certificateUrl = await generatePDF(userId, courseId);
  
  return { certificateUrl };
});
```

#### Deployment
```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:sendEnrollmentEmail
```

---

### 5. **Cloud Scheduler**

#### Purpose
Run scheduled tasks (cron jobs).

#### Scheduled Jobs

##### Job 1: Daily Course Stats Aggregation
- **Schedule:** `0 0 * * *` (midnight UTC)
- **Target:** Cloud Function `aggregateCourseStats`
- **Purpose:** Update course enrollment counts, ratings

##### Job 2: Weekly Inactive User Reminders
- **Schedule:** `0 9 * * 1` (Mondays at 9am)
- **Target:** Cloud Function `sendInactiveUserReminders`
- **Purpose:** Email users who haven't logged in for 7+ days

##### Job 3: Monthly Billing/Invoice Generation
- **Schedule:** `0 0 1 * *` (1st of each month)
- **Target:** Cloud Function `generateMonthlyInvoices`
- **Purpose:** Generate invoices for premium subscribers

---

### 6. **Cloud Tasks**

#### Purpose
Asynchronous task queue for long-running operations.

#### Use Cases
- **Video Processing:** Transcode uploaded videos to multiple resolutions
- **Batch Notifications:** Send emails to all enrolled students
- **Data Export:** Generate CSV exports of user data (GDPR requests)

#### Example: Video Processing Task
```typescript
// Create task to process video
export const queueVideoProcessing = functions.storage.object().onFinalize(async (object) => {
  if (!object.name.includes('lessons/') || !object.name.endsWith('.mp4')) return;
  
  const tasksClient = new CloudTasksClient();
  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: 'https://us-central1-PROJECT_ID.cloudfunctions.net/processVideo',
      body: Buffer.from(JSON.stringify({
        filePath: object.name,
        bucket: object.bucket
      })).toString('base64'),
      headers: {
        'Content-Type': 'application/json'
      }
    }
  };
  
  await tasksClient.createTask({
    parent: 'projects/PROJECT_ID/locations/us-central1/queues/video-processing',
    task
  });
});
```

---

### 7. **Secret Manager**

#### Purpose
Securely store API keys, database credentials, and sensitive configuration.

#### Secrets Stored
- `SENDGRID_API_KEY` - Email service
- `STRIPE_SECRET_KEY` - Payment processing
- `JWT_SIGNING_KEY` - Token generation (if still using custom JWTs)
- `OPENAI_API_KEY` - AI features (future)
- `DATABASE_URL` - If using external DB (rare with Firebase)

#### Access from Cloud Functions
```typescript
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

async function getSecret(secretName: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/PROJECT_ID/secrets/${secretName}/versions/latest`
  });
  return version.payload.data.toString();
}

// Usage
const sendgridKey = await getSecret('SENDGRID_API_KEY');
```

---

### 8. **Cloud Monitoring & Logging**

#### Purpose
Monitor application health, track errors, and analyze logs.

#### Metrics to Monitor
1. **Firestore:**
   - Read/write operations per minute
   - Document count per collection
   - Query latency (p50, p95, p99)

2. **Cloud Functions:**
   - Execution count per function
   - Error rate (%)
   - Cold start latency
   - Memory usage

3. **Firebase Auth:**
   - Sign-up rate
   - Failed login attempts
   - Active users (DAU, MAU)

4. **Storage:**
   - Egress bandwidth (GB/day)
   - Storage size growth
   - Download counts

#### Alerting Policies
```yaml
# Example alert: High error rate
- name: "High Cloud Function Error Rate"
  condition: functions.error_count > 50 per 5 minutes
  notification: email to dev-team@dualling.com
  
- name: "Firestore Read Quota Exceeded"
  condition: firestore.reads > 1_000_000 per day
  notification: slack channel #alerts
```

#### Log Analysis
```bash
# Search logs for errors
gcloud logging read "resource.type=cloud_function AND severity=ERROR" --limit 50

# Filter by specific function
gcloud logging read "resource.labels.function_name=sendEnrollmentEmail" --limit 20
```

---

### 9. **Cloud CDN**

#### Purpose
Cache static assets globally for faster delivery.

#### Cached Resources
- Course thumbnails
- Profile pictures
- Lesson videos (HLS segments)
- Static frontend assets (JS, CSS)

#### Configuration
- **Cache TTL:** 1 year for immutable assets (versioned filenames)
- **Cache Key:** Include query parameters for dynamic content
- **Invalidation:** Invalidate cache on content update

#### Benefits
- **Reduced latency:** Edge locations close to users
- **Lower egress costs:** Serve from cache instead of origin
- **Improved scalability:** Handle traffic spikes

---

### 10. **Firebase Analytics**

#### Purpose
Track user behavior and engagement.

#### Events Tracked
- `course_view` - User views course details
- `course_enroll` - User enrolls in course
- `lesson_start` - User starts a lesson
- `lesson_complete` - User completes a lesson
- `quiz_attempt` - User attempts a quiz
- `search` - User searches for courses
- `sign_up` - User creates account
- `login` - User logs in

#### Implementation
```typescript
import { logEvent } from 'firebase/analytics';

// Track course enrollment
logEvent(analytics, 'course_enroll', {
  course_id: courseId,
  course_name: courseName,
  course_price: coursePrice,
  currency: 'USD'
});
```

#### Dashboards
- **User Engagement:** DAU, MAU, session duration
- **Conversion Funnel:** View → Enroll → Complete
- **Revenue Tracking:** Course purchases, subscription revenue

---

## 🔄 Data Flow Examples

### Example 1: User Enrolls in a Course

1. **Frontend:** User clicks "Enroll" button
2. **API Route:** `POST /api/enrollment` with `{ courseId }`
3. **Validation:** Check if user is authenticated (Firebase Auth token)
4. **Firestore Write:** Create enrollment document
5. **Cloud Function Trigger:** `sendEnrollmentEmail` function fires
6. **Email Sent:** SendGrid/Mailgun sends confirmation email
7. **Analytics:** Log `course_enroll` event
8. **Frontend Update:** Real-time listener updates UI

### Example 2: Teacher Uploads Lesson Video

1. **Frontend:** Teacher uploads video via drag-and-drop
2. **Firebase Storage:** Upload video to `courses/{courseId}/lessons/{lessonId}/video.mp4`
3. **Cloud Function Trigger:** `onVideoUploaded` fires
4. **Cloud Task:** Queue video processing task (transcode to HLS)
5. **Processing:** Generate multiple resolutions (360p, 720p, 1080p)
6. **Storage:** Save processed videos back to Storage
7. **Firestore Update:** Update lesson document with video URLs
8. **Frontend Notification:** Show "Video processed successfully"

---

## 🛠️ Development Workflow

### Local Development

#### 1. Firebase Emulator Suite
```bash
# Start all emulators
firebase emulators:start

# Available at:
# - Firestore: localhost:8080
# - Auth: localhost:9099
# - Storage: localhost:9199
# - Functions: localhost:5001
```

#### 2. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_ADMIN_PRIVATE_KEY=...
```

#### 3. Testing
```bash
# Run unit tests
npm run test

# Run integration tests with emulators
npm run test:integration
```

---

### Deployment Pipeline

#### Stage 1: Local Testing
```bash
# Test locally with emulators
npm run dev
firebase emulators:start
```

#### Stage 2: Staging Deployment
```bash
# Deploy to staging project
firebase use staging
firebase deploy

# Deploy specific services
firebase deploy --only hosting,firestore
```

#### Stage 3: Production Deployment
```bash
# Deploy to production
firebase use production
firebase deploy

# Gradual rollout (optional)
# Use Vercel/Firebase Hosting traffic splitting
```

---

## 💰 Cost Monitoring & Optimization

### Daily Cost Tracking
```bash
# Check current month's spending
gcloud billing accounts list
gcloud billing budgets list

# Set budget alert
gcloud billing budgets create --billing-account=ACCOUNT_ID \
  --display-name="Monthly Budget" \
  --budget-amount=90EUR \
  --threshold-rule=percent=80,basis=current-spend
```

### Optimization Strategies
1. **Firestore:**
   - Use `limit()` on all queries
   - Implement pagination
   - Cache frequently accessed documents client-side

2. **Storage:**
   - Compress images (WebP, AVIF)
   - Use lifecycle policies to delete old versions
   - Enable CDN caching

3. **Functions:**
   - Minimize cold starts (use min instances for critical functions)
   - Optimize memory allocation (default is 256MB)
   - Use Pub/Sub for fan-out patterns

---

## 🔗 Related Documents

- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [MongoDB to Firestore Mapping](./MONGODB_TO_FIRESTORE_MAPPING.md)
- [Firestore Security Rules](./FIRESTORE_SECURITY_RULES.md)
- [Current Architecture Overview](./CURRENT_ARCHITECTURE.md)

---

**Document Owner:** ZenType Architect (J)  
**Next Review:** Post-Phase 6 (Advanced Features implementation)
