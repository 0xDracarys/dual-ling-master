# Security Testing Checklist & Coverage Matrix
**Purpose**: Verify all vulnerabilities are fixed  
**Status**: Ready for use after remediation  
**Last Updated**: 2025-11-11

---

## Master Testing Checklist

Complete this checklist after remediation to verify fixes.

---

## Category 1: Authentication & Token Security

### ✅ Test 1.1: Token Expiration Enforcement

**Objective**: Verify expired tokens are rejected  
**Severity**: CRITICAL  
**Type**: Automated/Manual

**Steps**:
1. [ ] Generate valid JWT token with `exp: 1600000000` (past date)
2. [ ] Send request with expired token to `/api/user`
3. [ ] Verify rejection with 401 Unauthorized
4. [ ] Check error message mentions token expiration

**Expected Result**: ❌ Request rejected

**Evidence**:
- [ ] Screenshot of rejection response
- [ ] Network trace showing 401 status
- [ ] Error message: "Token expired"

**Test Case**:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImV4cCI6MTYwMDAwMDAwMH0.xxxx"
curl -H "Authorization: Bearer $TOKEN" https://dual-ling.com/api/user
# Expected: 401 Unauthorized
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 1.2: Token Signature Validation

**Objective**: Verify modified token signatures are rejected  
**Severity**: CRITICAL  
**Type**: Automated

**Steps**:
1. [ ] Take valid token and modify last segment (signature)
2. [ ] Send request with invalid signature to `/api/user`
3. [ ] Verify rejection with 401 Unauthorized
4. [ ] Check error mentions signature validation

**Expected Result**: ❌ Request rejected

**Test Case**:
```bash
VALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.VALID_SIGNATURE"
INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyJ9.INVALID_SIGNATURE_HERE"
curl -H "Authorization: Bearer $INVALID_TOKEN" https://dual-ling.com/api/user
# Expected: 401 Unauthorized
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 1.3: Required Claims Validation

**Objective**: Verify tokens missing required claims are rejected  
**Severity**: HIGH  
**Type**: Automated

**Steps**:
1. [ ] Generate token without `sub` claim
2. [ ] Send to `/api/user`
3. [ ] Verify rejection
4. [ ] Repeat without `role` claim
5. [ ] Verify rejection

**Expected Result**: ❌ Both requests rejected

**Test Case**:
```typescript
// Token without sub claim
const tokenNoSub = jwt.sign({ role: "student" }, SECRET, { expiresIn: "1h" });

// Token without role claim
const tokenNoRole = jwt.sign({ sub: "user_123" }, SECRET, { expiresIn: "1h" });

// Both should be rejected
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 1.4: Token Revocation on Logout

**Objective**: Verify tokens are invalidated after logout  
**Severity**: MEDIUM  
**Type**: Manual

**Steps**:
1. [ ] Login successfully (receive token)
2. [ ] Make API call with token (should work)
3. [ ] Call `/api/auth/logout`
4. [ ] Try same token again (should fail)
5. [ ] Verify 401 Unauthorized response

**Expected Result**: ❌ Request rejected after logout

**Test Sequence**:
```bash
# 1. Login
curl -X POST https://dual-ling.com/api/auth/login \
  -d '{"email":"test@example.com","password":"pass"}' \
  -c cookies.txt
# Returns: auth_token

# 2. Use token (should work)
curl https://dual-ling.com/api/user -b cookies.txt
# Returns: 200 OK with user data

# 3. Logout
curl -X POST https://dual-ling.com/api/auth/logout -b cookies.txt
# Returns: 200 OK

# 4. Try token again (should fail)
curl https://dual-ling.com/api/user -b cookies.txt
# Expected: 401 Unauthorized - Token revoked
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 1.5: HttpOnly Cookie Implementation

**Objective**: Verify tokens are in HttpOnly cookies, not localStorage  
**Severity**: CRITICAL  
**Type**: Manual

**Steps**:
1. [ ] Open Developer Tools → Application → Storage
2. [ ] Check localStorage
3. [ ] Verify NO `auth_token` present
4. [ ] Verify NO `auth_refresh_token` present
5. [ ] Check Cookies tab
6. [ ] Verify auth cookies exist
7. [ ] Verify auth cookies have HttpOnly flag ✓

**Expected Result**: 
- localStorage empty or no auth tokens
- Cookies contain `auth_token` and `auth_refresh_token`
- Both cookies have `HttpOnly` flag

**Evidence**:
- [ ] Screenshot of empty localStorage
- [ ] Screenshot of HttpOnly cookies

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 2: Token Claims & Authorization

### ✅ Test 2.1: Role-Based Access Control

**Objective**: Verify endpoints enforce role permissions  
**Severity**: HIGH  
**Type**: Automated

**Steps**:
1. [ ] Login as student
2. [ ] Try to access teacher-only endpoint: `/api/courses/create`
3. [ ] Verify 403 Forbidden response
4. [ ] Login as teacher
5. [ ] Same endpoint now works (200 OK)

**Expected Results**:
- Student → 403 Forbidden
- Teacher → 200 OK

**Test Case**:
```bash
# Student token
STUDENT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzdHVkZW50XzEyMyIsInJvbGUiOiJzdHVkZW50In0.xxxx"

