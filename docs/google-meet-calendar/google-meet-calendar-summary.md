# Google Meet/Calendar Integration - Implementation Summary

**Status:** 📋 PLANNING COMPLETE - READY FOR DEVELOPMENT  
**Version:** 1.0.0  
**Created:** October 30, 2025  
**Estimated Timeline:** 4-5 days

---

## 🎯 What We're Building

A complete **Google Meet & Calendar integration** that allows teachers to:
- Schedule classes with students (one-time or recurring)
- Start instant meetings
- Automatically record classes to Google Drive
- Manage recording retention (30-day auto-delete or "Keep Forever")
- Send calendar invites to students via email

---

## 📋 Complete PRD

**Full documentation:** [GOOGLE_MEET_CALENDAR_INTEGRATION_PRD.md](./GOOGLE_MEET_CALENDAR_INTEGRATION_PRD.md)

---

## 🚀 5-Day Implementation Roadmap

### **Day 1-2: Google OAuth & Calendar Integration**
**Goal:** Teachers can connect their Google account and we can create calendar events

**Key Tasks:**
- Set up Google Cloud Project (enable Calendar API, Meet API, Drive API)
- Configure OAuth 2.0 consent screen
- Create `GoogleAuthService` for token management
- Create `GoogleCalendarService` for event creation
- Add "Connect Google Account" button to teacher settings
- Store OAuth tokens in Firestore `users` collection

**Files to Create:**
- `lib/services/google/google-auth.service.ts`
- `lib/services/google/google-calendar.service.ts`
- `app/api/google/auth/callback/route.ts`

**Definition of Done:**
- [ ] Teacher can authenticate with Google
- [ ] Access/refresh tokens stored securely
- [ ] Token auto-refresh working

---

### **Day 2-3: Class Scheduling Backend**
**Goal:** API endpoints to schedule classes and create Google Meet links

**Key Tasks:**
- Create Firestore `classes` collection with full schema
- Create `ClassRepository` (CRUD operations)
- Create `ClassService` (orchestrates Calendar + Firestore)
- Build API endpoints:
  - `POST /api/classes` - Schedule new class
  - `GET /api/classes` - List classes (filtered)
  - `PUT /api/classes/[id]` - Update class
  - `DELETE /api/classes/[id]` - Cancel class
  - `POST /api/classes/instant` - Start instant meeting

**Files to Create:**
- `lib/repositories/class.repository.ts`
- `lib/services/class.service.ts`
- `app/api/classes/route.ts`
- `app/api/classes/[id]/route.ts`
- `app/api/classes/instant/route.ts`

**Definition of Done:**
- [ ] One-time classes create Calendar events with Meet links
- [ ] Recurring classes work with RRULE patterns
- [ ] Student emails added as attendees
- [ ] Calendar invites sent automatically

---

### **Day 3-4: UI Components**
**Goal:** Teachers can schedule classes from the UI

**Key Tasks:**
- Create Schedule Class Modal (course/lesson dropdowns, date/time pickers, recurrence builder)
- Create Classes Page (calendar view, upcoming/past classes lists)
- Add "Schedule Class" quick action to teacher dashboard
- Add Classes tab to Course Edit page
- Create Instant Meeting modal

**Files to Create:**
- `components/teacher/schedule-class-modal.tsx` (400-500 lines)
- `components/teacher/instant-meeting-modal.tsx` (200 lines)
- `components/teacher/class-card.tsx` (150 lines)
- `app/teacher/classes/page.tsx` (600 lines)

**shadcn/ui Components Needed:**
- Dialog, Select, Calendar, Input, Textarea, Checkbox, Switch, Badge

**Definition of Done:**
- [ ] Modal opens from dashboard, courses page, classes page
- [ ] Form validation working
- [ ] Classes page shows upcoming and past classes
- [ ] Dashboard widget shows next 3 classes

---

### **Day 4-5: Recording Management**
**Goal:** Teachers can view, archive, and delete class recordings

**Key Tasks:**
- Create `GoogleDriveService` (list recordings, get URLs, move to archive, delete)
- Create Cloud Function for daily auto-deletion of expired recordings
- Build API endpoints:
  - `GET /api/classes/[id]/recording` - Fetch recording details
  - `POST /api/classes/[id]/recording/archive` - Keep forever
  - `DELETE /api/classes/[id]/recording` - Delete now
- Add recording action buttons to UI (View, Keep Forever, Delete)

**Files to Create:**
- `lib/services/google/google-drive.service.ts`
- `functions/src/recordingCleanup.ts` (Cloud Function)
- `app/api/classes/[id]/recording/route.ts`
- `components/teacher/recording-actions.tsx`

**Definition of Done:**
- [ ] Recording URLs fetched from Drive
- [ ] "Keep Forever" moves file to archive
- [ ] "Delete Now" removes file
- [ ] Cloud Function deletes expired recordings
- [ ] Expiry countdown displays correctly

---

### **Day 5: Testing & Polish**
**Goal:** Feature fully tested and production-ready

**Key Tasks:**
- Playwright MCP live testing (3 core scenarios)
- Manual testing checklist (8 test cases)
- Error handling and loading states
- Documentation updates (MAIN.md, implementation docs)
- Git commit

**Testing Checklist:**
- [ ] Schedule one-time class → verify calendar invite sent
- [ ] Schedule recurring class → verify all instances created
- [ ] Start instant meeting → verify Meet link works
- [ ] Add external participant → verify ⚠️ indicator shown
- [ ] View recording → verify Drive link opens
- [ ] Archive recording → verify moved to permanent folder
- [ ] Delete recording → verify removed from Drive
- [ ] Auto-delete → verify Cloud Function works

