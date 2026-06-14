# fixingFrontend.md — UI/UX Overhaul PRD & MVP

## Project Overview
**Platform:** English With Evelina — Lithuanian-English language learning platform  
**Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui  
**Goal:** Transform a functional but visually basic site into a premium, polished, visually stunning language-learning platform.

---

## Current Issues Audit

### 🔴 Critical (Empty / Missing)
| Page | Issue |
|------|-------|
| Contact | Right column (grid lg:grid-cols-2) is empty — no second content block |
| About | "Know Your Instructor" has image referencing `/about-us-image.jpg` — likely broken |
| Login/Register | Plain card with no branding/personality, no decorative split layout |
| Dashboard | Stats are functional but flat and dull; empty state looks generic |
| Courses | No hero/banner, plain filter bar, no visual course thumbnails or placeholders |

### 🟡 Moderate (Dull / Generic)
| Page | Issue |
|------|-------|
| Home (landing) | Hero image path `/portfolio-hero-image.jpg` is in root (not `/public`), may 404 on prod |
| Home | "Features" section uses generic English text that contradicts the Lithuanian brand voice |
| Pricing | Good structure, but FAQ is plain — no expand/collapse accordion |
| About | Only 2 sections; minimal depth; no timeline/milestones |
| Footer | Social icons are placeholder letters ("T", "F", etc.) — no real icons |
| Global CSS | Missing `btn-secondary`, `btn-outline-white`, `card-elevated`, `card-interactive`, `heading-4`, `body-large`, `body-medium`, `body-small`, `container-custom`, `section-padding-sm`, `shadow-medium`, `gradient-primary` utility classes — these are used in JSX but not defined |

### 🟢 Enhancements
- No page scroll-reveal animations
- No skeleton shimmer for loading states
- No toast/notification on form submit
- Dark mode not fully tested
- No Google Fonts loaded (defaults to system font)

---

## Design System (MVP Tokens)

### Color Palette
```
Primary:   Indigo-600 → Purple-600 gradient
Accent:    Violet-500
Success:   Emerald-500
Warning:   Amber-500
Error:     Rose-500
Neutral:   Gray-50/100/200/600/700/900
```

### Typography
- **Font:** Inter (Google Fonts) — already set up via `font-sans`
- **Headings:** `heading-1` → `heading-4` utility classes
- **Body:** `body-large` (18px), `body-medium` (16px), `body-small` (14px)

### Component Classes (to be defined in globals.css)
```
.container-custom     → max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
.section-padding      → py-24 px-4
.section-padding-sm   → py-16 px-4
.card-glass           → already defined
.card-elevated        → bg-white shadow-xl rounded-2xl border border-gray-100
.card-interactive     → card-elevated + hover lift + cursor-pointer
.card-interactive     → hover:shadow-2xl hover:-translate-y-1 transition-all duration-300
.heading-1            → text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight
.heading-2            → text-3xl md:text-4xl font-bold tracking-tight
.heading-3            → text-2xl md:text-3xl font-semibold
.heading-4            → text-xl font-semibold
.body-large           → text-lg text-gray-600 leading-relaxed
.body-medium          → text-base text-gray-600
.body-small           → text-sm text-gray-500
.gradient-text        → already defined
.gradient-primary     → bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600
.btn-primary          → already defined
.btn-secondary        → bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl px-6 py-3
.btn-outline-white    → border-2 border-white text-white hover:bg-white/20 rounded-xl px-6 py-3
.shadow-medium        → shadow-lg (used in icon containers)
```

---

## Page-by-Page MVP Plan

### 1. `globals.css` — Foundation Fix ⚡ PRIORITY 1
**Actions:**
- Add ALL missing utility classes used across pages
- Add Google Fonts `Inter` import via `@import`
- Add `animate-shimmer` for skeleton loading
- Add `btn-secondary`, `btn-outline-white`, `shadow-medium`, `container-custom`, all `heading-*` and `body-*` classes

---

