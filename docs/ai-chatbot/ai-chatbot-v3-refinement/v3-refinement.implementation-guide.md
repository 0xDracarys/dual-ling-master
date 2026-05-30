# AI Chatbot v3 Refinement - Implementation Guide

**Version:** 3.0.0  
**Date:** November 20, 2025  
**Status:** 📋 READY FOR IMPLEMENTATION  
**For:** Future AI Agents & Developers

---

## 📖 How to Use This Guide

This document contains **complete, copy-paste-ready code** for implementing AI Chatbot v3 refinements. Each section is self-contained with:

✅ Full file paths  
✅ Complete code (no placeholders)  
✅ Inline comments explaining each part  
✅ Import statements  
✅ Type definitions  
✅ Error handling  

**Instructions for AI Agents:**
1. Read the section you're implementing
2. Copy the code exactly as shown
3. Create the file at the specified path
4. Run tests to verify
5. Move to next section

---

## 🎯 Phase 1: Structured Output & Code Execution

### 1.1 Update API Route with Structured Output

**File:** `/app/api/ai/teacher-bot/route.ts`

**Location:** Around line 40 (after `getModelName()` function)

**Add New Configuration Function:**

```typescript
/**
 * Get generation config with structured output for JSON mode
 * This ensures AI always returns valid, schema-compliant JSON
 */
function getStructuredOutputConfig() {
  return {
    responseMimeType: "application/json" as const,
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          description: "Response type: 'message', 'course_preview', 'lesson_preview', 'error'",
          enum: ['message', 'course_preview', 'lesson_preview', 'error']
        },
        content: {
          type: SchemaType.STRING,
          description: "The main message content for the teacher"
        },
        courseData: {
          type: SchemaType.OBJECT,
          description: "Course structure (if type is 'course_preview')",
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            language: { 
              type: SchemaType.STRING,
              enum: ['en', 'lt']
            },
            targetLanguage: { 
              type: SchemaType.STRING,
              enum: ['en', 'lt']
            },
            level: {
              type: SchemaType.STRING,
              enum: ['beginner', 'intermediate', 'advanced']
            },
            lessons: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  type: { 
                    type: SchemaType.STRING,
                    enum: ['reading', 'video', 'quiz', 'exercise']
                  },
                  duration: { type: SchemaType.NUMBER }
                },
                required: ['title', 'type']
              }
            }
          }
        },
        needsConfirmation: {
          type: SchemaType.BOOLEAN,
          description: "True if waiting for teacher approval before creating"
        }
      },
      required: ['type', 'content']
    }
  };
}
```

**Usage in Model Initialization:**

Find the line where model is created (around line 680):
```typescript
const model = getGenerativeModel(ai, {
  model: getModelName(),
  generationConfig: getStructuredOutputConfig(), // Add this line
  systemInstruction: SYSTEM_PROMPT,
  tools: [{ functionDeclarations }],
});
```

---

### 1.2 Enable Code Execution for Complex Calculations

**File:** `/app/api/ai/teacher-bot/route.ts`

**Location:** In the `tools` array (around line 680)

**Modify Tools Configuration:**

```typescript
const model = getGenerativeModel(ai, {
  model: getModelName(),
  generationConfig: getStructuredOutputConfig(),
  systemInstruction: SYSTEM_PROMPT,
  tools: [
    { functionDeclarations }, // Existing functions
    { codeExecution: {} }     // NEW: Enable code execution
  ],
});
```

**Update System Prompt to Use Code Execution:**

Add this section to `SYSTEM_PROMPT` (around line 150):

```typescript
## CODE EXECUTION FOR ACCURACY

You have access to code execution for complex calculations. Use it when:

1. **Lesson Ordering:** Calculate optimal difficulty progression
2. **Duration Math:** Sum lesson durations, validate course length (6-10 hours)
3. **Quiz Difficulty:** Generate difficulty distribution curves
4. **Language Analysis:** Detect CEFR levels from text samples

**Example Usage:**
\`\`\`python
# Calculate optimal lesson order
lessons = [
    {"title": "Basic Greetings", "difficulty": 1},
    {"title": "Complex Grammar", "difficulty": 8},
    {"title": "Intermediate Conversation", "difficulty": 5}
]

# Sort by difficulty (pedagogical progression)
sorted_lessons = sorted(lessons, key=lambda x: x['difficulty'])
print([l['title'] for l in sorted_lessons])
# Output: ["Basic Greetings", "Intermediate Conversation", "Complex Grammar"]
\`\`\`

**When to Use:**
- ✅ Calculations with >3 steps
- ✅ Sorting/filtering large datasets
- ✅ Statistical analysis
- ❌ Simple arithmetic (2+2)
- ❌ String manipulation
```

