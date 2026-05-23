# Phase 1 Runtime Parameters — Stabilization & Critical Fixes

**Phase:** 01  
**Status:** ✅ COMPLETE  
**Batches:** 1  
**Commit:** `9613280`  
**Model Used:** claude-haiku-4-5-20251001  

---

## 1. Execution Constraints

### Anti-Bloat Model
- **Batch 1:** Max 5 files (App.tsx, Laporan.tsx, Riwayat.tsx, RecurringBillForm.tsx, + 1 verify)
- **Rule:** Crash fixes only — zero UI/styling changes

### Build Quality Gates
- ✅ `npm run build` must pass before commit (zero errors)
- ✅ No new TypeScript errors
- ✅ No new console errors on any route
- ✅ No UI/styling changes (crash fixes ONLY)

### Session Discipline
- **1 session = 1 batch** (Phase 1 has only 1 batch)
- After batch complete: Create recap, commit, stop, await Architect approval
- Do NOT start Phase 2 in same session

---

## 2. DUAL-SESSION PROTOCOL

### How phases work
Each batch requires exactly 2 Claude Code sessions:
- **Session A — Architect:** Reviews previous work, approves it, generates Executor prompt
- **Session B — Executor:** Reads Architect prompt, implements the batch, submits for review

Sessions must NOT overlap. Executor never starts without Architect approval.

### Architect Session Responsibilities
1. Read: `feature-update/major-update_5/master-development-roadmap.md`
2. Read: `feature-update/major-update_5/staging/phase-01-stabilization.md`
3. Read: `feature-update/major-update_5/runtime/runtime-phase-01.md` (this file)
4. Read: latest recap from `aether/session-recaps/` (if any)
5. Review Executor's submitted files against batch spec
6. Check all quality gates (build, TypeScript, no new errors)
7. Generate precise Executor prompt for this batch
8. Approve or request changes — do NOT implement

### Executor Session Responsibilities
1. Read: Architect's batch prompt (provided at session start)
2. Read: `staging/phase-01-stabilization.md` → Batch 1 section
3. Read: `runtime/runtime-phase-01.md` → sections 3–10
4. Implement ONLY the 4 target files
5. Run `npm run build` — must pass before commit
6. Create recap: `aether/session-recaps/YYYY-MM-DD-Phase01-Batch01.md`
7. Commit with conventional format
8. STOP — do not start Phase 2

### Architect Session Starter Prompt
```
ARCHITECT SESSION — Project AETHER v5, Phase 01

Role: Principal Architect & Prompt Engineer
Authority: Review Phase 01 submission and approve Phase 02 start

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/master-development-roadmap.md
2. feature-update/major-update_5/staging/phase-01-stabilization.md
3. feature-update/major-update_5/runtime/runtime-phase-01.md
4. aether/session-recaps/ → latest recap

STANDING BY for Executor's Phase 01, Batch 01 submission.
```

### Executor Session Starter Prompt
```
EXECUTOR SESSION — Project AETHER v5, Phase 01, Batch 01
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-01-stabilization.md → Batch 1 section
2. feature-update/major-update_5/runtime/runtime-phase-01.md
3. aether/session-recaps/ → latest recap (if any)

TASK: Fix all runtime crashes (surgical fixes only, no UI changes)

FILES TO MODIFY (max 5):
- frontend/src/app/App.tsx — remove /split/:token route, add ErrorBoundary
- frontend/src/app/pages/Laporan.tsx — add loading guards + ErrorBoundary
- frontend/src/app/pages/Riwayat.tsx — remove duplicate DropdownMenu import
- frontend/src/app/components/RecurringBillForm.tsx — change step="100" to step="1"
- frontend/api/ask-assistant.js — read-only verification (no changes likely needed)

QUALITY GATES:
- npm run build (zero errors)
- No new TypeScript errors
- No new console errors on any route
- NO UI/styling changes (crash fixes only)
- Max 5 files modified

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase01-Batch01.md
- Commit: fix(aether-phase01): stabilize app crashes and fix broken routes
- STOP and await Architect approval before Phase 02
```

---

## 3. Tools & Environment

- ✅ `npm run build` — Verify build
- ✅ `npm run dev` — Local dev server (verify routes don't crash)
- ✅ Chrome DevTools — Console check for errors

---

## 4. Code Style & Patterns

- **Minimal changes only** — this phase is crash fixes, not refactoring
- **ErrorBoundary:** Use existing `@/components/common/ErrorBoundary` (class component)
- **Import cleanup:** Remove only duplicate imports, do not reorder
- **No new dependencies**

---

## 5. Git & Commit Protocol

```
fix(aether-phase01): stabilize app crashes and fix broken routes

- Remove broken /split/:token route (SplitBillShare component undefined)
- Wrap protected routes with ErrorBoundary in App.tsx
- Add loading guards to Laporan.tsx to prevent white-blank screens
- Remove duplicate DropdownMenu import in Riwayat.tsx
- Fix RecurringBillForm step="100" to step="1" for Rupiah granularity

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 6. Rollback Triggers (STOP IMMEDIATELY)

- ❌ `npm run build` fails
- ❌ New TypeScript errors introduced
- ❌ Any UI/styling change (scope creep)
- ❌ More than 5 files modified

---

## 7. Success Criteria

- ✅ No white-screen crash on any route
- ✅ ErrorBoundary catches route errors
- ✅ Laporan loads without blank screen
- ✅ Build passes (zero errors)
- ✅ Files modified ≤ 5

---

## Approval Gate

✅ **PHASE 1 COMPLETE — Runtime parameters for reference only.**
