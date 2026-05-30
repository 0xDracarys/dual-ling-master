## AI Teacher-Bot Backend - Fix Report

Status: Draft
Author: automated analysis
Date: 2025-11-21

Summary
-------
This document captures observed runtime failures for the Teacher AI Chatbot backend (app/api/ai/teacher-bot/route.ts), probable root causes, and a prioritized remediation plan (short/medium/long term). It is written to support an immediate hotfix and a staged, low-risk rollout.

Observed Symptoms
-----------------
- Intermittent 500 responses with message: "AI service temporarily unavailable" when creating multiple lessons (batch flows).
- Errors logged: "AI returned empty response" and "AI hallucination detected: Outputted code instead of calling functions".
- Single course creation and single-lesson creation succeed; batch lesson creation often fails or times out.
- Failures primarily occur during the *function-calling / BUILDING* flow where the model is expected to return function calls.

Relevant Files
--------------
- `app/api/ai/teacher-bot/route.ts` (primary handler)
- `lib/services/course/course.service.ts` (CourseService: createCourse, addLesson, getCourseLessons)
- `lib/tracing/trace-logger.ts` (structured logs)
- `lib/services/ai/token-tracker.service.ts` (token logging - non-critical)

Probable Root Causes (ordered by likelihood)
-------------------------------------------
1) Model/Backend Timeouts & Transient Failures
   - The handler uses a 60s timeout for primary chat.sendMessage calls (90s for second responses). AI backend transient failures or long inference times can trigger the timeout or return an empty response.

2) Function-calling configuration mismatches / model behavior
   - Model sometimes returns code/text instead of functionCalls. Current code treats this as a fatal error. In many cases the model could be influenced to retry rather than failing outright.
   - `toolConfig.functionCallingConfig.mode = 'AUTO'` may not reliably force function-calling for the model under load or with specific prompts.

3) No retry / backoff on AI calls
   - Calls to `chat.sendMessage` are attempted once and rely on single timeout. No retry/backoff when model returns empty/blocked responses.

4) Partial-batch concurrency & ordering race conditions
   - The route computes lesson ordering client-side by reading existing lessons and adding batch entries in parallel batches. Race conditions or Firestore write latencies could cause failures or unexpected results.

5) Strict safety filters / hidden SDK error details
   - The GoogleAIBackend / Firebase AI SDK may drop or block responses for safety reasons (returns empty for blocked content). The route currently surfaces a generic 500 with minimal context.

Short-term (Hotfix) Actions - Priority P0 / quick rollback safe
----------------------------------------------------------------
1. Add robust retry + exponential backoff around `chat.sendMessage` and the subsequent `secondResponsePromise`/`finalResponsePromise` calls. Example: 3 attempts with 500ms → 1500ms → 4500ms.
   - Rationale: addresses transient model/backend errors and reduces 500s from intermittent load.

2. Increase timeouts for BUILDING flow to 90-120s for heavy operations (batch lesson creation). Keep planning mode shorter (60s).

3. Replace immediate throw on code-output detection with a re-prompt attempt.
   - Instead of throwing when `initialText` contains code patterns and `functionCalls.length === 0`, do: log detailed context, re-prompt the model with an explicit short system message: "Do not output code — call the functions directly. If you cannot call functions, reply with a brief explanation." Then retry once.

4. Surface richer logs in the 500 response (only in staging or when NODE_ENV=development): include response length, functionCall count, safety metadata if present. Do NOT log secrets or tokens.

Medium-term Actions - Priority P1
--------------------------------
1. Implement a retry-and-fallback strategy for function-calling failures:
   - If retries fail for the primary model, attempt a fallback model (e.g., smaller Gemini variant or a text-only model) configured for function-calling.
   - If fallback still fails, return a partial-success response (created course id + list of lesson successes/failures) rather than failing entire operation.

2. Make AI re-prompts deterministic & auditable
   - When re-prompting, include a fixed short system instruction that forces function calling behavior and set `toolConfig.functionCallingConfig.mode` to a stronger mode if supported (consult Firebase AI SDK docs: use `ANY` vs `AUTO` vs `FORCED` if available).

3. Improve verification & partial reporting
   - Do not assume all-or-nothing success. If some lesson creations succeed and others fail, return partial_results with per-function success/error and preserve created IDs.

4. Harden CourseService for concurrent lesson creation
   - Move lesson order calculation into a Firestore transaction inside `CourseService.addLesson` (or use server-side increment counter) to avoid client-side race conditions when creating lessons in parallel batches.

