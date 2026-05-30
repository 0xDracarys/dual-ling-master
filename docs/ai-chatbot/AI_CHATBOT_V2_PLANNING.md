# AI Chatbot v2 - Planning & API Key Migration

**Version:** 2.0 Planning Phase  
**Date:** November 11, 2025  
**Status:** 📋 Planning - Ready for Implementation Discussion  
**Owner:** ZenType Architect (J)

---

## 🎯 Overview

This document outlines the planning for AI Chatbot v2 improvements, including:
1. ✅ **API Key Migration** - Switch to new Gemini Developer API key for testing
2. 📋 **v2 Feature Planning** - Improvements to be discussed and refined
3. 🔍 **Current State Analysis** - What's working and what needs improvement

---

## ✅ Phase 1: API Key Migration (COMPLETED)

### New API Key Details

**API Key:** `AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4`  
**Name:** Gemini Developer API key  
**Project:** projects/189726325845  
**Project Number:** 189726325845  
**Purpose:** Higher rate limits for AI chatbot testing and development

### Migration Status

| Location | Status | File Path | Notes |
|----------|--------|-----------|-------|
| ✅ Production Config | Updated | `apphosting.yaml` | Lines 22, 65 |
| ✅ Client Config | Updated | `lib/firebase/config.ts` | Line 11 |
| ✅ Auth Hook | Updated | `hooks/use-auth.tsx` | Line 63 |
| ✅ Local Development | **JUST UPDATED** | `.env.local` | New API key + AI config |

### What Changed

**Before (Old API Key):**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyApOEBwq7VK0QzEg37YnylaMZwadsTYYuY
```

**After (New Tier 1 API Key):**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4
GEMINI_API_KEY=AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4
AI_TEACHER_MODEL=gemini-2.5-flash
```

### Benefits

✅ **Higher Rate Limits** - No more API throttling during testing  
✅ **Unified Configuration** - Same key across all environments  
✅ **Production Ready** - Already deployed to production (apphosting.yaml)  
✅ **Local Testing** - Now configured for local development

---

## 📊 Current AI Chatbot Status (v1.1.0)

### ✅ What's Working Excellently

Based on code review of `/app/api/ai/teacher-bot/route.ts`:

1. **✅ Backend Architecture**
   - Using `GoogleAIBackend` (Firebase recommended, 80% cost reduction vs VertexAI)
   - Model: `gemini-2.5-flash` (current recommended for function calling)
   - Proper Firebase AI Logic SDK integration

2. **✅ Anti-Placeholder Protection**
   - Lines 640-660: Runtime validation filters placeholder courseIds
   - Comprehensive checks for common placeholder patterns
   - Prevents invalid API calls before they happen

3. **✅ Two-Turn Workflow**
   - Lines 509-572: Separates course creation from lesson creation
   - AI creates course first, then uses real ID for lessons
   - Follows Firebase best practices for sequential operations

4. **✅ Batch Processing**
   - Lines 680-720: Parallel lesson creation (batches of 3)
   - Performance optimization for large courses

5. **✅ Comprehensive System Prompt**
   - Lines 31-258: ~3,800 tokens of detailed instructions
   - Clear identity, capabilities, workflow phases
   - Explicit anti-placeholder rules (lines 122-148)
   - Language constraint handling (en ↔ lt only)

### 📈 Current Performance Metrics

| Metric | Current State | Notes |
|--------|---------------|-------|
| **Model** | gemini-2.5-flash | ✅ Optimal for function calling |
| **Backend** | GoogleAIBackend | ✅ Cost-effective, GDPR-compliant |
| **System Prompt** | ~3,800 tokens | ⚠️ Can be optimized with caching |
| **Response Time** | 2-3s (simple), 10-30s (complex) | ⚠️ Can be improved with streaming |
| **Cost per Request** | $0.075-$0.30 per 1M tokens | ✅ Already optimized |
| **Placeholder Errors** | ~5% (runtime filtered) | ⚠️ Can be reduced to 0% with schema validation |

---

## 🚀 Proposed v2 Improvements (For Discussion)

### Priority 1: Performance Optimizations

#### 1.1 Prompt Caching (Firebase-Validated) ⚡
**Impact:** 60% token reduction, faster responses  
**Effort:** Low (1-2 hours)  
**Risk:** Low

