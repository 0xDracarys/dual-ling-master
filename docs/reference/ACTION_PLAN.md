# Firebase Migration - Action Plan & Next Steps

**Status:** 🟢 Phase 3: Course & Enrollment System (65% Complete)  
**Version:** 3.0.0  
**Last Updated:** October 17, 2025  
**Branch:** `firebase-migration`

---

## 🎯 Current Status

✅ **PHASE 1 COMPLETED:** Foundation & Setup
✅ **PHASE 2 COMPLETED:** Authentication & Debug System  
🟢 **PHASE 3 IN PROGRESS:** Course & Enrollment System (65% Complete)

**Current Focus:** Fixing lesson count discrepancy + completing progress tracking

📍 **YOU ARE HERE:** Phase 3 Week 1.5 - Lesson Management Complete, investigating data sync issues

---

## 📊 Phase 3 Progress Breakdown

### ✅ Week 1: Course Management (100%)
- [x] CourseService & CourseRepository
- [x] Course CRUD API endpoints
- [x] Teacher course creation/editing
- [x] Course publish/unpublish
- [x] Firebase authentication on all endpoints
- [x] Teacher dashboard with real data
- [x] Fixed Firestore field mapping

### ✅ Week 1.5: Lesson Management (95%)
- [x] LessonRepository with subcollection pattern
- [x] Lesson CRUD API endpoints
- [x] Type-specific lesson content
- [x] Lesson creation modal
- [x] Validation & auto-generation
- [ ] Lesson reordering (pending)
- [ ] Rich content editors (pending)

### ✅ Week 2: Enrollment System (80%)
- [x] EnrollmentService & Repository
- [x] Student enrollment API
- [x] Student dashboard with enrollments
- [x] Firestore composite index
- [x] Teacher recent activity endpoint
- [ ] Frontend activity display (bug)

### 🟡 Week 3: Progress Tracking (30%)
- [x] ProgressService skeleton
- [x] Basic progress endpoint
- [ ] Lesson completion tracking
- [ ] Quiz score recording
- [ ] Progress analytics
- [ ] Learning streaks

---

## 🚧 Current Blockers

### **Priority 1: Critical Issues**

1. **Lesson Count Discrepancy** 🔴
   - Dashboard shows 2 lessons (correct)
   - Other pages show 1 lesson (incorrect)
   - Under investigation - possibly Firestore query or caching
   - **Action:** Check Firestore console, add detailed logging

2. **Teacher Recent Activity Not Displaying** 🔴
   - API endpoint works, frontend not calling it
   - **Action:** Debug useEffect in teacher dashboard

---

## 🎯 Immediate Next Steps (This Week)

### Day 1: Bug Fixes
- [ ] Investigate lesson count discrepancy
  - Check Firestore console for actual data
  - Add logging to getByCourse() method
  - Test with hard refresh
- [ ] Fix teacher recent activity display
  - Debug frontend API call
  - Verify state management
  - Test with real data

### Day 2-3: Complete Lesson Management
- [ ] Add lesson reordering (drag-and-drop)
- [ ] Improve lesson edit modal
- [ ] Add lesson duplication feature
- [ ] Add bulk lesson operations

### Day 4-5: Progress Tracking Foundation
- [ ] Refactor ProgressService (service + repository pattern)
- [ ] Implement lesson completion tracking
- [ ] Add progress percentage calculation
- [ ] Create progress dashboard

---

## 📋 Short-Term Roadmap (Next 2 Weeks)

### Week 4: Quiz System
- [ ] Quiz question builder UI
- [ ] Quiz taking interface
- [ ] Score calculation logic
- [ ] Quiz results in progress tracking

### Week 5: Content Creation Tools
- [ ] Rich text editor integration (TipTap)
- [ ] Media upload to Firebase Storage
- [ ] Video embedding
- [ ] Image optimization

---

## 🚀 Migration Approach (DECIDED)

**Decision:** Option D - Direct Migration (No User Base)

- **Timeline:** 2-3 weeks
- **Risk:** Zero (no existing users)
- **Downtime:** N/A (no production traffic)
- **Approach:** Clean slate migration
- **Backup:** MongoDB database preserved in master branch

**Rationale:** Since there's no user base, we can perform a direct migration without gradual rollout concerns. MongoDB remains in master branch as reference/backup.
- [ ] Set up billing alerts (at 50%, 80%, 90%)
- [ ] Create staging and production projects

