# Phase 6 Execution Plan — React Doctor Codebase Health Remediation

**Status:** 🔲 NOT STARTED
**Priority:** High (code quality debt before any new feature phases)
**Date Created:** 2026-05-24
**Architect:** AETHER v5 Principal Architect
**Executor Model:** claude-sonnet-4-6
**Audit Tool:** react-doctor v0.2.3

---

## 1. Phase Goal

Raise the React Doctor health score from **52/100** to **≥80/100** by:
1. Fixing all 5 real React bug rules (19 error instances)
2. Deleting the 204 dead/unused files that dominate the score penalty
3. Sweeping the highest-impact, lowest-effort warning categories

**Audit baseline (2026-05-24):**
- Score: 52 / 100 — "Needs work"
- Source files scanned: 220
- Errors: 19 instances across 5 rules
- Warnings: 910 instances across 61 rules
- Affected files: 205

**Success Criteria:**
- ✅ React Doctor score ≥ 80
- ✅ Zero `rules-of-hooks` violations
- ✅ Zero `effect-needs-cleanup` violations
- ✅ Unused file count reduced by ≥ 150
- ✅ `npm run build` passes with zero errors after every batch
- ✅ No functional regressions

---

## 2. Batch Breakdown

---

### Batch 1 — Real Bug Fixes
**Anti-Bloat Limit:** 3 files
**Status:** 🔲 NOT STARTED

These are the only findings that represent actual runtime bugs or memory leaks.
Fix these first — they are the highest-risk items regardless of score impact.

---

#### Fix 1: `BudgetConfirmation.tsx` — rules-of-hooks (3 violations, lines 56–58)

**Problem:** Three `useState` calls appear after an early-return guard clause:
```tsx
if (!recommendation) return <Navigate to="/gajian" replace />;

const [editedItems, setEditedItems] = useState(...);  // line 56 — AFTER return
const [isEditMode, setIsEditMode] = useState(false);  // line 57 — AFTER return
const [isSaving, setIsSaving] = useState(false);       // line 58 — AFTER return
```
React requires hooks to be called unconditionally on every render. Calling them
after a conditional return violates the Rules of Hooks and will cause a crash
in React's development strict mode.

**Fix:** Move all three `useState` declarations ABOVE the guard clause.
```tsx
// Correct order:
const [editedItems, setEditedItems] = useState(...);
const [isEditMode, setIsEditMode] = useState(false);
const [isSaving, setIsSaving] = useState(false);

// Guard AFTER all hooks:
if (!recommendation) return <Navigate to="/gajian" replace />;
```

The `useState` initial values that reference `recommendation` (e.g.,
`useState(recommendation.budgetItems)`) need to handle the undefined case.
Use nullish coalescing: `useState(recommendation?.budgetItems ?? [])`.

---

#### Fix 2: `AuthCallback.tsx` — effect-needs-cleanup (line 12)

**Problem:** A `setTimeout` is set inside `useEffect` without returning a
cleanup function. If the component unmounts before the timeout fires, the
callback runs against a stale/unmounted component.

```tsx
useEffect(() => {
  const id = setTimeout(() => { ... }, 2000);
  // missing: return () => clearTimeout(id);
}, []);
```

**Fix:**
```tsx
useEffect(() => {
  const id = setTimeout(() => { ... }, 2000);
  return () => clearTimeout(id);
}, []);
```

---

#### Fix 3: `Laporan.tsx` — no-nested-component-definition (line 195)

**Problem:** `CustomTooltip` is defined as a component function inside
`LaporanContent`. React creates a new function reference on every render,
causing React to remount the tooltip from scratch each time — destroying
internal state and causing flicker.

**Fix:** Move `CustomTooltip` to module scope above `LaporanContent`:
```tsx
// At module level — BEFORE LaporanContent:
function CustomTooltip({ active, payload, label }: TooltipProps) {
  // ... tooltip JSX
}

// Then LaporanContent uses it normally:
export default function LaporanContent() { ... }
```

**Success Criteria — Batch 1:**
- ✅ `npm run build` passes (zero errors)
- ✅ React Doctor `rules-of-hooks` count = 0
- ✅ React Doctor `effect-needs-cleanup` count = 0
- ✅ React Doctor `no-nested-component-definition` count = 0
- ✅ BudgetConfirmation.tsx still navigates to /gajian when no recommendation
- ✅ AuthCallback.tsx still redirects correctly after authentication

---

