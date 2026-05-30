# Teacher Course Editing - Phase 2 & 3 Implementation Scope

**Status:** 🚀 **IN PROGRESS**  
**Created:** October 25, 2025  
**Branch:** `feature/teacher-course-editing`  
**Phase 1 Status:** ✅ COMPLETE (Course metadata editing)

---

## 📋 User Requirements Summary

From user request:
1. ✅ **Quiz Editing Already Working** - User confirmed quiz questions can be edited
2. 🔲 **Add Preview Button** - Allow teachers to preview course from student perspective
3. 🔲 **Lesson Reordering** - Drag-and-drop or up/down buttons to reorder lessons
4. 🔲 **Verify Quiz Builder** - Check if quiz editing component needs any fixes

---

## 🎯 Implementation Scope

### Task 1: Add Course Preview Feature
**Priority:** HIGH  
**Estimated Time:** 45 minutes

**Requirements:**
- Add "Preview Course" button on course edit page
- Opens course preview page in new tab (student view)
- Uses existing `/course/[id]` page (public course preview)
- Shows all lessons, enrollment button, course metadata
- Teacher can see exactly what students will see

**Implementation:**
```tsx
// Add to /app/teacher/course/edit/[id]/page.tsx
<Button
  variant="outline"
  onClick={() => window.open(`/course/${courseId}`, '_blank')}
>
  <Eye className="h-4 w-4 mr-2" />
  Preview as Student
</Button>
```

**Files to Modify:**
- `/app/teacher/course/edit/[id]/page.tsx` - Add preview button

**Testing:**
- Click preview button
- Verify new tab opens with course preview
- Verify all course data displays correctly
- Verify lessons list matches edit page
- Verify enrollment button visible (for non-enrolled preview)

---

### Task 2: Lesson Reordering Functionality
**Priority:** HIGH  
**Estimated Time:** 90 minutes

**Requirements:**
- Add up/down arrow buttons next to each lesson
- Allow teachers to move lessons up or down in order
- Optimistic UI update (instant visual feedback)
- Save new order to backend via API
- Prevent moving first lesson up or last lesson down

**Implementation Approach:**
1. Add up/down buttons to lesson list items
2. Implement `handleMoveUp` and `handleMoveDown` functions
3. Update local state immediately (optimistic)
4. Call new API endpoint: `PUT /api/courses/[id]/lessons/reorder`
5. Handle errors with rollback

**API Endpoint:**
```typescript
// POST /api/courses/[id]/lessons/reorder
// Request body: { lessonId: string, newOrder: number }
// Updates lesson.order and shifts other lessons
```

**Files to Create:**
- `/app/api/courses/[id]/lessons/reorder/route.ts` - Reorder endpoint

**Files to Modify:**
- `/app/teacher/course/edit/[id]/page.tsx` - Add reorder buttons and logic
- `/lib/services/course/course.service.ts` - Add reorderLesson method

**Testing:**
- Create course with 3+ lessons
- Move lesson 3 up (should become lesson 2)
- Move lesson 1 down (should become lesson 2)
- Verify order persists after page reload
- Verify no gaps in order numbers

---

### Task 3: Verify & Enhance Quiz Question Builder
**Priority:** MEDIUM  
**Estimated Time:** 30 minutes

**Current State:**
- Quiz question builder EXISTS in `/components/teacher/lesson-modal.tsx`
- Supports: question text, 4 options, correct answer selection, explanation
- User confirmed: "already editing even existing questions after editing"

**Verification Steps:**
1. Test creating new quiz lesson with multiple questions
2. Test editing existing quiz lesson
3. Test deleting quiz questions
4. Verify all fields save to Firestore correctly
5. Verify quiz questions display in lesson player

**Potential Enhancements (if issues found):**
- Add question type dropdown (multiple_choice, true_false, fill_blank)
- Add points per question field
- Add drag-and-drop question reordering
- Add question ID field (UUID) for tracking
- Add passing score threshold at lesson level

