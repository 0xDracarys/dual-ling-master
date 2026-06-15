# API Key Management System

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Owner:** ZenType Architect (J)

---

## 🎯 Overview

This document defines our **dual API key system** for managing Firebase and Gemini API keys across development and production environments.

**Goal:** Flexible, maintainable API key management where keys can be swapped without breaking the entire system.

---

## 🔑 API Key Inventory

### Current API Keys

| Key Name | Key ID (last 4 chars) | Purpose | Environment | Status |
|----------|----------------------|---------|-------------|--------|
| **Original Firebase Key** | `...YYuY` | Firebase Auth, Firestore, Storage | Development | ✅ Working |
| **New Gemini Developer Key** | `...GW4` | Gemini AI API (higher rate limits) | Development (AI only) | ⚠️ Auth blocked |

### Full Key Values

**Original Working Key:**
```
AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
```
- ✅ Firebase Authentication
- ✅ Firestore Database
- ✅ Firebase Storage
- ✅ Cloud Functions
- ✅ Gemini AI (lower rate limits)

**New Gemini Developer Key:**
```
AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
```
- ❌ Firebase Authentication (BLOCKED - needs API restrictions configured)
- ❓ Firestore Database (not tested)
- ❓ Firebase Storage (not tested)
- ✅ Gemini AI (higher rate limits - Tier 1)

---

## 🏗️ Architecture: Dual Key System

### Principle: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Browser)                       │
│                                                              │
│  Uses: NEXT_PUBLIC_FIREBASE_API_KEY                        │
│  For:  Auth, Firestore, Storage (client SDK)               │
│  Env:  Development vs Production                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Server)                         │
│                                                              │
│  Uses: GEMINI_API_KEY (separate from Firebase)             │
│  For:  AI Chatbot, Gemini API calls only                   │
│  Env:  Can be different from frontend Firebase key         │
└─────────────────────────────────────────────────────────────┘
```

### Key Insight

**Frontend Firebase** and **Backend AI** can use **different API keys**:

- **Frontend:** Original working key (`...YYuY`) for Firebase services
- **Backend:** New Tier 1 key (`...GW4`) for Gemini AI only

This means we can **use the new key for AI without breaking auth**!

---

## 📂 File Structure

### Environment Files

```
project-root/
├── .env.local                      # Base config (git-ignored)
├── .env.development.local          # Local dev overrides (git-ignored)
├── .env.production.template        # Production template (committed)
├── apphosting.yaml                 # Firebase App Hosting config (committed)
└── docs/reference/
    └── API_KEY_MANAGEMENT.md       # This file (committed)
```

### Priority Order

Next.js loads environment variables in this order (later overrides earlier):

1. `.env` (committed, shared defaults)
2. `.env.local` (git-ignored, local overrides)
3. `.env.development` / `.env.production` (environment-specific)
4. `.env.development.local` / `.env.production.local` (local overrides)

**For development:**
```
.env.development.local > .env.local > .env.development > .env
```

**For production:**
```
apphosting.yaml > .env.production > .env
```

---

## 🔧 Current Configuration

### Development (.env.development.local)

**Frontend (Browser):**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
# Using ORIGINAL key for Firebase Auth/Firestore/Storage
```

**Backend (Server):**
```bash
GEMINI_API_KEY=AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
# Using NEW Tier 1 key for Gemini AI only
```

### Production (apphosting.yaml)

**Current Configuration (lines 20-65):**
```yaml
env:
  # Frontend Firebase SDK
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
    # ⚠️ THIS IS BLOCKING AUTH IN PRODUCTION!
  
  # Backend Gemini AI
  - variable: GEMINI_API_KEY
    value: AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
```

**Recommended Fix:**
```yaml
env:
  # Frontend Firebase SDK (use original working key)
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
  
  # Backend Gemini AI (use new Tier 1 key)
  - variable: GEMINI_API_KEY
    value: AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX
```

---

## 🛠️ How to Fix New API Key Authentication Block

### Option 1: Configure API Restrictions (Recommended)

1. **Go to Google Cloud Console:**
   ```
   https://console.cloud.google.com/apis/credentials?project=paji-duolingo
   ```

2. **Find the new API key:**
   - Name: "Gemini Developer API key"
   - Key ID: `AIzaSy_REDACTED_API_KEY_XXXXXXXXXXXXX`

3. **Edit API Key:**
   - Click on the key name
   - Scroll to "API restrictions"
   - Select "Restrict key"
   - Check these APIs:
     - ✅ Identity Toolkit API
     - ✅ Token Service API
     - ✅ Cloud Firestore API
     - ✅ Firebase Storage API
     - ✅ Generative Language API (Gemini)

4. **Save and test:**
   - Wait 5 minutes for changes to propagate
   - Test login at `http://localhost:3000/auth/login`

### Option 2: Use Dual Key System (Immediate Fix)

**Keep using original key for Firebase, new key for AI only:**

This is what we've already set up! No further action needed for this option.

---

## 🔄 How to Change API Keys

### For Development

**Change Firebase key:**
```bash
# Edit .env.development.local
NEXT_PUBLIC_FIREBASE_API_KEY=<new-key>
```

**Change Gemini AI key:**
```bash
# Edit .env.development.local
GEMINI_API_KEY=<new-key>
```

**Restart dev server:**
```bash
pnpm dev
```

### For Production

**Method 1: Update apphosting.yaml (Requires redeploy)**

