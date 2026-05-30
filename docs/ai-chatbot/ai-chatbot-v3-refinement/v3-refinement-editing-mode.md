# AI Chatbot v3 - EDITING Mode Implementation

**Version:** 3.1.0  
**Date:** November 20, 2025  
**Focus:** AI-powered lesson editing with same capabilities as teacher UI  
**Expected Impact:** 50% faster lesson refinement, better content quality

---

## 📖 Overview

Add a third mode to the AI chatbot: **EDITING Mode**, allowing teachers to modify existing lessons using natural language with AI assistance. This gives AI the same editing capabilities as the teacher UI.

**Current Modes:**
1. ✅ PLANNING - Course ideation, structure planning
2. ✅ BUILDING - Course/lesson creation via function calls
3. 🆕 **EDITING** - Lesson modification with AI assistance

**Use Cases:**
- "Fix the formatting in lesson 3"
- "Make the quiz in lesson 5 easier"
- "Add more examples to the reading lesson"
- "Translate lesson 2 content to Lithuanian"
- "Update video URL in lesson 1"

---

## 🔍 Research Findings

### Existing Infrastructure Analysis

**✅ Backend APIs Already Exist:**

1. **Course Update API:**
   - Endpoint: `PUT /api/courses/[id]`
   - Location: `/app/api/courses/[id]/route.ts`
   - Capabilities: Update course metadata (title, description, level, language, etc.)

2. **Lesson Update API:**
   - Endpoint: `PUT /api/courses/[id]/lessons/[lessonId]`
   - Location: `/app/api/courses/[id]/lessons/[lessonId]/route.ts`
   - Capabilities: Update all lesson fields (title, content, duration, quiz questions, etc.)

3. **Service Layer:**
   - Service: `CourseService.updateLesson()`
   - Location: `/lib/services/course/course.service.ts` (lines 330-358)
   - Auth: Verifies teacher ownership before allowing edits

**✅ Teacher UI Already Uses These APIs:**

- Teacher edit page: `/app/teacher/course/edit/[id]/page.tsx`
- Lesson modal: `/components/teacher/lesson-modal.tsx`
- Same authentication flow (Bearer token)
- Same validation (Zod schemas)

**Key Insight:** We don't need new APIs - just expose existing endpoints to AI!

---

## 🎯 Implementation Plan

### Phase 1: Add EDITING Mode to Chatbot

**1.1 Update Mode Detection**

Add editing mode to existing chatbot:

```typescript
// In /app/api/ai/teacher-bot/route.ts
export type ChatbotMode = 'planning' | 'building' | 'editing';

const body = await req.json();
const { message, conversationHistory = [], mode = 'planning', context } = body;

// context = { courseId?: string, lessonId?: string } for editing
```

**1.2 Add Function Declarations for Editing**

Add new functions to existing `functionDeclarations` array:

```typescript
{
  name: 'updateLesson',
  description: 'Update an existing lesson. Use when teacher wants to modify lesson content, fix errors, or improve quality.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      courseId: {
        type: SchemaType.STRING,
        description: 'Course ID containing the lesson'
      },
      lessonId: {
        type: SchemaType.STRING,
        description: 'Lesson ID to update'
      },
      title: {
        type: SchemaType.STRING,
        description: 'New lesson title (optional - only if changing)'
      },
      description: {
        type: SchemaType.STRING,
        description: 'New lesson description (optional)'
      },
      content: {
        type: SchemaType.OBJECT,
        description: 'Updated lesson content. For reading lessons, use {text: "markdown content"}. For video lessons, use {videoUrl: "url"}.',
        properties: {
          text: { type: SchemaType.STRING },
          videoUrl: { type: SchemaType.STRING },
          videoTitle: { type: SchemaType.STRING },
          videoCreator: { type: SchemaType.STRING },
          sourceUrl: { type: SchemaType.STRING }
        }
      },
      duration: {
        type: SchemaType.NUMBER,
        description: 'Updated duration in minutes (optional)'
      },
      quizQuestions: {
        type: SchemaType.ARRAY,
        description: 'Updated quiz questions for quiz lessons (optional)',
        items: {
          type: SchemaType.OBJECT,
          properties: {
            question: { type: SchemaType.STRING },
            options: { 
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING }
            },
            correctAnswer: { type: SchemaType.STRING },
            explanation: { type: SchemaType.STRING },
            points: { type: SchemaType.NUMBER }
          }
        }
      }
    },
    required: ['courseId', 'lessonId']
  }
},
{
  name: 'getLesson',
  description: 'Retrieve current lesson content before editing. ALWAYS call this first to see what needs to be changed.',
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      courseId: { type: SchemaType.STRING },
      lessonId: { type: SchemaType.STRING }
    },
    required: ['courseId', 'lessonId']
  }
}
```

