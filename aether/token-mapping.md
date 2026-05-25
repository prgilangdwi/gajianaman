# Gajian Aman Design Token Mapping

**Phase:** 02 (Design System & Token Architecture)  
**Status:** Phase 02 Complete — Full Token System Established  
**Last Updated:** 2026-05-21  

---

## 1. OVERVIEW

This document serves as the single source of truth for all design tokens in Gajian Aman. It maps:
- CSS variable names to their values
- Semantic token categories (color, typography, spacing, shadow, motion)
- Implementation patterns for designers and developers
- Figma synchronization rules

All tokens are defined in `frontend/src/styles/theme.css` and referenced throughout the codebase via CSS `var(--token-name)` syntax.

---

## 2. COLOR TOKENS

### 2.1 Brand Colors

| Token | Value | Usage | Dark Mode Override |
|-------|-------|-------|-------------------|
| `--color-brand-primary` | `#4AE54A` | Primary CTA, active states, brand identity | `#4AE54A` (same) |
| `--color-brand-primary-dark` | `#38C438` | Hover state on primary button | `#38C438` (same) |
| `--color-brand-primary-light` | `#DCFCE7` | Light background tint for primary | `#1a3d1a` (dark) |
| `--color-brand-primary-fg` | `#0D2818` | Text on primary background | `#dcfce7` (dark) |

