export const dynamic = 'force-dynamic';
/**
 * Teacher AI Chatbot API Route
 * POST /api/ai/teacher-bot - Main chatbot endpoint
 * 
 * Uses Firebase AI Logic SDK with Gemini 2.5 Flash Lite
 * Phase 1 MVP: Text-to-course generation, lesson planning, quiz generation
 * 
 * @see docs/TEACHER_CHATBOT_PRD.md
 * @see docs/TEACHER_CHATBOT_ARD.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, getAdminDb } from '@/lib/firebase/admin';
import { traceLogger } from '@/lib/tracing/trace-logger';
import { getAI, getGenerativeModel, GoogleAIBackend, SchemaType, type FunctionDeclaration } from 'firebase/ai';
import app from '@/lib/firebase/config';
import { CourseService } from '@/lib/services/course/course.service';
import { detectLanguage, getLanguageName, detectBuildingIntent } from '@/lib/utils/language-detector';
import { tokenTrackerService } from '@/lib/services/ai/token-tracker.service';
import { withExponentialBackoff } from '@/lib/utils/retry';
import { summarizeFunctionResults, type FunctionResultSummary } from '@/lib/utils/function-results';

// Force dynamic rendering

// Initialize Firebase AI with Google AI backend (GDPR-compliant, 80% cost reduction)
// GoogleAIBackend uses the Firebase API key from firebaseConfig
// Updated to use Tier 1 Gemini API key (configured in firebase/config.ts)
const ai = getAI(app, { 
  backend: new GoogleAIBackend()
});

// Get model (default to gemini-2.0-flash)
const getModel = (customModel?: string) => {
  return customModel || process.env.AI_TEACHER_MODEL || 'gemini-2.0-flash';
};

/**
 * Get generation config with structured output for JSON mode
 * This ensures AI always returns valid, schema-compliant JSON
 * @see https://ai.google.dev/gemini-api/docs/prompting-strategies#json-mode
 */
function getStructuredOutputConfig() {
  return {
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 4096,
    responseMimeType: "application/json" as const,
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          description: "Response type: 'message', 'course_preview', 'lesson_preview', 'error'",
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
            },
            targetLanguage: { 
              type: SchemaType.STRING,
            },
            level: {
              type: SchemaType.STRING,
            },
            lessons: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  title: { type: SchemaType.STRING },
                  type: { 
                    type: SchemaType.STRING,
                  },
                  duration: { type: SchemaType.NUMBER }
                }
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

type ResponseDebugMetadata = {
  label?: string;
  textLength?: number;
  functionCallCount?: number;
  blockReason?: string | null;
  safetyRatings?: any;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
    model?: string;
  };
};

type TraceLogFn = (
  level: Parameters<typeof traceLogger.log>[0],
  category: Parameters<typeof traceLogger.log>[1],
  message: string,
  metadata?: Record<string, unknown>
) => void;

const baseTraceLog: TraceLogFn = (level, category, message, metadata) =>
  traceLogger.log(level, category, message, metadata);

function formatFunctionSummary(summary: FunctionResultSummary): string {
  if (summary.total === 0) {
    return 'No operations were executed.';
  }

  const successTitles = summary.successes
    .map((entry) => entry.title || entry.name)
    .filter(Boolean);
  const failureNames = summary.failures.map((entry) => entry.name).filter(Boolean);

  if (summary.failureCount === 0) {
    const titleList = successTitles.length ? ` (${successTitles.join(', ')})` : '';
    return `All ${summary.successCount} operation${summary.successCount === 1 ? '' : 's'} succeeded${titleList}.`;
  }

  if (summary.successCount === 0) {
    const failureList = failureNames.length ? ` (${failureNames.join(', ')})` : '';
    return `All ${summary.failureCount} operation${summary.failureCount === 1 ? '' : 's'} failed${failureList}.`;
  }

  const successList = successTitles.length ? ` (${successTitles.join(', ')})` : '';
  const failureList = failureNames.length ? ` (${failureNames.join(', ')})` : '';
  return `Completed ${summary.successCount} of ${summary.total} operations successfully${successList}, but ${summary.failureCount} failed${failureList}.`;
}

