# Teacher Course Editing Feature - Implementation Guide

**Status:** 🚀 **IN PROGRESS**  
**Created:** October 25, 2025  
**Branch:** `feature/teacher-course-editing`  
**Priority:** HIGH - Teacher Experience Enhancement

---

## 📋 Executive Summary

Implement comprehensive course editing capabilities for teachers, allowing them to view and modify ALL aspects of courses they created (manually or via AI chatbot). This feature empowers teachers to fix mistakes, refine content, and maintain quality control over their courses.

**Goal:** Enable teachers to edit every field of their courses and lessons with real-time database updates upon saving in the UI.

---

## 🎯 Scope of Work

### Phase 1: Course Metadata Editing (Expansion)
- [x] **ALREADY EXISTS:** Title, Description editing
- [ ] Add Language selection (language, targetLanguage)
- [ ] Add Level selection (beginner, intermediate, advanced)
- [ ] Add Estimated Hours field
- [ ] Add Thumbnail URL field
- [ ] Add publish/unpublish toggle

### Phase 2: Lesson Content Editing (Full CRUD)
- [x] **ALREADY EXISTS:** Basic lesson create/edit/delete
- [ ] Enhance lesson modal with ALL fields
- [ ] Add video metadata fields (thumbnail, duration, creator attribution)
- [ ] Add reading content markdown editor
- [ ] Add quiz question builder with full controls
- [ ] Add lesson reordering (drag-and-drop or up/down buttons)
- [ ] Add lesson publish/unpublish toggle

### Phase 3: Quiz Question Editor
- [ ] Visual quiz builder interface
- [ ] Add/edit/delete questions
- [ ] Question type selection (multiple_choice, true_false, fill_blank)
- [ ] Options management (for multiple choice)
- [ ] Correct answer selection
- [ ] Explanation field
- [ ] Points assignment
- [ ] Passing score threshold

### Phase 4: UI/UX Enhancements
- [ ] Real-time validation feedback
- [ ] Unsaved changes warning
- [ ] Bulk operations (delete multiple lessons)
- [ ] Course preview mode (view as student)
- [ ] Inline editing for quick changes

### Phase 5: Testing & Verification
- [ ] Test all course fields update correctly
- [ ] Test all lesson fields update correctly
- [ ] Test quiz question CRUD operations
- [ ] Verify Firestore data persistence
- [ ] Playwright MCP end-to-end testing

---

## ✅ Implementation Checklist

### Backend API Updates

#### Course API Enhancements
- [x] `PUT /api/courses/[id]` supports title, description
- [ ] Expand `updateCourseSchema` in `/app/api/courses/[id]/route.ts` to accept:
  - `language`, `targetLanguage`
  - `level`
  - `estimatedHours`
  - `thumbnailUrl`
- [x] `UpdateCourseData` type already includes these fields
- [ ] Add `POST /api/courses/[id]/publish` route (or update existing)
- [ ] Add `POST /api/courses/[id]/unpublish` route

#### Lesson API Enhancements
- [x] `POST /api/courses/[id]/lessons` exists
- [x] `PUT /api/courses/[id]/lessons/[lessonId]` exists
- [x] `DELETE /api/courses/[id]/lessons/[lessonId]` exists
- [ ] Expand lesson schema to accept ALL fields:
  - `videoUrl`, `videoThumbnail`, `duration`
  - `contentMarkdown` (for reading lessons)
  - `quizQuestions[]` (array of quiz questions)
  - `passingScore`
  - `isPublished`
- [ ] Add `PUT /api/courses/[id]/lessons/reorder` for bulk order updates

#### Quiz Question Validation
- [ ] Create Zod schema for QuizQuestion validation
- [ ] Validate question types (multiple_choice, true_false, fill_blank)
- [ ] Validate options array (required for multiple_choice)
- [ ] Validate correctAnswer format
- [ ] Validate points (positive number)

### Frontend Component Updates

