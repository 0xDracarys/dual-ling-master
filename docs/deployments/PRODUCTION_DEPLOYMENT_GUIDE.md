# Production Deployment Checklist

**Date:** November 9, 2025  
**Branch:** `ui-improvement-phase0`  
**Project:** solotype-23c1f

---

## 🔐 Security & IAM Setup

### **Step 1: Run IAM Setup Script**
```bash
# This creates service account with proper permissions
./scripts/setup-production-iam.sh
```

**What it does:**
- ✅ Creates service account: `dual-ling-production@solotype-23c1f.iam.gserviceaccount.com`
- ✅ Grants Firebase Admin role
- ✅ Grants Storage Object Admin role
- ✅ Grants AI Platform User role
- ✅ Grants Logging Writer role
- ✅ Grants Cloud Trace Agent role
- ✅ Creates service account key (for GitHub Actions)

**Output:** `service-account-key.json` (DO NOT COMMIT THIS!)

---

### **Step 2: Update .gitignore**
Ensure these are ignored:
```
service-account-key.json
*-adminsdk-*.json
.env.local
.env.production
```

---

### **Step 3: Environment Variables**

**For Firebase Hosting (Production):**

Create `.env.production`:
```env
# Firebase Config (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=solotype-23c1f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=solotype-23c1f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=solotype-23c1f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# API Base URL (production)
NEXT_PUBLIC_API_URL=https://solotype-23c1f.web.app

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_CHATBOT=true
NEXT_PUBLIC_ENABLE_GOOGLE_MEET=true
NEXT_PUBLIC_ENABLE_PAYMENTS=false
```

**For GitHub Actions:**

Add these secrets to GitHub repo:
1. `FIREBASE_SERVICE_ACCOUNT` - Contents of `service-account-key.json`
2. `FIREBASE_TOKEN` - Get with `firebase login:ci`

---

## 🚀 Deployment Methods

### **Option 1: Manual Deployment (Quickest - Do This Now)**

```bash
# Build Next.js app
pnpm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Or deploy everything (hosting + functions + firestore rules)
firebase deploy
```

**Result:** Your app goes live at `https://solotype-23c1f.web.app`

---

### **Option 2: GitHub Actions (Automated - Set Up Later)**

**File:** `.github/workflows/deploy-production.yml`

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main  # Only deploy from main branch

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        run: npm install -g pnpm
        
      - name: Install dependencies
        run: pnpm install
        
      - name: Build Next.js app
        run: pnpm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
          # ... other env vars
        
      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: solotype-23c1f
```

---

## ⚠️ Common Production Issues & Solutions

### **Issue 1: "Permission Denied" Errors**

**Symptom:**
```
Error: Permission 'storage.objects.create' denied
Error: Permission 'aiplatform.endpoints.predict' denied
```

**Cause:** Service account missing IAM roles

**Fix:**
```bash
# Check service account permissions
gcloud projects get-iam-policy solotype-23c1f \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:dual-ling-production@*"