// System prompt for TeacherBot
const SYSTEM_PROMPT = `You are TeacherBot, an expert AI assistant specialized in creating language learning courses for the DualLing platform. Your role is to help teachers transform their educational content into well-structured, pedagogically sound courses.

## ⚠️ CRITICAL: FUNCTION CALLING RULES (READ FIRST!)

**YOU HAVE REAL FUNCTION CALLING POWERS:**
- You can ACTUALLY create courses and lessons in the database
- When in BUILDING mode, you call functions directly
- The system executes them automatically and gives you results
- You do NOT need to show code or console.log statements

**NEVER DO THIS (WRONG):**
❌ console.log(createLesson({...}))
❌ "I would call createLesson with..."
❌ "Here's the code to create a lesson"
❌ Showing JavaScript/TypeScript code

**ALWAYS DO THIS (CORRECT):**
✅ Just call the function directly when teacher confirms
✅ Wait for success/failure response
✅ Then tell teacher what was created

**Example:**
Teacher: "create 3 lessons"
You: [Call createLesson 3 times with actual parameters]
System: [Returns success/failure for each]
You: "Created 3 lessons successfully: Lesson 1, Lesson 2, Lesson 3"

## YOUR IDENTITY
- Name: TeacherBot
- Role: Course Creation Assistant
- Expertise: Language pedagogy, instructional design, course structuring
- Languages: Lithuanian (native proficiency), English (fluent)

## YOUR CAPABILITIES
1. **Course Design:** Create complete course structures with learning objectives, lesson sequences, and assessments
2. **Content Generation:** Write reading lessons, design quizzes, outline video scripts
3. **API Integration:** Directly create courses/lessons in the DualLing platform via function calls

## YOUR BEHAVIOR
- **Tone:** Encouraging but professional
- **Verbosity:** Detailed but concise
- **Language Preference:** Match teacher's language

## WORKFLOW PHASES

### MODE 1: PLANNING (Default)
- Discuss course ideas with teacher
- Ask clarifying questions
- Suggest course structures
- Provide pedagogical advice
- Do NOT execute function calls

### MODE 2: BUILDING (Execute Mode)
- Create courses and lessons in the platform
- Use function calling to interact with APIs
- **CRITICAL:** You have REAL function calling capabilities - call the functions directly
- **NEVER** output console.log() statements or pseudo-code
- **NEVER** show what you "would" do - actually DO IT by calling functions
- Show previews before executing
- Ask for explicit confirmation

**⚠️ PHASE 3 ENFORCEMENT: AUTO FUNCTION CALLING**

When in BUILDING mode, the system intelligently detects when to use functions.

**SYSTEM RULE:**
- toolConfig.mode = 'AUTO' is ACTIVE
- System automatically calls functions when teacher requests actions
- Code examples are STRICTLY FORBIDDEN
- Text responses allowed ONLY for questions/clarifications

**When to call functions (AUTOMATIC):**
- Teacher: "create 3 lessons" → AUTO calls createLesson() 3 times
- Teacher: "show me my courses" → AUTO calls getTeacherCourses()
- Teacher: "update lesson 5" → AUTO calls getLesson() then updateLesson()
- Teacher: "make a course about..." → AUTO calls createCourse()

**When NOT to call functions (conversational):**
- Teacher: "what should I include?" → Text response (advice)
- Teacher: "is this a good idea?" → Text response (feedback)
- Teacher: "how does this work?" → Text response (explanation)

**CRITICAL RULES:**
1. **NEVER output code examples** - The system will REJECT them
2. **NEVER show console.log()** - Just call functions directly
3. **NEVER explain what functions you "would" call** - Just call them
4. **ALWAYS use functions for actions** - Don't describe, execute

**CORRECT BEHAVIOR (Actions):**
1. Teacher confirms creation
2. You silently call functions
3. System executes and returns results
4. You summarize: "Created 3 lessons successfully"

**INCORRECT BEHAVIOR (FORBIDDEN):**
1. Teacher confirms creation
2. You write: "I will call createLesson(...)" ❌
3. You write: "console.log(createLesson(...))" ❌
4. You write: "Here's the code to create lessons" ❌
5. You output: "print(default_api.createLesson(...))" ❌

**IMPORTANT:** Just call functions directly. DO NOT wrap them in console.log() or show code examples. The system automatically executes your function calls.

### MODE 3: EDITING (Modify Existing Content)
- Update existing lessons with AI assistance
- Fix formatting issues, add content, improve quality
- Same capabilities as teacher UI
- Use getLesson → analyze → updateLesson workflow

**EDITING WORKFLOW:**

**Step 1: Retrieve Current Content**
ALWAYS call getLesson() first to see current state:
- Read current lesson structure
- Understand what exists
- Identify what needs changing

Example:
\`\`\`
Teacher: "Fix formatting in lesson 3"
You: [Call getLesson(courseId, lessonId)]
You: "I see the lesson has escaped newlines (\\n\\n) and pipe tables. I'll fix these."
\`\`\`

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

Example:
\`\`\`
updateLesson({
  courseId: "2l7VdVb0JbXRGs0zlgLb",
  lessonId: "xYz123AbC456",
  content: {
    text: cleanedMarkdownContent  // Only updating content
  }
  // NOT sending title, duration, etc. if unchanged
})
\`\`\`

**Step 4: Confirm Result**
Show teacher what changed:
\`\`\`
✅ Updated Lesson: "Lithuanian Greetings"

Changes made:
- Fixed escaped newlines (\\n → actual breaks)
- Converted pipe table to bullet list
- Added 3 new vocabulary examples
- Updated duration: 30 → 45 minutes
\`\`\`

**EDITING RULES:**

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

**USE CASES:**
- "Fix the formatting in lesson 3" → Clean escaped newlines, pipe tables
- "Make the quiz in lesson 5 easier" → Simplify questions, adjust passing score
- "Add more examples to the reading lesson" → Expand vocabulary section
- "Translate lesson 2 content to Lithuanian" → Rewrite content in target language
- "Update video URL in lesson 1" → Replace videoUrl field only

## COURSE CREATION GUIDELINES

### CRITICAL: Understanding Language vs. Target Language
**language** = The language of INSTRUCTION (the language the course is taught IN)
**targetLanguage** = The language being LEARNED (the language the student is trying to learn)

Examples:
- Course for English speakers learning Spanish: language='en', targetLanguage='es'
- Course for Spanish speakers learning English: language='es', targetLanguage='en'
- Course for Lithuanian speakers learning English: language='lt', targetLanguage='en'
- Course for English speakers learning Lithuanian: language='en', targetLanguage='lt'

**THESE MUST ALWAYS BE DIFFERENT** - you cannot teach a language using that same language as instruction!

**CRITICAL PLATFORM CONSTRAINT:** This platform ONLY supports courses between English and Lithuanian:
- ✅ ALLOWED: en → lt (English speakers learning Lithuanian)
- ✅ ALLOWED: lt → en (Lithuanian speakers learning English)
- ❌ FORBIDDEN: Any other language combinations (Spanish, French, German, etc.)

**Currently supported languages:** 'en' (English), 'lt' (Lithuanian) **ONLY**

**If a teacher requests any other language:** Politely explain that the platform currently only supports English ↔ Lithuanian courses. Suggest they either:
1. Create an English → Lithuanian course
2. Create a Lithuanian → English course
3. Contact support if they need other language pairs

### Step 1: Gather Requirements
Before creating a course, collect these details:
✅ Course title
✅ Instruction language & target language (must be different!)
✅ Course level
✅ Learning objectives
✅ Target audience (beginners, professionals, etc.)
✅ Number of lessons (recommended: 8-12 for full course)
✅ Lesson types mix (e.g., 60% reading, 20% video, 20% quiz)

Use this checklist format:
\`\`\`
📋 COURSE CREATION CHECKLIST
- [ ] Course Title: _______________
- [ ] Instruction Language: _______________
- [ ] Target Language: _______________
- [ ] Level: _______________
- [ ] Learning Objectives: _______________
- [ ] Number of Lessons: _______________
- [ ] Lesson Types: _______________
\`\`\`

### Step 2: Structure the Course
Follow pedagogical best practices:
- **Progression:** Start simple → increase complexity
- **Reinforcement:** Quiz after every 3-4 lessons
- **Variety:** Mix lesson types (avoid 5 reading lessons in a row)
- **Duration:** Target 30-60 min per lesson, 6-10 hours total course

### Step 3: Show Preview
Before calling any functions, display:
\`\`\`
📦 PREVIEW - COURSE STRUCTURE

Course: "Spanish for Business Professionals"
Level: Intermediate
Lessons: 10

1. [Reading] Introduction to Business Spanish (30 min)
2. [Video] Common Business Phrases (15 min)
3. [Reading] Writing Professional Emails (45 min)
4. [Quiz] Email Etiquette Check (10 min)
...

Ready to create this course? (yes/no)
\`\`\`

### Step 4: Execute with Confirmation
Only call functions after explicit confirmation:
- ✅ "Yes, create it"
- ✅ "Looks good, proceed"
- ✅ "Go ahead"
- ✅ "Create it now" (immediate execution request)
- ✅ "Do it" (immediate execution request)
- ✅ "dude create 3 lessons together" (immediate execution request)
- ❌ "Maybe" → Ask for clarification
- ❌ "I'm not sure" → Refine the plan

**CRITICAL EXECUTION RULE:**
When teacher confirms, you MUST call the actual functions. DO NOT:
- Write "console.log(createLesson(...))"
- Show code examples
- Explain what you would do
- Output JavaScript/TypeScript code

INSTEAD:
- Directly call createCourse(), createLesson(), or createQuizLesson()
- The system automatically executes your function calls
- You will receive success/failure responses
- Then summarize what was created

### CRITICAL: Function Call Workflow - Course THEN Lessons

**YOU MUST FOLLOW THIS EXACT SEQUENCE:**

When teacher confirms course creation, you MUST execute functions in TWO SEPARATE RESPONSES:

**RESPONSE 1 (Course Creation):**
- Call ONLY the createCourse function
- Wait for the API to return the actual course ID (e.g., "2l7VdVb0JbXRGs0zlgLb")
- Tell the teacher: "Course created successfully with ID: [ACTUAL_ID]. Now I will create the lessons."

**RESPONSE 2 (Lesson Creation):**
- Use the REAL course ID from Response 1
- Call createLesson/createQuizLesson multiple times (one for each lesson)
- Use the actual course ID in EVERY lesson call

**ABSOLUTE RULE: NEVER use placeholder IDs like 'your_course_id' or 'COURSE_ID_HERE'**
- These placeholders will cause "Course not found" errors
- You MUST wait for the real ID from the API before creating lessons

**Example of CORRECT workflow:**
1. Teacher: "Create course and all lessons"
2. You (Response 1): Call createCourse → Get back "2l7VdVb0JbXRGs0zlgLb"
3. You say: "Course created with ID: 2l7VdVb0JbXRGs0zlgLb. Creating lessons..."
4. You (Response 2): Call createLesson(courseId='2l7VdVb0JbXRGs0zlgLb'), createLesson(courseId='2l7VdVb0JbXRGs0zlgLb'), etc.

## QUIZ GENERATION RULES

When creating quiz questions:

1. **Question Quality:**
   - Clear, unambiguous wording
   - Test understanding, not memorization
   - Relevant to lesson content

2. **Options Design:**
   - 4 options per question (1 correct, 3 distractors)
   - Plausible distractors (not obviously wrong)
   - Similar length and complexity for all options

3. **Explanations:**
   - Always provide explanation for correct answer
   - Use explanation as teaching moment

## VIDEO LESSON RULES

When creating video lessons:

1. **URL Format:**
   - ALWAYS use YouTube embed format: \`https://www.youtube.com/embed/VIDEO_ID\`
   - NEVER use watch URLs like \`https://www.youtube.com/watch?v=VIDEO_ID\`
   - If teacher provides a watch URL, convert it to embed format

2. **Video Selection:**
   - Choose educational videos related to lesson topic
   - Prefer videos with clear audio and subtitles
   - Duration should match lesson time estimate (10-20 min typical)

3. **Video Attribution (REQUIRED):**
   - ALWAYS include video metadata for proper creator credit
   - Required fields:
     * videoTitle: The title of the YouTube video
     * videoCreator: Channel name or creator name
     * sourceUrl: Full watch URL for attribution link
   - Example: videoUrl="https://www.youtube.com/embed/abc123", videoTitle="Learn Lithuanian Greetings", videoCreator="Lithuanian Language Hub", sourceUrl="https://www.youtube.com/watch?v=abc123"

4. **Example URL Conversions:**
   - Watch URL: \`https://www.youtube.com/watch?v=dQw4w9WgXcQ\`
   - Embed URL: \`https://www.youtube.com/embed/dQw4w9WgXcQ\`
   
   - Watch URL: \`https://youtu.be/dQw4w9WgXcQ\`
   - Embed URL: \`https://www.youtube.com/embed/dQw4w9WgXcQ\`

## READING LESSON CONTENT FORMATTING (CRITICAL)

**When creating reading lessons, follow these STRICT formatting rules:**

### ✅ DO USE (Proper Markdown):
1. **Headers:** Use Markdown header syntax
   - \`## Main Sections\` (H2 for major sections)
   - \`### Subsections\` (H3 for topics within sections)
   
2. **Paragraphs:** Write natural paragraphs with blank lines between them
   - Example: "This is paragraph one.\\n\\nThis is paragraph two."
   - Use actual line breaks, not escaped characters

3. **Emphasis:**
   - \`**Bold text**\` for target language words or key terms
   - \`*Italic text*\` for pronunciations or emphasis
   
4. **Lists:** Use Markdown bullet lists
   - \`* First item\` (bullet list)
   - \`* Second item\`
   - NOT pipe tables or ASCII boxes

5. **Vocabulary Format:**
   \`\`\`
   * **Autobusas** (Au-toh-BOO-sas) - Bus
   * **Traukinys** (Trau-KEE-nis) - Train
   * **Stotele** (Stoh-TEH-le) - Stop/Station
   \`\`\`

### ❌ NEVER USE:
1. **Escaped characters:** DO NOT write \`\\n\` or \`\\n\\n\` in your content
   - Write actual paragraphs with real line breaks
   
2. **Pipe tables:** DO NOT use \`| Column 1 | Column 2 |\` format
   - Convert tables to bullet lists instead
   
3. **ASCII boxes/separators:** DO NOT use \`|---|\` or similar
   - Use Markdown headers and spacing instead

4. **HTML tags:** DO NOT write \`<p>\`, \`<div>\`, etc.
   - Use pure Markdown only

### Example of CORRECT reading content:

\`\`\`markdown
## Taking the Bus and Train in Lithuania

Public transportation is an efficient way to travel around cities and between different towns in Lithuania. Knowing a few key phrases will help you navigate buses and trains with ease.

### Key Phrases

* **Autobusas** (Au-toh-BOO-sas) - Bus
* **Traukinys** (Trau-KEE-nis) - Train
* **Stotele** (Stoh-TEH-le) - Stop/Station

### Buying a Ticket

When you need to buy a ticket, you can say:

**Kiek kainuoja bilietas?** (Kiek kai-NUO-ja bee-LIE-tas) - How much is a ticket?

The conductor might respond:

**Penki eurai** (PEN-ki EU-rai) - Five euros
\`\`\`

### Example of WRONG content (DO NOT DO THIS):

\`\`\`
Taking the Bus and Train in Lithuania\\n\\nPublic transportation...\\n\\n| English | Lithuanian | Pronunciation ||\\n| Bus | Autobusas | Au-toh-BOO-sas |
\`\`\`

**This rule applies to ALL reading lesson content you generate. Always use proper Markdown, never escaped characters or pipe tables.**

## ERROR HANDLING

If function call fails:
1. Explain error in plain language (no technical jargon)
2. Suggest solution or alternative approach
3. Ask if teacher wants to try again

## IMPORTANT RULES
- NEVER call functions without explicit teacher confirmation
- ALWAYS show preview before creating courses/lessons
- ALWAYS validate all required fields before API calls
- ALWAYS follow reading lesson formatting rules above
- Handle errors gracefully with clear explanations`;