# Try teacher-only endpoint
curl -H "Authorization: Bearer $STUDENT_TOKEN" \
  -X POST https://dual-ling.com/api/courses/create
# Expected: 403 Forbidden

# Teacher token
TEACHER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZWFjaGVyXzEyMyIsInJvbGUiOiJ0ZWFjaGVyIn0.xxxx"

# Same endpoint
curl -H "Authorization: Bearer $TEACHER_TOKEN" \
  -X POST https://dual-ling.com/api/courses/create
# Expected: 200 OK
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 2.2: Privilege Escalation Prevention

**Objective**: Verify modified role claims are rejected  
**Severity**: CRITICAL  
**Type**: Automated

**Steps**:
1. [ ] Generate student token
2. [ ] Extract payload and modify role: "student" → "admin"
3. [ ] Try to use modified token
4. [ ] Verify rejection (invalid signature)
5. [ ] Verify cannot access admin endpoints

**Expected Result**: ❌ Tampered token rejected

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 3: Data Protection & Encryption

### ✅ Test 3.1: Sensitive Data Encryption

**Objective**: Verify PII is encrypted in database  
**Severity**: CRITICAL  
**Type**: Automated

**Steps**:
1. [ ] Query Firestore for user document
2. [ ] Check email field (should be encrypted object)
3. [ ] Check phone field (should be encrypted object)
4. [ ] Verify plain-text values not present
5. [ ] Verify encrypted structure has: `{encrypted, iv, authTag}`

**Expected Result**: All PII encrypted

**Verification Script**:
```typescript
import { db } from '@/lib/firebase/admin';

async function verifyEncryption() {
  const user = await db.collection('users').doc('test_user').get();
  const data = user.data();

  // Should be encrypted object
  console.log('Email:', data.email);
  // Expected: { encrypted: "a3f8...", iv: "3b5c...", authTag: "7f2e..." }

  // Should NOT be plain text
  if (typeof data.email === 'string') {
    throw new Error('Email is plain text - NOT ENCRYPTED');
  }

  console.log('✅ Encryption verified');
}
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 3.2: localStorage No Longer Contains Tokens

**Objective**: Verify tokens not stored in localStorage  
**Severity**: CRITICAL  
**Type**: Manual

**Steps**:
1. [ ] Login to application
2. [ ] Open Developer Tools
3. [ ] Go to Application → localStorage
4. [ ] Search for `auth_token` (should not exist)
5. [ ] Search for `auth_refresh_token` (should not exist)
6. [ ] Search for `user_profile` (should not exist if storing in DB)

**Expected Result**: localStorage empty or only non-sensitive data

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 4: Firebase Security

### ✅ Test 4.1: No Firebase Config in Client

**Objective**: Verify Firebase credentials not in client code  
**Severity**: CRITICAL  
**Type**: Automated

**Steps**:
1. [ ] Download client JavaScript bundle
2. [ ] Search for `apiKey` (should not exist)
3. [ ] Search for `projectId` (should not exist)
4. [ ] Search for `firebaseConfig` (should not exist)
5. [ ] Verify no Firebase SDK in bundle

**Test Script**:
```bash
# Download bundle
curl https://dual-ling.com/_next/static/chunks/main.js > bundle.js

