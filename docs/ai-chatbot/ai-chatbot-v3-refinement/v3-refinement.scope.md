# AI Chatbot v3 Refinement - Scope & Safety Document

**Version:** 3.0.0  
**Date:** November 20, 2025  
**Status:** 📋 PLANNING PHASE  
**99% Certainty Rule:** ENFORCED

---

## 🎯 What's In Scope (Safe to Change)

### ✅ SAFE - API Route Enhancement
**Files:**
- `/app/api/ai/teacher-bot/route.ts` (lines 1-1087)

**Allowed Changes:**
1. Add structured output configuration (JSON schema)
2. Enable code execution tool
3. Implement context caching
4. Add token counting and logging
5. Integrate Batch API client
6. Enhance function calling validation

**Boundary:** Must maintain backward compatibility with existing chat history

---

### ✅ SAFE - New Services (Create New Files)
**New Files to Create:**

1. **Token Tracking Service**
   - `/lib/services/ai/token-tracker.service.ts`
   - Log token usage to Firestore
   - Calculate costs
   - Generate monthly reports

2. **Batch Processing Service**
   - `/lib/services/ai/batch-processor.service.ts`
   - Handle bulk course creation
   - Manage batch job lifecycle
   - Poll for completion

3. **Cache Manager**
   - `/lib/services/ai/cache-manager.service.ts`
   - Create/update/delete cached prompts
   - Manage TTL
   - Handle cache invalidation

**Boundary:** Zero dependencies on existing services (standalone)

---

### ✅ SAFE - UI Components (New Only)
**New Components to Create:**

1. **Token Usage Badge**
   - `/components/ai-chatbot/token-usage-badge.tsx`
   - Display tokens + cost per message
   - Green badge for cached tokens

2. **Usage Dashboard**
   - `/app/teacher/ai-usage/page.tsx`
   - Monthly usage charts
   - Cost breakdown by operation
   - Historical trends

3. **Token Summary Card**
   - `/components/ai-chatbot/token-summary-card.tsx`
   - Session-level aggregation
   - Real-time updates

**Boundary:** Do NOT modify existing chat UI components

---

### ✅ SAFE - Firestore Schema (New Collection)
**New Collection:**
```typescript
// Collection: ai_token_usage
{
  id: string;
  teacherId: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  model: string;
  operation: 'course_creation' | 'lesson_generation' | 'chat';
  cost: number;
  timestamp: Timestamp;
  metadata: {
    courseId?: string;
    lessonCount?: number;
    batchSize?: number;
  };
}
```

