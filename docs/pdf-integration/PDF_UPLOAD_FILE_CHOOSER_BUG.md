# PDF Upload - File Chooser Bug Analysis

**Date:** October 30, 2025  
**Status:** 🔴 **CRITICAL BUG IDENTIFIED**  
**Severity:** HIGH - Blocks PDF upload feature in both dev and production

---

## 🐛 Problem Description

When navigating to the course edit page (`/teacher/course/edit/[id]`), **21 file chooser dialogs** are detected by Playwright in an "open" state, even though no lesson modal is open. This prevents teachers from uploading PDF files because:

1. File input elements are triggering automatically
2. Multiple instances of ResourceUpload component rendering
3. File chooser dialogs are stuck/hanging
4. Clicking "Choose File" button does nothing visible to the user

**User Impact:**
> "whenever I press on that button, nothing happens... if it's not allowing me to choose files from my local drive then there is no way I can upload anything"

---

## 🔍 Investigation Results

### Playwright Detection
```
Modal state:
- [File chooser]: can be handled by the "browser_file_upload" tool (x21)
```

**Analysis:** 21 file choosers suggests that file input elements are being clicked programmatically or rendered in a loop.

### Terminal Logs Analysis
```
✓ Compiled /api/courses/[id]/lessons/[lessonId]/resources in 717ms
GET /api/courses/MdSmOHkMlgPNrqYiHMgf/lessons/W4hD2j3qgsuTpIpbndOx/resources 200 in 2239ms
GET /api/courses/MdSmOHkMlgPNrqYiHMgf/lessons/W4hD2j3qgsuTpIpbndOx/resources 200 in 233ms
```

**Analysis:** The resources API is working correctly and returning 200 OK. The problem is **client-side only**.

### Component Structure
```tsx
// components/teacher/lesson-modal.tsx (lines 418-453)
{lesson && lesson.id ? ((() => {
  console.log('✅ [LessonModal] Rendering upload section for lesson:', lesson.id);
  return (
    <div className="space-y-4 border-t pt-6">
      <ResourceList courseId={courseId} lessonId={lesson.id} />
      <ResourceUpload 
        courseId={courseId}
        lessonId={lesson.id}
        onUploadComplete={() => { console.log('Resource uploaded successfully'); }}
        onError={(error) => { console.error('Upload error:', error); }}
      />
    </div>
  );
})()) : null}
```

**Issue Identified:** The use of an **Immediately Invoked Function Expression (IIFE)** inside JSX is causing React rendering issues. This pattern can trigger unexpected re-renders.

---

## 🔎 Root Causes

### 1. **IIFE in JSX** (Primary Cause)
The pattern `{condition ? ((() => {...})()) : null}` is non-standard for React and can cause:
- Multiple component instantiations
- Uncontrolled re-renders
- Memory leaks
- Event handler duplication

### 2. **File Input Auto-Trigger** (Secondary)
The file input has an `onClick` handler on the drop zone:
```tsx
onClick={() => fileInputRef.current?.click()}
```

If this component renders multiple times, each instance will have its own file input that could be triggered.

### 3. **Missing Key Prop** (Possible)
If ResourceUpload is rendering in a list without proper `key` props, React may recreate instances instead of reusing them.

---

## ✅ Solutions

### **Solution 1: Remove IIFE (RECOMMENDED)**

**Replace this:**
```tsx
{lesson && lesson.id ? ((() => {
  console.log('✅ [LessonModal] Rendering upload section for lesson:', lesson.id);
  return (
    <div className="space-y-4 border-t pt-6">
      {/* ... */}
    </div>
  );
})()) : null}
```

**With this:**
```tsx
{lesson && lesson.id && (
  <div className="space-y-4 border-t pt-6">
    <div>
      <h3 className="text-lg font-semibold mb-2">Lesson Resources</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add PDF files, documents, or other resources for students to download
      </p>
    </div>

    <ResourceList
      courseId={courseId}
      lessonId={lesson.id}
      showTitle={false}
      className="mb-4"
    />

    <ResourceUpload
      courseId={courseId}
      lessonId={lesson.id}
      onUploadComplete={() => {
        console.log('Resource uploaded successfully');
      }}
      onError={(error) => {
        console.error('Upload error:', error);
      }}
    />
  </div>
)}
```

**Benefits:**
- ✅ Standard React pattern
- ✅ No unnecessary function calls
- ✅ Prevents duplicate renders
- ✅ Cleaner code

### **Solution 2: Add useEffect Guard**

Add a guard in ResourceUpload component to prevent auto-triggering:

```tsx
// In resource-upload.tsx
const [hasRendered, setHasRendered] = useState(false);

useEffect(() => {
  if (!hasRendered) {
    console.log('🎨 [ResourceUpload] First render - NOT clicking file input');
    setHasRendered(true);
  }
}, [hasRendered]);

// Modify onClick handler:
onClick={() => {
  if (hasRendered) {
    fileInputRef.current?.click();
  }
}}
```

