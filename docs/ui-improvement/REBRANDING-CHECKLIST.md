# Rebranding Checklist: DualLing → Step by Step Language Studio

**Project:** Step by Step Language Studio UI Transformation  
**Task:** Complete rebrand from "DualLing" to "Step by Step Language Studio"  
**Last Updated:** 2025-01-XX

---

## **Overview**

This checklist tracks all locations where "DualLing" appears in the codebase and needs to be replaced with "Step by Step Language Studio" (or appropriate variant). This is a **critical task** that ensures brand consistency across the entire platform.

---

## **Search Strategy**

### **Step 1: Find All Occurrences**
```bash
# Case-sensitive searches for all variants
grep -r "DualLing" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "dualling" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "DUALLING" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "dual-ling" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "dualLing" . --exclude-dir=node_modules --exclude-dir=.git
```

### **Step 2: Create Replacement Map**

| Current | Replacement | Usage Context |
|---------|------------|---------------|
| DualLing | Step by Step Language Studio | Full brand name (titles, about pages) |
| dualling | step-by-step-language-studio | URLs, file names, slugs |
| DUALLING | STEP_BY_STEP_LANGUAGE_STUDIO | Environment variables, constants |
| dualLing | stepByStepLanguageStudio | Code variables (camelCase) |
| dual-ling | step-by-step-language-studio | CSS classes, HTML IDs |

---

## **Files to Modify - Checklist**

### **📄 Configuration Files**

- [ ] `package.json`
  - `name` field
  - `description` field
  - Author metadata

- [ ] `README.md`
  - Project title
  - Description sections
  - Installation instructions

- [ ] `public/manifest.json`
  - `name` field
  - `short_name` field
  - `description` field

- [ ] `next.config.js`
  - Site name in config (if present)

---

### **🎨 UI Components**

#### **Navigation Components**
- [ ] `components/navigation/navbar.tsx`
  - Logo text
  - Site title in header

- [ ] `components/navigation/sidebar.tsx`
  - Branding text (if present)

- [ ] `components/navigation/footer.tsx`
  - Company name in footer
  - Copyright text

- [ ] `components/navigation/mobile-menu.tsx`
  - Mobile header branding

#### **Authentication Components**
- [ ] `components/auth/login-form.tsx`
  - "Welcome to DualLing" → "Welcome to Step by Step Language Studio"
  - Form labels/placeholders

- [ ] `components/auth/signup-form.tsx`
  - Welcome message
  - Terms of service text

- [ ] `components/auth/password-reset.tsx`
  - Email templates text (if hardcoded)

---

### **📱 Application Pages**

#### **Marketing/Public Pages**
- [ ] `app/page.tsx` (Homepage)
  - Hero section heading
  - Feature descriptions
  - CTA button text

- [ ] `app/about/page.tsx`
  - Company name throughout
  - Mission statement
  - Team descriptions

- [ ] `app/contact/page.tsx`
  - Company name in form
  - Email subject lines

- [ ] `app/pricing/page.tsx`
  - Plan descriptions
  - Feature lists

- [ ] `app/terms/page.tsx`
  - Company name in legal text

- [ ] `app/privacy/page.tsx`
  - Company name in privacy policy

#### **Application Pages**
- [ ] `app/layout.tsx`
  - Site title metadata
  - Open Graph tags
  - Twitter card tags

- [ ] `app/dashboard/page.tsx`
  - Welcome messages
  - Page titles

- [ ] `app/courses/page.tsx`
  - Page headings
  - Placeholder text

- [ ] `app/settings/page.tsx`
  - Account settings labels

---

### **🎭 Static Assets**

- [ ] `public/logo.svg` or `public/logo.png`
  - Replace logo file entirely
  - Create variants: logo-light.svg, logo-dark.svg

- [ ] `public/favicon.ico`
  - Update favicon to match new brand

- [ ] `public/og-image.png`
  - Replace Open Graph image

- [ ] `public/branding/*`
  - Any brand-specific images or assets

---

### **📧 Email Templates (if in frontend)**

- [ ] Search for email template strings
  - Welcome emails
  - Password reset emails
  - Verification emails
  - Notification emails

---

### **🔧 Utility & Helper Files**

- [ ] `lib/constants/app-config.ts` (or similar)
  - `APP_NAME` constant
  - `COMPANY_NAME` constant

