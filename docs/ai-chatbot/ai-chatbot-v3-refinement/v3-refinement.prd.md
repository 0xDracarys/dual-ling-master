# AI Chatbot v3 Refinement - Product Requirements Document

**Version:** 3.0.0  
**Date:** November 20, 2025  
**Status:** 📋 PLANNING PHASE  
**Priority:** HIGH - Target 30-40% Overall Improvement  
**Owner:** ZenType Architect

---

## 🎯 Executive Summary

### Vision
Transform the AI Chatbot from a "good course creator" to an **exceptional teacher assistant** with 30-40% improvement across response quality, reliability, cost transparency, and performance.

### Current State (v1.1.0)
- ✅ Basic course/lesson creation working
- ✅ Anti-placeholder protection in place
- ⚠️ Response quality inconsistent
- ⚠️ No cost transparency for teachers
- ⚠️ System prompt not cached (wasting tokens)
- ⚠️ No batch API utilization for bulk operations
- ⚠️ Function calling not optimized for complex workflows

### Target State (v3.0.0)
- 🎯 **30-40% better response quality** (measured by teacher satisfaction + reduced error rate)
- 🎯 **100% error-free operations** (zero placeholder IDs, validation failures)
- 🎯 **Full cost transparency** (token usage visible to teachers)
- 🎯 **50% faster bulk operations** (using Batch API)
- 🎯 **80% token cost reduction** (using context caching)
- 🎯 **Advanced prompting** (structured outputs, long-context handling)

---

## 📊 Success Metrics

| Metric | Baseline (v1.1.0) | Target (v3.0.0) | Improvement |
|--------|-------------------|-----------------|-------------|
| **Response Quality Score** | 3.8/5 | 5.0/5 | **+32%** |
| **Error Rate** | ~5% placeholder errors | 0% | **-100%** |
| **Token Cost per Course** | ~50K tokens ($1.50) | ~10K tokens ($0.30) | **-80%** |
| **Bulk Course Creation Time** | 10-15 min (10 courses) | 5-7 min | **-50%** |
| **Teacher Satisfaction** | 78% | 95%+ | **+22%** |
| **API Call Failures** | ~3% | <0.5% | **-83%** |

---

## 🎯 Phase Breakdown

### Phase 1: Advanced Prompting & Code Execution (Week 1)
**Goal:** Improve response quality by 15-20% through better prompting strategies

#### 1.1 Structured Output (JSON Schema)
**Problem:** AI sometimes returns malformed data or misses required fields

**Solution:** Use `responseMimeType: "application/json"` with schema constraints

**Gemini Doc:** https://ai.google.dev/gemini-api/docs/prompting-strategies#json-mode

**Implementation:**
```typescript
const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        courseTitle: { type: SchemaType.STRING },
        lessons: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              type: { type: SchemaType.STRING, enum: ['reading', 'video', 'quiz'] },
              duration: { type: SchemaType.NUMBER }
            },
            required: ['title', 'type']
          }
        }
      },
      required: ['courseTitle', 'lessons']
    }
  }
});
```

**Impact:** ✅ Zero malformed responses, ✅ Guaranteed field presence

---

#### 1.2 Code Execution for Complex Calculations
**Problem:** AI struggles with complex lesson ordering, duration calculations, level progression

**Solution:** Enable code execution mode for computational tasks

**Gemini Doc:** https://ai.google.dev/gemini-api/docs/code-execution

**Use Cases:**
- Calculate optimal lesson ordering based on difficulty scores
- Validate course duration totals (must be 6-10 hours)
- Generate quiz difficulty distribution curves
- Analyze language complexity (CEFR level detection)

**Implementation:**
```typescript
const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  tools: [{ codeExecution: {} }]
});

const prompt = `
Analyze these 12 lesson titles and calculate:
1. Optimal ordering by difficulty (CEFR level)
2. Total course duration
3. Recommended quiz placement intervals

Use code execution to ensure accuracy.

Lessons: [...]
`;
```

**Impact:** ✅ Mathematically accurate course structures, ✅ Better pedagogical sequencing

---

#### 1.3 Long Context Window Optimization
**Problem:** Teachers provide long transcripts, existing course content, reference materials