**Indexes Required:**
```javascript
// firestore.indexes.json
{
  "collectionGroup": "ai_token_usage",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "teacherId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

**Boundary:** Do NOT modify existing collections (courses, lessons, users)

---

## ⚠️ MEDIUM RISK - Proceed with Caution

### ⚠️ MEDIUM - Function Declaration Modifications
**Files:**
- `/app/api/ai/teacher-bot/route.ts` (lines 246-400)

**Risky Changes:**
- Modifying function signatures (breaks existing AI behavior)
- Changing parameter descriptions (AI might not understand)
- Removing required fields (validation failures)

**Safe Approach:**
1. ✅ Add NEW function declarations (e.g., `createBatchCourses`)
2. ✅ Enhance existing descriptions (more examples, clearer rules)
3. ✅ Add runtime validation (catch errors before execution)
4. ❌ Never remove or rename existing functions

**Testing Required:**
- 50+ test prompts with old and new functions
- Verify backward compatibility with existing chat history

---

### ⚠️ MEDIUM - System Prompt Modifications
**Files:**
- `/app/api/ai/teacher-bot/route.ts` (lines 31-258)

**Risky Changes:**
- Removing existing instructions (AI forgets how to behave)
- Changing workflow phases (breaks user expectations)
- Modifying language constraints (allows forbidden languages)

**Safe Approach:**
1. ✅ Add NEW sections (e.g., "Token Usage Transparency")
2. ✅ Enhance existing rules (more examples, edge cases)
3. ✅ Add validation reminders (reinforce placeholder checks)
4. ❌ Never remove existing behavioral rules

**Testing Required:**
- Compare v2 vs v3 responses for same 20 test prompts
- Measure consistency (should be 95%+ similar)

---

## 🚨 HIGH RISK - Do NOT Touch

### 🚨 HIGH RISK - Course/Lesson Services
**Files:**
- `/lib/services/course/course.service.ts`
- `/lib/repositories/course.repository.ts`
- `/lib/repositories/lesson.repository.ts`

**Why High Risk:**
- Used by 10+ other features (profile, dashboard, enrollment)
- Any change breaks existing courses in production
- Complex validation logic (already working)

**Rule:** ✅ Use services as-is, ❌ Never modify internals

---

### 🚨 HIGH RISK - Firebase Config
**Files:**
- `/lib/firebase/config.ts`
- `/lib/firebase/admin.ts`
- `apphosting.yaml`

**Why High Risk:**
- API key already migrated (working in production)
- Config changes require redeployment
- Breaks authentication if wrong

**Rule:** ✅ Read config values, ❌ Never change config structure

---

### 🚨 HIGH RISK - Existing Chat UI
**Files:**
- `/components/ai-chatbot/chat-interface.tsx`
- `/components/ai-chatbot/message-list.tsx`
- `/components/ai-chatbot/chat-input.tsx`

**Why High Risk:**
- Teachers actively using (daily)
- Complex state management
- Tightly coupled with API route

**Rule:** ✅ Add new components alongside, ❌ Never modify existing UI logic

---

## 📐 Architecture Boundaries

### Allowed Dependencies (Green Light)
```
v3 Refinement
  ↓ CAN USE ↓
  - Firebase AI SDK (read-only)
  - Gemini API (new features only)
  - Firestore (new collections only)
  - Course Service (call methods, don't modify)
  - Lesson Service (call methods, don't modify)
  - Token Tracker (new service)
  - Batch Processor (new service)
  - Cache Manager (new service)
```

### Forbidden Dependencies (Red Light)
```
v3 Refinement
  ↓ CANNOT MODIFY ↓
  - Authentication system
  - User profiles
  - Enrollment logic
  - Dashboard components
  - Course repository internals
  - Lesson repository internals
  - Firebase config structure
```

---

## 🧪 Testing Requirements (99% Certainty)

### Phase 1: Unit Tests (Per Feature)
Each new feature must have:
- ✅ 90%+ code coverage
- ✅ Edge case tests (empty inputs, invalid tokens, etc.)
- ✅ Error handling tests (API failures, timeouts)

**Example:**
```typescript
// __tests__/services/token-tracker.test.ts
describe('TokenTrackerService', () => {
  it('should log usage to Firestore', async () => {
    const result = await tokenTracker.logUsage(teacherId, {
      inputTokens: 1000,
      outputTokens: 500,
      cachedTokens: 800
    });
    
    expect(result).toBeDefined();
    expect(result.cost).toBeCloseTo(0.015, 3);
  });
  
  it('should handle missing teacher ID gracefully', async () => {
    await expect(
      tokenTracker.logUsage('', { ... })
    ).rejects.toThrow('teacherId required');
  });
});
```

---

### Phase 2: Integration Tests (Cross-Feature)
Test interactions between services:
- ✅ AI Route → Token Tracker → Firestore
- ✅ Batch Processor → Course Service → Database
- ✅ Cache Manager → Gemini API → Response

**Example:**
```typescript
// __tests__/api/teacher-bot-v3.integration.test.ts
describe('Teacher Bot v3 Integration', () => {
  it('should track tokens after course creation', async () => {
    const response = await POST('/api/ai/teacher-bot', {
      message: 'Create a course about Spanish verbs'
    });
    
    expect(response.status).toBe(200);
    
    // Verify token logging
    const usage = await db
      .collection('ai_token_usage')
      .where('sessionId', '==', response.sessionId)
      .get();
    
    expect(usage.docs.length).toBeGreaterThan(0);
    expect(usage.docs[0].data().operation).toBe('course_creation');
  });
});
```

---

### Phase 3: Playwright MCP Tests (UI Validation)
Test user-facing functionality:
- ✅ Create course via chatbot
- ✅ Verify token badge appears
- ✅ Check usage dashboard displays data
- ✅ Confirm batch creation works

**Example:**
```typescript
// __tests__/e2e/ai-chatbot-v3.spec.ts
test('should display token usage after course creation', async ({ page }) => {
  await page.goto('/teacher/chatbot');
  
  // Send message
  await page.fill('[data-testid="chat-input"]', 'Create a course');
  await page.click('[data-testid="send-button"]');
  
  // Wait for response
  await page.waitForSelector('[data-testid="ai-response"]');
  
  // Verify token badge appears
  const tokenBadge = await page.locator('[data-testid="token-badge"]');
  await expect(tokenBadge).toBeVisible();
  await expect(tokenBadge).toContainText('tokens');
  await expect(tokenBadge).toContainText('$');
});
```

---

### Phase 4: Load Testing (Performance Validation)
Test under realistic load:
- ✅ 100 concurrent teachers using chatbot
- ✅ 50 batch course creations simultaneously
- ✅ 1000 cache hits per minute
- ✅ 10K token logs per day

**Tools:**
- Artillery.io for load generation
- Firebase Performance Monitoring
- Custom metrics in Cloud Logging

**Pass Criteria:**
- ✅ P95 response time < 3 seconds
- ✅ 0 errors under load
- ✅ Cache hit rate > 80%
- ✅ Token tracking latency < 100ms

---

## 🔒 Rollback Plan

### If Something Goes Wrong

**Immediate Actions (Within 5 Minutes):**
1. Revert to v1.1.0 API route (git checkout previous version)
2. Disable token tracking (feature flag in apphosting.yaml)
3. Notify active teachers via dashboard banner

**Rollback Procedure:**
```bash
# 1. Revert API route
git checkout v1.1.0 -- app/api/ai/teacher-bot/route.ts

# 2. Disable new services (env vars)
firebase apphosting:secrets:set ENABLE_TOKEN_TRACKING=false
firebase apphosting:secrets:set ENABLE_BATCH_API=false
firebase apphosting:secrets:set ENABLE_CACHING=false

# 3. Deploy immediately
git commit -m "Rollback to v1.1.0 - v3 issues detected"
git push origin master
```

**Monitoring Post-Rollback:**
- ✅ Check error rates (should drop to <0.5%)
- ✅ Verify chatbot responses (should return to normal)
- ✅ Monitor teacher feedback (survey)

---

## 📊 Risk Assessment Matrix

| Feature | Risk Level | Impact if Fails | Mitigation |
|---------|------------|----------------|------------|
| Structured Output | LOW | AI returns invalid JSON | Runtime validation catches it |
| Code Execution | LOW | Calculation errors | Fallback to non-code mode |
| Context Caching | MEDIUM | Stale prompts | 1-hour TTL auto-refresh |
| Batch API | MEDIUM | Bulk operations fail | Serial fallback mode |
| Token Tracking | LOW | Missing usage data | Non-blocking, logs errors |
| Function Calling Changes | HIGH | AI breaks completely | Extensive testing + gradual rollout |
| System Prompt Changes | HIGH | AI personality changes | A/B test with 10% of users first |

---

## ✅ Checklist Before Each Change

Before modifying ANY file, confirm:

- [ ] ✅ File is in "Safe to Change" list above
- [ ] ✅ Change is backward compatible (old chat history still works)
- [ ] ✅ Unit tests written and passing
- [ ] ✅ Integration tests passing
- [ ] ✅ No impact on other features (checked cross-references)
- [ ] ✅ Rollback plan documented
- [ ] ✅ Monitoring/alerts configured
- [ ] ✅ 99% certain this won't break production

**If ANY checkbox is unchecked → STOP and reassess.**

---

**Next Step:** Review this scope, then proceed to `v3-refinement.implementation-guide.md` for detailed code examples.