- [ ] `lib/utils/email-sender.ts`
  - Email sender name
  - Email subject prefixes

---

### **🧪 Test Files**

- [ ] `__tests__/**/*.test.ts`
  - Mock data with company name
  - Test descriptions mentioning "DualLing"

- [ ] Playwright test files
  - Test scenario descriptions

---

### **📝 Documentation Files**

- [ ] `docs/main.md`
  - Project name in documentation

- [ ] All `docs/**/*.md` files
  - References to "DualLing" in documentation

- [ ] `docs/ui-improvement/*.md`
  - Already uses "Step by Step Language Studio" ✅

---

## **Special Cases - Handle Carefully**

### **1. Environment Variables**
- [ ] `.env` files (if company name is stored)
  - `NEXT_PUBLIC_APP_NAME`
  - `COMPANY_NAME`

⚠️ **Important:** If env vars change, update deployment configuration (Vercel, etc.)

### **2. Database Seeded Data**
- [ ] Check for hardcoded "DualLing" in seed scripts
- [ ] Verify course names don't reference old brand

⚠️ **Important:** This is backend work, may be out of scope

### **3. External API Integrations**
- [ ] Google OAuth consent screen (if customizable)
- [ ] Firebase project display name (if editable)

⚠️ **Important:** These may require admin access to external platforms

---

## **Validation Steps**

After completing all replacements:

1. **Visual Inspection**
   - [ ] Visit every page in the application
   - [ ] Check for "DualLing" in visible text
   - [ ] Verify new branding displays correctly

2. **Search Verification**
   ```bash
   # Should return 0 results (or only acceptable contexts like comments):
   grep -r "DualLing" app/ components/ --exclude-dir=node_modules
   ```

3. **Metadata Check**
   - [ ] View page source and verify `<title>` tags
   - [ ] Check Open Graph meta tags
   - [ ] Verify Twitter card metadata

4. **Mobile Check**
   - [ ] Test on mobile browser
   - [ ] Verify PWA name (if applicable)

5. **Email Check**
   - [ ] Trigger password reset email
   - [ ] Trigger welcome email
   - [ ] Verify sender name and content

6. **Playwright MCP Verification**
   - [ ] Run full test suite
   - [ ] Verify no hardcoded "DualLing" in test assertions

---

## **Implementation Strategy**

### **Option A: Search & Replace (Faster, Riskier)**
```bash
# Use with caution - test thoroughly after
find app components -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/DualLing/Step by Step Language Studio/g'
```

⚠️ **Warning:** Automated search-replace can cause issues if context isn't considered

### **Option B: Manual Replacement (Slower, Safer)** ✅ **RECOMMENDED**
1. Search for each occurrence individually
2. Evaluate context (Is this user-facing text? A code variable? A comment?)
3. Replace with appropriate variant from the table above
4. Test the affected page/component immediately
5. Commit small batches of changes

---

## **Rollout Plan**

### **Phase 1: Low-Risk Changes**
- Configuration files (package.json, README.md)
- Documentation files
- Comments in code

### **Phase 2: Public Pages**
- Homepage
- About page
- Contact page
- Terms/Privacy pages

### **Phase 3: Application Pages**
- Dashboard
- Course pages
- Settings

### **Phase 4: Components**
- Navigation
- Authentication
- Footer

### **Phase 5: Assets**
- Logo files
- Favicon
- Open Graph images

### **Phase 6: Final Verification**
- Complete validation checklist
- User acceptance testing
- Deploy to production

---

## **Edge Cases to Consider**

1. **Old URLs/Bookmarks:** Will "dualling.com" redirect to new branding? (Infrastructure concern)
2. **Social Media Mentions:** Update social media profiles separately
3. **Google Search Results:** Will take time to update naturally
4. **User-Generated Content:** Old brand mentions in user comments/posts (if applicable)

---

## **Success Criteria**

- ✅ Zero occurrences of "DualLing" in user-facing text
- ✅ All metadata updated with new brand name
- ✅ Logo and branding assets replaced
- ✅ Email templates reflect new branding
- ✅ Playwright MCP tests pass with new brand name
- ✅ No broken functionality due to rebranding

---

**Status:** 📋 Checklist created, awaiting execution  
**Next Step:** Begin Phase 1 (Low-Risk Changes) after PRD approval  
**Estimated Duration:** Can be done in parallel with UI component work
