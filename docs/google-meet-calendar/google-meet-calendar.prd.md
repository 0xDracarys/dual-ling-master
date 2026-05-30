# Google Meet & Calendar Integration PRD

**Status:** 📋 READY FOR IMPLEMENTATION  
**Version:** 1.0.0  
**Created:** October 30, 2025  
**Phase:** Phase 5 - Teacher Collaboration Tools  
**Priority:** HIGH  
**Estimated Effort:** 4-5 days

---

## 🎯 Executive Summary

Enable teachers to schedule, manage, and record live classes with students using **Google Meet** and **Google Calendar**. This feature integrates seamlessly with the existing course/enrollment system and provides automatic meeting recording storage with configurable retention.

### **Core Value Proposition**
- Teachers can schedule classes with enrolled students (or external participants)
- One-time or recurring class scheduling support
- Both advance scheduling and instant "start now" meetings
- Automatic meeting recording storage (Google Drive)
- 30-day default retention with teacher-controlled archival
- Email notifications via Google Calendar invites

---

## 🔑 Key Requirements

### **Functional Requirements**

#### **1. Scheduling Capabilities**
- ✅ Teachers can schedule classes with:
  - **Enrolled students** (primary use case)
  - **External participants** via email (with "External User" indicator)
  - **Multiple students** (group classes)
- ✅ **Class Types:**
  - **One-time classes** (single session)
  - **Recurring classes** (daily, weekly, bi-weekly patterns)
- ✅ **Scheduling Options:**
  - **Advance scheduling** (pick date/time, send invites)
  - **Instant meetings** ("Start Now" button for ad-hoc sessions)

#### **2. Meeting Management**
- ✅ Auto-generated **Google Meet link** for each class
- ✅ Pre-filled **calendar template** with:
  - Course name + lesson/topic
  - Agenda/description (customizable)
  - Default duration (30/60 minutes, teacher-adjustable)
  - Enrolled students auto-added as participants
- ✅ **External participant indicator** (UI shows "⚠️ External User: email@example.com")
- ✅ Teachers can **enable/disable recording** per class (optional in Google Meet settings)