### 2. Home Page (`app/page.tsx`) ⚡ PRIORITY 2
**Current:** Good structure, but English features section mixed with Lithuanian brand copy  
**Actions:**
- Move hero image to `/public/` if needed (it's already at root — Next.js `public/` serves from root so check path)
- Add `animate-float` to hero image for subtle float animation
- Make stats section numbers animate up on scroll (CSS counter trick or simple opacity)
- Features section: keep but add gradient border to cards
- Add a "How It Works" 3-step section with icons (Step 1: Book free call → Step 2: Get personal plan → Step 3: Start learning)
- Footer: replace letter-avatar social icons with proper SVG icons (Instagram, Facebook, WhatsApp, LinkedIn)

---

### 3. Courses Page (`app/courses/page.tsx`) ⚡ PRIORITY 2
**Current:** No hero section, plain filter bar, cards have no visual punch  
**Actions:**
- Add hero banner at top: gradient background, title + description + stats (X courses, X levels)
- Add colored placeholder thumbnails when `thumbnailUrl` is null (gradient based on course level)
- Make filter bar sticky on scroll
- Improve course cards: add language flag emoji (🇱🇹 / 🇬🇧), better badge styling
- Empty state: add illustration + friendly message

---

### 4. Dashboard (`app/dashboard/page.tsx`) ⚡ PRIORITY 2
**Current:** Stat cards exist but flat; empty state is generic  
**Actions:**
- Add personalized greeting with time-of-day ("Good morning, Jonas! ☀️")
- Stat cards: add colored bottom border accent + trend indicator
- Progress bars: already exist, make them gradient-colored
- Add "Daily Streak" motivator card with flame emoji
- Empty state: premium illustration + more personal copy
- Quick Actions: make cards more visual with larger icons

---

### 5. About Page (`app/about/page.tsx`) ⚡ PRIORITY 3
**Current:** Two sections, basic layout, broken image path  
**Actions:**
- Fix image path (generate a professional placeholder if `/about-us-image.jpg` is missing)
- Add "My Journey" timeline section (5 milestones with years and descriptions)
- Add "My Teaching Method" section with 3 pillars
- Add student result stats row (matching home page stats)
- Make values section use a 2x2 grid with colored backgrounds per card

---

### 6. Pricing Page (`app/pricing/page.tsx`) ⚡ PRIORITY 3
**Current:** Solid structure, FAQ is plain  
**Actions:**
- Convert FAQ to accordion (using shadcn/ui Accordion component)
- Add animated price reveal on hover for plan cards
- Add comparison table below pricing cards
- Make the "popular" card more visually distinct (glowing border effect)

---

### 7. Contact Page (`app/contact/page.tsx`) ⚡ PRIORITY 3
**Current:** Grid `lg:grid-cols-2` but second column is empty  
**Actions:**
- Add right column: "What to expect" with 3 bullet points + Evelina quote/photo card
- Form: add floating labels animation
- Add WhatsApp quick-contact button (sticky or prominent)
- Success state: more premium animation

---

### 8. Login & Register Pages ⚡ PRIORITY 4
**Current:** Plain centered card  
**Actions:**
- Split layout: left panel = brand image/gradient with testimonial quote, right = form
- Add logo at top of form
- Password visibility toggle
- "Forgot password" link
- Social proof text under CTA ("Join 200+ learners")

---

### 9. Profile Page (`app/profile/page.tsx`) — Review
**Actions:**
- Review current state; add avatar upload UI if missing
- Add achievement badges section

---

## Implementation Order

```
Phase 1 (Foundation):
  [x] globals.css — add all missing utilities + Google Fonts

Phase 2 (High-traffic pages):
  [ ] Home page enhancements  
  [ ] Courses page hero + card polish
  [ ] Dashboard — greeting, streak card, stat polish

Phase 3 (Supporting pages):
  [ ] About — timeline + image fix
  [ ] Pricing — accordion FAQ + comparison table
  [ ] Contact — fill empty column

Phase 4 (Auth):
  [ ] Login — split layout
  [ ] Register — split layout

Phase 5 (Polish):
  [ ] Footer — real social icons
  [ ] Global scroll animations
  [ ] Final review
```

---

## Success Criteria (Definition of Done)
- [ ] No 404s on any image reference
- [ ] All custom CSS classes referenced in JSX are defined in globals.css
- [ ] Each page has a visually distinct, premium hero section
- [ ] No "empty" columns or sections
- [ ] Animations are subtle and performant (no layout shift)
- [ ] All text is readable (contrast ratio ≥ 4.5:1)
- [ ] Mobile-responsive on all pages
