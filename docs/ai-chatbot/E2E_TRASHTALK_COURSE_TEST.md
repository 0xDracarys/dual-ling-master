# E2E Testing: Complete Trashtalk Course Creation

**Test Objective:** Create a full English → Lithuanian "Trashtalk & Banter" course to test all AI chatbot features end-to-end.

**Test Date:** November 21, 2025  
**Course Type:** Beginner-friendly trash talk phrases (sports, gaming, friendly banter)  
**Target:** 8 lessons (mix of reading, video, quiz)  
**Testing Tool:** Playwright MCP  
**Duration:** 45-60 minutes

---

## 🎯 Test Coverage

This single course will test:

### ✅ Core Features (All 3 Phases)
- **Phase 1:** Code pattern detection (prevent console.log output)
- **Phase 2:** Firestore verification (detect hallucinations)
- **Phase 3:** AUTO function calling mode (correct behavior enforcement)

### ✅ Function Calls
- `createCourse()` - Course creation with metadata
- `createLesson()` - Reading lessons (proper Markdown formatting)
- `createQuizLesson()` - Quiz with multiple-choice questions
- `getCourseDetails()` - Retrieve course info
- `getLesson()` - Retrieve lesson content
- `updateLesson()` - Edit existing lessons

### ✅ Content Quality
- Markdown formatting (headers, lists, bold/italic)
- No escaped newlines (`\n\n` → actual breaks)
- No pipe tables (convert to bullet lists)
- YouTube video embed URLs (not watch URLs)
- Quiz question quality (4 options, explanations)

### ✅ Error Handling
- Invalid course IDs (placeholder detection)
- Mixed success/failure scenarios
- Firestore verification accuracy
- User-friendly error messages

---

## 📋 Course Specification

### Course Details
```yaml
Title: "Lithuanian Trashtalk & Friendly Banter"
Description: "Learn how to banter with Lithuanian friends in sports, gaming, and casual conversations. Beginner-friendly phrases for playful teasing and comebacks."
Language: en (English instruction)
Target Language: lt (Learning Lithuanian)
Level: beginner
Estimated Hours: 4 hours
Lessons: 8 total
  - 4 Reading lessons (Markdown content)
  - 2 Video lessons (YouTube embeds)
  - 2 Quiz lessons (comprehension checks)
```

### Lesson Breakdown

**Lesson 1: Introduction to Lithuanian Banter (Reading, 30 min)**
- What is trashtalk vs. friendly banter
- Cultural context: When it's appropriate
- Basic Lithuanian pronunciation for banter phrases
- Key vocabulary: 5-7 beginner phrases