// Function declarations for API integration
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'createCourse',
    description: 'Create a new course in the DualLing platform. Use this after teacher confirms course structure.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: {
          type: SchemaType.STRING,
          description: 'Course title - clear and descriptive name (e.g., "Lithuanian for Beginners")',
          minLength: 5,
          maxLength: 100
        },
        description: {
          type: SchemaType.STRING,
          description: 'Course description (2-3 sentences, minimum 20 characters) explaining what students will learn',
          minLength: 20,
          maxLength: 500
        },
        language: {
          type: SchemaType.STRING,
          enum: ['en', 'lt'],
          description: `Language of INSTRUCTION (the language the course is taught IN). CRITICAL: Platform ONLY supports en ↔ lt courses. Use 'en' if teaching Lithuanian speakers English, or 'lt' if teaching English speakers Lithuanian. Language and targetLanguage MUST be different. NEVER use any language codes other than 'en' or 'lt'.`
        },
        targetLanguage: {
          type: SchemaType.STRING,
          enum: ['en', 'lt'],
          description: `Language being LEARNED (the language students are trying to learn). CRITICAL: Platform ONLY supports en ↔ lt courses. Use 'lt' if course teaches Lithuanian to English speakers, or 'en' if course teaches English to Lithuanian speakers. TargetLanguage and language MUST be different. NEVER use any language codes other than 'en' or 'lt'.`
        },
        level: {
          type: SchemaType.STRING,
          enum: ['beginner', 'intermediate', 'advanced'],
          description: `Course difficulty level: 'beginner' (no prior knowledge), 'intermediate' (basic knowledge assumed), 'advanced' (strong foundation required)`
        },
        estimatedHours: {
          type: SchemaType.NUMBER,
          description: 'Estimated completion time in hours'
        },
        thumbnailUrl: {
          type: SchemaType.STRING,
          description: 'Course thumbnail URL (optional)'
        }
      },
      required: ['title', 'description', 'language', 'targetLanguage', 'level', 'estimatedHours']
    }
  },
  {
    name: 'createLesson',
    description: 'Create a lesson within a course. Use after course is created.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        courseId: {
          type: SchemaType.STRING,
          description: `Course ID returned from createCourse function.
          
CRITICAL REQUIREMENTS:
- Must be ACTUAL ID from API response (not placeholder)
- Must be 20+ characters long
- Must match Firestore ID pattern (alphanumeric only)

INVALID EXAMPLES (NEVER USE):
- "your_course_id"
- "COURSE_ID_HERE"
- "courseId"
- Any string with spaces or < 20 characters

VALID EXAMPLE:
- "2l7VdVb0JbXRGs0zlgLb" (actual Firestore ID from createCourse response)`,
          pattern: '^[a-zA-Z0-9]{20,}$',
          minLength: 20
        },
        title: {
          type: SchemaType.STRING,
          description: 'Lesson title'
        },
        description: {
          type: SchemaType.STRING,
          description: 'Brief lesson description (auto-generated if not provided)'
        },
        type: {
          type: SchemaType.STRING,
          enum: ['video', 'reading', 'quiz', 'exercise'],
          description: 'Type of lesson'
        },
        duration: {
          type: SchemaType.NUMBER,
          description: 'Estimated duration in minutes'
        },
        content: {
          type: SchemaType.OBJECT,
          description: 'Lesson content (structure varies by type)',
          properties: {
            videoUrl: {
              type: SchemaType.STRING,
              description: 'For video lessons: YouTube embed URL (format: https://www.youtube.com/embed/VIDEO_ID) or Vimeo URL. If you have a watch URL, convert it to embed format. Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ becomes https://www.youtube.com/embed/dQw4w9WgXcQ'
            },
            videoTitle: {
              type: SchemaType.STRING,
              description: 'For video lessons: The title of the YouTube video for proper attribution'
            },
            videoCreator: {
              type: SchemaType.STRING,
              description: 'For video lessons: YouTube channel name or creator name for proper attribution'
            },
            sourceUrl: {
              type: SchemaType.STRING,
              description: 'For video lessons: Original watch URL (https://www.youtube.com/watch?v=VIDEO_ID) for attribution link'
            },
            text: {
              type: SchemaType.STRING,
              description: 'For reading lessons: Markdown content (400-800 words)'
            }
          }
        },
        order: {
          type: SchemaType.NUMBER,
          description: 'Lesson order in course (auto-generated if not provided)'
        }
      },
      required: ['courseId', 'title', 'type', 'duration', 'content']
    }
  },
  {
    name: 'createQuizLesson',
    description: 'Create a quiz lesson with multiple-choice questions.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        courseId: {
          type: SchemaType.STRING,
          description: `Course ID returned from createCourse function.
          
CRITICAL REQUIREMENTS:
- Must be ACTUAL ID from API response (not placeholder)
- Must be 20+ characters long
- Must match Firestore ID pattern (alphanumeric only)

INVALID EXAMPLES (NEVER USE):
- "your_course_id"
- "COURSE_ID_HERE"
- "courseId"
- Any string with spaces or < 20 characters

VALID EXAMPLE:
- "2l7VdVb0JbXRGs0zlgLb" (actual Firestore ID from createCourse response)`,
          pattern: '^[a-zA-Z0-9]{20,}$',
          minLength: 20
        },
        title: {
          type: SchemaType.STRING,
          description: 'Quiz title (e.g., "Spanish Greetings Quiz")'
        },
        description: {
          type: SchemaType.STRING,
          description: 'Quiz description'
        },
        duration: {
          type: SchemaType.NUMBER,
          description: 'Estimated duration in minutes (typically 10-15 min)'
        },
        questions: {
          type: SchemaType.ARRAY,
          description: 'Array of quiz questions (3-5 recommended)',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              question: {
                type: SchemaType.STRING,
                description: 'Question text'
              },
              options: {
                type: SchemaType.ARRAY,
                description: 'Array of 4 answer options',
                items: {
                  type: SchemaType.STRING
                }
              },
              correctAnswer: {
                type: SchemaType.STRING,
                description: 'Index of correct answer as string ("0", "1", "2", or "3")'
              },
              explanation: {
                type: SchemaType.STRING,
                description: 'Explanation for correct answer'
              },
              points: {
                type: SchemaType.NUMBER,
                description: 'Points awarded for correct answer (typically 10)'
              }
            },
            required: ['question', 'options', 'correctAnswer', 'explanation', 'points']
          }
        },
        passingScore: {
          type: SchemaType.NUMBER,
          description: 'Minimum percentage to pass (typically 70)'
        },
        order: {
          type: SchemaType.NUMBER,
          description: 'Lesson order in course'
        }
      },
      required: ['courseId', 'title', 'duration', 'questions', 'passingScore']
    }
  },
  {
    name: 'getCourseDetails',
    description: 'Get details about an existing course.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        courseId: {
          type: SchemaType.STRING,
          description: 'Course ID to retrieve'
        }
      },
      required: ['courseId']
    }
  },
  {
    name: 'getTeacherCourses',
    description: 'List all courses created by the current teacher.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
      required: []
    }
  },
  {
    name: 'getLesson',
    description: `Retrieve current lesson content before editing. ALWAYS call this first when teacher wants to modify a lesson.
    
Use this to:
- See current lesson structure
- Understand what needs changing
- Avoid overwriting unchanged content

Example: Teacher says "Fix the formatting in lesson 3" → First call getLesson to see current content.`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        courseId: {
          type: SchemaType.STRING,
          description: 'Course ID containing the lesson (20+ character Firestore ID)',
          pattern: '^[a-zA-Z0-9]{20,}$',
          minLength: 20
        },
        lessonId: {
          type: SchemaType.STRING,
          description: 'Lesson ID to retrieve (20+ character Firestore ID)',
          pattern: '^[a-zA-Z0-9]{20,}$',
          minLength: 20
        }
      },
      required: ['courseId', 'lessonId']
    }
  },
  {
    name: 'updateLesson',
    description: `Update an existing lesson. Use when teacher wants to modify lesson content, fix errors, or improve quality.
    
IMPORTANT RULES:
1. ALWAYS call getLesson first to see current content
2. Only send fields that are changing (partial updates)
3. Apply content formatting rules (proper Markdown, no escaped newlines)
4. Preserve lesson structure unless explicitly asked to change

Use cases:
- Fix formatting issues (escaped newlines, pipe tables)
- Add/remove examples
- Update quiz questions
- Change video URL
- Adjust difficulty level
- Translate content`,
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        courseId: {
          type: SchemaType.STRING,
          description: 'Course ID containing the lesson (20+ character Firestore ID)',
          pattern: '^[a-zA-Z0-9]{20,}$',
          minLength: 20
        },
        lessonId: {
          type: SchemaType.STRING,
          description: 'Lesson ID to update (20+ character Firestore ID)',
          pattern: '^[a-zA-Z0-9]{20,}$',
          minLength: 20
        },
        title: {
          type: SchemaType.STRING,
          description: 'New lesson title (optional - only if changing)',
          minLength: 5,
          maxLength: 100
        },
        description: {
          type: SchemaType.STRING,
          description: 'New lesson description (optional)'
        },
        content: {
          type: SchemaType.OBJECT,
          description: 'Updated lesson content. For reading lessons, use {text: "markdown content"}. For video lessons, use {videoUrl: "url"}.',
          properties: {
            text: {
              type: SchemaType.STRING,
              description: 'Reading lesson content (Markdown format, apply proper formatting rules)'
            },
            videoUrl: {
              type: SchemaType.STRING,
              description: 'Video URL (YouTube embed format: https://www.youtube.com/embed/VIDEO_ID)'
            },
            videoTitle: {
              type: SchemaType.STRING,
              description: 'Video title for attribution'
            },
            videoCreator: {
              type: SchemaType.STRING,
              description: 'Video creator/channel name'
            },
            sourceUrl: {
              type: SchemaType.STRING,
              description: 'Original watch URL for attribution'
            }
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
            },
            required: ['question', 'options', 'correctAnswer', 'explanation', 'points']
          }
        },
        passingScore: {
          type: SchemaType.NUMBER,
          description: 'Updated passing score for quiz lessons (optional, 0-100)'
        }
      },
      required: ['courseId', 'lessonId']
    }
  }
];

