# 🔧 Quick Setup: Enable New API Key for Authentication

**Time Required:** 5 minutes  
**Last Updated:** November 11, 2025

---

## ✅ What We Just Set Up

You now have a **dual API key system**:

1. **Frontend (Browser):** Original key for Firebase Auth, Firestore, Storage
2. **Backend (Server):** New Tier 1 key for Gemini AI with higher rate limits

**Current Status:**
- ✅ Development environment configured
- ✅ AI chatbot will use new key (higher limits)
- ✅ Firebase services use original key (authentication works)
- ⏳ New key needs permissions enabled (follow steps below)

---

## 🚀 Next Step: Enable Authentication API for New Key

### Step 1: Open Google Cloud Console

I just opened this link for you:
```
https://console.cloud.google.com/apis/credentials?project=paji-duolingo
```

### Step 2: Find and Edit the New API Key

1. Look for: **"Gemini Developer API key"**
2. Key ID: `AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4`
3. Click on the key name (or the pencil icon to edit)

### Step 3: Configure API Restrictions

Scroll down to **"API restrictions"** section:

1. Select: **"Restrict key"**
2. Click **"Select APIs"** dropdown
3. Check these APIs:
   - ☑️ **Identity Toolkit API**
   - ☑️ **Token Service API**
   - ☑️ **Cloud Firestore API**
   - ☑️ **Firebase Storage API**
   - ☑️ **Generative Language API** (for Gemini)

4. Click **"Save"** at the bottom

### Step 4: Wait for Propagation

- Wait **5 minutes** for changes to take effect
- Google's API infrastructure needs time to sync

---

## 🧪 Test Authentication After 5 Minutes

### Option 1: Test in Browser

1. Go to: http://localhost:3000/auth/login
2. Try logging in with test credentials
3. Should work without the `auth/requests-blocked` error

### Option 2: Test with cURL

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**Expected:** Status 200 with authentication token

---

## 🔄 If You Want to Use New Key Everywhere (Optional)

Once the API restrictions are configured:

### For Development:

Edit `.env.development.local`:
```bash
# Change this line:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyApOEBwq7VK0QzEg37YnylaMZwadsTYYuY

# To this:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4
```

### For Production:

Edit `apphosting.yaml` (already done, but verify):
```yaml
- variable: NEXT_PUBLIC_FIREBASE_API_KEY
  value: AIzaSyDPWvzDl4Y3otA-yZwnflsRuwzhzgVZGW4
```

Then commit and push to deploy:
```bash
git add apphosting.yaml
git commit -m "chore: Enable new API key for production"
git push origin master
```

---

## 📊 Current Configuration Summary

| Service | Key Used (Dev) | Key Used (Prod) |
|---------|----------------|-----------------|
| **Firebase Auth** | Original (`...YYuY`) | New (`...GW4`) ⚠️ Needs API restrictions |
| **Firestore** | Original (`...YYuY`) | New (`...GW4`) |
| **Storage** | Original (`...YYuY`) | New (`...GW4`) |
| **Gemini AI** | New (`...GW4`) ✅ | New (`...GW4`) ✅ |

---

## 🎯 Benefits of This Setup

✅ **Flexible:** Can change any key independently  
✅ **Safe:** Development uses working keys, production can be updated separately  
✅ **Scalable:** Easy to add more API keys for different services  
✅ **Manageable:** All key config in `.env.*.local` and `apphosting.yaml`  
✅ **Higher Limits:** New key has Tier 1 rate limits for AI chatbot  

---

## 📚 Full Documentation

See: `/docs/reference/API_KEY_MANAGEMENT.md`

---

## ❓ Quick FAQ

**Q: Do I need to restart the dev server?**  
A: Yes, I already restarted it for you! It's running on http://localhost:3000

**Q: Will this affect production immediately?**  
A: No! Development and production use separate configs. Production won't change until you update `apphosting.yaml` and redeploy.

**Q: What if authentication still fails after 5 minutes?**  
A: Verify the API restrictions were saved correctly in Google Cloud Console. May take up to 10 minutes in rare cases.

**Q: Can I revert back to the old key?**  
A: Yes! Just edit `.env.development.local` and change the `NEXT_PUBLIC_FIREBASE_API_KEY` back to the original value.

---

✅ **Setup Complete!**  
⏳ **Next:** Wait 5 minutes, then test authentication  
📖 **Docs:** `/docs/reference/API_KEY_MANAGEMENT.md`
