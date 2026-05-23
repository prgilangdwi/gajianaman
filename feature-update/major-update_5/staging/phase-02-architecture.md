# Phase 2 Execution Plan — Global Architecture, Accessibility & Navigation

**Status:** ✅ COMPLETE  
**Priority:** Critical (design system, dark mode, WCAG AAA)  
**Date Completed:** 2026-05-23  
**Commits:** `01919d4`, `65d970a`, `fa466d5`, `62a6382`  
**Architect:** AETHER v5 Principal Architect  
**Executor Model:** claude-haiku-4-5-20251001  

---

## 1. Phase Goal

System-wide architecture upgrades: enforce the Figma Master color system, implement Dark Mode,
achieve WCAG AAA accessibility compliance, create the Settings page, and separate Pemasukan
(income) into its own page with a global Dompet (wallet) filter.

**Success Criteria:**
- ✅ Figma Master color tokens applied to theme.css
- ✅ Dark Mode CSS variables + toggle working globally
- ✅ WCAG AAA contrast ratios enforced across all components
- ✅ Settings page created (dark mode toggle + language toggle ID/EN)
- ✅ Pemasukan separated into `/spend/income` page
- ✅ Global Dompet (wallet) filter with localStorage persistence
- ✅ Build passes with zero errors across all 4 batches

---

## 2. Batch Breakdown

### Batch 1 — Design Tokens & Dark Mode
**Anti-Bloat Limit:** 2 files  
**Status:** ✅ COMPLETE — commit `01919d4`

**Task List:**
1. **theme.css** — Complete color wipe to match Figma Master. Add all dark mode CSS variables
   (`.dark` class selector). Define semantic tokens: bg-primary, bg-sidebar, content-primary,
   content-secondary, border-neutral, brand-primary, etc.
2. **Layout.tsx** — Ensure dark/light mode class toggle applies correctly at root level.

**Files Modified:** theme.css, Layout.tsx (+ related layout components)

---

### Batch 2 — WCAG AAA Accessibility Audit
**Anti-Bloat Limit:** 5 files  
**Status:** ✅ COMPLETE — commit `65d970a`

**Task List:**
1. Audit all color token usages against WCAG AAA contrast ratios (≥ 7:1 for normal text)
2. Fix any failing color combinations in components
3. Add keyboard navigation: focus-visible styles, tab order, focus traps in modals
4. Add ARIA attributes: `aria-label`, `aria-expanded`, `role` where missing
5. Add `prefers-reduced-motion` guard to all animation components

**Files Modified:** Multiple components (contrast fixes, ARIA additions)

---

### Batch 3 — Settings Page
**Anti-Bloat Limit:** 2 files  
**Status:** ✅ COMPLETE — commit `fa466d5`

**Task List:**
1. **Settings.tsx (NEW)** — Create Settings page at `/settings`:
   - Dark Mode toggle (persisted via `useDarkMode` hook)
   - Language toggle (ID/EN) — affects UI labels and AI assistant language
   - Profile section (display user info)
2. **App.tsx** — Add `/settings` route

**Files Modified:** Settings.tsx (NEW), App.tsx

---

### Batch 4 — Pemasukan Separation & Dompet Filter
**Anti-Bloat Limit:** 5 files  
**Status:** ✅ COMPLETE — commit `62a6382`

**Task List:**
1. **Pemasukan.tsx (NEW)** — Income page at `/spend/income`, mirrors Pengeluaran.tsx structure
   but filtered for `type === 'income'`. Shows income by category, KPI cards, horizontal bar chart.
2. **useDompetFilter.ts (NEW)** — localStorage-persisted wallet filter hook.
   API: `{ selectedDompet, setDompet, clearDompet, mounted }`. Key: `gajian_aman_dompet`.
3. **App.tsx** — Add lazy import + `/spend/income` route.
4. **navigationConfig.ts** — Add Pemasukan as child of Spend section with TrendingUp icon.
5. **HeaderBar.tsx** — Add Dompet selector dropdown in desktop header (before month filter).

**Files Modified:** 5 files (Pemasukan NEW, useDompetFilter NEW, App.tsx, navigationConfig.ts, HeaderBar.tsx)

---

## 3. Touch List

### ✅ CAN MODIFY
- `frontend/src/styles/theme.css`
- `frontend/src/app/components/Layout.tsx` + layout subcomponents
- `frontend/src/app/pages/Settings.tsx` (NEW)
- `frontend/src/app/pages/Pemasukan.tsx` (NEW)
- `frontend/src/hooks/useDompetFilter.ts` (NEW)
- `frontend/src/app/App.tsx` (routes only)
- `frontend/src/lib/navigationConfig.ts`
- `frontend/src/app/components/layout/HeaderBar.tsx`

### ❌ CANNOT MODIFY
- Any Phase 1 files (only emergency fixes allowed)
- Database schema
- Bot code
- Supabase types (supabase.ts)

---

## 4. Data Models

### useDompetFilter Hook API
```typescript
export function useDompetFilter() {
  return {
    selectedDompet: string | null,       // Currently selected wallet ID (null = all)
    setDompet: (walletId: string | null) => void,
    mounted: boolean,                     // SSR-safe initialization flag
    clearDompet: () => void,
  };
}
```

---

## 5. Dependencies & Prerequisites

- Phase 1 complete (crash-free app)
- Figma Master color reference available
- shadcn/ui components available (Button, Select, Switch)
- `useWallets` hook available for Dompet selector

---

## 6. Quality Gates

- ✅ `npm run build` must pass after each batch (zero errors)
- ✅ WCAG AAA contrast ≥ 7:1 for normal text, ≥ 4.5:1 for large text
- ✅ Dark mode renders correctly on all pages
- ✅ Pemasukan page mirrors Pengeluaran structure

---

## 7. Known Issues / Carryovers

- **None.** Phase 2 complete with no outstanding issues.
- Note: Dompet filter in mobile HeaderBar (BottomNav area) deferred to future phase if needed.

---

## 8. Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Build errors | 0 | 0 |
| Batches completed | 4 | 4 |
| WCAG AAA compliance | All pages | All pages |
| Dark mode toggle | Working | Working |
| Settings page | Created | Created |
| Pemasukan page | Created | Created |

---

## Approval Gate

✅ **PHASE 2 COMPLETE — No further action required.**

Commits: `01919d4`, `65d970a`, `fa466d5`, `62a6382`