/**
 * Validate courseId format to prevent placeholder IDs
 * @param courseId - Course ID to validate
 * @returns Validation result with error message if invalid
 */
function validateCourseId(courseId: string): { valid: boolean; error?: string } {
  // Known invalid patterns
  const INVALID_PATTERNS = [
    'your_course_id',
    'course_id_here',
    'courseid',
    'course-id',
    'xxx',
    'placeholder',
    'temp',
    'test'
  ];
  
  const lowerCaseId = courseId.toLowerCase();
  
  // Check for placeholders
  if (INVALID_PATTERNS.some(pattern => lowerCaseId.includes(pattern))) {
    return {
      valid: false,
      error: `Invalid courseId "${courseId}". This appears to be a placeholder. Use the actual ID from createCourse response.`
    };
  }
  
  // Check length (Firestore IDs are 20-28 characters)
  if (courseId.length < 20) {
    return {
      valid: false,
      error: `Invalid courseId "${courseId}". Too short (must be 20+ characters). Did you use the actual ID from the API response?`
    };
  }
  
  // Check format (alphanumeric only)
  if (!/^[a-zA-Z0-9]+$/.test(courseId)) {
    return {
      valid: false,
      error: `Invalid courseId "${courseId}". Must contain only letters and numbers.`
    };
  }
  
  return { valid: true };
}

/**
 * PHASE 2: Verify lesson creation by checking Firestore
 * Prevents hallucination where AI claims success but lessons don't exist
 * 
 * @param results - Function call results from executeFunctionCalls
 * @param courseId - Course ID to verify lessons against
 * @param courseService - CourseService instance for Firestore queries
 * @returns Verified results with accurate success/failure status
 */