```bash
# 1. Edit apphosting.yaml
code apphosting.yaml

# 2. Find the env section (lines 20-65)
# 3. Update the key values
# 4. Commit and push to master
git add apphosting.yaml
git commit -m "chore: Update production API keys"
git push origin master

# 5. Firebase App Hosting auto-deploys from master branch
```

**Method 2: Firebase Console (No redeploy needed)**

1. Go to Firebase Console > App Hosting
2. Select your backend
3. Go to "Environment variables"
4. Update `NEXT_PUBLIC_FIREBASE_API_KEY` or `GEMINI_API_KEY`
5. Variables update in ~5 minutes

**Method 3: GitHub Secrets (For CI/CD)**

If you have GitHub Actions for deployment:
```bash
# In GitHub repo > Settings > Secrets and variables > Actions
# Add or update:
FIREBASE_API_KEY=<new-key>
GEMINI_API_KEY=<new-key>
```

---

## 📊 API Key Usage Tracking

### Where Each Key is Used

**Original Key (`...YYuY`):**

| File | Line | Usage |
|------|------|-------|
| `.env.development.local` | 10 | Frontend Firebase SDK (dev) |
| `lib/firebase/config.ts` | 11 | Fallback if env not set |
| `hooks/use-auth.tsx` | 63 | Fallback if env not set |

**New Key (`...GW4`):**

| File | Line | Usage |
|------|------|-------|
| `.env.development.local` | 22 | Backend Gemini AI (dev) |
| `apphosting.yaml` | 22, 65 | Frontend + Backend (production) |

### How to Audit Key Usage

```bash
# Search for hardcoded API keys (should find fallbacks only)
grep -r "AIzaSy" --include="*.ts" --include="*.tsx" --include="*.js"

# Search for environment variable usage
grep -r "NEXT_PUBLIC_FIREBASE_API_KEY" --include="*.ts" --include="*.tsx"
grep -r "GEMINI_API_KEY" --include="*.ts" --include="*.tsx"
```

---

## 🚨 Security Best Practices

### ✅ Do's

1. **Use different keys for dev and production**
2. **Store production keys in Firebase Console or GitHub Secrets**
3. **Use API restrictions to limit key scope**
4. **Rotate keys every 90 days**
5. **Monitor key usage in Google Cloud Console**
6. **Keep `.env.local` and `.env.*.local` in `.gitignore`**

### ❌ Don'ts

1. **Don't commit API keys to git** (except in `apphosting.yaml` for production)
2. **Don't use production keys in development**
3. **Don't share keys in Slack/email**
4. **Don't use same key for all services** (separate Firebase and Gemini if possible)
5. **Don't hardcode keys in source files** (always use environment variables)

---

## 🧪 Testing API Key Changes

### Test Checklist

After changing any API key, verify:

- [ ] **Authentication:** Login/logout works
- [ ] **Firestore:** Can read/write data
- [ ] **Storage:** Can upload/download files
- [ ] **AI Chatbot:** Can generate courses
- [ ] **Google Meet:** OAuth flow works (if enabled)

### Test Script

```bash
#!/bin/bash
# test-api-keys.sh

echo "Testing API Keys..."

# 1. Test Firebase Auth
echo "1. Testing Firebase Authentication..."
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  | jq '.success'

# 2. Test Firestore (get courses)
echo "2. Testing Firestore..."
curl http://localhost:3000/api/courses | jq 'length'

# 3. Test AI Chatbot
echo "3. Testing AI Chatbot..."
TOKEN="<your-teacher-token>"
curl -X POST http://localhost:3000/api/ai/teacher-bot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","mode":"planning"}' \
  | jq '.success'

echo "All tests complete!"
```

---

## 📝 Maintenance Schedule

### Monthly Tasks

- [ ] Review API key usage in Google Cloud Console
- [ ] Check for any rate limit warnings
- [ ] Verify all keys are properly restricted

### Quarterly Tasks (Every 90 Days)

- [ ] Rotate all API keys
- [ ] Update `.env.development.local`
- [ ] Update `apphosting.yaml`
- [ ] Test all functionality after rotation

### Annual Tasks

- [ ] Audit all API key permissions
- [ ] Remove unused keys
- [ ] Document any new keys added

---

## 🔗 Related Documentation

- **Firebase Console:** https://console.firebase.google.com/project/paji-duolingo
- **Google Cloud Console:** https://console.cloud.google.com/apis/credentials?project=paji-duolingo
- **Firebase App Hosting:** https://console.firebase.google.com/project/paji-duolingo/apphosting
- **AI Chatbot PRD:** `/docs/ai-chatbot/TEACHER_CHATBOT_PRD.md`
- **Production Deployment:** `/docs/deployments/PRODUCTION_DEPLOYMENT_GUIDE.md`

---

## ❓ FAQ

**Q: Why do we need two separate API keys?**  
A: To avoid rate limits on the AI chatbot while keeping Firebase services stable with the original key.

**Q: Can I use the new key for everything?**  
A: Not yet. The new key needs API restrictions configured to enable Authentication API.

**Q: What happens if I push API keys to GitHub?**  
A: Remove them immediately! Use `git filter-branch` or contact GitHub support to scrub history.

**Q: How do I know which key is being used?**  
A: Check browser DevTools > Console for Firebase initialization logs, or add logging to `lib/firebase/config.ts`.

**Q: Can I have different keys for each developer?**  
A: Yes! Each developer can have their own `.env.development.local` with personal test keys.

---

**Status:** ✅ Dual key system configured  
**Next Review:** December 11, 2025 (30 days)  
**Owner:** ZenType Architect (J)  
**Last Updated:** November 11, 2025