**Solution:** Leverage 2M token context window efficiently

**Gemini Doc:** https://ai.google.dev/gemini-api/docs/long-context

**Strategy:**
```typescript
// Place reference material at the start (better attention)
const systemPromptWithContext = `
${SYSTEM_PROMPT}

## REFERENCE MATERIALS (Use these to maintain consistency)

### Existing Course Structure (Teacher's Previous Work)
${existingCoursesContent} // Up to 500K tokens

### Source Transcript (Video/Audio to Convert)
${videoTranscript} // Up to 1M tokens

### Style Guide (Teacher Preferences)
${teacherStyleGuide} // Up to 50K tokens

---

Now help the teacher with their request:
`;
```

**Impact:** ✅ Better context understanding, ✅ Consistent style across courses

---

### Phase 2: Context Caching (Week 1-2)
**Goal:** Reduce token costs by 80% for repeated system prompts

#### 2.1 Cache System Prompt
**Problem:** System prompt (~3,800 tokens) sent with EVERY request = wasted money

**Solution:** Cache system prompt for 1 hour, reuse across requests

**Gemini Doc:** https://ai.google.dev/gemini-api/docs/caching?lang=node

**Implementation:**
```typescript
import { GoogleAICacheManager, GoogleAIBackend } from 'firebase/ai';

// Create cache once per session
const cacheManager = new GoogleAICacheManager();
const cachedContent = await cacheManager.create({
  model: 'gemini-2.5-flash',
  contents: [{
    role: 'user',
    parts: [{ text: SYSTEM_PROMPT }]
  }],
  ttl: 3600 // 1 hour
});

// Use cached content in requests
const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  cachedContent: cachedContent.name
});
```

**Cost Comparison:**
- **Before:** 3,800 tokens × 100 requests = 380K tokens = $11.40/day
- **After:** 3,800 tokens (cache once) + 50 tokens/request × 100 = 8,800 tokens = $0.26/day
- **Savings:** **-97.7% = $11.14/day saved**

