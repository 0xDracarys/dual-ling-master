# LangExchange - Lithuanian-English Learning Platform

A comprehensive e-learning platform built with Next.js 15, featuring role-based access control for Students, Teachers, and Admins. Supports interactive courses with lessons, quizzes, and progress tracking.

---

## 🔥 **CONTINUING DEVELOPMENT IN NEW AI SESSION?**

**📋 READ THIS FIRST:** [`START_HERE_NEXT_SESSION.txt`](./START_HERE_NEXT_SESSION.txt)

**Full Context:** [`NEXT_SESSION_PROMPT.md`](./NEXT_SESSION_PROMPT.md)

**Current Status:** Phase 3 Week 1 Complete (Course Service implemented)
**Branch:** `firebase-migration`
**Documentation:** [`docs/SESSION_HANDOFF_OCT_9_2025.md`](./docs/SESSION_HANDOFF_OCT_9_2025.md)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (recommended: 20+)
- pnpm (or npm/yarn)
- MongoDB instance (local or Atlas)
- Firebase project (optional, for authentication)

### Installation

```powershell
# Clone and navigate to project
cd dual-ling

# Install dependencies
pnpm install

# Set up environment variables
Copy-Item .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev
```

The app will be available at `http://localhost:3000` (or next available port).

## 📋 Environment Setup

Create `.env.local` in the project root:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/langexchange

# JWT (current auth system)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Firebase (optional - for new auth)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
GOOGLE_APPLICATION_CREDENTIALS=C:\\path\\to\\service-account.json
# OR inline (for hosting)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

## 🏗️ Project Structure

```
dual-ling/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (backend)
│   │   ├── auth/         # Login, register endpoints
│   │   ├── courses/      # Course CRUD
│   │   ├── progress/     # Progress tracking
│   │   └── ...
│   ├── dashboard/        # Student dashboard
│   ├── teacher/          # Teacher interface
│   ├── admin/            # Admin panel
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── navigation/       # Navbar
│   └── lessons/          # Lesson viewer, quiz
├── lib/                   # Backend utilities
│   ├── auth/             # Auth helpers (JWT + Firebase)
│   ├── firebase/         # Firebase init (client/admin)
│   ├── models/           # Mongoose schemas
│   ├── services/         # Business logic
│   └── validation/       # Zod schemas
├── hooks/                 # Custom React hooks
│   └── use-auth.tsx      # Auth context
├── __tests__/            # Jest tests
└── public/               # Static assets
```

## 🔑 Authentication

### Current System: JWT + MongoDB
- Email/password registration and login
- JWT tokens stored in localStorage
- Role-based access control (student/teacher/admin)

### Migration to Firebase (In Progress)
Firebase SDK has been scaffolded but not yet integrated:
- Client SDK: `lib/firebase/client.ts`
- Admin SDK: `lib/firebase/admin.ts`
- Auth helpers: `lib/auth/firebase-auth.ts`

**To complete Firebase migration**, see `docs/FIREBASE_MIGRATION.md` (TODO).

## 👥 User Roles

### Student
- Enroll in courses
- View lessons and take quizzes
- Track learning progress
- View personal dashboard

### Teacher
- Create and manage courses
- Add lessons (text, video, quiz)
- View student progress
- Manage enrollments

### Admin
- Manage all users and roles
- View all courses and content
- Access system analytics
- Configure platform settings

## 🧪 Testing

```powershell
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Test Structure
- `__tests__/api/` - API endpoint tests (with mongodb-memory-server)
- `__tests__/lib/` - Unit tests for utilities and business logic

## 🛠️ Development Scripts

```powershell
# Development server
pnpm dev

# Type checking
pnpm exec tsc --noEmit

# Linting
pnpm lint

# Production build
pnpm build

# Start production server
pnpm start
```

## 🐛 Known Issues & Fixes

### Hydration Errors (FIXED ✅)
**Problem:** Errors on page load/click due to localStorage access during SSR.

**Solution:** Added mount guard in `AuthProvider` to prevent hydration mismatch.

See `HYDRATION_FIX.md` for detailed explanation.

### TypeScript Errors (TODO)
- 35 compile errors in tests and API routes
- Missing type definitions for @jest/globals
- Some API routes have type mismatches
- **Priority:** Fix before production deployment

## 📦 Tech Stack

### Frontend
- **Framework:** Next.js 15.2 (App Router)
- **UI Library:** React 19
- **Styling:** TailwindCSS + shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js (Next.js API routes)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (current) + Firebase (planned)
- **Validation:** Zod schemas

### Development
- **Language:** TypeScript 5
- **Testing:** Jest + ts-jest
- **Package Manager:** pnpm
- **Linting:** ESLint (Next.js config)

## 🗺️ Product Roadmap

Based on `PRD.md`, the platform is being built in phases:

- [x] **Phase 0:** Project setup and architecture
- [x] **Phase 1:** Backend foundation (API, auth, DB schemas)
- [x] **Phase 2:** Student interface (dashboard, course viewer)
- [ ] **Phase 3:** Teacher interface (course builder, student tracking)
- [ ] **Phase 4:** Admin interface (user/course management)
- [ ] **Phase 5:** Polish & testing (responsive design, performance)

## 🚧 Immediate Next Steps

1. **Fix TypeScript Errors**
   - Add @jest/globals types
   - Fix API route type issues
   - Resolve model interface mismatches

2. **Complete Firebase Integration**
   - Wire Firebase auth into API middleware
   - Migrate login/register to Firebase
   - Set custom claims for roles

3. **Improve Test Coverage**
   - Add tests for lesson viewer and quiz components
   - Test teacher course creation flow
   - Add E2E tests with Playwright

4. **Documentation**
   - API endpoint documentation
   - Component storybook
   - Deployment guide

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make changes and add tests
3. Ensure `pnpm test` and `pnpm lint` pass
4. Run `pnpm exec tsc --noEmit` to check types
5. Submit a pull request

## 📄 License

Private project - All rights reserved.

## 🔗 Related Documentation

- [Product Requirements Document](PRD.md)
- [Hydration Fix Details](HYDRATION_FIX.md)
- [CSS Best Practices](docs/CSS_BEST_PRACTICES.md)

## 🆘 Getting Help

- Check existing issues in the repository
- Review the PRD for feature specifications
- Consult Next.js docs for framework questions

---

Built with ❤️ for language learners worldwide 🇱🇹 🇺🇸