**1.3 Update SYSTEM_PROMPT for Editing Mode**

Add editing guidelines:

```markdown
## MODE 3: EDITING (Modify Existing Lessons)
- Retrieve current lesson content first
- Analyze what teacher wants to change
- Make targeted updates (don't rewrite everything)
- Preserve formatting and style
- Ask for confirmation if major changes

### EDITING WORKFLOW:

**Step 1: Retrieve Current Content**
ALWAYS call getLesson() first to see current state:
- Read current content
- Understand structure
- Identify what needs changing

**Step 2: Plan Changes**
Ask clarifying questions if needed:
- "Should I keep the existing examples?"
- "Do you want me to add more detail or simplify?"
- "Should I preserve the current tone?"

**Step 3: Make Targeted Updates**
Call updateLesson() with ONLY changed fields:
- Don't send unchanged fields (API handles partial updates)
- Apply content formatting rules (proper Markdown)
- Preserve lesson structure unless asked to change it

**Step 4: Confirm Result**
Show teacher what changed:
```
✅ Updated Lesson: "Lithuanian Greetings"

Changes made:
- Fixed escaped newlines (\\n → actual breaks)
- Converted pipe table to bullet list
- Added 3 new vocabulary examples
- Updated duration: 30 → 45 minutes
```

### EDITING RULES:

1. **Always Retrieve First:**
   - Call getLesson() before making any edits
   - Never guess current content
   - Understand context before changing

2. **Minimal Changes:**
   - Only update fields that need changing
   - Preserve existing formatting/structure
   - Don't rewrite content unless explicitly asked

3. **Content Quality:**
   - Apply same formatting rules as creating lessons
   - Fix escaped characters (\\n → actual breaks)
   - Convert pipe tables to Markdown lists
   - Ensure proper Markdown syntax

4. **Confirmation:**
   - Show preview of changes before applying
   - Ask for confirmation if changes are major
   - Explain what will change and why
```

---

### Phase 2: Add Function Execution for Editing

**2.1 Update executeFunctionCalls()**

Add cases for editing functions:

```typescript
// In /app/api/ai/teacher-bot/route.ts - executeFunctionCalls()

async function executeFunctionCalls(
  functionCalls: any[],
  teacherId: string,
  teacherName: string,
  authToken: string,
  baseUrl: string
): Promise<any[]> {
  const results = [];
  
  // ... existing code ...
  
  // Handle editing operations
  const editingCalls = functionCalls.filter(fc => 
    fc.name === 'updateLesson' || fc.name === 'getLesson'
  );
  
  for (const fc of editingCalls) {
    try {
      traceLogger.log('info', 'AI', `Executing function: ${fc.name}`, { args: fc.args });

      if (fc.name === 'getLesson') {
        // Retrieve current lesson
        const lesson = await courseService.getCourseById(fc.args.courseId, true)
          .then(course => course.lessons?.find(l => l.id === fc.args.lessonId));
        
        if (!lesson) {
          throw new Error('Lesson not found');
        }
        
        results.push({
          name: fc.name,
          response: {
            success: true,
            data: lesson
          }
        });
        
      } else if (fc.name === 'updateLesson') {
        // Clean content if present
        const updateData = { ...fc.args };
        delete updateData.courseId;
        delete updateData.lessonId;
        
        if (updateData.content?.text) {
          updateData.content.text = cleanLessonContent(updateData.content.text);
          traceLogger.log('info', 'AI', 'Cleaned updated lesson content', {
            originalLength: fc.args.content.text.length,
            cleanedLength: updateData.content.text.length
          });
        }
        
        // Update lesson
        const updatedLesson = await courseService.updateLesson(
          fc.args.courseId,
          fc.args.lessonId,
          teacherId,
          updateData
        );
        
        results.push({
          name: fc.name,
          response: {
            success: true,
            data: updatedLesson,
            message: `Lesson "${updatedLesson.title}" updated successfully`
          }
        });
      }
      
      traceLogger.log('info', 'AI', `Function ${fc.name} completed`, { success: true });
      
    } catch (error: any) {
      traceLogger.log('error', 'AI', `Function ${fc.name} failed`, { error: error.message });
      
      results.push({
        name: fc.name,
        response: {
          success: false,
          error: error.message
        }
      });
    }
  }
  
  return results;
}
```

