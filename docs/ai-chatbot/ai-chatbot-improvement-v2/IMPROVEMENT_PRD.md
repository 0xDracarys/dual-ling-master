# AI Chatbot Improvement V2 - Product Requirements Document (PRD)
## November 11, 2025

---

## 📋 Document Information

**Version:** 2.0.0  
**Status:** Draft  
**Author:** AI Engineering Team  
**Related Documents:**
- [Problem Analysis](./PROBLEM_ANALYSIS.md)
- [Original PRD](../TEACHER_CHATBOT_PRD.md)
- [Original ARD](../TEACHER_CHATBOT_ARD.md)

---

## 🎯 Executive Summary

### Purpose
This PRD addresses critical UX and functionality issues in the Teacher AI Chatbot that are severely impacting usability and user satisfaction. The improvements focus on:
1. **Message Display Optimization** - Fix message accumulation bug
2. **Smart Mode Switching** - Seamless planning ↔ building mode transitions
3. **Language Consistency** - AI responds in user's language
4. **UI/UX Enhancements** - Better mode toggle placement

### Business Impact
- **User Satisfaction:** ⬆️ 70% (reduce frustration from bugs)
- **Task Completion Rate:** ⬆️ 50% (smoother workflow)
- **Time to Create Course:** ⬇️ 30% (fewer repeated interactions)
- **User Retention:** ⬆️ 40% (professional, polished experience)

### Timeline
- **Design & PRD:** 1 day
- **Implementation:** 3-4 days
- **Testing:** 2 days
- **Deployment:** 1 day
- **Total:** ~1 week

---

## 🔴 Problem Statement

### Current State
The Teacher AI Chatbot has 4 critical issues (detailed in [PROBLEM_ANALYSIS.md](./PROBLEM_ANALYSIS.md)):

1. **Message Accumulation Bug** (P0 Critical)
   - AI responses show ALL previous messages instead of just the latest answer
   - Creates overwhelming wall of repeated text
   - Severely degrades UX

2. **Planning Mode Conflict** (P1 High)
   - Users can't execute building actions in planning mode
   - Must manually switch modes and repeat requests
   - Wastes time and AI tokens

3. **Mode Toggle Visibility** (P1 High)
   - Toggle button is at top of page, far from input field
   - Requires scrolling to change modes
   - Poor accessibility

4. **Language Inconsistency** (P1 High)
   - AI responds in Lithuanian when user writes in English
   - Confusing for English-speaking teachers
   - Breaks user expectations

### Desired State
- Clean, concise AI responses showing only relevant content
- Intelligent mode detection with one-click switching
- Mode toggle always accessible near input field
- Consistent language matching (English input → English output)

---

## 🎨 Feature Specifications

### **Feature 1: Message Display Optimization**

#### **1.1 Problem**
```tsx
// CURRENT (BROKEN):
User: "create first lesson"
Bot: [Entire course checklist AGAIN + previous messages + new lesson]
// 500+ lines of repeated content
```

```tsx
// DESIRED (FIXED):
User: "create first lesson"
Bot: "Creating the first lesson for your ELDEN RING course..."
     [Only the new lesson creation response]
```

#### **1.2 Technical Solution**

**Backend Changes** (`app/api/ai/teacher-bot/route.ts`):
```typescript
// Option A: Return only latest response
return NextResponse.json({
  success: true,
  message: response.text(), // Only the latest AI response
  conversationHistory: conversationHistory, // Full history for context
  latestResponseOnly: true // Flag to indicate we're sending clean response
});
```

**Frontend Changes** (`app/teacher/ai-assistant/page.tsx`):
```typescript
// BEFORE (lines 136-152):
if (data.conversationHistory && Array.isArray(data.conversationHistory)) {
  const modelResponses = data.conversationHistory
    .filter((msg: any) => msg.role === 'model')
    .slice(-3) // ❌ Gets last 3 responses
  
  if (modelResponses.length > 0) {
    finalContent = textParts.join('\n\n') // ❌ Joins them together
  }
}

// AFTER (proposed):
// Use data.message directly if it's already the latest response
let finalContent = data.message

// Only extract from history if needed for multi-turn function calls
if (data.hasMultiTurnFunctionCalls && data.conversationHistory) {
  // Get only the LAST model response after the user's message
  const conversationAfterUser = data.conversationHistory.slice(
    data.conversationHistory.findLastIndex((m: any) => m.role === 'user') + 1
  )
  const lastModelResponse = conversationAfterUser
    .filter((m: any) => m.role === 'model')
    .pop()
  
  if (lastModelResponse?.parts?.[0]?.text) {
    finalContent = lastModelResponse.parts[0].text
  }
}
```