#### Course Edit Page (`/app/teacher/course/edit/[id]/page.tsx`)
- [x] Title, Description editing exists
- [ ] Add Language dropdown (language: en/lt, targetLanguage: en/lt)
- [ ] Add Level dropdown (beginner/intermediate/advanced)
- [ ] Add Estimated Hours number input
- [ ] Add Thumbnail URL input (with image preview)
- [ ] Add Publish/Unpublish button with confirmation
- [ ] Add visual indicator for published status
- [ ] Add "Unsaved changes" detection

#### Lesson Modal Component (`/components/teacher/lesson-modal.tsx`)
- [x] Basic title, description, type, order fields exist
- [ ] Add conditional content fields based on lesson type:
  - **Video lessons:** 
    - videoUrl (required)
    - videoThumbnail (optional)
    - duration (optional)
    - Video creator attribution fields
  - **Reading lessons:**
    - contentMarkdown (rich text editor)
  - **Quiz lessons:**
    - quizQuestions array editor
    - passingScore threshold
  - **Exercise lessons:**
    - Exercise-specific fields (TBD)
- [ ] Add "Preview" button for lesson content
- [ ] Add "Publish/Unpublish" toggle
- [ ] Add form validation with error display

#### Quiz Question Builder Component (NEW)
- [ ] Create `/components/teacher/quiz-question-builder.tsx`
- [ ] Question list with add/edit/delete buttons
- [ ] Question form fields:
  - Question text (textarea)
  - Question type dropdown
  - Options list (for multiple_choice, dynamic add/remove)
  - Correct answer selection (dropdown or radio buttons)
  - Explanation (optional textarea)
  - Points (number input)
- [ ] Drag-and-drop reordering for questions
- [ ] Preview mode for quiz

#### Lesson Reordering Component
- [ ] Add up/down arrow buttons next to each lesson
- [ ] OR: Implement drag-and-drop reordering (react-beautiful-dnd or dnd-kit)
- [ ] Save new order to backend
- [ ] Optimistic UI update

---

## 📊 Current vs Target State

### Current State (Already Working)
```typescript
// Course fields editable
- title: string ✅
- description: string ✅

// Lesson fields editable
- title: string ✅
- description: string ✅
- type: 'video' | 'reading' | 'quiz' | 'exercise' ✅
- order: number ✅
```

### Target State (After Implementation)
```typescript
// ALL Course fields editable
- title: string ✅
- description: string ✅
- language: 'en' | 'lt' 🔲
- targetLanguage: 'en' | 'lt' 🔲
- level: 'beginner' | 'intermediate' | 'advanced' 🔲
- estimatedHours: number 🔲
- thumbnailUrl?: string 🔲
- isPublished: boolean 🔲

// ALL Lesson fields editable
- title: string ✅
- description: string ✅
- type: 'video' | 'reading' | 'quiz' | 'exercise' ✅
- order: number ✅
- videoUrl?: string 🔲
- videoThumbnail?: string 🔲
- duration?: number 🔲
- contentMarkdown?: string 🔲
- quizQuestions?: QuizQuestion[] 🔲
- passingScore?: number 🔲
- isPublished: boolean 🔲

// Quiz Question fields (NEW)
- id: string (UUID) 🔲
- question: string 🔲
- type: 'multiple_choice' | 'true_false' | 'fill_blank' 🔲
- options?: string[] 🔲
- correctAnswer: string 🔲
- explanation?: string 🔲
- points: number 🔲
```

---

## 🗂️ File Structure

