# 🏠 DualLing Internal Knowledge Base (IKB)

**Version:** 2.0 - **Reorganized & IKB Compliant**  
**Last Updated:** November 11, 2025  
**Project:** DualLing - Dual Language Learning Platform  
**Status:** ✅ Phase 4 Active - Core Features 75% Complete

---

## 🔍 **HOW TO USE THIS IKB**

### **For Developers:**
1. **Navigation:** Use the **Table of Contents** below to find your feature area
2. **Locate Docs:** Click links to open docs in feature-specific folders
3. **Understand Context:** Read `.scope.md` for boundaries, `.current.md` for status, `.errors.md` for known issues
4. **Work Within Scope:** Always check 99% Certainty Rule before making changes

### **For AI Assistants (ZenType Architect):**
1. **Read-First Protocol:** Always start with MAIN.md (you are here!)
2. **Navigate to Feature:** Use links below to locate relevant feature documentation
3. **Read Feature Docs:** In this order: `.prd.md` → `.scope.md` → `.current.md` → `.errors.md`
4. **Work Safely:** 99% Certainty Rule is non-negotiable - check scope boundaries before every change
5. **Write-Back Mandate:** Update `.current.md` after completing work, then update MAIN.md

---

## 📚 **TABLE OF CONTENTS**

### 🎯 **Quick Navigation**
- **New Here?** → [Quick Start Guide](./quick-start/) - Read QUICK_START.md first
- **Ready to Build?** → [Architecture Overview](./architecture/) - Understand the system
- **Something Broken?** → [Reference Docs](./reference/) - Check PENDING_TASKS.md for known issues
- **Deploying to Prod?** → [Deployments Guide](./deployments/) - PRODUCTION_DEPLOYMENT_GUIDE.md

---

## 🔥 **Active Features & Bug Fixes**

