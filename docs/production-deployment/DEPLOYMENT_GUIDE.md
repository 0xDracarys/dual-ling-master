# Firebase App Hosting - Production Deployment Guide

**Project:** DualLing  
**Backend:** ltus-prod  
**Region:** europe-west4  
**Branch:** master (auto-deploy)  
**Last Updated:** November 9, 2025

---

## Quick Start

### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Authenticated: `firebase login`
- Project selected: `firebase use paji-duolingo`

### Deploy to Production
```bash
# 1. Test build locally FIRST (mandatory)
pnpm build

# 2. If build passes, commit changes
git add -A
git commit -m "feat: your feature description"

# 3. Push to master (triggers auto-deploy)
git push origin master

# 4. Monitor deployment (optional)
firebase apphosting:backends:list
```

**Production URL:** https://ltus-prod--paji-duolingo.europe-west4.hosted.app

---

## Build Configuration

### apphosting.yaml
```yaml
runConfig:
  cpu: 1
  memoryMiB: 512
  maxInstances: 100
  minInstances: 0
  concurrency: 80

env:
  - variable: GOOGLE_CLOUD_PROJECT
    value: paji-duolingo
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    secret: FIREBASE_API_KEY
  # ... (other Firebase config variables)
```

**Key Settings:**
- **CPU:** 1 vCPU per instance
- **Memory:** 512 MiB (runtime) - Build uses 4GB (configured in package.json)
- **Auto-scaling:** 0 to 100 instances based on traffic
- **Concurrency:** 80 requests per instance

### package.json Build Script
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

**Why 4GB Heap?**
- Next.js build with 912 packages requires ~3GB peak memory
- Default 2GB heap causes "JavaScript heap out of memory" errors
- 4GB provides safe buffer for complex builds

### tsconfig.json
```json
{
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "scripts"]
}
```

**Why Exclude Scripts?**
- Utility scripts (`scripts/migrate-users.ts`) use packages not in production dependencies
- Prevents "Cannot find module 'mongodb'" errors during build
- Scripts are run manually via Node.js, not compiled by Next.js

### next.config.js
```javascript
webpack: (config, { isServer }) => {
  // Exclude server-only Node.js modules from client bundle
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      async_hooks: false,
    };
  }
  return config;
}
```

**Why This Matters:**
- `async_hooks` is Node.js server-only module
- Without this, build fails: "Can't resolve 'async_hooks'"
- Client bundle doesn't need server tracing utilities

---

## Deployment Workflow

### Automatic Deployment (Recommended)
```bash
# Any push to master triggers auto-deploy
git push origin master

# Firebase App Hosting automatically:
# 1. Clones repository
# 2. Installs dependencies (pnpm install --frozen-lockfile)
# 3. Builds application (pnpm build)
# 4. Deploys to Cloud Run
# 5. Updates live production URL
```

**Deployment Timeline:**
- **FETCHSOURCE:** ~10 seconds (clone repo)
- **preparer:** ~5 seconds (configure env vars)
- **pack:** ~3-4 minutes (install + build)
- **deploy:** ~30 seconds (push to Cloud Run)
- **Total:** ~4-5 minutes from push to live

### Manual Deployment (Advanced)
```bash
# Option 1: Force redeploy from CLI
firebase apphosting:backends:update ltus-prod --location=europe-west4

# Option 2: Rollback to previous build
firebase apphosting:rollouts:list ltus-prod --location=europe-west4
firebase apphosting:rollouts:promote <rollout-id>
```

---

## Pre-Deployment Checklist

### 1. Test Build Locally ✅
```bash
# MANDATORY before pushing to production
pnpm build

# Expected output:
# ✓ Compiled successfully
# ✓ Checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages (XX/XX)
# ✓ Finalizing page optimization
```

**Why This Matters:**
- Production build catches errors local dev server misses
- TypeScript checks ALL files (not just imported ones)
- Prevents failed deployments and wasted build time

### 2. Check for Legacy Imports ✅
```bash
# Search for any MongoDB imports in production code
grep -r "from 'mongodb'" app/
grep -r "from 'mongoose'" app/

# Search for bcrypt (should use Firebase Auth)
grep -r "from 'bcryptjs'" app/

# Should return NO results
```

### 3. Verify Environment Variables ✅
```bash
# Check all required secrets are in apphosting.yaml
grep "secret:" apphosting.yaml

# Verify secrets exist in Google Secret Manager
firebase apphosting:secrets:list
```

### 4. Update Dependencies (if needed) ✅
```bash
# Update package.json
pnpm update

# Regenerate lockfile
pnpm install

# Commit lockfile
git add pnpm-lock.yaml
git commit -m "chore: update dependencies"
```

