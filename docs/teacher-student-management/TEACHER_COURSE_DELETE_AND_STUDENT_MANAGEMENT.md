# Teacher Course Delete & Student Management Feature - Scope of Work

**Status:** 📋 **SCOPE DEFINED - READY FOR IMPLEMENTATION**  
**Created:** October 26, 2025  
**Branch:** `feature/teacher-course-editing` (or new branch)  
**Related:** [TEACHER_COURSE_EDITING_COMPLETE_SUMMARY.md](./TEACHER_COURSE_EDITING_COMPLETE_SUMMARY.md)

---

## 🎯 Executive Summary

Implementing two critical teacher dashboard features:
1. **Course Deletion** - Enable delete button functionality on teacher dashboard course cards
2. **Student Management** - Allow teachers to view and remove students from their courses

**Scope Verification:** Both features align with existing architecture and will not disrupt current functionality.

---

## 📚 IKB Research Summary

### Existing Infrastructure (Confirmed Working)
✅ **DELETE API exists** - `/app/api/courses/[id]/route.ts` (lines 235-302)
- Firebase Auth required
- Teacher role verification
- Ownership validation
- Safety check: prevents deletion if enrollments exist
- Status: **READY TO USE** (just needs frontend connection)

✅ **Enrollment System exists** - Complete with:
- `EnrollmentRepository` - CRUD operations for enrollments
- `EnrollmentService` - Business logic for enrollments
- `getCourseEnrollments(courseId, teacherId)` - Already implemented!
- `delete()` method - Already implemented!
- Status: **BACKEND READY** (needs API endpoint + frontend)

✅ **Course Service** - `deleteCourse()` method fully implemented with safety checks

### Current Teacher Dashboard State
- **Delete Button:** EXISTS but not wired (no onClick handler)
- **Students Tab:** Shows enrollment count but no student list/management
- **Course Edit Page:** Has "Enrolled Students" display (read-only)

---

## 🔧 Feature 1: Course Deletion

### Current State
**Location:** `/app/teacher/dashboard/page.tsx` (line 410)
```tsx
<Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200">
  <Trash2 className="h-4 w-4" />
</Button>
```
**Issue:** No `onClick` handler, button does nothing

### Implementation Plan

#### Step 1: Add Delete Handler to Dashboard Component
**File:** `/app/teacher/dashboard/page.tsx`

**Add State:**
```tsx
const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null)
```

**Add Handler Function:**
```tsx
const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
  // Confirmation dialog
  const confirmed = confirm(
    `Are you sure you want to delete "${courseTitle}"?\n\n` +
    `This action cannot be undone. The course and all its lessons will be permanently deleted.\n\n` +
    `Note: You cannot delete courses with active enrollments.`
  )
  
  if (!confirmed) return

  setDeletingCourseId(courseId)

  try {
    const response = await fetch(`/api/courses/${courseId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle specific error cases
      if (data.error?.includes('enrollments')) {
        toast({
          title: "Cannot Delete Course",
          description: "This course has active enrollments. Unpublish it first to prevent new enrollments.",
          variant: "destructive",
        })
      } else {
        throw new Error(data.error || 'Failed to delete course')
      }
      return
    }

    // Success - remove from local state
    setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId))
    
    // Update stats
    setStats(prevStats => ({
      ...prevStats,
      totalCourses: prevStats.totalCourses - 1,
      publishedCourses: prevStats.publishedCourses - (courses.find(c => c.id === courseId)?.isPublished ? 1 : 0),
    }))

    toast({
      title: "Course Deleted",
      description: `"${courseTitle}" has been permanently deleted`,
    })
  } catch (error: any) {
    console.error('Delete course error:', error)
    toast({
      title: "Error",
      description: error.message || "Failed to delete course",
      variant: "destructive",
    })
  } finally {
    setDeletingCourseId(null)
  }
}
```

**Update Button:**
```tsx
<Button 
  variant="outline" 
  size="sm" 
  className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200"
  onClick={(e) => {
    e.preventDefault()
    e.stopPropagation()
    handleDeleteCourse(course.id, course.title)
  }}
  disabled={deletingCourseId === course.id}