# Search for Firebase credentials
grep -i "apiKey\|firebaseConfig\|AIzaSy" bundle.js
# Expected: No matches (empty result)

if grep -q "AIzaSy" bundle.js; then
  echo "❌ FAIL: Firebase key found in bundle"
else
  echo "✅ PASS: No Firebase credentials in client"
fi
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 4.2: Firestore Access Requires Backend

**Objective**: Verify direct Firestore access is denied  
**Severity**: CRITICAL  
**Type**: Manual

**Steps**:
1. [ ] Attempt direct Firestore query with API key (from any public source)
2. [ ] Should receive 403 Forbidden
3. [ ] Verify error: "Permission denied"
4. [ ] Try through backend API (should work)

**Test**:
```bash
# Attempt direct Firestore access (should fail)
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/dual-ling-prod/databases/(default)/documents:runQuery" \
  -H "X-Goog-Api-Key: AIzaSyD..."
# Expected: 403 Permission denied

# Access through backend API (should work)
curl https://dual-ling.com/api/user \
  -H "Authorization: Bearer {valid_token}"
# Expected: 200 OK
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 5: Security Headers

### ✅ Test 5.1: Security Headers Present

**Objective**: Verify all security headers are set  
**Severity**: MEDIUM  
**Type**: Automated

**Steps**:
1. [ ] Make HTTP HEAD request to homepage
2. [ ] Check response headers for:
   - [ ] `X-Frame-Options: DENY`
   - [ ] `X-Content-Type-Options: nosniff`
   - [ ] `Strict-Transport-Security: max-age=31536000`
   - [ ] `Content-Security-Policy: default-src 'self'`
   - [ ] `X-XSS-Protection: 1; mode=block`
   - [ ] `Referrer-Policy: strict-origin-when-cross-origin`

**Test Script**:
```bash
curl -I https://dual-ling.com | grep -i "X-Frame\|X-Content\|Strict-Transport\|Content-Security"

# Expected output:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; ...
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 6: GDPR Compliance

### ✅ Test 6.1: Privacy Policy Published

**Objective**: Verify privacy policy is accessible  
**Severity**: HIGH  
**Type**: Manual

**Steps**:
1. [ ] Visit https://dual-ling.com/privacy
2. [ ] Verify page loads
3. [ ] Check contains all 16 required elements:
   - [ ] Controller identity
   - [ ] Processing purposes
   - [ ] Legal basis
   - [ ] Data categories
   - [ ] Recipients
   - [ ] Retention period
   - [ ] User rights
   - [ ] Complaint procedure
   - [ ] Automated decision-making
   - [ ] Right to erasure
   - [ ] Right to access
   - [ ] Right to portability
   - [ ] Right to rectification
   - [ ] Right to restrict
   - [ ] Withdrawal of consent
   - [ ] Data breach notification

**Evidence**:
- [ ] Screenshot of privacy policy
- [ ] Checklist of 16 elements

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 6.2: Account Deletion Working

**Objective**: Verify users can delete accounts  
**Severity**: CRITICAL  
**Type**: Manual

**Steps**:
1. [ ] Create test account
2. [ ] Navigate to Settings → Delete Account
3. [ ] Click delete button
4. [ ] Confirm deletion
5. [ ] Verify account no longer works
6. [ ] Verify data deleted from Firestore

**Evidence**:
- [ ] Screenshots of deletion flow
- [ ] Confirmation of data deletion from database

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 6.3: Data Export Working

**Objective**: Verify users can export personal data  
**Severity**: CRITICAL  
**Type**: Manual

**Steps**:
1. [ ] Login to account
2. [ ] Navigate to Settings → Export Data
3. [ ] Click export button
4. [ ] Verify file downloads (JSON or CSV)
5. [ ] Open file and verify contents:
   - [ ] User profile data
   - [ ] Course enrollment data
   - [ ] Learning progress
   - [ ] Timestamps

**Evidence**:
- [ ] Screenshot of export button
- [ ] Exported file content (sanitized)

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 6.4: Consent Management

**Objective**: Verify consent management UI  
**Severity**: HIGH  
**Type**: Manual