---

### Phase 3: Frontend Integration

**3.1 Add Editing Mode Button**

Update teacher chatbot UI:

```tsx
// In /app/teacher/chatbot/page.tsx or wherever chatbot UI lives

const [mode, setMode] = useState<'planning' | 'building' | 'editing'>('planning');
const [editContext, setEditContext] = useState<{
  courseId?: string;
  lessonId?: string;
}>({});

// Mode selector
<div className="flex gap-2 mb-4">
  <Button
    variant={mode === 'planning' ? 'default' : 'outline'}
    onClick={() => setMode('planning')}
  >
    Planning
  </Button>
  <Button
    variant={mode === 'building' ? 'default' : 'outline'}
    onClick={() => setMode('building')}
  >
    Building
  </Button>
  <Button
    variant={mode === 'editing' ? 'default' : 'outline'}
    onClick={() => setMode('editing')}
    disabled={!editContext.courseId}
  >
    Editing
  </Button>
</div>

// In editing mode, show lesson selector
{mode === 'editing' && (
  <Select
    value={editContext.lessonId}
    onValueChange={(lessonId) => setEditContext({ ...editContext, lessonId })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select lesson to edit..." />
    </SelectTrigger>
    <SelectContent>
      {lessons.map(lesson => (
        <SelectItem key={lesson.id} value={lesson.id}>
          {lesson.order}. {lesson.title}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)}

// Send context with message
const sendMessage = async () => {
  const response = await fetch('/api/ai/teacher-bot', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: userMessage,
      conversationHistory,
      mode,
      context: mode === 'editing' ? editContext : undefined
    })
  });
};
```

**3.2 Add "Edit with AI" Button to Teacher UI**

Add shortcut from course edit page:

```tsx
// In /app/teacher/course/edit/[id]/page.tsx - in lesson list

<Button
  variant="ghost"
  size="sm"
  onClick={() => {
    // Open chatbot in editing mode for this lesson
    router.push(`/teacher/chatbot?mode=editing&courseId=${courseId}&lessonId=${lesson.id}`);
  }}
>
  <Sparkles className="h-4 w-4 mr-2" />
  Edit with AI
</Button>
```

---

## 🎯 Scope & Boundaries

### ✅ In Scope (What AI Can Edit)

**Lesson Content:**
- ✅ Title and description
- ✅ Reading lesson text (Markdown content)
- ✅ Video URL and attribution
- ✅ Quiz questions and answers
- ✅ Duration estimate
- ✅ Lesson order

**Quality Improvements:**
- ✅ Fix formatting issues (escaped newlines, pipe tables)
- ✅ Add/remove examples
- ✅ Adjust difficulty level
- ✅ Expand/simplify explanations
- ✅ Correct grammar/spelling
- ✅ Translate content

### ❌ Out of Scope (What AI Cannot Edit)

**Restricted Operations:**
- ❌ Delete lessons (too destructive - manual only)
- ❌ Change lesson type (reading → quiz) - requires complete rewrite
- ❌ Publish/unpublish course (permission-sensitive)
- ❌ Modify course metadata in editing mode (use building mode)
- ❌ Change teacher ownership
- ❌ Modify student enrollments

**Technical Limitations:**
- ❌ Cannot edit multiple lessons simultaneously (one at a time)
- ❌ Cannot access lesson resources (PDFs, documents) - UI only
- ❌ Cannot preview lesson in real-time (teacher must view separately)

---

## 🔒 Safety & Validation

### Authorization Checks

**Three-Layer Security:**

1. **API Level** (existing):
   - Bearer token validation
   - Teacher role verification
   - Ownership check (courseService.updateLesson validates teacherId)

2. **AI Level** (new):
   - Confirm lesson belongs to provided course
   - Validate context.courseId matches actual course
   - Reject if teacher doesn't own course

