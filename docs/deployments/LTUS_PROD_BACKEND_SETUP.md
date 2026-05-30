# ltus-prod Backend Setup & IAM Configuration

**Date:** November 9, 2025  
**Status:** 🎯 **READY FOR PRODUCTION** - Awaiting IAM verification  
**Backend Name:** `ltus-prod`  
**Branch:** `main` (production)  
**Region:** `europe-west4`  

---

## 🎯 Overview

The `ltus-prod` backend is your production deployment environment in Firebase App Hosting, linked to the `main` branch. This backend will automatically deploy whenever changes are merged to main, providing a stable production environment for your application.

### **Key Information:**

| Property | Value |
|----------|-------|
| **Backend Name** | `ltus-prod` |
| **Git Branch** | `main` |
| **Region** | `europe-west4` |
| **Service Account** | `firebase-app-hosting-compute@paji-duolingo.iam.gserviceaccount.com` |
| **Auto-Deploy** | ✅ Enabled on main branch push |
| **Purpose** | Production deployment |

---

## 🔐 IAM Permissions Setup

### **Why This Matters**

Based on our previous IAM fix (October 2025), Firebase App Hosting service accounts **DO NOT** automatically have all required permissions. You must explicitly grant them to avoid 403 Permission Denied errors.

### **Required IAM Roles**

The following 7 roles are **critical** for production deployment:

| # | Role | Purpose | Critical? |
|---|------|---------|-----------|
| 1 | **Service Usage Consumer** | Authorize all GCP API calls | 🔴 **YES** |
| 2 | **Firebase Admin** | Full Firebase service access | 🔴 **YES** |
| 3 | **Storage Object Admin** | Cloud Storage file operations | 🔴 **YES** |
| 4 | **AI Platform User** | Vertex AI / Gemini API access | 🟡 Required for AI features |
| 5 | **Logging Log Writer** | Cloud Logging integration | 🟢 Recommended |
| 6 | **Cloud Trace Agent** | Distributed tracing | 🟢 Recommended |
| 7 | **Service Account Token Creator** | Signed URLs & token operations | 🔴 **YES** |

---

## 🚀 Setup Instructions

### **Option 1: Automated Script (Recommended)**

Run the IAM setup script to verify and grant all permissions:

```bash
cd /Users/lemonsquid/Documents/GitHub/dual-ling
chmod +x scripts/setup-production-iam.sh
./scripts/setup-production-iam.sh
```

**What it does:**
- ✅ Verifies service account exists
- ✅ Checks current IAM roles
- ✅ Grants missing permissions automatically
- ✅ Shows summary of all roles
- ✅ Provides next steps

**Expected output:**
```
🔐 Setting up IAM Permissions for ltus-prod Backend
Project: paji-duolingo
Backend: ltus-prod (linked to main branch)
Service Account: firebase-app-hosting-compute@paji-duolingo.iam.gserviceaccount.com

✅ Service account exists
✅ IAM roles granted successfully
✨ Production deployment ready!
```

---

### **Option 2: Manual IAM Setup (GCP Console)**

If you prefer to grant permissions manually:

1. **Open GCP IAM Console:**
   ```
   https://console.cloud.google.com/iam-admin/iam?project=paji-duolingo
   ```

2. **Find Service Account:**
   - Search for: `firebase-app-hosting-compute@paji-duolingo.iam.gserviceaccount.com`
   - Click the **Edit** (pencil) icon

3. **Add Each Role:**
   - Click **"+ ADD ANOTHER ROLE"**
   - Select role from dropdown
   - Click **"SAVE"**

4. **Required Roles to Add:**
   ```
   - Service Usage Consumer
   - Firebase Admin SDK Administrator Service Account
   - Storage Object Admin
   - Vertex AI User
   - Logging Log Writer
   - Cloud Trace Agent
   - Service Account Token Creator
   ```

5. **Wait for Propagation:**
   - IAM changes take **3-5 minutes** to propagate
   - Do not deploy until propagation completes

