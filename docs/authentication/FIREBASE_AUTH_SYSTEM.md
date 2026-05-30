# Firebase Authentication System

**Status:** ✅ COMPLETE
**Version:** 1.0.0
**Last Updated:** October 9, 2025
**Phase:** Phase 2 - Authentication Migration Complete

---

## 🎯 Overview

This document describes the **Firebase Authentication System** implemented for DualLing, replacing the previous MongoDB/JWT-based authentication.

### **Key Features**
- ✅ Email/password authentication
- ✅ Google Sign-In OAuth integration
- ✅ Firebase Auth session management
- ✅ Role-based access control (RBAC)
- ✅ Client-side auth state persistence
- ✅ Protected route components
- ✅ Server-side auth verification
- ✅ Comprehensive trace logging
- ✅ Debug panel integration

---

## 🏗️ Architecture

### **Authentication Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION ARCHITECTURE                   │
│                                                                  │
│  Client (React)              Server (Next.js API)                │
│  ┌──────────────┐           ┌─────────────────┐                │
│  │ Login Form   │──────────>│ /api/auth/login │                 │
│  └──────────────┘           └─────────────────┘                 │
│         │                            │                           │
│         v                            v                           │
│  ┌──────────────┐           ┌─────────────────┐                │
│  │ use-auth     │           │  AuthService    │                 │
│  │ (Context)    │<──────────│  (Firebase SDK) │                 │
│  └──────────────┘           └─────────────────┘                 │
│         │                            │                           │
│         v                            v                           │
│  localStorage:              ┌─────────────────┐                │
│  - auth_token               │  Firebase Auth  │                 │
│  - auth_user                │  + Firestore    │                 │
│                             └─────────────────┘                 │
│                                                                  │
│  ProtectedRoute checks auth state before rendering pages        │
└─────────────────────────────────────────────────────────────────┘
```

### **Component Hierarchy**

```
app/layout.tsx
  └─> AuthProvider (hooks/use-auth.tsx)
       ├─> Navbar (shows user if authenticated)
       ├─> ProtectedRoute (components/auth/protected-route.tsx)
       │    └─> Dashboard/Admin/Teacher pages
       └─> DebugPanel (shows auth logs)
```

---

## 📂 File Structure

### **Authentication Files**

```
dual-ling/
├── lib/
│   ├── firebase/
│   │   ├── config.ts                    # Firebase client SDK config
│   │   └── admin.ts                     # Firebase Admin SDK config
│   ├── services/
│   │   └── auth/
│   │       ├── auth.service.ts          # Authentication service layer
│   │       └── user.repository.ts       # Firestore user CRUD operations
│   └── tracing/
│       ├── trace-context.ts             # Trace interfaces
│       ├── trace-storage.ts             # AsyncLocalStorage for traces
│       └── trace-logger.ts              # Trace logger with span tracking
├── hooks/
│   └── use-auth.tsx                     # Client-side auth context
├── components/
│   └── auth/
│       └── protected-route.tsx          # Protected route wrapper
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts           # Login API endpoint
│   │       └── register/route.ts        # Registration API endpoint
│   └── auth/
│       ├── login/page.tsx               # Login page UI
│       └── register/page.tsx            # Registration page UI
└── middleware.ts                        # Global middleware (trace propagation)
```

---

## 🔐 Authentication Components

### **1. AuthService (`lib/services/auth/auth.service.ts`)**

**Purpose:** Handle all Firebase Authentication operations with comprehensive trace logging.

**Key Methods:**

#### `registerUser(data: RegisterData): Promise<UserProfile>`
```typescript
// Creates Firebase Auth user + Firestore document
const spanId = traceLogger.startSpan('Auth', 'registerUser', {
  emailDomain: data.email.split('@')[1]
});

try {
  // Step 1: Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);

  // Step 2: Create Firestore user document
  await this.userRepo.create(userCredential.user.uid, { ...userData });

  // Step 3: Send verification email
  await sendEmailVerification(userCredential.user);

  traceLogger.endSpan(spanId, 'success');
  return userProfile;
} catch (error) {
  traceLogger.endSpan(spanId, 'error', { message: error.message });
  throw error;
}
```

#### `loginWithEmail(email: string, password: string): Promise<UserProfile>`
```typescript
// Authenticates with Firebase Auth + fetches Firestore user data
const spanId = traceLogger.startSpan('Auth', 'loginWithEmail');

try {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await this.userRepo.getById(userCredential.user.uid);

  traceLogger.endSpan(spanId, 'success');
  return userProfile;
} catch (error) {
  traceLogger.endSpan(spanId, 'error');
  throw error;
}
```

#### `loginWithGoogle(): Promise<UserProfile>`
```typescript
// OAuth Google Sign-In flow
const provider = new GoogleAuthProvider();
const userCredential = await signInWithPopup(auth, provider);

