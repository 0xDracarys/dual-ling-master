# AI Chatbot Problem Analysis - November 11, 2025

## Executive Summary
Based on the Playwright session log (#file:chatbot-log.txt) and user feedback, the Teacher AI Chatbot has several critical UX/functionality issues that significantly impact usability and user experience.

---

## 🔴 Critical Issues Identified

### **Issue #1: Message Accumulation Bug**

**Problem:**
- The chatbot displays ALL previous conversation messages in EVERY new AI response
- Instead of showing just the latest AI answer, it accumulates the entire chat history
- This creates an overwhelming wall of text that repeats everything said before

**Evidence from log:**
```
User: "create first lesson"
Bot Response: [Shows entire course creation checklist again + previous messages + new lesson content]

User: "create second lesson"
Bot Response: [Shows ALL previous messages AGAIN + new lesson creation]
```

**Impact:**
- **Severe UX degradation** - Users have to scroll through repeated content
- **Cognitive overload** - Hard to identify what's new vs. what's old
- **Looks unprofessional** - Appears broken/buggy
- **Wastes screen space** - 80% of message is duplicate content

**Root Cause:**
```tsx
// Current implementation in page.tsx (lines 136-152)
if (data.conversationHistory && Array.isArray(data.conversationHistory)) {
  const modelResponses = data.conversationHistory
    .filter((msg: any) => msg.role === 'model')
    .slice(-3) // Gets last 3 model responses
  
  if (modelResponses.length > 0) {
    const textParts = modelResponses
      .map((msg: any) => msg.parts?.[0]?.text || '')
      .filter(Boolean)
    
    if (textParts.length > 0) {
      finalContent = textParts.join('\n\n') // JOINS all 3 responses together
    }
  }
}
```

**Why it happens:**
- Backend returns the entire `conversationHistory` array
- Frontend extracts the **last 3 model responses** and concatenates them
- This was intended to handle multi-turn function calls (course → lessons)
- But it ALWAYS shows 3 messages, even when only 1 is needed

---

### **Issue #2: Planning Mode + Building Action Conflict**

**Problem:**
- User is in **Planning Mode** (function calling disabled)
- User asks: "create a course on ELDEN RING"
- AI generates a preview but CANNOT execute because functions are disabled
- User must manually switch to Building Mode to execute
- This wastes time and creates frustration

**Current Flow:**
```
1. User (Planning Mode): "Create course X"
2. Bot: [Shows course preview + checklist]
3. User: "create the course"
4. Bot: [Shows same preview again, still can't execute]
5. User: Manually clicks "🧠 Planning Mode" badge to switch
6. User: "create the course" (repeats request AGAIN)
7. Bot: [Finally executes course creation]
```

**Impact:**
- **Inefficient workflow** - Extra steps required
- **User confusion** - "Why isn't it creating the course?"
- **Wasted AI tokens** - Repeated conversations
- **Poor UX** - Mode switching should be seamless

**Desired Flow:**
```
1. User (Planning Mode): "Create course X"
2. Bot: [Detects building action in planning mode]
3. Popup: "⚡ This action requires Building Mode. Switch now?" [Switch] [Cancel]
4. User: Clicks [Switch]
5. Mode automatically changes to Building
6. Bot: [Executes course creation without repeating request]
```

---

### **Issue #3: Mode Toggle Visibility**

**Problem:**
- Mode toggle badge is at the **top-right of the page**
- Chat interface is in the **middle/bottom of the page**
- User must scroll up to change modes
- Mode indicator near input is text-only, not interactive

**Current UI:**
```
┌─────────────────────────────────────────────┐
│  AI Course Assistant    [🧠 Planning Mode]  │ ← Toggle here (top)
│  Create courses faster...     [Clear Chat]  │
└─────────────────────────────────────────────┘
...
...
...
┌─────────────────────────────────────────────┐
│  TeacherBot                                 │
│  ┌───────────────────────────────────────┐ │
│  │  Chat messages...                     │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │  Type message... [Send]               │ │
│  │  Current mode: Planning (text only)   │ │ ← Can't click here
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Impact:**
- **Poor accessibility** - Mode toggle is far from where user is typing
- **Extra clicks** - Scroll up → click → scroll down
- **Discovery issue** - Users may not realize they can switch modes

**Desired UI:**
```
┌─────────────────────────────────────────────┐
│  TeacherBot                                 │
│  ┌───────────────────────────────────────┐ │
│  │  Chat messages...                     │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│  ┌───────────────────────────────────────┐ │
│  │  [🧠 Planning] Type message... [Send] │ │ ← Toggle HERE
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### **Issue #4: Language Inconsistency**

**Problem:**
- User writes in **English**
- AI responds in **Lithuanian** (especially during course creation)
- This is confusing for English-speaking teachers

**Evidence from log:**
```
User (English): "Create a course on ELDEN RING English to Lithuanian..."
Bot (Lithuanian): "Puiku! Labai įdomi idėja sukurti ELDEN RING kalbos kursą..."
Bot (Lithuanian): "Štai siūloma kurso struktūra..."
Bot (Lithuanian): "Ar ši kurso struktūra atrodo gerai?"
```

**Impact:**
- **User confusion** - "Why is the AI speaking Lithuanian?"
- **Accessibility** - English-only teachers can't understand responses
- **Inconsistent experience** - Sometimes English, sometimes Lithuanian

**Root Cause:**
```typescript
// System prompt (route.ts lines 40-42)
## YOUR IDENTITY
- Languages: Lithuanian (native proficiency), English (fluent)
- **Language Preference:** Match teacher's language

// But the AI is not consistently following this instruction
```

**Solution Required:**
- Detect language of user's input message
- Force AI to respond in **same language** as input
- Add explicit language instruction to each API call
- Consider adding language code to conversation context

---

## 📊 Issue Priority Matrix

| Issue | Severity | User Impact | Technical Complexity | Priority |
|-------|----------|-------------|---------------------|----------|
| **#1 Message Accumulation** | 🔴 Critical | Very High | Medium | **P0** |
| **#2 Planning Mode Conflict** | 🟠 High | High | Medium | **P1** |
| **#3 Mode Toggle Visibility** | 🟡 Medium | Medium | Low | **P1** |
| **#4 Language Inconsistency** | 🟠 High | High | Low | **P1** |

---

## 🎯 Success Criteria

### Issue #1 Fix:
- ✅ Each AI message shows ONLY the latest response to the user's query
- ✅ No duplicate content from previous turns
- ✅ Multi-turn function calls (course → lessons) still work correctly
- ✅ Message bubbles are concise and focused

### Issue #2 Fix:
- ✅ AI detects building actions in planning mode
- ✅ Smart popup appears: "Switch to Building Mode?"
- ✅ One-click mode switch + automatic re-execution
- ✅ No need to repeat the request

### Issue #3 Fix:
- ✅ Mode toggle button visible near input field
- ✅ No scrolling required to change modes
- ✅ Visual distinction between Planning and Building modes
- ✅ Clear indication of current mode at all times

### Issue #4 Fix:
- ✅ AI **always** responds in the same language as user's input
- ✅ English input → English response
- ✅ Lithuanian input → Lithuanian response
- ✅ Consistent language throughout conversation

---

## 🔧 Technical Approach

### Fix #1: Message Display Logic
**File:** `app/teacher/ai-assistant/page.tsx`
**Strategy:**
1. Backend should return ONLY the latest AI response (not entire history)
2. OR frontend should extract ONLY the last model response after user's message
3. Remove `.slice(-3)` and `.join('\n\n')` logic
4. Handle multi-turn function calls differently (track completion state)

### Fix #2: Smart Mode Detection
**Files:** `app/teacher/ai-assistant/page.tsx`, `app/api/ai/teacher-bot/route.ts`
**Strategy:**
1. Backend detects building keywords in planning mode
2. Return special flag: `{ modeSwitchSuggested: true, reason: '...' }`
3. Frontend shows popup with one-click switch
4. After switch, auto-retry the last message in building mode

### Fix #3: UI Layout Change
**File:** `app/teacher/ai-assistant/page.tsx`
**Strategy:**
1. Move mode toggle from header to input area
2. Use compact button/badge next to input field
3. Keep mode indicator in both places for clarity

### Fix #4: Language Detection
**Files:** `app/api/ai/teacher-bot/route.ts`
**Strategy:**
1. Detect language of incoming message (simple heuristics or library)
2. Add explicit instruction to system prompt: "You MUST respond in [detected_language]"
3. Pass detected language as parameter to AI
4. Store language preference in conversation context

---

## 📝 Next Steps

1. ✅ Create this problem analysis document
2. ⏳ Write comprehensive PRD with detailed solutions
3. ⏳ Implement fixes one by one
4. ⏳ Test each fix individually
5. ⏳ Integration testing
6. ⏳ User acceptance testing

---

## 📚 References
- Chatbot log: `logs/chatbot-log.txt`
- Current implementation: `app/teacher/ai-assistant/page.tsx`
- Backend API: `app/api/ai/teacher-bot/route.ts`
- PRD: `docs/TEACHER_CHATBOT_PRD.md`
- ARD: `docs/TEACHER_CHATBOT_ARD.md`
