# recurring-class-bug.errors.md

**Feature/Issue:** Recurring Class Booking Bug
**Last Updated:** 2025-11-10

---

## Error Log

### Error ID: RC-001 ✅ RESOLVED
- **Timestamp:** 2025-11-09T22:14:35.074Z
- **Category:** GoogleCalendar
- **Message:** Failed to create recurring class
- **Error:** Biweekly recurrence requires daysOfWeek
- **TeacherId:** JiK83SdNuiMkv4QaPfYm4FuiiXF3
- **Course Title:** Quiz Testing Course
- **Status:** FIXED - daysOfWeek now calculated automatically from selected date

### Error ID: RC-002 ✅ RESOLVED
- **Timestamp:** 2025-11-09T22:14:35.075Z
- **Category:** ClassService
- **Message:** Failed to schedule recurring class
- **Error:** Biweekly recurrence requires daysOfWeek
- **CourseId:** chdAiCPOgXjeUAwnPuhn
- **TeacherId:** JiK83SdNuiMkv4QaPfYm4FuiiXF3
- **Status:** FIXED - daysOfWeek now calculated automatically from selected date

### Error ID: RC-003 ✅ RESOLVED
- **Timestamp:** 2025-11-09T22:14:35.075Z
- **Category:** API
- **Message:** Failed to schedule class
- **Error:** Biweekly recurrence requires daysOfWeek
- **Status:** FIXED - daysOfWeek now calculated automatically from selected date

---

## Root Cause Analysis
**Problem:** The UI was not sending the `daysOfWeek` parameter when creating recurring classes (weekly or bi-weekly patterns).

**Why it happened:**
1. The schedule-class-modal.tsx component was sending recurrence data without the daysOfWeek array
2. Google Calendar API requires daysOfWeek for weekly and biweekly patterns to know which day(s) of the week to repeat
3. The backend validation (google-calendar.service.ts) was correctly throwing an error when daysOfWeek was missing

**Technical Details:**
- For bi-weekly recurrence, Google Calendar needs: `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=SA` (for Saturday)
- BYDAY requires knowing which day of the week (SU, MO, TU, WE, TH, FR, SA)
- UI was only sending `pattern` and `endDate`, but not `daysOfWeek`

## Solutions Applied
**File:** `components/teacher/schedule-class-modal.tsx`

**Change:** Added daysOfWeek calculation in the handleSubmit function before API call

```typescript
// Add recurrence if enabled
if (isRecurring && recurrenceEndDate) {
  // Calculate daysOfWeek from selectedDate
  // For weekly and bi-weekly patterns, we need to specify which day of the week
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfWeek = startDateTime.getDay();
  
  requestBody.recurrence = {
    pattern: recurrencePattern,
    daysOfWeek: [dayOfWeek], // Always include the day of the selected date
    endDate: recurrenceEndDate.toISOString(),
  };
}
```

**Why this works:**
- `startDateTime.getDay()` returns 0-6 (Sunday-Saturday) based on the user-selected date
- This is exactly the format expected by the backend and Google Calendar API
- For example, if user selects Saturday Nov 15, `getDay()` returns 6, and the class repeats every Saturday (or every 2 weeks on Saturday for bi-weekly)

## Prevention Methods
1. ✅ **UI Validation:** Always include daysOfWeek when isRecurring is true and pattern is weekly/bi-weekly
2. ✅ **Automatic Calculation:** Use `startDateTime.getDay()` to derive daysOfWeek from user's selected date
3. ✅ **Backend Validation:** google-calendar.service.ts already validates this and throws clear errors
4. **Testing:** Always test recurring class creation for all patterns (daily, weekly, bi-weekly, monthly)
5. **Documentation:** Document that daysOfWeek is required for weekly/bi-weekly in API specs

## Files Changed
- `components/teacher/schedule-class-modal.tsx` (lines ~470-480)

---