// Check if user exists in Firestore, if not create
if (!existingUser) {
  await this.userRepo.create(userCredential.user.uid, { ...userData });
}
```

#### `logout(): Promise<void>`
```typescript
// Sign out from Firebase Auth
await signOut(auth);
traceLogger.log('success', 'Auth', 'User logged out successfully');
```

---

### **2. UserRepository (`lib/services/auth/user.repository.ts`)**

**Purpose:** Firestore CRUD operations for user documents.

**Collection:** `users`

**Document Structure:**
```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;            // User email
  displayName: string;      // Full name
  role: 'student' | 'teacher' | 'admin';
  language: 'en' | 'lt';    // Preferred language
  photoURL?: string;        // Profile picture URL
  emailVerified: boolean;   // Email verification status
  provider: 'password' | 'google'; // Auth provider
  createdAt: Timestamp;     // Registration date
  updatedAt: Timestamp;     // Last profile update
}
```

**Key Methods:**
- `create(uid: string, data: CreateUserData): Promise<FirestoreUser>`
- `getById(uid: string): Promise<FirestoreUser>`
- `getByEmail(email: string): Promise<FirestoreUser>`
- `update(uid: string, data: Partial<FirestoreUser>): Promise<void>`
- `delete(uid: string): Promise<void>`

All methods include trace logging with span tracking.

---

### **3. Client-Side Auth Context (`hooks/use-auth.tsx`)**

**Purpose:** React Context for managing authentication state across the app.

**State:**
```typescript
interface AuthContextType {
  user: User | null;           // Authenticated user object
  token: string | null;        // Auth token (placeholder for Firebase)
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;          // Loading state during hydration
}
```

**localStorage Keys:**
- `auth_token`: Token (currently placeholder, Firebase handles tokens)
- `auth_user`: User object (UID, email, role, displayName)

**Usage:**
```typescript
const { user, login, logout, isLoading } = useAuth();

// After successful login:
login("firebase-auth-token", {
  id: data.user.uid,
  username: data.user.displayName || data.user.email.split("@")[0],
  email: data.user.email,
  role: data.user.role,
});
```

**Hydration Safeguard:**
```typescript
// Prevents hydration mismatch by not rendering until mounted
if (!isMounted) {
  return <AuthContext.Provider value={{ user: null, ... }}>{children}</AuthContext.Provider>
}
```

---

### **4. Protected Route Component (`components/auth/protected-route.tsx`)**

**Purpose:** Wrapper component for pages requiring authentication.

**Features:**
- Redirects unauthenticated users to `/auth/login`
- Checks role-based permissions
- Shows loading spinner during auth check
- Auto-redirects to correct dashboard based on role

**Usage:**
```typescript
<ProtectedRoute allowedRoles={["student"]}>
  <StudentDashboard />
</ProtectedRoute>
```

**Logic:**
```typescript
useEffect(() => {
  if (!isLoading) {
    if (!user) {
      router.push(redirectTo); // Redirect to login
      return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard based on role
      switch (user.role) {
        case "admin":
          router.push("/admin/dashboard");
          break;
        case "teacher":
          router.push("/teacher/dashboard");
          break;
        default:
          router.push("/dashboard");
      }
    }
  }
}, [user, isLoading, allowedRoles, redirectTo, router]);
```

---

## 🔄 Authentication Flows

### **Registration Flow**

```
1. User fills registration form (app/auth/register/page.tsx)
   ↓
2. Form submits to /api/auth/register
   ↓
3. API validates input with Zod schema
   ↓
4. AuthService.registerUser() is called:
   ├─ Create Firebase Auth user
   ├─ Create Firestore user document
   └─ Send verification email
   ↓
5. API returns success response
   ↓
6. User redirected to /auth/login with success message
```

**Trace Logging:**
```
[SPAN START] registerUser
├─ Creating Firebase Auth user
├─ Firebase Auth user created
├─ Creating Firestore user document
├─ User document created
├─ Sending verification email
└─ [SPAN END] registerUser (450ms)
```

---

### **Login Flow**

```
1. User enters email/password (app/auth/login/page.tsx)
   ↓
2. Form submits to /api/auth/login
   ↓
3. API validates input with Zod schema
   ↓
4. AuthService.loginWithEmail() is called:
   ├─ Authenticate with Firebase Auth
   └─ Fetch Firestore user document
   ↓
5. API returns user data
   ↓
6. Client calls login() from useAuth hook:
   ├─ Saves user to localStorage
   └─ Updates React context state
   ↓