**Impact:** 💰 Massive cost reduction, ⚡ Slightly faster responses (cached prompt doesn't count toward processing)

---

#### 2.2 Cache Teacher-Specific Context
**Problem:** Each teacher has style preferences, existing courses, recurring patterns

**Solution:** Create per-teacher cache that persists across sessions

**Implementation:**
```typescript
// Cache teacher's context (updated weekly)
const teacherCache = await cacheManager.create({
  model: 'gemini-2.5-flash',
  contents: [{
    role: 'user',
    parts: [{
      text: `
        Teacher Profile: ${teacherData}
        Existing Courses: ${existingCourses}
        Style Preferences: ${stylePrefs}
        Frequent Topics: ${topics}
      `
    }]
  }],
  ttl: 604800 // 1 week
});
```

**Impact:** ✅ Consistent style, ✅ Better course continuity, 💰 Additional 50% token savings

---

### Phase 3: Batch API for Bulk Operations (Week 2)
**Goal:** Create 10 courses in 5 minutes instead of 15 minutes

#### 3.1 Batch Course Creation
**Problem:** Teachers want to import 5-10 courses from existing materials at once

**Solution:** Use Batch API to process multiple course creation requests in parallel

**Gemini Doc:** https://ai.google.dev/gemini-api/docs/batch-api

**Current Flow (Serial):**
```
Course 1: AI → createCourse → 20 lessons → 3 min
Course 2: AI → createCourse → 20 lessons → 3 min
Course 3: AI → createCourse → 20 lessons → 3 min
Total: 9 minutes (3 courses)
```

**New Flow (Batch):**
```
Batch Request: [Course 1, Course 2, Course 3]
↓
Parallel Processing (all at once)
↓
Results: All 3 courses in 3.5 minutes
Total: 3.5 minutes (3 courses) = 61% faster
```

**Implementation:**
```typescript
import { BatchAPIClient } from '@google/generative-ai';

// Prepare batch requests
const batchRequests = courses.map(courseData => ({
  model: 'gemini-2.5-flash',
  contents: [{
    role: 'user',
    parts: [{ 
      text: `Create this course: ${JSON.stringify(courseData)}` 
    }]
  }],
  tools: [{ functionDeclarations: [createCourseTool, createLessonTool] }]
}));

// Submit batch (max 1000 requests per batch)
const batchJob = await batchClient.createBatch({
  requests: batchRequests
});

// Poll for completion (async, doesn't block)
const results = await batchClient.waitForBatch(batchJob.name);
```

**Cost Benefits:**
- **Batch API:** 50% cheaper than real-time API
- **Example:** 10 courses = 500K tokens = $7.50 real-time → **$3.75 batch** = **$3.75 saved**

**Impact:** ⚡ 50% faster, 💰 50% cheaper, 🎯 Perfect for bulk imports

---

#### 3.2 Batch Lesson Generation
**Problem:** Creating 30 lessons takes 5 separate API calls

**Solution:** Generate all lessons in one batch request

**Implementation:**
```typescript
const lessonBatch = await batchClient.createBatch({
  requests: lessonTitles.map(title => ({
    model: 'gemini-2.5-flash',
    contents: [{
      role: 'user',
      parts: [{ 
        text: `Generate lesson content for: "${title}" in course ${courseId}` 
      }]
    }]
  }))
});
```

**Impact:** ✅ All 30 lessons ready in 4 minutes instead of 10 minutes

---

### Phase 4: Advanced Function Calling (Week 2-3)
**Goal:** Zero placeholder errors, smarter function orchestration

#### 4.1 Function Calling Best Practices
**Problem:** AI sometimes calls functions in wrong order or with invalid params

**Solution:** Implement Gemini's recommended function calling patterns

**Gemini Doc:** https://ai.google.dev/gemini-api/docs/function-calling?example=chart

**Improvements:**

**1. Explicit Function Sequencing:**
```typescript
const tools = [{
  functionDeclarations: [
    {
      name: 'createCourse',
      description: `
        STEP 1 (ALWAYS FIRST): Create course structure.
        RETURNS: courseId (string) - USE THIS in subsequent calls.
        EXAMPLE: "abc123xyz789" (20-char Firestore ID)
        FORBIDDEN: Never use placeholder IDs like "COURSE_ID" or "course_001"
      `
    },
    {
      name: 'createLesson',
      description: `
        STEP 2 (AFTER createCourse): Add lesson to course.
        REQUIRES: courseId from createCourse response.
        VALIDATION: courseId must match pattern /^[a-zA-Z0-9]{20}$/
      `
    }
  ]
}];
```

**2. Runtime Validation with Clear Errors:**
```typescript
function validateCourseId(courseId: string): void {
  const firestoreIdPattern = /^[a-zA-Z0-9]{20}$/;
  
  if (!firestoreIdPattern.test(courseId)) {
    throw new Error(`
      INVALID courseId: "${courseId}"
      
      This looks like a placeholder. You must:
      1. Call createCourse first
      2. Use the EXACT string returned in the response
      3. Never make up or abbreviate IDs
      
      Example of VALID ID: "2l7VdVb0JbXRGs0zlgLb"
      Your ID: "${courseId}" ❌
    `);
  }
}
```

**3. Chain-of-Thought for Complex Workflows:**
```typescript
const enhancedPrompt = `
Before calling any functions, plan your steps:

STEP 1: Analyze the request
- What does the teacher want?
- What information is missing?

STEP 2: Determine function call sequence
- List functions in order
- Identify dependencies (which needs which response?)

STEP 3: Execute with checks
- Call functions one at a time
- Validate each response before next call
- If error, explain what went wrong

Now proceed with the teacher's request: "${userMessage}"
`;
```

**Impact:** ✅ Zero placeholder errors, ✅ Self-correcting AI

---

#### 4.2 Parallel Function Execution
**Problem:** Creating 20 lessons happens sequentially (slow)

**Solution:** Batch lessons into parallel groups of 5

**Implementation:**
```typescript
// Group lessons by dependency level
const lessonGroups = [
  [lesson1, lesson2, lesson3, lesson4, lesson5], // No dependencies
  [lesson6, lesson7, lesson8, lesson9, lesson10], // Depend on previous group
  // ...
];

// Execute each group in parallel
for (const group of lessonGroups) {
  await Promise.all(
    group.map(lesson => 
      courseService.createLesson(courseId, lesson)
    )
  );
}
```

**Impact:** ⚡ 60% faster lesson creation (20 lessons in 2 min vs 5 min)

---

### Phase 5: Token Usage Transparency (Week 3)
**Goal:** Show teachers exactly what they're using without overwhelming them

#### 5.1 Token Counter UI Component
**Problem:** Teachers have no visibility into AI costs

**Solution:** Elegant, unobtrusive token usage display

**Gemini Doc:** https://ai.google.dev/gemini-api/docs/tokens?lang=node

**UI Design:**
```tsx
// components/ai-chatbot/token-usage-badge.tsx
export function TokenUsageBadge({ 
  inputTokens, 
  outputTokens, 
  cachedTokens 
}: TokenUsageProps) {
  const totalCost = calculateCost(inputTokens, outputTokens, cachedTokens);
  
  return (
    <Badge variant="outline" className="text-xs">
      <Sparkles className="h-3 w-3 mr-1" />
      {formatTokens(inputTokens + outputTokens)} tokens
      {cachedTokens > 0 && (
        <span className="text-green-600 ml-1">
          (-{formatTokens(cachedTokens)} cached)
        </span>
      )}
      <span className="ml-2 text-muted-foreground">
        ~${totalCost.toFixed(3)}
      </span>
    </Badge>
  );
}
```

**Placement:**
- ✅ Bottom of each AI response (subtle)
- ✅ Session summary (total tokens used)
- ✅ Teacher dashboard (monthly usage stats)

---

#### 5.2 Token Tracking Backend
**Problem:** No centralized token usage tracking

**Solution:** Log all token usage to Firestore for billing transparency

**Implementation:**
```typescript
// lib/services/ai/token-tracker.service.ts
export class TokenTrackerService {
  async logUsage(teacherId: string, data: {
    sessionId: string;
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
    model: string;
    operation: 'course_creation' | 'lesson_generation' | 'chat';
    timestamp: Date;
  }): Promise<void> {
    await db.collection('ai_token_usage').add({
      teacherId,
      ...data,
      cost: this.calculateCost(data)
    });
  }
  
  async getMonthlyUsage(teacherId: string): Promise<UsageSummary> {
    const snapshot = await db
      .collection('ai_token_usage')
      .where('teacherId', '==', teacherId)
      .where('timestamp', '>=', startOfMonth())
      .get();
    
    return {
      totalTokens: sum(docs, 'inputTokens', 'outputTokens'),
      cachedTokens: sum(docs, 'cachedTokens'),
      totalCost: sum(docs, 'cost'),
      operationBreakdown: groupBy(docs, 'operation')
    };
  }
}
```

**Firestore Schema:**
```typescript
// Collection: ai_token_usage
{
  teacherId: "TshYaItjm6aM2XPAckCOZ93uKxL2",
  sessionId: "chat_abc123",
  inputTokens: 3840,
  outputTokens: 1200,
  cachedTokens: 3800, // Saved tokens
  model: "gemini-2.5-flash",
  operation: "course_creation",
  cost: 0.015, // USD
  timestamp: Timestamp
}
```

---

#### 5.3 Usage Dashboard for Teachers
**Problem:** Teachers want to see usage trends over time

**Solution:** Monthly usage dashboard with breakdown

**UI Components:**
```tsx
// app/teacher/ai-usage/page.tsx
export default function AIUsagePage() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>Total Tokens (Nov 2025)</CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">245K</p>
            <Badge variant="success">-45K cached</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>Est. Cost</CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">$7.35</p>
            <p className="text-sm text-muted">vs $13.20 uncached</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>Courses Created</CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm text-muted">~20K tokens/course</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Usage Chart */}
      <Card>
        <CardHeader>Daily Token Usage</CardHeader>
        <CardContent>
          <LineChart data={dailyUsage} />
        </CardContent>
      </Card>
      
      {/* Operation Breakdown */}
      <Card>
        <CardHeader>Usage by Operation</CardHeader>
        <CardContent>
          <Table>
            <TableRow>
              <TableCell>Course Creation</TableCell>
              <TableCell>180K tokens</TableCell>
              <TableCell>$5.40</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Lesson Generation</TableCell>
              <TableCell>50K tokens</TableCell>
              <TableCell>$1.50</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Chat/Planning</TableCell>
              <TableCell>15K tokens</TableCell>
              <TableCell>$0.45</TableCell>
            </TableRow>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Impact:** ✅ Full transparency, ✅ Trust building, ✅ Usage optimization insights

---

## 📋 Implementation Roadmap

### Week 1: Foundation (Days 1-7)
- [ ] **Day 1-2:** Structured output + JSON schema validation
- [ ] **Day 3-4:** Code execution integration for calculations
- [ ] **Day 5-6:** Context caching setup (system prompt)
- [ ] **Day 7:** Testing & validation

**Deliverable:** 20% response quality improvement, 80% cost reduction

---

### Week 2: Batch & Performance (Days 8-14)
- [ ] **Day 8-9:** Batch API integration (course creation)
- [ ] **Day 10-11:** Batch lesson generation
- [ ] **Day 12-13:** Advanced function calling patterns
- [ ] **Day 14:** Load testing & optimization

**Deliverable:** 50% faster bulk operations, zero placeholder errors

---

### Week 3: Transparency & Polish (Days 15-21)
- [ ] **Day 15-16:** Token tracking backend
- [ ] **Day 17-18:** Token usage UI components
- [ ] **Day 19-20:** Usage dashboard for teachers
- [ ] **Day 21:** Documentation & training

**Deliverable:** Full cost transparency, teacher-facing analytics

---

### Week 4: Testing & Rollout (Days 22-28)
- [ ] **Day 22-24:** End-to-end testing with Playwright MCP
- [ ] **Day 25-26:** Performance benchmarking (before/after)
- [ ] **Day 27:** Staged rollout (10% → 50% → 100%)
- [ ] **Day 28:** Documentation update + team training

**Deliverable:** v3.0 in production, metrics tracking active

---

## 🎯 Expected Outcomes

### Quantitative Improvements
| Metric | Baseline | Target | Achievement |
|--------|----------|--------|-------------|
| Response Quality | 3.8/5 | 5.0/5 | **+32%** |
| Error Rate | 5% | 0% | **-100%** |
| Token Cost/Course | $1.50 | $0.30 | **-80%** |
| Bulk Creation Speed | 15 min | 7 min | **-53%** |
| Teacher Satisfaction | 78% | 95% | **+22%** |

### Qualitative Improvements
- ✅ **Zero placeholder ID errors** (strict validation)
- ✅ **Consistent course quality** (structured outputs)
- ✅ **Cost predictability** (transparent usage)
- ✅ **Faster iterations** (batch processing)
- ✅ **Better pedagogy** (code execution for calculations)

---

## 🔗 Reference Documentation

All Gemini API docs for implementation:

1. **Code Execution:** https://ai.google.dev/gemini-api/docs/code-execution
2. **Batch API:** https://ai.google.dev/gemini-api/docs/batch-api
3. **Context Caching:** https://ai.google.dev/gemini-api/docs/caching?lang=node
4. **Token Counting:** https://ai.google.dev/gemini-api/docs/tokens?lang=node
5. **Prompting Strategies:** https://ai.google.dev/gemini-api/docs/prompting-strategies
6. **Function Calling:** https://ai.google.dev/gemini-api/docs/function-calling?example=chart
7. **Long Context:** https://ai.google.dev/gemini-api/docs/long-context

---

## ✅ Success Criteria

v3.0 is considered successful when:

1. ✅ **Zero Errors:** No placeholder IDs in production for 7 consecutive days
2. ✅ **Cost Savings:** 75%+ token cost reduction (measured via token tracker)
3. ✅ **Speed:** Batch course creation 50%+ faster
4. ✅ **Transparency:** 90%+ teachers understand their usage within 1 session
5. ✅ **Satisfaction:** 95%+ positive feedback in post-creation survey

---

**Next Step:** Review this PRD, then proceed to `v3-refinement.scope.md` for implementation boundaries.