>
  {deletingCourseId === course.id ? (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
  ) : (
    <Trash2 className="h-4 w-4" />
  )}
</Button>
```

#### Testing Checklist
- [ ] Click delete on course with NO enrollments → Success
- [ ] Click delete on course WITH enrollments → Error toast displayed
- [ ] Cancel confirmation dialog → No action taken
- [ ] Loading state shows during deletion
- [ ] Course card disappears from dashboard after successful delete
- [ ] Stats update correctly (totalCourses decrements)
- [ ] Toast notifications display correctly
- [ ] Playwright MCP verification with test course

---

## 🔧 Feature 2: Student Management

### Current State
**Issue:** No UI exists to view/manage enrolled students per course

### Implementation Plan

#### Step 1: Create New API Endpoint - Get Course Enrollments
**File:** `/app/api/courses/[id]/enrollments/route.ts` (NEW)

```typescript
/**
 * Course Enrollments API Routes
 * GET - Get all enrollments for a course (teacher only)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { EnrollmentService } from '@/lib/services/enrollment/enrollment.service';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const enrollmentService = new EnrollmentService();

/**
 * GET /api/courses/[id]/enrollments
 * Get all students enrolled in a course (teacher only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const spanId = traceLogger.startSpan('API', 'GET /api/courses/[id]/enrollments', { courseId });

  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing authorization header');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const teacherId = decodedToken.uid;

    // Verify user is a teacher
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Non-teacher attempted to access enrollments');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Only teachers can view enrollments' },
        { status: 403 }
      );
    }

    traceLogger.log('info', 'API', 'Fetching course enrollments', { courseId, teacherId });

    // getCourseEnrollments already verifies course ownership
    const enrollments = await enrollmentService.getCourseEnrollments(courseId, teacherId);

    traceLogger.log('success', 'API', 'Enrollments retrieved', { count: enrollments.length });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      data: {
        enrollments,
        totalStudents: enrollments.filter(e => e.status === 'active').length,
      },
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to get enrollments', { error: error.message });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    const statusCode = error.message.includes('Unauthorized') ? 403 :
                       error.message.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { success: false, error: error.message },
      { status: statusCode }
    );
  }
}
```

#### Step 2: Create API Endpoint - Remove Student from Course
**File:** `/app/api/courses/[id]/enrollments/[enrollmentId]/route.ts` (NEW)

```typescript
/**
 * Individual Enrollment API Routes
 * DELETE - Remove student from course (teacher only)
 */

import { type NextRequest, NextResponse } from 'next/server';
import { EnrollmentRepository } from '@/lib/services/enrollment/enrollment.repository';
import { CourseRepository } from '@/lib/services/course/course.repository';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { verifyIdToken } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const enrollmentRepo = new EnrollmentRepository();
const courseRepo = new CourseRepository();