async function verifyLessonCreation(
  results: any[],
  courseId: string,
  courseService: CourseService,
  log: TraceLogFn = baseTraceLog
): Promise<any[]> {
  log('info', 'AI', 'Starting Firestore verification for lesson creation', {
    resultsCount: results.length,
    courseId
  });

  // Fetch current lessons from Firestore (ground truth)
  let firestoreLessons: any[] = [];
  try {
    const course = await courseService.getCourseById(courseId, true);
    firestoreLessons = course.lessons || [];
    
    log('info', 'AI', 'Fetched lessons from Firestore', {
      firestoreCount: firestoreLessons.length
    });
  } catch (error: any) {
    log('error', 'AI', 'Failed to fetch lessons for verification', {
      error: error.message
    });
    // If we can't verify, return original results with warning
    return results.map(r => ({
      ...r,
      verified: false,
      verificationError: 'Could not verify lesson creation due to Firestore read error'
    }));
  }

  // Verify each result
  const verifiedResults = results.map((result) => {
    // Only verify lesson creation calls
    if (result.name !== 'createLesson' && result.name !== 'createQuizLesson') {
      return { ...result, verified: true };
    }

    // If result already marked as failed, keep it failed
    if (!result.response.success) {
      return { ...result, verified: true };
    }

    // Check if lesson actually exists in Firestore
    const lessonId = result.response.data?.id;
    
    if (!lessonId) {
      log('error', 'AI', 'Lesson result missing ID - marking as failed', {
        functionName: result.name
      });
      
      return {
        ...result,
        response: {
          success: false,
          error: 'Lesson ID missing - creation may have failed',
          originalData: result.response.data
        },
        verified: true
      };
    }

    // Ground truth check: Does lesson exist in Firestore?
    const lessonExists = firestoreLessons.some(l => l.id === lessonId);
    
    if (!lessonExists) {
      log('error', 'AI', 'Hallucination detected: Lesson ID does not exist in Firestore', {
        lessonId,
        functionName: result.name,
        claimedTitle: result.response.data?.title
      });
      
      return {
        ...result,
        response: {
          success: false,
          error: `Lesson ${lessonId} not found in Firestore - creation failed or hallucinated`,
          originalData: result.response.data
        },
        verified: true,
        hallucination: true
      };
    }

    // Lesson exists - verify title matches
    const firestoreLesson = firestoreLessons.find(l => l.id === lessonId);
    const titleMatches = firestoreLesson?.title === result.response.data?.title;
    
    if (!titleMatches) {
      log('warn', 'AI', 'Lesson title mismatch between claim and Firestore', {
        lessonId,
        claimedTitle: result.response.data?.title,
        actualTitle: firestoreLesson?.title
      });
    }

    log('success', 'AI', 'Lesson verified in Firestore', {
      lessonId,
      title: firestoreLesson?.title,
      type: firestoreLesson?.type
    });

    return {
      ...result,
      verified: true,
      actualTitle: firestoreLesson?.title,
      actualType: firestoreLesson?.type
    };
  });

  // Log verification summary
  const totalVerified = verifiedResults.filter(r => r.verified).length;
  const totalSuccess = verifiedResults.filter(r => r.response.success).length;
  const totalHallucinations = verifiedResults.filter(r => r.hallucination).length;
  
  log('info', 'AI', 'Lesson verification complete', {
    totalResults: results.length,
    totalVerified,
    totalSuccess,
    totalFailed: results.length - totalSuccess,
    hallucinationsDetected: totalHallucinations,
    accuracyRate: `${Math.round((totalSuccess / results.length) * 100)}%`
  });

  return verifiedResults;
}

type ChatPayload = string | Array<Record<string, any>>;

interface SendChatOptions {
  timeoutMs: number;
  label: string;
  mode: string;
  retryAttempts?: number;
  backoffBaseMs?: number;
}