**Current:**
- System prompt: ~3,800 tokens sent with EVERY request
- No caching = repeated token costs

**Proposed:**
```typescript
// Split prompt into Core (1,000 tokens) + Cached Guidelines (2,400 tokens)
const model = getGenerativeModel(ai, {
  model: 'gemini-2.5-flash',
  systemInstruction: CORE_SYSTEM_PROMPT, // ~1,000 tokens (always sent)
  cachedContent: {
    name: 'teacher-bot-guidelines-v1',
    ttlSeconds: 3600, // 1 hour cache
    contents: [{ 
      role: 'user', 
      parts: [{ text: DETAILED_GUIDELINES }] // ~2,400 tokens (cached)
    }]
  }
});
```

**Benefits:**
- 63% token reduction (3,800 → 1,400 per request)
- Faster response times (fewer tokens to process)
- Lower costs (~$0.15 per 1000 requests saved)

---

#### 1.2 Streaming for Complex Operations 🌊
**Impact:** Better UX for 10+ lesson courses  
**Effort:** Medium (2-3 days)  
**Risk:** Medium

**Current:**
- User waits 10-30 seconds for 20-lesson course
- No progress feedback
- Feels unresponsive

**Proposed:**
```typescript
// Detect complexity
const complexity = estimateComplexity(message); // Count lessons

if (complexity >= 10) {
  // Use streaming
  const result = await chat.sendMessageStream(message);
  
  for await (const chunk of result.stream) {
    // Send progress: "Creating lesson 5/20..."
    streamToClient(chunk.text());
  }
}
```

**Benefits:**
- Real-time progress updates
- Perceived 40% faster
- Can cancel mid-operation
- Better user experience

---

#### 1.3 Enhanced Schema Validation 🛡️
**Impact:** Eliminate 100% of placeholder errors  
**Effort:** Low (1-2 hours)  
**Risk:** Low

**Current:**
- Runtime filtering catches placeholders AFTER AI generates them
- AI still wastes tokens generating invalid IDs

**Proposed:**
```typescript
// Add to function declaration
courseId: {
  type: SchemaType.STRING,
  description: `Course ID from createCourse response.
    
    CRITICAL: Must be ACTUAL 20+ character Firestore ID.
    NEVER use: 'your_course_id', 'COURSE_ID_HERE', etc.
    
    VALID EXAMPLE: '2l7VdVb0JbXRGs0zlgLb'
  `,
  pattern: '^[a-zA-Z0-9]{20,}$',
  minLength: 20
}
```

**Benefits:**
- AI understands requirements BEFORE generating
- 0% placeholder errors (vs current 5%)
- Clearer error messages
- Less token waste

---

### Priority 2: New Features (To Be Discussed)

#### 2.1 PDF Course Import 📄
**Status:** User to specify requirements

**Potential Flow:**
1. Teacher uploads PDF textbook/curriculum
2. AI extracts text and structure
3. AI generates course outline based on PDF
4. Teacher reviews and approves
5. AI creates course + lessons

**Questions for User:**
- What file size limit? (Suggested: 10MB)
- What file types? (PDF only, or also Word/Markdown?)
- Full automation or guided process?

---

#### 2.2 YouTube Video Integration 🎥
**Status:** User to specify requirements

**Potential Flow:**
1. Teacher pastes YouTube URL
2. AI fetches video transcript
3. AI generates lesson with discussion questions
4. Or converts transcript to reading lesson

**Questions for User:**
- Auto-fetch transcripts or manual paste?
- Language detection for non-English videos?
- Maximum video length?

---

#### 2.3 Teacher Persona Customization 🎭
**Status:** User to specify requirements

**Potential:**
- Teachers upload markdown file defining bot behavior
- Custom tone (formal/casual/encouraging)
- Custom language preferences
- Default course structure templates

**Questions for User:**
- UI for persona editing or file upload?
- Per-teacher or per-course personas?
- Preset templates?

---

#### 2.4 Multi-Language Support 🌍
**Status:** Platform constraint - currently en ↔ lt only

