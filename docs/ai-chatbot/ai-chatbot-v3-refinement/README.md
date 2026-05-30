# AI Chatbot v3 Refinement - README

**Version:** 3.0.0  
**Created:** November 20, 2025  
**Status:** 📋 READY FOR IMPLEMENTATION  
**Target Improvement:** 30-40% overall enhancement

---

## 🎯 Quick Start

This folder contains a **complete, implementation-ready plan** for upgrading the AI Chatbot from v1.1.0 to v3.0.0 with 30-40% overall improvements.

### What's Included

| Document | Purpose | For Whom |
|----------|---------|----------|
| **v3-refinement.prd.md** | Product requirements & success metrics | Product managers, stakeholders |
| **v3-refinement.scope.md** | Safety boundaries & 99% certainty rules | All implementers |
| **v3-refinement.implementation-guide.md** | Phases 1-3: Structured output, caching, token tracking | Developers, AI agents |
| **v3-refinement-batch-api.md** | Phase 4: Batch processing for bulk operations | Backend developers |
| **v3-refinement-ui-components.md** | Phase 5: Token usage transparency UI | Frontend developers |
| **v3-refinement-summary.md** | Complete overview & deployment checklist | Tech leads, project managers |

---

## 📊 Expected Results

### Quantitative Improvements

| Metric | Baseline (v1.1.0) | Target (v3.0.0) | Improvement |
|--------|-------------------|-----------------|-------------|
| **Response Quality** | 3.8/5 | 5.0/5 | **+32%** |
| **Error Rate** | ~5% | 0% | **-100%** |
| **Token Cost/Course** | $1.50 | $0.30 | **-80%** |
| **Bulk Creation Speed** | 15 min | 7 min | **-53%** |
| **Teacher Satisfaction** | 78% | 95%+ | **+22%** |

### Key Features

✅ **Structured Output** - Zero malformed JSON responses  
✅ **Code Execution** - Accurate calculations for lesson ordering  
✅ **Context Caching** - 97% cost reduction on system prompts  
✅ **Batch API** - 50% faster + 50% cheaper bulk operations  
✅ **Token Transparency** - Real-time cost visibility for teachers  

---

## 🚀 Implementation Order

### Week 1: Foundation
1. Read `v3-refinement.prd.md` - Understand goals
2. Read `v3-refinement.scope.md` - Understand boundaries
3. Implement **Phase 1** (Structured Output + Code Execution)
4. Implement **Phase 2** (Context Caching)
5. Implement **Phase 3** (Token Tracking)

**Deliverable:** 20% quality improvement, 80% cost reduction

### Week 2: Performance
6. Implement **Phase 4** (Batch API)
7. Test bulk course creation (10+ courses)
8. Optimize parallel processing

**Deliverable:** 50% faster bulk operations

### Week 3: Transparency
9. Implement **Phase 5** (UI Components)
10. Build monthly usage dashboard
11. Add token badges to chat messages

**Deliverable:** Full cost transparency

### Week 4: Rollout
12. End-to-end testing with Playwright MCP
13. Performance benchmarking
14. Staged production rollout (10% → 50% → 100%)

**Deliverable:** v3.0 in production

---

## 📚 Gemini API Documentation (Reference)

All features implemented use official Gemini API patterns:

1. **Code Execution:** https://ai.google.dev/gemini-api/docs/code-execution
2. **Batch API:** https://ai.google.dev/gemini-api/docs/batch-api
3. **Context Caching:** https://ai.google.dev/gemini-api/docs/caching?lang=node
4. **Token Counting:** https://ai.google.dev/gemini-api/docs/tokens?lang=node
5. **Prompting Strategies:** https://ai.google.dev/gemini-api/docs/prompting-strategies
6. **Function Calling:** https://ai.google.dev/gemini-api/docs/function-calling?example=chart
7. **Long Context:** https://ai.google.dev/gemini-api/docs/long-context

---

## ⚠️ Critical Safety Rules

### Before Making ANY Change:

1. ✅ **Read scope.md first** - Understand what's safe to change
2. ✅ **99% Certainty Rule** - Only proceed if you're 99% sure it won't break production
3. ✅ **Test with Playwright MCP** - Verify UI changes work end-to-end
4. ✅ **Check token usage** - Confirm caching is working (logs show cached tokens)
5. ✅ **Monitor error rates** - Should drop to 0%, not increase