**⚠️ CRITICAL:** Always commit `pnpm-lock.yaml` after package changes. Production uses `--frozen-lockfile` mode.

---

## Common Build Errors & Solutions

### Error: "Cannot find module 'X' or its corresponding type declarations"

**Cause:** Package removed from `package.json` but code still imports it

**Solution:**
```bash
# Find all files importing the package
grep -r "from 'package-name'" .

# Remove imports or delete files
rm path/to/legacy-file.ts

# Test build locally
pnpm build
```

### Error: "JavaScript heap out of memory"

**Cause:** Build process exceeded Node.js memory limit

**Solution:** Already fixed via `NODE_OPTIONS='--max-old-space-size=4096'` in `package.json`

If error persists:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=8192' next build"
  }
}
```

### Error: "Lockfile is not up to date with package.json"

**Cause:** `package.json` changed but `pnpm-lock.yaml` not regenerated

**Solution:**
```bash
# Regenerate lockfile
pnpm install

# Commit updated lockfile
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
git push
```

### Error: "useSearchParams() should be wrapped in a suspense boundary"

**Cause:** Next.js 15 requires `useSearchParams()` in Suspense for SSR/static export

**Solution:**
```typescript
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PageContent() {
  const searchParams = useSearchParams();
  // ... component logic
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContent />
    </Suspense>
  );
}
```

### Error: "Can't resolve 'async_hooks'"

**Cause:** Server-only module bundled for client

**Solution:** Already fixed in `next.config.js` webpack config. If error persists, add module to fallback:
```javascript
config.resolve.fallback = {
  ...config.resolve.fallback,
  async_hooks: false,
  fs: false,  // Add other server-only modules
  net: false,
  tls: false,
};
```

---

## Monitoring & Debugging

### View Build Logs
```bash
# Latest build logs
firebase apphosting:backends:describe ltus-prod --location=europe-west4

# Specific build logs (get build ID from Firebase Console)
gcloud builds log <build-id> --project=paji-duolingo
```

### View Runtime Logs
```bash
# Cloud Logging - last 1 hour
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=ltus-prod" \
  --project=paji-duolingo \
  --limit=50 \
  --format=json
```

### Health Check
```bash
# Test production endpoint
curl https://ltus-prod--paji-duolingo.europe-west4.hosted.app/api/health

# Expected response:
# {"status":"healthy","timestamp":"2025-11-09T..."}
```

### Performance Monitoring
- **Firebase Console:** https://console.firebase.google.com/project/paji-duolingo/apphosting
- **Cloud Run Console:** https://console.cloud.google.com/run?project=paji-duolingo
- **Cloud Logging:** https://console.cloud.google.com/logs?project=paji-duolingo

---

## Rollback Procedure

### If Deployment Fails

**Option 1: Fix Forward (Recommended)**
```bash
# 1. Identify error in build logs
firebase apphosting:backends:describe ltus-prod --location=europe-west4

# 2. Fix locally and test
pnpm build

# 3. Commit and push fix
git commit -am "fix: resolve build error"
git push origin master
```

**Option 2: Rollback to Previous Version**
```bash
# 1. List recent deployments
firebase apphosting:rollouts:list ltus-prod --location=europe-west4

# 2. Promote previous rollout
firebase apphosting:rollouts:promote <previous-rollout-id>

# 3. Confirm rollback
curl https://ltus-prod--paji-duolingo.europe-west4.hosted.app/api/health
```

### If Runtime Errors Occur

**Immediate Actions:**
1. Check Cloud Logging for error stack traces
2. Verify Firebase Auth is working
3. Check Firestore connection
4. Test Google Calendar API integration

**Emergency Rollback:**
```bash
# Rollback to last known good deployment
firebase apphosting:rollouts:list ltus-prod --location=europe-west4
firebase apphosting:rollouts:promote <last-good-rollout-id>
```

---

## Architecture Overview

### Technology Stack
- **Framework:** Next.js 15.2.4 (App Router)
- **Runtime:** Node.js 22.21.0
- **Package Manager:** pnpm v10.20.0
- **Hosting:** Firebase App Hosting (Cloud Run)
- **Database:** Firestore (NoSQL)
- **Authentication:** Firebase Authentication
- **External APIs:** googleapis (Calendar, Drive, Meet)

### Deployment Pipeline
```
GitHub (master branch)
    ↓ git push
Firebase App Hosting
    ↓ clone repo
Build Environment
    ├─ pnpm install --frozen-lockfile
    ├─ NODE_OPTIONS='--max-old-space-size=4096' pnpm build
    └─ Next.js production build
    ↓ success
Cloud Run (europe-west4)
    ├─ Auto-scaling: 0-100 instances
    ├─ Memory: 512 MiB per instance
    └─ Concurrency: 80 requests/instance
    ↓ live
