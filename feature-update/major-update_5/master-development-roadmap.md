# Project AETHER — Major Update v5 (The "Human Companion" Update)

---

## ✅ COMPLETION — 2026-05-24

**Status: CLOSED**

| Phase | Goal | Outcome |
|-------|------|---------|
| 01 Stabilization | Fix crashes, ErrorBoundary, imports, form step | ✅ Full |
| 02 Architecture & A11y | Color tokens, WCAG AAA, Dark Mode, Settings, Pemasukan, Dompet filter | ✅ Full |
| 03 UX Humanization | Edit/Delete in Riwayat, AI chart insights, calendar + category pages | ✅ Full (swipe gesture deferred) |
| 04 Gajian USP | Full wizard → AI budget → confirmation → DB persist | ✅ Full |
| 05 AI Insights & Audit | AI in Forecasting, multi-turn chat, CSP/manifest fixes | ✅ Full |
| 06 React Doctor | Bug fixes, dead code, warning sweep | ⚠️ 60/100 — structural ceiling (React.lazy ×184 false positives + react-doctor v0.2.4 silent upgrade; all fixable violations resolved) |

**Known limitation:** React Doctor score ceiling at 60/100 is a tool measurement issue, not a code quality regression. All actionable violations were fixed across 4 batches.

**Hand-off:** Major Update v6 ("The Power User Update") begins at `feature-update/major-update_6/`.

---

## 1. Context Sync & Current State
**Previous State:** Project AETHER v2.0.0 (Major Update 4) reached 65% completion. The `V2_POST_LAUNCH_GAP_ANALYSIS.md` audit revealed critical gaps: ErrorBoundaries unused, WCAG violations, missing Dark Mode, unintegrated Navigation components, and runtime crashes (SplitBillShare). 

**v5 Objective:** This roadmap merges the **6-Batch Remediation Plan** from the V2 Gap Analysis with the **20 New UX/Feature Concerns**. We will stabilize the foundation, enforce a strict Figma color wipe (including Dark Mode), integrate the Dompet ecosystem globally, build the Gajian USP wizard, and elevate the AI Assistant to act as a contextual companion.

---

## 2. The 6-Phase Execution Plan (Micro-Batched)

### Phase 1: Stabilization & Critical Fixes (Audit Batch 1)
*Goal: Stop the bleeding. Fix all runtime crashes and critical bugs.*
**Target Files:** `Laporan.tsx`, `App.tsx`, `Riwayat.tsx`, `RecurringBillForm.tsx`, `.env`, `ask-assistant.js`
- **App.tsx:** Delete the undefined `/split/:token` route. Wrap all protected routes with `ErrorBoundary`.
- **Laporan.tsx:** Add an ErrorBoundary and check all loading states to prevent white blanks.
- **Forms & Imports:** Remove duplicate imports in `Riwayat.tsx`. Change `step="100"` to `step="1"` in `RecurringBillForm.tsx`.
- **AI Integration:** Fix API configuration and add frontend error handling.

### Phase 2: Global Architecture, Accessibility & Navigation (Audit Batches 2, 3 & 5)
*Goal: System-wide context adjustments, WCAG AAA compliance, and Dark Mode.*
**Target Files:** `theme.css`, `Layout.tsx`, `Settings.tsx` (NEW), `Pemasukan.tsx` (NEW)
- **Design Tokens & Dark Mode:** Execute a complete color wipe to match the Figma Master reference. Implement missing Dark Mode CSS variables and toggle.
- **Accessibility (WCAG AAA):** Implement keyboard navigation, focus traps, ARIA attributes, and motion guards globally.
- **Navigation Integration:** Ensure BottomNav, Sidebar, TopBar, and AppShell are fully integrated and visible.
- **Global Contexts:** Add a global "Dompet" (Wallet) filter. (Main "Total Balance" remains absolute).
- **Settings & Routing:** Create Settings page (Language toggle ID/EN dictating UI + AI). Re-separate `Pemasukan` into its own page.

### Phase 3: UX "Humanization", Mobile UI & Polish (Audit Batch 4)
*Goal: Fix layout chaos, integrate mobile gestures, and make it feel premium.*
**Target Files:** `QuickAddSheet.tsx`, `Overview.tsx`, `Tren.tsx`, `PolaWaktu.tsx`, `Riwayat.tsx`
- **Mobile UX:** Integrate swipe actions and bottom sheet filters.
- **Layout Chaos:** Fix overlapping `z-index` in `QuickAddSheet`. Remove bottom card visual on Login.
- **Data Modification:** Add Edit and Delete buttons to `Riwayat`.
- **Chart Polish:** Redesign charts in `Tren` and `Overview` to include AI-generated contextual text summaries. Update `Pola Waktu` calendar layout (rupiah amounts + trx count). Update `Detail Kategori` title and add Weekly/Monthly toggle.

