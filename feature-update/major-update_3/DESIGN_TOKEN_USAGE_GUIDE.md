# Design Token Usage Guide — Gajian Aman Frontend

## Overview

This guide documents the design token system implemented across the Gajian Aman React frontend. Design tokens are centralized color and styling values managed through CSS variables and utility functions, ensuring consistency and reducing code duplication.

**Token System Architecture:**
- CSS Variables defined in: `src/styles/theme.css`
- Utility functions in: `src/lib/utils.ts`
- Tailwind arbitrary value syntax for class generation

---

## Design Token Utilities

### Core Utility Functions

All utilities generate Tailwind arbitrary value classes:

#### `bgColorVar(key: string): string`
Generates a background color class using CSS variables.

```ts
import { bgColorVar } from '@/lib/utils';

// Generates: 'bg-[var(--color-bg-card)]'
const className = bgColorVar('bg-card');
```

#### `textColorVar(key: string): string`
Generates a text color class using CSS variables.

```ts
import { textColorVar } from '@/lib/utils';

// Generates: 'text-[var(--color-content-primary)]'
const className = textColorVar('content-primary');
```

#### `borderColorVar(key: string): string`
Generates a border color class using CSS variables.

```ts
import { borderColorVar } from '@/lib/utils';

// Generates: 'border-[var(--color-border-neutral)]'
const className = borderColorVar('border-neutral');
```

#### `colorVar(key: string): string`
Returns the raw CSS variable string for use in custom styles.

```ts
import { colorVar } from '@/lib/utils';

// Generates: 'var(--color-brand-primary)'
const cssVar = colorVar('brand-primary');
```

#### `cn(...classes: string[]): string`
Merges and de-duplicates Tailwind classes, handling design token utilities.

```ts
import { cn } from '@/lib/utils';

const className = cn(
  'base-class',
  bgColorVar('bg-card'),
  textColorVar('content-primary')
);
```

---

## Background Color Tokens

### Surface Colors

| Token | CSS Variable | Use Case | Example |
|-------|---|---|---|
| `bg-card` | `--color-bg-card` | Card backgrounds, modal content | `Card` component wrapper |
| `bg-screen` | `--color-bg-screen` | Page background | Layout wrapper |
| `bg-neutral` | `--color-bg-neutral` | Light neutral background | Skeleton loaders, disabled states |

### Sentiment Background Colors

| Token | CSS Variable | Sentiment | Use Case |
|---|---|---|---|
| `sentiment-positive-bg` | `--color-sentiment-positive-bg` | ✅ Success | Achieved budgets, positive trends |
| `sentiment-warning-bg` | `--color-sentiment-warning-bg` | ⚠️ Warning | Near budget limit, attention needed |
| `sentiment-negative-bg` | `--color-sentiment-negative-bg` | ❌ Error | Over budget, urgent alerts |

### Brand Colors

| Token | CSS Variable | Use Case |
|---|---|---|
| `brand-primary` | `--color-brand-primary` | Primary CTAs, selected states, highlights |
| `sidebar-bg` | `--color-sidebar-bg` | Sidebar background (dark) |

### Usage Examples

```tsx
// Safe budget card background
className={cn(bgColorVar('sentiment-positive-bg'))}

// Warning budget card background
className={cn(bgColorVar('sentiment-warning-bg'))}

// Over-budget card background
className={cn(bgColorVar('sentiment-negative-bg'))}

// Standard card container
className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}
```

---

## Text Color Tokens

### Content Hierarchy

| Token | CSS Variable | Purpose | Use Case |
|---|---|---|---|
| `content-primary` | `--color-content-primary` | Primary text | Headings, labels, main content |
| `content-secondary` | `--color-content-secondary` | Secondary text | Subheadings, descriptions |
| `content-tertiary` | `--color-content-tertiary` | Tertiary text | Helper text, hints, meta information |

### Sentiment Text Colors

