# Phase 1 Execution Plan — Stabilization & Critical Fixes

**Status:** ✅ COMPLETE  
**Priority:** Critical (stop runtime crashes)  
**Date Completed:** 2026-05-23  
**Commit:** `9613280`  
**Architect:** AETHER v5 Principal Architect  
**Executor Model:** claude-haiku-4-5-20251001  

---

## 1. Phase Goal

Stop all runtime crashes and white-screen errors before any UI work begins. This phase is purely
surgical — no styling, no feature additions. Fix crashes, remove broken references, tighten imports.

**Success Criteria:**
- ✅ No white-screen crash on any route
- ✅ `/split/:token` route removed (referenced undefined component)
- ✅ All protected routes wrapped in ErrorBoundary
- ✅ Laporan.tsx has loading guards
- ✅ Riwayat.tsx has no duplicate imports
- ✅ RecurringBillForm step fixed to `step="1"`
- ✅ Build passes with zero errors

---

## 2. Batch Breakdown

### Batch 1 (only batch — single session)
**Anti-Bloat Limit:** 5 files max  
**Status:** ✅ COMPLETE

**Task List:**
1. **App.tsx** — Delete undefined `/split/:token` route. Wrap all protected routes with `<ErrorBoundary>`.
2. **Laporan.tsx** — Wrap component in `<ErrorBoundary>`. Add loading/null guards to prevent white-blank.
3. **Riwayat.tsx** — Remove duplicate `DropdownMenu` import block (lines 13–17 removed, kept 34–38).
4. **RecurringBillForm.tsx** — Change `step="100"` to `step="1"` on amount input for Rupiah granularity.
5. **ask-assistant.js + chatStore.ts** — Verified existing error handling is sufficient (no changes needed).

**Files Modified (actual):** 4 (App.tsx, Laporan.tsx, Riwayat.tsx, RecurringBillForm.tsx)

---

## 3. Touch List

### ✅ CAN MODIFY
- `frontend/src/app/App.tsx` — route cleanup and ErrorBoundary wrapping
- `frontend/src/app/pages/Laporan.tsx` — loading guards only
- `frontend/src/app/pages/Riwayat.tsx` — duplicate import removal only
- `frontend/src/app/components/RecurringBillForm.tsx` — step attribute fix only
- `frontend/api/ask-assistant.js` — read-only verification
- `frontend/src/stores/chatStore.ts` — read-only verification

### ❌ CANNOT MODIFY
- Any page UI/styling
- Database schema
- Bot code
- theme.css

---

## 4. Dependencies & Prerequisites

- None. This is the first phase.

---

## 5. Rollback Procedures

**If ErrorBoundary breaks routing:**
- Remove ErrorBoundary wrapper from App.tsx
- Revert to original route structure

**If Laporan loading guard causes blank page:**
- Revert Laporan.tsx completely
- Verify data shape from Supabase

---

## 6. Quality Gates

- ✅ `npm run build` must pass (zero errors)
- ✅ No TypeScript errors in modified files
- ✅ No new console errors on any page
- ✅ Only crash-fix changes — no UI/styling

---

## 7. Known Issues / Carryovers

- **None.** Phase 1 complete with no outstanding issues.

---

## 8. Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Build errors | 0 | 0 |
| Routes removed | 1 | 1 |
| ErrorBoundaries added | 2 | 2 |
| Files modified | ≤ 5 | 4 |
| Build time | < 50s | 43.18s |

---

## Approval Gate

✅ **PHASE 1 COMPLETE — No further action required.**

Commit `9613280` — `fix(aether-phase01): stabilize app crashes and fix broken routes`