#### **3. Recording Storage & Retention**
- ✅ **Automatic recording** enabled by default (teacher can disable in Google Meet)
- ✅ **Storage location:** Google Drive (teacher's account)
- ✅ **Default retention:** 30 days (auto-delete after expiry)
- ✅ **Archival option:** Teachers can "Keep Forever" from UI (moves to permanent folder)
- ✅ **Access method:** Teachers access recordings via Google Drive link in platform

#### **4. Student Notifications**
- ✅ **Email notifications** via Google Calendar invite (primary)
- ✅ **Future enhancement:** In-app notifications (Phase 6)

#### **5. UI Integration**
- ✅ **Teacher Dashboard:**
  - "Schedule Class" quick action card
  - Upcoming classes calendar widget
- ✅ **Course Edit Page:**
  - "Schedule Class for Course" button
  - Recent classes list with recordings
- ✅ **Dedicated Classes Page:**
  - Full calendar view (embedded Google Calendar)
  - "Start Now" button for instant meetings
  - List of past classes with recording links

---

## 🏗️ Technical Architecture

### **Google APIs Required**

1. **Google Calendar API v3**
   - Create/update/delete events
   - Add attendees (students/external)
   - Set recurring patterns
   - Manage event metadata

2. **Google Meet API**
   - Generate Meet conference links
   - Attach to Calendar events
   - (No direct recording API - handled via Drive)

3. **Google Drive API v3**
   - List recordings (auto-saved by Meet)
   - Check file retention metadata
   - Move files (retention → archive folders)
   - Generate shareable links

---

### **Data Models**

#### **Firestore Collection: `classes`**

```typescript
{
  id: string;                           // Auto-generated class ID
  courseId: string;                     // Reference to courses collection
  lessonId?: string;                    // Optional: specific lesson
  teacherId: string;                    // Teacher UID
  title: string;                        // "Advanced Grammar - Lesson 5"
  description: string;                  // Agenda/notes (customizable)
  
  // Meeting Details
  meetingType: 'one-time' | 'recurring';
  meetLink: string;                     // Google Meet URL
  calendarEventId: string;              // Google Calendar event ID
  
  // Scheduling
  scheduledAt: Timestamp;               // Start date/time
  duration: number;                     // Duration in minutes (default: 60)
  timezone: string;                     // IANA timezone (e.g., 'Europe/Vilnius')
  recurrence?: {                        // Only for recurring classes
    pattern: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    daysOfWeek?: number[];              // [0-6] for weekly (0 = Sunday)
    endDate?: Timestamp;                // Stop recurrence date
  };
  
  // Participants
  participants: {
    studentIds: string[];               // Enrolled students (UIDs)
    externalEmails?: string[];          // Non-enrolled participants
  };
  
  // Recording
  recordingEnabled: boolean;            // Default: true
  recordingUrl?: string;                // Google Drive file URL
  recordingDriveId?: string;            // Drive file ID
  recordingRetention: {
    defaultDays: number;                // Default: 30
    expiresAt: Timestamp;               // Auto-delete date
    archived: boolean;                  // If moved to permanent storage
    archivedAt?: Timestamp;             // Archive timestamp
  };
  
  // Status
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;                    // Teacher UID
}
```

#### **Firestore Collection: `class_attendance`** (Future)

```typescript
{
  id: string;
  classId: string;
  studentId: string;
  joinedAt?: Timestamp;
  leftAt?: Timestamp;
  duration?: number;                    // Minutes attended
  attended: boolean;                    // Did they join?
}
```

---

### **Google Calendar Event Structure**

```json
{
  "summary": "Course: Lithuanian for Beginners - Lesson: Workplace Communication",
  "description": "Agenda:\n- Review vocabulary\n- Practice dialogues\n- Q&A session\n\nRecording: Enabled (auto-saved to Google Drive)\nRetention: 30 days (configurable)",
  "location": "Google Meet",
  "start": {
    "dateTime": "2025-11-05T14:00:00+02:00",
    "timeZone": "Europe/Vilnius"
  },
  "end": {
    "dateTime": "2025-11-05T15:00:00+02:00",
    "timeZone": "Europe/Vilnius"
  },
  "attendees": [
    { "email": "student1@example.com" },
    { "email": "student2@example.com" },
    { "email": "external@company.com" }
  ],
  "conferenceData": {
    "createRequest": {
      "requestId": "random-string",
      "conferenceSolutionKey": {
        "type": "hangoutsMeet"
      }
    }
  },
  "recurrence": [
    "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20251231T235959Z"
  ],
  "reminders": {
    "useDefault": false,
    "overrides": [
      { "method": "email", "minutes": 1440 },  // 24 hours before
      { "method": "popup", "minutes": 30 }     // 30 minutes before
    ]
  }
}
```

---

## 🎨 UI/UX Design

### **1. Teacher Dashboard - Quick Action Card**

```
┌────────────────────────────────────────┐
│ 📅 Schedule Class                      │
│                                        │
│ Quickly create a new class or start   │
│ an instant meeting with students.     │
│                                        │
│ [Schedule Class]  [Start Now]         │
└────────────────────────────────────────┘
```

### **2. Schedule Class Modal**

```
┌─────────────────────────────────────────────────────────┐
│ 📅 Schedule a New Class                          [X]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Course: [Select Course ▼]                               │
│         Lithuanian for IT Professionals                  │
│                                                          │
│ Lesson (Optional): [Select Lesson ▼]                    │
│         Lesson 5: Workplace Communication                │
│                                                          │
│ Class Title: [Auto-filled from course + lesson]         │
│         "Lithuanian for IT Professionals - Lesson 5"     │
│                                                          │
│ Description/Agenda: [Textarea - 500 chars]              │
│         ┌─────────────────────────────────────┐         │
│         │ - Review vocabulary                 │         │
│         │ - Practice dialogues                │         │
│         │ - Q&A session                       │         │
│         └─────────────────────────────────────┘         │
│                                                          │
│ Class Type: ( ) One-time  (•) Recurring                 │
│                                                          │
│ Date & Time:                                             │
│   Start: [Nov 05, 2025] [14:00] [Europe/Vilnius ▼]     │
│   Duration: [60 minutes ▼]                              │
│                                                          │
│ Recurrence: [Weekly ▼]                                  │
│   Repeat on: [Mon] [Tue ✓] [Wed] [Thu ✓] [Fri] [Sat] [Sun] │
│   End date: [Dec 31, 2025] (or Never)                  │
│                                                          │
│ Participants:                                            │
│   ✓ All enrolled students (8 students)                  │
│   [ ] Add external participants                         │
│                                                          │
│ Recording:                                               │
│   ✓ Enable automatic recording                          │
│   Retention: [30 days ▼] (auto-delete)                 │
│                                                          │
│ Note: Students will receive email invites via Google    │
│ Calendar. Recording will be saved to your Google Drive. │
│                                                          │
│       [Cancel]              [Schedule Class]            │
└─────────────────────────────────────────────────────────┘
```

**Expanded External Participants:**

```
Add external participants (not enrolled in course):
┌─────────────────────────────────────────────────┐
│ Email: [________________] [+ Add]               │
└─────────────────────────────────────────────────┘

Added:
  ⚠️ external@company.com [Remove]
  ⚠️ parent@example.com [Remove]
```

### **3. Classes Page - Calendar View**

```
┌──────────────────────────────────────────────────────────────┐
│ 📅 My Classes                                                 │
│                                                               │
│ [Schedule Class]  [Start Instant Meeting]                    │
│                                                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │  October 2025                         [<] [Today] [>]    │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ Sun   Mon   Tue   Wed   Thu   Fri   Sat                 │ │
│ │        1     2     3     4     5     6                   │ │
│ │  7     8     9    10    11    12    13                   │ │
│ │ 14    15    16    17    18    19    20                   │ │
│ │ 21    22    23    24    25    26    27                   │ │
│ │ 28    29   [30]   31                                     │ │
│ │            └───┘ (Today)                                 │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
│ Upcoming Classes (Next 7 Days):                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Nov 05 - 14:00 | Lithuanian for IT - Lesson 5           │ │
│ │ 📹 Recording enabled | 8 students enrolled               │ │
│ │ [Join Meet] [Edit] [Cancel]                             │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Nov 07 - 10:00 | Advanced Grammar - Lesson 3            │ │
│ │ 📹 Recording enabled | 5 students + 1 external           │ │
│ │ [Join Meet] [Edit] [Cancel]                             │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                               │
│ Past Classes (Last 30 Days):                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Oct 28 - 14:00 | Workplace Communication                │ │
│ │ 📹 Recording available | Expires in 28 days              │ │
│ │ [View Recording] [Keep Forever] [Delete Now]            │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Oct 25 - 10:00 | Basic Vocabulary Review                │ │
│ │ 📹 Recording available | Expires in 25 days              │ │
│ │ [View Recording] [Keep Forever] [Delete Now]            │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### **4. Course Edit Page - Classes Section**

```
┌──────────────────────────────────────────────────────────────┐
│ Course Details: Lithuanian for IT Professionals              │
├──────────────────────────────────────────────────────────────┤
│ [General] [Lessons] [Students] [Classes] [Analytics]         │
│                                                               │
│ Classes Section:                                             │
│                                                               │
│ [Schedule Class for This Course]                            │
│                                                               │
│ Recent Classes:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Oct 28 - 14:00 | Lesson 5: Workplace Communication      │ │
│ │ 8 students | 📹 Recording available (28 days left)      │ │
│ │ [View Recording] [Keep Forever]                         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Oct 25 - 10:00 | Lesson 4: Basic Vocabulary            │ │
│ │ 8 students | 📹 Recording available (25 days left)      │ │
│ │ [View Recording] [Keep Forever]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### **5. "Keep Forever" Confirmation Dialog**

```
┌─────────────────────────────────────────────────────────┐
│ Keep Recording Forever?                          [X]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ This will move the recording to your permanent archive  │
│ and prevent automatic deletion.                         │
│                                                          │
│ Recording:                                               │
│ "Lithuanian for IT Professionals - Lesson 5"            │
│ Recorded: Oct 28, 2025                                  │
│ Current expiry: Nov 27, 2025 (28 days left)            │
│                                                          │
│ After archiving:                                         │
│ ✓ Recording will be kept indefinitely                   │
│ ✓ Stored in "DualLing - Archived Classes" folder       │
│ ✓ You can manage it directly in Google Drive            │
│                                                          │
│       [Cancel]              [Keep Forever]              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 User Workflows

### **Workflow 1: Schedule One-Time Class (Advance)**

```
1. Teacher navigates to Classes page
2. Clicks "Schedule Class" button
3. Schedule Class Modal opens:
   ├─ Selects course (dropdown with enrolled courses)
   ├─ Optionally selects specific lesson
   ├─ Title auto-fills: "{Course Name} - {Lesson Title}"
   ├─ Edits description/agenda (optional)
   ├─ Chooses "One-time" class type
   ├─ Picks date/time + duration (default: 60 min)
   ├─ Keeps "All enrolled students" checked (8 students)
   ├─ Optionally adds external participants (shows ⚠️ indicator)
   └─ Clicks "Schedule Class"
4. Backend:
   ├─ Creates Firestore `classes` document
   ├─ Calls Google Calendar API (create event)
   ├─ Adds Google Meet conference link
   ├─ Fetches enrolled students' emails from Firestore
   ├─ Adds students + external emails as attendees
   └─ Sends calendar invites via Google (email notifications)
5. Success:
   ├─ Toast: "Class scheduled! Invites sent to 8 students"
   └─ Redirects to Classes page (shows new class in upcoming list)
```

### **Workflow 2: Start Instant Meeting ("Start Now")**

```
1. Teacher clicks "Start Instant Meeting" on Classes page
2. Quick modal appears:
   ├─ "Select students to invite (optional):"
   │   ✓ All enrolled students from course X
   │   Or manually check individual students
   ├─ "This will create an immediate Google Meet session"
   └─ [Cancel] [Start Now]
3. Teacher clicks "Start Now"
4. Backend:
   ├─ Creates Firestore `classes` document (status: 'in-progress')
   ├─ Generates Google Meet link (via Calendar API with instant start)
   ├─ Sends instant calendar invite to selected students
   └─ Returns Meet link to frontend
5. Frontend:
   ├─ Opens Google Meet in new tab/window
   └─ Shows toast: "Meeting started! Students invited via email"
```

### **Workflow 3: Schedule Recurring Class (Weekly)**

```
1. Teacher opens Schedule Class modal
2. Fills course, lesson, description
3. Selects "Recurring" class type
4. Sets schedule:
   ├─ Start date: Nov 05, 2025
   ├─ Start time: 14:00
   ├─ Duration: 60 minutes
   ├─ Recurrence: "Weekly"
   ├─ Days: Tuesday, Thursday
   └─ End date: Dec 31, 2025 (or "Never")
5. Keeps all enrolled students checked
6. Clicks "Schedule Class"
7. Backend:
   ├─ Creates Firestore `classes` document with recurrence info
   ├─ Creates Google Calendar event with RRULE:
   │   "RRULE:FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20251231T235959Z"
   ├─ Google Calendar automatically handles all recurring instances
   └─ Sends invites to students (students see entire series)
8. Success:
   ├─ Toast: "Recurring class scheduled (16 sessions)"
   └─ Calendar shows all instances
```

### **Workflow 4: View & Archive Recording**

```
1. Teacher navigates to Classes page → "Past Classes"
2. Sees class:
   "Oct 28 - 14:00 | Workplace Communication"
   "📹 Recording available | Expires in 28 days"
3. Clicks "View Recording"
   ├─ Opens Google Drive link in new tab
   └─ Teacher watches recording
4. Teacher decides to keep recording permanently
5. Clicks "Keep Forever" button
6. Confirmation dialog appears (see UI design above)
7. Clicks "Keep Forever"
8. Backend:
   ├─ Calls Google Drive API
   ├─ Moves file from "Meet Recordings" → "DualLing - Archived Classes"
   ├─ Updates Firestore:
   │   recordingRetention.archived = true
   │   recordingRetention.archivedAt = now()
   └─ Removes auto-delete date
9. Success:
   ├─ Toast: "Recording archived successfully"
   ├─ UI updates: "📹 Recording archived (permanent)"
   └─ "Keep Forever" button hidden, "View Recording" remains
```

### **Workflow 5: Auto-Delete Expired Recordings (Background Job)**

```
1. Cloud Function runs daily at 2:00 AM UTC
2. Queries Firestore for classes where:
   recordingRetention.expiresAt < now()
   AND recordingRetention.archived = false
3. For each expired recording:
   ├─ Calls Google Drive API: drive.files.delete(recordingDriveId)
   ├─ Updates Firestore:
   │   recordingUrl = null
   │   recordingDriveId = null
   └─ Logs deletion event
4. (Optional) Sends teacher email:
   "Recording for '{Class Title}' deleted after 30 days retention"
```

---

## 🛠️ Implementation Plan

### **Phase 5.1: Google OAuth & Calendar Integration (Day 1-2)**

**Tasks:**
1. ✅ Set up Google Cloud Project & enable APIs:
   - Google Calendar API
   - Google Meet API
   - Google Drive API
2. ✅ Configure OAuth 2.0 consent screen
3. ✅ Add OAuth scopes:
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`
4. ✅ Create GoogleAuthService in `lib/services/google/`:
   - `authenticateTeacher()` - OAuth flow
   - `refreshAccessToken()` - Auto-refresh
   - `storeTokens()` - Save to Firestore
5. ✅ Update Firestore `users` collection:
   ```typescript
   googleTokens?: {
     accessToken: string;
     refreshToken: string;
     expiresAt: Timestamp;
     scope: string;
   }
   ```
6. ✅ Create OAuth callback page: `/app/auth/google-callback/page.tsx`
7. ✅ Add "Connect Google Account" button to teacher settings

**Files to Create:**
- `lib/services/google/google-auth.service.ts`
- `lib/services/google/google-calendar.service.ts`
- `app/api/google/auth/callback/route.ts`
- `app/teacher/settings/google/page.tsx`

**Testing Checklist:**
- [ ] Teacher can initiate OAuth flow
- [ ] Google consent screen appears correctly
- [ ] Access/refresh tokens stored in Firestore
- [ ] Token auto-refresh working (test after 1 hour)

---

### **Phase 5.2: Calendar Event Creation (Day 2-3)**

**Tasks:**
1. ✅ Create CalendarService in `lib/services/google/`:
   - `createOneTimeClass()` - Single event
   - `createRecurringClass()` - With RRULE
   - `createInstantMeeting()` - Immediate start
   - `updateClass()` - Modify event
   - `cancelClass()` - Delete event
2. ✅ Create `classes` Firestore collection with schema (see Data Models)
3. ✅ Create ClassRepository in `lib/repositories/`:
   - `create()`, `getById()`, `getByTeacher()`, `update()`, `delete()`
4. ✅ Create ClassService in `lib/services/`:
   - `scheduleClass()` - Orchestrates Calendar + Firestore
   - `startInstantMeeting()` - Quick start
   - `getUpcomingClasses()` - Teacher dashboard
   - `getPastClasses()` - Recording list
5. ✅ Create API endpoints:
   - `POST /api/classes` - Schedule new class
   - `GET /api/classes` - List classes (with filters)
   - `PUT /api/classes/[id]` - Update class
   - `DELETE /api/classes/[id]` - Cancel class
   - `POST /api/classes/instant` - Start instant meeting

**Files to Create:**
- `lib/services/google/google-calendar.service.ts`
- `lib/services/class.service.ts`
- `lib/repositories/class.repository.ts`
- `app/api/classes/route.ts`
- `app/api/classes/[id]/route.ts`
- `app/api/classes/instant/route.ts`

**Google Calendar API Calls:**
```typescript
// Example: Create one-time class
const event = await calendar.events.insert({
  calendarId: 'primary',
  conferenceDataVersion: 1,
  requestBody: {
    summary: classTitle,
    description: agenda,
    start: { dateTime: startTime, timeZone: timezone },
    end: { dateTime: endTime, timeZone: timezone },
    attendees: studentEmails.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 1440 },
        { method: 'popup', minutes: 30 }
      ]
    }
  }
});

// Extract Meet link
const meetLink = event.data.conferenceData.entryPoints[0].uri;
```

**Testing Checklist:**
- [ ] One-time class creates Calendar event successfully
- [ ] Google Meet link generated and saved
- [ ] Student emails added as attendees
- [ ] Calendar invite emails sent automatically
- [ ] Recurring class creates with correct RRULE
- [ ] Instant meeting starts immediately with valid Meet link

---

### **Phase 5.3: UI Components (Day 3-4)**

**Tasks:**
1. ✅ Create Schedule Class Modal:
   - `components/teacher/schedule-class-modal.tsx`
   - Course/lesson dropdowns (fetch from Firestore)
   - One-time vs Recurring toggle
   - Date/time pickers (use shadcn/ui components)
   - Recurrence builder (weekly pattern, end date)
   - Participant selector (enrolled students + external)
   - Recording toggle
2. ✅ Create Classes Page:
   - `app/teacher/classes/page.tsx`
   - Embed Google Calendar widget (iframe or API-based)
   - Upcoming classes list (next 7 days)
   - Past classes list (last 30 days with recordings)
   - "Start Instant Meeting" quick action
3. ✅ Update Teacher Dashboard:
   - Add "Schedule Class" quick action card
   - Upcoming classes widget (next 3 classes)
4. ✅ Update Course Edit Page:
   - Add "Classes" tab
   - "Schedule Class for Course" button
   - Recent classes list with recordings
5. ✅ Create Instant Meeting Modal:
   - `components/teacher/instant-meeting-modal.tsx`
   - Quick student selector (all enrolled or manual)
   - "Start Now" button

**Files to Create:**
- `components/teacher/schedule-class-modal.tsx` (400-500 lines)
- `components/teacher/instant-meeting-modal.tsx` (200 lines)
- `components/teacher/class-card.tsx` (150 lines)
- `components/teacher/upcoming-classes-widget.tsx` (200 lines)
- `app/teacher/classes/page.tsx` (600 lines)

**shadcn/ui Components Needed:**
- `Dialog` - Modals
- `Select` - Dropdowns
- `Calendar` - Date picker
- `Input` - Text fields
- `Textarea` - Description
- `Checkbox` - Participant selector
- `Switch` - Recording toggle
- `Badge` - External user indicator

**Testing Checklist:**
- [ ] Modal opens correctly from all entry points
- [ ] Course/lesson dropdowns populate with real data
- [ ] Date/time picker works across timezones
- [ ] Recurrence builder generates correct patterns
- [ ] External participant indicator shows correctly
- [ ] Form validation working (required fields)
- [ ] Classes page displays calendar and lists
- [ ] Dashboard widget shows next 3 classes
- [ ] Course edit page shows course-specific classes

---

### **Phase 5.4: Recording Management (Day 4-5)**

**Tasks:**
1. ✅ Create DriveService in `lib/services/google/`:
   - `listRecordings()` - Query Meet Recordings folder
   - `getRecordingUrl()` - Generate shareable link
   - `moveToArchive()` - Relocate file
   - `deleteRecording()` - Remove file
   - `checkRetention()` - Calculate expiry
2. ✅ Create Cloud Function: `functions/src/recordingCleanup.ts`
   - Scheduled to run daily at 2:00 AM UTC
   - Queries expired recordings from Firestore
   - Deletes files from Google Drive
   - Updates Firestore documents
   - Logs deletion events
3. ✅ Create API endpoints:
   - `GET /api/classes/[id]/recording` - Fetch recording details
   - `POST /api/classes/[id]/recording/archive` - Keep forever
   - `DELETE /api/classes/[id]/recording` - Delete now
4. ✅ Update UI:
   - "View Recording" button (opens Drive link)
   - "Keep Forever" button (shows confirmation dialog)
   - "Delete Now" button (with confirmation)
   - Expiry countdown badge ("28 days left")

**Files to Create:**
- `lib/services/google/google-drive.service.ts`
- `functions/src/recordingCleanup.ts`
- `app/api/classes/[id]/recording/route.ts`
- `app/api/classes/[id]/recording/archive/route.ts`
- `components/teacher/recording-actions.tsx`

**Google Drive API Calls:**
```typescript
// List recordings in Meet Recordings folder
const response = await drive.files.list({
  q: "name contains 'Class Title' and mimeType='video/mp4'",
  spaces: 'drive',
  fields: 'files(id, name, webViewLink, createdTime)',
  orderBy: 'createdTime desc'
});

// Move to archive
await drive.files.update({
  fileId: recordingDriveId,
  addParents: archiveFolderId,
  removeParents: meetRecordingsFolderId
});

// Delete recording
await drive.files.delete({
  fileId: recordingDriveId
});
```

**Cloud Function - Firestore Trigger:**
```typescript
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';

export const recordingCleanup = functions.pubsub
  .schedule('0 2 * * *') // Daily at 2:00 AM UTC
  .timeZone('UTC')
  .onRun(async (context) => {
    const db = getFirestore();
    const now = new Date();
    
    const expiredClasses = await db.collection('classes')
      .where('recordingRetention.expiresAt', '<', now)
      .where('recordingRetention.archived', '==', false)
      .get();
    
    for (const doc of expiredClasses.docs) {
      const classData = doc.data();
      const { recordingDriveId } = classData;
      
      try {
        // Delete from Google Drive
        await drive.files.delete({ fileId: recordingDriveId });
        
        // Update Firestore
        await doc.ref.update({
          recordingUrl: null,
          recordingDriveId: null,
          'recordingRetention.deleted': true,
          'recordingRetention.deletedAt': now
        });
        
        console.log(`Deleted recording: ${doc.id}`);
      } catch (error) {
        console.error(`Failed to delete ${doc.id}:`, error);
      }
    }
  });
```

**Testing Checklist:**
- [ ] Recording URL correctly fetched from Drive
- [ ] "View Recording" opens correct Drive file
- [ ] "Keep Forever" moves file to archive folder
- [ ] Firestore updates correctly (archived: true)
- [ ] "Delete Now" removes file and updates Firestore
- [ ] Expiry countdown displays correctly
- [ ] Cloud Function deletes expired recordings on schedule
- [ ] Manual test: Set retention to 1 minute, verify deletion

---

### **Phase 5.5: Notifications & Polish (Day 5)**

**Tasks:**
1. ✅ Email notifications already handled by Google Calendar invites
2. ✅ Add in-app notification placeholder:
   - Show toast when class scheduled
   - Future: Real-time notifications via Firebase Cloud Messaging
3. ✅ Polish UI:
   - Loading states for all API calls
   - Error handling (show user-friendly messages)
   - Empty states ("No upcoming classes")
   - Success toasts after actions
4. ✅ Documentation:
   - Update `MAIN.md` with new feature
   - Create `GOOGLE_MEET_INTEGRATION_COMPLETE.md`
   - Update teacher onboarding guide

**Files to Update:**
- `docs/MAIN.md`
- `docs/GOOGLE_MEET_INTEGRATION_COMPLETE.md` (new)

**Testing Checklist:**
- [ ] All loading states working
- [ ] Error messages clear and actionable
- [ ] Empty states shown when no data
- [ ] Success toasts displayed after actions
- [ ] Documentation complete and accurate

---

## 🧪 Testing Strategy

### **Unit Tests**

```typescript
// lib/services/google/__tests__/google-calendar.service.test.ts
describe('GoogleCalendarService', () => {
  it('should create one-time class event', async () => {
    const classData = { /* mock data */ };
    const event = await calendarService.createOneTimeClass(classData);
    expect(event.conferenceData.entryPoints[0].uri).toContain('meet.google.com');
  });

  it('should create recurring class with weekly pattern', async () => {
    const classData = { /* mock data with recurrence */ };
    const event = await calendarService.createRecurringClass(classData);
    expect(event.recurrence[0]).toContain('RRULE:FREQ=WEEKLY');
  });
});

// lib/services/google/__tests__/google-drive.service.test.ts
describe('GoogleDriveService', () => {
  it('should list recordings for a class', async () => {
    const recordings = await driveService.listRecordings('classId123');
    expect(recordings).toHaveLength(1);
    expect(recordings[0].name).toContain('Class Title');
  });

  it('should move recording to archive', async () => {
    await driveService.moveToArchive('fileId123', 'archiveFolderId');
    // Assert file parents changed
  });
});
```

### **Integration Tests (Playwright MCP)**

```typescript
// Test Scenario 1: Schedule one-time class
test('Teacher can schedule one-time class', async ({ page }) => {
  await page.goto('https://localhost:3000/teacher/classes');
  await page.click('button:has-text("Schedule Class")');
  
  // Fill form
  await page.selectOption('select[name="courseId"]', 'course123');
  await page.fill('input[name="title"]', 'Test Class');
  await page.fill('textarea[name="description"]', 'Test agenda');
  await page.click('input[value="one-time"]');
  await page.fill('input[name="date"]', '2025-11-05');
  await page.fill('input[name="time"]', '14:00');
  
  // Submit
  await page.click('button:has-text("Schedule Class")');
  
  // Assert
  await expect(page.locator('text=Class scheduled!')).toBeVisible();
  await expect(page.locator('text=Test Class')).toBeVisible();
});

// Test Scenario 2: Start instant meeting
test('Teacher can start instant meeting', async ({ page }) => {
  await page.goto('https://localhost:3000/teacher/classes');
  await page.click('button:has-text("Start Instant Meeting")');
  
  // Select students
  await page.check('input[value="all-students"]');
  await page.click('button:has-text("Start Now")');
  
  // Assert Meet link generated
  await expect(page.locator('a[href*="meet.google.com"]')).toBeVisible();
});

// Test Scenario 3: Archive recording
test('Teacher can archive recording', async ({ page }) => {
  await page.goto('https://localhost:3000/teacher/classes');
  await page.click('button:has-text("Keep Forever"):first');
  
  // Confirm dialog
  await page.click('button:has-text("Keep Forever"):last');
  
  // Assert
  await expect(page.locator('text=Recording archived')).toBeVisible();
  await expect(page.locator('text=📹 Recording archived (permanent)')).toBeVisible();
});
```

### **Manual Test Cases**

#### **TC-001: Schedule One-Time Class**
1. Navigate to Classes page
2. Click "Schedule Class"
3. Fill all required fields (course, title, date/time, students)
4. Click "Schedule Class"
5. **Expected:** Class appears in upcoming list, calendar invite sent

#### **TC-002: Schedule Recurring Class (Weekly)**
1. Navigate to Classes page
2. Click "Schedule Class"
3. Select "Recurring" class type
4. Set weekly recurrence (Tue, Thu)
5. Set end date
6. Click "Schedule Class"
7. **Expected:** All recurring instances show in calendar

#### **TC-003: Start Instant Meeting**
1. Click "Start Instant Meeting"
2. Select students
3. Click "Start Now"
4. **Expected:** Meet link opens in new tab, students receive invite

#### **TC-004: Add External Participant**
1. Schedule class, click "Add external participants"
2. Enter external email
3. Click "Schedule Class"
4. **Expected:** External email receives invite, ⚠️ indicator shown

#### **TC-005: View Recording**
1. Navigate to Past Classes
2. Click "View Recording"
3. **Expected:** Google Drive opens in new tab with video

#### **TC-006: Archive Recording**
1. Navigate to Past Classes
2. Click "Keep Forever"
3. Confirm dialog
4. **Expected:** Recording moved to archive, expiry removed

#### **TC-007: Delete Recording**
1. Navigate to Past Classes
2. Click "Delete Now"
3. Confirm dialog
4. **Expected:** Recording deleted from Drive and Firestore

#### **TC-008: Auto-Delete Expired Recording**
1. Manually set retention to 1 minute in Firestore
2. Wait 2 minutes
3. Run Cloud Function manually
4. **Expected:** Recording deleted, Firestore updated

---

## 🔐 Security & Privacy

### **Google OAuth Scopes (Least Privilege)**

```
✅ calendar.events - Create/read/update calendar events
✅ drive.readonly - List recordings
✅ drive.file - Manage files created by app (recordings)
❌ drive - Full Drive access (NOT NEEDED)
❌ gmail - Email access (NOT NEEDED)
```

### **Firestore Security Rules**

```javascript
// classes collection
match /classes/{classId} {
  // Teachers can read their own classes
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.teacherId;
  
  // Teachers can create classes
  allow create: if request.auth != null && 
    request.auth.token.role == 'teacher' &&
    request.auth.uid == request.resource.data.teacherId;
  
  // Teachers can update/delete their own classes
  allow update, delete: if request.auth != null && 
    request.auth.uid == resource.data.teacherId;
}

// Students can only read classes they're enrolled in
match /classes/{classId} {
  allow read: if request.auth != null &&
    request.auth.uid in resource.data.participants.studentIds;
}
```

### **API Endpoint Security**

```typescript
// POST /api/classes
export async function POST(request: Request) {
  // 1. Verify Firebase token
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const decodedToken = await getAdminAuth().verifyIdToken(token);
  
  // 2. Check teacher role
  if (decodedToken.role !== 'teacher') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  // 3. Validate input
  const body = await request.json();
  const validatedData = scheduleClassSchema.parse(body);
  
  // 4. Check course ownership
  const course = await CourseRepository.getById(validatedData.courseId);
  if (course.teacherId !== decodedToken.uid) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 5. Proceed with class creation
  const newClass = await ClassService.scheduleClass(validatedData);
  return Response.json({ success: true, class: newClass });
}
```

### **Data Privacy**

- **Student emails:** Only visible to teachers who own the course
- **Recording URLs:** Only accessible to the teacher who created the class
- **Google tokens:** Stored encrypted in Firestore (Firebase handles encryption at rest)
- **External participants:** Clearly marked with ⚠️ indicator to prevent accidental additions

### **GDPR Compliance**

- ✅ Teachers consent to Google OAuth scopes before connecting
- ✅ Recording retention policy clearly stated (30 days default)
- ✅ Teachers can delete recordings manually (data erasure)
- ✅ Auto-delete after 30 days (data minimization)
- ✅ Students receive calendar invites (transparent data processing)

---

## 💰 Cost Estimate

### **Google APIs - Free Tier Usage**

| API | Free Quota | Expected Usage | Cost |
|-----|-----------|----------------|------|
| Google Calendar API | 1M requests/day | ~500 requests/day | **$0** |
| Google Meet API | Unlimited (no direct API) | N/A | **$0** |
| Google Drive API | 1B queries/day | ~200 queries/day | **$0** |

**Total Google API Cost:** **$0/month** (within free tier)

### **Firebase Cloud Functions**

| Function | Invocations/Month | Cost |
|----------|-------------------|------|
| recordingCleanup (daily cron) | 30 | **$0** (125K free) |

**Total Cloud Functions Cost:** **$0/month**

### **Firestore Storage**

| Data | Size | Cost |
|------|------|------|
| `classes` collection | ~1 KB/doc × 1,000 docs = 1 MB | **$0** (1 GB free) |

**Total Firestore Cost:** **$0/month**

### **Google Drive Storage (Teacher's Account)**

- Recording storage is on the **teacher's personal Google Drive**
- Not billed to the platform
- Teachers with free Gmail accounts: 15 GB free storage
- Teachers with Google Workspace: Varies by plan (30 GB - unlimited)

**Total Drive Cost:** **$0** (teacher's responsibility)

---

**GRAND TOTAL COST: $0/month** (within free tiers)

---

## 📊 Success Metrics

### **Adoption Metrics**
- % of teachers who connect Google account (target: 80%)
- % of teachers who schedule at least 1 class (target: 60%)
- Average classes scheduled per teacher per week (target: 2-3)

### **Usage Metrics**
- Total classes scheduled (one-time vs recurring ratio)
- Total instant meetings started
- Average students per class (target: 5-8)
- % of classes with recordings enabled (target: 90%)

### **Retention Metrics**
- % of recordings archived (kept forever)
- % of recordings auto-deleted after 30 days
- Average recording view count per teacher

### **Technical Metrics**
- Google Calendar API success rate (target: >99%)
- Average time to create class (target: <3 seconds)
- Meet link generation success rate (target: 100%)
- Cloud Function execution success rate (target: >99%)

---

## 🔮 Future Enhancements (Phase 6)

### **Student-Facing Features**
- [ ] Student calendar view (see enrolled class schedule)
- [ ] In-app notifications (15 min before class starts)
- [ ] Attendance tracking (auto-detect join/leave times)
- [ ] Class recordings visible to enrolled students (teacher permission)
- [ ] Homework submission before/after class

### **Teacher Features**
- [ ] Batch schedule classes (import CSV)
- [ ] Class templates (save common schedules)
- [ ] Recording transcripts (auto-generated via Speech-to-Text API)
- [ ] Attendance reports (CSV export)
- [ ] Class analytics (average attendance, duration, engagement)

### **Advanced Integrations**
- [ ] Zoom integration (alternative to Google Meet)
- [ ] Microsoft Teams integration
- [ ] Calendar sync (iCal, Outlook, Apple Calendar)
- [ ] Automated recording highlights (AI-generated summaries)
- [ ] Breakout rooms support

---

## 🚨 Risk Mitigation

### **Risk 1: Google OAuth Consent Screen Approval**
**Impact:** High (blocks entire feature)  
**Mitigation:**
- Use "Testing" mode during development (up to 100 test users)
- Prepare for OAuth verification process (Google review takes 2-4 weeks)
- Document all scopes with clear justification
- Create privacy policy and terms of service pages

### **Risk 2: Google Meet Recording Not Auto-Enabled**
**Impact:** Medium (teachers must manually enable in Meet)  
**Mitigation:**
- Add onboarding guide: "How to enable recording in Google Meet"
- Show reminder when scheduling class: "Don't forget to start recording!"
- (Future) Integrate with Google Meet API if recording automation becomes available

### **Risk 3: Calendar Invite Spam (Students)**
**Impact:** Low (email overload for students)  
**Mitigation:**
- Teachers see participant count before scheduling
- "Send invites" checkbox (default: on, can disable for internal tracking)
- (Future) In-app notifications as alternative

### **Risk 4: Teacher's Google Drive Storage Full**
**Impact:** Medium (recordings fail to save)  
**Mitigation:**
- Show warning if Drive storage >90% full
- Encourage teachers to archive or delete old recordings
- (Future) Option to save to school's shared Drive

### **Risk 5: Timezone Confusion**
**Impact:** Medium (students miss classes)  
**Mitigation:**
- Auto-detect teacher's timezone, show in UI
- Calendar invites include timezone (Google handles conversion)
- Show warning if external participant is in different timezone

---

## ✅ Definition of Done

**This feature is COMPLETE when:**
- [ ] Teachers can connect Google account via OAuth
- [ ] Teachers can schedule one-time classes with enrolled students
- [ ] Teachers can schedule recurring classes (weekly patterns)
- [ ] Teachers can start instant meetings
- [ ] Teachers can add external participants (with indicator)
- [ ] Google Meet links generated automatically
- [ ] Calendar invites sent to students via email
- [ ] Classes page shows upcoming and past classes
- [ ] Recording URLs fetched from Google Drive
- [ ] Teachers can archive recordings ("Keep Forever")
- [ ] Teachers can delete recordings manually
- [ ] Cloud Function deletes expired recordings after 30 days
- [ ] All UI components responsive and accessible
- [ ] All API endpoints have error handling
- [ ] Security rules enforce teacher ownership
- [ ] Documentation complete (MAIN.md, GOOGLE_MEET_INTEGRATION_COMPLETE.md)
- [ ] Playwright MCP tests pass (3 core scenarios)
- [ ] Manual testing checklist completed (8 test cases)
- [ ] Git commit with clear message (e.g., `feat: Add Google Meet/Calendar integration`)

---

## 🔗 Related Documents

- [MAIN.md](./MAIN.md) - Internal Knowledge Base entry point
- [CURRENT_ARCHITECTURE.md](./CURRENT_ARCHITECTURE.md) - System architecture overview
- [FIREBASE_AUTH_SYSTEM.md](./FIREBASE_AUTH_SYSTEM.md) - Authentication patterns
- [API_ENDPOINTS.md](./API_ENDPOINTS.md) - API reference (to be updated)

---

**Document Owner:** ZenType Architect (J)  
**Created:** October 30, 2025  
**Status:** READY FOR IMPLEMENTATION  
**Next Step:** Begin Phase 5.1 (Google OAuth & Calendar Integration)