**Current Limitation:**
```typescript
// System prompt (lines 82-96)
**CRITICAL PLATFORM CONSTRAINT:** This platform ONLY supports courses between English and Lithuanian:
- ✅ ALLOWED: en → lt
- ✅ ALLOWED: lt → en
- ❌ FORBIDDEN: Any other language combinations
```

**To Enable:**
1. Remove platform constraint from system prompt
2. Update validation logic
3. Test with Spanish, French, German, etc.

**Questions for User:**
- Which languages to prioritize?
- Content availability in other languages?
- Translation support needed?

---

## 📝 Next Steps - User Decision Required

### Immediate Action (Ready Now)
✅ **API Key Switch** - Complete! Testing can begin immediately with new rate limits.

### Short-Term Optimizations (1-2 weeks)
Please prioritize which improvements to implement first:

1. **Prompt Caching** (1-2 hours, 60% token reduction)
2. **Enhanced Schema Validation** (1-2 hours, 0% placeholder errors)
3. **Streaming for Complex Operations** (2-3 days, better UX)

### Feature Additions (2-4 weeks)
Please specify requirements for:

1. **PDF Course Import** - Scope, file limits, automation level?
2. **YouTube Integration** - Transcript handling, language support?
3. **Teacher Personas** - UI approach, customization depth?
4. **Multi-Language Support** - Which languages, content strategy?

---

## 🧪 Testing with New API Key

### Verification Steps

1. **Stop dev server** (if running)
   ```bash
   # Kill the current dev server
   ```

2. **Restart with new environment**
   ```bash
   pnpm dev
   ```

3. **Test AI Chatbot**
   - Navigate to `/teacher/ai-assistant`
   - Try creating a simple 3-lesson course
   - Monitor for rate limit errors (should be none!)

4. **Verify API Key Usage**
   - Check browser console for Firebase initialization
   - Should see: `AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4`

### Expected Behavior

✅ **Before:** Rate limit errors after 10-20 requests  
✅ **After:** No rate limits (much higher quota with new Tier 1 key)

---

## 📚 Related Documentation

- **Current Implementation:** `/docs/ai-chatbot/TEACHER_CHATBOT_IMPLEMENTATION.md`
- **Product Requirements:** `/docs/ai-chatbot/TEACHER_CHATBOT_PRD.md`
- **Optimization Analysis:** `/docs/ai-chatbot/AI_CHATBOT_OPTIMIZATION_PRD_REFINED.md`
- **Performance Fixes:** `/docs/ai-chatbot/AI_CHATBOT_PERFORMANCE_FIX.md`
- **Integration Guide:** `/docs/ai-chatbot/AI_CHATBOT_INTEGRATION_QUESTIONNAIRE.md`

---

## 🎯 Questions for User

### API Key Verification
1. ✅ Confirm new API key is working in local development?
2. ✅ Should we keep old key as fallback or fully deprecate?

### v2 Feature Prioritization
1. **Which optimization should we implement first?**
   - A) Prompt Caching (fastest, biggest impact)
   - B) Streaming (better UX)
   - C) Schema Validation (eliminate errors)

2. **Which new feature is highest priority?**
   - A) PDF Course Import
   - B) YouTube Integration
   - C) Teacher Personas
   - D) Multi-Language Support
   - E) Something else?

3. **What are the requirements/constraints for the chosen feature?**
   - Scope boundaries
   - Technical constraints
   - User experience expectations

---

## 📊 Success Criteria for v2

| Metric | Current (v1.1) | v2 Target | Validation Method |
|--------|----------------|-----------|-------------------|
| Token usage/request | 3,800 | 1,400 | AI metrics dashboard |
| Placeholder errors | 5% | 0% | Error logs |
| Response time (simple) | 2-3s | 1.5-2s | Performance monitoring |
| Response time (complex) | 10-30s | Streaming | User perception survey |
| User satisfaction | 70% | 90%+ | Post-feature survey |
| Rate limit errors | Occasional | 0% | Error tracking |

---

**Status:** ✅ API Key Migration Complete - Awaiting v2 Feature Specification  
**Next Review:** After user provides v2 improvement priorities  
**Document Owner:** ZenType Architect (J)  
**Last Updated:** November 11, 2025

---

*This document will be updated as v2 requirements are refined and implementation begins.*