| Token | CSS Variable | Sentiment | Use Case |
|---|---|---|---|
| `sentiment-positive` | `--color-sentiment-positive` | ✅ Success | Positive amounts, achieved goals, good status |
| `sentiment-warning` | `--color-sentiment-warning` | ⚠️ Warning | Warning text, near limits |
| `sentiment-negative` | `--color-sentiment-negative` | ❌ Error | Negative amounts, overages, errors |

### Brand Text Colors

| Token | CSS Variable | Use Case |
|---|---|---|
| `brand-primary` | `--color-brand-primary` | Primary brand text, links |
| `brand-primary-fg` | `--color-brand-primary-fg` | Text on primary brand background |

### Usage Examples

```tsx
// Primary heading text
className={cn('text-2xl font-bold', textColorVar('content-primary'))}

// Secondary description text
className={cn('text-sm', textColorVar('content-secondary'))}

// Tertiary helper text
className={cn('text-xs', textColorVar('content-tertiary'))}

// Positive amount (income, savings)
className={cn('font-bold', textColorVar('sentiment-positive'))}

// Negative amount (expenses)
className={cn('font-bold', textColorVar('sentiment-negative'))}
```

---

## Border Color Tokens

| Token | CSS Variable | Use Case |
|---|---|---|
| `border-neutral` | `--color-border-neutral` | Standard borders, dividers |
| `border-negative` | `--color-border-negative` | Error state borders |

### Usage Examples

```tsx
// Card with standard border
className={cn('border', borderColorVar('border-neutral'))}

// Error input border
className={cn('border-2', borderColorVar('border-negative'))}

// Divider line
className={cn('border-t', borderColorVar('border-neutral'))}
```

---

## Common Design Patterns

### Card Layout

```tsx
import { Card, CardContent } from './ui/card';
import { cn, bgColorVar, borderColorVar, textColorVar } from '@/lib/utils';

<Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
  <CardContent>
    <p className={textColorVar('content-primary')}>Card content</p>
  </CardContent>
</Card>
```

### Status Badge

```tsx
import { cn, bgColorVar, textColorVar } from '@/lib/utils';

// Safe status
<span className={cn(
  'px-3 py-1 rounded-full text-sm font-medium',
  bgColorVar('sentiment-positive-bg'),
  textColorVar('sentiment-positive')
)}>
  Aman
</span>

// Warning status
<span className={cn(
  'px-3 py-1 rounded-full text-sm font-medium',
  bgColorVar('sentiment-warning-bg'),
  textColorVar('sentiment-warning')
)}>
  Hampir
</span>

// Over-budget status
<span className={cn(
  'px-3 py-1 rounded-full text-sm font-medium',
  bgColorVar('sentiment-negative-bg'),
  textColorVar('sentiment-negative')
)}>
  Melebihi
</span>
```

### Text Hierarchy

```tsx
import { textColorVar, cn } from '@/lib/utils';

// Heading
<h1 className={cn('text-3xl font-bold', textColorVar('content-primary'))}>
  Monthly Budget
</h1>

// Subheading
<h2 className={cn('text-lg font-semibold', textColorVar('content-secondary'))}>
  Category Breakdown
</h2>

// Description text
<p className={cn('text-sm', textColorVar('content-tertiary'))}>
  Budget tracking for May 2026
</p>
```

### Responsive Layout

```tsx
import { cn, bgColorVar, textColorVar } from '@/lib/utils';

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card className={cn(bgColorVar('bg-card'))}>
    <p className={textColorVar('content-primary')}>Mobile: 1 column</p>
  </Card>
  <Card className={cn(bgColorVar('bg-card'))}>
    <p className={textColorVar('content-primary')}>Tablet: 2-3 columns</p>
  </Card>
  <Card className={cn(bgColorVar('bg-card'))}>
    <p className={textColorVar('content-primary')}>Desktop: 3 columns</p>
  </Card>
</div>
```

### Transaction Amount Display