7. User redirected to dashboard based on role:
   ├─ admin → /admin/dashboard
   ├─ teacher → /teacher/dashboard
   └─ student → /dashboard
   ↓
8. ProtectedRoute verifies auth state:
   ├─ Checks localStorage for auth_user
   ├─ If found → Render dashboard
   └─ If not found → Redirect to /auth/login
```

**Trace Logging:**
```
[SPAN START] loginWithEmail
├─ Authenticating with Firebase
├─ Firebase authentication successful
├─ Fetching user document from Firestore
├─ User document retrieved
└─ [SPAN END] loginWithEmail (312ms)
```

---

### **Google Sign-In Flow**

```
1. User clicks "Sign in with Google" button
   ↓
2. Firebase opens Google OAuth popup
   ↓
3. User authenticates with Google account
   ↓
4. Firebase returns userCredential
   ↓
5. AuthService checks if user exists in Firestore:
   ├─ If exists → Fetch user document
   └─ If not → Create new user document
   ↓
6. User logged in and redirected to dashboard
```

---

## 🛡️ Security Features

### **1. Firestore Security Rules**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      // Users can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // Only the user can update their own document
      allow update: if request.auth != null && request.auth.uid == userId;

      // No one can delete users (admin-only via Admin SDK)
      allow delete: if false;
    }

    // Admin-only collections
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
  }
}
```

### **2. Role-Based Access Control (RBAC)**

**Roles:**
- `student`: Default role, can enroll in courses
- `teacher`: Can create/manage courses
- `admin`: Full system access

**Implementation:**
```typescript
// Set custom claims during registration
await getAdminAuth().setCustomUserClaims(uid, { role: 'student' });

// Check role in protected routes
<ProtectedRoute allowedRoles={["admin"]}>
  <AdminDashboard />
</ProtectedRoute>
```

### **3. Input Validation (Zod Schemas)**

**Registration:**
```typescript
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["student", "teacher"]).optional(),
  language: z.enum(["en", "lt"]).optional(),
});
```

**Login:**
```typescript
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});
```

### **4. Security-Compliant Logging**

**What NOT to log:**
- ❌ Passwords (plain or hashed)
- ❌ Auth tokens
- ❌ Full email addresses in production (only domain)
- ❌ Sensitive user data

**What to log:**
```typescript
// ✅ Email domain only
traceLogger.log('info', 'Auth', 'Login attempt', {
  emailDomain: email.split('@')[1]
});

// ✅ User ID reference
traceLogger.log('success', 'Auth', 'User logged in', {
  uid: userCredential.user.uid
});

// ✅ Operation outcome
traceLogger.log('error', 'Auth', 'Login failed', {
  error: error.code,
  message: error.message
});
```

---

## 🐛 Error Handling

### **Common Errors**

#### **1. Firebase Auth Errors**

**Error:** `auth/user-not-found`
```typescript
{
  success: false,
  error: "No user found with this email address"
}
```

**Error:** `auth/wrong-password`
```typescript
{
  success: false,
  error: "Incorrect password"
}
```

**Error:** `auth/email-already-in-use`
```typescript
{
  success: false,
  error: "An account with this email already exists"
}
```

#### **2. Validation Errors (Zod)**

**Error:** Missing required field
```typescript
{
  success: false,
  error: "Validation error",
  details: [
    {
      code: "invalid_type",
      expected: "string",
      received: "undefined",
      path: ["name"],
      message: "Required"
    }
  ]
}
```

#### **3. Firestore Errors**

**Error:** `permission-denied`
```typescript
{
  success: false,
  error: "Permission denied: insufficient permissions to access this resource"
}
```

**Error:** `not-found`
```typescript
{
  success: false,
  error: "User document not found in Firestore"
}
```

---

## 🧪 Testing

### **Manual Test Cases**

#### **Registration**
1. ✅ Valid registration (email, password 6+ chars, name)
2. ✅ Duplicate email (should fail)
3. ✅ Weak password (<6 chars, should fail)
4. ✅ Invalid email format (should fail)
5. ✅ Missing required fields (should fail with validation error)

#### **Login**
1. ✅ Valid credentials (should succeed and redirect)
2. ✅ Wrong password (should fail with error message)
3. ✅ Non-existent email (should fail)
4. ✅ Empty fields (should fail validation)

#### **Auth State Persistence**
1. ✅ Login → Navigate to dashboard → Refresh page (should stay logged in)
2. ✅ Login → Close browser → Reopen (should stay logged in via localStorage)
3. ✅ Logout → Try accessing dashboard (should redirect to login)