**Definition of Done:**
- [ ] All Playwright tests pass
- [ ] All manual test cases pass
- [ ] Documentation complete
- [ ] Feature committed with clear message

---

## 📊 Data Models

### **Firestore Collection: `classes`**

```typescript
{
  id: string;
  courseId: string;
  lessonId?: string;
  teacherId: string;
  title: string;
  description: string;
  
  meetingType: 'one-time' | 'recurring';
  meetLink: string;
  calendarEventId: string;
  
  scheduledAt: Timestamp;
  duration: number;
  timezone: string;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    daysOfWeek?: number[];
    endDate?: Timestamp;
  };
  
  participants: {
    studentIds: string[];
    externalEmails?: string[];
  };
  
  recordingEnabled: boolean;
  recordingUrl?: string;
  recordingDriveId?: string;
  recordingRetention: {
    defaultDays: number;
    expiresAt: Timestamp;
    archived: boolean;
    archivedAt?: Timestamp;
  };
  
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

---

## 🔐 Security Checklist

- [ ] OAuth scopes limited to minimum required (calendar.events, drive.readonly, drive.file)
- [ ] Firestore rules enforce teacher ownership
- [ ] API endpoints verify Firebase token + teacher role
- [ ] Course ownership validated before scheduling
- [ ] External participant emails validated
- [ ] Google tokens stored encrypted (Firebase handles)
- [ ] Recording URLs only accessible to class owner

---

## 💰 Cost Estimate

**Total Cost: $0/month** (within Google free tiers)

- Google Calendar API: 1M requests/day free (we use ~500/day)
- Google Meet API: Unlimited (no direct API, linked to Calendar)
- Google Drive API: 1B queries/day free (we use ~200/day)
- Cloud Functions: 125K invocations/month free (we use 30/month)
- Firestore: 1 GB storage free (we use ~1 MB)

**Note:** Recording storage is on teacher's personal Google Drive (not billed to platform)

---

## 🧪 Testing Strategy

### **Unit Tests**
- GoogleCalendarService (create one-time, create recurring)
- GoogleDriveService (list, move, delete recordings)
- ClassService (schedule validation, participant resolution)

### **Integration Tests (Playwright MCP)**
- Schedule one-time class → verify calendar invite
- Start instant meeting → verify Meet link
- Archive recording → verify moved to permanent folder

### **Manual Test Cases**
- TC-001: Schedule one-time class
- TC-002: Schedule recurring class (weekly)
- TC-003: Start instant meeting
- TC-004: Add external participant
- TC-005: View recording
- TC-006: Archive recording
- TC-007: Delete recording
- TC-008: Auto-delete expired recording

---

## 🚀 Key Features

### ✅ **For Teachers**
- Schedule classes with enrolled students or external participants
- One-time or recurring class patterns (daily, weekly, bi-weekly)
- Instant "Start Now" meetings for ad-hoc sessions
- Auto-generated Google Meet links for all classes
- Pre-filled calendar templates (course name, agenda, duration)
- Recording management with 30-day retention or "Keep Forever"
- Email notifications via Google Calendar invites

### ✅ **For Students**
- Email calendar invites with all class details
- Direct Google Meet links in calendar event
- (Future) In-app notifications and calendar view

---

## 📈 Success Metrics

- **Adoption:** 80% of teachers connect Google account, 60% schedule at least 1 class
- **Usage:** Average 2-3 classes scheduled per teacher per week
- **Retention:** 90% of classes have recording enabled
- **Technical:** >99% Calendar API success rate, 100% Meet link generation

---

## 🔮 Future Enhancements (Phase 6)

- Student calendar view
- In-app notifications (15 min before class)
- Attendance tracking (auto-detect join/leave)
- Recording transcripts (Speech-to-Text API)
- Class analytics (attendance, duration, engagement)
- Zoom/Teams integration

---

## 📚 Required Google APIs

1. **Google Calendar API v3**
   - Create/update/delete events
   - Add attendees
   - Set recurring patterns

2. **Google Meet API**
   - Generate Meet conference links (via Calendar)

3. **Google Drive API v3**
   - List recordings (auto-saved by Meet)
   - Move files (retention → archive)
   - Delete files

---

## 🎯 Definition of Done

**This feature is COMPLETE when:**
- [ ] All 5 implementation phases finished
- [ ] All Playwright MCP tests pass (3 scenarios)
- [ ] All manual test cases pass (8 cases)
- [ ] Security rules deployed and tested
- [ ] Documentation complete (MAIN.md updated)
- [ ] Git commit pushed to master
- [ ] Feature live-tested on localhost:3000 with Playwright MCP

---

## 🔗 Next Steps

1. **User Approval:** Confirm PRD scope and begin implementation
2. **Phase 5.1 Start:** Set up Google Cloud Project and OAuth
3. **Daily Progress:** Update MAIN.md with completed phases
4. **Testing:** Use Playwright MCP for live verification
5. **Deployment:** Single verified commit after full feature completion

---

**Created By:** ZenType Architect (J)  
**Ready For:** Implementation (awaiting user approval)  
**Estimated Completion:** 4-5 days from start  
**Documentation:** [GOOGLE_MEET_CALENDAR_INTEGRATION_PRD.md](./GOOGLE_MEET_CALENDAR_INTEGRATION_PRD.md)