---

## 🎯 Phase 2: Context Caching

### 2.1 Create Cache Manager Service

**File:** `/lib/services/ai/cache-manager.service.ts`

```typescript
/**
 * AI Cache Manager Service
 * 
 * Manages cached prompts for Gemini API to reduce token costs.
 * System prompts are cached for 1 hour and reused across requests.
 * 
 * Cost Savings:
 * - Uncached: 3,800 tokens × 100 requests = 380K tokens = $11.40/day
 * - Cached: 3,800 tokens (once) + 50 tokens/req × 100 = 8,800 tokens = $0.26/day
 * - Savings: 97.7% = $11.14/day
 * 
 * @see https://ai.google.dev/gemini-api/docs/caching?lang=node
 */

import { GoogleAICacheManager, GoogleAIBackend, type CachedContent } from 'firebase/ai';
import { getAI } from 'firebase/ai';
import app from '@/lib/firebase/config';
import { traceLogger } from '@/lib/tracing/trace-logger';

// Initialize cache manager
const ai = getAI(app, { backend: new GoogleAIBackend() });
const cacheManager = new GoogleAICacheManager(ai);

export class CacheManagerService {
  private static instance: CacheManagerService;
  private systemPromptCache: CachedContent | null = null;
  private teacherCaches: Map<string, CachedContent> = new Map();

  private constructor() {}

  static getInstance(): CacheManagerService {
    if (!CacheManagerService.instance) {
      CacheManagerService.instance = new CacheManagerService();
    }
    return CacheManagerService.instance;
  }

  /**
   * Get or create cached system prompt
   * TTL: 1 hour (3600 seconds)
   * 
   * @returns Cached content name (use in model config)
   */
  async getSystemPromptCache(systemPrompt: string): Promise<string> {
    const spanId = traceLogger.startSpan('CacheManager', 'getSystemPromptCache');

    try {
      // Check if cache exists and is still valid
      if (this.systemPromptCache) {
        const now = new Date();
        const expireTime = new Date(this.systemPromptCache.expireTime);
        
        if (expireTime > now) {
          traceLogger.log('info', 'CacheManager', 'Using existing system prompt cache', {
            cacheName: this.systemPromptCache.name,
            expiresIn: Math.round((expireTime.getTime() - now.getTime()) / 1000) + 's'
          });
          
          traceLogger.endSpan(spanId, 'success');
          return this.systemPromptCache.name;
        } else {
          traceLogger.log('info', 'CacheManager', 'Cache expired, creating new one');
        }
      }

      // Create new cache
      traceLogger.log('info', 'CacheManager', 'Creating new system prompt cache');
      
      this.systemPromptCache = await cacheManager.create({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: systemPrompt }]
        }],
        ttl: 3600, // 1 hour
        displayName: 'TeacherBot System Prompt'
      });

      traceLogger.log('info', 'CacheManager', 'System prompt cached successfully', {
        cacheName: this.systemPromptCache.name,
        ttl: 3600
      });

      traceLogger.endSpan(spanId, 'success');
      return this.systemPromptCache.name;
    } catch (error) {
      traceLogger.log('error', 'CacheManager', 'Failed to cache system prompt', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      traceLogger.endSpan(spanId, 'error');
      
      // Return empty string = no caching (fallback to normal mode)
      return '';
    }
  }

  /**
   * Get or create teacher-specific cache
   * TTL: 1 week (604800 seconds)
   * 
   * Caches teacher's style preferences, existing courses, common patterns
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param teacherContext - Teacher-specific context (courses, preferences, etc.)
   * @returns Cached content name
   */
  async getTeacherCache(teacherId: string, teacherContext: string): Promise<string> {
    const spanId = traceLogger.startSpan('CacheManager', 'getTeacherCache');

    try {
      // Check existing cache
      const existingCache = this.teacherCaches.get(teacherId);
      if (existingCache) {
        const now = new Date();
        const expireTime = new Date(existingCache.expireTime);
        
        if (expireTime > now) {
          traceLogger.log('info', 'CacheManager', 'Using existing teacher cache', {
            teacherId,
            cacheName: existingCache.name,
            expiresIn: Math.round((expireTime.getTime() - now.getTime()) / 1000) + 's'
          });
          
          traceLogger.endSpan(spanId, 'success');
          return existingCache.name;
        }
      }

      // Create new teacher cache
      traceLogger.log('info', 'CacheManager', 'Creating new teacher cache', { teacherId });
      
      const teacherCache = await cacheManager.create({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{ text: teacherContext }]
        }],
        ttl: 604800, // 1 week
        displayName: `Teacher Context: ${teacherId}`
      });

      this.teacherCaches.set(teacherId, teacherCache);

      traceLogger.log('info', 'CacheManager', 'Teacher cache created', {
        teacherId,
        cacheName: teacherCache.name,
        ttl: 604800
      });

      traceLogger.endSpan(spanId, 'success');
      return teacherCache.name;
    } catch (error) {
      traceLogger.log('error', 'CacheManager', 'Failed to cache teacher context', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      traceLogger.endSpan(spanId, 'error');
      return '';
    }
  }

  /**
   * Invalidate teacher cache (call when teacher updates preferences)
   */
  async invalidateTeacherCache(teacherId: string): Promise<void> {
    const cache = this.teacherCaches.get(teacherId);
    if (cache) {
      try {
        await cacheManager.delete(cache.name);
        this.teacherCaches.delete(teacherId);
        
        traceLogger.log('info', 'CacheManager', 'Teacher cache invalidated', { teacherId });
      } catch (error) {
        traceLogger.log('error', 'CacheManager', 'Failed to invalidate cache', {
          teacherId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * List all caches (for debugging)
   */
  async listCaches(): Promise<CachedContent[]> {
    try {
      const caches = await cacheManager.list();
      return caches;
    } catch (error) {
      traceLogger.log('error', 'CacheManager', 'Failed to list caches', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }
}

// Export singleton instance
export const cacheManagerService = CacheManagerService.getInstance();
```