#### Day 3-4: Local Development Setup
- [ ] Install Firebase CLI globally
- [ ] Authenticate with Firebase account
- [ ] Initialize Firebase in project (`firebase init`)
- [ ] Configure Firebase emulators (Firestore, Auth, Storage, Functions)
- [ ] Test emulators locally

#### Day 5: Team Alignment
- [ ] Review IKB documentation with team
- [ ] Assign roles (Technical Lead, Developer, Tester, PM)
- [ ] Set up communication channels (Slack, daily standups)
- [ ] Agree on migration approach (A, B, or C)
- [ ] Create project tracking board (GitHub Projects, Jira, etc.)

---

### Week 2: Data Audit & Preparation

#### Day 1-2: MongoDB Data Audit
- [ ] Export all collections to JSON
- [ ] Count documents per collection
- [ ] Identify largest collections (query optimization needed)
- [ ] List all indexes in MongoDB
- [ ] Document all unique constraints

#### Day 3: Media Files Inventory
- [ ] List all uploaded files (images, videos, PDFs)
- [ ] Calculate total storage size
- [ ] Identify file naming conventions
- [ ] Plan Cloud Storage folder structure

#### Day 4: API Endpoint Mapping
- [ ] List all Next.js API routes
- [ ] Categorize: Auth, Courses, Enrollments, etc.
- [ ] Identify MongoDB-specific code (Mongoose queries)
- [ ] Flag complex queries needing optimization

#### Day 5: Security & Compliance Review
- [ ] Review current authentication flow
- [ ] Document user roles and permissions
- [ ] Identify sensitive data (PII, passwords)
- [ ] Plan GDPR compliance for Firebase (data export, deletion)

---

## � Phase 2: Authentication Migration Tasks

### 🟢 Completed Steps

#### Debug System ✅
- [x] Created DEBUG_SYSTEM.md documentation
- [x] Implemented DebugLogger utility (singleton pattern)
- [x] Created DebugPanel React component
- [x] Integrated into root layout
- [x] Added keyboard shortcut (Ctrl+Shift+D)
- [x] Implemented log persistence (localStorage)
- [x] Added filtering and search functionality
- [x] Created log export (JSON/CSV)

#### Service Layer ✅
- [x] Created AuthService with Firebase Authentication
- [x] Implemented UserRepository (Firestore CRUD)
- [x] Added comprehensive debug logging
- [x] Documented all methods with examples

#### Migration Scripts ✅
- [x] Created `scripts/migrate-users.ts`
- [x] Implemented dry-run mode
- [x] Added MongoDB → Firebase Auth user creation
- [x] Added custom claims (role-based access)
- [x] Firestore user document creation
- [x] Password reset email generation

### 🟡 In Progress

#### API Routes Refactoring
- [ ] Update `/api/auth/register` - Use AuthService
- [ ] Update `/api/auth/login` - Use AuthService  
- [ ] Update `/api/auth/google` - Use AuthService
- [ ] Update `/api/auth/logout` - Use AuthService
- [ ] Update `/api/auth/reset-password` - Use AuthService
- [ ] Update `/api/auth/verify-email` - Use AuthService
- [ ] Create Firebase Auth middleware for protected routes
- [ ] Remove JWT token generation/validation

#### Frontend Components
- [ ] Update `app/auth/login/page.tsx` - Firebase Auth
- [ ] Update `app/auth/register/page.tsx` - Firebase Auth
- [ ] Update `components/auth/protected-route.tsx` - Firebase Auth
- [ ] Update `hooks/use-auth.tsx` - Firebase Auth integration
- [ ] Add Google Sign-In button component
- [ ] Remove JWT token storage logic

#### Environment Setup
- [ ] Create `.env.local` with Firebase credentials
- [ ] Add service account JSON (for Admin SDK)
- [ ] Test environment variable loading

### ⏳ Pending (Phase 3)

#### Data Migration
- [ ] Run `migrate-users.ts` script (if needed)
- [ ] Migrate courses collection to Firestore
- [ ] Migrate lessons collection to Firestore
- [ ] Migrate progress tracking to Firestore
- [ ] Verify data integrity

#### Testing & Validation
- [ ] Test registration flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Test Google Sign-In flow
- [ ] Test password reset flow
- [ ] Test email verification flow
- [ ] Test protected routes
- [ ] Check debug logs for errors

---

## �🛠️ Technical Preparation Checklist

