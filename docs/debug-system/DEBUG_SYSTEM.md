# Debug System Documentation

**Status:** ✅ COMPLETE  
**Version:** 1.0.0  
**Last Updated:** October 8, 2025

---

## 🐛 Debug Panel Overview

The Debug Panel is an integrated development tool that provides real-time visibility into:
- 🔐 Authentication state
- 🗄️ Database operations
- 📡 API requests/responses
- ⚡ Performance metrics
- 🚨 Errors and warnings
- 📊 Feature logs

**Access:** Press **`Ctrl + Shift + D`** to toggle the debug panel

---

## 🎨 Debug Panel Features

### 1. **Real-Time Logs**
- Color-coded by severity (info, warn, error, success)
- Timestamped entries
- Collapsible details
- Search and filter

### 2. **Authentication Monitor**
- Current user state
- Firebase token info
- Custom claims (role)
- Session duration

### 3. **Database Activity**
- Firestore read/write operations
- Query performance
- Document snapshots
- Real-time listener status

### 4. **API Request Tracker**
- All HTTP requests
- Request/response payloads
- Status codes
- Response times

### 5. **Feature Flags**
- Toggle experimental features
- Test different scenarios
- A/B testing

### 6. **Performance Metrics**
- Page load times
- Component render times
- Firebase operation latency
- Network waterfall

---

## 📦 Debug Panel Components

```
components/
└── debug/
    ├── DebugPanel.tsx              # Main panel container
    ├── DebugLog.tsx                # Log viewer
    ├── DebugAuth.tsx               # Auth state monitor
    ├── DebugFirestore.tsx          # Database activity
    ├── DebugAPI.tsx                # API request tracker
    ├── DebugPerformance.tsx        # Performance metrics
    └── DebugSettings.tsx           # Panel settings
```

---

## 🔧 Debug Logger API

### **Usage in Services**

```typescript
// lib/services/auth.service.ts
import { DebugLogger } from '@/lib/utils/debug-logger';

const logger = DebugLogger.getInstance();

export class AuthService {
  async registerUser(email: string, password: string, name: string) {
    logger.info('Auth', 'Starting user registration', { email, name });
    
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      logger.success('Auth', 'Firebase Auth user created', { uid: userCredential.user.uid });
      
      // Create Firestore document
      await this.userRepo.create(userCredential.user.uid, { email, name });
      logger.success('Auth', 'Firestore user document created');
      
      return userCredential.user;
    } catch (error) {
      logger.error('Auth', 'Registration failed', error);
      throw error;
    }
  }
}
```

### **Log Levels**

```typescript
logger.info('Category', 'Message', metadata);      // ℹ️ Informational
logger.success('Category', 'Message', metadata);   // ✅ Success
logger.warn('Category', 'Message', metadata);      // ⚠️ Warning
logger.error('Category', 'Message', metadata);     // ❌ Error
logger.debug('Category', 'Message', metadata);     // 🐛 Debug (dev only)
```

---

## 🎯 Debug Categories

Organized by feature area for easy filtering:

- **Auth** - Authentication and authorization
- **Firestore** - Database read/write operations
- **Storage** - File upload/download
- **API** - HTTP requests
- **UI** - Component lifecycle
- **Performance** - Timing metrics
- **Error** - Caught exceptions

---

## 🖥️ Debug Panel UI

```
┌─────────────────────────────────────────────────────────┐
│  🐛 Debug Panel                      [Minimize] [Close]  │
├─────────────────────────────────────────────────────────┤
│  Tabs: [Logs] [Auth] [Firestore] [API] [Performance]    │
├─────────────────────────────────────────────────────────┤
│  Filter: [All] [Auth] [Firestore] [API]                 │
│  Search: [___________________]  [Clear Logs]            │
├─────────────────────────────────────────────────────────┤
│  18:45:32 ✅ Auth      User registered successfully     │
│           └── uid: abc123, email: user@example.com      │
│                                                          │
│  18:45:33 ℹ️  Firestore  Reading courses collection     │
│           └── Query: { isPublished: true, limit: 20 }   │
│                                                          │
│  18:45:34 ⚠️  API       Slow response detected          │
│           └── /api/courses took 1.2s                    │
│                                                          │
│  18:45:35 ❌ Error     Failed to upload file            │
│           └── StorageError: File size exceeds 10MB      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Production

**Important:** Debug panel is **DISABLED in production** by default.

```typescript
// components/debug/DebugPanel.tsx
export function DebugPanel() {
  // Only render in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return <div className="debug-panel">...</div>;
}
```

**Override for staging/testing:**
```env
# .env.local
NEXT_PUBLIC_ENABLE_DEBUG=true  # Enable in production (use carefully!)
```

---

## 📊 Log Persistence

Logs are stored in:
1. **Memory** - Last 1000 logs (real-time)
2. **LocalStorage** - Persisted across page reloads
3. **IndexedDB** - Long-term storage (last 7 days)

**Export Logs:**
```typescript
// Export as JSON
DebugLogger.getInstance().exportLogs('json');

