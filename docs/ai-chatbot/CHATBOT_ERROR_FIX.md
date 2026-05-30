# AI Chatbot Error Fix - November 2025

## Problem Summary
The AI chatbot was experiencing frequent errors, timeouts, and hanging responses.

## Root Causes Identified

### 1. **Structured Output vs Function Calling Conflict** ⚠️ CRITICAL
**Issue:** Using `responseMimeType: "application/json"` with JSON schema response **simultaneously with function calling** - these are mutually exclusive in Gemini API.

**What was happening:**
- Planning mode: Structured JSON output ✅ (correct)
- Building mode: `generationConfig: undefined` ❌ (wrong - still inherited JSON schema)
- Result: AI couldn't properly use function calling, causing hangs/timeouts

**Fix Applied:**
```typescript
// BEFORE (broken)
generationConfig: mode === 'planning' ? getStructuredOutputConfig() : undefined

// AFTER (fixed)
generationConfig: mode === 'planning' 
  ? getStructuredOutputConfig() 
  : {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 4096
      // NO responseMimeType or responseSchema
    }
```

### 2. **Batch Processing Race Conditions**
**Issue:** Creating 3 lessons in parallel caused Firestore write conflicts when incrementing lesson order.

**What was happening:**
- Multiple lessons trying to read/write order simultaneously
- Race conditions on order calculation
- Some lessons failing silently

**Fix Applied:**
```typescript
// BEFORE
const batchSize = 3;

// AFTER (safer)
const batchSize = 2; // Reduced to minimize Firestore conflicts
```

### 3. **Missing Response Validation**
**Issue:** No validation that AI actually returned usable content before processing.

**What was happening:**
- Empty responses from AI not caught early
- Safety filters blocking responses not detected
- Confusing error messages

**Fix Applied:**
```typescript
// Added validation
const initialText = response.text?.() || '';
const initialFunctions = response.functionCalls?.() || [];

if (!initialText && initialFunctions.length === 0) {
  throw new Error('AI returned empty response. This may be due to safety filters or model configuration issues.');
}
```

## Impact of Fixes

### Expected Improvements:
1. ✅ **Faster responses** - No more JSON schema conflicts
2. ✅ **Fewer timeouts** - AI can properly execute function calls
3. ✅ **Better error messages** - Clear validation failures
4. ✅ **Fewer lesson creation failures** - Reduced race conditions
5. ✅ **More reliable function calling** - Proper configuration separation

### Testing Checklist:
- [ ] Planning mode: Ask questions, get JSON responses
- [ ] Building mode: Create course → see function calls work
- [ ] Building mode: Create lessons → no race condition errors
- [ ] Error handling: Try blocked content → see clear error message
- [ ] getLesson/updateLesson (EDITING mode) → verify works without conflicts

## Technical Details

### Gemini API Constraints:
1. **Cannot use both** `responseMimeType: "application/json"` **and** function calling
2. Must choose ONE:
   - Structured JSON output (no functions)
   - Function calling (no JSON schema)

### Mode-Specific Configs:
- **Planning Mode**: Structured JSON for chat responses
- **Building Mode**: Function calling for course/lesson creation
- **EDITING Mode**: Function calling for getLesson/updateLesson

## Files Modified
- `/app/api/ai/teacher-bot/route.ts`
  - Line ~1000: Fixed generationConfig separation
  - Line ~1060: Added response validation
  - Line ~1430: Reduced batch size from 3 to 2

## Related Documentation
- [Firebase AI Logic: Function Calling](https://firebase.google.com/docs/ai-logic/function-calling)
- [Gemini API: JSON Mode](https://ai.google.dev/gemini-api/docs/json-mode)
- [Teacher Chatbot PRD](../ai-chatbot-v3-refinement/ai-chatbot-v3-refinement.prd.md)

## Future Improvements
1. Implement response streaming for better UX during long operations
2. Add retry logic for Firestore write conflicts
3. Implement exponential backoff for batch processing
4. Add circuit breaker for repeated failures
5. Cache lesson order to reduce Firestore reads