#### **1.3 Edge Cases**

**Case 1: Multi-Turn Function Calls (Course → Lessons)**
- Backend makes 2 AI calls: createCourse, then createLesson(s)
- Should still show only the FINAL summary, not all intermediate responses

**Solution:**
```typescript
// Backend tracks function call completion
if (hasMultiTurnFunctionCalls) {
  // After all function calls complete, ask AI for final summary
  const summaryResult = await chat.sendMessage(
    "Provide a brief summary of what was created (course + lessons). Keep it concise."
  )
  return { 
    message: summaryResult.response.text(),
    hasMultiTurnFunctionCalls: true
  }
}
```

**Case 2: Error in Multi-Turn (Course succeeds, Lessons fail)**
- Show partial success message
- Don't repeat course creation details

**Solution:**
```typescript
if (lessonCreationFailed) {
  return {
    message: `✅ Course "${courseTitle}" created (ID: ${courseId}). ⚠️ Lesson creation failed: ${error}. You can create lessons manually or try again.`,
    functionCalls: [...courseResults, ...failedLessonAttempts]
  }
}
```

#### **1.4 Acceptance Criteria**
- ✅ Each AI message bubble shows ONLY the latest response
- ✅ No repeated content from previous turns
- ✅ Multi-turn function calls (course → lessons) work correctly
- ✅ Message bubbles are concise (< 200 lines for normal responses)
- ✅ Long previews (e.g., course structure) are collapsible or paginated

---

### **Feature 2: Smart Mode Detection & Switching**

#### **2.1 Problem Flow**
```
Current (Broken):
1. User (Planning Mode): "Create a Spanish course with 10 lessons"
2. Bot: [Shows course preview]
3. User: "yes, create it"
4. Bot: [Shows preview again, can't execute because Planning Mode]
5. User: *manually scrolls up and clicks mode toggle*
6. User: "create the course" (repeats request)
7. Bot: [Finally executes]

Result: 3 extra steps, wasted time, user frustration
```

#### **2.2 Desired Flow**
```
Improved (Fixed):
1. User (Planning Mode): "Create a Spanish course with 10 lessons"
2. Bot: [Shows course preview]
   + Popup: "⚡ This action requires Building Mode. Switch now?" [Switch] [Stay]
3. User: Clicks [Switch]
4. Mode auto-switches to Building
5. Bot: [Executes course creation immediately, no need to repeat]

Result: 1 click, seamless experience
```

#### **2.3 Technical Solution**

**Step 1: Backend Detection** (`app/api/ai/teacher-bot/route.ts`)
```typescript
// Add detection logic
function detectBuildingIntent(message: string, mode: string): boolean {
  if (mode !== 'planning') return false
  
  const buildingKeywords = [
    'create course', 'create lesson', 'create quiz',
    'make a course', 'build a course', 'generate course',
    'create it', 'build it', 'go ahead', 'proceed',
    'yes, create', 'do it now', 'execute'
  ]
  
  const lowerMessage = message.toLowerCase()
  return buildingKeywords.some(keyword => lowerMessage.includes(keyword))
}

// In POST handler
if (detectBuildingIntent(message, mode)) {
  return NextResponse.json({
    success: true,
    message: "To create courses and lessons, you need to switch to Building Mode.",
    modeSwitchSuggested: true,
    modeSwitchReason: "Course/lesson creation requires Building Mode to execute functions.",
    suggestedMode: 'building'
  })
}
```