### Files You Can Safely Change:

✅ `/app/api/ai/teacher-bot/route.ts` (with caution)  
✅ `/lib/services/ai/token-tracker.service.ts` (new file)  
✅ `/lib/services/ai/cache-manager.service.ts` (new file)  
✅ `/lib/services/ai/batch-processor.service.ts` (new file)  
✅ `/components/ai-chatbot/token-usage-badge.tsx` (new file)  
✅ `/components/ai-chatbot/session-summary-card.tsx` (new file)  
✅ `/app/teacher/ai-usage/page.tsx` (new file)  

### Files You CANNOT Change:

❌ `/lib/services/course/course.service.ts` (used by 10+ features)  
❌ `/lib/firebase/config.ts` (API key already configured)  
❌ `/components/ai-chatbot/chat-interface.tsx` (actively used by teachers)  

---

## 🧪 Testing Strategy

### Phase 1-3 Tests (After Each Phase)

```bash
# 1. Run unit tests
npm test lib/services/ai/*.test.ts

# 2. Test AI route manually
curl -X POST http://localhost:3000/api/ai/teacher-bot \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a course about Spanish verbs"}'

# 3. Verify caching in logs
# Look for: "Using existing system prompt cache" in Cloud Logging

# 4. Check token tracking in Firestore
# Collection: ai_token_usage
# Should see documents with cachedTokens > 0
```

### Phase 4-5 Tests (Batch & UI)

```bash
# 1. Test batch API
curl -X POST http://localhost:3000/api/ai/teacher-bot/batch \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d @batch-test-data.json

# 2. Open usage dashboard
# Navigate to: http://localhost:3000/teacher/ai-usage
# Verify: Charts display, costs accurate, cache savings visible

# 3. Playwright MCP tests
npm run test:e2e
```

---

## 📈 Success Metrics (How to Measure)

After deployment, track these metrics daily:

1. **Error Rate**
   - Firestore query: Count documents where `error` field exists
   - Target: <0.5% of total requests

2. **Token Cost per Course**
   - Firestore aggregate: Sum `ai_token_usage.cost` where `operation = 'course_creation'`
   - Target: <$0.30 per course

3. **Cache Hit Rate**
   - Firestore query: Count documents where `cachedTokens > 0`
   - Target: >80% of requests

4. **Teacher Satisfaction**
   - Post-creation survey (added to chatbot UI)
   - Target: 95%+ rating "Very Satisfied"

5. **Bulk Operation Speed**
   - Measure time from batch submit → all courses created
   - Target: <8 minutes for 10 courses

---

## 🆘 Rollback Plan

If something breaks:

```bash
# 1. Revert API route to v1.1.0
git checkout v1.1.0 -- app/api/ai/teacher-bot/route.ts

# 2. Disable new features via env vars
firebase apphosting:secrets:set ENABLE_TOKEN_TRACKING=false
firebase apphosting:secrets:set ENABLE_BATCH_API=false
firebase apphosting:secrets:set ENABLE_CACHING=false

# 3. Deploy immediately
git commit -m "Rollback to v1.1.0 - v3 issues detected"
git push origin master

# 4. Monitor error rates
# Check Cloud Logging for 10 minutes
# Verify errors drop to <0.5%
```

---

## 👥 Team Roles

| Role | Responsibility | Documents to Read |
|------|----------------|-------------------|
| **Project Manager** | Track progress, unblock | PRD, Summary |
| **Backend Developer** | Implement Phases 1-4 | Implementation Guide, Batch API |
| **Frontend Developer** | Implement Phase 5 | UI Components |
| **QA Engineer** | Test end-to-end | All docs + Scope |
| **AI Agent** | Autonomous implementation | All docs (follow order) |

---

## 📞 Questions?

1. **Implementation questions:** Read `v3-refinement.implementation-guide.md`
2. **Safety concerns:** Read `v3-refinement.scope.md`
3. **Feature clarifications:** Read `v3-refinement.prd.md`
4. **UI design questions:** Read `v3-refinement-ui-components.md`

---

**Status:** Documentation complete. Ready for implementation.  
**Last Updated:** November 20, 2025  
**Next Action:** Read PRD, then start Week 1 implementation.