### Batch 2 — Dead Code Deletion
**Anti-Bloat Limit:** Delete in groups. Build must pass after each group.
**Status:** 🔲 NOT STARTED

**Impact:** The 204 unused files are the single biggest drag on the score.
Removing them is estimated to push the score from ~55 to ~75 on its own.

---

#### Pre-deletion checklist (Executor must do before deleting anything):

1. Run `npx react-doctor --full --json` and save the unused-file list
2. For each file, verify it is NOT imported anywhere:
   ```bash
   # Example check for a single file:
   grep -r "ComponentName" frontend/src --include="*.tsx" --include="*.ts" -l
   ```
3. Delete in logical groups (not one by one):

---

#### Group A — Storybook stories (safe to delete, never wired to app)
```
src/stories/Button.tsx
src/stories/Header.tsx
src/stories/Page.tsx
src/test/setup.ts          # if only used by stories
```

#### Group B — Superseded design system base components
These are custom primitive wrappers (`Base` suffix) that were scaffolded but
the app uses shadcn/ui directly instead:
```
src/components/ui/BadgeBase.tsx
src/components/ui/ButtonBase.tsx
src/components/ui/CardBase.tsx
src/components/ui/ChipBase.tsx
src/components/ui/ComparisonRow.tsx
src/components/ui/InputBase.tsx
src/components/ui/MetricCard.tsx
src/components/ui/ProgressBar.tsx
src/components/ui/TrendBadge.tsx
```
**Verify each with grep before deleting.**

#### Group C — Superseded/unwired hooks
These data hooks were scaffolded in earlier phases but replaced by newer
implementations or never wired to any page:
```
src/hooks/data/useAIInsights.ts
src/hooks/data/useBudgetRecommendations.ts
src/hooks/data/useCategoryIntelligence.ts
src/hooks/data/useDashboardData.ts
src/hooks/data/useFinancialHealth.ts
src/hooks/data/useFinancialHealthScore.ts
src/hooks/data/useGoalProgress.ts
src/hooks/data/useInsights.ts
src/hooks/data/useSpendingPatterns.ts
src/hooks/data/useWalletStats.ts
```
**Verify each with grep before deleting.**

#### Group D — Unwired mobile/feature components
```
src/components/mobile/BottomSheet.tsx
src/components/mobile/PullToRefresh.tsx
src/components/mobile/SwipeAction.tsx
src/components/features/transactions/ExpandableTransactionRow.tsx
src/components/features/transactions/QuickAddSheet.tsx
src/components/features/transactions/TransactionList.tsx
src/components/features/wallets/WalletCard.tsx
```
**Verify each with grep before deleting.**

#### Group E — Remaining unused files flagged by react-doctor
The Executor must run react-doctor after Groups A–D and delete whatever
remains in the `unused-file` list, verifying each with grep.

---

**Deletion protocol:**
1. Delete one group
2. Run `npm run build` — must pass before next group
3. If build fails, restore the deleted file that caused it and skip it
4. Repeat until all groups done

**Success Criteria — Batch 2:**
- ✅ `npm run build` passes after all deletions
- ✅ React Doctor `unused-file` count reduced by ≥ 150
- ✅ No functional pages broken (test navigate to each page)
- ✅ React Doctor score ≥ 72 (estimated after dead code removal)

---

### Batch 3 — High-Impact Warning Sweep
**Anti-Bloat Limit:** 5 files
**Status:** 🔲 NOT STARTED

Fix the highest-count, lowest-effort warning categories.
Stop when score ≥ 80 or 5-file limit reached.

---

#### Fix 1: `no-mutable-in-deps` — useNavigation.tsx:71

Move `location.pathname` read from deps array to inside the effect body:
```tsx
// Before:
useEffect(() => {
  // uses location.pathname
}, [location.pathname]);  // ← mutable global in deps

// After:
useEffect(() => {
  const path = location.pathname;  // read inside
  // uses path
}, []);  // or use useLocation() from react-router instead
```
Preferred fix: use `useLocation()` from react-router, which IS reactive:
```tsx
const location = useLocation();
useEffect(() => {
  // location.pathname is now properly reactive
}, [location.pathname]);
```

#### Fix 2: `exhaustive-deps` — fix missing deps (5 instances)

Run React Doctor to identify the 5 files. For each:
- If the missing dep is a stable reference (ref, dispatch, setter), add it —
  React guarantees these are stable so it won't cause extra re-runs
