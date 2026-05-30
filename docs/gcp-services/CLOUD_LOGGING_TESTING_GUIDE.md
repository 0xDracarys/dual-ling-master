# Cloud Logging Integration - Testing Guide

**Date:** October 17, 2025  
**Status:** ✅ **DEPLOYED** - Ready for validation  
**Deployment Time:** 12:59:33  
**Backend URL:** https://ltus-acadamy--paji-duolingo.europe-west4.hosted.app

---

## 🎯 What Was Implemented

We've successfully integrated Google Cloud Logging with structured JSON output. This means:

1. ✅ All API route logs now write **structured JSON** to stdout
2. ✅ Logs include **GCP trace correlation fields** (`logging.googleapis.com/trace`, `spanId`, `trace_sampled`)
3. ✅ Proper **severity mapping** (DEBUG, INFO, NOTICE, WARNING, ERROR)
4. ✅ **"View Trace" button** should now appear in Cloud Logging UI

---

## 🧪 Testing Steps

### **Step 1: Make an API Call**

Test the authentication endpoint that was failing (401 error):

```bash
# This will trigger logs with trace context
curl -X GET "https://ltus-acadamy--paji-duolingo.europe-west4.hosted.app/api/teacher/recent-activity" \
  -H "Accept: application/json" \
  -v
```

Expected: 401 error (because no auth token), but logs should be written.

### **Step 2: Check Cloud Logging**

1. **Open Cloud Logging Console:**
   - Go to: https://console.cloud.google.com/logs?project=paji-duolingo
   
2. **Apply This Filter:**
   ```
   resource.type="cloud_run_revision"
   resource.labels.service_name="ltus-acadamy"
   severity>=DEFAULT
   ```

3. **What to Look For:**
   - ✅ Structured log entries with severity badges (🔵 INFO, 🟡 WARNING, etc.)
   - ✅ **"View Trace" button** next to log entries
   - ✅ Expandable log details showing custom fields (category, userId, etc.)

### **Step 3: Verify Trace Correlation**

1. **Find a log entry** from your API call
2. **Click the "View Trace" button**
3. **Expected Result:**
   - Opens Cloud Trace Explorer
   - Shows waterfall view with spans:
     - Root span: API route
     - Child spans: Service calls
     - Timing information

4. **If "View Trace" button is missing:**
   - Check if `logging.googleapis.com/trace` field exists in log entry
   - Verify trace ID format (32 hex chars, no hyphens)
   - Check `GOOGLE_CLOUD_PROJECT` environment variable

### **Step 4: Search Logs**

Try these queries in Cloud Logging:

```
# All API logs
jsonPayload.category="API"

# Authentication-related logs
jsonPayload.category="Auth"

# Warning and error logs only
severity>=WARNING

# Specific operation
jsonPayload.operation="registerUser"

# Logs with trace context
logging.googleapis.com/trace:*
```

---

## 📊 Expected Log Format

### **Structured JSON (Production):**

```json
{
  "severity": "WARNING",
  "message": "Missing authorization header",
  "timestamp": "2025-10-17T12:59:45.123Z",
  "category": "API",
  
  "logging.googleapis.com/trace": "projects/paji-duolingo/traces/550e8400e29b41d4a716446655440000",
  "logging.googleapis.com/spanId": "550e8400e29b41d4",
  "logging.googleapis.com/trace_sampled": true,
  
  "traceId": "550e8400e29b41d4a716446655440000",
  "service": "API",
  "operation": "getRecentActivity"
}
```

### **What You'll See in Cloud Logging UI:**

```
⚠️ WARNING   [API] Missing authorization header
   Oct 17, 2025 12:59:45 PM

   Resource: cloud_run_revision / ltus-acadamy / europe-west4
   
   [View Trace] ← THIS IS THE KEY FEATURE!
   
   Details:
   - category: "API"
   - traceId: "550e8400e29b41d4a716446655440000"
   - service: "API"
   - operation: "getRecentActivity"
```

---

## 🐛 Debugging the 401 Authentication Error

Now that we have proper logging, we can debug the auth failure:

### **Current Error (from your log):**
```json
{
  "httpRequest.status": 401,
  "httpRequest.requestUrl": ".../api/teacher/recent-activity"
}
```

### **What to Check:**

1. **Look for auth-related logs** in Cloud Logging:
   ```
   jsonPayload.category="Auth"
   severity>=WARNING
   ```

2. **Expected Log Sequence for Auth Flow:**
   ```
   INFO:    Teacher recent activity request received
   WARNING: Missing authorization header
   OR
   WARNING: Token verification failed
   ```

3. **Common Auth Issues:**
   - Frontend not sending `Authorization: Bearer <token>` header
   - Token expired (Firebase tokens expire after 1 hour)
   - CORS issue blocking header
   - Wrong API route path

4. **Use Trace to Debug:**
   - Click "View Trace" on the 401 error log
   - See full request flow
   - Identify where auth check fails

---

## 🔍 Verification Checklist

After testing, confirm:

- [ ] Structured logs appear in Cloud Logging (not plain text)
- [ ] Severity badges visible (🔵 INFO, 🟡 WARNING, 🔴 ERROR)
- [ ] **"View Trace" button appears** next to log entries
- [ ] Clicking "View Trace" opens Cloud Trace Explorer
- [ ] Trace shows span hierarchy and timing
- [ ] Can search logs by custom fields (`jsonPayload.category`, `jsonPayload.userId`, etc.)
- [ ] Logs from same request are linked by trace ID
- [ ] Timestamp and severity filtering work correctly

---

## 📝 What to Report Back

Please share:

1. **Screenshot of Cloud Logging UI** showing:
   - Log entries with severity badges
   - "View Trace" button (if visible)
   - Expanded log details

2. **Screenshot of Cloud Trace** (if button works):
   - Waterfall view with spans
   - Timing information

3. **Any Error Messages:**
   - Missing fields
   - Incorrect format
   - "View Trace" button not appearing

4. **Auth Debugging:**
   - What logs appear when you call `/api/teacher/recent-activity`?
   - Do you see "Missing authorization header" or "Token verification failed"?

---

## 🎉 Success Indicators

**Phase 1 Complete:**
- ✅ Trace IDs in GCP format (32 hex chars)
- ✅ Span IDs in GCP format (16 hex chars)
- ✅ GCP log entry fields (`logging.googleapis.com/trace`, etc.)
- ✅ Structured JSON logs
- ✅ **"View Trace" button visible in Cloud Logging**

**Ready for Phase 2:**
Once we confirm the above works, we can proceed with:
- W3C `traceparent` header support (distributed tracing)
- Cross-service trace propagation
- OpenTelemetry semantic conventions

---

## 🚀 Quick Test Command

```bash
# Single command to test everything
curl -X GET "https://ltus-acadamy--paji-duolingo.europe-west4.hosted.app/api/teacher/recent-activity" \
  -H "Accept: application/json" \
  -v 2>&1 | grep -E "(HTTP|401)" && \
echo "✅ Request sent! Now check Cloud Logging: https://console.cloud.google.com/logs?project=paji-duolingo"
```

---

**Next Steps:**
1. Run the test command above
2. Check Cloud Logging UI
3. Report back what you see
4. We'll debug the 401 auth error using the traces! 🔍

---

**Prepared By:** ZenType Architect (J)  
**Date:** October 17, 2025  
**Status:** ⏳ AWAITING USER VALIDATION