### Files to Modify
```
app/
  api/
    courses/
      [id]/
        route.ts                    # Expand PUT schema
        publish/
          route.ts                  # NEW: Publish endpoint
        lessons/
          [lessonId]/
            route.ts                # Expand PUT schema
          reorder/
            route.ts                # NEW: Reorder endpoint
  
  teacher/
    course/
      edit/
        [id]/
          page.tsx                  # Add all course fields

components/
  teacher/
    lesson-modal.tsx                # Expand with ALL lesson fields
    quiz-question-builder.tsx       # NEW: Quiz editor
    lesson-reorder.tsx              # NEW: Reorder UI (optional)

lib/
  types/
    course.types.ts                 # Already complete ✅
  
  services/
    course/
      course.service.ts             # Already supports all fields ✅
      lesson.repository.ts          # Already supports all fields ✅
```

---

## 🔧 Technical Implementation Details

### 1. Course Metadata Editing

**Backend:** Already supported via `UpdateCourseData` type  
**Frontend:** Add form fields

```tsx
// Add to course edit page
<div className="space-y-2">
  <Label>Language (Teaching)</Label>
  <Select value={formData.language} onValueChange={(value) => setFormData({...formData, language: value})}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="en">English</SelectItem>
      <SelectItem value="lt">Lithuanian</SelectItem>
    </SelectContent>
  </Select>
</div>

<div className="space-y-2">
  <Label>Target Language (Learning)</Label>
  <Select value={formData.targetLanguage} onValueChange={(value) => setFormData({...formData, targetLanguage: value})}>
    {/* Same options */}
  </Select>
</div>

<div className="space-y-2">
  <Label>Difficulty Level</Label>
  <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="beginner">Beginner</SelectItem>
      <SelectItem value="intermediate">Intermediate</SelectItem>
      <SelectItem value="advanced">Advanced</SelectItem>
    </SelectContent>
  </Select>
</div>

<div className="space-y-2">
  <Label>Estimated Hours</Label>
  <Input
    type="number"
    min="0.5"
    step="0.5"
    value={formData.estimatedHours}
    onChange={(e) => setFormData({...formData, estimatedHours: parseFloat(e.target.value)})}
  />
</div>

<div className="space-y-2">
  <Label>Course Thumbnail URL</Label>
  <Input
    type="url"
    value={formData.thumbnailUrl || ''}
    onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
    placeholder="https://example.com/image.jpg"
  />
  {formData.thumbnailUrl && (
    <img src={formData.thumbnailUrl} alt="Preview" className="w-32 h-32 object-cover rounded" />
  )}
</div>
```

### 2. Lesson Content Editing

**Conditional Fields Based on Lesson Type:**

```tsx
{lessonType === 'video' && (
  <>
    <div className="space-y-2">
      <Label>Video URL (YouTube/Vimeo)</Label>
      <Input
        type="url"
        value={lessonData.videoUrl}
        onChange={(e) => setLessonData({...lessonData, videoUrl: e.target.value})}
        required
      />
    </div>
    
    <div className="space-y-2">
      <Label>Video Thumbnail URL</Label>
      <Input
        type="url"
        value={lessonData.videoThumbnail || ''}
        onChange={(e) => setLessonData({...lessonData, videoThumbnail: e.target.value})}
      />
    </div>
    
    <div className="space-y-2">
      <Label>Duration (seconds)</Label>
      <Input
        type="number"
        min="1"
        value={lessonData.duration || ''}
        onChange={(e) => setLessonData({...lessonData, duration: parseInt(e.target.value)})}
      />
    </div>
  </>
)}

{lessonType === 'reading' && (
  <div className="space-y-2">
    <Label>Content (Markdown)</Label>
    <Textarea
      rows={10}
      value={lessonData.contentMarkdown || ''}
      onChange={(e) => setLessonData({...lessonData, contentMarkdown: e.target.value})}
      placeholder="# Heading\n\nParagraph text...\n\n- Bullet point"
    />
    <p className="text-xs text-muted-foreground">
      Supports Markdown formatting (headings, lists, bold, italic, links)
    </p>
  </div>
)}

{lessonType === 'quiz' && (
  <>
    <div className="space-y-2">
      <Label>Passing Score (%)</Label>
      <Input
        type="number"
        min="0"
        max="100"
        value={lessonData.passingScore || 70}
        onChange={(e) => setLessonData({...lessonData, passingScore: parseInt(e.target.value)})}
      />
    </div>
    
    <div className="space-y-2">
      <Label>Quiz Questions</Label>
      <QuizQuestionBuilder
        questions={lessonData.quizQuestions || []}
        onChange={(questions) => setLessonData({...lessonData, quizQuestions: questions})}
      />
    </div>
  </>
)}
```