**Files to Review:**
- `/components/teacher/lesson-modal.tsx` - Quiz builder component
- `/app/api/courses/[id]/lessons/route.ts` - Lesson create/update API
- `/lib/types/course.types.ts` - QuizQuestion interface

**Testing:**
- Create quiz lesson with 3 questions
- Edit quiz lesson, modify question 2
- Delete question 3
- Save and verify Firestore data structure
- Play lesson as student, verify quiz displays correctly

---

## ✅ Implementation Checklist

### Phase 2: Preview & Reordering

#### Preview Feature
- [ ] Add "Preview as Student" button to course edit page
- [ ] Button opens `/course/[courseId]` in new tab
- [ ] Verify preview shows all course metadata
- [ ] Verify preview shows all lessons
- [ ] Test with published and draft courses

#### Lesson Reordering
- [ ] Add up/down arrow buttons to lesson list
- [ ] Implement `handleMoveUp` function
- [ ] Implement `handleMoveDown` function
- [ ] Create reorder API endpoint
- [ ] Add `reorderLesson` method to CourseService
- [ ] Implement optimistic UI updates
- [ ] Add error handling with rollback
- [ ] Disable up button on first lesson
- [ ] Disable down button on last lesson
- [ ] Test with 3+ lessons
- [ ] Verify order persistence after reload

#### Quiz Builder Verification
- [ ] Test creating new quiz lesson
- [ ] Test editing existing quiz lesson
- [ ] Test deleting quiz questions
- [ ] Verify Firestore data structure
- [ ] Verify quiz displays correctly in lesson player
- [ ] Document any issues found
- [ ] Implement fixes if needed

---

## 🧪 Testing Plan with Playwright MCP

### Test Scenario 1: Preview Course Feature
1. Login as test21@test.com (teacher)
2. Navigate to course edit page
3. Click "Preview as Student" button
4. Verify new tab opens
5. Verify course title, description, metadata visible
6. Verify lessons list displays
7. Verify enrollment button present
8. Close preview tab
9. Take screenshot for documentation

### Test Scenario 2: Lesson Reordering
1. Login as test21@test.com (teacher)
2. Navigate to course with 3+ lessons
3. Note initial lesson order
4. Click "Move Down" on Lesson 1
5. Verify Lesson 1 becomes Lesson 2
6. Verify former Lesson 2 becomes Lesson 1
7. Click "Move Up" on Lesson 3
8. Verify Lesson 3 becomes Lesson 2
9. Reload page
10. Verify new order persisted
11. Take screenshot showing reorder buttons

### Test Scenario 3: Quiz Question Editing
1. Login as test21@test.com (teacher)
2. Navigate to course edit page
3. Click "Add Lesson" → Select "Quiz"
4. Add quiz question with 4 options
5. Mark correct answer
6. Add explanation
7. Add second quiz question
8. Save lesson
9. Click "Edit" on quiz lesson
10. Modify question 1 text
11. Delete question 2
12. Add new question 3
13. Save changes
14. Verify all changes in Firestore
15. Play lesson as student to verify quiz works

---

## 🚨 Critical Constraints

### System Integrity (99% Certainty Rule)
- **DO NOT break existing course editing functionality**
- **DO NOT break existing lesson creation/editing**
- **DO NOT modify published courses without teacher confirmation**
- **DO NOT allow invalid lesson orders (gaps, duplicates)**

### Data Integrity
- **Lesson order must be sequential (1, 2, 3, no gaps)**
- **Reordering must update ALL affected lessons atomically**
- **Quiz questions must maintain structure on edit**
- **Preview mode must be read-only (no accidental changes)**