### Prerequisites ✅
- [x] Node.js 18+ installed
- [x] Firebase CLI installed: `npm install -g firebase-tools`
- [x] GCP account with billing enabled
- [x] Access to MongoDB Atlas (for export)
- [x] GitHub repository access

### Firebase Configuration Files ✅
- [x] `firebase.json` - Main config
- [x] `firestore.rules` - Security rules
- [x] `firestore.indexes.json` - Composite indexes
- [x] `storage.rules` - Storage security
- [x] `.firebaserc` - Project aliases

### Environment Variables to Set ⏳
```bash
# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=paji-duolingo
FIREBASE_CLIENT_EMAIL=firebase-admin@paji-duolingo.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Firebase Client SDK (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=paji-duolingo.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=paji-duolingo
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=paji-duolingo.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# MongoDB (for migration scripts only)
MONGODB_URI=mongodb+srv://...
MONGODB_DB=dualing
```

**📝 Note:** See `.env.firebase.template` for complete example

---

## 📊 Success Metrics & KPIs

### Migration Health Indicators

**Week-by-Week Targets:**

| Week | Milestone | Success Criteria |
|------|-----------|-----------------|
| 1-2 | Setup Complete | Emulators working locally |
| 3-4 | Auth Migrated | 100% users in Firebase Auth |
| 5-6 | Data Migrated | 100% data in Firestore, verified |
| 7-8 | APIs Refactored | All endpoints using Firestore |
| 9-10 | Frontend Updated | Real-time features working |
| 11-12 | Advanced Features | Cloud Functions deployed |
| 13 | Testing Complete | All tests passing, no critical bugs |
| 14 | Production Live | Zero downtime cutover |
| 15-16 | Optimization | Performance tuned, costs optimized |
| 17+ | Cleanup | MongoDB decommissioned |

### Performance Benchmarks (Pre vs Post)

| Metric | Current (MongoDB) | Target (Firebase) |
|--------|-------------------|-------------------|
| **API Response Time** | ~200ms (avg) | <150ms |
| **Page Load Time** | ~1.5s | <1s |
| **Auth Flow** | 3-step JWT | 1-step Firebase |
| **Real-time Updates** | Polling (30s) | Instant (<100ms) |
| **Deployment Time** | ~5 min | ~2 min |

---

## 🚨 Risk Management & Contingencies

### High-Priority Risks

#### Risk 1: Data Loss During Migration
**Probability:** Low  
**Impact:** Critical  
**Mitigation:**
- Test migration with sample data first (100 docs per collection)
- Keep MongoDB backup for 60 days (not 30)
- Implement data integrity checks (count, checksums)
- Use Firebase Admin SDK transactions for atomic writes

**Contingency:**
- If data loss detected, halt migration immediately
- Restore from MongoDB backup
- Investigate root cause before retrying

---

#### Risk 2: Authentication Failures Post-Migration
**Probability:** Medium  
**Impact:** Critical  
**Mitigation:**
- Gradual rollout (10% → 50% → 100% users)
- Keep MongoDB session validation as fallback
- Implement dual-auth for 48 hours (MongoDB + Firebase)
- Monitor failed login rate (alert if >2%)

**Contingency:**
- Rollback to MongoDB auth within 5 minutes
- Send password reset emails to affected users
- Debug Firebase Auth integration before retry

---

#### Risk 3: Cost Overrun (Exceed €250 Credit)
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Daily cost monitoring dashboard
- Budget alerts at 50%, 80%, 90%
- Query optimization before production (limit reads/writes)
- Use Firebase emulators for all testing (free)

**Contingency:**
- If approaching €200 by week 8, optimize or pause non-critical features
- Reduce Firestore read operations (increase client-side caching)
- Consider serverless alternatives (Cloudflare Workers for edge cases)

---

#### Risk 4: Performance Degradation
**Probability:** Low  
**Impact:** High  
**Mitigation:**
- Load testing with 1000 concurrent users before cutover
- Create composite indexes for all complex queries
- Implement pagination (limit 25-50 docs per query)
- Use Cloud CDN for static assets

**Contingency:**
- If response time >500ms, identify slow queries via Cloud Monitoring
- Add missing indexes immediately
- Implement query result caching (Redis/Memorystore if needed)

---

## 🔄 Weekly Sync Meeting Agenda

**When:** Every Monday, 10am  
**Duration:** 30 minutes  
**Attendees:** Technical Lead, Developers, PM

**Agenda:**
1. **Review last week's progress** (5 min)
   - Completed tasks
   - Blockers encountered