Production URL
    https://ltus-prod--paji-duolingo.europe-west4.hosted.app
```

### IAM Permissions (Service Account)
- **Account:** `firebase-app-hosting-compute@paji-duolingo.iam.gserviceaccount.com`
- **Roles:**
  - Service Usage Consumer (API access)
  - Firebase Admin SDK Administrator (Firebase operations)
  - Storage Object Admin (file uploads)
  - Vertex AI User (AI features)
  - Logging Log Writer (Cloud Logging)
  - Cloud Trace Agent (distributed tracing)
  - Service Account Token Creator (signed URLs)

---

## Best Practices

### 1. Always Test Locally First
```bash
# Before EVERY push to master:
pnpm build
```

### 2. Keep Lockfile in Sync
```bash
# After ANY package.json change:
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

### 3. Use Semantic Commit Messages
```bash
git commit -m "feat: add new feature"        # New feature
git commit -m "fix: resolve bug"             # Bug fix
git commit -m "chore: update dependencies"   # Maintenance
git commit -m "docs: update README"          # Documentation
git commit -m "refactor: improve code"       # Code improvement
```

### 4. Monitor After Deployment
```bash
# Wait 5 minutes after deployment, then check:
# 1. Health endpoint
curl https://ltus-prod--paji-duolingo.europe-west4.hosted.app/api/health

# 2. Cloud Logging for errors
gcloud logging read "severity>=ERROR" --limit=20 --project=paji-duolingo

# 3. Test critical user flows (login, course enrollment, etc.)
```

### 5. Clean Up Legacy Code Regularly
- Review `lib/` directory quarterly
- Remove unused dependencies
- Delete legacy files not imported by production code
- Run security audits: `pnpm audit`

---

## Troubleshooting Decision Tree

```
Deployment Failed?
    │
    ├─ Build Phase (Step #2: pack)
    │   │
    │   ├─ "Cannot find module 'X'"
    │   │   └─ Search for imports: grep -r "from 'X'" .
    │   │       ├─ Found in production code → Install package
    │   │       └─ Found in legacy code → Delete legacy file
    │   │
    │   ├─ "JavaScript heap out of memory"
    │   │   └─ Increase heap size in package.json build script
    │   │
    │   ├─ "Lockfile not up to date"
    │   │   └─ Run pnpm install, commit lockfile
    │   │
    │   └─ TypeScript errors
    │       └─ Fix locally with pnpm build, commit fixes
    │
    └─ Runtime Errors (After Deployment)
        │
        ├─ Authentication failing
        │   └─ Check Firebase Auth config in apphosting.yaml
        │
        ├─ Database errors
        │   └─ Verify Firestore security rules and IAM permissions
        │
        ├─ API errors (500)
        │   └─ Check Cloud Logging for stack traces
        │
        └─ Performance issues
            └─ Monitor Cloud Run metrics, increase instances if needed
```

---

## Quick Reference

### Key Files
- `apphosting.yaml` - Firebase App Hosting configuration
- `package.json` - Build script with 4GB heap
- `tsconfig.json` - Exclude scripts directory
- `next.config.js` - Webpack config for server-only modules
- `pnpm-lock.yaml` - Dependency lockfile (MUST be committed)

### Key Commands
```bash
# Test build locally
pnpm build

# Deploy to production
git push origin master

# View build status
firebase apphosting:backends:describe ltus-prod --location=europe-west4

# View runtime logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Rollback deployment
firebase apphosting:rollouts:promote <rollout-id>
```

### Key URLs
- **Production:** https://ltus-prod--paji-duolingo.europe-west4.hosted.app
- **Firebase Console:** https://console.firebase.google.com/project/paji-duolingo/apphosting
- **Cloud Run Console:** https://console.cloud.google.com/run?project=paji-duolingo
- **IAM Console:** https://console.cloud.google.com/iam-admin/iam?project=paji-duolingo

---

## Support & Resources

### Documentation
- Firebase App Hosting: https://firebase.google.com/docs/app-hosting
- Next.js Deployment: https://nextjs.org/docs/deployment
- Cloud Run: https://cloud.google.com/run/docs

### Internal Documentation
- `DEPLOYMENT_ERRORS.md` - Complete error history (Builds #1-#6)
- `FIREBASE_APP_HOSTING_DEPLOYMENT_FIX.md` - Initial setup guide
- `GCP_SERVICES_ARCHITECTURE.md` - Architecture overview

### Contact
- **Firebase Support:** https://firebase.google.com/support
- **GitHub Issues:** https://github.com/mantassteckis/dual-ling/issues

---

**Last Updated:** November 9, 2025  
**Status:** ✅ Production Deployment Successful  
**Next Review:** Monthly (or after major dependency updates)