**Step 2: Frontend Popup** (`app/teacher/ai-assistant/page.tsx`)
```tsx
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function TeacherAIAssistant() {
  const [showModeSwitchDialog, setShowModeSwitchDialog] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  
  // In handleSendMessage
  const data = await response.json()
  
  if (data.modeSwitchSuggested) {
    // Show popup
    setShowModeSwitchDialog(true)
    setPendingMessage(userMessage.content)
    
    // Add bot's suggestion to chat
    const suggestionMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'model',
      content: data.message,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, suggestionMessage])
    return
  }
  
  // Handle mode switch confirmation
  const handleConfirmModeSwitch = async () => {
    setMode('building')
    setShowModeSwitchDialog(false)
    
    // Auto-retry the pending message in building mode
    if (pendingMessage) {
      // Re-send the message with building mode
      await handleSendMessage(pendingMessage, 'building')
      setPendingMessage(null)
    }
  }
  
  return (
    <>
      {/* Chat UI */}
      
      {/* Mode Switch Dialog */}
      <AlertDialog open={showModeSwitchDialog} onOpenChange={setShowModeSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚡ Switch to Building Mode?</AlertDialogTitle>
            <AlertDialogDescription>
              This action requires Building Mode to execute. Would you like to switch now?
              <br /><br />
              <strong>Building Mode</strong> allows the AI to create courses and lessons directly in your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay in Planning</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmModeSwitch}>
              Switch & Execute
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
```

#### **2.4 Alternative: Inline Prompt**
```tsx
// Less intrusive than popup
{data.modeSwitchSuggested && (
  <Alert className="mt-4">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Switch to Building Mode?</AlertTitle>
    <AlertDescription>
      This action requires Building Mode to execute.
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={handleConfirmModeSwitch}>
          ⚡ Switch & Continue
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowModeSwitchDialog(false)}>
          Stay in Planning
        </Button>
      </div>
    </AlertDescription>
  </Alert>
)}
```

#### **2.5 Acceptance Criteria**
- ✅ AI detects building actions in planning mode (90% accuracy)
- ✅ Popup/prompt appears with clear explanation
- ✅ One-click mode switch
- ✅ Automatically retries the request in building mode
- ✅ No need for user to repeat their message
- ✅ Works for: "create course", "create lesson", "yes, do it", etc.

---

### **Feature 3: Improved Mode Toggle UI**

#### **3.1 Current UI (Problems)**
```
┌─────────────────────────────────────────────┐
│  AI Course Assistant    [🧠 Planning Mode]  │ ← Toggle HERE (far from input)
│  Create courses faster...     [Clear Chat]  │
└─────────────────────────────────────────────┘
...
[Scrollable chat area - 600px tall]
...
┌─────────────────────────────────────────────┐
│  TeacherBot                                 │
│  ┌───────────────────────────────────────┐ │
│  │  Type message... [Send]               │ │
│  │  Current mode: Planning (text only)   │ │ ← Not clickable
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Problems:**
- Mode toggle is at top, user is typing at bottom
- Requires scrolling to change modes
- Text indicator near input is not interactive

#### **3.2 Proposed UI (Solutions)**

**Option A: Inline Toggle Button**
```tsx
<CardContent className="border-t p-4">
  <div className="flex gap-2 mb-2">
    {/* Mode Toggle */}
    <Button
      variant={mode === 'planning' ? 'secondary' : 'default'}
      size="sm"
      onClick={() => setMode(mode === 'planning' ? 'building' : 'planning')}
      className="flex items-center gap-1"
    >
      {mode === 'planning' ? (
        <>
          <Brain className="h-3 w-3" />
          Planning
        </>
      ) : (
        <>
          <Zap className="h-3 w-3" />
          Building
        </>
      )}
    </Button>
    
    {/* Input */}
    <Input
      placeholder="Type your message..."
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyPress={handleKeyPress}
      disabled={isLoading}
      className="flex-1"
    />
    
    {/* Send Button */}
    <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
      <Send className="h-4 w-4" />
    </Button>
  </div>
  
  {/* Mode Description */}
  <p className="text-xs text-muted-foreground">
    {mode === 'planning' ? (
      <>💡 Planning Mode: Discuss ideas, get advice (no actions)</>
    ) : (
      <>⚡ Building Mode: Create courses and lessons (with confirmation)</>
    )}
  </p>
