# Instant Meeting Issue - Quick Fix Guide

**Read this first, then see full investigation:** [INSTANT_MEETING_ENROLLMENT_INVESTIGATION.md](./INSTANT_MEETING_ENROLLMENT_INVESTIGATION.md)

---

## 🚨 **The Problem (2 Issues)**

### Issue 1: "Students not enrolled" Error
Teacher tries to start instant meeting → Backend rejects student `4Qa5P0ZaUQZrIWibt6vURjRGzg33` as "not enrolled" even though UI shows they are enrolled.

### Issue 2: Meeting Created But Invisible
Meeting successfully creates (shows in Gmail/Calendar) but does NOT appear in `/teacher/classes` page.

---

## 🔧 **Quick Fixes**

### Fix 1: Check & Fix Enrollment Status (5 minutes)

**Step 1:** Open Firebase Console → Firestore
```
Collection: enrollments
Query: 
  courseId == "mmUNzC2eRPfD2VaULIeG"
  userId == "4Qa5P0ZaUQZrIWibt6vURjRGzg33"
```

**Step 2:** Find the enrollment document and check the `status` field:
- ✅ **If `status: "active"`** → Issue is elsewhere (see full investigation)
- ❌ **If `status: "pending"` or missing** → Update to `"active"`

**Step 3:** Update the document:
```javascript
{
  userId: "4Qa5P0ZaUQZrIWibt6vURjRGzg33",
  courseId: "mmUNzC2eRPfD2VaULIeG",
  status: "active",  // ← SET THIS TO "active"
  enrolledAt: <timestamp>,
  userName: "test 12",
  userEmail: "test12@test.com"
}
```

**Step 4:** Test instant meeting creation again

---

### Fix 2: Make Instant Meetings Visible (10 minutes)

**File:** `lib/repositories/class.repository.ts`  
**Method:** `findUpcoming()`

**Replace this:**
```typescript
const now = Timestamp.now();
const snapshot = await this.db
  .collection('classes')
  .where('teacherId', '==', teacherId)
  .where('startTime', '>=', now)  // ❌ Excludes instant meetings
  .where('startTime', '<=', futureDate)
  .orderBy('startTime', 'asc')
  .get();
```

**With this:**
```typescript
// Allow 10 minutes lookback for instant meetings
const lookbackMinutes = 10;
const startTime = Timestamp.fromDate(
  new Date(Date.now() - lookbackMinutes * 60 * 1000)
);

const snapshot = await this.db
  .collection('classes')
  .where('teacherId', '==', teacherId)
  .where('startTime', '>=', startTime)  // ✅ Includes recent instant meetings
  .where('startTime', '<=', futureDate)
  .orderBy('startTime', 'asc')
  .get();
```

---

## ✅ **Verification Steps**

### Test Fix 1:
1. Open instant meeting modal
2. Select "Lithuanian Food Vocabulary" course
3. Select all 3 students (including test 12)
4. Click "Start Meeting Now"
5. **Expected:** No error, meeting creates successfully

### Test Fix 2:
1. Create any instant meeting
2. Wait for success confirmation
3. Navigate to `/teacher/classes`
4. **Expected:** Meeting appears in "Upcoming" tab

---

## 📚 **Full Details**

For complete root cause analysis, code references, and long-term improvements:
→ [INSTANT_MEETING_ENROLLMENT_INVESTIGATION.md](./INSTANT_MEETING_ENROLLMENT_INVESTIGATION.md)

---

**Created:** 2025-11-08 23:58  
**Estimated Fix Time:** 15 minutes total
