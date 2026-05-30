# 🧪 Test Upload NOW - Quick Instructions

## ⚠️ CRITICAL: Open Browser Console First!

1. **Open browser** to: `http://localhost:3000/teacher/course/edit/mmUNzC2eRPfD2VaULIeG`
2. **Press F12** or right-click → Inspect → Console tab
3. **Click edit** (pencil icon) on first lesson
4. **Look for log**: `🎨 [ResourceUpload] Component rendered`
   - If you DON'T see this → Component isn't rendering
5. **Click upload area** or drag your PDF file (`2 Estimates.pdf`)
6. **Look for log**: `📁 [ResourceUpload] File selected`
   - If you DON'T see this → File input broken
7. **Check if title field** has auto-filled text
8. **Click "Upload Resource" button**
9. **Look for log**: `🖱️ [ResourceUpload] Upload button clicked!`
   - If you DON'T see this → Button click not working
10. **Look for log**: `🚀 [ResourceUpload] Starting upload`
    - If you DON'T see this → handleUpload not executing

## What to Report Back

Copy ALL console logs that start with:
- `🎨` (component render)
- `📁` (file selected)  
- `🖱️` (button clicked)
- `🚀` (upload starting)
- Any ❌ errors

Also check terminal for server-side logs starting with:
- `📥 [API] POST /resources received`

## Expected Flow (if working correctly)

```
Browser Console:
🎨 [ResourceUpload] Component rendered: { courseId, lessonId, ... }
📁 [ResourceUpload] File selected: { name: "2 Estimates.pdf", ... }
✅ [ResourceUpload] File validated successfully
📝 [ResourceUpload] Auto-filled title: "2 Estimates"
🖱️ [ResourceUpload] Upload button clicked!
🚀 [ResourceUpload] Starting upload: { hasFile: true, ... }
📦 [ResourceUpload] FormData created: { hasFile: true, ... }
🌐 [ResourceUpload] Sending POST request: { url: "/api/...", ... }
📡 [ResourceUpload] Response received: { status: 200, ok: true }
✅ [ResourceUpload] Upload successful

Terminal:
📥 [API] POST /resources received: { courseId, lessonId, ... }
🔑 [API] Verifying token...
✅ [API] Token verified: { uid, role: "teacher" }
📦 [API] Parsing form data...
📄 [API] Form data parsed: { hasFile: true, fileName: "2 Estimates.pdf", ... }
☁️ [API] Uploading to Storage: { bucketName, storagePath, ... }
✅ [API] File uploaded to Storage
🔗 [API] Generating signed URL...
✅ [API] Signed URL generated
```

## If Button Does Nothing

The problem is one of these:
1. **Component not rendering** - Upload section missing in modal
2. **File not selected** - Input not capturing file
3. **Button disabled** - Check if button is grayed out
4. **Click not firing** - onClick handler issue
5. **Function not executing** - handleUpload blocked

---

**Status**: Debugging logs added ✅  
**Action**: TEST NOW and report back with console logs! 🚀