# Re-run IAM setup script
./scripts/setup-production-iam.sh
```

---

### **Issue 2: Routes 404 in Production**

**Symptom:**
```
/api/courses → 404 Not Found
/teacher/dashboard → 404 Not Found
```

**Cause:** Firebase Hosting config missing rewrites for Next.js

**Fix:** Verify `firebase.json`:
```json
{
  "hosting": {
    "public": "out",
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**⚠️ Wait!** Next.js 15 with App Router needs **Firebase Functions** or **Cloud Run** for API routes!

---

### **Issue 3: API Routes Don't Work (CRITICAL!)**

**Problem:** Firebase Hosting is **static only**. Your `/api/*` routes won't work!

**Solution:** Deploy Next.js to **Cloud Run** instead:

#### **Option A: Deploy to Cloud Run (Recommended)**

1. Build Docker image:
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
CMD ["pnpm", "start"]
```

2. Deploy:
```bash
# Build and push to Artifact Registry
gcloud builds submit --tag gcr.io/solotype-23c1f/dual-ling

# Deploy to Cloud Run
gcloud run deploy dual-ling \
  --image gcr.io/solotype-23c1f/dual-ling \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account dual-ling-production@solotype-23c1f.iam.gserviceaccount.com
```

#### **Option B: Use Vercel (Easiest)**

Next.js works out-of-box on Vercel:
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Vercel handles:
- ✅ API routes automatically
- ✅ Environment variables
- ✅ Serverless functions
- ✅ Automatic HTTPS
- ✅ Global CDN

---

### **Issue 4: Google OAuth Redirect URI Mismatch**

**Symptom:**
```
Error: redirect_uri_mismatch
```

**Fix:** Add production URL to Google OAuth consent screen:
1. Go to GCP Console → APIs & Services → Credentials
2. Edit OAuth 2.0 Client ID
3. Add Authorized redirect URIs:
   - `https://solotype-23c1f.web.app/api/auth/callback/google`
   - `https://your-custom-domain.com/api/auth/callback/google`
   - `https://dual-ling-*.run.app/api/auth/callback/google` (Cloud Run)

---

### **Issue 5: CORS Errors**

**Symptom:**
```
Access to fetch at 'https://api.example.com' from origin 'https://solotype-23c1f.web.app' 
has been blocked by CORS policy
```

**Fix:** Update API route CORS headers:
```typescript
// app/api/*/route.ts
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  
  // Allow production domain
  response.headers.set('Access-Control-Allow-Origin', 'https://solotype-23c1f.web.app');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  return response;
}
```

---

## 🧪 Testing Production Build Locally

Before deploying, test production build:

```bash
# Build for production
pnpm run build

# Serve production build
pnpm start

# Open http://localhost:3000
```

**Check:**
- [ ] All pages load
- [ ] API routes work (`/api/courses`, `/api/auth/login`, etc.)
- [ ] Authentication works
- [ ] Course creation works
- [ ] Google Meet integration works
- [ ] No console errors

---

## 📊 Monitoring Production

### **After Deployment, Monitor:**

1. **GCP Cloud Logging:**
   - URL: `https://console.cloud.google.com/logs`
   - Filter: `resource.type="cloud_run_revision"` (if using Cloud Run)
   - Check for errors

2. **Firebase Analytics:**
   - URL: `https://console.firebase.google.com/project/solotype-23c1f/analytics`
   - Track user sessions, page views

3. **Cloud Trace:**
   - URL: `https://console.cloud.google.com/traces`
   - Monitor API response times

4. **Error Reporting:**
   - URL: `https://console.cloud.google.com/errors`
   - See crash reports

---

## ✅ Deployment Checklist

### **Before Deploying:**
- [ ] Run `./scripts/setup-production-iam.sh`
- [ ] Create `.env.production` with correct values
- [ ] Test production build locally (`pnpm run build && pnpm start`)
- [ ] Add production URLs to Google OAuth
- [ ] Update Firestore security rules (if needed)
- [ ] Commit all changes to git

### **Deploy:**
- [ ] `firebase deploy --only hosting` (static pages only)
- **OR**
- [ ] Deploy to Cloud Run (for API routes)
- **OR**
- [ ] Deploy to Vercel (easiest for Next.js)

### **After Deploying:**
- [ ] Test live site (all major flows)
- [ ] Check GCP logs for errors
- [ ] Monitor first 24 hours closely
- [ ] Set up alerts for critical errors

---

## 🚨 RECOMMENDATION

**For DualLing with API routes, DON'T use Firebase Hosting alone!**

**Best Options:**
1. **Vercel** (easiest, free tier, perfect for Next.js)
2. **Cloud Run** (fully managed, auto-scaling, $$$)
3. **App Engine** (GCP managed, easier than Cloud Run)

Firebase Hosting is great for **static sites only**. Your app needs server-side API routes, so use a platform that supports them.

---

## 🎯 NEXT STEPS

1. **Right now:** Deploy to Firebase Hosting (just to see it live)
2. **This week:** Set up Vercel or Cloud Run for production
3. **Next week:** Configure CI/CD with GitHub Actions
4. **Future:** Add monitoring, alerts, performance tracking