### 3. Quiz Question Builder Component

```tsx
// components/teacher/quiz-question-builder.tsx
export function QuizQuestionBuilder({ questions, onChange }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: crypto.randomUUID(),
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 1
    };
    onChange([...questions, newQuestion]);
    setEditingIndex(questions.length);
  };
  
  const updateQuestion = (index: number, updated: QuizQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updated;
    onChange(newQuestions);
  };
  
  const deleteQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-4">
      {questions.map((q, index) => (
        <QuestionEditor
          key={q.id}
          question={q}
          index={index}
          isEditing={editingIndex === index}
          onEdit={() => setEditingIndex(index)}
          onUpdate={(updated) => updateQuestion(index, updated)}
          onDelete={() => deleteQuestion(index)}
        />
      ))}
      
      <Button onClick={addQuestion} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Question
      </Button>
    </div>
  );
}
```

### 4. API Schema Updates

```typescript
// app/api/courses/[id]/route.ts - Expand updateCourseSchema
const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  language: z.enum(['en', 'lt']).optional(),
  targetLanguage: z.enum(['en', 'lt']).optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedHours: z.number().positive().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
});

// app/api/courses/[id]/lessons/[lessonId]/route.ts - Expand lesson schema
const updateLessonSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  type: z.enum(['video', 'reading', 'quiz', 'exercise']).optional(),
  order: z.number().positive().optional(),
  videoUrl: z.string().url().optional(),
  videoThumbnail: z.string().url().optional(),
  duration: z.number().positive().optional(),
  contentMarkdown: z.string().optional(),
  quizQuestions: z.array(quizQuestionSchema).optional(),
  passingScore: z.number().min(0).max(100).optional(),
  isPublished: z.boolean().optional(),
});

const quizQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string().min(5, 'Question must be at least 5 characters'),
  type: z.enum(['multiple_choice', 'true_false', 'fill_blank']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().optional(),
  points: z.number().positive().default(1),
});
```

---

## 🧪 Testing Plan

### Manual Testing with Playwright MCP

**Test Scenario 1: Edit Course Metadata**
1. Navigate to teacher dashboard
2. Click "Edit" on existing course
3. Change language from EN to LT
4. Change level from Beginner to Intermediate
5. Update estimated hours from 5 to 8
6. Add thumbnail URL
7. Click "Save Changes"
8. Verify Firestore document updated
9. Reload page, verify changes persisted

**Test Scenario 2: Edit Video Lesson**
1. Open course edit page
2. Click "Edit" on video lesson
3. Change video URL
4. Add video thumbnail
5. Add duration (600 seconds)
6. Click "Update Lesson"
7. Verify lesson modal closes
8. Verify lesson list shows updated data
9. Check Firestore document

**Test Scenario 3: Edit Quiz Lesson**
1. Open course edit page
2. Click "Edit" on quiz lesson
3. Add new quiz question
4. Set question type to multiple_choice
5. Add 4 options
6. Select correct answer
7. Add explanation
8. Set points to 2
9. Change passing score to 80%
10. Click "Update Lesson"
11. Verify Firestore quiz structure

**Test Scenario 4: Publish/Unpublish Course**
1. Open course edit page
2. Click "Publish Course" button
3. Verify confirmation dialog
4. Confirm publish action
5. Verify badge changes to "Published"
6. Check Firestore `isPublished: true`
7. Click "Unpublish Course"
8. Verify badge changes to "Draft"
9. Check Firestore `isPublished: false`