**Lesson 2: Sports Trashtalk Basics (Reading, 35 min)**
- Common phrases for basketball (Lithuania's favorite sport)
- Soccer/football banter
- Gym and fitness jokes
- Vocabulary with pronunciation guides

**Lesson 3: Gaming & Online Banter (Video, 15 min)**
- YouTube video on Lithuanian gaming slang
- Proper embed URL format test
- Video attribution (title, creator, source URL)

**Lesson 4: Sports Trashtalk Quiz (Quiz, 10 min)**
- 5 questions on Lesson 1-2 content
- 4 options each, 1 correct
- Explanations for learning
- Passing score: 70%

**Lesson 5: Classic Lithuanian Comebacks (Reading, 40 min)**
- Traditional sayings adapted for banter
- Modern slang variations
- When to use vs. avoid
- Example conversations

**Lesson 6: Friendly Insults & Jokes (Reading, 35 min)**
- Playful insults between friends
- Self-deprecating humor
- How to laugh it off in Lithuanian
- Cultural do's and don'ts

**Lesson 7: Real Conversations Video (Video, 20 min)**
- YouTube video of native speakers bantering
- Test embed URL conversion (if watch URL provided)
- Video metadata for attribution

**Lesson 8: Final Trashtalk Challenge (Quiz, 15 min)**
- 7 questions covering all lessons
- Mixed difficulty (beginner-friendly)
- Real-world scenario questions
- Passing score: 70%

---

## 🧪 Test Script (Playwright MCP)

### Phase 1: Setup & Authentication

```bash
# 1. Start Playwright browser
browser_navigate(url="http://localhost:3000")

# 2. Login as teacher
# (Assumes test account: teacher@test.com / password123)
browser_click(element="Login button", ref="[login-btn]")
browser_type(element="Email input", ref="[email-input]", text="teacher@test.com")
browser_type(element="Password input", ref="[password-input]", text="password123")
browser_click(element="Submit login", ref="[submit-btn]")

# 3. Wait for dashboard
browser_wait_for(text="Teacher Dashboard")

# 4. Navigate to AI Assistant
browser_click(element="AI Assistant link", ref="[ai-assistant-nav]")
browser_wait_for(text="TeacherBot")
```

### Phase 2: Course Creation (Test Phase 1 & 3)

```bash
# 5. Switch to Building Mode
browser_click(element="Building Mode toggle", ref="[mode-toggle]")
browser_wait_for(text="Building Mode Active")

# 6. Create course structure
browser_type(
  element="Chat input", 
  ref="[chat-input]", 
  text="Create a course titled 'Lithuanian Trashtalk & Friendly Banter' for English speakers learning Lithuanian. Beginner level, 4 hours estimated. Description: Learn how to banter with Lithuanian friends in sports, gaming, and casual conversations. Beginner-friendly phrases for playful teasing and comebacks.",
  submit=true
)

# 7. Wait for AI response + function execution
browser_wait_for(text="Course created successfully")

# 8. VERIFY: Check for course ID in response (not placeholder)
# Expected: Real Firestore ID (20+ chars, alphanumeric)
# Invalid: "your_course_id", "COURSE_ID_HERE", etc.

# 9. VERIFY: No code output detected
# Should NOT see: console.log(, print(, createCourse(, etc.
# If seen → Phase 1 FAILED

# 10. Take screenshot for evidence
browser_take_screenshot(filename="01_course_created.png")
```

### Phase 3: Lesson 1 - Reading (Test Markdown Formatting)

```bash
# 11. Create Lesson 1 (Reading)
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Create Lesson 1: 'Introduction to Lithuanian Banter' (Reading, 30 min). Content should cover: what is trashtalk vs banter, cultural context when appropriate, basic pronunciation tips, and 5-7 beginner phrases with pronunciation guides. Use proper Markdown formatting with headers, bullet lists, and bold text for Lithuanian words.",
  submit=true
)

# 12. Wait for completion
browser_wait_for(text="Lesson created")

# 13. VERIFY: Content formatting
# - Should have ## headers (not escaped)
# - Should have * bullet lists (not pipe tables)
# - Should have **Bold** for vocabulary
# - Should NOT have \n\n or \\n (escaped newlines)

# 14. Navigate to course page to verify
browser_click(element="View course button", ref="[view-course-btn]")
browser_wait_for(text="Introduction to Lithuanian Banter")

# 15. Open lesson to check content
browser_click(element="Lesson 1 card", ref="[lesson-1-card]")
browser_wait_for(text="Introduction to Lithuanian Banter")

# 16. Take screenshot of formatted content
browser_take_screenshot(filename="02_lesson1_content.png")

# 17. Go back to AI Assistant
browser_navigate_back()
browser_click(element="AI Assistant link", ref="[ai-assistant-nav]")
```

### Phase 4: Lesson 2 - Reading (Test More Content)

```bash
# 18. Create Lesson 2
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Create Lesson 2: 'Sports Trashtalk Basics' (Reading, 35 min). Include basketball phrases (Lithuania's favorite sport), soccer banter, gym jokes, and vocabulary with pronunciation. Use proper Markdown with sections for each sport.",
  submit=true
)

# 19. Wait and verify
browser_wait_for(text="Lesson created")
browser_take_screenshot(filename="03_lesson2_created.png")
```

### Phase 5: Lesson 3 - Video (Test Embed URL)

```bash
# 20. Create Lesson 3 (Video with test URL conversion)
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Create Lesson 3: 'Gaming & Online Banter' (Video, 15 min). Use this video: https://www.youtube.com/watch?v=dQw4w9WgXcQ (convert to embed format). Video title: 'Lithuanian Gaming Slang Tutorial', Creator: 'Baltic Gamer', Source URL: same as above.",
  submit=true
)

# 21. Wait for completion
browser_wait_for(text="Lesson created")

# 22. VERIFY: URL conversion
# Expected: https://www.youtube.com/embed/dQw4w9WgXcQ
# NOT: https://www.youtube.com/watch?v=dQw4w9WgXcQ

# 23. Navigate to lesson to check video player
browser_click(element="View course button", ref="[view-course-btn]")
browser_click(element="Lesson 3 card", ref="[lesson-3-card]")
browser_wait_for(text="Gaming & Online Banter")

# 24. VERIFY: Video player loads
browser_wait_for(element="iframe[src*='youtube.com/embed']")
browser_take_screenshot(filename="04_lesson3_video.png")

# 25. Return to AI Assistant
browser_navigate_back()
browser_navigate_back()
browser_click(element="AI Assistant link", ref="[ai-assistant-nav]")
```

### Phase 6: Lesson 4 - Quiz (Test Question Generation)

```bash
# 26. Create Lesson 4 (Quiz)
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Create Lesson 4: 'Sports Trashtalk Quiz' (Quiz, 10 min). 5 questions covering Lesson 1 and 2 content. 4 options each, clear explanations for correct answers. Passing score 70%. Make questions beginner-friendly.",
  submit=true
)

# 27. Wait for completion
browser_wait_for(text="Quiz created")
browser_take_screenshot(filename="05_lesson4_quiz_created.png")

# 28. Navigate to quiz to verify structure
browser_click(element="View course button", ref="[view-course-btn]")
browser_click(element="Lesson 4 card", ref="[lesson-4-card]")
browser_wait_for(text="Sports Trashtalk Quiz")

# 29. VERIFY: Quiz structure
# - 5 questions visible
# - 4 options each
# - Clear question text
browser_take_screenshot(filename="06_lesson4_quiz_structure.png")

# 30. Return to AI Assistant
browser_navigate_back()
browser_navigate_back()
browser_click(element="AI Assistant link", ref="[ai-assistant-nav]")
```

### Phase 7: Batch Lesson Creation (Test Phase 2 Verification)

```bash
# 31. Create remaining lessons in batch (stress test)
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Create these 4 lessons together:
Lesson 5: 'Classic Lithuanian Comebacks' (Reading, 40 min) - Traditional sayings, modern slang, example conversations
Lesson 6: 'Friendly Insults & Jokes' (Reading, 35 min) - Playful insults, self-deprecating humor, cultural tips
Lesson 7: 'Real Conversations Video' (Video, 20 min) - Use video https://youtu.be/abc123xyz (convert to embed), title 'Lithuanian Banter Examples', creator 'Language Masters'
Lesson 8: 'Final Trashtalk Challenge' (Quiz, 15 min) - 7 questions covering all lessons, 70% passing score",
  submit=true
)

# 32. Wait for batch completion (may take 30-60 seconds)
browser_wait_for(text="4 lessons created", time=90)

# 33. VERIFY: Phase 2 Firestore verification
# - Check AI response for success count
# - Should match actual Firestore count
# - If hallucinations detected, Phase 2 should catch them

# 34. CRITICAL: Check for hallucination logs
# Expected log: "Lesson verification complete"
# Expected metrics: "accuracyRate: 100%" (or hallucinations caught)

# 35. Take screenshot of batch result
browser_take_screenshot(filename="07_batch_lessons_created.png")
```

### Phase 8: Verify All Lessons in Dashboard

```bash
# 36. Navigate to course dashboard
browser_click(element="View course button", ref="[view-course-btn]")
browser_wait_for(text="Lithuanian Trashtalk & Friendly Banter")

# 37. Count lessons displayed
# Expected: 8 lessons total
# - Lesson 1-2, 5-6: Reading
# - Lesson 3, 7: Video
# - Lesson 4, 8: Quiz

# 38. VERIFY: Lesson order correct (1-8 sequential)
browser_take_screenshot(filename="08_all_lessons_dashboard.png")

# 39. Scroll through lessons to verify types
browser_scroll(direction="down")
browser_take_screenshot(filename="09_lessons_scrolled.png")
```

### Phase 9: Edit Lesson (Test getLesson + updateLesson)

```bash
# 40. Return to AI Assistant
browser_click(element="AI Assistant link", ref="[ai-assistant-nav]")

# 41. Request lesson edit
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Fix the formatting in Lesson 1. If there are any escaped newlines (\\n) or pipe tables, convert them to proper Markdown. Also add one more example phrase at the end.",
  submit=true
)

# 42. VERIFY: AI calls getLesson first (retrieves current content)
browser_wait_for(text="Retrieved lesson")

# 43. VERIFY: AI calls updateLesson next (applies changes)
browser_wait_for(text="Lesson updated")

# 44. Take screenshot of edit confirmation
browser_take_screenshot(filename="10_lesson_edited.png")

# 45. Navigate to lesson to verify changes
browser_click(element="View course button", ref="[view-course-btn]")
browser_click(element="Lesson 1 card", ref="[lesson-1-card]")
browser_wait_for(text="Introduction to Lithuanian Banter")

# 46. Check for improvements (proper formatting, new content)
browser_take_screenshot(filename="11_lesson_edited_result.png")
```

### Phase 10: Retrieve Course Details (Test getCourseDetails)

```bash
# 47. Return to AI Assistant
browser_navigate_back()
browser_navigate_back()
browser_click(element="AI Assistant link", ref="[ai-assistant-nav]")

# 48. Ask for course summary
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Show me the details of the Trashtalk course we just created, including lesson count and total duration.",
  submit=true
)

# 49. VERIFY: AI calls getCourseDetails
browser_wait_for(text="Course details")

# 50. VERIFY: Response includes accurate info
# - Course title correct
# - 8 lessons listed
# - Total duration ~4 hours
browser_take_screenshot(filename="12_course_details.png")
```

### Phase 11: Error Handling Test (Placeholder ID Detection)

```bash
# 51. Try to trigger placeholder ID error (negative test)
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="Create a lesson with courseId 'your_course_id' titled 'Test Error'",
  submit=true
)

# 52. VERIFY: Error caught and displayed
browser_wait_for(text="Invalid courseId")
browser_wait_for(text="placeholder")

# 53. Take screenshot of error message
browser_take_screenshot(filename="13_placeholder_error.png")
```

### Phase 12: Code Output Test (Phase 1 Detection)

```bash
# 54. Try to trigger code output (negative test)
# Use ambiguous phrasing that historically caused code output
browser_type(
  element="Chat input",
  ref="[chat-input]",
  text="show me how to create a lesson with console.log",
  submit=true
)

# 55. VERIFY: Phase 1 catches code pattern (if AI tries to output code)
# Expected: Either AI responds conversationally (AUTO mode allows this)
#           OR Error: "AI attempted to show code instead of executing"

# 56. Take screenshot
browser_take_screenshot(filename="14_code_test.png")
```

### Phase 13: Final Verification & Cleanup

```bash
# 57. Navigate to teacher dashboard
browser_click(element="Dashboard link", ref="[dashboard-nav]")
browser_wait_for(text="Teacher Dashboard")

# 58. Find the course in list
browser_wait_for(text="Lithuanian Trashtalk & Friendly Banter")

# 59. VERIFY: Course card shows correct info
# - Title
# - Beginner level
# - 8 lessons
# - ~4 hours
browser_take_screenshot(filename="15_final_dashboard.png")

# 60. Take final full-page screenshot
browser_take_screenshot(filename="16_final_full_page.png", fullPage=true)

# 61. Close browser
browser_close()
```

---

## ✅ Success Criteria

### Phase 1: Code Detection ✅
- [ ] No `console.log()` output detected
- [ ] No `print()` statements in responses
- [ ] No code examples when in Building mode
- [ ] Clear error message if code detected

### Phase 2: Firestore Verification ✅
- [ ] All 8 lessons verified in Firestore
- [ ] Lesson IDs are real (20+ chars, alphanumeric)
- [ ] No hallucinations detected (100% accuracy)
- [ ] Verification logs show correct metrics

### Phase 3: AUTO Mode ✅
- [ ] Functions called automatically for actions
- [ ] Conversational responses for questions
- [ ] No code output in Building mode
- [ ] Clear distinction between action vs question

### Content Quality ✅
- [ ] Markdown formatting correct (headers, lists, bold)
- [ ] No escaped newlines (`\n` converted to breaks)
- [ ] No pipe tables (converted to bullet lists)
- [ ] YouTube embed URLs correct (not watch URLs)
- [ ] Video attribution present (title, creator, source)

### Function Coverage ✅
- [ ] `createCourse()` - 1 successful call
- [ ] `createLesson()` - 6 successful calls (reading lessons)
- [ ] `createQuizLesson()` - 2 successful calls (quizzes)
- [ ] `getCourseDetails()` - 1 successful call
- [ ] `getLesson()` - 1 successful call (before edit)
- [ ] `updateLesson()` - 1 successful call (edit applied)

### Error Handling ✅
- [ ] Placeholder ID detected and rejected
- [ ] Code output caught (if attempted)
- [ ] User-friendly error messages
- [ ] No crashes or uncaught exceptions

---

## 📊 Expected Logs (Sample)

### Course Creation Log
```json
{
  "timestamp": "2025-11-21T10:15:30Z",
  "level": "info",
  "component": "AI",
  "message": "Function createCourse completed",
  "metadata": {
    "success": true,
    "courseId": "2l7VdVb0JbXRGs0zlgLb",
    "title": "Lithuanian Trashtalk & Friendly Banter"
  }
}
```

### Batch Lesson Creation Log
```json
{
  "timestamp": "2025-11-21T10:18:45Z",
  "level": "info",
  "component": "AI",
  "message": "Processing function calls",
  "metadata": {
    "functions": ["createLesson", "createLesson", "createLesson", "createLesson"]
  }
}
```

### Firestore Verification Log
```json
{
  "timestamp": "2025-11-21T10:19:02Z",
  "level": "info",
  "component": "AI",
  "message": "Lesson verification complete",
  "metadata": {
    "totalResults": 4,
    "totalVerified": 4,
    "totalSuccess": 4,
    "totalFailed": 0,
    "hallucinationsDetected": 0,
    "accuracyRate": "100%"
  }
}
```

### Placeholder ID Error Log
```json
{
  "timestamp": "2025-11-21T10:22:15Z",
  "level": "error",
  "component": "AI",
  "message": "Invalid courseId \"your_course_id\". This appears to be a placeholder. Use the actual ID from createCourse response.",
  "metadata": {
    "functionName": "createLesson",
    "lessonTitle": "Test Error"
  }
}
```

---

## 🐛 Known Issues & Workarounds

### Issue 1: Batch Creation Timeout
**Problem:** Creating 4 lessons at once may timeout (>60s)  
**Workaround:** Break into 2 batches (2 lessons each)  
**Fix Status:** Increase timeout to 90s (done in Phase 7)

### Issue 2: Video URL Not Converting
**Problem:** AI forgets to convert watch URL to embed  
**Solution:** Explicitly mention "convert to embed format" in prompt  
**Test Status:** Covered in Lesson 3 and Lesson 7

### Issue 3: Quiz Questions Too Hard
**Problem:** AI generates advanced questions for beginner course  
**Solution:** Emphasize "beginner-friendly" in prompt  
**Test Status:** Covered in Lesson 4 and Lesson 8

---

## 📁 Output Files

After test completion, you should have:

### Screenshots (16 total)
1. `01_course_created.png` - Course creation confirmation
2. `02_lesson1_content.png` - Markdown formatting check
3. `03_lesson2_created.png` - Second lesson created
4. `04_lesson3_video.png` - Video embed verification
5. `05_lesson4_quiz_created.png` - Quiz creation
6. `06_lesson4_quiz_structure.png` - Quiz layout
7. `07_batch_lessons_created.png` - Batch creation result
8. `08_all_lessons_dashboard.png` - Full course view
9. `09_lessons_scrolled.png` - Scrolled lesson list
10. `10_lesson_edited.png` - Edit confirmation
11. `11_lesson_edited_result.png` - Edit verification
12. `12_course_details.png` - getCourseDetails result
13. `13_placeholder_error.png` - Error handling
14. `14_code_test.png` - Phase 1 detection test
15. `15_final_dashboard.png` - Final course card
16. `16_final_full_page.png` - Full page screenshot

### Log Files
- `playwright_execution.log` - Playwright commands and results
- `ai_chatbot_logs.txt` - AI API logs during test
- `firestore_queries.log` - Database reads/writes

### Test Report
- `test_results.md` - Pass/fail status for each phase
- `coverage_report.md` - Feature coverage summary
- `performance_metrics.md` - Latency, token usage, etc.

---

## 🚀 Running the Test

### Prerequisites
```bash
# 1. Install dependencies
npm install
pnpm install

# 2. Start dev server
pnpm dev

# 3. Ensure Playwright MCP is available
# (Should be auto-loaded in VS Code with MCP extension)

# 4. Create test teacher account (if needed)
node scripts/create-test-account.js --email teacher@test.com --role teacher
```

### Execute Test
```bash
# Option A: Run full script in one session
# Copy script sections into Playwright MCP sequentially

# Option B: Run phase-by-phase
# Execute each phase, verify results, then proceed

# Option C: Automated (if Playwright script exists)
npx playwright test e2e/trashtalk-course.spec.ts --headed
```

### Monitoring During Test
```bash
# Terminal 1: Watch dev server logs
pnpm dev

# Terminal 2: Watch Firestore writes (if local emulator)
firebase emulators:start --only firestore

# Terminal 3: Watch AI API logs
tail -f logs/ai_chatbot_logs.txt
```

---

## 📝 Post-Test Actions

### If All Tests Pass ✅
1. Document results in `test_results.md`
2. Update MAIN.md with test completion status
3. Deploy to staging for production validation
4. Schedule production deployment

### If Tests Fail ❌
1. Document failures in `test_failures.md`
2. Create GitHub issues for each failure
3. Prioritize fixes (P0: hallucinations, P1: formatting, P2: UX)
4. Re-run test after fixes
5. Do NOT deploy until all P0/P1 issues resolved

---

## 🔗 Related Documentation

- **Hallucination Bug Analysis:** [AI_HALLUCINATION_BUG.md](./AI_HALLUCINATION_BUG.md)
- **Phase 1 & 2 Testing:** [HALLUCINATION_FIX_TESTING.md](./HALLUCINATION_FIX_TESTING.md)
- **Implementation:** [/app/api/ai/teacher-bot/route.ts](../../app/api/ai/teacher-bot/route.ts)
- **Main Docs:** [/docs/MAIN.md](../MAIN.md)

---

**Test Status:** 🟡 Ready to Execute  
**Estimated Duration:** 45-60 minutes  
**Risk Level:** Low (comprehensive coverage)  
**Next Step:** Open new chat, paste Playwright script, execute Phase 1

---

**Last Updated:** November 21, 2025  
**Version:** 1.0  
**Tester:** [Your Name]
