# Phase 2 Runtime Parameters — Global Architecture, Accessibility & Navigation

**Phase:** 02  
**Status:** ✅ COMPLETE  
**Batches:** 4  
**Commits:** `01919d4`, `65d970a`, `fa466d5`, `62a6382`  
**Model Used:** claude-haiku-4-5-20251001  

---

## 1. Execution Constraints

### Anti-Bloat Model
- **Batch 1:** Max 2 files (theme.css + Layout.tsx)
- **Batch 2:** Max 5 files (WCAG AAA audit across components)
- **Batch 3:** Max 2 files (Settings.tsx NEW + App.tsx route)
- **Batch 4:** Max 5 files (Pemasukan NEW, useDompetFilter NEW, App.tsx, navigationConfig, HeaderBar)

### Build Quality Gates
- ✅ `npm run build` must pass after every batch (zero errors)
- ✅ No TypeScript errors in modified files
- ✅ WCAG AAA contrast ratios ≥ 7:1 (normal text), ≥ 4.5:1 (large text)
- ✅ Dark mode renders correctly on all pages

### Session Discipline
- **1 session = 1 batch maximum**
- After batch complete: Create recap, commit, stop, await Architect approval
- Do NOT start next batch in same session

---

## 2. DUAL-SESSION PROTOCOL

### How phases work
Each batch requires exactly 2 Claude Code sessions:
- **Session A — Architect:** Reviews previous batch, approves, generates Executor prompt
- **Session B — Executor:** Reads Architect prompt, implements batch, submits recap

Sessions must NOT overlap. Executor never starts without Architect approval.

### Architect Session Responsibilities
1. Read: `feature-update/major-update_5/master-development-roadmap.md`
2. Read: `feature-update/major-update_5/staging/phase-02-architecture.md`
3. Read: `feature-update/major-update_5/runtime/runtime-phase-02.md` (this file)
4. Read: latest recap from `aether/session-recaps/`
5. Review Executor's submitted files against batch spec
6. Check quality gates (contrast ratios, dark mode, build)
7. Generate precise Executor prompt for next batch
8. Approve or request changes — do NOT implement

### Executor Session Responsibilities
1. Read: Architect's batch prompt
2. Read: `staging/phase-02-architecture.md` → current batch section
3. Read: `runtime/runtime-phase-02.md` → sections 3–9
4. Read: latest recap
5. Implement ONLY files listed in the batch spec
6. Run `npm run build` before commit
7. Create recap: `aether/session-recaps/YYYY-MM-DD-Phase02-Batch0X.md`
8. Commit, STOP, await Architect approval

### Architect Session Starter Prompt
```
ARCHITECT SESSION — Project AETHER v5, Phase 02

Role: Principal Architect & Prompt Engineer
Authority: Review Batch [X] submission and generate Batch [X+1] prompt

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/master-development-roadmap.md
2. feature-update/major-update_5/staging/phase-02-architecture.md
3. feature-update/major-update_5/runtime/runtime-phase-02.md
4. aether/session-recaps/ → latest recap

STANDING BY for Executor's Phase 02, Batch [X] submission.
```

### Executor Session Starter Prompt Template
```
EXECUTOR SESSION — Project AETHER v5, Phase 02, Batch [X]
Model: claude-sonnet-4-6

PRE-FLIGHT (read in order):
1. feature-update/major-update_5/staging/phase-02-architecture.md → Batch [X] section
2. feature-update/major-update_5/runtime/runtime-phase-02.md
3. aether/session-recaps/ → latest recap

TASK: [Specific tasks per batch — see staging doc]

FILES TO CREATE/MODIFY:
- [Batch-specific list — max 5 files]

QUALITY GATES:
- npm run build (zero errors)
- TypeScript strict, no errors in modified files
- WCAG AAA contrast maintained
- Dark mode renders correctly
- Max [N] files modified

STOP CONDITIONS:
- Recap → commit → STOP
- Do NOT start next batch
```

---

## 3. Tools & Environment

- ✅ `npm run build` — Build verification
- ✅ `npm run dev` — Live preview for dark/light mode testing
- ✅ Chrome DevTools Accessibility Audit — WCAG contrast checking
- ✅ Figma Master — Color reference for token values

---

## 4. Code Style & Patterns

### CSS Variables (theme.css)
- All colors defined as CSS custom properties on `:root` and `.dark`
- Semantic naming: `--bg-primary`, `--text-content-primary`, `--border-neutral`, `--brand-primary`
- Never use hardcoded hex colors in components — always use CSS variables via utility functions

### Tailwind + Theme Tokens
```typescript
// Use utility functions from utils.ts
bgColorVar('sidebar-bg')     // → var(--sidebar-bg)
textColorVar('content-primary') // → color: var(--content-primary)
borderColorVar('border-neutral') // → border-color: var(--border-neutral)
```

### WCAG AAA Pattern
- Foreground/background pairs must be tested for contrast ratio
- Focus-visible: all interactive elements must show visible focus ring
- Motion: all animations must check `useReducedMotion()` hook

### useDompetFilter Pattern
```typescript
// Batch 4: localStorage-persisted wallet filter
const { selectedDompet, setDompet, clearDompet, mounted } = useDompetFilter();
// selectedDompet === null means "all wallets"
// Always check mounted before rendering wallet-dependent UI
```

---

## 5. Git & Commit Protocol

### Per Batch
- **1 atomic commit per batch**
- **Conventional commit format:**
  ```
  feat(phase02-b1): implement figma master design tokens and dark mode
  
  - Apply Figma Master colors to theme.css (complete color wipe)
  - Add dark mode CSS variables (.dark selector)
  - Wire dark mode class toggle in Layout.tsx
  
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```

---

## 6. Rollback Triggers (STOP IMMEDIATELY)

- ❌ `npm run build` fails (any error)
- ❌ TypeScript errors in modified files
- ❌ WCAG AAA contrast regression (any page fails ≥ 7:1)
- ❌ Dark mode toggle breaks light mode
- ❌ More than 5 files modified per batch
- ❌ Unrelated files accidentally modified

---

## 7. Success Criteria (Per Batch)

### Batch 1
- ✅ Figma Master colors applied to theme.css
- ✅ Dark mode variables present (`.dark` selector)
- ✅ Dark/light toggle works without hard refresh

### Batch 2
- ✅ All pages pass WCAG AAA contrast audit
- ✅ Focus-visible rings on all interactive elements
- ✅ `prefers-reduced-motion` guard on animations
- ✅ Keyboard navigation works on core flows

### Batch 3
- ✅ Settings page renders at `/settings`
- ✅ Dark mode toggle persists via `useDarkMode` hook
- ✅ Language toggle (ID/EN) switches UI labels
- ✅ Route wired in App.tsx

### Batch 4
- ✅ Pemasukan page at `/spend/income`
- ✅ Income data filtered correctly (type === 'income')
- ✅ Dompet selector in HeaderBar desktop view
- ✅ Wallet selection persists via localStorage
- ✅ Backward compatibility: `/pemasukan` → `/spend/income`

---

## Approval Gate

✅ **PHASE 2 COMPLETE — Runtime parameters for reference only.**
