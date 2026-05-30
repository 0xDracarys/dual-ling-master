# Pre-Deployment Checklist

**Use this checklist before EVERY push to master branch.**

---

## ✅ Mandatory Checks (DO NOT SKIP)

### 1. Local Build Test
```bash
pnpm build
```

- [ ] Build completes without errors
- [ ] TypeScript compilation passes (✓ Checking validity of types)
- [ ] All routes generate successfully
- [ ] No memory errors (heap exhaustion)
- [ ] No missing module errors

**❌ If build fails:** DO NOT PUSH. Fix errors locally first.

---

### 2. Dependency Verification
```bash
# Check for legacy MongoDB imports
grep -r "from 'mongodb'" app/
grep -r "from 'mongoose'" app/

# Check for legacy bcrypt imports
grep -r "from 'bcryptjs'" app/
```

- [ ] No MongoDB imports in `app/` directory
- [ ] No Mongoose imports in `app/` directory
- [ ] No bcrypt imports in `app/` directory

**✅ Expected:** All searches return "No matches found"

---

### 3. Lockfile Sync Check
```bash
git status | grep pnpm-lock.yaml
```

- [ ] If `package.json` changed, `pnpm-lock.yaml` is also staged
- [ ] Lockfile was regenerated with `pnpm install`
- [ ] No lockfile conflicts or manual edits

**⚠️ Remember:** Production uses `--frozen-lockfile` mode

---

### 4. Environment Variables Check
```bash
grep "secret:" apphosting.yaml
```

- [ ] All required secrets are in `apphosting.yaml`
- [ ] Secret names match Google Secret Manager
- [ ] No hardcoded credentials in code

**Required Secrets:**
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID

---

## 📋 Optional Checks (Recommended)

### 5. Code Quality
- [ ] No `console.log()` statements in production code (use proper logging)
- [ ] No commented-out code blocks
- [ ] No TODO comments for critical features
- [ ] ESLint warnings addressed

### 6. Security
- [ ] No API keys in code (use environment variables)
- [ ] No sensitive data in logs
- [ ] Firebase security rules reviewed (if changed)
- [ ] IAM permissions still valid

### 7. Git Commit
- [ ] Meaningful commit message (semantic commits preferred)
- [ ] All related files staged
- [ ] No accidental files included (check `git status`)

**Semantic Commit Examples:**
```bash
git commit -m "feat: add course enrollment feature"
git commit -m "fix: resolve authentication redirect loop"
git commit -m "chore: update dependencies"
```

---

## 🚀 Ready to Deploy

### Final Command
```bash
git push origin master
```

**After pushing:**
1. ⏳ Wait 4-5 minutes for deployment to complete
2. ✅ Check health endpoint: `curl https://ltus-prod--paji-duolingo.europe-west4.hosted.app/api/health`
3. 🔍 Monitor Cloud Logging for errors: `gcloud logging read "severity>=ERROR" --limit=20`
4. 🧪 Test critical user flows (login, course access, etc.)

---

## 🔴 If Deployment Fails

### Immediate Actions:
1. Check Firebase Console for build logs
2. Identify error type:
   - TypeScript error → Fix locally, test with `pnpm build`, push fix
   - Missing module → Install or remove imports
   - Memory error → Verify `NODE_OPTIONS` in package.json
   - Lockfile error → Run `pnpm install`, commit lockfile

### Rollback (if needed):
```bash
firebase apphosting:rollouts:list ltus-prod --location=europe-west4
firebase apphosting:rollouts:promote <previous-rollout-id>
```

---

## 📊 Success Criteria

### Build Phase (Step #2: pack)
- ✅ Dependencies install: ~21 seconds
- ✅ Next.js build: ~3-4 minutes
- ✅ TypeScript compilation: 0 errors
- ✅ 72 routes generated

### Deployment Phase (Step #3: deploy)
- ✅ Cloud Run deployment: ~30 seconds
- ✅ Health check passes
- ✅ No 500 errors in Cloud Logging

### Post-Deployment
- ✅ Homepage loads
- ✅ Authentication works
- ✅ Course pages accessible
- ✅ Admin dashboard functional

---

## 🛠️ Troubleshooting Quick Reference

| Error | Likely Cause | Solution |
|-------|--------------|----------|
| `Cannot find module 'X'` | Package removed but still imported | Search for imports: `grep -r "from 'X'" .` |
| `Heap out of memory` | Build exceeds 4GB | Check package.json build script |
| `Lockfile not up to date` | package.json changed without running install | Run `pnpm install`, commit lockfile |
| `File is not a module` | Empty/gutted file still imported | Delete the empty file |
| `useSearchParams() error` | Missing Suspense boundary | Wrap component in `<Suspense>` |
| `Can't resolve 'async_hooks'` | Server module bundled for client | Check next.config.js webpack config |

---

## 📝 Deployment Log Template

**Use this to document deployments:**

```markdown
### Deployment: [Date/Time]
- **Commit:** [hash]
- **Features:** [brief description]
- **Build Time:** [X minutes]
- **Status:** ✅ Success / ❌ Failed
- **Issues:** [any problems encountered]
- **Rollback:** [yes/no - if yes, why?]
```

---

**Last Updated:** November 9, 2025  
**Revision:** v1.0 (post-Build #6 success)