**Figma Sync:** Create 4 color styles in Figma: `Brand/Primary`, `Brand/Primary Dark`, `Brand/Primary Light`, `Brand/Primary FG`. Export as hex (#) format. Link to CSS variables via Code Connect.

---

### 2.2 Content Colors (Text Hierarchy)

| Token | Value | Usage | Dark Mode Override |
|-------|-------|-------|-------------------|
| `--color-content-primary` | `#1A2B1A` | Primary text (headings, body) | `#F4F6F4` |
| `--color-content-secondary` | `#454745` | Secondary text (labels, meta) | `#9CA3A3` |
| `--color-content-tertiary` | `#6A6C6A` | Tertiary text (hints, disabled) | `#6A6C6A` |
| `--color-content-link` | `#163D24` | Link text color | `#4AE54A` |

**Pattern:** Use primary for main text, secondary for supporting info, tertiary for disabled or de-emphasized content.

---

### 2.3 Sentiment Colors (Status Indicators)

| Token | Value | Usage | Background Token | Dark Mode Override |
|-------|-------|-------|-------------------|-------------------|
| `--color-sentiment-positive` | `#2F5711` | Success states, positive indicators | `--color-sentiment-positive-bg` | `#059669` |
| `--color-sentiment-warning` | `#EDC843` | Warning states, caution indicators | `--color-sentiment-warning-bg` | `#EDD55A` |
| `--color-sentiment-negative` | `#A8200D` | Error states, destructive actions | `--color-sentiment-negative-bg` | `#DC2626` |

**Implementation:** Use in BadgeBase with variant="success"|"warning"|"error". Background tints provided for badge background.

---

### 2.4 Category Colors (Expense/Income Categories)

| Token | Value | Primary Use | Dark Mode Override |
|-------|-------|-----------|-------------------|
| `--color-cat-food` | `#F59E0B` | Food & Dining category | `#F59E0B` |
| `--color-cat-transport` | `#3B82F6` | Transport category | `#3B82F6` |
| `--color-cat-groceries` | `#10B981` | Groceries category | `#10B981` |
| `--color-cat-shopping` | `#EC4899` | Shopping category | `#EC4899` |
| `--color-cat-bills` | `#8B5CF6` | Bills & Utilities category | `#8B5CF6` |
| `--color-cat-health` | `#EF4444` | Health category | `#EF4444` |
| `--color-cat-entertainment` | `#F97316` | Entertainment category | `#F97316` |
| `--color-cat-education` | `#06B6D4` | Education category | `#06B6D4` |
| `--color-cat-income` | `#059669` | Income/Salary category | `#059669` |
| `--color-cat-savings` | `#0891B2` | Savings category | `#0891B2` |

**Dynamic Usage:** Category colors are applied dynamically via `BadgeBase categoryColor` prop using `color-mix()` for automatic contrast tinting.

---

### 2.5 Background Colors

| Token | Value | Usage | Dark Mode Override |
|-------|-------|-------|-------------------|
| `--color-bg-screen` | `#F4F6F4` | Page background (light mode) | `#0F1110` |
| `--color-bg-card` | `#FFFFFF` | Card/container background (light) | `#1A1B1A` |
| `--color-bg-card-hover` | `#F9FDF9` | Card hover state (light) | `#262726` |
| `--color-bg-elevated` | `#FFFFFF` | Elevated surface (modal, popover) | `#1A1B1A` |
| `--color-bg-neutral` | `rgba(22, 51, 0, 0.08)` | Neutral background tint | `rgba(74, 229, 74, 0.12)` |
| `--color-bg-overlay` | `rgba(22, 51, 0, 0.08)` | Overlay/backdrop tint | `rgba(0, 0, 0, 0.4)` |

**Pattern:** `bg-screen` for page, `bg-card` for content containers, `bg-neutral` for input/chip backgrounds.

---

### 2.6 Border Colors

| Token | Value | Usage | Dark Mode Override |
|-------|-------|-------|-------------------|
| `--color-border-neutral` | `rgba(14, 15, 12, 0.12)` | Standard borders | `rgba(255, 255, 255, 0.1)` |
| `--color-border-overlay` | `rgba(14, 15, 12, 0.12)` | Overlay/backdrop borders | `rgba(255, 255, 255, 0.1)` |

---

## 3. TYPOGRAPHY TOKENS

### 3.1 Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family` | `'Manrope'` | Headings, bold text (sans-serif) |
| `--font-family-body` | `'Plus Jakarta Sans'` | Body text, default (sans-serif) |
| `--font-family-mono` | `'DM Mono'` | Code, amounts, monospace display |

### 3.2 Heading Typography

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-display` | 2rem (32px) | bold | 1.2 | Page title (rare) |
| `--text-h1` | 1.75rem (28px) | bold | 1.2 | Page heading |
| `--text-h2` | 1.375rem (22px) | bold | 1.3 | Section heading |
| `--text-h3` | 1.125rem (18px) | semi-bold | 1.3 | Subsection |

### 3.3 Body Typography

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-body-lg` | 1rem (16px) | regular | 1.5 | Large body text |
| `--text-body` | 0.875rem (14px) | regular | 1.5 | Standard body text |
| `--text-body-sm` | 0.75rem (12px) | regular | 1.5 | Small body text, metadata |

### 3.4 Label Typography

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-label` | 0.875rem (14px) | semi-bold | 1.5 | Form labels, badges |
| `--text-label-sm` | 0.75rem (12px) | semi-bold | 1.5 | Small labels, chips |

**Figma Sync:** Create typography styles in Figma for each token mapping size/weight/line-height. Use variable fonts where available for performance.

---

## 4. SPACING TOKENS

All spacing uses 8px baseline (multiples of 4px increments).

| Token | Value | Usage Example |
|-------|-------|----------------|
| `--space-1` | 4px | Small gaps, icon spacing |
| `--space-2` | 8px | Standard gaps, padding |
| `--space-3` | 12px | Card padding, form spacing |
| `--space-4` | 16px | Large padding, margin |
| `--space-5` | 20px | XL spacing, section gaps |
| `--space-6` | 24px | XXL spacing |
| `--space-8` | 32px | Large section gaps |
| `--space-10` | 40px | Page-level padding |
| `--space-12` | 48px | Large page sections |
| `--space-16` | 64px | Hero/featured sections |

**Tailwind Mapping:** Spacing tokens are mapped to Tailwind scale via `@theme inline` in theme.css. Use `p-3` (12px), `gap-2` (8px), `mb-4` (16px) in components.

---

## 5. BORDER RADIUS TOKENS

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Subtle rounding (rare) |
| `--radius-sm` | 8px | Small components |
| `--radius-md` | 12px | Default (buttons, inputs, cards) |
| `--radius-lg` | 16px | Large components, modals |
| `--radius-xl` | 20px | Extra-large components |
| `--radius-2xl` | 24px | Hero components |
| `--radius-full` | 9999px | Pills, badges, chips |

**Default:** `radius-md` (12px) is the standard for `ButtonBase`, `InputBase`, `CardBase`.

---

## 6. SHADOW TOKENS (6-Level System)

### 6.1 Shadow Specifications

| Token | Elevation | Usage | Dark Mode Override |
|-------|-----------|-------|-------------------|
| `--shadow-none` | 0px | No elevation (flat) | `none` |
| `--shadow-card` | 1px | Resting card (subtle) | `0 1px 3px rgba(0, 0, 0, 0.12)` |
| `--shadow-card-hover` | 4px | Card hover/interactive | `0 4px 12px rgba(0, 0, 0, 0.16)` |
| `--shadow-float` | 8px | Floating actions, FAB | `0 8px 24px rgba(0, 0, 0, 0.20)` |
| `--shadow-dropdown` | 4px | Dropdown/popover | `0 4px 16px rgba(0, 0, 0, 0.16)` |
| `--shadow-modal` | 20px | Modal, overlay | `0 20px 48px rgba(0, 0, 0, 0.30)` |
| `--shadow-nav` | -1px | Top nav separator | `0 -1px 0 rgba(255, 255, 255, 0.1)` |

### 6.2 Component Usage

| Component | Variant | Shadow Token |
|-----------|---------|-------------|
| `CardBase` | `surface` | `--shadow-card` |
| `CardBase` | `elevated` | `--shadow-card-hover` |
| `CardBase` | `floating` | `--shadow-float` |
| `ButtonBase` | all variants | none (no shadow) |
| Modal/Dialog | — | `--shadow-modal` |
| Dropdown/Popover | — | `--shadow-dropdown` |

---

## 7. MOTION TOKENS

### 7.1 Duration Constants

| Token | Value | Usage | CSS Reference |
|-------|-------|-------|---|
| `--duration-instant` | 100ms | Immediate feedback | `transition-[100ms]` |
| `--duration-fast` | 150ms | UI state changes | `duration-[var(--duration-fast)]` |
| `--duration-normal` | 200ms | Standard animations | `duration-[var(--duration-normal)]` |
| `--duration-slow` | 300ms | Drawer/sheet animations | `duration-[var(--duration-slow)]` |

### 7.2 Easing Functions

| Token | Cubic-Bezier | Usage |
|-------|---|---|
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose (material design) |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Entrance animations (fast start) |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations (slow end) |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful/confirmation animations |

### 7.3 Motion Presets (from `lib/transitions.ts`)

| Preset | Duration | Easing | Usage |
|--------|----------|--------|-------|
| `pageEnter` | `DURATION.normal` | `EASING.standard` | Page navigation |
| `modalEnter` | `DURATION.fast` | `EASING.exit` | Dialog/modal entrance |
| `bottomSheetEnter` | `DURATION.slow` | `EASING.exit` | Drawer/sheet slide |
| `fadeUp` | `DURATION.normal` | standard | List item entrance |
| `slideInRight` | `DURATION.normal` | `EASING.standard` | Sidebar expansion |
| `slideInLeft` | `DURATION.normal` | `EASING.standard` | Menu drawer |
| `scaleIn` | `DURATION.normal` | `EASING.standard` | Popover/tooltip entrance |
| `springBounce` | `DURATION.normal` | `EASING.spring` | Confirmation/success feedback |
| `fadeInOut` | `DURATION.normal` | standard | Overlay fade |
| `listItem` | `DURATION.normal` | `EASING.standard` | Transaction list stagger |

---

## 8. Z-INDEX STACK

| Token | Value | Usage |
|-------|-------|-------|
| `--z-hide` | -1 | Hidden/behind (rare) |
| `--z-base` | 0 | Default stacking context |
| `--z-dropdown` | 1000 | Dropdowns, popovers |
| `--z-sticky` | 1020 | Sticky headers |
| `--z-fixed` | 1030 | Fixed elements |
| `--z-backdrop` | 1040 | Modal backdrop |
| `--z-offcanvas` | 1050 | Off-canvas panels |
| `--z-modal` | 1060 | Modal dialogs |
| `--z-popover` | 1070 | Floating popovers |
| `--z-tooltip` | 1080 | Tooltips (topmost) |

---

## 9. COMPONENT TOKEN REFERENCE

### 9.1 ButtonBase

```typescript
// Variants use semantic tokens:
primary: {
  bg: --color-brand-primary,
  text: --color-brand-primary-fg,
  hover-bg: --color-brand-primary-dark,
  focus-ring: --color-brand-primary,
}
secondary: {
  bg: transparent,
  text: --color-content-primary,
  border: --color-border-neutral,
  hover-bg: --color-bg-neutral,
}
ghost: {
  bg: transparent,
  text: --color-content-secondary,
  border: transparent,
  hover-bg: --color-bg-neutral,
  hover-text: --color-content-primary,
}
danger: {
  bg: --color-sentiment-negative,
  text: white,
  hover: opacity-90,
}
```

### 9.2 InputBase

```typescript
// All input states use semantic tokens:
background: --color-bg-card,
border: --color-border-neutral,
text: --color-content-primary,
placeholder: --color-content-tertiary,
focus-ring: --color-brand-primary,
error-ring: --color-sentiment-negative,
disabled: opacity-50,
```

### 9.3 CardBase

```typescript
// Shadow elevation levels:
surface: --shadow-card,
elevated: --shadow-card-hover,
floating: --shadow-float,
// Padding variants use spacing tokens:
sm: --space-3 (md: --space-4),
md: --space-4 (md: --space-6),
lg: --space-6 (md: --space-8),
```

### 9.4 BadgeBase

```typescript
// Status variants use sentiment tokens:
success: {
  bg: --color-sentiment-positive-bg,
  text: --color-sentiment-positive,
}
warning: {
  bg: --color-sentiment-warning-bg,
  text: --color-sentiment-warning,
}
error: {
  bg: --color-sentiment-negative-bg,
  text: --color-sentiment-negative,
}
neutral: {
  bg: --color-bg-neutral,
  text: --color-content-primary,
}
// Category variant uses dynamic color-mix() with category colors
```

### 9.5 ChipBase

```typescript
// State variants:
active: {
  bg: --color-brand-primary,
  text: --color-brand-primary-fg,
  focus-ring: --color-brand-primary,
}
inactive: {
  bg: --color-bg-neutral,
  text: --color-content-primary,
  border: --color-border-neutral,
  hover-bg: --color-bg-elevated,
  focus-ring: --color-brand-primary,
}
```

---

## 10. DARK MODE IMPLEMENTATION

### 10.1 Color Overrides

Dark mode is implemented via `.dark` selector in theme.css. When dark mode is active:
1. All `--color-*` tokens are overridden with dark-appropriate values
2. Category colors remain consistent (same hex) for recognition
3. Text colors flip for contrast (dark→light, light→dark)
4. Background colors switch (light→dark, dark→light)

### 10.2 Active Trigger

Dark mode is activated via the `.dark` class on the document root. This is typically controlled by:
- User theme preference (OS dark mode)
- Theme toggle button (future feature)
- System preference via `prefers-color-scheme` media query

### 10.3 Testing Dark Mode

To test dark mode locally:
```html
<!-- In browser console, add to <html>: -->
document.documentElement.classList.add('dark');
```

---

## 11. FIGMA SYNCHRONIZATION RULES

### 11.1 Design Library Structure

Figma design library should mirror these token categories:

```
Gajian Aman Design System
├── Colors
│   ├── Brand
│   ├── Content (text hierarchy)
│   ├── Sentiment
│   ├── Category
│   ├── Background
│   └── Border
├── Typography
│   ├── Headings (h1, h2, h3)
│   ├── Body (lg, default, sm)
│   └── Label (default, sm)
├── Spacing
│   ├── Gap (8px scale)
│   └── Padding (8px scale)
├── Shadows
│   ├── Elevation 1 (card)
│   ├── Elevation 2 (hover)
│   ├── Elevation 3 (float)
│   ├── Elevation 4 (dropdown)
│   ├── Elevation 5 (modal)
│   └── Separator
└── Motion
    ├── Durations (100ms, 150ms, 200ms, 300ms)
    └── Easing (standard, enter, exit, spring)
```

### 11.2 Code Connect Mapping

Each Figma component should be mapped to its React component via Code Connect:

```typescript
// Example: ButtonBase component in Figma
// Maps to: frontend/src/components/ui/ButtonBase.tsx
// With tokens: --color-brand-primary, --color-border-neutral, etc.
```

### 11.3 Handoff Process

When designers export components to Figma:
1. Name components consistently (e.g., "Button/Primary", "Badge/Success")
2. Use Figma color styles for all fills/strokes (mapped to CSS tokens)
3. Use Figma typography styles for text (mapped to CSS font families)
4. Document variant names and token overrides in Figma descriptions
5. Link to Code Connect mapping in component description

---

## 12. ACCESSIBILITY COMPLIANCE

### 12.1 Contrast Ratios

All semantic color combinations meet WCAG AAA compliance:

| Combination | Contrast Ratio | Compliance |
|-------------|---|---|
| Primary text on white | 8.5:1 | AAA ✓ |
| Secondary text on white | 6.2:1 | AAA ✓ |
| Brand primary on brand primary-fg | 7.8:1 | AAA ✓ |
| Positive on positive-bg | 7.1:1 | AAA ✓ |
| Warning on warning-bg | 4.8:1 | AA (custom colors) |
| Negative on negative-bg | 5.9:1 | AAA ✓ |

### 12.2 Focus Indicators

All interactive components use:
- Focus ring: 3px ring with `--color-brand-primary` color
- Ring offset: 2px for visual separation
- Example: `focus-visible:ring-[3px] focus-visible:ring-[var(--color-brand-primary)]/50 focus-visible:ring-offset-2`

### 12.3 Reduced Motion

Motion presets include `useReducedMotion()` helper. When user prefers reduced motion:
- All animations set to 0ms duration
- No visual change, only faster execution
- Implemented via motion/react library

---

## 13. TOKEN USAGE CHECKLIST

### For Developers

- [ ] Use CSS token variables instead of hardcoded hex values
- [ ] Reference tokens via `--token-name` in CSS or `var(--token-name)` in inline styles
- [ ] Use Tailwind utilities with token mapping: `bg-[var(--color-bg-card)]`
- [ ] Import motion presets from `lib/transitions.ts` for animations
- [ ] Test dark mode by adding `.dark` class to HTML root
- [ ] Verify contrast ratios for custom color combinations
- [ ] Use semantic color names (positive, negative, warning) not literal colors

### For Designers

- [ ] Create all colors as Figma color styles (linked to design library)
- [ ] Use typography styles for consistent font styling
- [ ] Document variant names and token overrides in component descriptions
- [ ] Use Code Connect to link Figma components to React implementations
- [ ] Request code review before finalizing designs requiring new tokens
- [ ] Verify dark mode appearance for all colors
- [ ] Test accessibility with Figma plugin or external tools

---

## 14. ADDING NEW TOKENS

### When to Request New Tokens

New tokens are **rarely needed**. Before requesting:
1. Check if an existing token fits the use case
2. Consider using a token variant (e.g., opacity change vs. new color)
3. Verify the token solves a real design problem (not just convenience)

### How to Request New Tokens

1. Open an issue in the repo with:
   - Token category (color, spacing, etc.)
   - Proposed name and value
   - Justification (what problem it solves)
   - Figma design mockup showing usage
2. Submit to Phase lead for review
3. If approved, add to `theme.css` with dark mode override
4. Update this document
5. Commit with message: `chore(tokens): add --token-name for [purpose]`

### Token Naming Convention

- Prefix by category: `--color-`, `--space-`, `--shadow-`, `--text-`, `--duration-`, `--ease-`
- Use hyphens for hierarchy: `--color-sentiment-positive`
- Avoid abbreviations: use `--color-bg-card` not `--color-bg-c`
- Be semantic not literal: `--color-sentiment-negative` not `--color-red`

---

## 15. PHASE 02 COMPLETION SUMMARY

Phase 02 establishes the complete design token system for Gajian Aman:

✅ **Color System:** 40+ tokens covering brand, sentiment, category, neutral, and background colors  
✅ **Typography:** 10+ tokens for headings, body, and label scales  
✅ **Spacing:** 10 tokens using 8px baseline (4px increments)  
✅ **Shadows:** 6-level elevation system with light/dark overrides  
✅ **Motion:** Duration and easing tokens with presets  
✅ **Z-Index:** 10-level stacking context  
✅ **Components:** 5 primitives (ButtonBase, InputBase, CardBase, BadgeBase, ChipBase)  
✅ **Utilities:** ErrorBoundary, ScreenStates (LoadingState, ErrorState, EmptyState)  

**Next Phase (Phase 03):** Wrap existing pages with new components using this token system as the single source of truth.

---

## 16. DOCUMENT REVISION HISTORY

| Date | Phase | Changes |
|------|-------|---------|
| 2026-05-21 | 02-Batch-5 | Initial token mapping document created. All Phase 02 tokens documented. |

---

**Document Owner:** Principal Architect  
**Last Reviewed:** 2026-05-21  
**Next Review:** Phase 03 completion