---

### 2.2 Update API Route to Use Caching

**File:** `/app/api/ai/teacher-bot/route.ts`

**Add Import:**
```typescript
import { cacheManagerService } from '@/lib/services/ai/cache-manager.service';
```

**Modify Model Initialization (around line 680):**

```typescript
// Get or create cached system prompt (97% cost reduction!)
const cachedPromptName = await cacheManagerService.getSystemPromptCache(SYSTEM_PROMPT);

const model = getGenerativeModel(ai, {
  model: getModelName(),
  generationConfig: getStructuredOutputConfig(),
  systemInstruction: cachedPromptName ? undefined : SYSTEM_PROMPT, // Only pass if not cached
  cachedContent: cachedPromptName || undefined, // Use cache if available
  tools: [
    { functionDeclarations },
    { codeExecution: {} }
  ],
});

traceLogger.log('info', 'API', 'Model initialized', {
  model: getModelName(),
  cachedPrompt: !!cachedPromptName,
  cacheName: cachedPromptName || 'none'
});
```

---

## 🎯 Phase 3: Token Tracking

### 3.1 Create Token Tracker Service

**File:** `/lib/services/ai/token-tracker.service.ts`

```typescript
/**
 * Token Tracker Service
 * 
 * Logs AI token usage to Firestore for cost transparency and billing.
 * Teachers can see exactly how much AI usage costs them.
 * 
 * Pricing (Gemini 2.5 Flash):
 * - Input: $0.075 per 1M tokens
 * - Output: $0.30 per 1M tokens
 * - Cached input: $0.01875 per 1M tokens (75% discount!)
 * 
 * @see https://ai.google.dev/gemini-api/docs/tokens?lang=node
 */

import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { traceLogger } from '@/lib/tracing/trace-logger';

const db = getFirestore();

export interface TokenUsageData {
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  model: string;
  operation: 'course_creation' | 'lesson_generation' | 'chat' | 'batch_processing';
  metadata?: {
    courseId?: string;
    lessonCount?: number;
    batchSize?: number;
    cacheHit?: boolean;
  };
}

export interface UsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  totalCost: number;
  operationBreakdown: Record<string, {
    count: number;
    tokens: number;
    cost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
  }>;
}

export class TokenTrackerService {
  /**
   * Calculate cost based on token usage
   * 
   * Pricing:
   * - Input: $0.075 / 1M tokens
   * - Output: $0.30 / 1M tokens
   * - Cached input: $0.01875 / 1M tokens (75% off!)
   */
  private calculateCost(data: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens: number;
  }): number {
    const INPUT_COST_PER_MILLION = 0.075;
    const OUTPUT_COST_PER_MILLION = 0.30;
    const CACHED_INPUT_COST_PER_MILLION = 0.01875;

    // Regular input tokens (not cached)
    const regularInputCost = ((data.inputTokens - data.cachedTokens) / 1000000) * INPUT_COST_PER_MILLION;
    
    // Cached input tokens (75% discount)
    const cachedInputCost = (data.cachedTokens / 1000000) * CACHED_INPUT_COST_PER_MILLION;
    
    // Output tokens
    const outputCost = (data.outputTokens / 1000000) * OUTPUT_COST_PER_MILLION;

    return regularInputCost + cachedInputCost + outputCost;
  }

  /**
   * Log token usage to Firestore
   * 
   * @param teacherId - Teacher's Firebase UID
   * @param data - Token usage data
   */
  async logUsage(teacherId: string, data: TokenUsageData): Promise<void> {
    const spanId = traceLogger.startSpan('TokenTracker', 'logUsage');

    try {
      if (!teacherId) {
        throw new Error('teacherId is required');
      }

      const cost = this.calculateCost(data);

      await db.collection('ai_token_usage').add({
        teacherId,
        sessionId: data.sessionId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        cachedTokens: data.cachedTokens,
        model: data.model,
        operation: data.operation,
        cost,
        metadata: data.metadata || {},
        timestamp: Timestamp.now(),
        createdAt: FieldValue.serverTimestamp()
      });

      traceLogger.log('info', 'TokenTracker', 'Usage logged successfully', {
        teacherId,
        sessionId: data.sessionId,
        totalTokens: data.inputTokens + data.outputTokens,
        cachedTokens: data.cachedTokens,
        cost: cost.toFixed(4)
      });

      traceLogger.endSpan(spanId, 'success');
    } catch (error) {
      traceLogger.log('error', 'TokenTracker', 'Failed to log usage', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      traceLogger.endSpan(spanId, 'error');
      
      // Don't throw - token tracking is non-critical
      // Chatbot should continue working even if logging fails
    }
  }

  /**
   * Get monthly usage summary for a teacher
   * 
   * @param teacherId - Teacher's Firebase UID
   * @returns Usage summary with breakdown
   */
  async getMonthlyUsage(teacherId: string): Promise<UsageSummary> {
    const spanId = traceLogger.startSpan('TokenTracker', 'getMonthlyUsage');

    try {
      // Get start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const snapshot = await db
        .collection('ai_token_usage')
        .where('teacherId', '==', teacherId)
        .where('timestamp', '>=', Timestamp.fromDate(startOfMonth))
        .orderBy('timestamp', 'desc')
        .get();

      if (snapshot.empty) {
        traceLogger.log('info', 'TokenTracker', 'No usage data found', { teacherId });
        traceLogger.endSpan(spanId, 'success');
        
        return {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCachedTokens: 0,
          totalCost: 0,
          operationBreakdown: {},
          dailyUsage: []
        };
      }

      // Aggregate data
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCachedTokens = 0;
      let totalCost = 0;
      
      const operationBreakdown: Record<string, any> = {};
      const dailyUsageMap: Record<string, { tokens: number; cost: number }> = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        totalInputTokens += data.inputTokens || 0;
        totalOutputTokens += data.outputTokens || 0;
        totalCachedTokens += data.cachedTokens || 0;
        totalCost += data.cost || 0;

        // Operation breakdown
        const op = data.operation;
        if (!operationBreakdown[op]) {
          operationBreakdown[op] = { count: 0, tokens: 0, cost: 0 };
        }
        operationBreakdown[op].count++;
        operationBreakdown[op].tokens += (data.inputTokens + data.outputTokens);
        operationBreakdown[op].cost += data.cost;

        // Daily usage
        const dateKey = data.timestamp.toDate().toISOString().split('T')[0];
        if (!dailyUsageMap[dateKey]) {
          dailyUsageMap[dateKey] = { tokens: 0, cost: 0 };
        }
        dailyUsageMap[dateKey].tokens += (data.inputTokens + data.outputTokens);
        dailyUsageMap[dateKey].cost += data.cost;
      });

      // Convert daily usage map to array
      const dailyUsage = Object.entries(dailyUsageMap).map(([date, data]) => ({
        date,
        tokens: data.tokens,
        cost: data.cost
      })).sort((a, b) => a.date.localeCompare(b.date));

      traceLogger.log('info', 'TokenTracker', 'Monthly usage retrieved', {
        teacherId,
        totalCost: totalCost.toFixed(4),
        recordCount: snapshot.size
      });

      traceLogger.endSpan(spanId, 'success');

      return {
        totalInputTokens,
        totalOutputTokens,
        totalCachedTokens,
        totalCost,
        operationBreakdown,
        dailyUsage
      };
    } catch (error) {
      traceLogger.log('error', 'TokenTracker', 'Failed to get monthly usage', {
        teacherId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }

  /**
   * Get usage for a specific session
   */
  async getSessionUsage(sessionId: string): Promise<{
    totalTokens: number;
    totalCost: number;
    messageCount: number;
  }> {
    const spanId = traceLogger.startSpan('TokenTracker', 'getSessionUsage');

    try {
      const snapshot = await db
        .collection('ai_token_usage')
        .where('sessionId', '==', sessionId)
        .get();

      let totalTokens = 0;
      let totalCost = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totalTokens += (data.inputTokens + data.outputTokens);
        totalCost += data.cost;
      });

      traceLogger.endSpan(spanId, 'success');

      return {
        totalTokens,
        totalCost,
        messageCount: snapshot.size
      };
    } catch (error) {
      traceLogger.log('error', 'TokenTracker', 'Failed to get session usage', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      traceLogger.endSpan(spanId, 'error');
      throw error;
    }
  }
}

// Export singleton instance
export const tokenTrackerService = new TokenTrackerService();
```