// Export as CSV
DebugLogger.getInstance().exportLogs('csv');

// Clear all logs
DebugLogger.getInstance().clearLogs();
```

---

## 🧪 Testing with Debug Logs

```typescript
// __tests__/services/auth.service.test.ts
import { DebugLogger } from '@/lib/utils/debug-logger';

describe('AuthService', () => {
  beforeEach(() => {
    DebugLogger.getInstance().clearLogs();
  });
  
  it('logs registration steps', async () => {
    const authService = new AuthService();
    await authService.registerUser('test@example.com', 'password', 'Test User');
    
    const logs = DebugLogger.getInstance().getLogs();
    expect(logs).toContainEqual(
      expect.objectContaining({
        level: 'info',
        category: 'Auth',
        message: 'Starting user registration'
      })
    );
  });
});
```

---

## 🎨 Styling & Customization

Debug panel uses Tailwind CSS and shadcn/ui components:

```tsx
// components/debug/DebugPanel.tsx
<div className="fixed bottom-4 right-4 w-96 h-[600px] bg-background border rounded-lg shadow-2xl">
  <div className="flex items-center justify-between p-4 border-b">
    <div className="flex items-center gap-2">
      <Bug className="w-5 h-5" />
      <h3 className="font-semibold">Debug Panel</h3>
    </div>
    <Button variant="ghost" size="icon" onClick={onClose}>
      <X className="w-4 h-4" />
    </Button>
  </div>
  
  <Tabs defaultValue="logs">
    <TabsList className="w-full">
      <TabsTrigger value="logs">Logs</TabsTrigger>
      <TabsTrigger value="auth">Auth</TabsTrigger>
      <TabsTrigger value="firestore">Firestore</TabsTrigger>
      <TabsTrigger value="api">API</TabsTrigger>
    </TabsList>
    
    <TabsContent value="logs">
      <DebugLog />
    </TabsContent>
    <!-- Other tabs -->
  </Tabs>
</div>
```

---

## 🚀 Quick Start

1. **Import Debug Logger:**
```typescript
import { DebugLogger } from '@/lib/utils/debug-logger';
const logger = DebugLogger.getInstance();
```

2. **Add Logs:**
```typescript
logger.info('YourFeature', 'What happened', { data });
```

3. **Toggle Panel:**
Press `Ctrl + Shift + D` or click the debug icon (bottom-right corner)

4. **View Logs:**
Filter by category, search by keyword, export as needed

---

## 📚 Examples by Feature

### **Authentication Logging**
```typescript
// Login
logger.info('Auth', 'User login attempt', { email });
logger.success('Auth', 'Login successful', { uid, email });

// Registration
logger.info('Auth', 'Creating new user', { email });
logger.success('Auth', 'User registered', { uid });
logger.warn('Auth', 'Email verification pending', { email });

// Logout
logger.info('Auth', 'User logged out', { uid });
```

### **Firestore Operations**
```typescript
// Read
logger.info('Firestore', 'Fetching courses', { query: { isPublished: true } });
logger.success('Firestore', 'Courses fetched', { count: 15 });

// Write
logger.info('Firestore', 'Creating course', { title: 'Spanish 101' });
logger.success('Firestore', 'Course created', { courseId });

// Update
logger.info('Firestore', 'Updating user profile', { uid, fields: ['name', 'avatar'] });
logger.success('Firestore', 'Profile updated');
```

### **API Requests**
```typescript
// Outgoing request
logger.info('API', 'POST /api/courses', { body: courseData });
logger.success('API', 'Course created', { statusCode: 201, courseId });

// Incoming response
logger.warn('API', 'Slow response', { endpoint: '/api/courses', duration: 1200 });
logger.error('API', 'Request failed', { statusCode: 500, error: 'Internal Server Error' });
```

---

## 🔗 Related Documents

- [Serverless Architecture](./SERVERLESS_ARCHITECTURE.md)
- [Firebase Migration Strategy](./FIREBASE_MIGRATION_STRATEGY.md)
- [API Endpoints Reference](./API_ENDPOINTS.md)

---

**Document Owner:** ZenType Architect (J)  
**Status:** Ready for implementation
