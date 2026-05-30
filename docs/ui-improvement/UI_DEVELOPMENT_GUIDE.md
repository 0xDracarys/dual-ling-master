# UI Development Guide

**Version:** 1.0  
**Last Updated:** October 24, 2025  
**Purpose:** Define scope of work and best practices for UI changes to prevent breaking the layout and design system

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Design System Overview](#design-system-overview)
3. [Layout Architecture](#layout-architecture)
4. [Component Modification Rules](#component-modification-rules)
5. [CSS Best Practices](#css-best-practices)
6. [Common Pitfalls](#common-pitfalls)
7. [Testing Checklist](#testing-checklist)
8. [Emergency Fixes](#emergency-fixes)

---

## 1. Core Principles

### DO ✅
- **Follow the existing design system** - Use predefined utility classes
- **Test on multiple viewports** - Mobile (375px), Tablet (768px), Desktop (1440px)
- **Use semantic HTML** - Proper heading hierarchy, ARIA labels
- **Maintain accessibility** - Color contrast, keyboard navigation
- **Document breaking changes** - Update this guide when modifying core components
- **Use GCP Trace for debugging** - We use Cloud Trace with trace IDs, not client-side debug panels

### DON'T ❌
- **Don't modify global CSS** without reviewing impact across all pages
- **Don't add inline styles** - Use Tailwind utility classes or CSS modules
- **Don't break responsive design** - Always test mobile/tablet/desktop
- **Don't remove utility classes** without understanding their purpose
- **Don't add client-side debug tools** - We use GCP Cloud Trace for monitoring
- **Don't change container widths** without approval
- **Don't modify z-index** arbitrarily - Follow the z-index scale

---

## 2. Design System Overview

### Typography System

Our typography uses a hierarchical system with consistent spacing:

```css
/* Headings */
.heading-1  → text-4xl md:text-5xl lg:text-6xl (Page titles)
.heading-2  → text-3xl md:text-4xl (Section titles)
.heading-3  → text-2xl md:text-3xl (Subsection titles)
.heading-4  → text-xl md:text-2xl (Card titles)

/* Body Text */
.body-large  → text-lg (Leads, introductions)
.body-medium → text-base (Default body text)
.body-small  → text-sm (Captions, metadata)
```

**RULES:**
- ✅ Use `.heading-X` classes for all headings
- ❌ Don't use arbitrary font sizes like `text-[22px]`
- ✅ Maintain heading hierarchy (h1 → h2 → h3)
- ❌ Don't skip heading levels

### Color System

```css
/* Primary Palette */
Primary:   Indigo-600 (#4F46E5)
Secondary: Purple-600 (#9333EA)
Accent:    Cyan-500 (#06B6D4)

/* Gradients */
.gradient-primary   → from-indigo-600 to-purple-600
.gradient-secondary → from-purple-600 to-pink-600
.gradient-text      → Text gradient (indigo to purple)

/* Semantic Colors */
Success: Green-600
Warning: Amber-600
Error:   Red-600
Info:    Blue-600
```

**RULES:**
- ✅ Use semantic color names for states (success, error, warning)
- ❌ Don't hardcode hex colors in components
- ✅ Use `.gradient-primary` for CTAs and hero sections
- ❌ Don't create new gradient classes without design approval

### Shadow System

```css
.shadow-soft   → Subtle elevation (cards, inputs)
.shadow-medium → Moderate elevation (modals, dropdowns)
.shadow-strong → High elevation (floating elements)
```

**RULES:**
- ✅ Use predefined shadow classes
- ❌ Don't use `shadow-xl`, `shadow-2xl` directly
- ✅ Match shadow intensity to element hierarchy

### Spacing System

Follow Tailwind's 4px base scale:

```
4px  → 1 (p-1, m-1, gap-1)
8px  → 2 (p-2, m-2, gap-2)
12px → 3 (p-3, m-3, gap-3)
16px → 4 (p-4, m-4, gap-4)
24px → 6 (p-6, m-6, gap-6)
32px → 8 (p-8, m-8, gap-8)
48px → 12 (p-12, m-12, gap-12)
64px → 16 (p-16, m-16, gap-16)
```

**RULES:**
- ✅ Use consistent spacing values from the scale
- ❌ Don't use arbitrary values like `p-[13px]`
- ✅ Use larger gaps on desktop (`gap-6 md:gap-8`)

---

## 3. Layout Architecture

### Container System

```css
.container-custom {
  max-width: 1280px (7xl)
  margin: auto
  padding: 1rem (sm), 1.5rem (md), 2rem (lg)
}
```

**USAGE:**
```tsx
// ✅ CORRECT
<div className="container-custom section-padding">
  <h1 className="heading-1">Page Title</h1>
</div>

// ❌ WRONG - Don't add custom max-width
<div className="max-w-[1300px] mx-auto px-4">
  <h1 className="text-5xl">Page Title</h1>
</div>
```

**RULES:**
- ✅ Always use `.container-custom` for page containers
- ❌ Don't create custom container widths
- ✅ Use `.section-padding` or `.section-padding-sm` for vertical spacing
- ❌ Don't add random `py-12` values without checking consistency

### Section Padding

```css
.section-padding    → py-16 md:py-20 lg:py-24 (Major sections)
.section-padding-sm → py-12 md:py-16 (Minor sections)
```

**RULES:**
- ✅ Use for page sections to maintain vertical rhythm
- ❌ Don't mix section padding classes
- ✅ Combine with `.container-custom`

### Grid System

```tsx
// ✅ CORRECT - Responsive grid
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// ✅ CORRECT - Auto-fit columns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stats */}
</div>

// ❌ WRONG - Fixed columns on mobile
<div className="grid grid-cols-3 gap-4">
  {/* This breaks on mobile! */}
</div>
```

**RULES:**
- ✅ Start with `grid-cols-1` on mobile
- ✅ Use `md:grid-cols-2` for tablets
- ✅ Use `lg:grid-cols-3` or `lg:grid-cols-4` for desktop
- ❌ Don't use more than 4 columns on desktop
- ✅ Use consistent gap values (`gap-4`, `gap-6`, `gap-8`)

### Flexbox Patterns

```tsx
// ✅ Header with title and action
<div className="flex items-center justify-between mb-8">
  <h2 className="heading-2">Section Title</h2>
  <Button>Action</Button>
</div>

// ✅ Centered content
<div className="flex flex-col items-center justify-center min-h-screen">
  <Content />
</div>

// ✅ Horizontal list with gap
<div className="flex items-center gap-4">
  <Icon />
  <Text />
  <Badge />
</div>
```

---

## 4. Component Modification Rules

### Before Modifying ANY Component

**Step 1: IDENTIFY SCOPE**
```bash
# Search where component is used
grep -r "ComponentName" app/
grep -r "ComponentName" components/
```

**Step 2: CHECK DEPENDENCIES**
- Is this component used in multiple pages?
- Does it have child components?
- Does it receive props from parent?

**Step 3: DOCUMENT CHANGES**
```typescript
/**
 * @component ComponentName
 * @modified 2025-10-24
 * @changes Added new prop 'variant' for styling flexibility
 * @breaking-change Removed deprecated 'color' prop
 */
```

### Card Components

**Standard Pattern:**
```tsx
<Card className="card-interactive group">
  <CardHeader className="pb-4">
    <CardTitle className="heading-4 group-hover:text-indigo-600">
      Title
    </CardTitle>
    <CardDescription className="body-medium">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**RULES:**
- ✅ Use `.card-interactive` for clickable cards
- ✅ Use `.card-elevated` for floating cards
- ✅ Add `group` for hover effects
- ❌ Don't add borders/shadows directly - use utility classes

### Button Components

```tsx
// ✅ Primary CTA
<Button className="btn-primary">
  <Icon className="mr-2 h-4 w-4" />
  Action
</Button>

// ✅ Secondary action
<Button className="btn-secondary">
  Cancel
</Button>

// ✅ Ghost button
<Button variant="ghost" size="icon">
  <Icon className="h-4 w-4" />
</Button>
```

**RULES:**
- ✅ Use `.btn-primary` for main actions
- ✅ Use `.btn-secondary` for secondary actions
- ✅ Add icons with consistent sizing (`h-4 w-4`)
- ❌ Don't create custom button styles inline

### Form Components

```tsx
// ✅ Input with label
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter email"
    className="h-12"
  />
</div>

// ✅ Select dropdown
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="h-12">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

**RULES:**
- ✅ Use consistent input height (`h-12`)
- ✅ Always pair inputs with labels
- ✅ Use `space-y-2` for form field spacing
- ❌ Don't style form elements with arbitrary classes

---

## 5. CSS Best Practices

### File Organization

```
app/
  globals.css         ← Global styles, design tokens
  [page]/
    page.tsx          ← Page-specific components
    styles.module.css ← Page-specific styles (if needed)

components/
  [component]/
    component.tsx
    component.module.css ← Component-specific styles (rare)
```

**RULES:**
- ✅ Define global utilities in `globals.css`
- ✅ Use Tailwind classes for 95% of styling
- ✅ Use CSS modules only for complex animations
- ❌ Don't create new CSS files without justification

### Responsive Design Breakpoints

```
Mobile:  < 768px  (default)
Tablet:  768px+   (md:)
Desktop: 1024px+  (lg:)
Wide:    1280px+  (xl:)
```

**Mobile-First Approach:**
```tsx
// ✅ CORRECT - Mobile first
<div className="p-4 md:p-6 lg:p-8">
  <h1 className="text-2xl md:text-4xl lg:text-5xl">
    Title
  </h1>
</div>

// ❌ WRONG - Desktop first (requires overrides)
<div className="p-8 md:p-6 sm:p-4">
  <h1 className="text-5xl md:text-4xl sm:text-2xl">
    Title
  </h1>
</div>
```

### Dark Mode (Future Consideration)

Currently, we only support light mode. When implementing dark mode:

```tsx
// ✅ Prepare for dark mode
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white">

// ❌ Don't hardcode colors
<div style={{ background: '#ffffff', color: '#000000' }}>
```

---

## 6. Common Pitfalls

### ❌ Pitfall 1: Breaking Mobile Layout

**BAD:**
```tsx
<div className="flex gap-4">
  <div className="w-64">Sidebar</div>
  <div className="flex-1">Content</div>
</div>
```

**GOOD:**
```tsx
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-64">Sidebar</div>
  <div className="flex-1">Content</div>
</div>
```

### ❌ Pitfall 2: Overriding Container Width

**BAD:**
```tsx
<div className="container-custom max-w-full">
  {/* Breaks max-width constraint */}
</div>
```

**GOOD:**
```tsx
<div className="container-custom">
  {/* Respects design system */}
</div>
```

### ❌ Pitfall 3: Inconsistent Spacing

**BAD:**
```tsx
<div className="mb-7 mt-5">  {/* Random values */}
  <h2 className="mb-3">Title</h2>
  <p className="mb-2.5">Text</p>
</div>
```

**GOOD:**
```tsx
<div className="mb-8 mt-6">  {/* From spacing scale */}
  <h2 className="mb-4">Title</h2>
  <p className="mb-2">Text</p>
</div>
```

### ❌ Pitfall 4: Z-Index Chaos

**Z-Index Scale:**
```
0   → Default
10  → Dropdowns, tooltips
20  → Sticky headers
30  → Modals, dialogs
40  → Toasts, notifications
50  → Debug tools (removed)
```

**GOOD:**
```tsx
<div className="fixed z-30">  {/* Modal */}
<div className="sticky z-20"> {/* Header */}
```

### ❌ Pitfall 5: Ignoring Hover States

**BAD:**
```tsx
<Card>
  <CardTitle>Title</CardTitle>
</Card>
```

**GOOD:**
```tsx
<Card className="card-interactive group">
  <CardTitle className="group-hover:text-indigo-600 transition-colors">
    Title
  </CardTitle>
</Card>
```

---

## 7. Testing Checklist

### Before Committing UI Changes

- [ ] **Mobile (375px):** Test on iPhone SE viewport
- [ ] **Tablet (768px):** Test on iPad viewport
- [ ] **Desktop (1440px):** Test on standard desktop
- [ ] **Hover states:** All interactive elements have hover feedback
- [ ] **Focus states:** Keyboard navigation works
- [ ] **Loading states:** Skeleton loaders display correctly
- [ ] **Empty states:** "No data" messages are styled
- [ ] **Error states:** Error messages are visible and accessible
- [ ] **Typography:** Heading hierarchy is correct
- [ ] **Spacing:** Consistent padding/margins
- [ ] **Contrast:** Text meets WCAG AA standards (4.5:1)
- [ ] **Cross-browser:** Test on Chrome, Safari, Firefox
- [ ] **Performance:** No layout shifts (CLS)

### Visual Regression Testing

**Manual Checklist:**
```bash
# 1. Navigate to affected pages
- /courses
- /dashboard
- /teacher/dashboard
- /course/[id]
- /profile

# 2. Check for:
- Broken layouts
- Overlapping elements
- Missing spacing
- Text overflow
- Image distortion
```

---

## 8. Emergency Fixes

### Layout Broken After Deploy?

**Step 1: Check Recent Commits**
```bash
git log --oneline -n 10 -- app/ components/
```

**Step 2: Identify Changes**
```bash
git diff HEAD~1 app/globals.css
git diff HEAD~1 components/ui/
```

**Step 3: Quick Rollback**
```bash
# Rollback specific file
git checkout HEAD~1 -- app/globals.css

# Or revert entire commit
git revert <commit-hash>
```

### Common Quick Fixes

**Container Too Wide:**
```tsx
// Add max-width constraint
<div className="container-custom max-w-7xl">
```

**Mobile Menu Broken:**
```tsx
// Ensure mobile breakpoint
<nav className="hidden md:flex">
```

**Text Overflow:**
```tsx
// Add truncation
<p className="truncate">Long text...</p>
<p className="line-clamp-2">Multiline text...</p>
```

---

## 9. Monitoring & Debugging

### We Use GCP Cloud Trace

**NOT Debug Panels** ❌
- Client-side debug tools have been removed
- We don't use browser-based logging panels
- Performance monitoring is server-side only

**Use Cloud Trace** ✅
```typescript
// Tracing is automatically handled by:
// - middleware.ts (request tracing)
// - API routes (function tracing)
// - Error boundaries (error tracing)

// Access traces via GCP Console:
// https://console.cloud.google.com/traces
```

**Finding Issues:**
1. Check GCP Trace for request performance
2. Look for trace IDs in API responses
3. Use trace IDs to correlate frontend/backend issues
4. Review Cloud Logging for detailed logs

**Performance Metrics:**
- Response times tracked via Trace
- Error rates via Cloud Logging
- User interactions via Analytics (if enabled)

---

## 10. Code Review Guidelines

### UI Change PR Checklist

**Required in PR Description:**
- [ ] Screenshots (before/after)
- [ ] Mobile, tablet, desktop tested
- [ ] Affected pages listed
- [ ] Design system compliance verified
- [ ] Breaking changes documented

**Reviewer Checklist:**
- [ ] Design system rules followed
- [ ] No arbitrary values used
- [ ] Responsive design maintained
- [ ] Accessibility not degraded
- [ ] No inline styles added
- [ ] Class names are semantic
- [ ] Component structure logical

---

## 11. Quick Reference

### Common Patterns

**Page Container:**
```tsx
<div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
  <div className="container-custom section-padding-sm">
    {/* Content */}
  </div>
</div>
```

**Stats Grid:**
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
  <Card className="card-elevated">
    <CardContent className="p-8">
      <p className="body-small font-medium text-gray-500">Label</p>
      <p className="heading-3">{value}</p>
    </CardContent>
  </Card>
</div>
```

**Course Card:**
```tsx
<Card className="card-interactive group">
  <CardHeader className="pb-4">
    <CardTitle className="heading-4 group-hover:text-indigo-600">
      {course.title}
    </CardTitle>
    <CardDescription className="body-medium">
      by {course.teacher}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Progress value={progress} />
    <Button className="w-full btn-primary mt-4">
      Continue Learning
    </Button>
  </CardContent>
</Card>
```

### Utility Classes Reference

| Purpose | Classes |
|---------|---------|
| Container | `container-custom` |
| Section spacing | `section-padding`, `section-padding-sm` |
| Card interactive | `card-interactive`, `card-elevated` |
| Button primary | `btn-primary` |
| Button secondary | `btn-secondary` |
| Gradient text | `gradient-text` |
| Gradient BG | `gradient-primary` |
| Shadows | `shadow-soft`, `shadow-medium`, `shadow-strong` |

---

## 12. Getting Help

### When to Ask for Review

- ✅ Changing global styles
- ✅ Modifying shared components
- ✅ Adding new utility classes
- ✅ Breaking existing patterns
- ✅ Unsure about accessibility

### Resources

- **Tailwind Docs:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **GCP Trace:** https://console.cloud.google.com/traces

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-24 | Initial guide created, removed debug panel |

---

**Remember:** When in doubt, follow existing patterns. Consistency > creativity in UI development.