3. **Content Level** (existing):
   - Zod schema validation
   - Content length limits
   - Markdown sanitization (cleanLessonContent)

### Confirmation Flow

**Major Changes Require Confirmation:**

AI should ask before:
- ❌ Deleting large sections of content
- ❌ Completely rewriting lesson structure
- ❌ Changing quiz passing score significantly
- ❌ Removing all examples/explanations

AI can proceed without asking for:
- ✅ Fixing formatting (escaped characters, tables)
- ✅ Correcting typos
- ✅ Adding minor examples
- ✅ Updating duration estimates

---

## 📊 Expected Performance

### Speed Improvements

**Before (Manual UI Editing):**
```
Teacher workflow:
1. Navigate to course edit page (10 sec)
2. Find lesson in list (5 sec)
3. Open lesson modal (2 sec)
4. Edit content field (60 sec)
5. Save changes (2 sec)

Total: ~80 seconds per lesson edit
```

**After (AI Editing):**
```
Teacher workflow:
1. Open chatbot (already open)
2. Select lesson (5 sec)
3. Say "Fix the formatting issues" (5 sec)
4. AI retrieves, analyzes, fixes, saves (10 sec)
5. Confirm result (2 sec)

Total: ~22 seconds per lesson edit
→ 72% faster!
```

### Use Case Examples

**Example 1: Fix Formatting**
```
Teacher: "Fix the formatting in lesson 3, it has weird newlines"

AI: 
1. Calls getLesson(courseId, lessonId)
2. Detects \\n\\n and pipe tables
3. Calls cleanLessonContent()
4. Calls updateLesson() with cleaned content
5. Responds: "✅ Fixed formatting in 'Taking the Bus' lesson:
   - Converted escaped newlines to proper paragraphs
   - Changed pipe table to bullet list
   - Cleaned extra whitespace"
```

**Example 2: Add Examples**
```
Teacher: "Add 2 more vocabulary examples to the greeting lesson"

AI:
1. Calls getLesson()
2. Reads current vocabulary list
3. Generates 2 contextually appropriate examples
4. Calls updateLesson() with expanded content
5. Shows preview: "Added: **Labas rytas** (morning greeting) and **Iki** (goodbye)"
```

**Example 3: Simplify Quiz**
```
Teacher: "Make the quiz in lesson 5 easier"

AI:
1. Calls getLesson()
2. Analyzes quiz difficulty
3. Simplifies questions, removes tricky distractors
4. Lowers passing score from 80% → 70%
5. Calls updateLesson()
6. Responds: "Made quiz easier: simplified 3 questions, adjusted passing score"
```

---

## 🧪 Testing Strategy

### Unit Tests

**Test Cases for executeFunctionCalls():**

```typescript
describe('EDITING Mode Function Calls', () => {
  test('getLesson retrieves current content', async () => {
    const result = await executeFunctionCalls([
      { name: 'getLesson', args: { courseId: 'abc123', lessonId: 'xyz789' }}
    ], teacherId, teacherName, token, baseUrl);
    
    expect(result[0].response.success).toBe(true);
    expect(result[0].response.data).toHaveProperty('title');
  });
  
  test('updateLesson applies content cleaning', async () => {
    const result = await executeFunctionCalls([
      { 
        name: 'updateLesson', 
        args: { 
          courseId: 'abc123', 
          lessonId: 'xyz789',
          content: { text: 'Test\\n\\nContent' }
        }
      }
    ], teacherId, teacherName, token, baseUrl);
    
    // Should clean \\n\\n to actual newlines
    expect(result[0].response.data.content.text).not.toContain('\\n');
  });
  
  test('updateLesson rejects unauthorized access', async () => {
    const result = await executeFunctionCalls([
      { name: 'updateLesson', args: { courseId: 'other_teacher_course', lessonId: 'xyz' }}
    ], teacherId, teacherName, token, baseUrl);
    
    expect(result[0].response.success).toBe(false);
    expect(result[0].response.error).toContain('Unauthorized');
  });
});
```

### E2E Tests (Playwright MCP)