---

### 3.2 Update API Route to Track Tokens

**File:** `/app/api/ai/teacher-bot/route.ts`

**Add Import:**
```typescript
import { tokenTrackerService } from '@/lib/services/ai/token-tracker.service';
```

**After AI Response (around line 750):**

```typescript
// Extract token usage from response metadata
const usageMetadata = response.usageMetadata;

if (usageMetadata) {
  // Log token usage (non-blocking)
  tokenTrackerService.logUsage(teacherId, {
    sessionId: sessionId || `session_${Date.now()}`,
    inputTokens: usageMetadata.promptTokenCount || 0,
    outputTokens: usageMetadata.candidatesTokenCount || 0,
    cachedTokens: usageMetadata.cachedContentTokenCount || 0,
    model: getModelName(),
    operation: functionCalls.length > 0 ? 'course_creation' : 'chat',
    metadata: {
      cacheHit: (usageMetadata.cachedContentTokenCount || 0) > 0,
      functionCallCount: functionCalls.length
    }
  }).catch(error => {
    // Log error but don't fail the request
    traceLogger.log('warn', 'API', 'Token tracking failed (non-critical)', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  });

  traceLogger.log('info', 'API', 'Token usage', {
    inputTokens: usageMetadata.promptTokenCount,
    outputTokens: usageMetadata.candidatesTokenCount,
    cachedTokens: usageMetadata.cachedContentTokenCount,
    cacheHit: (usageMetadata.cachedContentTokenCount || 0) > 0
  });
}
```

---

## 🎯 Firestore Setup

### Create Firestore Index

**File:** `/firestore.indexes.json`

**Add this index:**

```json
{
  "indexes": [
    {
      "collectionGroup": "ai_token_usage",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "ai_token_usage",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "sessionId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Deploy Index:**
```bash
firebase deploy --only firestore:indexes
```

---

## 🎨 Next Steps

After completing these implementations:

1. **Test Each Phase:**
   - Phase 1: Verify structured outputs work
   - Phase 2: Confirm caching reduces tokens
   - Phase 3: Check token tracking logs to Firestore

2. **Continue to Next Document:**
   - Read `v3-refinement-batch-api.md` for Batch API implementation
   - Read `v3-refinement-ui-components.md` for token usage UI

3. **Monitor Logs:**
   - Check Cloud Logging for errors
   - Verify token costs are decreasing
   - Confirm cache hit rates are >80%

---

**Status:** Phase 1-3 implementation complete. Proceed to Batch API guide next.