2. **Demo new functionality** (10 min)
   - Show working features
   - Run tests
3. **This week's priorities** (5 min)
   - Assign tasks
   - Set goals
4. **Risk review** (5 min)
   - Any new risks?
   - Mitigation status
5. **Budget check** (3 min)
   - Current GCP spending
   - Projected monthly cost
6. **Open discussion** (2 min)
   - Questions, concerns, ideas

---

## 📞 Escalation Path

### Issue Severity Levels

**P0 - Critical (Blocker):**
- Production down
- Data loss
- Security breach
- **Response Time:** Immediate
- **Escalate to:** Technical Lead + PM

**P1 - High (Major):**
- Feature broken in staging
- Migration script failed
- Performance degraded >50%
- **Response Time:** Within 2 hours
- **Escalate to:** Technical Lead

**P2 - Medium:**
- Non-critical feature bug
- Documentation unclear
- Test failure
- **Response Time:** Within 24 hours
- **Escalate to:** Assigned developer

**P3 - Low:**
- Code style issue
- Minor UI bug
- Enhancement request
- **Response Time:** Next sprint
- **Escalate to:** Backlog

---

## ✅ Definition of Done (Per Phase)

### Phase Complete Checklist

A phase is only "done" when:
- [ ] All tasks completed and tested
- [ ] Code reviewed and approved
- [ ] Tests passing (unit + integration)
- [ ] Documentation updated in IKB
- [ ] Git commit pushed to branch
- [ ] Demo given to stakeholders
- [ ] Next phase planned and assigned

---

## 🎓 Recommended Learning Path

### For Frontend Developers
1. **Firestore Basics** (2 hours)
   - https://firebase.google.com/docs/firestore/quickstart
2. **Firebase Auth Integration** (1 hour)
   - https://firebase.google.com/docs/auth/web/start
3. **Real-time Listeners** (1 hour)
   - https://firebase.google.com/docs/firestore/query-data/listen

### For Backend Developers
1. **Firebase Admin SDK** (2 hours)
   - https://firebase.google.com/docs/admin/setup
2. **Cloud Functions** (3 hours)
   - https://firebase.google.com/docs/functions/get-started
3. **Security Rules** (2 hours)
   - https://firebase.google.com/docs/firestore/security/get-started

### For Everyone
1. **GCP Console Tour** (30 min)
   - Navigate Firebase Console
   - Understand Cloud Monitoring
2. **Cost Management** (30 min)
   - How to read billing reports
   - Set up budget alerts

---

## 📝 Decision Log

Document all major decisions here:

### Decision 1: Use Firestore Native Mode (Not Datastore)
**Date:** October 8, 2025  
**Decided By:** Technical Lead  
**Rationale:** Better real-time support, more intuitive API  
**Alternatives Considered:** Cloud Datastore, MongoDB Atlas

### Decision 2: Keep Next.js API Routes (Not Pure Cloud Functions)
**Date:** October 8, 2025  
**Decided By:** Technical Lead  
**Rationale:** Minimize code refactoring, hybrid approach works  
**Alternatives Considered:** Full Cloud Functions, Cloud Run

### Decision 3: Top-Level Enrollments Collection (Not Subcollection)
**Date:** October 8, 2025  
**Decided By:** Technical Lead  
**Rationale:** Easier cross-user queries, better for teacher dashboard  
**Alternatives Considered:** User subcollection, Course subcollection

---

## 🔗 Quick Links

- **Main IKB:** [/docs/MAIN.md](./MAIN.md)
- **Quick Start:** [/docs/QUICK_START.md](./QUICK_START.md)
- **Firebase Console:** https://console.firebase.google.com/
- **GCP Console:** https://console.cloud.google.com/
- **Migration Strategy:** [FIREBASE_MIGRATION_STRATEGY.md](./FIREBASE_MIGRATION_STRATEGY.md)

---

## 🎯 Your Next Step

**Choose one to discuss:**

1. **"Let's start Phase 1 immediately"** → I'll create Firebase project and initialize config
2. **"I need to review the docs first"** → Take your time, ask questions when ready
3. **"I have concerns about [X]"** → Let's discuss and adjust the plan
4. **"Can we do [different approach]?"** → Absolutely, let's explore alternatives

**What would you like to do next?**

---

**Document Owner:** ZenType Architect (J)  
**Status:** Awaiting user input to proceed  
**Last Updated:** October 8, 2025
