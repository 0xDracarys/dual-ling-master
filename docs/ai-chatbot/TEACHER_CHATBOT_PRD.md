# Teacher AI Chatbot - Product Requirements Document (PRD)

**Version:** 1.0.0  
**Date:** October 21, 2025  
**Status:** 🔵 PLANNING PHASE  
**Product:** TeacherBot - AI-Powered Course Creation Assistant  
**Target Release:** Phase 1 MVP - December 2025

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [User Personas & Stories](#user-personas--stories)
5. [Feature Specifications](#feature-specifications)
6. [Technical Architecture](#technical-architecture)
7. [UI/UX Specifications](#uiux-specifications)
8. [Prompt Engineering Guide](#prompt-engineering-guide)
9. [Security & Privacy](#security--privacy)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Dependencies & Risks](#dependencies--risks)
13. [Launch Plan](#launch-plan)

---

## 🎯 Executive Summary

### Product Vision

**TeacherBot** is an AI-powered course creation assistant that reduces course creation time from 4-6 hours to 1-1.5 hours while maintaining pedagogical quality. It transforms DualLing teachers from content creators into content curators, allowing them to focus on teaching rather than administrative tasks.

### Key Features (Phase 1 MVP)

- ✅ **Text-to-Course Generation:** Convert teacher's text descriptions into structured courses
- ✅ **Intelligent Lesson Planning:** Auto-generate lesson outlines with progression
- ✅ **Quiz Generation:** Create multiple-choice quizzes with explanations
- ✅ **Conversation Memory:** Remember context throughout course creation session
- ✅ **Preview & Confirm:** Show course structure before creating in database
- ✅ **Multi-Mode Interface:** Planning mode (chat) + Building mode (execute functions)

### Business Impact

| Metric | Current State | Target (6 months) | Impact |
|--------|---------------|-------------------|---------|
| Avg. Course Creation Time | 4-6 hours | 1-1.5 hours | **67% reduction** |
| Active Courses | 6 | 50 | **8x growth** |
| Teacher Satisfaction | 3.8/5 | 4.5/5 | **18% improvement** |
| Teacher Retention | ~50% | 70% | **40% increase** |

---

## 🚨 Problem Statement

### Current Pain Points

**Problem 1: Time-Consuming Course Creation**
- Teachers spend 4-6 hours creating a single course
- Manual lesson structuring with no guidance
- Writing quiz questions from scratch is tedious
- 60% of teacher time spent on structure, not content quality

**Problem 2: Inconsistent Course Quality**
- No pedagogical guidance during creation
- Courses vary wildly in structure and depth
- Lesson progression often poorly designed
- Missing learning objectives

**Problem 3: Low Teacher Engagement**
- Only 10% of registered teachers publish courses
- High drop-off during course creation (80% abandon midway)
- Teachers feel overwhelmed by empty course editor

### User Feedback (From Discovery Interviews)

> "I have great course ideas but structuring them takes forever. I wish someone could just help me organize my thoughts." — Teacher A

> "Creating quizzes is my least favorite part. I spend an hour per quiz and still worry if the questions are good." — Teacher B

> "I started creating a course 3 times and gave up. The blank page is intimidating." — Teacher C

---

## 🎯 Goals & Success Metrics

### Primary Goals

1. **Reduce Time-to-First-Course by 65%**
   - Metric: Avg. hours from account creation to first published course
   - Baseline: 12 hours (includes learning platform + course creation)
   - Target: 4 hours

2. **Increase Course Creation Rate by 5x**
   - Metric: Courses published per month
   - Baseline: ~2 courses/month
   - Target: 10 courses/month

3. **Achieve >80% Teacher Satisfaction**
   - Metric: Post-course-creation survey rating
   - Target: 4.5/5 stars

### Secondary Goals

4. **Maintain Course Quality**
   - Metric: % of AI-generated courses requiring <20% teacher edits
   - Target: >80%

5. **Improve Teacher Retention**
   - Metric: % of teachers who create a 2nd course
   - Baseline: 50%
   - Target: 70%

### Success Criteria (Phase 1 MVP)

**Technical Success:**
- ✅ 95% function call success rate (API calls execute correctly)
- ✅ <3s response time for course suggestions
- ✅ <5% error rate in course creation
- ✅ Support 10 concurrent teacher sessions

**User Success:**
- ✅ 80% teacher acceptance rate (use AI suggestions without major changes)
- ✅ <5 conversation turns to create a course structure
- ✅ >70% teachers use chatbot for 2nd course (retention)

---

## 👤 User Personas & Stories

### Primary Persona: **Experienced Teacher Elena**

**Demographics:**
- Age: 35
- Role: Professional language teacher (10+ years)
- Languages: Lithuanian (native), English (fluent)
- Tech Savviness: Moderate (uses Google Docs, YouTube)

**Goals:**
- Create comprehensive Lithuanian-English courses
- Save time on administrative tasks
- Maintain high pedagogical quality
- Earn passive income from courses

**Pain Points:**
- Limited time (teaches full-time)
- Not confident in quiz design
- Overwhelmed by course structuring

**User Story 1:** As Elena, I want to describe my course idea in plain language and get a structured outline, so I can quickly validate my concept before investing hours.

**User Story 2:** As Elena, I want the AI to generate quiz questions based on my lesson content, so I don't have to spend an hour per quiz.

**User Story 3:** As Elena, I want to review and edit AI suggestions before they're published, so I maintain control over course quality.

---

### Secondary Persona: **New Teacher Tomas**

**Demographics:**
- Age: 26
- Role: Part-time tutor, aspiring online educator
- Languages: Lithuanian (native), English (intermediate)
- Tech Savviness: High (uses Discord, Notion, Figma)

**Goals:**
- Launch first online course
- Learn course design best practices
- Build teaching reputation
- Supplement tutoring income

**Pain Points:**
- No course design experience
- Unsure what makes a good course structure
- Intimidated by blank course editor
- Limited content creation skills

**User Story 4:** As Tomas, I want pedagogical guidance while creating my course, so I learn what makes a well-structured language course.

**User Story 5:** As Tomas, I want to see examples of successful course structures, so I can model my course after proven patterns.

---

## 🔧 Feature Specifications

### Phase 1 MVP Features (December 2025)

---

#### **Feature 1.1: Text-to-Course Generation**

**Description:** Teachers provide a text description, and AI generates a complete course structure.

**User Flow:**
```
1. Teacher: "I want to create a Spanish course for beginners"
2. Bot: "Great! Let me gather some details..."
   - What's the course title?
   - How many lessons? (I recommend 10-12 for beginners)
   - Preferred lesson types? (video, reading, quiz)
3. Teacher: "Spanish Basics, 10 lessons, mostly reading with quizzes"
4. Bot: [Shows detailed course structure preview]
   📦 COURSE PREVIEW
   Title: Spanish Basics
   Level: Beginner
   Lessons: 10
   - 7 Reading Lessons
   - 3 Quiz Lessons
   
   Ready to create? (yes/no)
5. Teacher: "Yes, create it"
6. Bot: [Executes createCourse function]
   ✅ Course created! (ID: abc123)
   Would you like me to create the 10 lessons now?
```

**Acceptance Criteria:**
- ✅ Bot gathers all required info before creation (title, language, level, lesson count)
- ✅ Bot shows preview with course structure
- ✅ Teacher can confirm or modify preview
- ✅ Course created in Firestore with correct metadata
- ✅ Bot returns courseId for lesson creation

**Technical Requirements:**
- Use `createCourse` function declaration
- Validate all required fields before API call
- Handle duplicate course title error gracefully
- Store conversation in Firestore (conversation history)

**Edge Cases:**
- Teacher says "not sure" about lesson count → Bot suggests based on level
- Course title already exists → Suggest "Course Title - V2" or similar
- API failure → Retry once, then ask teacher to try again later

---

#### **Feature 1.2: Lesson Creation**

**Description:** Auto-generate lessons within a course structure.

**User Flow:**
```
1. Bot: "Would you like me to create the 10 lessons now?"
2. Teacher: "Yes, create lessons 1-3 first"
3. Bot: [Creates reading lessons]
   ✅ Lesson 1: Introduction to Spanish (30 min)
   ✅ Lesson 2: Greetings and Introductions (25 min)
   ✅ Lesson 3: Numbers and Counting (20 min)
   
   Review lessons in the course editor. Create remaining lessons? (yes/no)
```

**Lesson Types Supported (Phase 1):**
- ✅ **Reading Lessons:** 400-800 word Markdown content
- ✅ **Quiz Lessons:** 3-5 multiple-choice questions
- ⏳ **Video Lessons:** Placeholder (Phase 2 - YouTube integration)
- ⏳ **Exercise Lessons:** Placeholder (Phase 3 - interactive exercises)

**Acceptance Criteria:**
- ✅ Bot can create multiple lessons sequentially
- ✅ Each lesson has appropriate content for its type
- ✅ Lesson order is logical (1, 2, 3...)
- ✅ Lesson duration estimated based on content
- ✅ Teacher can create all lessons at once or in batches

**Technical Requirements:**
- Use `createLesson` function declaration
- Sequential API calls (wait for previous lesson before next)
- Auto-generate `order` field (1, 2, 3...)
- Store lesson content in Firestore subcollection

---

#### **Feature 1.3: Quiz Generation**

**Description:** Generate multiple-choice quizzes with explanations.

**User Flow:**
```
1. Teacher: "Create a quiz about Spanish greetings"
2. Bot: "How many questions would you like? (I recommend 5)"
3. Teacher: "5 questions"
4. Bot: [Generates quiz]
   📝 QUIZ PREVIEW
   
   Q1: What is "Hello" in Spanish?
   A) Hola ✓
   B) Adiós
   C) Gracias
   D) Buenos días
   Explanation: "Hola" is the standard greeting...
   
   [Shows all 5 questions]
   
   Ready to create this quiz? (yes/no)
```

**Quiz Quality Requirements:**
- 4 options per question (1 correct, 3 distractors)
- Clear, unambiguous wording
- Plausible distractors (not obviously wrong)
- Explanation for correct answer
- Mix of difficulty (60% easy, 30% medium, 10% hard)

**Acceptance Criteria:**
- ✅ Generate 3-5 questions per quiz (configurable)
- ✅ Each question has 4 options
- ✅ correctAnswer field is index as string ("0", "1", "2", "3")
- ✅ Explanation provided for each question
- ✅ Questions test understanding, not memorization

**Technical Requirements:**
- Use `createQuizLesson` function declaration
- Validate question format before creation
- Generate unique question IDs (UUID)
- Store in lesson subcollection with type='quiz'

---

#### **Feature 1.4: Conversation Memory**

**Description:** Remember conversation context throughout session.

**Memory Layers:**
1. **Short-term:** Last 5-10 conversation turns (always included)
2. **Session:** Current course being worked on (courseId, title)
3. **Long-term:** Teacher persona (tone, preferences)

**Conversation Storage:**
```typescript
// Firestore: users/{teacherId}/chatbotConversations/{conversationId}
{
  conversationId: string,      // UUID or courseId
  teacherId: string,
  courseId?: string,            // null for general planning
  mode: 'planning' | 'building',
  messages: [
    {
      id: string,
      role: 'user' | 'assistant' | 'function',
      content: string,
      timestamp: Timestamp,
      functionCall?: { name, arguments },
      functionResponse?: { name, result }
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp,
  messageCount: number
}
```

**Acceptance Criteria:**
- ✅ Bot remembers course details mentioned earlier
- ✅ No need to repeat information within session
- ✅ Conversation persists across page refreshes
- ✅ Teacher can see conversation history
- ✅ New conversation after 20+ messages (performance)

**Technical Requirements:**
- Store in Firestore after each turn
- Retrieve history on page load
- Implement sliding window (last 10 messages + summary)
- Auto-archive after 100 messages

---

#### **Feature 1.5: Preview & Confirm**

**Description:** Show course/lesson preview before creation.

**Preview Format:**
```markdown
📦 PREVIEW - COURSE STRUCTURE

Course: "Spanish for Business Professionals"
Level: Intermediate
Language: Spanish
Price: €49.99
Tags: [spanish, business, intermediate]

Lessons: 10 total
1. [Reading] Introduction to Business Spanish (30 min)
2. [Video] Common Business Phrases (15 min)
3. [Reading] Writing Professional Emails (45 min)
4. [Quiz] Email Etiquette Check (10 min)
5. [Reading] Phone Conversations (30 min)
6. [Exercise] Role-Play: Client Meeting (20 min)
7. [Reading] Business Presentations (40 min)
8. [Quiz] Vocabulary Review (10 min)
9. [Reading] Negotiation Language (35 min)
10. [Quiz] Final Assessment (15 min)

Total Duration: ~4.5 hours
Estimated Completion: 3-4 weeks (1 lesson/week)

Ready to create this course? (yes/no)
```

**Acceptance Criteria:**
- ✅ Preview shows all key details
- ✅ Teacher can say "yes" or "no"
- ✅ Teacher can modify specific details ("change title to X")
- ✅ Bot updates preview and confirms again
- ✅ No API call until explicit confirmation

---

#### **Feature 1.6: Multi-Mode Interface**

**Description:** Switch between Planning (chat) and Building (execute) modes.

**Mode Definitions:**

| Mode | Purpose | Function Calling | Use Case |
|------|---------|------------------|----------|
| **Planning** | Discuss ideas, get advice | ❌ Disabled | Brainstorming, questions, guidance |
| **Building** | Create courses/lessons | ✅ Enabled | Execute actions after confirmation |

**Mode Switching:**
```
Teacher: "Let's plan a new course" → Activates Planning mode
Teacher: "Create this course" → Switches to Building mode
```

**Visual Indicator:**
```
🧠 Planning Mode (chat only)
⚡ Building Mode (can create courses)
```

**Acceptance Criteria:**
- ✅ Teacher can switch modes explicitly
- ✅ Bot indicates current mode
- ✅ Function calls only in Building mode
- ✅ Planning mode gives advice without actions

---

### Phase 2 Features (Q1 2026) - ⏳ Future

#### **Feature 2.1: PDF Upload & Processing**
- Upload PDF textbook → Extract text → Generate course
- Support up to 10MB PDFs
- Preview extracted content before generation

#### **Feature 2.2: YouTube Video Integration**
- Paste YouTube URL → Fetch transcript → Generate lesson
- Create video lesson with discussion questions
- Or convert transcript to reading lesson

#### **Feature 2.3: Teacher Persona (Markdown File)**
- Teachers upload MD file defining bot behavior
- Custom tone, language, teaching style
- Bot adapts responses to persona

#### **Feature 2.4: Feedback Loop**
- Teachers rate generated content (1-5 stars)
- Track accepted vs rejected suggestions
- Improve prompts based on feedback

---

### Phase 3 Features (Q2 2026) - 🔮 Vision

#### **Feature 3.1: Student Chatbot**
- Help students during lessons
- Answer questions about content
- Provide grammar explanations

#### **Feature 3.2: Multi-Language Support**
- Expand beyond Lithuanian/English
- Support Spanish, French, German
- Auto-detect language from content

#### **Feature 3.3: Advanced Content Types**
- Interactive exercises (fill-in-blank, drag-drop)
- Audio lessons (pronunciation practice)
- Flashcards generation

---

## 🏗️ Technical Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Next.js)                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  TeacherDashboard → AI Assistant Page (Chat UI)      │  │
│  │  └─ ChatInput, MessageList, PreviewCard, ModeToggle  │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP POST /api/ai/teacher-bot
                         │ { message, conversationHistory }
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Next.js API Routes)                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  /app/api/ai/teacher-bot/route.ts                    │  │
│  │  1. Authenticate teacher (Firebase JWT)               │  │
│  │  2. Initialize Firebase AI Logic                      │  │
│  │  3. Create model with function declarations           │  │
│  │  4. Send message to Gemini (multi-turn chat)          │  │
│  │  5. Handle function calls (if any)                    │  │
│  │  6. Return response + updated history                 │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────┬──────────────────────┬─────────────────────────┘
             │                      │
             ▼ Function Calls       ▼ Store Conversation
┌─────────────────────────┐  ┌─────────────────────────────┐
│  Internal APIs          │  │  Firestore                  │
│  /api/courses           │  │  conversations/             │
│  /api/lessons           │  │  ├─ {conversationId}        │
│  /api/quiz              │  │  └─ messages[]              │
└─────────────────────────┘  └─────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Firebase AI Logic (Google AI Backend)           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Gemini 2.5 Flash Lite                                │  │
│  │  - Process system prompt + conversation history       │  │
│  │  - Decide: natural language OR function call          │  │
│  │  - Return structured response                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.2.0 | UI components |
| | Next.js | 14.x | App Router, SSR |
| | TypeScript | 5.9.3 | Type safety |
| | TailwindCSS | 3.4.18 | Styling |
| | shadcn/ui | latest | Component library |
| **Backend** | Next.js API Routes | 14.x | RESTful API |
| | Firebase Admin SDK | 12.7.0 | Server-side Firebase |
| | Firebase AI Logic SDK | latest | Gemini API integration |
| **AI/ML** | Gemini 2.5 Flash Lite | latest | LLM model |
| | Firebase AI Logic | - | AI orchestration |
| **Database** | Cloud Firestore | - | NoSQL database |
| **Storage** | Firebase Storage | - | File uploads (future) |
| **Auth** | Firebase Authentication | - | User auth + RBAC |
| **Config** | Firebase Remote Config | - | Dynamic model selection |
| **Observability** | Cloud Logging | - | Structured logs |
| | Cloud Trace | - | Request tracing |

### Data Models

#### **Conversation**
```typescript
interface Conversation {
  conversationId: string;        // UUID
  teacherId: string;             // Firebase UID
  courseId?: string;              // null if general planning
  mode: 'planning' | 'building';
  
  messages: Message[];
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  messageCount: number;
  summary?: string;               // Auto-generated every 20 messages
}

interface Message {
  id: string;                     // UUID
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  timestamp: Timestamp;
  
  // For function calls
  functionCall?: {
    name: string;
    arguments: object;
  };
  
  // For function responses
  functionResponse?: {
    name: string;
    result: object;
  };
  
  // Metadata
  metadata?: {
    tokenCount: number;
    latencyMs: number;
    modelVersion: string;
  };
}
```

#### **Teacher Persona** (Phase 2)
```typescript
interface TeacherPersona {
  teacherId: string;
  botName: string;                // e.g., "Professor AI"
  
  style: {
    tone: 'formal' | 'casual' | 'encouraging';
    verbosity: 'concise' | 'detailed';
  };
  
  preferences: {
    defaultLanguage: string;
    defaultLevel: string;
    quizQuestionCount: number;
  };
  
  customInstructions: string;     // Markdown content
  updatedAt: Timestamp;
}
```

### API Endpoints

#### **POST /api/ai/teacher-bot**

**Purpose:** Main chatbot endpoint

**Request:**
```typescript
{
  message: string;
  conversationId?: string;        // null for new conversation
  conversationHistory?: Message[]; // Last 10 messages
  mode: 'planning' | 'building';
}
```

**Response:**
```typescript
{
  success: true,
  conversationId: string,
  message: {
    role: 'assistant',
    content: string,
    functionCalls?: FunctionCall[]
  },
  conversationHistory: Message[],
  metadata: {
    modelVersion: string,
    tokensUsed: number,
    latencyMs: number
  }
}
```

**Error Responses:**
```typescript
// 401 Unauthorized
{ error: 'Missing or invalid authentication token' }

// 403 Forbidden
{ error: 'User does not have teacher role' }

// 429 Too Many Requests
{ error: 'Rate limit exceeded. Try again in 60 seconds.' }

// 500 Internal Server Error
{ error: 'AI service temporarily unavailable' }
```

---

#### **GET /api/ai/conversations**

**Purpose:** Retrieve teacher's conversation history

**Request:**
```
GET /api/ai/conversations?teacherId={uid}&limit=10
```

**Response:**
```typescript
{
  conversations: [
    {
      conversationId: string,
      courseId?: string,
      courseName?: string,
      messageCount: number,
      lastMessageAt: Timestamp,
      summary: string
    }
  ]
}
```

---

#### **DELETE /api/ai/conversations/{conversationId}**

**Purpose:** Delete conversation (GDPR compliance)

**Request:**
```
DELETE /api/ai/conversations/abc123
```

**Response:**
```typescript
{ success: true, message: 'Conversation deleted' }
```

---

### Firebase AI Logic Integration

#### **Initialization**
```typescript
// Backend: /app/api/ai/teacher-bot/route.ts
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai';
import { initializeApp } from 'firebase/app';

const firebaseApp = initializeApp(firebaseConfig);
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

const model = getGenerativeModel(ai, {
  model: getTeacherChatbotModel(), // From Remote Config
  tools: [{ functionDeclarations: [createCourseTool, createLessonTool, ...] }],
  toolConfig: {
    functionCallingMode: 'AUTO' // Model decides when to use functions
  },
  systemInstruction: generateSystemPrompt(teacherId),
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 2048
  }
});
```

#### **Multi-Turn Chat**
```typescript
const chat = model.startChat({
  history: conversationHistory // Previous messages
});

const response = await chat.sendMessage(userMessage);

// Check for function calls
if (response.functionCalls) {
  const results = await executeFunctionCalls(response.functionCalls);
  
  // Send function responses back to model
  const finalResponse = await chat.sendMessage([{
    role: 'function',
    parts: results.map(r => ({
      functionResponse: { name: r.name, response: r.result }
    }))
  }]);
  
  return finalResponse.text;
}

return response.text;
```

---

## 🎨 UI/UX Specifications

### Component Hierarchy

```
TeacherDashboard
└─ AIAssistantPage
   ├─ Header
   │  ├─ Title: "AI Course Assistant"
   │  ├─ ModeToggle: [Planning Mode] [Building Mode]
   │  └─ NewChatButton
   ├─ Sidebar (optional, collapsible)
   │  ├─ ConversationHistory
   │  └─ QuickActions
   ├─ ChatContainer
   │  ├─ MessageList
   │  │  ├─ UserMessage
   │  │  ├─ AssistantMessage
   │  │  ├─ PreviewCard (for course/lesson previews)
   │  │  └─ LoadingIndicator
   │  └─ ChatInput
   │     ├─ Textarea (auto-expand)
   │     ├─ SendButton
   │     └─ FileUploadButton (Phase 2)
   └─ Footer
      └─ TokenUsage / CostEstimate (optional)
```

### Wireframes

#### **Main Chat Interface**

```
┌─────────────────────────────────────────────────────────────┐
│  AI Course Assistant                      [Planning Mode ▼] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 👤 You (2:15 PM)                                       │ │
│  │ I want to create a Spanish course for beginners       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🤖 TeacherBot (2:15 PM)                                │ │
│  │ Great! I'll help you create a beginner Spanish        │ │
│  │ course. Let me gather some details...                 │ │
│  │                                                        │ │
│  │ • What would you like to call the course?             │ │
│  │ • How many lessons? (I recommend 10-12 for beginners) │ │
│  │ • Preferred lesson types? (video/reading/quizzes)     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 👤 You (2:16 PM)                                       │ │
│  │ Spanish Basics, 10 lessons, mostly reading + quizzes  │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🤖 TeacherBot (2:16 PM)                                │ │
│  │                                                        │ │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │ ┃  📦 COURSE PREVIEW                               ┃ │ │
│  │ ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ │ │
│  │ ┃  Title: Spanish Basics                          ┃ │ │
│  │ ┃  Level: Beginner                                ┃ │ │
│  │ ┃  Lessons: 10                                    ┃ │ │
│  │ ┃  - 7 Reading Lessons                            ┃ │ │
│  │ ┃  - 3 Quiz Lessons                               ┃ │ │
│  │ ┃                                                  ┃ │ │
│  │ ┃  📚 Lesson Outline:                             ┃ │ │
│  │ ┃  1. Introduction to Spanish (Reading, 30 min)   ┃ │ │
│  │ ┃  2. Greetings & Introductions (Reading, 25 min) ┃ │ │
│  │ ┃  3. Quiz: Basics Check (Quiz, 10 min)           ┃ │ │
│  │ ┃  4. Numbers & Counting (Reading, 20 min)        ┃ │ │
│  │ ┃  ...                                             ┃ │ │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  │                                                        │ │
│  │ Ready to create this course? (yes/no)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Type your message...                          [Upload]  ││
│  │                                                  [Send] ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### **ChatInput Component**
```tsx
<ChatInput
  placeholder="Type your message..."
  onSend={(message) => handleSend(message)}
  onFileUpload={(file) => handleFileUpload(file)} // Phase 2
  disabled={isLoading}
  maxLength={2000}
  autoFocus
/>
```

**Behavior:**
- Auto-expand textarea (max 5 lines)
- Enter to send, Shift+Enter for new line
- Show character count near limit (>1800 chars)
- Disable during loading state
- Clear input after send

---

#### **MessageList Component**
```tsx
<MessageList
  messages={conversationHistory}
  isLoading={isLoading}
  onRetry={(messageId) => handleRetry(messageId)}
/>
```

**Features:**
- Auto-scroll to latest message
- Markdown rendering (for AI responses)
- Copy message button
- Regenerate response button (for AI messages)
- Timestamp on hover

---

#### **PreviewCard Component**
```tsx
<PreviewCard
  type="course" // or "lesson", "quiz"
  data={coursePreview}
  onConfirm={() => handleConfirm()}
  onCancel={() => handleCancel()}
  onEdit={(field, value) => handleEdit(field, value)}
/>
```

**Design:**
- Bordered card with accent color
- Icon based on type (📦 course, 📚 lesson, 📝 quiz)
- Expandable sections for long content
- Inline editing (click to edit fields)
- Prominent Confirm/Cancel buttons

---

#### **ModeToggle Component**
```tsx
<ModeToggle
  currentMode={mode}
  onChange={(newMode) => setMode(newMode)}
  disabled={isProcessing}
/>
```

**Visual States:**
```
🧠 Planning Mode (Indigo) | ⚡ Building Mode (Green)
```

---

### Responsive Design

| Breakpoint | Layout | Notes |
|------------|--------|-------|
| **Mobile** (<768px) | Full-screen chat, hidden sidebar | Focus on conversation |
| **Tablet** (768px-1024px) | Chat + collapsible sidebar | Sidebar as overlay |
| **Desktop** (>1024px) | Chat + fixed sidebar | Full features visible |

---

### Accessibility (WCAG 2.1 AA)

- ✅ Keyboard navigation (Tab, Enter, Escape)
- ✅ Screen reader support (ARIA labels)
- ✅ High contrast mode support
- ✅ Focus indicators
- ✅ Error messages announced
- ✅ Loading states announced

---

## 📝 Prompt Engineering Guide

### System Prompt Structure

```markdown
You are TeacherBot, an expert AI assistant specialized in creating language learning courses for the DualLing platform.

## YOUR IDENTITY
- Name: {teacher_persona.botName || "TeacherBot"}
- Role: Course Creation Assistant
- Expertise: Language pedagogy, instructional design, course structuring
- Languages: Lithuanian (native), English (fluent)

## YOUR BEHAVIOR
- Tone: {teacher_persona.tone || "professional"}
- Verbosity: {teacher_persona.verbosity || "balanced"}
- Language Preference: {teacher_persona.defaultLanguage || "English"}

## CURRENT MODE
Mode: {current_mode} (planning/building)

## WORKFLOW
{mode === 'planning' ? PLANNING_INSTRUCTIONS : BUILDING_INSTRUCTIONS}

## COURSE CREATION GUIDELINES
{COURSE_CREATION_CHECKLIST}

## QUIZ GENERATION RULES
{QUIZ_BEST_PRACTICES}

## ERROR HANDLING
{ERROR_HANDLING_PATTERNS}

## CONVERSATION CONTEXT
- Current Course: {currentCourse?.title || 'None'}
- Conversation Turns: {messageCount}
- Recent Topics: {recentTopics}
```

### Prompt Templates

#### **Template 1: Gathering Requirements**
```
I see you want to create a {language} course! To help you build the best possible course, let me gather some key details:

📋 COURSE CREATION CHECKLIST
- [ ] Course Title: ______________
- [ ] Language: ______________
- [ ] Level: ______________
- [ ] Number of Lessons: ______________
- [ ] Lesson Types: ______________
- [ ] Learning Objectives: ______________

Please provide as much detail as you're comfortable with, and I'll fill in the rest!
```

#### **Template 2: Course Structure Preview**
```
📦 COURSE STRUCTURE PREVIEW

Course: "{title}"
Level: {level}
Language: {language}
Price: €{price} {price === 0 ? '(Free)' : ''}
Tags: [{tags.join(', ')}]

Lessons: {lessonCount} total
{lessons.map((l, i) => `${i+1}. [${l.type}] ${l.title} (${l.duration} min)`).join('\n')}

Total Duration: ~{totalHours} hours
Estimated Completion: {estimatedWeeks} weeks

Learning Objectives:
{objectives.map(o => `• ${o}`).join('\n')}

Ready to create this course? (yes/no)
```

#### **Template 3: Error Response**
```
❌ {error_type}

💡 What happened:
{explanation}

🔧 How to fix:
{solution}

Would you like to try again?
```

### Few-Shot Examples

Include in system prompt for better quality:

```markdown
## EXAMPLE INTERACTIONS

### Example 1: Creating a Course
Teacher: "I want to create a Lithuanian course for English speakers"
Assistant: "Excellent! A Lithuanian course for English speakers. Let me gather some details:
- What's the target level? (beginner/intermediate/advanced)
- How many lessons are you thinking?
- What teaching approach? (grammar-focused, conversation-based, mixed)
Once I have these details, I can suggest a course structure!"

### Example 2: Generating Quizzes
Teacher: "Create a quiz about Lithuanian pronouns"
Assistant: "I'll create a 5-question quiz about Lithuanian pronouns. Let me show you the questions:

📝 QUIZ PREVIEW
Q1: Which pronoun means "I" in Lithuanian?
A) Aš ✓
B) Tu
C) Jis
D) Mes
Explanation: "Aš" is the first-person singular pronoun...

[4 more questions]

These questions test understanding of pronouns in different contexts. Ready to add this quiz to your course?"

### Example 3: Handling Errors
Teacher: "Create the course"
Assistant: "❌ Missing Information

💡 What happened:
I need a few more details before creating the course. We're missing:
- Course title
- Target level (beginner/intermediate/advanced)

🔧 How to fix:
Please provide these details and I'll create your course right away!"
```

---

## 🔒 Security & Privacy

### Data Security

**Authentication:**
- Firebase JWT tokens (1-hour expiry, auto-refresh)
- Custom claims for role-based access (teacher/admin only)
- No Gemini API key in frontend code

**Authorization:**
```typescript
// Middleware check
const decodedToken = await verifyIdToken(token);
if (decodedToken.role !== 'teacher' && decodedToken.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**Rate Limiting:**
- 60 requests per hour per teacher
- 10 concurrent conversations max
- Implemented via Cloud Armor (future) or in-memory store

### Data Privacy (GDPR Compliance)

**Conversation Data:**
- Stored in Firestore under `users/{teacherId}/chatbotConversations`
- Retention: 90 days, then auto-delete
- Teacher can delete anytime (right to erasure)

**PII Handling:**
- No student PII sent to Gemini API
- Teacher names/emails not included in prompts
- Content sanitization before sending to AI

**Data Processing Agreement:**
- Google Cloud DPA covers Gemini API usage
- No training on user data (Gemini Developer API terms)
- Data residency: europe-west1 (GDPR-friendly)

### Content Safety

**Input Validation:**
```typescript
function sanitizeInput(message: string): string {
  // Remove potential PII patterns
  const PATTERNS = [
    /\b\d{3}-\d{2}-\d{4}\b/g,      // SSN
    /\b\d{16}\b/g,                  // Credit card
    /password|passwd/gi,            // Passwords
  ];
  
  let sanitized = message;
  for (const pattern of PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new Error('Please do not share sensitive personal information');
    }
  }
  
  return sanitized;
}
```

**Output Filtering:**
- Gemini safety settings: BLOCK_MEDIUM_AND_ABOVE
- Post-processing to remove harmful content
- Profanity filter for generated course content

### API Security

**Gemini API Key Protection:**
- Stored in Firebase project (not in codebase)
- Accessed via Firebase AI Logic SDK
- No direct API calls from frontend

**Firebase App Check:**
- Prevent API abuse from unauthorized clients
- ReCAPTCHA v3 for web
- Device attestation for mobile (future)

---

## 🧪 Testing Strategy

### Unit Tests

**Backend API Route:**
```typescript
// __tests__/api/ai/teacher-bot.test.ts
describe('POST /api/ai/teacher-bot', () => {
  it('should authenticate teacher', async () => {
    const response = await request(app)
      .post('/api/ai/teacher-bot')
      .set('Authorization', 'Bearer invalid_token')
      .send({ message: 'Test' });
    
    expect(response.status).toBe(401);
  });
  
  it('should reject non-teacher users', async () => {
    const studentToken = generateToken({ role: 'student' });
    const response = await request(app)
      .post('/api/ai/teacher-bot')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'Test' });
    
    expect(response.status).toBe(403);
  });
  
  it('should return AI response', async () => {
    const teacherToken = generateToken({ role: 'teacher' });
    const response = await request(app)
      .post('/api/ai/teacher-bot')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ 
        message: 'I want to create a Spanish course',
        mode: 'planning'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.message.content).toBeDefined();
  });
});
```

**Function Calling:**
```typescript
describe('Function Calling', () => {
  it('should execute createCourse function', async () => {
    const mockModel = {
      startChat: jest.fn().mockReturnValue({
        sendMessage: jest.fn().mockResolvedValue({
          functionCalls: [{
            name: 'createCourse',
            args: {
              title: 'Test Course',
              language: 'Spanish',
              level: 'beginner'
            }
          }]
        })
      })
    };
    
    const result = await handleChatMessage('Create a Spanish course', mockModel);
    
    expect(result.functionCalls).toHaveLength(1);
    expect(result.functionCalls[0].name).toBe('createCourse');
  });
});
```

### Integration Tests

**End-to-End Flow:**
```typescript
describe('Course Creation Flow (E2E)', () => {
  it('should create course from text prompt', async () => {
    // 1. Teacher describes course
    const response1 = await sendMessage('I want to create a Spanish course');
    expect(response1.text).toContain('gather some details');
    
    // 2. Teacher provides details
    const response2 = await sendMessage('Spanish Basics, 10 lessons, beginner');
    expect(response2.text).toContain('PREVIEW');
    
    // 3. Teacher confirms
    const response3 = await sendMessage('yes, create it');
    expect(response3.text).toContain('Course created');
    
    // 4. Verify in database
    const course = await db.collection('courses').doc(courseId).get();
    expect(course.data().title).toBe('Spanish Basics');
  });
});
```

### Manual Testing Checklist

**Phase 1 MVP Testing:**
- [ ] Teacher can start new conversation
- [ ] Bot responds within 3 seconds
- [ ] Bot gathers all required info before creation
- [ ] Preview shows correct course structure
- [ ] Confirmation creates course in Firestore
- [ ] Course ID returned correctly
- [ ] Multiple lessons can be created
- [ ] Quiz questions formatted correctly
- [ ] Conversation history persists
- [ ] Mode switching works (Planning ↔ Building)
- [ ] Error messages are user-friendly
- [ ] Rate limiting prevents abuse
- [ ] Non-teachers cannot access

### Performance Tests

**Load Testing:**
```bash
# Simulate 10 concurrent teachers
artillery run load-test.yml

# load-test.yml
config:
  target: 'https://your-domain.com'
  phases:
    - duration: 300  # 5 minutes
      arrivalRate: 2  # 2 new users/second
scenarios:
  - name: 'Teacher creates course'
    flow:
      - post:
          url: '/api/ai/teacher-bot'
          headers:
            Authorization: 'Bearer {{token}}'
          json:
            message: 'Create a Spanish course'
```

**Acceptance Criteria:**
- 95th percentile response time <3s
- 99th percentile response time <5s
- 0% error rate under normal load
- Handle 10 concurrent conversations
- Degrade gracefully under heavy load

---

## 📅 Implementation Roadmap

### Phase 1: MVP (8 weeks) - December 2025

#### **Week 1-2: Foundation**
- [ ] Set up Firebase AI Logic SDK
- [ ] Configure Gemini 2.5 Flash Lite
- [ ] Create function declarations (createCourse, createLesson, createQuiz)
- [ ] Implement Next.js API route `/api/ai/teacher-bot`
- [ ] Set up conversation storage (Firestore)

**Deliverables:** Working backend API that can call Gemini

---

#### **Week 3-4: Core Features**
- [ ] Implement text-to-course generation
- [ ] Add lesson creation (reading + quiz types)
- [ ] Build conversation memory system
- [ ] Add preview & confirm flow
- [ ] Implement mode switching

**Deliverables:** Full backend functionality

---

#### **Week 5-6: Frontend UI**
- [ ] Design chat interface (Figma mockups)
- [ ] Build ChatInput component
- [ ] Build MessageList component
- [ ] Build PreviewCard component
- [ ] Add ModeToggle component
- [ ] Integrate with backend API

**Deliverables:** Working teacher dashboard AI assistant page

---

#### **Week 7: Testing & Refinement**
- [ ] Write unit tests (backend)
- [ ] Write integration tests (E2E)
- [ ] Manual QA testing
- [ ] Fix bugs and edge cases
- [ ] Performance optimization

**Deliverables:** Tested, stable system

---

#### **Week 8: Launch Prep**
- [ ] Set up Firebase Remote Config (model selection)
- [ ] Configure monitoring (Cloud Logging, alerts)
- [ ] Write user documentation
- [ ] Create onboarding tutorial
- [ ] Soft launch to 5 beta teachers

**Deliverables:** Production-ready Phase 1 MVP

---

### Phase 2: Advanced Features (Q1 2026)

**Week 9-12:**
- [ ] PDF upload & processing
- [ ] YouTube video integration
- [ ] Teacher persona (MD file upload)
- [ ] Feedback collection system
- [ ] Analytics dashboard

---

### Phase 3: Student Chatbot (Q2 2026)

**Week 13-20:**
- [ ] Student chatbot implementation
- [ ] Lesson-specific context retrieval
- [ ] Real-time assistance during lessons
- [ ] Multi-language expansion

---

## ⚠️ Dependencies & Risks

### Dependencies

| Dependency | Status | Risk | Mitigation |
|-----------|--------|------|------------|
| Firebase AI Logic SDK | ✅ Available | Low | Stable Google product |
| Gemini 2.5 Flash Lite | ✅ Active | Medium | Use Remote Config for model switching |
| Firebase Admin SDK | ✅ Stable | Low | Mature product |
| Next.js 14 | ✅ Stable | Low | Active development |
| Existing API endpoints | ✅ Working | Low | Already tested |

### Risks & Mitigation

#### **Risk 1: Gemini Model Retirement**
**Probability:** Medium (happened to 1.0/1.5 models)  
**Impact:** High (service disruption)  
**Mitigation:**
- Use Firebase Remote Config for dynamic model selection
- Set up monitoring alerts for model deprecation notices
- Maintain compatibility with multiple model versions

---

#### **Risk 2: Poor Content Quality**
**Probability:** Medium  
**Impact:** High (teacher dissatisfaction)  
**Mitigation:**
- Extensive prompt engineering and testing
- Mandatory preview before creation
- Teacher can edit AI-generated content
- Collect feedback and iterate

---

#### **Risk 3: Cost Overruns**
**Probability:** Low  
**Impact:** Medium (budget exceeded)  
**Mitigation:**
- Monitor token usage closely
- Set per-teacher rate limits
- Use cost-effective model (Flash Lite)
- Implement conversation length limits

---

#### **Risk 4: Slow Adoption**
**Probability:** Medium  
**Impact:** High (ROI not achieved)  
**Mitigation:**
- Onboarding tutorial for new teachers
- In-app tooltips and guidance
- Email campaign highlighting time savings
- Success stories from beta teachers

---

## 🚀 Launch Plan

### Soft Launch (Week 8)

**Audience:** 5 beta teachers (hand-selected)  
**Duration:** 2 weeks  
**Goals:**
- Validate core functionality
- Gather qualitative feedback
- Identify edge cases
- Measure time savings

**Success Criteria:**
- All 5 teachers create at least 1 course
- Average satisfaction >4/5
- <10% error rate
- No critical bugs

---

### Limited Launch (Week 10)

**Audience:** All active teachers (~20 users)  
**Communication:**
- Email announcement with tutorial video
- In-app banner on teacher dashboard
- Changelog entry

**Monitoring:**
- Daily usage metrics
- Error rate tracking
- Teacher feedback survey (after first use)

**Rollback Plan:**
- If error rate >15%, disable feature
- If satisfaction <3/5, gather feedback and iterate

---

### General Availability (Week 12)

**Audience:** All teachers (including new signups)  
**Communication:**
- Blog post announcing feature
- Social media posts
- Email to all users

**Success Metrics (30 days post-launch):**
- 50% of active teachers use AI assistant
- 30 courses created with AI assistance
- >4.5/5 average satisfaction
- <5% error rate

---

## 📊 Success Metrics Dashboard

### KPIs to Track

| Metric | Measurement | Target | Tracking Method |
|--------|-------------|--------|-----------------|
| **Adoption Rate** | % of teachers who use AI assistant | >50% | Firebase Analytics |
| **Course Creation Time** | Avg. hours to create course | <1.5 hrs | User surveys |
| **Courses Created** | # courses created with AI | 30/month | Firestore query |
| **Teacher Satisfaction** | Post-use survey rating | >4.5/5 | In-app survey |
| **Content Acceptance** | % of AI content kept unchanged | >80% | Track edit rate |
| **Retention** | % of teachers who use for 2nd course | >70% | Cohort analysis |
| **Error Rate** | % of failed AI requests | <5% | Cloud Logging |
| **Response Time** | 95th percentile latency | <3s | Cloud Trace |

---

## 📚 Appendices

### Appendix A: Related Documentation
- [Teacher Chatbot ARD](./TEACHER_CHATBOT_ARD.md) - AI Requirements Document
- [AI Chatbot Integration Questionnaire](./AI_CHATBOT_INTEGRATION_QUESTIONNAIRE.md) - Technical context
- [API Verification Report](./API_VERIFICATION_REPORT.md) - API endpoints reference
- [Current Architecture](./CURRENT_ARCHITECTURE.md) - System architecture

### Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Function Calling** | AI model's ability to call external APIs to perform actions |
| **Conversation History** | Record of messages in a chat session |
| **System Prompt** | Instructions that define AI assistant's behavior |
| **Token** | Unit of text (roughly 4 chars) used for AI model billing |
| **Firestore** | NoSQL database by Google (used for data storage) |
| **Remote Config** | Firebase service for dynamic app configuration |

### Appendix C: User Feedback (Discovery Phase)

**Teacher A (10+ years experience):**
> "If the AI could just generate the lesson outline, I'd save 2 hours per course. That's huge."

**Teacher B (New educator):**
> "I don't know how to structure a course. I need examples or templates to follow."

**Teacher C (Part-time):**
> "Quiz creation is so boring. If AI could do that, I'd create way more courses."

---

## 📝 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | Oct 21, 2025 | Initial PRD creation | ZenType Architect |

---

## ✅ Approval Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Manager | [Your Name] | __________ | _____ |
| Engineering Lead | [Name] | __________ | _____ |
| Design Lead | [Name] | __________ | _____ |

---

**Document Owner:** ZenType Architect (J)  
**Next Review:** After Phase 1 MVP launch (Dec 2025)  
**Status:** ✅ Ready for Development Sprint Planning