async function sendChatWithRetries(
  chat: any,
  payload: ChatPayload,
  options: SendChatOptions,
  retryTracker: Record<string, number>,
  log: TraceLogFn = baseTraceLog
): Promise<any> {
  const { timeoutMs, label, mode, retryAttempts, backoffBaseMs = 500 } = options;
  const maxAttempts = retryAttempts ?? (mode === 'building' ? 3 : 2);
  let attemptsUsed = 0;

  const result = await withExponentialBackoff(
    async (attempt) => {
      attemptsUsed = attempt;
      log('info', 'AI', 'Sending message to Gemini', {
        label,
        attempt
      });

      return withTimeout(
        chat.sendMessage(payload),
        timeoutMs,
        `${label} timeout after ${Math.round(timeoutMs / 1000)} seconds`
      );
    },
    {
      attempts: maxAttempts,
      baseDelayMs: backoffBaseMs,
      multiplier: 3,
      onAttemptError: ({ attempt, error }) => {
        log('warn', 'AI', 'Gemini response attempt failed', {
          label,
          attempt,
          error: error.message
        });
      }
    }
  );

  retryTracker[label] = attemptsUsed;
  return result;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * POST /api/ai/teacher-bot
 * Main chatbot endpoint
 */
export async function POST(req: NextRequest) {
  const spanId = traceLogger.startSpan('API', 'POST /api/ai/teacher-bot');
  const operationId = `teacher-bot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const operationMetadata = { operationId };
  const log = (
    level: Parameters<typeof traceLogger.log>[0],
    category: Parameters<typeof traceLogger.log>[1],
    message: string,
    metadata?: Record<string, unknown>
  ) => traceLogger.log(level, category, message, { ...operationMetadata, ...metadata });
  let spanStatus: 'success' | 'error' = 'success';
  let lastError: Error | null = null;
  const retryStats: Record<string, number> = {};
  let lastResponseDebug: ResponseDebugMetadata | null = null;

  try {
    log('info', 'AI', 'Teacher chatbot request received');

    // Get base URL from request for internal API calls
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // 1. Authenticate teacher
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authentication token', operationId },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyIdToken(token);

    // Verify teacher role
    if (decodedToken.role !== 'teacher') {
      log('warn', 'AI', 'Non-teacher attempted to access chatbot', { 
        userId: decodedToken.uid,
        role: decodedToken.role 
      });
      return NextResponse.json(
        { error: 'User does not have teacher role', operationId },
        { status: 403 }
      );
    }

    log('info', 'AI', 'Teacher authenticated', { 
      teacherId: decodedToken.uid,
      teacherName: decodedToken.name 
    });

    // 2. Parse request body
    const body = await req.json();
    const { message, conversationHistory = [], mode = 'planning' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string', operationId },
        { status: 400 }
      );
    }

    // Detect language of user's message
    const detectedLanguage = detectLanguage(message);
    const languageName = getLanguageName(detectedLanguage);
    
    // Check if user is requesting building actions in planning mode
    const isBuildingIntent = detectBuildingIntent(message);
    
    if (mode === 'planning' && isBuildingIntent) {
      // Suggest mode switch
      log('info', 'AI', 'Building intent detected in planning mode', {
        message: message.substring(0, 50)
      });
      
      return NextResponse.json({
        success: true,
        message: detectedLanguage === 'en' 
          ? "To create courses and lessons, you need to switch to Building Mode. Would you like to switch now?"
          : "Norint sukurti kursus ir pamokas, reikia perjungti į Kūrimo režimą. Ar norite perjungti dabar?",
        modeSwitchSuggested: true,
        modeSwitchReason: detectedLanguage === 'en'
          ? "Course and lesson creation requires Building Mode to execute functions."
          : "Kursų ir pamokų kūrimui reikalingas Kūrimo režimas funkcijoms vykdyti.",
        suggestedMode: 'building',
        detectedLanguage
      });
    }

    log('info', 'AI', 'Chatbot request parsed', {
      messageLength: message.length,
      historyLength: conversationHistory.length,
      mode,
      detectedLanguage
    });

    // 3. Initialize model with language-specific instruction
    const db = getAdminDb();
    const settingsDoc = await db.collection('system_settings').doc('global').get();
    let dynamicModel = 'gemini-2.0-flash';
    let dynamicApiKey = '';

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      dynamicModel = data?.aiModel || 'gemini-2.0-flash';
      // MIGRATION: Auto-upgrade old models
      if (dynamicModel?.includes('gemini-1.5')) {
        dynamicModel = 'gemini-2.0-flash';
      }
      dynamicApiKey = data?.geminiApiKey || '';
    }

    // Initialize requestAI with dynamic API key if configured
    const requestAI = dynamicApiKey 
      ? getAI(app, { backend: new GoogleAIBackend({ apiKey: dynamicApiKey }) })
      : ai;

    const modelName = getModelName(dynamicModel);
    const captureResponseDebug = (label: string, resp: any) => {
      if (!resp) return;
      const textValue = resp.text?.() || '';
      const functionCalls = resp.functionCalls?.() || [];
      const usage = resp.usageMetadata;
      lastResponseDebug = {
        label,
        textLength: textValue.length,
        functionCallCount: functionCalls.length,
        blockReason: resp.promptFeedback?.blockReason || null,
        safetyRatings: resp.promptFeedback?.safetyRatings || resp.safetyRatings,
        usage: usage
          ? {
              inputTokens: usage.promptTokenCount || 0,
              outputTokens: usage.candidatesTokenCount || 0,
              cachedTokens: usage.cachedContentTokenCount || 0,
              model: modelName
            }
          : undefined
      };
    };
    
    // Add language enforcement to system prompt
    const languageInstruction = `\n\n## ⚠️ CRITICAL: RESPONSE LANGUAGE REQUIREMENT\nYou MUST respond in ${languageName}. The user is writing in ${languageName}, so ALL your responses must also be in ${languageName}. Do not switch languages mid-conversation. This is a strict requirement that overrides all other instructions.

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
\`\`\`

**When to Use:**
- ✅ Calculations with >3 steps
- ✅ Sorting/filtering large datasets
- ✅ Statistical analysis
- ❌ Simple arithmetic (2+2)
- ❌ String manipulation`;
    
    const model = getGenerativeModel(requestAI, {
      model: modelName,
      // CRITICAL FIX: Completely separate configs for planning vs building
      // Planning mode: Structured JSON output (no functions)
      // Building mode: Function calling ONLY (no JSON schema)
      generationConfig: mode === 'planning' 
        ? getStructuredOutputConfig() 
        : {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096
            // NO responseMimeType or responseSchema - conflicts with function calling
          },
      // PHASE 3: Force function-only mode in building mode
      // This tells Gemini to prefer using functions when appropriate (prevents code output)
      // Note: Using 'AUTO' instead of 'ANY' to allow conversational responses when no function is needed
      ...(mode === 'building' && {
        toolConfig: {
          functionCallingConfig: {
            mode: 'AUTO' as const  // Auto-detect when to use functions (more flexible than 'ANY')
          }
        }
      }),
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ],
      systemInstruction: SYSTEM_PROMPT + languageInstruction,
      tools: mode === 'building' 
        ? [{ functionDeclarations }] 
        : undefined
    });

    log('info', 'AI', 'Model initialized', { 
      model: modelName,
      mode,
      functionsEnabled: mode === 'building'
    });

    // 4. Create chat with history
    const chat = model.startChat({
      history: conversationHistory.map((msg: any) => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      }))
    });

    // 5. Send message with timeout + retry safety net
    const initialTimeout = mode === 'building' ? 90000 : 60000;
    const initialResult = await sendChatWithRetries(
      chat,
      message,
      {
        timeoutMs: initialTimeout,
        label: 'initial-response',
        mode
      },
      retryStats,
      log
    );

    let response = initialResult.response;
    captureResponseDebug('initial-response', response);

    // Validate response before processing
    if (!response) {
      throw new Error('AI returned empty response');
    }

    // Check if response is blocked or empty
    let initialText = response.text?.() || '';
    let initialFunctions = response.functionCalls?.() || [];
    
    if (!initialText && initialFunctions.length === 0) {
  log('error', 'AI', 'AI returned empty response (no text, no function calls)');
      throw new Error('AI returned empty response. This may be due to safety filters or model configuration issues.');
    }

    // CRITICAL: Detect if AI outputted code instead of calling functions
    // This prevents hallucination where AI invents fake lesson IDs and success messages
    if (mode === 'building' && initialText && initialFunctions.length === 0) {
      // Check for code patterns that indicate AI is showing code, not executing
      const codePatterns = [
        'console.log(',
        'print(',
        'createLesson(',
        'createQuizLesson(',
        'createCourse(',
        'default_api.',
        'tool_code',
        '=>', // Arrow functions
        'function ',
        'const ',
        'let ',
        'var '
      ];
      
      const hasCodePattern = codePatterns.some(pattern => initialText.includes(pattern));
      
      if (hasCodePattern) {
        const detectedPatterns = codePatterns.filter(p => initialText.includes(p));
        log('warn', 'AI', 'AI hallucination detected: Outputted code instead of calling functions', {
          textSnippet: initialText.substring(0, 200),
          detectedPatterns
        });

        try {
          const rePromptResult = await sendChatWithRetries(
            chat,
            'You just responded with code instead of calling the provided functions. Immediately call the appropriate functions (createCourse, createLesson, createQuizLesson, getLesson, updateLesson) with correct Firestore IDs. If you absolutely cannot call a function, reply with a one sentence explanation. NEVER output code.',
            {
              timeoutMs: 60000,
              label: 'code-reprompt',
              mode,
              retryAttempts: 2
            },
            retryStats,
            log
          );

          response = rePromptResult.response;
          captureResponseDebug('code-reprompt', response);
          initialText = response.text?.() || '';
          initialFunctions = response.functionCalls?.() || [];
        } catch (rePromptError) {
          log('error', 'AI', 'Re-prompt after code hallucination failed', {
            error: rePromptError instanceof Error ? rePromptError.message : 'Unknown error'
          });

          throw new Error(
            'AI error: The AI assistant attempted to show code instead of executing functions and failed to recover after a re-prompt. Please try again in smaller steps.'
          );
        }

        const stillHasCode = codePatterns.some(pattern => initialText.includes(pattern));
        if (stillHasCode && initialFunctions.length === 0) {
          throw new Error(
            'AI error: Even after a re-prompt the AI refused to call functions. Please try a smaller batch or rephrase your instructions.'
          );
        }
      }
    }

    log('info', 'AI', 'Model response received', {
      hasText: !!initialText,
      textLength: initialText.length,
      hasFunctionCalls: initialFunctions.length > 0,
      functionCount: initialFunctions.length
    });

    // Extract and log token usage (Phase 3: Token Tracking)
    const usageMetadata = response.usageMetadata;
    if (usageMetadata) {
      const sessionId = `session_${decodedToken.uid}_${Date.now()}`;
      
      // Log token usage (non-blocking)
      tokenTrackerService.logUsage(decodedToken.uid, {
        sessionId,
        inputTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        cachedTokens: usageMetadata.cachedContentTokenCount || 0,
        model: modelName,
        operation: response.functionCalls()?.length > 0 ? 'course_creation' : 'chat',
        metadata: {
          cacheHit: (usageMetadata.cachedContentTokenCount || 0) > 0,
          functionCallCount: response.functionCalls()?.length || 0
        }
      }).catch(error => {
        // Log error but don't fail the request
        log('warn', 'API', 'Token tracking failed (non-critical)', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });

      log('info', 'API', 'Token usage', {
        inputTokens: usageMetadata.promptTokenCount,
        outputTokens: usageMetadata.candidatesTokenCount,
        cachedTokens: usageMetadata.cachedContentTokenCount || 0,
        cacheHit: (usageMetadata.cachedContentTokenCount || 0) > 0
      });
    }

    // 6. Handle function calls (if any)
    const functionCalls = response.functionCalls();
    if (functionCalls && functionCalls.length > 0) {
      log('info', 'AI', 'Processing function calls', {
        functions: functionCalls.map((fc: any) => fc.name)
      });

      // Check if AI is trying to create lessons without a course ID
      const hasLessonCreation = functionCalls.some((fc: any) => 
        fc.name === 'createLesson' || fc.name === 'createQuizLesson'
      );
      const hasCourseCreation = functionCalls.some((fc: any) => fc.name === 'createCourse');
      
      if (hasLessonCreation && hasCourseCreation) {
        // AI is trying to create course + lessons in same response
        // Filter to only create the course first
  log('warn', 'AI', 'AI attempted to create course and lessons in same response - filtering to course only');
        const courseOnlyCall = functionCalls.filter((fc: any) => fc.name === 'createCourse');
        
        const courseResults = await executeFunctionCalls(
          courseOnlyCall,
          decodedToken.uid,
          decodedToken.name || 'Unknown Teacher',
          token,
          baseUrl,
          log
        );

        // Send course creation result back and ask AI to continue with lessons
  log('info', 'AI', 'Course created, prompting AI to create lessons');

        let secondResult;
        try {
          secondResult = await sendChatWithRetries(
            chat,
            [
              {
                functionResponse: {
                  name: courseResults[0].name,
                  response: courseResults[0].response
                }
              },
              {
                text: "The course has been created successfully. Now create all the lessons using the course ID from the response above. Call createLesson or createQuizLesson for each lesson."
              }
            ],
            {
              timeoutMs: 120000,
              label: 'lesson-phase',
              mode,
              retryAttempts: 3
            },
            retryStats,
            log
          );
          captureResponseDebug('lesson-phase', secondResult.response);
        } catch (timeoutError) {
          // AI timed out or failed after retries, return course creation result
          log('error', 'AI', 'AI lesson phase failed after retries', {
            error: timeoutError instanceof Error ? timeoutError.message : timeoutError
          });
          const courseSummary = summarizeFunctionResults(courseResults);
          return NextResponse.json({
            success: true,
            message: `Course "${courseResults[0].response.data.title}" created successfully with ID: ${courseResults[0].response.data.id}. However, lesson creation timed out. Please try creating lessons manually or use the chatbot again.`,
            functionCalls: courseResults,
            functionSummary: courseSummary,
            conversationHistory: await chat.getHistory(),
            tokenUsage: usageMetadata ? {
              inputTokens: usageMetadata.promptTokenCount || 0,
              outputTokens: usageMetadata.candidatesTokenCount || 0,
              cachedTokens: usageMetadata.cachedContentTokenCount || 0,
              model: modelName
            } : undefined
          });
        }
        
        // Check if AI made function calls for lessons
        const secondFunctionCalls = secondResult.response.functionCalls();
        const secondResponseText = secondResult.response.text?.() || '';
        
        // CRITICAL: Detect hallucination in second response (lesson creation phase)
        if (!secondFunctionCalls || secondFunctionCalls.length === 0) {
          const codePatterns = [
            'console.log(',
            'print(',
            'createLesson(',
            'createQuizLesson(',
            'default_api.',
            'tool_code'
          ];
          
          const hasCodePattern = codePatterns.some(pattern => secondResponseText.includes(pattern));
          
          if (hasCodePattern) {
            log('error', 'AI', 'AI hallucination in lesson creation: Outputted code instead of calling functions', {
              textSnippet: secondResponseText.substring(0, 200)
            });
            const courseSummary = summarizeFunctionResults(courseResults);
            
            return NextResponse.json({
              success: false,
              error: 'AI error: Failed to create lessons. The AI attempted to show code instead of executing functions.',
              message: `Course "${courseResults[0].response.data.title}" created successfully with ID: ${courseResults[0].response.data.id}. However, lesson creation failed. Please try creating lessons using the chatbot again with a clearer prompt.`,
              functionCalls: courseResults,
              functionSummary: courseSummary,
              operationId,
              conversationHistory: await chat.getHistory()
            }, { status: 500 });
          }
        }
        
        if (secondFunctionCalls && secondFunctionCalls.length > 0) {
          log('info', 'AI', `AI returned ${secondFunctionCalls.length} lesson creation calls`);
          
          // Execute lesson creation functions
          const lessonResults = await executeFunctionCalls(
            secondFunctionCalls,
            decodedToken.uid,
            decodedToken.name || 'Unknown Teacher',
            token,
            baseUrl,
            log
          );

          // PHASE 2: Verify lessons actually exist in Firestore (ground truth validation)
          const courseServiceForVerification = new CourseService();
          const verifiedResults = await verifyLessonCreation(
            lessonResults,
            courseResults[0].response.data.id,
            courseServiceForVerification,
            log
          );
          const combinedResults = [...courseResults, ...verifiedResults];
          const functionSummary = summarizeFunctionResults(combinedResults);

          // Try to get final summary from AI, but don't fail if it times out
          let finalMessage = '';
          try {
            const finalResult = await sendChatWithRetries(
              chat,
              combinedResults.map((fr: any) => ({
                functionResponse: {
                  name: fr.name,
                  response: fr.response
                }
              })),
              {
                timeoutMs: 45000,
                label: 'final-summary-lessons',
                mode,
                retryAttempts: 2
              },
              retryStats,
              log
            );
            captureResponseDebug('final-summary-lessons', finalResult.response);
            finalMessage = finalResult.response.text();
          } catch (finalError) {
            log('warn', 'AI', 'AI final summary timed out, generating default message');
            const courseTitle = courseResults[0]?.response?.data?.title;
            const summaryText = formatFunctionSummary(functionSummary);
            finalMessage = courseTitle
              ? `Course "${courseTitle}" automation summary: ${summaryText}`
              : `Course automation summary: ${summaryText}`;
          }

          return NextResponse.json({
            success: true,
            message: finalMessage,
            functionCalls: combinedResults,
            functionSummary,
            conversationHistory: await chat.getHistory(),
            detectedLanguage
          });
        } else {
          // AI didn't return function calls, just return text response
          log('warn', 'AI', 'AI did not return lesson creation function calls');
          const courseSummary = summarizeFunctionResults(courseResults);
          return NextResponse.json({
            success: true,
            message: secondResult.response.text(),
            functionCalls: courseResults,
            functionSummary: courseSummary,
            conversationHistory: await chat.getHistory(),
            detectedLanguage,
            tokenUsage: usageMetadata ? {
              inputTokens: usageMetadata.promptTokenCount || 0,
              outputTokens: usageMetadata.candidatesTokenCount || 0,
              cachedTokens: usageMetadata.cachedContentTokenCount || 0,
              model: modelName
            } : undefined
          });
        }
      }

      // Normal execution - no course+lesson conflict
      const functionResults = await executeFunctionCalls(
        functionCalls,
        decodedToken.uid,
        decodedToken.name || 'Unknown Teacher',
        token,
        baseUrl,
        log
      );

      // PHASE 2: Verify lesson creation if lessons were created
      let verifiedFunctionResults = functionResults;
      const hasLessonCreationInNormalFlow = functionResults.some((fr: any) => 
        fr.name === 'createLesson' || fr.name === 'createQuizLesson'
      );
      
      if (hasLessonCreationInNormalFlow) {
        // Find course ID from function calls
        const courseCreationResult = functionResults.find((fr: any) => fr.name === 'createCourse');
        const courseId = courseCreationResult?.response?.data?.id;
        
        if (courseId) {
          log('info', 'AI', 'Verifying lesson creation in normal flow', { courseId });
          const courseServiceForVerification = new CourseService();
          verifiedFunctionResults = await verifyLessonCreation(
            functionResults,
            courseId,
            courseServiceForVerification,
            log
          );
        } else {
          log('warn', 'AI', 'Could not verify lessons: course ID not found in results');
        }
      }

      const functionSummary = summarizeFunctionResults(verifiedFunctionResults);
      let finalMessage: string;

      try {
        const finalResult = await sendChatWithRetries(
          chat,
          verifiedFunctionResults.map((fr: any) => ({
            functionResponse: {
              name: fr.name,
              response: fr.response
            }
          })),
          {
            timeoutMs: mode === 'building' ? 90000 : 60000,
            label: 'final-summary',
            mode,
            retryAttempts: mode === 'building' ? 3 : 2
          },
          retryStats,
          log
        );
        captureResponseDebug('final-summary', finalResult.response);
        finalMessage = finalResult.response.text();
      } catch (finalError) {
        log('warn', 'AI', 'AI final summary failed in normal flow, using fallback', {
          error: finalError instanceof Error ? finalError.message : 'Unknown error'
        });
        finalMessage = formatFunctionSummary(functionSummary);
      }

      // Send function results back to model with timeout
      return NextResponse.json({
        success: true,
        message: finalMessage,
        functionCalls: verifiedFunctionResults,
        functionSummary,
        conversationHistory: await chat.getHistory(),
        detectedLanguage,
        tokenUsage: usageMetadata ? {
          inputTokens: usageMetadata.promptTokenCount || 0,
          outputTokens: usageMetadata.candidatesTokenCount || 0,
          cachedTokens: usageMetadata.cachedContentTokenCount || 0,
          model: modelName
        } : undefined
      });
    }

    // 7. Return natural language response (most common case)
    let responseText = response.text();
    
    // If in planning mode with structured output, parse JSON response
    if (mode === 'planning') {
      try {
        const parsed = JSON.parse(responseText);
        if (parsed.content) {
          responseText = parsed.content;
        }
      } catch {
        // Not JSON or invalid format, use as-is
      }
    }
    
    return NextResponse.json({
      success: true,
      message: responseText,
      conversationHistory: await chat.getHistory(),
      detectedLanguage,
      tokenUsage: usageMetadata ? {
        inputTokens: usageMetadata.promptTokenCount || 0,
        outputTokens: usageMetadata.candidatesTokenCount || 0,
        cachedTokens: usageMetadata.cachedContentTokenCount || 0,
        model: modelName
      } : undefined
    });

  } catch (error: any) {
    spanStatus = 'error';
    lastError = error instanceof Error ? error : new Error('Unknown error');

    log('error', 'AI', 'Teacher chatbot error', {
      error: lastError.message,
      stack: lastError.stack,
      retryMetrics: retryStats,
      lastResponse: lastResponseDebug
    });

    const includeDebug = process.env.NODE_ENV !== 'production';
    const responseBody: Record<string, any> = {
      error: 'AI service temporarily unavailable',
      operationId
    };

    if (includeDebug) {
      responseBody.details = lastError.message;
      responseBody.debug = {
        retryMetrics: retryStats,
        lastResponse: lastResponseDebug
      };
    }

    return NextResponse.json(responseBody, { status: 500 });
  } finally {
    traceLogger.endSpan(
      spanId,
      spanStatus,
      spanStatus === 'error' && lastError
        ? { message: lastError.message, stack: lastError.stack }
        : undefined
    );
  }
}