```typescript
test('AI can edit lesson content via EDITING mode', async ({ page }) => {
  // 1. Login as teacher
  await loginAsTeacher(page);
  
  // 2. Navigate to chatbot
  await page.goto('/teacher/chatbot');
  
  // 3. Switch to EDITING mode
  await page.click('button:has-text("Editing")');
  
  // 4. Select course and lesson
  await page.selectOption('[data-testid="course-selector"]', courseId);
  await page.selectOption('[data-testid="lesson-selector"]', lessonId);
  
  // 5. Send editing command
  await page.fill('[data-testid="message-input"]', 'Add more examples to this lesson');
  await page.click('[data-testid="send-button"]');
  
  // 6. Wait for AI response
  await page.waitForSelector('[data-testid="ai-response"]');
  const response = await page.textContent('[data-testid="ai-response"]');
  
  expect(response).toContain('Added');
  expect(response).toContain('example');
  
  // 7. Verify lesson was actually updated
  const lessonResponse = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const lesson = await lessonResponse.json();
  
  expect(lesson.lesson.content.text).toContain('example');
});
```

---

## 🚀 Implementation Checklist

### Phase 1: Backend (2-3 hours)
- [ ] Add `context?: { courseId, lessonId }` to POST body schema
- [ ] Add `updateLesson` function declaration
- [ ] Add `getLesson` function declaration
- [ ] Update SYSTEM_PROMPT with EDITING mode guidelines
- [ ] Add editing case to executeFunctionCalls()
- [ ] Apply cleanLessonContent() to updateLesson calls
- [ ] Add unit tests for editing functions

### Phase 2: Frontend (1-2 hours)
- [ ] Add mode selector (Planning/Building/Editing)
- [ ] Add lesson selector for editing mode
- [ ] Send context with chatbot requests
- [ ] Add "Edit with AI" button to course edit page
- [ ] Show editing context in chatbot UI

### Phase 3: Testing (1-2 hours)
- [ ] Test getLesson retrieval
- [ ] Test updateLesson with content cleaning
- [ ] Test authorization checks
- [ ] Test formatting fixes (escaped newlines, pipe tables)
- [ ] Test adding content (examples, explanations)
- [ ] Test simplifying/expanding content
- [ ] E2E test with Playwright MCP

### Phase 4: Documentation (30 min)
- [ ] Update TEACHER_CHATBOT_PRD.md with editing mode
- [ ] Add examples to teacher documentation
- [ ] Update API docs for editing endpoints
- [ ] Create teacher tutorial video/guide

---

## 📝 Future Enhancements (Phase 4)

### Advanced Editing Features (v3.2+)

**Batch Editing:**
- Edit multiple lessons at once
- "Fix formatting in all reading lessons"
- "Translate all lessons to Lithuanian"

**Smart Suggestions:**
- AI analyzes lesson and suggests improvements
- "This lesson is too long, should I split it?"
- "Quiz seems too easy, add harder questions?"

**Version Control:**
- Track lesson edit history
- Revert to previous versions
- Compare before/after changes

**Collaborative Editing:**
- Multiple teachers editing with AI
- Conflict resolution
- Change approval workflow

---

## 🎯 Success Metrics

### Goals (3 months after launch)

**Adoption:**
- ✅ 40% of teachers use editing mode at least once
- ✅ 20% of lesson edits done via AI (vs manual UI)

**Efficiency:**
- ✅ 50% faster lesson refinement time
- ✅ 30% reduction in formatting errors

**Quality:**
- ✅ 25% more examples added to lessons
- ✅ Higher lesson ratings from students
- ✅ Fewer student-reported content issues

---

## 🔗 Related Documents

- **PRD:** `v3-refinement.prd.md` - Overall v3 features
- **Scope:** `v3-refinement.scope.md` - Boundaries and constraints
- **Batch API:** `v3-refinement-batch-api.md` - Parallel processing
- **Current Status:** `ai-chatbot-v3-refinement.current.md` - Implementation progress

---

**Status:** 📋 Ready for Implementation  
**Priority:** P2 (after batch API optimization)  
**Estimated Effort:** 4-6 hours development + 2 hours testing  
**Risk Level:** LOW (uses existing APIs, minimal new surface area)

---

**Next Steps:**
1. Review this document with team
2. Get approval for EDITING mode scope
3. Create implementation task in project board
4. Start with Phase 1 (backend function declarations)
5. Test thoroughly before UI work
6. Deploy to staging, gather teacher feedback