---

## 🔍 Verification Checklist

After running the setup script or manually granting permissions, verify:

### **Step 1: Check IAM Roles**

```bash
gcloud projects get-iam-policy paji-duolingo \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:firebase-app-hosting-compute@paji-duolingo.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

**Expected output should include all 7 roles:**
```
ROLE
roles/serviceusage.serviceUsageConsumer
roles/firebase.admin
roles/storage.objectAdmin
roles/aiplatform.user
roles/logging.logWriter
roles/cloudtrace.agent
roles/iam.serviceAccountTokenCreator
```

### **Step 2: Verify Backend Configuration**

```bash
gcloud firebase apphosting backends describe ltus-prod \
  --location=europe-west4 \
  --project=paji-duolingo
```

**Expected output:**
```yaml
name: ltus-prod
location: europe-west4
branch: main
status: ACTIVE
```

---

## 📦 Deployment Workflow

### **How ltus-prod Auto-Deploys**

```
Developer merges PR to main branch
    ↓
GitHub detects push to main
    ↓
Firebase App Hosting triggers build
    ↓
Docker image built with Next.js app
    ↓
Environment variables injected from apphosting.yaml
    ↓
Image deployed to Cloud Run
    ↓
Backend URL updated automatically
    ↓
✅ Production deployment complete!
```

### **Deployment Timeline**

| Phase | Duration | Description |
|-------|----------|-------------|
| **Build Trigger** | ~30 seconds | Firebase detects git push |
| **Docker Build** | ~5-8 minutes | Next.js build, dependency install |
| **Image Upload** | ~1-2 minutes | Push to Container Registry |
| **Cloud Run Deploy** | ~2-3 minutes | Rollout new revision |
| **Total** | **~8-13 minutes** | Commit to live deployment |

---

## 🧪 Testing Production Deployment

### **Step 1: Verify Backend is Live**

```bash
# Get backend URL
gcloud firebase apphosting backends describe ltus-prod \
  --location=europe-west4 \
  --project=paji-duolingo \
  --format="value(uri)"
```

### **Step 2: Test Health Endpoint**

```bash
curl https://BACKEND_URL/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T...",
  "environment": "production"
}
```

### **Step 3: Test Authentication**

```bash
# Test user registration
curl -X POST "https://BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prodtest@example.com",
    "password": "SecurePass123!",
    "name": "Production Test User",
    "role": "student"
  }'
```

**Expected response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "uid": "...",
    "email": "prodtest@example.com",
    "name": "Production Test User",
    "role": "student"
  }
}
```

### **Step 4: Test Login**

```bash
curl -X POST "https://BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prodtest@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "refreshToken": "..."
}
```

---

## 🚨 Common Issues & Solutions

### **Issue 1: 403 Permission Denied**

**Symptom:**
```
403 Forbidden: Caller does not have required permission to use project
```

**Solution:**
1. Run IAM setup script: `./scripts/setup-production-iam.sh`
2. Wait 5 minutes for IAM propagation
3. Retry deployment

**Root Cause:**
Missing `roles/serviceusage.serviceUsageConsumer` role.

---

### **Issue 2: Build Fails with Missing Environment Variables**

**Symptom:**
```
Error: Firebase configuration missing
```

**Solution:**
1. Verify `apphosting.yaml` has all `NEXT_PUBLIC_FIREBASE_*` variables
2. Ensure `availability: BUILD, RUNTIME` is set
3. Re-deploy

**Root Cause:**
Environment variables not available during Docker build phase.

---

### **Issue 3: Backend Shows "Old" Build**

**Symptom:**
Latest changes not visible in production.

**Solution:**
1. Check Cloud Build logs:
   ```
   https://console.cloud.google.com/cloud-build/builds?project=paji-duolingo
   ```
2. Verify build succeeded
3. Check build timestamp matches your commit
4. Wait for full rollout (~8-13 minutes)

