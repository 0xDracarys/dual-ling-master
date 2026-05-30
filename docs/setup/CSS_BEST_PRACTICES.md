# CSS Best Practices for LangExchange

## 🎯 Visibility and Contrast Guidelines

### ✅ DO - Good Practices

#### 1. **Button Styling**
```tsx
// ✅ Primary buttons - always visible
<Button className="btn-primary">
  Primary Action
</Button>

// ✅ Secondary buttons - proper contrast
<Button className="btn-secondary">
  Secondary Action
</Button>

// ✅ Outline buttons - always specify border color
<Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white">
  Outline Action
</Button>

// ✅ White outline buttons on dark backgrounds
<Button variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600 bg-transparent shadow-lg">
  White Outline
</Button>
```

#### 2. **Text Contrast**
```tsx
// ✅ High contrast text
<p className="text-gray-900">Primary text</p>
<p className="text-gray-700">Secondary text</p>
<p className="text-gray-600">Muted text</p>

// ✅ White text on colored backgrounds
<p className="text-white bg-indigo-600">White on indigo</p>
<p className="text-white bg-gray-900">White on dark</p>
```

#### 3. **Hover States**
```tsx
// ✅ Proper hover contrast
<button className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-100">
  Hover Button
</button>

// ✅ Button hover states
<Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
  Hover Button
</Button>
```

### ❌ DON'T - Avoid These Patterns

#### 1. **Invisible Text**
```tsx
// ❌ White text on white background
<p className="text-white bg-white">Invisible text!</p>

// ❌ Light gray on light background
<p className="text-gray-400 bg-gray-50">Poor contrast!</p>
```

#### 2. **Problematic Hover States**
```tsx
// ❌ Hover that makes text invisible
<button className="text-gray-500 hover:bg-gray-50">
  Text becomes invisible on hover!
</button>

// ❌ Missing border on outline buttons
<Button variant="outline">Missing border color!</Button>
```

#### 3. **Transparent Backgrounds Without Contrast**
```tsx
// ❌ Transparent background without proper styling
<button className="bg-transparent text-white">
  May be invisible!
</button>
```

## 🛠️ Design System Classes

### Button Variants
- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary action buttons  
- `.btn-ghost` - Subtle action buttons
- `.btn-outline-primary` - Outlined primary buttons
- `.btn-outline-white` - White outlined buttons
- `.btn-outline-danger` - Danger outlined buttons

### Text Classes
- `.text-visible` - High contrast text (gray-900)
- `.text-visible-light` - Medium contrast text (gray-700)
- `.text-visible-muted` - Muted text (gray-600)

### Background Classes
- `.bg-contrast` - High contrast background (white)
- `.bg-contrast-light` - Light contrast background (gray-50)

### Hover Classes
- `.hover-visible` - Safe hover states
- `.hover-visible-primary` - Primary hover states
- `.hover-visible-danger` - Danger hover states

## 🔍 Validation

Run the CSS validation script to check for issues:

```bash
node scripts/validate-css.js
```

This script will catch:
- White text on white backgrounds
- Poor contrast combinations
- Missing border colors on outline buttons
- Problematic hover states

## 📋 Checklist

Before committing CSS changes:

- [ ] All text has sufficient contrast
- [ ] Buttons are visible in all states (normal, hover, focus)
- [ ] Outline buttons have proper border colors
- [ ] Hover states maintain text visibility
- [ ] Transparent backgrounds have proper styling
- [ ] Run validation script and fix any errors

## 🎨 Color Palette

### Primary Colors
- `indigo-600` - Primary brand color
- `indigo-700` - Primary hover state
- `purple-600` - Secondary brand color

### Text Colors
- `gray-900` - Primary text (high contrast)
- `gray-700` - Secondary text (medium contrast)
- `gray-600` - Muted text (low contrast)
- `gray-500` - Very muted text (use sparingly)

### Background Colors
- `white` - Primary background
- `gray-50` - Light background
- `gray-100` - Subtle background
- `indigo-50` - Brand light background

### Status Colors
- `green-600` - Success states
- `red-600` - Error states
- `yellow-500` - Warning states
- `blue-600` - Info states

## 🚀 Quick Fixes

### Fix Invisible Text
```tsx
// Before
<p className="text-white bg-white">Invisible</p>

// After
<p className="text-gray-900 bg-white">Visible</p>
```

### Fix Outline Buttons
```tsx
// Before
<Button variant="outline">Button</Button>

// After
<Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white">
  Button
</Button>
```

### Fix Hover States
```tsx
// Before
<button className="text-gray-500 hover:bg-gray-50">Button</button>

// After
<button className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-100">Button</button>
```

Remember: **Always test your changes in different browsers and screen sizes!**
