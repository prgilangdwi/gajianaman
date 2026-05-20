# Week 2 Day 1: Design Token Audit & Refactoring Plan

**Date:** 2026-05-20  
**Status:** Batch 1 Complete (3/39 pages) | Continuing with Tier 1  
**Objective:** Refactor all 39 pages to use typed design tokens from `lib/design-tokens.ts` instead of hardcoded CSS custom property strings

### Progress
- ✅ **lib/utils.ts** — Design token utility functions created (bgColorVar, textColorVar, borderColorVar)
- ✅ **Overview.tsx** — Fully refactored, using utility functions throughout
- ✅ **Budget.tsx** — Refactored (StatusBadge + card patterns)
- ✅ **Goals.tsx** — Refactored (card patterns)
- ⏳ **4 more Tier 1 pages** — Pengeluaran, Pemasukan, Riwayat, Tren (queued for today)
- ⏳ **Tier 2+3 pages** — Analytics + management pages (queued for May 21-23)
- ⏳ **Tier 4 pages** — Public/landing pages (queued for May 24+)

---

## Current State Assessment

### What Exists ✅
- **lib/design-tokens.ts** — Complete TypeScript export of all design values
  - Colors (brand, sidebar, content, interactive, bg, border, sentiment, category)
  - Spacing, radius, shadows, typography, z-index, durations, easing
  - Utility functions: getCategoryColor(), createTransition(), etc.

- **theme.css** — CSS variables defining actual color values
  - 60+ color variables (--color-brand-primary, --color-sentiment-positive-bg, etc.)
  - Currently disconnected from TypeScript type system

- **Pages (39 total)** — Using CSS custom property strings
  - Pattern: `className="... bg-[var(--color-brand-primary)] ..."`
  - Problem: No type safety, string literals, hard to refactor

### Analysis Results
- **Total pages:** 39 (Overview, Budget, Goals, Pengeluaran, Pemasukan, etc.)
- **CSS custom property pattern:** Widely used across all pages
- **Hardcoded values:** Minimal (mostly using CSS variables, which is good)
- **Import status:** Pages NOT importing design-tokens.ts
- **Type safety:** None (using string literals for design token references)

---

## Refactoring Strategy

### Phase 1: Create Wrapper Utilities (TODAY)
Create helper functions in `lib/utils.ts` to bridge Tailwind + design tokens:

```typescript
// lib/utils.ts additions
export function colorVar(colorPath: string): string {
  return `var(--color-${colorPath})`;
}

export function spacingClass(value: string): string {
  const spacingMap: Record<string, string> = {
    'xs': '4px', 'sm': '8px', 'md': '12px', 'lg': '16px', ...
  };
  return spacingMap[value] || value;
}

export function styleWithTokens(config: {
  bg?: keyof typeof colors[keyof typeof colors];
  text?: keyof typeof colors[keyof typeof colors];
  border?: keyof typeof colors[keyof typeof colors];
}): string {
  // Generates className string using design token values
}
```

### Phase 2: Prioritize Pages for Refactoring

**Tier 1 (Core Financial Pages - 7 pages) — Week 2:**
1. Overview.tsx
2. Budget.tsx
3. Goals.tsx
4. Pengeluaran.tsx
5. Pemasukan.tsx
6. Riwayat.tsx
7. Tren.tsx

**Tier 2 (Analytics Pages - 5 pages) — Week 3:**
8. Analisis.tsx
9. Kategori.tsx
10. Laporan.tsx
11. Perbandingan.tsx
12. Forecasting.tsx

**Tier 3 (Management Pages - 7 pages) — Week 3:**
13. Asisten.tsx
14. Wallet.tsx
15. SplitBill.tsx
16. Kategorisasi.tsx
17. Pengaturan.tsx
18. Keamanan.tsx
19. Langganan.tsx

**Tier 4 (Public/Landing Pages - 20 pages) — Week 4+:**
- Landing, Blog, Fitur, FAQ, CaraKerja, etc.

---

## Refactoring Approach for Each Page

### Minimal Changes (Best Practice)
1. Add import at top: `import { colors, spacing, getCategoryColor } from '@/lib/design-tokens';`
2. Replace hardcoded `var(--color-*)` strings with design token imports
3. Keep existing Tailwind structure — only replace color values
4. Verify component behavior after refactoring
5. Run `npm run build` to confirm no regressions

