# Lesson Management System - Firebase Implementation

**Status:** ✅ **COMPLETE**  
**Last Updated:** October 17, 2025  
**Migration Phase:** Phase 3 - Week 1.5

---

## Overview

The lesson management system allows teachers to create, read, update, and delete lessons for their courses. This document covers the complete Firebase-based implementation after MongoDB removal.

---

## Architecture

### Data Model

Lessons are stored in Firestore under the `lessons` collection with the following structure:

```typescript
interface Lesson {
  id: string;                                    // Firestore document ID
  courseId: string;                              // Reference to parent course
  title: string;                                 // Lesson title
  type: 'video' | 'reading' | 'quiz' | 'exercise'; // Lesson type
  order: number;                                 // Display order
  description?: string;                          // Optional description
  isPublished: boolean;                          // Publication status
  createdAt: Date;                              // Creation timestamp
  updatedAt: Date;                              // Last update timestamp
  
  // Type-specific content
  content?: {
    text?: string;                               // For reading lessons
    videoUrl?: string;                           // For video lessons
    questions?: QuizQuestion[];                  // For quiz lessons
  };
}
```

### Key Changes from MongoDB

| MongoDB Schema | Firestore Schema | Notes |
|---------------|------------------|-------|
| `_id: ObjectId` | `id: string` | Firestore auto-generates IDs |
| `lessons: []` in Course | Separate `lessons` collection | Normalized structure |
| `type: "text"` | `type: "reading"` | Renamed for clarity |
| Nested in course document | Standalone collection | Better scalability |

---

## API Endpoints

### 1. GET /api/courses/[id]/lessons

**Purpose:** Fetch all lessons for a course  
**Authentication:** None (public access for published courses)  
**Response:**
```typescript
{
  success: true,
  lessons: Lesson[],
  count: number
}
```

**Implementation:** `app/api/courses/[id]/lessons/route.ts`

### 2. POST /api/courses/[id]/lessons

**Purpose:** Create a new lesson  
**Authentication:** Required (Firebase ID Token, Teacher role)  
**Request Body:**
```typescript
{
  title: string;              // Min 3 characters
  type: 'video' | 'reading' | 'quiz' | 'exercise';
  description?: string;       // Min 10 characters
  order: number;             // Positive integer
  content?: {
    text?: string;
    videoUrl?: string;
    questions?: QuizQuestion[];
  };
}
```

**Authorization Flow:**
1. Extract Bearer token from Authorization header
2. Verify token with Firebase Admin SDK
3. Check user role === 'teacher'
4. Verify user owns the course
5. Create lesson in Firestore

**Response:**
```typescript
{
  success: true,
  message: 'Lesson added successfully',
  lesson: Lesson
}
```

### 3. PUT /api/courses/[id]/lessons/[lessonId]

**Purpose:** Update an existing lesson  
**Authentication:** Required (Firebase ID Token, Teacher role)  
**Authorization:** Same as POST - teacher must own the course  
**Request Body:** Same as POST (all fields optional)

### 4. DELETE /api/courses/[id]/lessons/[lessonId]

**Purpose:** Delete a lesson  
**Authentication:** Required (Firebase ID Token, Teacher role)  
**Authorization:** Same as POST - teacher must own the course

---

## Frontend Components

### Course Edit Page

**Location:** `app/teacher/course/edit/[id]/page.tsx`

**Key Features:**
- Displays list of existing lessons with order numbers
- Edit button opens modal with pre-filled lesson data
- Delete button with confirmation dialog
- Add lesson button for new lessons
- Real-time lesson count display

**State Management:**
```typescript
const [course, setCourse] = useState<CourseData | null>(null);
const [lessons, setLessons] = useState<Lesson[]>([]);
const [showLessonModal, setShowLessonModal] = useState(false);
const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
```

**Data Fetching:**
```typescript
// Parallel fetch for performance
const [courseResponse, lessonsResponse] = await Promise.all([
  fetch(`/api/courses/${courseId}`),
  fetch(`/api/courses/${courseId}/lessons`)
]);
```

### Lesson Modal Component

**Location:** `components/teacher/lesson-modal.tsx`

**Key Features:**
- Supports both create and edit modes
- Type-specific content fields (text, video URL, quiz questions)
- Form validation with Zod schema
- Firebase token authentication
- Uses existing dialog design system

**Props:**
```typescript
interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
  courseId: string;
  lesson?: Lesson | null;  // null for create, Lesson for edit
  token: string | null;     // Firebase ID token
}
```

**Design System Integration:**
- Uses `Dialog` component from `components/ui/dialog.tsx`
- Follows existing theme colors (white mode only)
- No custom styling - relies on global CSS variables
- Consistent with rest of application UI