</CardContent>
```

**Option B: Dropdown/Segmented Control**
```tsx
<div className="flex items-center gap-2">
  {/* Segmented Control */}
  <div className="inline-flex rounded-md shadow-sm" role="group">
    <button
      type="button"
      onClick={() => setMode('planning')}
      className={`px-3 py-1 text-sm font-medium rounded-l-lg ${
        mode === 'planning'
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      🧠 Planning
    </button>
    <button
      type="button"
      onClick={() => setMode('building')}
      className={`px-3 py-1 text-sm font-medium rounded-r-lg ${
        mode === 'building'
          ? 'bg-indigo-600 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      ⚡ Building
    </button>
  </div>
  
  {/* Input */}
  <Input ... />
  <Button ... />
</div>
```

#### **3.3 Recommended: Option A (Inline Toggle Button)**

**Pros:**
- Compact, doesn't take much space
- Clear visual distinction (secondary vs. default)
- Familiar UI pattern
- Easy to click

**Cons:**
- Takes space from input field (minor)

#### **3.4 Keep Secondary Toggle in Header**
- Keep existing toggle in header for users who prefer it
- Both toggles sync with same state
- Provides flexibility

#### **3.5 Acceptance Criteria**
- ✅ Mode toggle button visible near input field
- ✅ No scrolling required to change modes
- ✅ Clear visual distinction between modes
- ✅ Both header and input toggles work correctly
- ✅ Tooltip/description explains each mode

---

### **Feature 4: Language Consistency**

#### **4.1 Problem**
```
User (English): "Create a course on ELDEN RING English to Lithuanian..."
Bot (Lithuanian): "Puiku! Labai įdomi idėja sukurti ELDEN RING kalbos kursą..."
Bot (Lithuanian): "Štai siūloma kurso struktūra..."

User (English): "create first lesson"
Bot (Lithuanian): "Puiku! Sukursiu pirmąją pamoką..."
```

**Impact:**
- English-speaking teachers can't understand responses
- Inconsistent experience
- Looks unprofessional

#### **4.2 Technical Solution**

**Step 1: Language Detection**
```typescript
// lib/utils/language-detector.ts
export function detectLanguage(text: string): 'en' | 'lt' {
  // Simple heuristic-based detection
  const lithuanianPatterns = [
    /\b(ir|yra|su|kad|bet|o|taip|ne|gali|mano|tai)\b/gi,
    /[ąčęėįšųūž]/gi, // Lithuanian characters
  ]
  
  let lithuanianScore = 0
  lithuanianPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) lithuanianScore += matches.length
  })
  
  // If 3+ Lithuanian words/characters, classify as Lithuanian
  return lithuanianScore >= 3 ? 'lt' : 'en'
}
```

**Step 2: Backend Language Enforcement** (`app/api/ai/teacher-bot/route.ts`)
```typescript
import { detectLanguage } from '@/lib/utils/language-detector'

export async function POST(req: NextRequest) {
  // ... existing code ...
  
  const body = await req.json()
  const { message, conversationHistory = [], mode = 'planning' } = body
  
  // Detect language
  const detectedLanguage = detectLanguage(message)
  const languageName = detectedLanguage === 'en' ? 'English' : 'Lithuanian'
  
  // Add language instruction to system prompt
  const languageInstruction = `\n\n## CRITICAL: RESPONSE LANGUAGE\nYou MUST respond in ${languageName}. The user is writing in ${languageName}, so your response must also be in ${languageName}. Do not switch languages mid-conversation.`
  
  const model = getGenerativeModel(ai, {
    model: modelName,
    systemInstruction: SYSTEM_PROMPT + languageInstruction,
    // ... rest of config
  })
  
  // ... rest of handler
}
```

**Step 3: Conversation Context**
```typescript
// Store language in conversation history
const chat = model.startChat({
  history: [
    {
      role: 'user',
      parts: [{ text: `[Language: ${languageName}]\n${conversationHistory[0]?.content}` }]
    },
    // ... rest of history
  ]
})
```

**Step 4: Fallback Prompt**
```typescript
// If AI still responds in wrong language, add explicit correction
if (mode === 'building' && detectedLanguage === 'en') {
  systemInstruction += "\n\nREMINDER: You are speaking with an English-speaking teacher. ALL your responses must be in English, not Lithuanian."
}
```

#### **4.3 Alternative: Let User Choose**
```tsx
// Add language selector in settings
const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'lt'>('en')