### Phase 4: The "Gajian" USP (Core Feature)
*Goal: Build the flagship onboarding and budget generation experience.*
**Target Files:** `Gajian.tsx` (NEW), `GajianWizard.tsx` (NEW)
- **The Wizard:** Build a structured UI wizard for new users (Date → Fixed Expenses → Risk Profile).
- **AI Engine:** Wire up the AI recommendation engine to generate the optimal budget based on the wizard inputs and active "Dompet" categories.

### Phase 5: AI Insights Expansion & Production Audit (Audit Batch 6)
*Goal: Make the AI feel omnipresent and ensure Production-Ready performance.*
**Target Files:** `Prakiraan.tsx`, `Overview.tsx`
- **Contextual Insights:** Inject AI Insight modules into `Prakiraan` and `Overview`.
- **Multi-turn Chat:** Finalize the memory for the Asisten chat.
- **Production Audit:** Run Lighthouse audit (Target: ≥90) and final polish.

### Phase 6: React Doctor — Codebase Health Remediation
*Goal: Raise the React Doctor score from 52 to ≥80 by eliminating dead code, fixing real React bugs, and resolving the highest-impact warnings.*
**Trigger:** React Doctor v0.2.3 audit run 2026-05-24 on 220 source files. Score: 52/100 "Needs work". 19 errors (5 rules), 910 warnings (61 rules), 205 affected files.

**Batch 1 — Real Bug Fixes (≤3 files):**
- `BudgetConfirmation.tsx` — 3 `useState` calls after early-return guard (rules-of-hooks violation)
- `AuthCallback.tsx` — `setTimeout` in `useEffect` without `clearTimeout` cleanup (memory leak)
- `Laporan.tsx` — `CustomTooltip` defined inside `LaporanContent` (no-nested-component-definition)

**Batch 2 — Dead Code Deletion (≤5 files per commit, multiple commits):**
- Remove the 204 files flagged as `unused-file` — scaffolded design system primitives, superseded hooks, Storybook stories, and unwired components from earlier AETHER phases
- Verify each deletion does not break `npm run build` before proceeding

**Batch 3 — High-Impact Warning Sweep (≤5 files):**
- `button-has-type` ×32 — add `type="button"` to all non-submit buttons
- `design-no-bold-heading` ×37 — `font-bold` → `font-semibold` on headings
- `no-mutable-in-deps` ×1 — fix `useNavigation.tsx:71`
- `exhaustive-deps` ×5 — fix missing deps in useEffect arrays
- Re-run React Doctor to verify score ≥80

---

## 3. Runtime Prompts for Claude Code

### Prompt: Phase 1 (Stabilization)
```text
Role: Principal Architect & Executor for Project AETHER v5
Goal: Execute Phase 1 of Major Update v5 exactly as specified in feature-update/major-update_5/master-development-roadmap.md

Task:
1. Fix SplitBillShare crash and wrap App.tsx routes with ErrorBoundary. Add loading guards to Laporan.
2. Remove duplicate imports in Riwayat.
3. Fix RecurringBillForm step attribute to "1".
4. Fix AI API config in ask-assistant.js and chatStore.ts.

Rules: Do not touch UI/styling. Fix crashes only. Request my approval when done.
```

### Prompt: Phase 2 (Global Architecture, A11y, Dark Mode)
```text
Role: Principal Architect & Executor for Project AETHER v5
Goal: Execute Phase 2 of Major Update v5 exactly as specified in feature-update/major-update_5/master-development-roadmap.md

Task:
1. Apply Figma Master colors to theme.css and implement Dark Mode toggle + CSS variables.
2. Enforce WCAG AAA (keyboard nav, ARIA, focus traps) across layout components.
3. Fully integrate BottomNav, Sidebar, TopBar, and AppShell.
4. Add global Dompet filter, create Settings page (ID/EN toggle), and separate Pemasukan.

Rules: Strict adherence to Figma colors and WCAG. Request my approval when done.
```
*(Prompts for Phases 3-5 follow the exact same structure).*