---

## Authentication Implementation

### Token Flow

1. **Frontend obtains token:**
   ```typescript
   const { token } = useAuth(); // From Firebase Auth context
   ```

2. **Token sent in request:**
   ```typescript
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${token}`
   }
   ```

3. **Backend verification:**
   ```typescript
   import { verifyIdToken } from '@/lib/firebase/admin';
   
   const authHeader = request.headers.get('Authorization');
   if (!authHeader?.startsWith('Bearer ')) {
     throw new Error('Unauthorized: Missing or invalid token');
   }
   
   const token = authHeader.substring(7);
   const decodedToken = await verifyIdToken(token);
   const teacherId = decodedToken.uid;
   
   if (decodedToken.role !== 'teacher') {
     throw new Error('Unauthorized: Teacher access required');
   }
   ```

### Security Rules

**Firestore Rules:**
```javascript
match /lessons/{lessonId} {
  // Anyone can read published lessons
  allow read: if resource.data.isPublished == true;
  
  // Only authenticated teachers can read unpublished lessons
  allow read: if request.auth != null && 
              request.auth.token.role == 'teacher' &&
              get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.teacherId == request.auth.uid;
  
  // Only course owner can create/update/delete
  allow write: if request.auth != null && 
               request.auth.token.role == 'teacher' &&
               get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.teacherId == request.auth.uid;
}
```

---

## Service Layer

**Location:** `lib/services/course/course.service.ts`

**Key Methods:**

### `addLesson(courseId, teacherId, lessonData)`
- Validates teacher owns course
- Creates lesson in Firestore with auto-generated ID
- Increments course `lessonsCount` field
- Returns created lesson with ID

### `updateLesson(courseId, lessonId, teacherId, updates)`
- Validates teacher owns course
- Updates lesson document in Firestore
- Updates `updatedAt` timestamp
- Returns updated lesson

### `deleteLesson(courseId, lessonId, teacherId)`
- Validates teacher owns course
- Deletes lesson document
- Decrements course `lessonsCount` field
- Handles cleanup of related data

### `getCourseLessons(courseId, publishedOnly)`
- Queries lessons collection by courseId
- Filters by publication status if needed
- Sorts by order field
- Returns array of lessons

---

## Migration Notes

### Removed MongoDB Dependencies

The following files are now **obsolete** and can be safely deleted:
- `lib/mongodb.ts` - MongoDB client connection
- `lib/models/Course.ts` - Mongoose course schema
- `lib/models/Progress.ts` - Mongoose progress schema
- `lib/services/progressService.ts` - MongoDB-based progress tracking

**Note:** These files are no longer imported anywhere in the codebase. Firebase services have completely replaced them.

### Breaking Changes

1. **Lesson ID field:**
   - Old: `_id` (MongoDB ObjectId)
   - New: `id` (Firestore string)

2. **Lesson types:**
   - Old: `"text" | "quiz" | "video"`
   - New: `"reading" | "quiz" | "video" | "exercise"`

3. **Course structure:**
   - Old: Lessons embedded in course document
   - New: Lessons in separate collection with `courseId` reference

4. **Enrollment count:**
   - Old: `enrolledStudents: string[]` (array of user IDs)
   - New: `enrollmentCount: number` (denormalized count)

---

## Testing Checklist

- [x] Create new lesson as teacher
- [x] Edit existing lesson as teacher
- [x] Delete lesson as teacher
- [x] View lessons list on course edit page
- [x] Lessons display with correct type labels
- [x] Authentication blocks non-teachers
- [x] Authorization blocks non-course-owners
- [x] Modal opens with existing lesson data
- [x] Modal uses existing design system
- [x] Parallel fetch improves page load time
- [x] Lesson count updates correctly
- [x] Order numbers display correctly

---

## Known Issues

None currently. System is fully functional with Firebase.

---

## Future Enhancements

1. **Drag-and-drop reordering** - Allow teachers to reorder lessons visually
2. **Lesson preview** - Preview lesson as student would see it
3. **Rich text editor** - Enhanced content editing for reading lessons
4. **Video upload** - Direct video upload to Cloud Storage instead of URL
5. **Quiz builder** - Visual quiz question builder with templates
6. **Lesson analytics** - Track completion rates and time spent

---

## Related Documentation

- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [MongoDB to Firestore Mapping](./MONGODB_TO_FIRESTORE_MAPPING.md)
- [Firebase Auth System](./FIREBASE_AUTH_SYSTEM.md)
- [Course Management System](./COURSE_MANAGEMENT_SYSTEM.md) *(to be created)*
- [Debug System](./DEBUG_SYSTEM.md)