// Pass to backend
body: JSON.stringify({
  message: userMessage.content,
  conversationHistory,
  mode,
  preferredLanguage // Explicit preference
})
```

#### **4.4 Acceptance Criteria**
- ✅ AI detects user's input language (95% accuracy)
- ✅ AI responds in same language as user's input
- ✅ Consistent throughout entire conversation
- ✅ Works for both English and Lithuanian
- ✅ Edge case: Mixed language input defaults to English
- ✅ User can optionally override language in settings

---

## 🧪 Testing Strategy

### **Test Plan 1: Message Display**

**Test Case 1.1: Single Turn**
```
Steps:
1. User: "Help me plan a Spanish course"
2. Verify: Bot response is concise (< 50 lines)
3. Verify: No repeated content from previous messages
```

**Test Case 1.2: Multi-Turn Conversation**
```
Steps:
1. User: "Create a Spanish course"
2. Bot: [Shows preview]
3. User: "Yes, create it"
4. Verify: Bot response shows only course creation result
5. Verify: No repeated preview from step 2
```

**Test Case 1.3: Multi-Turn Function Calls**
```
Steps:
1. User: "Create course with 5 lessons"
2. Backend: Creates course, then creates 5 lessons
3. Verify: Bot response shows ONLY final summary
4. Verify: No intermediate "creating course..." messages
```

### **Test Plan 2: Smart Mode Switching**

**Test Case 2.1: Planning → Building Detection**
```
Steps:
1. Set mode to Planning
2. User: "Create a Spanish course"
3. Verify: Popup appears: "Switch to Building Mode?"
4. Click "Switch & Execute"
5. Verify: Mode changes to Building
6. Verify: Course is created without repeating request
```

**Test Case 2.2: False Positive Handling**
```
Steps:
1. Set mode to Planning
2. User: "Tell me about creating courses" (not a building action)
3. Verify: No popup appears
4. Verify: Bot provides informational response
```

**Test Case 2.3: User Declines Switch**
```
Steps:
1. Set mode to Planning
2. User: "Create a course"
3. Popup appears
4. Click "Stay in Planning"
5. Verify: Mode remains Planning
6. Verify: Bot provides planning advice, doesn't execute
```

### **Test Plan 3: Mode Toggle UI**

**Test Case 3.1: Toggle Near Input**
```
Steps:
1. Scroll to bottom (input area)
2. Verify: Mode toggle button is visible
3. Click toggle
4. Verify: Mode changes
5. Verify: UI updates (button style, description text)
```

**Test Case 3.2: Sync Between Toggles**
```
Steps:
1. Click header toggle (top of page)
2. Verify: Input area toggle updates
3. Click input area toggle (bottom)
4. Verify: Header toggle updates
```

### **Test Plan 4: Language Consistency**

**Test Case 4.1: English Input**
```
Steps:
1. User (English): "Create a course on Spanish grammar"
2. Verify: Bot responds in English
3. User (English): "Add 5 lessons"
4. Verify: Bot responds in English
```

**Test Case 4.2: Lithuanian Input**
```
Steps:
1. User (Lithuanian): "Sukurk kursą apie ispanų kalbą"
2. Verify: Bot responds in Lithuanian
3. User (Lithuanian): "Pridėk 5 pamokas"
4. Verify: Bot responds in Lithuanian
```

**Test Case 4.3: Mixed Language**
```
Steps:
1. User (English): "Create a course"
2. Bot (English): [Responds]
3. User (Lithuanian): "Ačiū, tęsk"
4. Verify: Bot switches to Lithuanian
```

---

## 🚀 Implementation Plan

### **Phase 1: Message Display Fix** (Day 1-2)
- [ ] Modify backend to return only latest response
- [ ] Update frontend message extraction logic
- [ ] Handle multi-turn function calls
- [ ] Test all message scenarios
- [ ] Deploy to staging

### **Phase 2: Smart Mode Detection** (Day 2-3)
- [ ] Implement backend keyword detection
- [ ] Add `modeSwitchSuggested` flag
- [ ] Create popup/dialog component
- [ ] Implement auto-retry logic
- [ ] Test mode switching flow
- [ ] Deploy to staging

### **Phase 3: UI Improvements** (Day 3)
- [ ] Move mode toggle to input area
- [ ] Add segmented control / button
- [ ] Sync header and input toggles
- [ ] Update styles and descriptions
- [ ] Test on mobile/desktop
- [ ] Deploy to staging

### **Phase 4: Language Consistency** (Day 4)
- [ ] Implement language detection
- [ ] Update system prompt with language instruction
- [ ] Test English conversations
- [ ] Test Lithuanian conversations
- [ ] Test mixed language scenarios
- [ ] Deploy to staging

### **Phase 5: Integration & QA** (Day 5-6)
- [ ] Full end-to-end testing
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Bug fixes
- [ ] Documentation updates

### **Phase 6: Production Deployment** (Day 7)
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Collect user feedback
- [ ] Iterate if needed

---

## 📊 Success Metrics

### **Quantitative Metrics**

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Average Message Length | 500+ lines | < 100 lines | Message content analysis |
| Mode Switches per Session | 3-5 | 0-1 | User interaction tracking |
| Task Completion Rate | 60% | 90% | Successful course creation |
| User Satisfaction | 6/10 | 9/10 | Post-session survey |
| Time to Create Course | 15 min | 10 min | Time tracking |

### **Qualitative Metrics**
- User feedback: "Much better UX!"
- Support tickets: ⬇️ 70% (fewer bug reports)
- Feature requests: Positive sentiment
- Teacher retention: Improved

---

## 🔒 Security & Privacy

- No changes to authentication flow
- No new data collection
- Language detection happens server-side (no PII exposure)
- Mode switching requires user confirmation

---

## 🌍 Accessibility

- Mode toggle is keyboard accessible (Tab + Enter)
- Popup has clear focus states
- ARIA labels for screen readers
- High contrast mode compatible

---

## 📚 Documentation Updates

### Files to Update:
1. `docs/TEACHER_CHATBOT_PRD.md` - Reference this PRD
2. `docs/TEACHER_CHATBOT_ARD.md` - Update AI instructions
3. `docs/TEACHER_CHATBOT_IMPLEMENTATION.md` - Document new features
4. `README.md` - Add release notes

### User-Facing Documentation:
- Help page: Explain new mode switching
- Tutorial: Show improved workflow
- FAQ: Address language consistency

---

## 🎉 Rollout Plan

### **Staging Release** (Day 5)
- Deploy to staging environment
- Internal team testing
- Collect feedback

### **Beta Release** (Day 6)
- Enable for 10 beta teachers
- Monitor usage and errors
- Quick fixes if needed

### **Production Release** (Day 7)
- Deploy to all users
- Send announcement email
- Monitor metrics

---

## 📝 Appendix

### **A. Backend API Changes**

**Before:**
```typescript
return NextResponse.json({
  success: true,
  message: finalContent,
  conversationHistory: conversationHistory
})
```

**After:**
```typescript
return NextResponse.json({
  success: true,
  message: latestResponseOnly,
  conversationHistory: conversationHistory,
  modeSwitchSuggested: mode === 'planning' && detectBuildingIntent(message),
  detectedLanguage: detectLanguage(message)
})
```

### **B. Frontend Component Changes**

**New Props:**
```typescript
interface Message {
  id: string
  role: 'user' | 'model'
  content: string // Only latest response
  timestamp: Date
  functionCalls?: FunctionCall[]
  modeSwitchSuggested?: boolean // New
  detectedLanguage?: 'en' | 'lt' // New
}
```

### **C. New Dependencies**

None required! All features use existing UI components:
- `AlertDialog` from shadcn/ui (already installed)
- `Button`, `Badge` (already installed)
- No external language detection libraries (custom heuristics)

---

## ✅ Approval & Sign-Off

- [ ] Product Manager: _________________
- [ ] Engineering Lead: _________________
- [ ] UX Designer: _________________
- [ ] QA Lead: _________________

---

**End of PRD**