```tsx
import { TextPositive, TextNegative } from '@/components/Markup';
import { textColorVar } from '@/lib/utils';

// Income (positive)
<div className={textColorVar('sentiment-positive')}>
  <TextPositive>+Rp{amount}</TextPositive>
</div>

// Expense (negative)
<div className={textColorVar('sentiment-negative')}>
  <TextNegative>-Rp{amount}</TextNegative>
</div>
```

---

## Token Application Guidelines

### When to Use Each Token

#### Use `content-primary` for:
- Main page headings (h1, h2)
- Card titles and labels
- Primary body text
- Important information that needs emphasis

#### Use `content-secondary` for:
- Subheadings (h3, h4)
- Section descriptions
- Secondary information
- Less critical text

#### Use `content-tertiary` for:
- Helper text and hints
- Metadata (dates, counts)
- Disabled state text
- Additional context

#### Use `sentiment-positive` for:
- Income amounts
- Achieved budgets/goals
- Success messages
- Positive trend indicators
- "Safe" status badges

#### Use `sentiment-negative` for:
- Expense amounts
- Over-budget warnings
- Error messages
- Negative trend indicators
- "Over budget" status badges

#### Use `sentiment-warning` for:
- Caution messages
- Near-limit warnings
- "Hampir" (almost) status badges
- Attention-needed items

#### Use `brand-primary` for:
- Primary call-to-action buttons
- Active navigation states
- Selected filters
- Brand highlights

---

## Migration Checklist

When refactoring components to use design tokens:

- [ ] Replace inline `style={{ color: 'var(--color-*)' }}` with utility functions
- [ ] Replace hardcoded color class names (e.g., `text-red-500`) with token utilities
- [ ] Ensure all `<Card>` components use `bgColorVar('bg-card')`
- [ ] Verify borders use `borderColorVar('border-neutral')`
- [ ] Update sentiment colors (positive/negative/warning) to use tokens
- [ ] Apply text hierarchy with `content-primary/secondary/tertiary`
- [ ] Use `cn()` to merge design token classes with other Tailwind classes
- [ ] Test responsive behavior across breakpoints
- [ ] Verify animations work with token colors
- [ ] Run TypeScript check to catch any color key mismatches

---

## Available Color Keys Reference

### All Supported Color Keys

```ts
// Background colors
'bg-card'
'bg-screen'
'bg-neutral'

// Text colors
'content-primary'
'content-secondary'
'content-tertiary'

// Sentiment colors (backgrounds)
'sentiment-positive-bg'
'sentiment-warning-bg'
'sentiment-negative-bg'

// Sentiment colors (text)
'sentiment-positive'
'sentiment-warning'
'sentiment-negative'

// Brand colors
'brand-primary'
'brand-primary-fg'
'sidebar-bg'

// Border colors
'border-neutral'
'border-negative'
```

---

## Performance Impact

By using centralized design tokens:
- **Reduced bundle size:** ~270 lines of duplication removed
- **Maintenance:** Single point of change for color updates
- **Consistency:** 130+ instances using centralized values
- **Accessibility:** Easy to implement dark mode in future
- **Type safety:** All token keys defined in TypeScript

---

## Future Enhancements

Potential improvements to the design token system:

1. **Dark mode support:** Add dark mode tokens alongside current light mode
2. **Theme switching:** Implement runtime theme switching capability
3. **CSS-in-JS:** Consider CSS-in-JS library for more sophisticated theming
4. **Animation tokens:** Centralize animation durations and easing functions
5. **Spacing tokens:** Add standardized spacing scale (4px, 8px, 12px, etc.)
6. **Typography tokens:** Centralize font sizes, weights, line heights

---

## Support & Questions

For questions about design tokens or implementation:
1. Check the `theme.css` file for all available CSS variables
2. Review `utils.ts` for utility function definitions
3. Look at refactored pages (Overview, Budget, Goals) for usage examples
4. Refer to the extracted components (BudgetCard, WalletChips) for patterns
