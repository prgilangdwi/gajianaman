# Phase 6 Runtime Parameters — React Doctor Codebase Health Remediation

**Phase:** 06
**Status:** 🔲 NOT STARTED
**Batches:** 3
**Critical Path:** Batch 1 (bugs) → Batch 2 (dead code) → Batch 3 (warnings)
**Executor Model:** claude-sonnet-4-6
**Audit Tool:** react-doctor v0.2.3

---

## 1. Execution Constraints

### Anti-Bloat Model
- **Batch 1:** Max 3 files (BudgetConfirmation.tsx, AuthCallback.tsx, Laporan.tsx)
- **Batch 2:** Unlimited deletions — but build must pass after EACH deletion group
- **Batch 3:** Max 5 files modified (deletions don't count toward this limit)

### Build Quality Gates
- ✅ `npm run build` must pass before every commit (zero errors)
- ✅ No TypeScript errors introduced in modified files
- ✅ React Doctor score verified before session close (Batch 3)
- ✅ No console errors on core pages after changes

### Session Discipline
- **1 session = 1 batch maximum**
- After batch complete: Create recap, commit, stop, await Architect approval
- Do NOT start next batch in same session

---

## 2. DUAL-SESSION PROTOCOL

### How phases work
Each batch requires exactly 2 Claude Code sessions:
- **Session A — Architect:** Reviews previous batch, verifies score delta, generates next Executor prompt
- **Session B — Executor:** Implements batch, re-runs react-doctor, submits recap

Sessions must NOT overlap. Executor never starts without Architect approval.

---

### Architect Session Responsibilities
1. Read: `feature-update/major-update_5/master-development-roadmap.md`
2. Read: `feature-update/major-update_5/staging/phase-06-react-doctor.md`
3. Read: `feature-update/major-update_5/runtime/runtime-phase-06.md` (this file)
4. Read: latest recap from `aether/session-recaps/`
5. Verify Phase 5 is 100% complete (confirmed at commit `16856fe`)
6. Run `npx react-doctor --full --score` to verify current score
7. Review Executor's submitted files against batch spec
8. Generate precise Executor prompt for next batch
9. Approve or request changes — do NOT implement

---

### Architect Session Starter Prompt
```
ARCHITECT SESSION — Project AETHER v5, Phase 06

Role: Principal Architect & Prompt Engineer
Authority: Review Batch [X] submission and generate Batch [X+1] prompt

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/master-development-roadmap.md
2. feature-update/major-update_5/staging/phase-06-react-doctor.md
3. feature-update/major-update_5/runtime/runtime-phase-06.md
4. aether/session-recaps/ → latest recap

Then run: cd frontend && npx react-doctor --full --score
Report the current score before generating the Executor prompt.
```

---

### Executor Session Starter Prompt — Batch 1
```
EXECUTOR SESSION — Project AETHER v5, Phase 06, Batch 1
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-06-react-doctor.md → Batch 1 section
2. feature-update/major-update_5/runtime/runtime-phase-06.md
3. aether/session-recaps/ → latest recap (Phase 05 Batch 03)

TASK: Fix the 3 real React bugs flagged by react-doctor.

FILES TO MODIFY (max 3):
- frontend/src/app/components/BudgetConfirmation.tsx
  → Move 3 useState calls ABOVE the early-return guard clause
  → Use recommendation?.budgetItems ?? [] for initial values that reference recommendation
- frontend/src/app/pages/AuthCallback.tsx
  → Add return () => clearTimeout(id) inside the useEffect
- frontend/src/app/pages/Laporan.tsx
  → Move CustomTooltip function definition to module scope, above LaporanContent

DO NOT touch any other files. Do NOT fix warnings in this batch.

QUALITY GATES:
- npm run build (zero errors)
- npx react-doctor --full --score → verify rules-of-hooks = 0, effect-needs-cleanup = 0
- BudgetConfirmation.tsx still guards against missing recommendation state
- AuthCallback.tsx still redirects after OAuth

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase06-Batch01.md
- Include: before score (52), after score (run react-doctor --score)
- Commit: fix(react-doctor): resolve rules-of-hooks and effect cleanup violations
- STOP and await Architect approval before Batch 2
```

---

### Executor Session Starter Prompt — Batch 2
```
EXECUTOR SESSION — Project AETHER v5, Phase 06, Batch 2
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-06-react-doctor.md → Batch 2 section
2. feature-update/major-update_5/runtime/runtime-phase-06.md → Sections 3-7
3. aether/session-recaps/ → latest recap (Phase 06 Batch 01)

TASK: Delete unused/dead files flagged by react-doctor.

WORKFLOW:
1. Run: cd frontend && npx react-doctor --full --json
   Extract the full unused-file list.
2. For EACH file before deleting, run a grep to confirm zero imports:
   grep -r "FileName" frontend/src --include="*.tsx" --include="*.ts" -l
3. Delete in the 5 groups defined in staging/phase-06-react-doctor.md (Groups A–E)
4. After EACH group: npm run build — must pass before next group
5. If any deletion breaks the build: restore that file, skip it, document in recap

SAFETY RULE: When in doubt, keep the file. A false-negative unused warning is
safer than a broken build. Minimum target: delete ≥ 150 of the 204 flagged files.

QUALITY GATES:
- npm run build passes after every group and at end
- npx react-doctor --full --score → score should rise to ~72+
- unused-file count reduced by ≥ 150
- No core pages broken (Overview, Budget, Riwayat, Gajian, Asisten)

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase06-Batch02.md
- Include: files deleted count, any files skipped and why, before/after score
- Commit: chore(dead-code): remove unused files flagged by react-doctor
- STOP and await Architect approval before Batch 3
```

---

### Executor Session Starter Prompt — Batch 3
```
EXECUTOR SESSION — Project AETHER v5, Phase 06, Batch 3
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-06-react-doctor.md → Batch 3 section
2. feature-update/major-update_5/runtime/runtime-phase-06.md
3. aether/session-recaps/ → latest recap (Phase 06 Batch 02)

TASK: Fix high-impact warnings. Target score ≥ 80.

FILES TO MODIFY (max 5):
Priority order:
1. frontend/src/hooks/useNavigation.tsx — fix no-mutable-in-deps (use useLocation())
2. Any 2-3 files with exhaustive-deps violations (run react-doctor --verbose to identify)
3. High-traffic files with button-has-type violations (Layout.tsx, TransactionModal.tsx)
4. BudgetConfirmation.tsx + Gajian.tsx for design-no-bold-heading (font-bold → font-semibold)

Stop modifying files once the 5-file limit is reached.

QUALITY GATES:
- npm run build (zero errors)
- npx react-doctor --full --score → ≥ 80 (accept 78-79 if 5-file limit is exhausted)
- Document final score in recap

STOP CONDITIONS:
- Recap: aether/session-recaps/YYYY-MM-DD-Phase06-Batch03.md
- Include: final react-doctor score, score delta from baseline (52), rules fixed
- Commit: fix(react-doctor): resolve high-impact warnings and reach health target
- STOP — Phase 6 complete, await Architect final approval
```

---

## 3. Tools & Environment

```bash
# Score only (fast):
cd frontend && npx react-doctor --full --score

# Verbose with file locations:
cd frontend && npx react-doctor --full --verbose

# JSON for parsing:
cd frontend && npx react-doctor --full --json

# Grep for import check (PowerShell):
Get-ChildItem -Path frontend/src -Recurse -Include *.tsx,*.ts |
  Select-String "ComponentName" | Select-Object -ExpandProperty Path

# Build verification:
cd frontend && npm run build
```

---

## 4. Score Projection

| After Batch | Expected Score | Primary Driver |
|---|---|---|
| Batch 1 (bug fixes) | ~56 | Removes 5 error rules (19 instances) |
| Batch 2 (dead code) | ~72 | Removes 204 unused-file warnings |
| Batch 3 (warnings) | ≥80 | Resolves no-mutable-in-deps, exhaustive-deps, button-has-type |

Actual scores depend on react-doctor's weighting algorithm. Projections are estimates.

---

## 5. Git & Commit Protocol

### Batch 1
```
fix(react-doctor): resolve rules-of-hooks and effect cleanup violations

- Move useState calls above guard clause in BudgetConfirmation.tsx
- Add clearTimeout cleanup to AuthCallback.tsx useEffect
- Hoist CustomTooltip to module scope in Laporan.tsx

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Batch 2
```
chore(dead-code): remove N unused files flagged by react-doctor

- Deleted Storybook stories (3 files)
- Deleted superseded design system base components (N files)
- Deleted unwired hooks from early AETHER phases (N files)
- Deleted unwired mobile/feature components (N files)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Batch 3
```
fix(react-doctor): resolve high-impact warnings and reach health target

- Fix no-mutable-in-deps in useNavigation.tsx (use useLocation)
- Fix exhaustive-deps in [files]
- Add type="button" to buttons in [files]
- font-bold → font-semibold on headings in [files]
- Final score: [X]/100

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## 6. Rollback Triggers (STOP IMMEDIATELY)

- ❌ `npm run build` fails after any deletion
- ❌ TypeScript errors introduced in bug-fix batch
- ❌ Core page navigation breaks (Overview, Budget, Gajian, Asisten)
- ❌ BudgetConfirmation.tsx fails to guard missing recommendation state
- ❌ More than 5 files modified in Batch 3

---

## 7. Success Criteria (Per Batch)

### Batch 1
- ✅ rules-of-hooks: 0 violations
- ✅ effect-needs-cleanup: 0 violations
- ✅ no-nested-component-definition: 0 violations
- ✅ Build passes

### Batch 2
- ✅ unused-file count reduced by ≥ 150
- ✅ Build passes after all deletions
- ✅ React Doctor score ~72

### Batch 3
- ✅ React Doctor score ≥ 80
- ✅ no-mutable-in-deps: 0 violations
- ✅ exhaustive-deps: significantly reduced
- ✅ Build passes

---

## Approval Gate

✋ **RUNTIME PARAMETERS LOCKED**

Phase 5 confirmed complete (commit `16856fe`, 2026-05-24).
Architect generates batch-specific Executor prompts from Section 2 above.
Phase 6 Batch 1 may begin after Architect approval.
