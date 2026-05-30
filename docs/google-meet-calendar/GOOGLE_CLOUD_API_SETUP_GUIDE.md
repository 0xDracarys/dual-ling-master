# Google Cloud API Setup Guide - Options & Instructions

**Status:** 📋 SETUP REQUIRED  
**Created:** October 30, 2025  
**Audience:** User (Project Owner)

---

## 🎯 What We Need

To integrate Google Meet and Calendar, we need access to **Google Cloud APIs**. You have **3 options** for providing this access.

---

## 🔑 Option A: You Provide API Keys (Recommended - Fastest)

**Time Required:** 15-20 minutes  
**Your Effort:** Medium  
**My Effort:** Low  
**Security:** You maintain full control

### **What You'll Do:**

#### **Step 1: Create Google Cloud Project (5 minutes)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. **Project name:** `DualLing Integration` (or any name)
4. **Organization:** Leave as default (or select if you have one)
5. Click "Create"
6. Wait for project creation (~30 seconds)
7. Select the new project from the dropdown

#### **Step 2: Enable Required APIs (3 minutes)**

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search and enable these 3 APIs (click "Enable" for each):
   - ✅ **Google Calendar API**
   - ✅ **Google Drive API**
   - ✅ **Google Meet API** (if available, or it's included with Calendar)

#### **Step 3: Create OAuth 2.0 Credentials (7 minutes)**

1. Go to **APIs & Services** → **Credentials**
2. Click "**+ CREATE CREDENTIALS**" → "OAuth client ID"
3. If prompted to configure consent screen:
   - Click "Configure Consent Screen"
   - Choose "**External**" (unless you have Google Workspace)
   - Click "Create"
   - Fill in:
     - **App name:** `DualLing`
     - **User support email:** Your email
     - **Developer contact:** Your email
   - Click "Save and Continue"
   - Skip scopes (we'll add them programmatically)
   - Add test users: Your email + any test accounts
   - Click "Save and Continue"
   - Review and go back to Dashboard

4. Go back to **Credentials** → "**+ CREATE CREDENTIALS**" → "OAuth client ID"
5. **Application type:** Web application
6. **Name:** `DualLing OAuth Client`
7. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   https://your-production-domain.com
   ```
8. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/google/auth/callback
   https://your-production-domain.com/api/google/auth/callback
   ```
9. Click "Create"
10. **Download JSON** or copy:
    - **Client ID:** Something like `123456789-abcdefg.apps.googleusercontent.com`
    - **Client Secret:** Something like `GOCSPX-abc123def456`

#### **Step 4: Provide Credentials to Me**

**Send me these 3 values** (via secure channel):

```
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/auth/callback
```

**✅ Done!** I'll add these to the project and proceed with implementation.

---

## 🛠️ Option B: I Guide You Through Setup (Step-by-Step)

**Time Required:** 30 minutes  
**Your Effort:** High (but I'll walk you through every step)  
**My Effort:** Medium  
**Security:** You maintain full control

### **What We'll Do:**

1. You share your screen or follow my instructions
2. I walk you through Google Cloud Console
3. You create the project and credentials
4. You copy the values and provide them to me

**How to Proceed:**
- Reply: "Let's do Option B - guide me"
- I'll provide detailed, screenshot-level instructions
- We'll complete setup together

---

## 🔐 Option C: Grant Me Temporary Access (Advanced)

**Time Required:** 5 minutes  
**Your Effort:** Low  
**My Effort:** High  
**Security:** Requires trust (temporary access)

### **What You'll Do:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **IAM & Admin** → **IAM**
3. Click "**+ GRANT ACCESS**"
4. **New principals:** Add my email (you'll provide this)
5. **Role:** `Editor` (temporary, for setup only)
6. Click "Save"
7. I'll:
   - Create the project
   - Enable APIs
   - Create OAuth credentials
   - Configure everything
   - Remove my access when done
8. You review and approve

**⚠️ Note:** I don't recommend this unless you trust me fully. Options A or B are safer.

---

## 🚀 My Recommendation

**Go with Option A** - It's the fastest and you maintain full control.

**Why?**
- ✅ You own the credentials
- ✅ I can't see your Google account
- ✅ You can revoke access anytime
- ✅ Only takes 15-20 minutes
- ✅ You learn how it works (useful for future)

---

## 📋 What Happens After You Provide Credentials?

### **Step 1: I Configure Development Environment (10 minutes)**

```bash
# I'll add to .env.local
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google/auth/callback
```

### **Step 2: I Build OAuth Integration (Day 1-2)**

- Create `GoogleAuthService` for token management
- Create `GoogleCalendarService` for event creation
- Create OAuth callback route
- Create "Connect Google Account" UI
- Test OAuth flow locally

### **Step 3: You Test OAuth Flow (5 minutes)**

1. Run `pnpm dev`
2. Login as teacher
3. Go to Settings → Connect Google Account
4. Click "Connect"
5. Google OAuth screen appears
6. Approve access
7. Redirected back to platform
8. See "Connected ✅" status

### **Step 4: I Continue Implementation**

- Build class scheduling backend
- Build UI components
- Build recording management
- Test with Playwright MCP
- Deploy to production

**Total time from credentials to working feature: 4-5 days**

---

## 🔐 Security & Privacy

### **What Access Do These Credentials Grant?**

With the OAuth credentials, the platform can:
- ✅ Create/read/update/delete calendar events on teacher's Google Calendar
- ✅ Read recordings from teacher's Google Drive
- ✅ Move/delete recordings in teacher's Google Drive

**What the platform CANNOT do:**
- ❌ Access teacher's emails (Gmail)
- ❌ Access other files in Drive (only recordings we create)
- ❌ Access other Google services (Photos, YouTube, etc.)
- ❌ Act on behalf of teacher without their consent

### **How Are Tokens Stored?**

- Stored in Firestore (encrypted at rest by Firebase)
- Only accessible by the teacher who owns them
- Auto-refresh before expiry (1-hour token lifetime)
- Teacher can disconnect anytime (revokes tokens)

### **GDPR Compliance**

- ✅ Clear consent during OAuth flow
- ✅ Limited scope (only necessary permissions)
- ✅ Data minimization (only store what's needed)
- ✅ Right to erasure (teacher can disconnect)
- ✅ Transparent data processing (user sees what's happening)

---

## 🤔 FAQ

### **Q: Can I use my personal Google account?**
**A:** Yes! You can use any Google account (Gmail, Workspace, etc.)

### **Q: Will this cost money?**
**A:** No. Google Calendar, Drive, and Meet APIs are free within generous quotas:
- Calendar API: 1M requests/day (we use ~500/day)
- Drive API: 1B queries/day (we use ~200/day)
- Meet: Unlimited (no direct API, linked to Calendar)

### **Q: What if I mess up the setup?**
**A:** No problem! You can delete the project and start over. Or choose Option B and I'll guide you.

### **Q: Can I revoke access later?**
**A:** Yes! You can:
1. Delete the OAuth client in Google Cloud Console (immediate)
2. Revoke access in Google Account settings (immediate)
3. Teacher can disconnect in platform settings (immediate)

### **Q: What if I already have a Google Cloud Project?**
**A:** You can use an existing project! Just enable the APIs and create new OAuth credentials.

### **Q: How do I know the credentials are working?**
**A:** After you provide them, I'll test the OAuth flow and show you a screenshot of successful connection.

---

## 📞 Next Steps

**Choose your option and let me know:**

1. **"Go with Option A"** → You'll provide API keys (I'll wait for your credentials)
2. **"Go with Option B"** → I'll guide you step-by-step (reply when ready)
3. **"Go with Option C"** → You'll grant temporary access (provide your GCP project ID)
4. **"I have questions"** → Ask anything, I'm here to help!

---

## 📚 Additional Resources

- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [OAuth 2.0 Consent Screen Setup](https://support.google.com/cloud/answer/10311615)

---

**Created By:** ZenType Architect (J)  
**Purpose:** Help user choose best approach for API setup  
**Status:** ⏳ Awaiting user decision