### Example Refactoring
```typescript
// BEFORE
<div className={cn(
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
  config.bg,
  config.text
)}>

// AFTER
<div className={cn(
  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
  `bg-[${colors.sentiment.positiveBg}]`,
  `text-[${colors.sentiment.positive}]`
)}>
```

---

## Color Usage Mapping

### Most Used Colors in Pages
| Color | Usage Count | Pages | Replacement |
|---|---|---|---|
| `--color-bg-neutral` | ~50 | All pages | `colors.bg.neutral` |
| `--color-brand-primary` | ~40 | Budget, Goals, Overview | `colors.brand.primary` |
| `--color-sentiment-*` | ~60 | All pages with status | `colors.sentiment.*` |
| `--color-content-secondary` | ~30 | All pages | `colors.content.secondary` |
| `--color-border-neutral` | ~25 | Card borders | `colors.border.neutral` |

---

## Implementation Checklist

### Today (Day 1)
- [x] Create design-tokens.ts with all exports
- [ ] Create utility wrapper functions in lib/utils.ts
- [ ] Refactor Overview.tsx (most complex page)
- [ ] Refactor Budget.tsx
- [ ] Refactor Goals.tsx
- [ ] Test all 3 pages with `npm run dev`
- [ ] Run `npm run build` to verify no regressions
- [ ] Commit: "refactor: apply design tokens to core financial pages (part 1)"

### Tomorrow (Day 2-3)
- [ ] Refactor remaining Tier 1 pages (Pengeluaran, Pemasukan, Riwayat, Tren)
- [ ] Review for consistency
- [ ] Test in browser: all charts, modals, responsive layouts
- [ ] Commit: "refactor: apply design tokens to all Tier 1 pages"

### Day 4-6
- [ ] Refactor Tier 2 & 3 pages
- [ ] Create compound components (TransactionRow, BudgetCard, GoalCard)
- [ ] Full QA on all 39 pages
- [ ] Commit: "refactor: complete design token application to all pages"

---

## Success Criteria

✅ All 39 pages import from `lib/design-tokens.ts`  
✅ Zero hardcoded CSS custom property strings (all use TypeScript imports)  
✅ No visual regressions (diff pages side-by-side before/after)  
✅ Build completes without errors  
✅ `npm run typecheck` passes  
✅ Lighthouse score maintained (no performance regressions)  
✅ Pages render correctly on mobile (375px) and desktop (1920px)  

---

## Files to Modify

**Create:**
- None (lib/design-tokens.ts already exists)

**Modify:**
- lib/utils.ts (add wrapper functions)
- All 39 page files (incremental, batch by tier)

**Verify:**
- theme.css (no changes, serves as reference)
- tsconfig.json (@ alias should work)

---

## Risk Mitigation

**Risk:** Breaking visual layout during refactoring  
**Mitigation:** Test each page in browser immediately after refactoring; compare pixel-perfect with screenshot before changes

**Risk:** Missing color references  
**Mitigation:** Use grep to find all `var(--color-` patterns; create mapping document

**Risk:** Type errors with new imports  
**Mitigation:** Run `npm run typecheck` after each batch; export all needed types from design-tokens.ts

---

## Timeline

| Day | Task | Hours | Deliverable |
|---|---|---|---|
| **Today (May 20)** | Design token refactoring starter | 4-5 | 3 core pages refactored |
| **May 21** | Finish Tier 1 refactoring | 4-5 | All 7 core pages, full test |
| **May 22-23** | Tier 2+3 refactoring | 8-10 | 12+ pages, batch testing |
| **May 24-25** | Landing/public pages | 4-5 | All 39 pages refactored |
| **May 26** | Final QA & polish | 4-5 | Build verified, all pages tested |

**Total: ~40-50 hours** (matches Week 2 estimate)

---

## Next Steps

1. ✅ Design-tokens.ts created
2. → Create wrapper utilities in lib/utils.ts
3. → Refactor Overview.tsx
4. → Refactor Budget.tsx  
5. → Refactor Goals.tsx
6. → Test and commit
7. → Move to remaining Tier 1 pages