**Root Cause:**
Build may still be in progress, or rollout not complete.

---

## 📊 Monitoring & Logging

### **Cloud Logging**

View production logs:
```
https://console.cloud.google.com/logs/query?project=paji-duolingo
```

**Useful filters:**
```
resource.type="cloud_run_revision"
resource.labels.service_name="ltus-prod"
severity>=ERROR
```

### **Cloud Trace**

View distributed traces:
```
https://console.cloud.google.com/traces/list?project=paji-duolingo
```

### **Firebase App Hosting Console**

View deployment history:
```
https://console.firebase.google.com/project/paji-duolingo/apphosting
```

---

## 🔄 Deployment Best Practices

### **1. Always Test Locally First**

```bash
pnpm build
pnpm start
# Test on http://localhost:3000
```

### **2. Use Feature Branches**

```bash
git checkout -b feature/new-feature
# Make changes
git commit -m "feat: Add new feature"
git push origin feature/new-feature
# Create PR to main
```

### **3. Merge to Main Only When Ready**

- ✅ All tests passing locally
- ✅ Code reviewed
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Verified with Playwright MCP

### **4. Monitor After Deployment**

- ✅ Check Cloud Logging for errors
- ✅ Test critical user flows
- ✅ Monitor for 15-30 minutes
- ✅ Verify performance metrics

---

## 🔐 Security Considerations

### **Service Account Security**

1. **Least Privilege:** Service account only has required roles
2. **No Keys Generated:** Using Application Default Credentials (ADC)
3. **Automatic Rotation:** Firebase manages credentials automatically
4. **IAM Auditing:** Review permissions quarterly

### **Environment Variables**

1. **Never Commit Secrets:** Use `apphosting.yaml` for config only
2. **Rotate API Keys:** Change Firebase API keys annually
3. **Audit Access:** Review who can modify `apphosting.yaml`

### **Production Access**

1. **Limited Deploy Access:** Only merge to main triggers deploy
2. **Branch Protection:** Require PR reviews for main
3. **Audit Logs:** Monitor all deployments

---

## 📚 Related Documentation

- [IAM Permission Fix Complete Summary](./IAM_PERMISSION_FIX_COMPLETE_SUMMARY.md)
- [Firebase Auth IAM Permission Fix](./FIREBASE_AUTH_IAM_PERMISSION_FIX_NEEDED.md)
- [Main IKB Index](./main.md)

---

## ✅ Production Readiness Checklist

Before your first production deployment to ltus-prod:

- [ ] Run IAM setup script: `./scripts/setup-production-iam.sh`
- [ ] Verify all 7 IAM roles granted
- [ ] Wait 5 minutes for IAM propagation
- [ ] Test locally: `pnpm build && pnpm start`
- [ ] Verify `apphosting.yaml` has all environment variables
- [ ] Merge PR to main branch
- [ ] Monitor Cloud Build for successful build
- [ ] Wait for deployment completion (~8-13 minutes)
- [ ] Test production authentication endpoint
- [ ] Test production course creation
- [ ] Verify Cloud Logging for errors
- [ ] Check Cloud Trace for performance
- [ ] Update documentation with production URL

---

## 🎊 Success Metrics

After successful ltus-prod deployment:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **Build Success Rate** | 100% | Cloud Build logs |
| **Deployment Time** | <15 min | Cloud Build duration |
| **Authentication Success** | 100% | Test endpoints |
| **API Response Time** | <500ms | Cloud Trace |
| **Error Rate** | <1% | Cloud Logging |
| **Uptime** | 99.9% | Cloud Monitoring |

---

**Status:** 🎯 **READY FOR PRODUCTION**  
**Next Action:** Run `./scripts/setup-production-iam.sh` and merge to main  
**Expected Time:** ~20 minutes (IAM setup + deployment)

---

**Prepared By:** J, the ZenType Architect  
**Date:** November 9, 2025  
**Version:** 1.0.0