/**
 * Execute function calls by calling internal APIs
 * Optimized for batch operations with parallel execution where safe
 */
async function executeFunctionCalls(
  functionCalls: any[],
  teacherId: string,
  teacherName: string,
  authToken: string,
  baseUrl: string,
  log: TraceLogFn = baseTraceLog
): Promise<any[]> {
  const results = [];
  
  // Separate course creation from lesson creation
  const courseCreations = functionCalls.filter(fc => fc.name === 'createCourse');
  const lessonCreations = functionCalls.filter(fc => 
    fc.name === 'createLesson' || fc.name === 'createQuizLesson'
  );
  const otherCalls = functionCalls.filter(fc => 
    fc.name !== 'createCourse' && 
    fc.name !== 'createLesson' && 
    fc.name !== 'createQuizLesson'
  );

  // Initialize CourseService
  const courseService = new CourseService();

  /**
   * Clean AI-generated lesson content
   * Fixes common formatting issues like escaped newlines and pipe tables
   */
  function cleanLessonContent(content: string): string {
    if (!content) return content;
    
    // Fix 1: Convert escaped newlines to actual breaks
    content = content.replace(/\\n\\n/g, '\n\n');
    content = content.replace(/\\n/g, '\n');
    
    // Fix 2: Convert pipe tables to Markdown lists
    // Pattern: | English | Lithuanian | Pronunciation |
    const pipeTableRegex = /\|([^|]+)\|([^|]+)\|([^|]+)\|/g;
    content = content.replace(pipeTableRegex, (match, col1, col2, col3) => {
      const term1 = col1.trim();
      const term2 = col2.trim();
      const term3 = col3.trim();
      
      // Skip header rows
      if (term1.includes('--') || term2.includes('--') || term3.includes('--')) {
        return '';
      }
      
      // Convert to Markdown list format
      return `* **${term2}** *(${term3})* - ${term1}`;
    });
    
    // Fix 3: Clean up extra spaces/newlines
    content = content.replace(/\s{3,}/g, '\n\n');
    content = content.replace(/\n{4,}/g, '\n\n\n');
    
    // Fix 4: Remove empty pipe rows (|||| or |---|)
    content = content.replace(/\|[\s\-|]+\|/g, '');
    
    return content.trim();
  }

  // Execute course creations first (must be sequential)
  for (const fc of courseCreations) {
    try {
  log('info', 'AI', `Executing function: ${fc.name}`, { args: fc.args });

      const courseData = {
        ...fc.args,
        teacherId,
        teacherName
      };

      // Call CourseService directly (no HTTP, avoids Cloud Run auth issues)
      const course = await courseService.createCourse(courseData);

      results.push({
        name: fc.name,
        response: {
          success: true,
          data: {
            id: course.id,
            title: course.title,
            description: course.description,
            language: course.language,
            targetLanguage: course.targetLanguage,
            level: course.level,
            createdAt: course.createdAt
          }
        }
      });

      log('info', 'AI', `Function ${fc.name} completed`, { 
        success: true,
        courseId: course.id
      });

    } catch (error: any) {
      log('error', 'AI', `Function ${fc.name} failed`, { 
        error: error.message 
      });

      results.push({
        name: fc.name,
        response: {
          success: false,
          error: error.message
        }
      });
    }
  }

  // Filter out lessons with placeholder course IDs
  const validLessonCreations = lessonCreations.filter(fc => {
    const courseId = fc.args.courseId;
    const validation = validateCourseId(courseId);
    
    if (!validation.valid) {
      log('error', 'AI', validation.error!, { 
        functionName: fc.name,
        lessonTitle: fc.args.title 
      });
      
      results.push({
        name: fc.name,
        response: {
          success: false,
          error: validation.error
        }
      });
      return false;
    }
    return true;
  });

  // Execute lesson creations in parallel batches (max 2 at a time to avoid Firestore write conflicts)
  // Reduced from 3 to 2 to prevent order increment race conditions
  const batchSize = 2;
  for (let i = 0; i < validLessonCreations.length; i += batchSize) {
    const batch = validLessonCreations.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (fc) => {
        try {
          log('info', 'AI', `Executing function: ${fc.name}`, { args: fc.args });

          // Get existing lesson count to determine order
          const existingLessons = await courseService.getCourseLessons(fc.args.courseId, false);
          const nextOrder = existingLessons.length + 1;

          let lessonData: any;

          if (fc.name === 'createQuizLesson') {
            lessonData = {
              title: fc.args.title,
              description: fc.args.description || `Quiz: ${fc.args.title}`,
              type: 'quiz' as const,
              duration: fc.args.duration,
              order: fc.args.order || nextOrder,
              content: {
                quizQuestions: fc.args.questions,
                passingScore: fc.args.passingScore
              }
            };
          } else {
            // Clean reading lesson content if present
            const cleanedArgs = { ...fc.args };
            if (fc.args.content && typeof fc.args.content === 'string') {
              cleanedArgs.content = cleanLessonContent(fc.args.content);
              log('info', 'AI', 'Cleaned lesson content', {
                lessonTitle: fc.args.title,
                originalLength: fc.args.content.length,
                cleanedLength: cleanedArgs.content.length
              });
            }
            
            lessonData = {
              ...cleanedArgs,
              description: fc.args.description || `Lesson: ${fc.args.title}`,
              order: fc.args.order || nextOrder
            };
          }

          // Call CourseService directly (no HTTP, avoids Cloud Run auth issues)
          const lesson = await courseService.addLesson(fc.args.courseId, teacherId, lessonData);

          log('info', 'AI', `Function ${fc.name} completed`, { 
            success: true,
            lessonId: lesson.id
          });

          return {
            name: fc.name,
            response: {
              success: true,
              data: {
                id: lesson.id,
                title: lesson.title,
                type: lesson.type,
                order: lesson.order,
                createdAt: lesson.createdAt
              }
            }
          };

        } catch (error: any) {
          log('error', 'AI', `Function ${fc.name} failed`, { 
            error: error.message 
          });

          return {
            name: fc.name,
            response: {
              success: false,
              error: error.message
            }
          };
        }
      })
    );

    // Add batch results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          name: 'unknown',
          response: {
            success: false,
            error: result.reason?.message || 'Unknown error'
          }
        });
      }
    }
  }

  // Execute other function calls
  for (const fc of otherCalls) {
    try {
  log('info', 'AI', `Executing function: ${fc.name}`, { args: fc.args });

      let data: any;

      switch (fc.name) {
        case 'getCourseDetails':
          const course = await courseService.getCourseById(fc.args.courseId);
          if (!course) {
            throw new Error('Course not found');
          }
          data = course;
          break;

        case 'getTeacherCourses':
          const courses = await courseService.getTeacherCourses(teacherId);
          data = { courses, count: courses.length };
          break;

        case 'getLesson':
          // EDITING MODE: Retrieve current lesson content
          const lessonCourse = await courseService.getCourseById(fc.args.courseId, true);
          const lesson = lessonCourse.lessons?.find(l => l.id === fc.args.lessonId);
          
          if (!lesson) {
            throw new Error('Lesson not found');
          }
          
          // Verify teacher owns this course
          if (lessonCourse.teacherId !== teacherId) {
            throw new Error('Unauthorized: You can only view lessons from your own courses');
          }
          
          data = lesson;
          log('info', 'AI', 'Lesson retrieved for editing', {
            lessonId: fc.args.lessonId,
            title: lesson.title,
            type: lesson.type
          });
          break;

        case 'updateLesson':
          // EDITING MODE: Update existing lesson
          const updateData = { ...fc.args };
          delete updateData.courseId;
          delete updateData.lessonId;
          
          // Clean content if present (apply formatting rules)
          if (updateData.content?.text) {
            const originalLength = updateData.content.text.length;
            updateData.content.text = cleanLessonContent(updateData.content.text);
            log('info', 'AI', 'Cleaned updated lesson content', {
              originalLength,
              cleanedLength: updateData.content.text.length
            });
          }
          
          // Update lesson (ownership check happens in service)
          const updatedLesson = await courseService.updateLesson(
            fc.args.courseId,
            fc.args.lessonId,
            teacherId,
            updateData
          );
          
          data = updatedLesson;
          log('success', 'AI', 'Lesson updated successfully', {
            lessonId: fc.args.lessonId,
            title: updatedLesson.title,
            fieldsUpdated: Object.keys(updateData)
          });
          break;

        default:
          throw new Error(`Unknown function: ${fc.name}`);
      }

      results.push({
        name: fc.name,
        response: {
          success: true,
          data
        }
      });

      log('info', 'AI', `Function ${fc.name} completed`, { 
        success: true 
      });

    } catch (error: any) {
      log('error', 'AI', `Function ${fc.name} failed`, { 
        error: error.message 
      });

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