- If the missing dep is a value that changes, add it or wrap in useCallback/useMemo

#### Fix 3: `button-has-type` — sweep highest-traffic files

Rather than touching all 32 files, focus on the most-used UI files first.
Add `type="button"` to `<button>` elements in:
- `Layout.tsx`
- `TransactionModal.tsx`
- `Overview.tsx`
- Any other file with ≥ 3 violations

#### Fix 4: `design-no-bold-heading` — font-bold → font-semibold

Focus on AETHER Phase 4 files we own (not shadcn/ui):
- `Gajian.tsx`
- `BudgetConfirmation.tsx`
- `GajianWizard.tsx`
Do NOT touch `Landing.tsx` or `KebijakanPrivasi.tsx` in this pass (legal/marketing pages — scope creep risk).

---

**After all fixes, re-run React Doctor:**
```bash
npx react-doctor --full --score
```
Target: ≥ 80. If score is 78–79, accept and document — do not chase the last 2 points.

**Success Criteria — Batch 3:**
- ✅ `npm run build` passes
- ✅ React Doctor score ≥ 80 (or documented reason if 78–79)
- ✅ `no-mutable-in-deps` = 0
- ✅ `exhaustive-deps` reduced significantly
- ✅ ≤ 5 files modified

---

## 3. Touch List

### ✅ CAN MODIFY
- `frontend/src/app/components/BudgetConfirmation.tsx`
- `frontend/src/app/pages/AuthCallback.tsx`
- `frontend/src/app/pages/Laporan.tsx`
- `frontend/src/hooks/useNavigation.tsx`
- Any file in `src/hooks/data/` or `src/components/` flagged as unused
- Any file with `button-has-type` or `design-no-bold-heading` violations

### ❌ CANNOT MODIFY
- `frontend/src/styles/theme.css` — locked (Phase 2)
- `frontend/src/lib/supabase.ts` — locked (architecture)
- `frontend/src/app/components/ui/` — shadcn/ui, do not edit
- Phase 4 core files: `Gajian.tsx`, `GajianWizard.tsx`, `useBudgetRecommendation.ts`
- Phase 5 core files: `Forecasting.tsx`, `Asisten.tsx`, `ask-assistant.js`

---

## 4. Pre-Deletion Safety Checks

Before deleting any file, verify it has zero imports:
```bash
# PowerShell:
Select-String -Path "frontend/src/**/*.tsx","frontend/src/**/*.ts" -Pattern "ComponentName" -Recurse

# Or use Grep tool in Claude Code
```

Files that are "unused" but may be needed:
- `src/lib/pdfExport.ts` — verify whether `Laporan.tsx` still imports it before deleting
- `src/stores/transactionEventStore.ts` — check if any hook subscribes to it
- `src/hooks/useSubscription.ts` — may be used by a realtime feature

When in doubt: keep it. The score penalty for one extra file is minimal;
the cost of a broken feature is high.

---

## 5. Quality Gates (All Batches)

- ✅ `npm run build` passes after EVERY batch (zero errors)
- ✅ TypeScript errors: zero introduced
- ✅ No functional regression on core pages: Overview, Riwayat, Budget, Gajian, Asisten
- ✅ WCAG AAA maintained (Phase 2 guarantee)
- ✅ Anti-bloat limit respected per batch

---

## 6. Rollback Procedures

### If batch 1 hook fix breaks BudgetConfirmation:
- The guard clause must come AFTER all hooks
- Initial values for hooks that reference `recommendation` must use `?? []` fallback
- Do not use `useMemo` here — plain `useState` with fallback initial value is correct

### If batch 2 deletion breaks the build:
- `git checkout HEAD -- path/to/deleted/file` to restore
- Mark that file as a false-positive unused-file, skip it
- Do not delete any file that causes a build error

### If batch 3 warning fixes introduce type errors:
- Revert only that specific change
- Document the file as a known warning that cannot be cleanly fixed

---

## 7. React Doctor Re-Run Commands

```bash
# Full scan with score only (fastest):
cd frontend && npx react-doctor --full --score

# Full verbose (shows all locations):
cd frontend && npx react-doctor --full --verbose

# JSON for programmatic processing:
cd frontend && npx react-doctor --full --json
```

---

## 8. Approval Gate

✋ **PHASE 6 AWAITING INITIATION**

Phase 5 must be 100% complete before Phase 6 begins.
Confirmed complete at commit `16856fe` (2026-05-24).
Architect approval required before Executor starts Batch 1.