### UI/UX Requirements
- **Preview opens in NEW TAB (don't lose edit page context)**
- **Reorder buttons must have visual disabled states**
- **Optimistic updates with error rollback**
- **Loading states during save operations**

---

## 📊 Success Criteria

### Functional Requirements
- [ ] Preview button opens course in new tab
- [ ] Preview shows accurate student view
- [ ] Lesson reordering works without errors
- [ ] Lesson order persists after reload
- [ ] Quiz editing maintains data integrity
- [ ] No regressions in existing features

### User Experience
- [ ] Preview button clearly labeled and discoverable
- [ ] Reorder buttons intuitive (up/down arrows)
- [ ] Instant visual feedback on reorder
- [ ] Error messages helpful and specific
- [ ] Loading states prevent duplicate actions

### Quality Assurance
- [ ] Zero TypeScript errors
- [ ] Zero runtime console errors
- [ ] All Playwright tests pass
- [ ] Firestore data structure valid
- [ ] No duplicate lesson orders
- [ ] No orphaned lessons

---

## 📁 File Structure

### New Files
```
app/
  api/
    courses/
      [id]/
        lessons/
          reorder/
            route.ts              # NEW: Lesson reorder endpoint
```

### Modified Files
```
app/
  teacher/
    course/
      edit/
        [id]/
          page.tsx                # Add preview button + reorder UI

lib/
  services/
    course/
      course.service.ts           # Add reorderLesson method

components/
  teacher/
    lesson-modal.tsx              # Verify quiz builder (no changes expected)
```

---

## 🔧 Technical Implementation Details

### Lesson Reordering Algorithm

**Scenario: Move Lesson 3 Up (order 3 → 2)**
```typescript
// Current state: [1, 2, 3, 4]
// Move lesson 3 up
// Expected: [1, 3, 2, 4]

async function reorderLesson(courseId: string, lessonId: string, direction: 'up' | 'down') {
  const lessons = await getLessons(courseId);
  const currentLesson = lessons.find(l => l.id === lessonId);
  const currentOrder = currentLesson.order;
  
  if (direction === 'up' && currentOrder === 1) return; // Can't move up
  if (direction === 'down' && currentOrder === lessons.length) return; // Can't move down
  
  const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
  const swapLesson = lessons.find(l => l.order === newOrder);
  
  // Swap orders in Firestore (transaction)
  await db.runTransaction(async (transaction) => {
    transaction.update(lessonRef(lessonId), { order: newOrder });
    transaction.update(lessonRef(swapLesson.id), { order: currentOrder });
  });
}
```

### Preview Button Implementation

```tsx
// Add to course edit page header
<div className="flex gap-2">
  <Button
    variant="outline"
    onClick={() => {
      const previewUrl = `/course/${courseId}`;
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }}
  >
    <Eye className="h-4 w-4 mr-2" />
    Preview as Student
  </Button>
  
  <Button onClick={handleSaveCourse}>
    Save Changes
  </Button>
</div>
```

---

## 📝 Implementation Notes

### Order Reassignment Strategy
When reordering, we have two options:
1. **Swap approach:** Swap order with adjacent lesson (simple, fast)
2. **Shift approach:** Shift all lessons between old and new position (complex, atomic)

**Decision:** Use **swap approach** for simplicity and performance.

### Quiz Builder Status
User confirmed: "already editing even existing questions after editing, the question I was able to see"
- This means quiz editing IS working
- Focus on verification, not reimplementation
- Only fix if bugs found during testing

### Preview Mode Considerations
- Preview uses existing public course page
- No special "preview mode" needed
- Teacher will see "Enroll Now" button (if not already enrolled)
- This is acceptable - shows true student experience

---

## 🔗 Related Documentation

- [TEACHER_COURSE_EDITING_FEATURE.md](./TEACHER_COURSE_EDITING_FEATURE.md) - Phase 1 implementation
- [LESSON_MANAGEMENT_SYSTEM.md](./LESSON_MANAGEMENT_SYSTEM.md) - Existing lesson CRUD
- [API_VERIFICATION_REPORT.md](./API_VERIFICATION_REPORT.md) - API endpoint inventory

---

**Created by:** ZenType Architect  
**Date:** October 25, 2025  
**Status:** Ready for implementation  
**Estimated Total Time:** 2-3 hours