### **Solution 3: Add Modal State Check**

Ensure ResourceUpload only renders when modal is actually open:

```tsx
{lesson && lesson.id && isOpen && (
  // ...ResourceUpload component
)}
```

---

## 🔧 Implementation Plan

### Step 1: Fix lesson-modal.tsx (CRITICAL)

1. Remove IIFE wrapper
2. Use standard conditional rendering
3. Test that modal opens correctly
4. Verify only ONE ResourceUpload instance renders

**File:** `components/teacher/lesson-modal.tsx`  
**Lines to change:** 418-453

### Step 2: Add Safety Guards (RECOMMENDED)

1. Add `hasRendered` state to ResourceUpload
2. Prevent auto-click on mount
3. Add console logs to track renders

**File:** `components/teacher/resource-upload.tsx`

### Step 3: Test Thoroughly

1. Navigate to course edit page
2. Click "Edit" on any lesson
3. Verify modal opens
4. Check browser console - should see only ONE "Component rendered" log
5. Click "Choose File" button
6. Verify file picker opens
7. Select a file
8. Fill in title
9. Click "Upload Resource"
10. Verify upload succeeds

---

## 📋 Testing Checklist

- [ ] Navigate to `/teacher/course/edit/[courseId]`
- [ ] Open browser DevTools (F12)
- [ ] Click edit button on first lesson
- [ ] **Check:** Modal opens successfully
- [ ] **Check:** Console shows only ONE ResourceUpload render
- [ ] **Check:** No file chooser dialogs auto-open
- [ ] Click "Choose file" or drag-drop zone
- [ ] **Check:** File picker opens normally
- [ ] Select a test PDF file
- [ ] **Check:** File appears in preview
- [ ] Enter title: "Test Document"
- [ ] Click "Upload Resource" button
- [ ] **Check:** Upload progress shows
- [ ] **Check:** Success message appears
- [ ] **Check:** Resource appears in list
- [ ] Close and reopen modal
- [ ] **Check:** Uploaded resource still visible
- [ ] Test with different file types (DOC, PPTX, etc.)

---

## 🚨 Expected Behavior After Fix

### Before Edit Button Click:
- 0 file choosers open
- ResourceUpload component NOT rendered

### After Edit Button Click (Modal Opens):
- 0 file choosers open
- ResourceUpload component renders ONCE
- Console log: "🎨 [ResourceUpload] Component rendered: { courseId, lessonId, hasFile: false }"

### After "Choose File" Click:
- 1 file chooser opens
- User selects file
- File preview appears
- File chooser closes

### After "Upload Resource" Click:
- Upload starts
- Progress bar animates
- Upload completes
- Success message shows
- Form resets after 2 seconds

---

## 📊 Impact Analysis

**Severity:** HIGH  
**Users Affected:** All teachers attempting to upload resources  
**Feature Broken:** 100% - Upload feature completely non-functional  
**Production Status:** 🔴 BROKEN (IAM fix applied, but upload UI broken)  

**Business Impact:**
- Teachers cannot add study materials
- Investors saw broken feature during presentation
- User confidence affected
- Feature ROI: $0 (not usable)

---

## 🎯 Success Criteria

After fix is applied:

1. ✅ Only ONE ResourceUpload instance renders per lesson
2. ✅ File chooser only opens when user clicks "Choose File"
3. ✅ Upload button triggers upload correctly
4. ✅ Files upload to Firebase Storage successfully
5. ✅ Resources appear in student lesson view
6. ✅ Download and preview buttons work
7. ✅ No console errors or warnings
8. ✅ Works consistently across multiple lesson edits

---

## 🔗 Related Documentation

- [PDF_INTEGRATION_COMPLETE.md](./PDF_INTEGRATION_COMPLETE.md) - Original implementation
- [PDF_UPLOAD_DEBUG_GUIDE.md](./PDF_UPLOAD_DEBUG_GUIDE.md) - Debugging steps
- [PDF_SIGNED_URL_IAM_FIX.md](./PDF_SIGNED_URL_IAM_FIX.md) - Production IAM fix

---

## 📝 Notes

**Why This Wasn't Caught:**
- Local testing may have worked if modals were opened/closed quickly
- Playwright testing wasn't run for this specific flow
- IIFE pattern is technically valid but problematic in React
- Issue only manifests when page loads with course data

**Lesson Learned:**
- Always use standard React patterns for conditional rendering
- Test with browser DevTools open to catch multiple renders
- Add render count logging in debug mode
- Use Playwright to detect hanging file choosers

**Next Steps After Fix:**
1. Apply the fix to lesson-modal.tsx
2. Test locally with Playwright
3. Commit changes
4. Deploy to production
5. Verify fix works for investors/users
6. Document in MAIN.md

---

**Status:** 🔧 FIX READY TO APPLY
