# Step by Step English â€” E-Learning Platform

A full-featured e-learning platform for English language teaching, built with Next.js and Firebase. It supports three roles â€” **Student**, **Teacher**, and **Admin** â€” with courses, lessons, quizzes, progress tracking, live online classes with recordings, and AI-assisted course creation.

---

## Features

- **Courses & lessons** â€” teachers build courses from video, reading, and quiz lessons; students enroll and learn at their own pace
- **Quizzes** â€” auto-graded on the server, with attempt history and pass-based lesson completion
- **Progress tracking** â€” per-lesson video/reading progress, course completion, XP and streaks
- **Live classes** â€” schedule one-off or recurring classes with Google Meet, automatic calendar events, and class recordings via Google Drive
- **AI for teachers** â€” Gemini-powered course generation and an AI teacher assistant (chat) that can draft and build course content; AI access is controlled per teacher by the admin
- **Google integration** â€” teachers connect their Google account (Calendar, Drive, Meet) with OAuth 2.0
- **Admin panel** â€” user and role management, AI access control, platform settings, statistics
- **Authentication** â€” email/password and Google sign-in, Firebase role-based access control (custom claims)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14.2 (App Router), React 18, TypeScript 5 |
| UI | Tailwind CSS, shadcn/ui, Lucide icons |
| Backend | Next.js API routes, Firebase Admin SDK |
| Database / Auth / Files | Cloud Firestore, Firebase Authentication, Firebase Storage |
| AI | Google Gemini (course generation + teacher assistant) |
| Integrations | Google Calendar / Drive / Meet (googleapis) |
| Testing | Jest |

## Quick Start

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm
- A Firebase project with Authentication (Email/Password + Google), Firestore, and Storage enabled

### Install and run

```bash
npm install --legacy-peer-deps   # the flag is required (legacy eslint peer conflict)
cp .env.example .env.local       # then fill in real values â€” see below
npm run dev                      # http://localhost:3000
```

### Production

```bash
npm run build
npm start
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values. Never commit `.env.local` or any service-account key file.

| Group | Variables | Purpose |
| --- | --- | --- |
| Firebase (client) | `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Public web configuration from the Firebase console |
| Firebase Admin | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Server-side Admin SDK credentials (on GCP/Cloud Run, Application Default Credentials are used instead) |
| Google OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | "Connect Google account" flow for teachers; the redirect URI must point at `/api/google/auth/callback` |
| AI | `GEMINI_API_KEY`, `AI_TEACHER_MODEL` | Fallback/defaults â€” the live Gemini key and model are managed in the admin settings (`system_settings/global`) |

## Firebase Setup

Deploy the security rules and indexes from this repository to your Firebase project:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

- `firestore.rules` â€” role- and ownership-based access. Privileged fields (`role`, `aiEnabled`) can only be changed by admins or server-side code.
- `storage.rules` â€” course files are writable only by the owning teacher or an admin; lesson resources are validated by type and size (50 MB max).
- `firestore.indexes.json` â€” composite indexes used by course, enrollment, and lesson queries.

## User Roles

- **Student** â€” enroll in published courses, view lessons, take quizzes, track progress, join live classes
- **Teacher** â€” create and publish courses and lessons, manage enrollments, schedule classes, connect Google, use AI tools (when enabled by an admin)
- **Admin** â€” manage users and roles, enable/disable AI per teacher, configure platform settings (including the Gemini key/model), view statistics

Roles are enforced server-side on every API route using Firebase custom claims â€” the client UI is never the security boundary.

## Project Structure

```
app/                  # Next.js App Router: pages + API routes
  api/                # REST endpoints (auth, courses, classes, google, ai, admin, ...)
  admin/  teacher/    # Role dashboards
components/           # React components (lessons, quiz, UI kit)
lib/
  firebase/           # Firebase client + Admin SDK initialization
  services/           # Business logic (auth, courses, classes, quiz, progress, google, ai)
  repositories/       # Data access
hooks/                # React hooks (use-auth, ...)
functions/src/        # Firebase Functions subproject source
scripts/              # One-off maintenance/seed scripts (see notes below)
docs/                 # Extended documentation
__tests__/            # Jest tests
```

## Scripts

```bash
npm run dev            # Development server
npm run build          # Production build
npm start              # Start production server
npm run lint           # Lint
npm test               # Run Jest tests
npm run test:coverage  # Coverage report
```

## Security Notes (handover, November 2026)

This codebase went through a pre-handover security audit; all code-level findings were fixed. Points the project owner should know:

1. **Delete any demo/test accounts** in the Firebase project before launch. The public demo page that displayed sample credentials has been removed from the code, but accounts created earlier may still exist in Firebase Authentication.
2. **Deploy the rules and indexes** (see *Firebase Setup*) â€” code and rules only protect the platform together.
3. **AI access is opt-in per teacher.** An admin enables it per user in the admin panel (`aiEnabled`); both the course generator and the teacher assistant enforce it.
4. **Google tokens are stored server-side only**, in a `userSecrets` collection that no client can read. Teachers connected before this change are migrated automatically on first use.
5. **Seed scripts require a password from the environment** (`SEED_PASSWORD`) â€” there are no shared default passwords in the repository anymore. Only run seed scripts against development projects.
6. Teacher accounts can currently be created through the public registration form. If sign-up should be restricted, add an admin-approval step or disable teacher self-registration in `app/api/auth/register`.

## License

Private project â€” all rights reserved.
