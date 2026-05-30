# Firebase Migration - Quick Start Guide

**Status:** ✅ COMPLETE  
**Version:** 1.0.0  
**Last Updated:** October 8, 2025

---

## 🚀 TL;DR - Executive Summary

We're migrating DualLing from **MongoDB Atlas** to **Firebase/GCP** to leverage:
- €250 GCP credit (3 months)
- Better scalability and real-time features
- Integrated authentication and storage
- Reduced operational overhead
- 20-30% cost savings post-credit

**Timeline:** 17 weeks (Q4 2025)  
**Risk Level:** Low (comprehensive rollback plan in place)

---

## 📚 Documentation Structure

Start here: [`/docs/MAIN.md`](./MAIN.md)

### Core Documents (Read in Order)
1. **[Current Architecture](./CURRENT_ARCHITECTURE.md)** - Where we are now (MongoDB)
2. **[Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)** - The master plan
3. **[MongoDB to Firestore Mapping](./MONGODB_TO_FIRESTORE_MAPPING.md)** - How data moves
4. **[GCP Services Architecture](./GCP_SERVICES_ARCHITECTURE.md)** - The target state
5. **[Firestore Security Rules](./FIRESTORE_SECURITY_RULES.md)** - Access control

---

## 🎯 Key Decisions Made

### Technology Choices
| Component | Current (MongoDB) | Future (Firebase/GCP) |
|-----------|-------------------|----------------------|
| **Database** | MongoDB Atlas | Cloud Firestore |
| **Auth** | Custom JWT | Firebase Authentication |
| **Storage** | Local/GridFS | Firebase Storage |
| **Backend** | Next.js API Routes | Next.js API + Cloud Functions |
| **Real-time** | Polling | Firestore Real-time Listeners |
| **Analytics** | None | Firebase Analytics |

### Why Firebase Over Alternatives?
- **vs PostgreSQL/Supabase:** Better real-time features, easier scaling, integrated ecosystem
- **vs AWS (DynamoDB/Cognito):** We have €250 GCP credit, Firebase SDK more intuitive
- **vs Staying with MongoDB:** Better pricing, integrated services, less maintenance

---

## 🗺️ Migration Phases Overview

```
Phase 1-2: Foundation & Auth (4 weeks)
  ├── Set up Firebase project
  ├── Migrate user authentication
  └── Test login/register flows

Phase 3-4: Data & APIs (4 weeks)
  ├── Migrate collections to Firestore
  ├── Refactor API routes
  └── Upload media to Storage

Phase 5-6: Frontend & Features (4 weeks)
  ├── Integrate Firebase SDK in frontend
  ├── Implement Cloud Functions
  └── Add real-time features

Phase 7-8: Testing & Launch (3 weeks)
  ├── Comprehensive testing
  ├── Production cutover
  └── Monitor and optimize

Phase 9-10: Stabilization & Cleanup (2 weeks)
  ├── Performance tuning
  └── Decommission MongoDB
```

---

## 💾 Data Migration Summary

### Collections Mapping

| MongoDB Collection | Firestore Path | Notes |
|-------------------|----------------|-------|
| `users` | `users/{userId}` | Use Firebase Auth UID as doc ID |
| `courses` | `courses/{courseId}` | Top-level collection |
| `lessons` | `courses/{courseId}/lessons/{lessonId}` | Subcollection |
| `enrollments` | `enrollments/{enrollmentId}` | Top-level for cross-user queries |
| `progress` | `users/{userId}/progress/{progressId}` | User subcollection |
| `quizzes` | `courses/{courseId}/lessons/{lessonId}/quizzes/{quizId}` | Deep subcollection |
| `sessions` | ❌ Removed | Firebase Auth handles sessions |

### Key Changes
- **ObjectId → Firebase UID:** User IDs now use Firebase Auth UIDs
- **Passwords Removed:** Handled by Firebase Authentication
- **Subcollections:** Lessons, quizzes nested under courses
- **Timestamps:** MongoDB ISODate → Firestore Timestamp
- **References:** ObjectId → DocumentReference

---

## 🔐 Security Model

### Role-Based Access Control (RBAC)

**User Roles:** `student`, `teacher`, `admin`

**Custom Claims in Firebase Auth:**
```typescript
{
  role: 'teacher',
  teacherVerified: true,
  isPremium: false
}
```

**Access Matrix:**

| Resource | Student | Teacher | Admin |
|----------|---------|---------|-------|
| Own profile | Read/Write | Read/Write | Full access |
| Other profiles | ❌ | ❌ | Read/Write |
| Published courses | Read | Read/Write own | Full access |
| Unpublished courses | ❌ | Read/Write own | Full access |
| Enrollments | Own only | Own courses | Full access |
| Progress | Own only | Own courses | Full access |

---

## 💰 Cost Breakdown

### Monthly Estimated Costs (Post-Credit)