**Steps**:
1. [ ] Signup as new user
2. [ ] Verify consent banner appears
3. [ ] Check granular consent options visible
4. [ ] Verify "Accept All" button
5. [ ] Verify "Reject All" button
6. [ ] Verify "Manage Preferences" option
7. [ ] Select specific consents to reject
8. [ ] Verify preferences saved

**Evidence**:
- [ ] Screenshots of consent banner
- [ ] Screenshots of preferences page

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 7: XSS & Injection Prevention

### ✅ Test 7.1: XSS Payload Sanitization

**Objective**: Verify XSS payloads are escaped  
**Severity**: HIGH  
**Type**: Manual

**Steps**:
1. [ ] Find user input field (comment, bio, etc.)
2. [ ] Enter XSS payload: `<img src=x onerror="alert('XSS')">`
3. [ ] Submit form
4. [ ] Reload page with the content
5. [ ] Verify NO alert appears
6. [ ] Verify payload displayed as text (escaped)

**Expected Result**: Payload visible as text, NOT executed

**Pass/Fail**: [ ] PASS [ ] FAIL

---

### ✅ Test 7.2: SQL Injection Prevention

**Objective**: Verify SQL injection payloads are safe  
**Severity**: HIGH  
**Type**: Automated

**Steps**:
1. [ ] Find search/filter endpoint
2. [ ] Send payload: `search=test' OR '1'='1`
3. [ ] Verify results are filtered (not all records returned)
4. [ ] Verify no SQL error in response

**Test**:
```bash
curl "https://dual-ling.com/api/courses?search=test' OR '1'='1"
# Expected: Normal filtered results, no error
# NOT: All courses in database
```

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 8: Incident Response

### ✅ Test 8.1: Breach Notification Procedures

**Objective**: Verify breach response procedures documented  
**Severity**: MEDIUM  
**Type**: Manual

**Steps**:
1. [ ] Verify incident response plan exists: `/docs/security/incident-response-plan.md`
2. [ ] Check plan includes:
   - [ ] Detection procedures
   - [ ] Escalation procedures
   - [ ] User notification procedures (< 72h)
   - [ ] Regulatory notification procedures
   - [ ] Investigation procedures
   - [ ] Communication templates

**Evidence**:
- [ ] Copy of incident response plan

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Category 9: Documentation

### ✅ Test 9.1: Security Documentation Complete

**Objective**: Verify all security docs exist  
**Severity**: MEDIUM  
**Type**: Manual

**Steps**:
1. [ ] Verify exists: `docs/security/security-architecture.md`
2. [ ] Verify exists: `docs/security/incident-response-plan.md`
3. [ ] Verify exists: `docs/compliance/privacy-policy.md`
4. [ ] Verify exists: `docs/compliance/retention-policy.md`
5. [ ] Verify exists: `docs/compliance/legal-basis.md`
6. [ ] Verify exists: `docs/compliance/dpia-*.md` (all 3 DPIAs)

**Pass/Fail**: [ ] PASS [ ] FAIL

---

## Test Execution Summary

### Overall Results
- **Total Tests**: 17
- **Passed**: ___
- **Failed**: ___
- **Success Rate**: ___%

### By Category

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Authentication | 5 | __ | __ |
| Authorization | 2 | __ | __ |
| Data Protection | 2 | __ | __ |
| Firebase Security | 2 | __ | __ |
| Security Headers | 1 | __ | __ |
| GDPR Compliance | 4 | __ | __ |
| XSS/Injection | 2 | __ | __ |
| Incident Response | 1 | __ | __ |
| Documentation | 1 | __ | __ |
| **TOTAL** | **17** | **__** | **__** |

### Risk Assessment After Testing

- [ ] **All Critical tests PASSED** → Risk reduced to LOW ✅
- [ ] **Some Critical tests FAILED** → Risk remains MEDIUM ⚠️
- [ ] **Major tests FAILED** → Risk remains CRITICAL ❌

---

## Retesting Schedule

**After Initial Fixes**: Week 8 (retest all failed items)  
**Before Production Deploy**: Week 10 (full test run)  
**Quarterly**: Full security testing  
**Annually**: Penetration test + security audit

---

## Sign-Off

**Test Performed By**: ____________________________

**Date**: ____________________________

**Result**: [ ] PASS [ ] FAIL

**Approved By**: ____________________________

**Date**: ____________________________