### 🐛 **Phase 5: Critical Bug Fixes** - ✅ **COMPLETE**
📁 [**phase-5-critical-fixes/**](./phase-5-critical-fixes/)
- **Status:** ✅ Closed - All Issues Verified Working (No Fixes Needed)
- **Priority:** P0 - Critical (blocking teacher workflows) → RESOLVED
- **Time Spent:** 1 hour (verification only)
- **Key Files:**
  - `phase-5-critical-fixes.prd.md` - Original requirements & investigation
  - `phase-5-critical-fixes.scope.md` - 99% Certainty boundaries & safety rules
  - `phase-5-critical-fixes.current.md` - Verification results & evidence

**Issues Verified:**
1. ✅ **Recurring Class Bug** - RESOLVED (daysOfWeek calculation fixed)
2. ✅ **Instant Meeting Enrollment** - Working correctly (status filtering by design)
3. ✅ **Teacher Recent Activity** - Already implemented and working
4. ✅ **Lesson Count Consistency** - All pages show matching counts

### 🐛 **Legacy Issue Tracking (Being Migrated to Phase 5)**
1. **[Recurring Class Booking Bug](./recurring-class-bug/)** - ✅ **RESOLVED**
   - **Issue:** Biweekly recurrence fails with "daysOfWeek missing"
   - **Status:** Fixed in production (daysOfWeek auto-calculated)

2. **[Instant Meeting Enrollment Issue](./instant-meeting-issue/)**
   - **Issue:** Students show "not enrolled" error in instant meetings
   - **Status:** Migrated to Phase 5 with comprehensive fix plan

---

## 🚀 **Feature Documentation by Category**

### 🤖 **AI & Automation**
📁 [**ai-chatbot/**](./ai-chatbot/)
- **Feature:** Teacher AI Course & Lesson Creation Assistant
- **Status:** ✅ v1.1.0 Production Ready | 📋 v2.0 Planning Phase
- **Key Files:**
  - `TEACHER_CHATBOT_PRD.md` - Product requirements
  - `TEACHER_CHATBOT_IMPLEMENTATION.md` - Backend + frontend implementation
  - `AI_CHATBOT_V2_PLANNING.md` - **NEW**: v2 improvements & API key migration
  - `AI_CHATBOT_OPTIMIZATION_PRD_REFINED.md` - Firebase-validated optimization strategies
  - `AI_CHATBOT_BATCH_FIX.md` - Critical batch lesson creation fix
  - `AI_CHATBOT_PERFORMANCE_FIX.md` - Timeout handling & 50% speed boost
  - `AI_CHATBOT_INTEGRATION_QUESTIONNAIRE.md` - Architecture analysis
- **Includes:** Gemini 2.5 Flash, GoogleAIBackend, real-time chat, function calling, Firebase AI Logic
- **Recent:** API key migrated to Tier 1 (higher rate limits), v2 planning in progress

### 🎓 **Teacher Features**
📁 [**teacher-course-editing/**](./teacher-course-editing/)
- **Feature:** Comprehensive Course Editing Interface
- **Status:** ✅ Phase 2 Complete (Metadata, Preview, Reorder)
- **Key Files:**
  - `TEACHER_COURSE_EDITING_FEATURE.md` - Phase 1 (metadata editing)
  - `TEACHER_COURSE_EDITING_PHASE2_SCOPE.md` - Phase 2 (preview & reorder)
  - `TEACHER_COURSE_EDITING_COMPLETE_SUMMARY.md` - Full implementation
- **Includes:** Title/description editing, publish/unpublish, preview mode, lesson reordering

📁 [**teacher-student-management/**](./teacher-student-management/)
- **Feature:** Student Management & Course Deletion
- **Status:** ✅ Complete
- **Key Files:**
  - `TEACHER_STUDENT_MANAGEMENT_PAGE.md` - Centralized student view
  - `STUDENT_MANAGEMENT_COMPLETE.md` - Per-course student management
  - `TEACHER_COURSE_DELETION_COMPLETE.md` - Safe course deletion
  - `TEACHER_COURSE_DELETE_AND_STUDENT_MANAGEMENT.md` - Scope & safety
- **Includes:** View all students, remove enrollments, delete courses with safety checks

📁 [**course-management/**](./course-management/)
- **Feature:** Course Viewing, Navigation, Enrollment
- **Status:** ✅ Core Features Working
- **Key Files:**
  - `COURSE_ENROLLMENT_UX_FIX.md` - Enrollment flow improvements
  - `DASHBOARD_NAVIGATION_FIX.md` - Dashboard course navigation
  - `DASHBOARD_THEME_ISSUE.md` - Theme & styling fixes
  - `CLASS_SYSTEM_IMPLEMENTATION_PLAN.md` - Phase 4 class system blueprint
  - `teacher-classes-filtering-feature.md` - Classes filtering
- **Includes:** Course listing, preview pages, enrollment system, dashboard integration

### 👥 **User Features**
📁 [**profile-system/**](./profile-system/)
- **Feature:** User Profile Management
- **Status:** ✅ Complete with Real Firestore Data
- **Key Files:**
  - `PROFILE_IMPLEMENTATION.md` - Profile page with editable fields
- **Includes:** Name, bio, role-based stats, subscription info, achievements

📁 [**authentication/**](./authentication/)
- **Feature:** Firebase Authentication System
- **Status:** ✅ Fixed & Production Ready
- **Key Files:**
  - `AUTHENTICATION_ISSUE.md` - Previous issues & debugging
  - `AUTHENTICATION_FIX_SUMMARY.md` - Complete fix documentation
  - `FIREBASE_AUTH_SYSTEM.md` - Auth architecture
- **Includes:** JWT tokens, role claims, token refresh, RBAC

### 📚 **Content Management**
📁 [**lessons-and-content/**](./lessons-and-content/)
- **Feature:** Lesson Management, Quiz System, Reading Content
- **Status:** ✅ Core Features Complete
- **Key Files:**
  - `LESSON_MANAGEMENT_SYSTEM.md` - Full CRUD API for lessons
  - `LESSON_NAVIGATION_SIDEBAR_UPDATE.md` - Improved lesson navigation
  - `LESSON_PLAYER_API_FIX.md` - Fixed lesson viewer API issues
  - `QUIZ_RENDERING_AND_STYLING_FIX_OCT_22.md` - Quiz display & validation
- **Includes:** Video lessons, reading content, quizzes, exercises, progress tracking

📁 [**pdf-integration/**](./pdf-integration/)
- **Feature:** PDF & Document Upload/Download/Preview
- **Status:** ✅ Complete & Production Deployed
- **Key Files:**
  - `PDF_INTEGRATION_COMPLETE.md` - Deployment status & verification
  - `PDF_INTEGRATION_SUMMARY.md` - Feature overview
  - `PDF_DOCUMENT_INTEGRATION_RESEARCH.md` - Research & analysis
  - `PDF_INTEGRATION_SCOPE_AND_SAFETY.md` - Boundaries & security
- **Includes:** File upload, signed URLs, preview with Google Docs Viewer, 1-year expiry

📁 [**video-and-media/**](./video-and-media/)
- **Feature:** Video Attribution & Media Management
- **Status:** ✅ Complete
- **Key Files:**
  - `VIDEO_ATTRIBUTION_SYSTEM.md` - YouTube creator attribution
- **Includes:** Video source tracking, creator credit, external link display

### 🔧 **Infrastructure & DevOps**
📁 [**deployments/**](./deployments/)
- **Feature:** Production Deployment & Infrastructure
- **Status:** ✅ Production Live
- **Key Files:**
  - `PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment checklist & best practices
  - `FIREBASE_APP_HOSTING_DEPLOYMENT_FIX.md` - App Hosting setup
  - `LTUS_PROD_BACKEND_SETUP.md` - Production backend configuration
  - `DEPLOYMENT_SUMMARY_OCT22.md` - Deployment history & logs
  - `PRODUCTION_HOTFIX_OCT22.md` - Production hotfix procedures
- **Includes:** Firebase App Hosting, IAM setup, GitHub integration, health checks

📁 [**firebase/**](./firebase/)
- **Feature:** Firebase & Firestore Configuration
- **Status:** ✅ Complete
- **Key Files:**
  - `FIRESTORE_INDEX_SETUP.md` - Firestore composite index configuration
  - `FIRESTORE_SECURITY_RULES.md` - Security rules with RBAC
- **Includes:** Firestore schema, rules, indexes, performance optimization

📁 [**gcp-services/**](./gcp-services/)
- **Feature:** Google Cloud Platform Integration & Logging
- **Status:** ✅ Phase 1 Complete (GCP Trace Compliance)
- **Key Files:**
  - `GCP_SERVICES_ARCHITECTURE.md` - Complete GCP services plan
  - `GCP_TRACE_PHASE1_COMPLETE.md` - Trace system compliance achieved
  - `GCP_TRACE_COMPLIANCE_ANALYSIS.md` - Format compliance analysis
  - `CLOUD_LOGGING_INTEGRATION.md` - Structured JSON logging
  - `TRACE_SYSTEM_SUMMARY.md` - Trace system overview
- **Includes:** Cloud Logging, Trace, structured JSON logs, trace correlation

📁 [**iam-permissions/**](./iam-permissions/)
- **Feature:** Google Cloud IAM & Permissions Management
- **Status:** ✅ Fixed & Production Ready
- **Key Files:**
  - `IAM_PERMISSION_FIX_COMPLETE_SUMMARY.md` - Complete analysis & fix
  - `IAM_PERMISSION_FIX_RESOLVED.md` - Resolution confirmation
  - `WHATS_NEXT_AFTER_IAM_FIX.md` - Post-fix development priorities
- **Includes:** Service account roles, GCP permissions, Cloud Run access

### 🎨 **UI & Design**
📁 [**ui-improvement/**](./ui-improvement/)
- **Feature:** Modern Platform Rebranding & UI Redesign
- **Status:** 📋 Planning Complete - Awaiting Implementation
- **Key Files:**
  - `ui-improvement.prd.md` - 10-phase implementation plan
  - `ui-improvement.scope.md` - Boundaries enforcing 99% Certainty Rule
  - `ui-improvement.current.md` - Implementation progress tracker
  - `REBRANDING-CHECKLIST.md` - DualLing → Step by Step Language Studio
  - `COMPONENT-SELECTION.md` - @21st-dev/magic research findings
  - `UI_DEVELOPMENT_GUIDE.md` - Design system & components
- **Includes:** Modern navigation, gradient backgrounds, professional dashboards, responsive design

### 🐛 **Debug & Development**
📁 [**debug-system/**](./debug-system/)
- **Feature:** Integrated Logging & Debug Panel
- **Status:** ✅ Complete
- **Key Files:**
  - `DEBUG_SYSTEM.md` - Debug panel architecture & usage
  - `DEBUG_TOOLS_REMOVAL_COMPLETE.md` - Cleanup documentation
  - `UI_CLEANUP_COMPLETE.md` - UI refinement summary
- **Includes:** Real-time log viewer, level filtering, log export, keyboard shortcuts

### 📊 **Collaboration Tools**
📁 [**google-meet-calendar/**](./google-meet-calendar/)
- **Feature:** Google Meet & Calendar Integration
- **Status:** ⏸️ **BLOCKED** - Awaiting Google API Keys
- **Key Files:**
  - `google-meet-calendar.prd.md` - Complete product requirements
  - `google-meet-calendar.scope.md` - Implementation boundaries (99% Certainty)
  - `google-meet-calendar.current.md` - Phase 5.1-5.3 implementation status
  - `google-meet-calendar-summary.md` - Quick reference guide
- **Includes:** OAuth 2.0, Calendar API, Meet link generation, Class scheduling, Recording management
- **Phases:** Phase 5.1 OAuth ✅ | Phase 5.2 Class Backend ✅ | Phase 5.3 UI Components ✅ | Phase 5.4 Recording Management ⏳

---

## 📚 **Foundation & Architecture**

### 📖 **Getting Started**
📁 [**quick-start/**](./quick-start/)
- `QUICK_START.md` - First time setup guide (read this!)
- `QUICK_FIX.md` - Common quick fixes
- `QUICK_SUMMARY.md` - Project summary
- `START_HERE_NEXT_SESSION.md` - Session handoff template

📁 [**reference/**](./reference/)
- `ACTION_PLAN.md` - Development roadmap & immediate tasks
- `PENDING_TASKS.md` - Known issues & upcoming work
- `PROJECT_STATUS_OCT_17_2025.md` - Latest status report
- `SESSION_HANDOFF_OCT_9_2025.md` - Previous session notes
- `SESSION_SUMMARY_OCT_22_2025.md` - Session summary template

### 🏗️ **System Architecture**
📁 [**architecture/**](./architecture/)
- `CURRENT_ARCHITECTURE.md` - System design overview
- `FIREBASE_MIGRATION_STRATEGY.md` - MongoDB → Firebase transition plan
- `MONGODB_TO_FIRESTORE_MAPPING.md` - Data model mapping guide
- `SERVERLESS_ARCHITECTURE.md` - Serverless design patterns
- `FIREBASE_AI_CONSULTATION_SESSION.md` - AI integration planning
- `FIREBASE_AI_IMPLEMENTATION_ANALYSIS.md` - AI implementation details

### 🔧 **Setup & Configuration**
📁 [**setup/**](./setup/)
- `PRD.md` - Main product requirements document
- `README.md` - Project readme
- `API_VERIFICATION_REPORT.md` - API endpoint verification
- `ARD.md` - Architecture requirements document
- `CSS_BEST_PRACTICES.md` - CSS guidelines & patterns
- `ERRORS_FIXED.md` - Historical error fixes
- `HYDRATION_FIX.md` - SSR/hydration fixes
- `MONGODB_REMOVAL_AND_AUTH_FIX.md` - Migration completion notes

### 📋 **Phase Reports**
📁 [**phase-reports/**](./phase-reports/)
- `PHASE_2_SUMMARY.md` - Phase 2 completion summary
- `PHASE_3_IMPLEMENTATION_PLAN.md` - Phase 3 detailed plan
- `PHASE_3_STATUS_AND_TESTING.md` - Phase 3 progress & testing
- `PHASE_4_EXECUTIVE_SUMMARY.md` - Phase 4 overview for stakeholders
- `PHASE_4_QUICK_START.md` - Phase 4 day-by-day execution guide
- `PHASE_4_WEEK1_DAY1_REPORT.md` - Daily progress tracking
- `PHASE_4_WEEK1_DAY2_REPORT.md` - Daily progress tracking
- `PHASE_4_WEEK1_DAY3_REPORT.md` - Daily progress tracking

### Already Organized (Pre-existing)
📁 [**production-deployment/**](./production-deployment/)
📁 [**instant-meeting-issue/**](./instant-meeting-issue/)
📁 [**recurring-class-bug/**](./recurring-class-bug/)

---

## 🔐 **Security & Compliance**

All security-critical information documented in scope files:
- **Authentication:** See `authentication/` folder
- **IAM Permissions:** See `iam-permissions/` folder  
- **Firestore Rules:** See `firebase/FIRESTORE_SECURITY_RULES.md`
- **PDF Signed URLs:** See `pdf-integration/PDF_INTEGRATION_SCOPE_AND_SAFETY.md`

---

## 🔗 **Cross-Feature Dependencies**

### **Critical Dependencies Map**
- **Authentication** → Required for all features (profile, courses, lessons, teacher tools)
- **Firestore** → Data layer for all features (courses, lessons, enrollments, progress)
- **Firebase Storage** → PDF & media storage, teacher resources
- **GCP Logging** → Observability for all features (debug, performance, errors)
- **Google OAuth** → Required for calendar & Meet integration
- **AI Chatbot** → Depends on Gemini 2.0, Firebase AI Logic, course creation APIs
- **Class System** → Depends on enrollment system, calendar integration, notifications

### **When Making Changes:**
1. Check scope file for affected features
2. Read `.current.md` of dependent features  
3. Run relevant Playwright MCP tests after changes
4. Update MAIN.md if dependencies changed

---

## 📊 **Project Status Summary**

| Component | Status | Last Updated |
|-----------|--------|--------------|
| **Authentication** | ✅ Complete | Oct 19, 2025 |
| **Course Management** | ✅ Complete | Oct 26, 2025 |
| **Lesson System** | ✅ Complete | Oct 22, 2025 |
| **Quiz System** | ✅ Complete | Oct 22, 2025 |
| **Teacher Dashboard** | ✅ Complete | Oct 26, 2025 |
| **Student Dashboard** | ✅ Complete | Oct 20, 2025 |
| **AI Chatbot** | ✅ v1.1.0 Stable, 📋 v2.0 Planning | Nov 11, 2025 |
| **PDF Integration** | ✅ Complete | Oct 26, 2025 |
| **Profile System** | ✅ Complete | Oct 26, 2025 |
| **Google Meet Integration** | ⏳ Phases 5.1-5.3 Done, 5.4 Pending | Oct 30, 2025 |
| **GCP Logging** | ✅ Phase 1 Complete | Oct 30, 2025 |
| **UI Improvement** | 📋 Planning Phase | TBD |
| **Phase 5 Bug Fixes** | ✅ Complete (All Issues Working) | Nov 19, 2025 |

**Overall Progress:** ~80% Complete (Phase 4 active, Phase 5 verified, core features stable)

---

## 🔄 **IKB Maintenance**

### **When Creating New Features:**
1. Create folder: `/docs/[feature-name]/`
2. Create docs:
   - `[feature-name].prd.md` - Product requirements
   - `[feature-name].scope.md` - Boundaries & 99% Rule
   - `[feature-name].current.md` - Status & progress
   - `[feature-name].errors.md` - (Optional) Error history
3. Update MAIN.md → Add to table of contents with links
4. Update main.md → Add to "Recent Changes Log" entry

### **When Fixing Bugs:**
1. Locate feature folder
2. Document in `.current.md` → "Known Issues" section
3. After fix: Add to `.errors.md` with solution steps
4. Update MAIN.md → "Recent Changes Log" entry
5. Run Playwright MCP tests to verify no regressions

### **Last Audit:** November 11, 2025  
**Next Audit Due:** November 18, 2025

---

## 🚨 **Important Rules**

### **The 99% Certainty Rule** ⚠️
Before making ANY change, you must be 99% certain it won't break existing functionality:
1. Read the feature's `scope.md` file
2. Check `current.md` for sensitive areas marked HIGH RISK or MEDIUM RISK
3. Verify no other features depend on changed code (check "Cross-Feature Dependencies" above)
4. Test with Playwright MCP after implementation
5. If in doubt, ask before proceeding

### **Logging & Observability** 📊
All new features must include:
- Structured JSON logging (never plain console.log)
- Span-based performance tracking (traceId, spanId, duration)
- Context propagation (distributed tracing)
- Error logging before throwing exceptions

### **Client-Side Validation** ✅
Prevent 80% of errors BEFORE they reach the backend:
- Real-time feedback (password strength, email format, etc.)
- Prevent impossible states (disable conflicting options)
- File upload validation (size, type, format)
- Form field requirements with progressive disclosure

---

## 📞 **Need Help?**

1. **First Time?** → Read `quick-start/QUICK_START.md`
2. **Something Broken?** → Check `reference/PENDING_TASKS.md`
3. **Looking for a Feature?** → Use the **TABLE OF CONTENTS** above
4. **Need API Docs?** → See `setup/API_VERIFICATION_REPORT.md`
5. **Debugging Production?** → See `deployments/` folder

---

**Status:** ✅ IKB Reorganized & Indexed  
**Reorganization Date:** November 11, 2025  
**Organization Method:** Smart Folder Structure (no file renaming, proper indexing)  
**All Docs:** 25 folders, ~130 files total (1 at root: MAIN.md)