/**
 * DELETE /api/courses/[id]/enrollments/[enrollmentId]
 * Remove a student from a course (teacher only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; enrollmentId: string }> }
) {
  const { id: courseId, enrollmentId } = await params;
  const spanId = traceLogger.startSpan('API', 'DELETE /api/courses/[id]/enrollments/[enrollmentId]', {
    courseId,
    enrollmentId,
  });

  try {
    // Verify Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      traceLogger.log('warn', 'API', 'Missing authorization header');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const teacherId = decodedToken.uid;

    // Verify user is a teacher
    if (decodedToken.role !== 'teacher') {
      traceLogger.log('warn', 'API', 'Non-teacher attempted to remove student');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Only teachers can remove students' },
        { status: 403 }
      );
    }

    // Verify course ownership
    const course = await courseRepo.getById(courseId);
    if (course.teacherId !== teacherId) {
      traceLogger.log('warn', 'API', 'Teacher attempted to remove student from another teacher\'s course');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'You can only remove students from your own courses' },
        { status: 403 }
      );
    }

    // Verify enrollment belongs to this course
    const enrollment = await enrollmentRepo.getById(enrollmentId);
    if (enrollment.courseId !== courseId) {
      traceLogger.log('warn', 'API', 'Enrollment does not belong to this course');
      traceLogger.endSpan(spanId, 'error');
      return NextResponse.json(
        { success: false, error: 'Invalid enrollment for this course' },
        { status: 400 }
      );
    }

    traceLogger.log('info', 'API', 'Removing student from course', {
      courseId,
      enrollmentId,
      studentName: enrollment.userName,
    });

    // Delete enrollment
    await enrollmentRepo.delete(enrollmentId);

    // Decrement course enrollment count
    await courseRepo.decrementEnrollmentCount(courseId);

    traceLogger.log('success', 'API', 'Student removed from course', {
      enrollmentId,
      studentName: enrollment.userName,
    });
    traceLogger.endSpan(spanId, 'success');

    return NextResponse.json({
      success: true,
      message: `${enrollment.userName} has been removed from the course`,
    });
  } catch (error: any) {
    traceLogger.log('error', 'API', 'Failed to remove student', { error: error.message });
    traceLogger.endSpan(spanId, 'error', { message: error.message });

    const statusCode = error.message.includes('Unauthorized') || error.message.includes('only') ? 403 :
                       error.message.includes('not found') ? 404 : 500;

    return NextResponse.json(
      { success: false, error: error.message },
      { status: statusCode }
    );
  }
}
```

#### Step 3: Add decrementEnrollmentCount Method to CourseRepository
**File:** `/lib/services/course/course.repository.ts`

**Add Method:**
```typescript
/**
 * Decrement enrollment count (when student is removed)
 */