Long-term Actions - Priority P2
-------------------------------
1. Add a lightweight orchestration/queue for large batch operations
   - Push heavy batch lesson creation into a background job (Cloud Tasks / Work Queue) and immediately return an operation ID to the user. Job status can be polled and partial results recorded. This removes long blocking HTTP requests and reduces timeouts.

2. Add observability & alerting
   - Metric: AI-empty-response-rate, AI-functioncall-failure-rate, course-creation-failure-rate.
   - Alert when error-rate > threshold (e.g., 2% over 5m) and include sample request IDs and trace IDs.

3. Model-level improvements
   - Evaluate using model variants with more stable function-calling behavior (gemini-2.5-flash vs gemini-2.0). Run A/B tests with consistent prompts.

Validation & Test Plan
----------------------
1. Unit tests (route-level mocking):
   - Mock SDK to return: (a) empty response, (b) text-with-code, (c) proper functionCalls. Validate retry behavior and re-prompt logic produces expected results.

2. Integration tests (staging):
   - Run Playwright MCP flows for: single course + 1 lesson, batch 8 lessons, intentionally-failing lesson content. Validate partial success path and no 500 for transient model errors.

3. Load test: simulate concurrent teachers creating courses/lessons to detect rate-limit / scaling chokepoints.

4. Observability check: deploy instrumentation and verify metrics and sample logs include traceId/spanId, model name, and function call counts.

Rolling Plan & Risk Mitigation
-----------------------------
1. Hotfix (apply to staging): implement retries + re-prompt + increase timeouts. Run integration tests and verify.
2. If staging stable for 24h, deploy hotfix to production during a low-traffic window.
3. Medium-term changes (CourseService transaction, partial result reporting) to be applied next sprint with tests and Playwright verification.
4. For large batch operations or repeated failures, temporarily disable AUTO-BUILDING for bulk creates and surface a recommended manual flow until background job is ready.

Code Locations to Modify (recommended change list)
-------------------------------------------------
1. `app/api/ai/teacher-bot/route.ts`
   - Wrap chat.sendMessage calls with retry/backoff and re-prompt logic
   - Increase timeout values for BUILDING flows
   - Change immediate throws on code-output to a retry + controlled failure response with partial results

2. `lib/services/course/course.service.ts`
   - Ensure `addLesson` performs ordering in a Firestore transaction or uses atomic increment to avoid race conditions

3. `lib/tracing/trace-logger.ts`
   - Ensure trace/span IDs are included with all AI-related log messages (already in use) and add consistent correlation fields (operationId)

4. `lib/services/ai/token-tracker.service.ts` (optional)
   - Ensure failed attempts are tracked for analysis (do not block request on token logging)

Acceptance Criteria (for hotfix)
--------------------------------
- Staging: Empty-response and 500 rate for batch flows reduced to near-zero under same test inputs.
- Staging: Partial-success responses are returned instead of full 500 where applicable.
- Playwright test (existing) that previously failed now completes creating at least 80% of lessons in a batch when model is healthy.

Notes & Known Constraints
------------------------
- Do NOT relax safety thresholds globally without product approval; use targeted re-prompts and retries first.
- Avoid logging PII and tokens in responses. Use traceId to correlate logs for debugging.
- Some failures originate beyond our code (model infra or GoogleAIBackend throttling). Retries and fallback are practical mitigations but not full guarantees.

Next Steps (short, actionable)
-----------------------------
1. Implement and deploy hotfix to staging within next patch: retry/backoff + re-prompt + increased timeouts.
2. Run the Playwright E2E course creation flow (the one that previously produced 500s) against staging and capture logs/snapshots.
3. If stable, schedule production rollout and add monitoring dashboards for AI-related errors.

References
----------
- Extracts from `app/api/ai/teacher-bot/route.ts` (function-calling handling, timeouts, code-pattern detection)
- Firebase AI Logic docs (function calling, toolConfig, responseSchema) - consult latest SDK docs for `functionCallingConfig` modes

Appendix: Example retry pseudo-strategy (non-binding)
--------------------------------------------------
1. attempts = 3
2. backoff = 500ms base
3. for i in 1..attempts: try sendMessage; if empty/blocked -> wait backoff*(2**(i-1)) and retry; if still failing -> re-prompt once; if still failing -> fallback model; if all fail -> return partial results with clear error messages.
