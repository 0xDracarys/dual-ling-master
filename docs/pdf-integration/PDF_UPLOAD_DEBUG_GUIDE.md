# PDF Upload Debugging Guide

## Current Status
- ✅ UI is rendering correctly (upload section visible)
- ✅ Auth is fixed (using useAuth hook)
- ✅ Storage bucket configured (paji-duolingo.firebasestorage.app)
- ❓ Upload button click - no visible action (needs testing with console logs)

## What We Found from Firebase Docs

### Firebase's Recommended Pattern (Client-Side)
```typescript
import { getStorage, ref, uploadBytes } from "firebase/storage";

const storage = getStorage();
const storageRef = ref(storage, 'path/to/file');
uploadBytes(storageRef, file).then((snapshot) => {
  console.log('Uploaded!');
});
```

### Our Current Pattern (Server-Side)
```typescript
// Client uploads to API
fetch('/api/...', { body: formData });

// API uploads to Storage
const bucket = getStorage().bucket();
await bucket.file(path).save(buffer);
```

## Key Differences

| Aspect | Firebase Way (Client) | Our Way (Server) |
|--------|----------------------|------------------|
| Upload Path | Browser → Storage | Browser → API → Storage |
| Authentication | Firebase Auth tokens | Custom JWT tokens |
| Security Rules | Enforced | Bypassed (Admin SDK) |
| Progress Tracking | Native | Manual simulation |
| Bandwidth | Direct | Goes through server |

## Why We Chose Server-Side

**Reason**: Our app uses **custom authentication** (not Firebase Auth), so client-side uploads won't work with our current Security Rules.

Firebase Storage Security Rules expect:
```
request.auth.uid  // Firebase Auth user
request.auth.token.role  // Firebase custom claims
```

We have:
```typescript
// Custom JWT from our API
{ id, username, email, role: "teacher" }
```

## Debugging Steps

### 1. Test Upload with Console Open

```bash
# In your browser:
1. Navigate to http://localhost:3000/teacher/course/edit/mmUNzC2eRPfD2VaULIeG
2. Open DevTools Console (F12)
3. Click edit on any lesson
4. Select a file to upload
5. Fill in title
6. Click "Upload Resource"
```

### 2. What to Look For

**Client-Side Logs** (in browser console):
```
🚀 [ResourceUpload] Starting upload: { hasFile, fileName, ... }
📦 [ResourceUpload] FormData created: { hasFile, hasTitle, ... }
🌐 [ResourceUpload] Sending POST request: { url, method, ... }
📡 [ResourceUpload] Response received: { status, statusText, ok }
```

**Server-Side Logs** (in terminal):
```
📥 [API] POST /resources received: { courseId, lessonId, ... }
🔑 [API] Verifying token...
✅ [API] Token verified: { uid, role }
📦 [API] Parsing form data...
📄 [API] Form data parsed: { hasFile, fileName, ... }
☁️ [API] Uploading to Storage: { bucketName, storagePath, ... }
✅ [API] File uploaded to Storage
🔗 [API] Generating signed URL...
✅ [API] Signed URL generated
```

### 3. Common Issues to Check

**Issue 1: Button Does Nothing**
- Check: `console.log` appears when clicking button?
- Cause: Event handler not firing
- Fix: Verify button `onClick={handleUpload}` is present

**Issue 2: File Not Selected**
- Check: `hasFile: true` in logs?
- Cause: File input not capturing file
- Fix: Check `fileInputRef` and `onChange` handler

**Issue 3: Network Error**
- Check: POST request in Network tab?
- Cause: Fetch not executing or failing silently
- Fix: Check for CORS, network issues, or typos in URL

**Issue 4: Auth Error (401/403)**
- Check: `hasToken: true` and `hasUser: true` in logs?
- Cause: Auth context not providing token
- Fix: Verify `useAuth()` hook is working

**Issue 5: File Upload Fails (500)**
- Check: Server logs show bucket error?
- Cause: Storage bucket not accessible
- Fix: Verify `.env.local` has correct bucket name

**Issue 6: FormData Empty**
- Check: `hasFile: true` in FormData logs?
- Cause: FormData not properly constructed
- Fix: Verify `formData.append('file', selectedFile)`

## Testing Checklist

```
□ Open http://localhost:3000/teacher/course/edit/mmUNzC2eRPfD2VaULIeG
□ Open browser console (F12)
□ Click edit button on first lesson
□ Verify "Upload Resource" section visible
□ Click "Choose file" or drag file
□ Check console for file selection logs
□ Enter title (e.g., "Test Document")
□ Click "Upload Resource" button
□ Watch for logs in browser console
□ Watch for logs in terminal
□ Check for errors (red text)
□ Check Network tab for POST request
□ Look for response status (200 = success)
```

## Expected Successful Flow

1. **Button Click** → `🚀 Starting upload`
2. **Validation** → `hasFile: true`, `hasToken: true`
3. **FormData** → `📦 FormData created`
4. **Network** → `🌐 Sending POST request`
5. **Server** → `📥 POST /resources received`
6. **Auth** → `✅ Token verified`
7. **Parse** → `📄 Form data parsed`
8. **Upload** → `☁️ Uploading to Storage`
9. **Complete** → `✅ File uploaded to Storage`
10. **Response** → `📡 Response received: { status: 200, ok: true }`
11. **Success** → `✅ Upload successful`
12. **UI** → Green success message appears

## Firebase Storage Verification

```bash
# Check if Storage is configured
firebase storage:list

# Expected output:
gs://paji-duolingo.firebasestorage.app/

# After upload, list files:
firebase storage:list courses/

# Should show uploaded files
```

## Next Steps Based on Results

### If Logs Show Nothing
**Problem**: Event handler not firing
**Action**: Check button binding, verify component is rendered

### If Logs Stop at FormData
**Problem**: FormData or fetch issue
**Action**: Check browser console for errors, verify fetch API

### If 401 Unauthorized
**Problem**: Token not being sent or invalid
**Action**: Check `useAuth()` hook, verify token format

### If 403 Forbidden
**Problem**: User doesn't have teacher role
**Action**: Check Firestore `users` collection, verify `role: "teacher"`

### If 500 Server Error
**Problem**: Storage bucket or server-side issue
**Action**: Check terminal logs for specific error, verify bucket name

### If Upload Succeeds
**Problem**: None! 🎉
**Action**: 
1. Check Firebase Console → Storage for uploaded file
2. Check Firestore → courses → lessons for resource metadata
3. Test download functionality
4. Celebrate!

## Contact Firebase MCP for Help

If issues persist, consult Firebase MCP:

```typescript
// Ask about storage configuration
mcp_firebase_firebase_get_environment()

// Check storage rules
mcp_firebase_firebase_get_security_rules({ type: "storage" })

// List Firebase Storage contents
// (Would need to implement this check manually in Firebase Console)
```

## Architecture Decision

After testing, we need to decide:

1. **Keep Server-Side** (current) - Fix and optimize
2. **Switch to Client-Side** (Firebase way) - Requires auth migration

**Recommendation**: Fix current system first, then evaluate if performance/cost savings justify auth migration later.

---

**Ready to Test**: ✅ Dev server running with full logging
**Browser URL**: http://localhost:3000/teacher/course/edit/mmUNzC2eRPfD2VaULIeG
**Action**: Click upload and watch console logs!