**Test Scenario 5: Lesson Reordering**
1. Open course edit page with 3+ lessons
2. Click "Move Up" on lesson 3
3. Verify lesson 3 becomes lesson 2
4. Click "Save Order" (or auto-save)
5. Reload page
6. Verify new order persisted

---

## 🚨 Known Constraints & Considerations

### Data Validation
- **Language mismatch:** Prevent `language === targetLanguage` (doesn't make sense)
- **Estimated hours:** Must be positive, reasonable range (0.5 - 100 hours)
- **Thumbnail URL:** Validate image format (jpg, png, webp)
- **Quiz questions:** Minimum 1 question for quiz lessons
- **Multiple choice:** Minimum 2 options, maximum 6 options
- **Passing score:** Between 0-100, default 70%

### UI/UX Requirements
- **Unsaved changes warning:** Prompt before leaving page with unsaved edits
- **Real-time preview:** Show markdown rendering for reading lessons
- **Video preview:** Embed video player for video URL validation
- **Form validation:** Show inline errors, not just alert dialogs
- **Loading states:** Disable buttons during save operations
- **Success feedback:** Toast notifications for successful saves

### Security
- **Authorization:** Only course owner can edit (already implemented ✅)
- **Role check:** Only teachers can access edit page (already implemented ✅)
- **Input sanitization:** Sanitize markdown content before saving
- **URL validation:** Verify thumbnail/video URLs are valid images/videos

### Performance
- **Debounced save:** Don't save on every keystroke, use debounce (500ms)
- **Optimistic updates:** Update UI immediately, rollback on error
- **Lazy loading:** Load lessons separately from course metadata
- **Image optimization:** Recommend optimal thumbnail dimensions (16:9, 1280x720)

---

## 📈 Success Metrics

### Functional Requirements (Must Have)
- [ ] All course fields editable via UI
- [ ] All lesson fields editable via UI
- [ ] Quiz questions CRUD operations working
- [ ] Changes persist to Firestore correctly
- [ ] No regressions in existing features

### User Experience (Should Have)
- [ ] Intuitive UI for all editing operations
- [ ] Clear feedback for save operations
- [ ] Validation errors are helpful and specific
- [ ] No unexpected data loss (unsaved changes warning)

### Quality Assurance (Must Have)
- [ ] Zero TypeScript errors
- [ ] Zero runtime errors in console
- [ ] All Playwright tests pass
- [ ] Firestore data structure matches schema

---

## 🔗 Related Documentation

- [LESSON_MANAGEMENT_SYSTEM.md](./LESSON_MANAGEMENT_SYSTEM.md) - Current lesson CRUD implementation
- [API_VERIFICATION_REPORT.md](./API_VERIFICATION_REPORT.md) - API endpoint inventory
- [TEACHER_CHATBOT_IMPLEMENTATION.md](./TEACHER_CHATBOT_IMPLEMENTATION.md) - AI-generated course structure
- [course.types.ts](/lib/types/course.types.ts) - Complete TypeScript definitions

---

## 📝 Implementation Notes

### AI Chatbot Courses
- Courses created via AI chatbot use the same Firestore structure
- Teachers should be able to edit AI-generated courses exactly like manual ones
- Quiz questions from AI should have UUID `id` field (see PHASE_4_WEEK1_DAY3_REPORT.md)

### Existing Limitations
- Current lesson modal only edits title, description, type, order
- No video metadata editing yet
- No markdown editor for reading lessons
- No quiz question builder

### Migration Path
1. Start with course metadata fields (easiest)
2. Add lesson type-specific fields (medium)
3. Build quiz question editor (complex)
4. Add lesson reordering (bonus)
5. Add publish/unpublish toggles (final)

---

**Created by:** ZenType Architect  
**Date:** October 25, 2025  
**Status:** Ready for implementation  
**Estimated Completion:** 3-4 hours of focused work