async decrementEnrollmentCount(courseId: string): Promise<void> {
  const spanId = traceLogger.startSpan('Firestore', 'courses.decrementEnrollmentCount', {
    courseId,
  });

  try {
    traceLogger.log('info', 'Firestore', 'Decrementing enrollment count');

    const courseRef = this.collection.doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      throw new Error('Course not found');
    }

    const currentCount = courseDoc.data()?.enrollmentCount || 0;
    const newCount = Math.max(0, currentCount - 1); // Prevent negative counts

    await courseRef.update({
      enrollmentCount: newCount,
      updatedAt: Timestamp.now(),
    });

    traceLogger.log('success', 'Firestore', 'Enrollment count decremented', {
      oldCount: currentCount,
      newCount,
    });
    traceLogger.endSpan(spanId, 'success');
  } catch (error: any) {
    traceLogger.log('error', 'Firestore', 'Failed to decrement enrollment count', {
      error: error.message,
    });
    traceLogger.endSpan(spanId, 'error', { message: error.message });
    throw error;
  }
}
```

#### Step 4: Create Students Tab Component
**File:** `/app/teacher/course/edit/[id]/page.tsx` (MODIFY)

**Add New Section After Lessons Section:**

```tsx
{/* Students Section */}
<div className="bg-white rounded-lg border border-gray-200 p-6">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Enrolled Students</h2>
      <p className="text-sm text-gray-600 mt-1">
        Manage students enrolled in this course
      </p>
    </div>
    <Badge variant="secondary" className="text-base px-4 py-2">
      {enrolledStudents.length} {enrolledStudents.length === 1 ? 'Student' : 'Students'}
    </Badge>
  </div>

  {loadingStudents ? (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  ) : enrolledStudents.length === 0 ? (
    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Enrolled Yet</h3>
      <p className="text-sm text-gray-600">
        {course.isPublished 
          ? "Students will appear here once they enroll in your course" 
          : "Publish your course to allow students to enroll"}
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      {enrolledStudents.map((enrollment) => (
        <div
          key={enrollment.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Student Avatar */}
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-sm">
                {enrollment.userName.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Student Info */}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{enrollment.userName}</p>
              <p className="text-sm text-gray-600">{enrollment.userEmail}</p>
            </div>

            {/* Enrollment Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Progress</p>
                <p className="font-semibold text-gray-900">
                  {enrollment.progressPercentage}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Enrolled</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(enrollment.enrolledAt)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Status</p>
                <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                  {enrollment.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Remove Button */}
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-100 border-red-200"
            onClick={() => handleRemoveStudent(enrollment.id, enrollment.userName)}
            disabled={removingStudentId === enrollment.id}
          >
            {removingStudentId === enrollment.id ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Remove
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  )}
</div>
```

**Add State Variables:**
```tsx
const [enrolledStudents, setEnrolledStudents] = useState<Enrollment[]>([])
const [loadingStudents, setLoadingStudents] = useState(true)
const [removingStudentId, setRemovingStudentId] = useState<string | null>(null)
```

**Add Fetch Function:**
```tsx
const fetchEnrolledStudents = async () => {
  try {
    setLoadingStudents(true)
    
    const response = await fetch(`/api/courses/${courseId}/enrollments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch students')
    }

    const data = await response.json()
    setEnrolledStudents(data.data.enrollments || [])
  } catch (error: any) {
    console.error('Fetch students error:', error)
    toast({
      title: "Error",
      description: "Failed to load enrolled students",
      variant: "destructive",
    })
  } finally {
    setLoadingStudents(false)
  }
}
```

**Add Remove Handler:**
```tsx
const handleRemoveStudent = async (enrollmentId: string, studentName: string) => {
  const confirmed = confirm(
    `Remove ${studentName} from this course?\n\n` +
    `This will:\n` +
    `• Remove their enrollment\n` +
    `• Delete their progress data\n` +
    `• Prevent them from accessing course content\n\n` +
    `This action cannot be undone.`
  )

  if (!confirmed) return

  setRemovingStudentId(enrollmentId)

  try {
    const response = await fetch(`/api/courses/${courseId}/enrollments/${enrollmentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to remove student')
    }

    // Success - remove from local state
    setEnrolledStudents(prev => prev.filter(e => e.id !== enrollmentId))

    // Update course enrollment count
    setCourse(prev => prev ? {
      ...prev,
      enrollmentCount: Math.max(0, prev.enrollmentCount - 1),
    } : null)

    toast({
      title: "Student Removed",
      description: data.message || `${studentName} has been removed from the course`,
    })
  } catch (error: any) {
    console.error('Remove student error:', error)
    toast({
      title: "Error",
      description: error.message || "Failed to remove student",
      variant: "destructive",
    })
  } finally {
    setRemovingStudentId(null)
  }
}
```

**Add to useEffect:**
```tsx
useEffect(() => {
  if (courseId && token) {
    fetchCourse()
    fetchLessons()
    fetchEnrolledStudents() // NEW
  }
}, [courseId, token])
```

**Add Helper Function:**
```tsx
const formatDate = (timestamp: any): string => {
  if (!timestamp) return 'Unknown'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}
```

**Add Enrollment Type:**
```tsx
interface Enrollment {
  id: string
  userId: string
  courseId: string
  userName: string
  userEmail: string
  status: 'active' | 'completed' | 'dropped'
  enrolledAt: any
  progressPercentage: number
  completedLessonsCount: number
  totalLessonsCount: number
  lastAccessedAt: any
}
```

#### Testing Checklist
- [ ] Students section displays correct enrollment count
- [ ] Empty state shows when no students enrolled
- [ ] Student list displays with avatar, name, email
- [ ] Progress percentage displays correctly
- [ ] Enrolled date formats correctly
- [ ] Remove button shows confirmation dialog
- [ ] Cancel confirmation → no action
- [ ] Confirm removal → student removed from list
- [ ] Enrollment count decrements after removal
- [ ] Loading state shows during removal
- [ ] Toast notifications display correctly
- [ ] Only course owner can access this endpoint
- [ ] Playwright MCP verification with enrolled test students

---

## 🔒 Security Considerations

### Course Deletion
✅ **Firebase Auth Required** - Token verification in API
✅ **Role Verification** - Only teachers can delete
✅ **Ownership Validation** - Only course owner can delete
✅ **Safety Check** - Cannot delete courses with active enrollments
✅ **Confirmation Dialog** - Prevents accidental deletion

### Student Management
✅ **Firebase Auth Required** - Token verification in API
✅ **Role Verification** - Only teachers can view/remove students
✅ **Ownership Validation** - Only course owner can manage enrollments
✅ **Enrollment Validation** - Verifies enrollment belongs to course
✅ **Confirmation Dialog** - Prevents accidental student removal
✅ **Enrollment Count Sync** - Decrements count when student removed

---

## 📊 Data Flow Diagrams

### Course Deletion Flow
```
User clicks Delete → Confirmation Dialog → 
  Cancel → No action
  Confirm → DELETE /api/courses/[id] →
    → Verify token →
    → Check teacher role →
    → Check ownership →
    → Check enrollments →
      → Has enrollments → Error (400)
      → No enrollments → Delete course → Success (200) →
        → Remove from UI →
        → Update stats →
        → Show toast
```

### Student Removal Flow
```
User clicks Remove → Confirmation Dialog →
  Cancel → No action
  Confirm → DELETE /api/courses/[id]/enrollments/[enrollmentId] →
    → Verify token →
    → Check teacher role →
    → Check course ownership →
    → Verify enrollment belongs to course →
    → Delete enrollment →
    → Decrement course.enrollmentCount →
    → Success (200) →
      → Remove from student list →
      → Update enrollment count in UI →
      → Show toast
```

---

## 🧪 Testing Strategy

### Manual Testing with Playwright MCP
1. **Setup Test Environment:**
   - Create test course with 0 enrollments (for deletion test)
   - Create test course with 2 enrollments (for student management test)
   - Use test student accounts (test7@gmail.com, test13@gmail.com)

2. **Feature 1: Course Deletion**
   - Navigate to teacher dashboard
   - Attempt to delete course WITH enrollments → verify error toast
   - Unpublish course with enrollments
   - Remove all students
   - Attempt to delete course WITHOUT enrollments → verify success
   - Verify course card disappears
   - Verify stats update

3. **Feature 2: Student Management**
   - Navigate to course edit page
   - Verify students section displays
   - Verify student list shows all enrolled students
   - Click remove on one student
   - Verify confirmation dialog
   - Confirm removal
   - Verify student disappears from list
   - Verify enrollment count decrements
   - Navigate to student account
   - Verify student can no longer access course

### Screenshot Checklist
- [ ] Dashboard with delete button (before click)
- [ ] Delete confirmation dialog
- [ ] Error toast (course with enrollments)
- [ ] Success toast (course deleted)
- [ ] Students section with enrolled students
- [ ] Student list with progress/stats
- [ ] Remove confirmation dialog
- [ ] Success toast (student removed)
- [ ] Empty state (no students)

---

## 📝 File Changes Summary

### New Files
1. `/app/api/courses/[id]/enrollments/route.ts` - GET enrollments endpoint
2. `/app/api/courses/[id]/enrollments/[enrollmentId]/route.ts` - DELETE student endpoint

### Modified Files
1. `/app/teacher/dashboard/page.tsx` - Add delete handler + state
2. `/app/teacher/course/edit/[id]/page.tsx` - Add students section
3. `/lib/services/course/course.repository.ts` - Add decrementEnrollmentCount method

### Documentation Updates
1. `/docs/MAIN.md` - Add to Recent Changes Log
2. `/docs/TEACHER_COURSE_DELETE_AND_STUDENT_MANAGEMENT.md` - This file

---

## 🎯 Implementation Order

### Phase 1: Course Deletion (Estimated: 30 min)
1. ✅ Verify DELETE API working (already implemented)
2. Add delete handler to dashboard component
3. Wire up delete button
4. Add loading states
5. Test with Playwright MCP
6. Capture screenshots
7. Git commit: `feat: Enable course deletion on teacher dashboard`

### Phase 2: Student Management (Estimated: 1.5 hours)
1. Create GET enrollments API endpoint
2. Create DELETE student API endpoint
3. Add decrementEnrollmentCount method
4. Add students section to course edit page
5. Add fetch students function
6. Add remove student handler
7. Add loading/empty states
8. Test with Playwright MCP (enroll test students first)
9. Capture screenshots
10. Git commit: `feat: Add student management to teacher course editor`

### Phase 3: Documentation & Testing (Estimated: 30 min)
1. Update MAIN.md with feature summary
2. Create complete implementation summary document
3. Full E2E testing with Playwright MCP
4. User approval
5. Final commit

**Total Estimated Time:** 2.5 hours

---

## ✅ Pre-Implementation Checklist

- [x] IKB consulted (MAIN.md reviewed)
- [x] Existing APIs verified (DELETE course, enrollment methods)
- [x] Current UI state documented (delete button exists, students section missing)
- [x] Security considerations documented
- [x] Data flow diagrams created
- [x] Testing strategy defined
- [x] File changes listed
- [x] Implementation order established
- [x] No conflicts with existing features identified
- [x] Scope aligns with user request

---

## 🚨 Risk Assessment

### Low Risk
✅ DELETE API already exists and working
✅ Enrollment service already has all required methods
✅ Changes are additive (no modifications to existing core functionality)
✅ Similar patterns already implemented in codebase

### Medium Risk
⚠️ Student removal affects enrollment count sync
  - **Mitigation:** Use transaction-like pattern with decrementEnrollmentCount
  - **Rollback:** Re-create enrollment if decrement fails (not implemented yet)

### Zero Risk
✅ No database schema changes required
✅ No breaking changes to existing APIs
✅ No changes to authentication/authorization logic

---

## 📚 Related Documentation

- [TEACHER_COURSE_EDITING_COMPLETE_SUMMARY.md](./TEACHER_COURSE_EDITING_COMPLETE_SUMMARY.md) - Previous editing features
- [API_VERIFICATION_REPORT.md](./API_VERIFICATION_REPORT.md) - API endpoint inventory
- [PHASE_3_STATUS_AND_TESTING.md](./PHASE_3_STATUS_AND_TESTING.md) - Phase 3 progress
- [MAIN.md](./MAIN.md) - Project-wide changelog

---

**Created by:** ZenType Architect  
**Date:** October 26, 2025  
**Status:** 📋 SCOPE DEFINED - AWAITING IMPLEMENTATION APPROVAL

---

## 🎓 Implementation Notes

### Why No New Service Methods?
The `EnrollmentService` already has `getCourseEnrollments()` which verifies ownership and returns all enrollments. We can call the repository directly for deletion since the API endpoint already handles all auth/validation logic.

### Why Separate API Endpoints?
Following RESTful conventions:
- `GET /api/courses/[id]/enrollments` - List all (collection)
- `DELETE /api/courses/[id]/enrollments/[enrollmentId]` - Remove one (resource)

This is more intuitive than using query params and allows for future expansion (e.g., `GET /api/courses/[id]/enrollments/[enrollmentId]` for individual enrollment details).

### Why decrementEnrollmentCount?
Course deletion already uses `deleteCourse()` which checks enrollment count. When we remove a student, we need to keep this count accurate for the deletion safety check to work correctly.