```
Firestore:           €20  (1M reads, 500K writes, 50GB)
Firebase Auth:       €0   (Free up to 50K MAU)
Cloud Storage:       €15  (200GB + 1TB egress)
Cloud Functions:     €10  (2M invocations)
Cloud Run:           €5   (Minimal usage)
Monitoring/Logging:  €5   (Standard tier)
Cloud CDN:           €10  (500GB egress)
Miscellaneous:       €5   (Tasks, Scheduler)
─────────────────────────
Total:               €70/month
```

**Current MongoDB Cost:** €100-120/month  
**Savings:** €20-40/month (20-30%)

---

## 🛠️ Developer Quick Commands

### Local Development
```bash
# Start Firebase emulators
firebase emulators:start

# Run Next.js dev server (separate terminal)
npm run dev
```

### Testing
```bash
# Unit tests
npm run test

# Integration tests with emulators
npm run test:integration

# Security rules tests
firebase emulators:exec --only firestore "npm run test:rules"
```

### Deployment
```bash
# Deploy to staging
firebase use staging
firebase deploy

# Deploy to production
firebase use production
firebase deploy --only functions,firestore,storage
```

---

## 📋 Pre-Migration Checklist

### Technical Preparation
- [ ] Create Firebase project
- [ ] Link to GCP and activate €250 credit
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Authenticate: `firebase login`
- [ ] Initialize project: `firebase init`
- [ ] Set up emulators for local testing

### Data Preparation
- [ ] Export all MongoDB collections
- [ ] Count documents per collection (baseline)
- [ ] Backup MongoDB to external storage
- [ ] List all media files (for Storage migration)
- [ ] Document API endpoints (for refactoring)

### Team Preparation
- [ ] Review migration timeline with stakeholders
- [ ] Schedule maintenance windows
- [ ] Prepare user communication (email template)
- [ ] Set up monitoring dashboards
- [ ] Assign roles (technical lead, tester, PM)

---

## 🚨 What Could Go Wrong?

### Risk Assessment

**High Impact, Low Probability:**
- **Data loss during migration**
  - *Mitigation:* Test with sample data first, keep MongoDB backup
- **Authentication issues blocking users**
  - *Mitigation:* Parallel run both systems, gradual rollout

**Medium Impact, Medium Probability:**
- **Cost overrun (exceed €250 credit)**
  - *Mitigation:* Daily cost monitoring, budget alerts at 80%
- **Performance degradation**
  - *Mitigation:* Load testing before cutover, query optimization

**Low Impact, High Probability:**
- **Minor bugs in new Firebase integration**
  - *Mitigation:* Comprehensive testing phase, beta user testing

---

## 🔄 Rollback Plan

If critical issues arise within 30 days:

1. **Immediate (< 1 hour):**
   - Switch DNS/routing back to MongoDB
   - MongoDB kept in read-only mode as backup

2. **Short-term (1-7 days):**
   - Identify and fix Firebase issues
   - Re-sync any new data from Firebase → MongoDB

3. **Long-term (> 7 days):**
   - If migration deemed unsuccessful, maintain MongoDB
   - Archive Firebase data, cancel GCP services

---

## 📞 Support & Resources

### Internal
- **Technical Lead:** ZenType Architect (J)
- **Documentation:** `/docs/MAIN.md`
- **Slack Channel:** #firebase-migration

### External
- **Firebase Support:** https://firebase.google.com/support
- **GCP Support:** https://cloud.google.com/support
- **Community:** Firebase Discord, Stack Overflow

---

## ✅ Next Steps (For You)

1. **Read the Core Documents** (in order listed above)
2. **Review the Migration Timeline** in [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
3. **Understand Data Mapping** in [MongoDB to Firestore Mapping](./MONGODB_TO_FIRESTORE_MAPPING.md)
4. **Ask Questions** about anything unclear
5. **Get Approval** from stakeholders to proceed

---

## 🎓 Learning Resources

### Firebase Fundamentals
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions Quickstart](https://firebase.google.com/docs/functions/get-started)

### Migration Best Practices
- [Migrate from MongoDB to Firestore](https://firebase.google.com/docs/firestore/solutions/migrate-mongodb)
- [GCP Migration Center](https://cloud.google.com/migration-center)

---

## 📝 Glossary

- **Firestore:** Google's NoSQL cloud database (like MongoDB but with real-time sync)
- **Cloud Functions:** Serverless backend code (like AWS Lambda)
- **Firebase Auth:** User authentication service (replaces our custom JWT)
- **Storage Bucket:** Cloud file storage (like AWS S3)
- **Custom Claims:** Metadata attached to user tokens (for roles)
- **Composite Index:** Database index on multiple fields for fast queries
- **Security Rules:** Firestore's access control language

---

**Document Owner:** ZenType Architect (J)  
**Purpose:** Onboarding and quick reference for migration team  
**Status:** Living document - will be updated as migration progresses