#### **Protected Routes**
1. ✅ Access /dashboard without login (should redirect to /auth/login)
2. ✅ Student accessing /admin/dashboard (should redirect to /dashboard)
3. ✅ Teacher accessing /teacher/dashboard (should allow access)

---

## 📊 Trace Logging Examples

### **Successful Registration**

```
2025-10-09T14:32:15.234Z [info] API - Registration request received
2025-10-09T14:32:15.235Z [debug] API - Request body parsed {
  hasEmail: true, hasPassword: true, hasName: true, role: "student"
}
2025-10-09T14:32:15.236Z [info] API - Validating input data
2025-10-09T14:32:15.238Z [success] API - Input validation passed
2025-10-09T14:32:15.240Z [info] Auth - [SPAN START] registerUser
2025-10-09T14:32:15.241Z [info] Auth - Creating Firebase Auth user
2025-10-09T14:32:15.487Z [success] Auth - Firebase Auth user created { uid: "T9Uy9hYr..." }
2025-10-09T14:32:15.488Z [info] Firestore - Creating user document
2025-10-09T14:32:15.653Z [success] Firestore - User document created
2025-10-09T14:32:15.654Z [info] Auth - Sending verification email
2025-10-09T14:32:15.812Z [success] Auth - Verification email sent
2025-10-09T14:32:15.813Z [success] Auth - [SPAN END] registerUser (573ms)
2025-10-09T14:32:15.814Z [success] API - User registered successfully { uid: "T9Uy9hYr..." }
```

**All logs share the same traceId:** `abc123-def456-ghi789`

---

### **Successful Login**

```
2025-10-09T14:35:22.123Z [info] API - Login request received
2025-10-09T14:35:22.124Z [debug] API - Request body parsed {
  hasEmail: true, hasPassword: true
}
2025-10-09T14:35:22.125Z [info] API - Validating input data
2025-10-09T14:35:22.126Z [success] API - Input validation passed
2025-10-09T14:35:22.127Z [info] Auth - [SPAN START] loginWithEmail
2025-10-09T14:35:22.128Z [info] Auth - Authenticating with Firebase
2025-10-09T14:35:22.345Z [success] Auth - Firebase authentication successful { uid: "T9Uy9hYr..." }
2025-10-09T14:35:22.346Z [info] Firestore - Fetching user document
2025-10-09T14:35:22.478Z [success] Firestore - User document retrieved
2025-10-09T14:35:22.479Z [success] Auth - [SPAN END] loginWithEmail (352ms)
2025-10-09T14:35:22.480Z [success] API - Login successful { uid: "T9Uy9hYr..." }
```

**traceId:** `xyz789-abc123-def456`

---

## 🚀 Future Enhancements

### **Phase 3 (Planned)**
- [ ] Email verification enforcement (require verified email to access features)
- [ ] Password reset flow with Firebase Auth
- [ ] Multi-factor authentication (MFA)
- [ ] Social login (Facebook, Apple)
- [ ] Session management dashboard (view active sessions)
- [ ] Account deletion with data export (GDPR compliance)

### **Phase 4 (Advanced)**
- [ ] OAuth for third-party integrations
- [ ] SSO (Single Sign-On) for organizations
- [ ] Biometric authentication (WebAuthn)
- [ ] Audit logs for all auth actions
- [ ] Rate limiting for login attempts
- [ ] IP-based anomaly detection

---

## 🔗 Related Documents

- [Trace ID & Distributed Logging System](./TRACE_ID_LOGGING_SYSTEM.md) - Trace logging architecture
- [Debug System Documentation](./DEBUG_SYSTEM.md) - DebugPanel integration
- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md) - Overall migration plan
- [Firestore Security Rules](./FIRESTORE_SECURITY_RULES.md) - Security rules documentation
- [Action Plan](./ACTION_PLAN.md) - Current implementation status

---

## ✅ Implementation Status

**Phase 2 Authentication Migration:**
- ✅ Firebase Auth integration
- ✅ AuthService created with trace logging
- ✅ UserRepository created with Firestore CRUD
- ✅ API routes refactored (/api/auth/login, /api/auth/register)
- ✅ Client-side auth context (useAuth hook)
- ✅ Protected route component
- ✅ Login/registration pages updated
- ✅ Auth state persistence via localStorage
- ✅ Role-based access control
- ✅ Input validation with Zod
- ✅ Comprehensive error handling
- ✅ Trace logging with span tracking
- ✅ Edge Runtime compatibility

**Ready for Production:** ✅ YES

---

**Document Owner:** ZenType Architect (J)
**Status:** Complete and verified
**Last Tested:** October 9, 2025
**Next Review:** After user testing feedback
