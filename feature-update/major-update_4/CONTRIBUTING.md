# Contributing to Gajian Aman

> Guidelines for developers extending the AETHER v2.0.0 codebase

This document enforces strict workflow discipline to prevent context bloat, scope creep, and implementation drift—lessons learned from Project AETHER's redesign.

---

## 1. BEFORE YOU START: The Pre-Flight Checklist

**Every development session MUST read these files in order:**

### Read 1: Master Roadmap (Sections 2, 3, 7, 10 minimum)
File: `feature-update/major-update_4/master-development-roadmap.md`

This is the strategic blueprint. It won't change mid-session. It defines:
- 15 Architecture Principles
- Anti-Bloat Execution Model
- Coding standards
- File organization expectations

Reading time: ~15 minutes (skim if you've read before)

### Read 2: Current Phase File
File: `feature-update/major-update_4/staging/phase-[XX]-*.md`

This is the tactical plan for your specific phase. It defines:
- Exact tasks in scope (with checkboxes)
- Files you may touch
- Expected outputs
- Validation criteria

Reading time: ~10 minutes

### Read 3: Last Session Recap
File: `aether/session-recaps/[YYYY-MM-DD]-Phase[XX]-Batch[Y].md`

This is your bridge from the previous session. It contains:
- What was accomplished
- What's pending
- Known issues
- Architectural decisions made

Reading time: ~5 minutes

---

## 2. FILE BOUNDARIES (THE 5-FILE RULE)

**Maximum 5 source files modified per session. NO EXCEPTIONS.**

This is the single biggest success factor in preventing context bloat. When you hit 5 files, you STOP and create a recap—even if you have more work to do.

### Why 5?

- Keeps Claude Code's context window clear
- Forces scope clarity upfront
- Makes rollback trivial (each session is safe)
- Prevents implementation drift

### Counting Files

- Counts: `.ts`, `.tsx`, `.css`, `.json` (config), `.html`
- Doesn't count: `.gitignore`, `package-lock.json`, git artifacts

### If You Discover Out-of-Scope Work

You have a choice:
1. **Defer it** — Add to the "Deferred Issues" section in your recap
2. **File an issue** — Create a GitHub issue for the next batch
3. **Stop and ask** — If it's blocking, pause and ask the project owner

**Never** expand scope mid-session to fix discovered issues.

---

## 3. ATOMIC COMMITS

Every commit should be a safe rollback point.

```bash
git add .
git commit -m "type(scope): description"
```

### Commit Message Format

```
<type>(<scope>): <description>

<optional detailed explanation>
```

**Types:**
- `feat` — New feature or component
- `fix` — Bug fix
- `refactor` — Code restructure (no behavior change)
- `style` — Token updates, formatting (no logic)
- `docs` — Documentation only
- `chore` — Build, config, dependencies
- `perf` — Performance improvement

**Scopes:**
- `phase-XX` — Phase number
- `a11y` — Accessibility
- `design` — Design system / tokens
- `ai` — AI assistant
- `mobile` — Mobile-specific changes
- `perf` — Performance

### Examples

```
fix(a11y): darken category colors to meet WCAG AAA 7:1 contrast

- Food & Dining: #f59e0b → #b86f0d
- Transport: #3b82f6 → #1d4ed8
- All 8 categories now pass 7:1 contrast on light backgrounds

Fixes: accessibility audit findings from Phase 10, Batch 2
```

```
feat(phase-04): create AmountDisplay component for consistent IDR formatting

Ensures all financial amounts use DM Mono font, Rupiah locale formatting,
and respect PrivacyAmount wrapper for privacy mode.

Implements Principle 03 (Token-Driven Styling) and Principle 11 (Indonesian-First Localization).
```

### Commit Atomicity Rules

- **One logical change per commit** — Don't mix refactor + feature in same commit
- **Buildable state** — Every commit must `npm run build` successfully
- **Descriptive message** — Explain WHY, not just WHAT
- **File count limit** — No single commit touches >8 files

---

## 4. DEVELOPMENT WORKFLOW

```
SESSION START
│
├── 1. READ pre-flight files (roadmap, phase file, last recap)
├── 2. IDENTIFY specific task from phase file
├── 3. PLAN: "I will modify files X, Y, Z" (max 5)
├── 4. CONFIRM scope with project owner if scope unclear
│
├── IMPLEMENT (max 5 files)
│   ├── Write code
│   ├── Test locally
│   └── Commit atomically
│
├── VALIDATE BEFORE MERGE
│   ├── npm run build     (must pass zero errors)
│   ├── npm run lint      (once available)
│   ├── Manual: responsive check (375px, 768px, 1280px)
│   ├── Manual: dark mode check
│   ├── Manual: keyboard navigation check
│   └── Manual: reduced motion check
│
├── POST-SESSION
│   ├── Generate session recap
│   ├── Update phase file checkboxes
│   └── Record deferred decisions
│
SESSION END
```

---

## 5. DESIGN SYSTEM CONVENTIONS

### Token Usage (Principle 03: Token-Driven Styling)

**ALWAYS use token helpers:**

```typescript
import { bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils'

// ✅ CORRECT
bgColorVar('sentiment-positive')        // "bg-[var(--color-sentiment-positive)]"
textColorVar('content-primary')         // "text-[var(--color-content-primary)]"
borderColorVar('brand-primary')         // "border-[var(--color-brand-primary)]"

// ❌ FORBIDDEN — NEVER
className="bg-green-500"                // Raw Tailwind
className="bg-[#4AE54A]"               // Hardcoded hex
style={{ color: '#4AE54A' }}           // Inline style
```

All tokens are defined in `frontend/src/styles/theme.css`.

### Component Pattern

```typescript
interface ComponentProps {
  label: string
  onClick: () => void
  isLoading?: boolean
  variant?: 'primary' | 'secondary'
}

export function Component({ label, onClick, isLoading, variant = 'primary' }: ComponentProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = useCallback(() => {
    onClick()
    setIsOpen(false)
  }, [onClick])

  return (
    <button
      onClick={handleClick}
      className={cn(
        'px-4 py-2 rounded-md transition-colors',
        variant === 'primary' ? bgColorVar('brand-primary') : bgColorVar('bg-card'),
        textColorVar('content-primary')
      )}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : label}
    </button>
  )
}
```

**Rules:**
- Explicit props interface (not `type Props`)
- Named exports only (no `export default`)
- Hooks at top, derived state, handlers, render
- Use `useCallback` for event handlers
- Use `cn()` for conditional classNames

### Color Application (Principle 06: WCAG AAA)

All text must have 7:1 contrast on its background. All UI components must have 3:1.

**Sentiment Colors** (use for income/expense/warning indicators):
- Positive: `#1d4b09` light, `#95fd9a` dark
- Negative: `#7a1c0a` light, `#ff9999` dark
- Warning: `#8b6a00` light, `#f5d642` dark

**Category Colors** (darkened Phase 10, Batch 2 for text contrast):
- Food: `#b86f0d`, Transport: `#1d4ed8`, Health: `#b91c1c`, etc.

### Accessibility (Principle 06)

Every interactive element must:
- Have keyboard support (Tab, Enter, Arrow keys)
- Have visible focus indicator
- Have descriptive `aria-label` if not semantic
- Support `useReducedMotion()` for animations

```typescript
import { useReducedMotion } from '@/lib/transitions'

export function AnimatedCard() {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefersReduced ? 0 : 0.2 }}
    >
      Content
    </motion.div>
  )
}
```

---

## 6. TESTING EXPECTATIONS

Before pushing any commit:

```bash
# Build must pass
npm run build

# All code changes should be tested locally
npm run dev        # Test in browser at localhost:5173

# For critical changes:
npm run preview    # Test production build locally
```

### Manual QA Checklist

For responsive changes:
- [ ] Test at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1280px (desktop)

For color/contrast changes:
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Verify 7:1 text contrast (use WebAIM contrast checker)

For animations:
- [ ] Verify animations work
- [ ] Disable reduced motion → animations should stop
- [ ] Verify no jank on 50th transaction item

For keyboard navigation:
- [ ] Tab through all interactive elements
- [ ] Verify focus visible on all elements
- [ ] Verify focus order is logical
- [ ] Test modal focus trap (Tab stays inside modal)

---

## 7. SESSION RECAP REQUIREMENT

**Every session MUST end with a recap.** No exceptions.

Template location: `feature-update/major-update_4/runtime/runtime-recap-template.md`

Save as: `aether/session-recaps/[YYYY-MM-DD]-Phase[XX]-Batch[Y].md`

### Required Sections

```markdown
# Session Recap: Phase XX - [Phase Name]
**Date:** YYYY-MM-DD
**Author:** [Your Name or Claude Code]

## 1. IMPLEMENTATION LOGS
- Brief description of each action taken

## 2. MODIFIED FILES
- `[CREATE]` or `[MODIFY]` path/to/file.ts

## 3. ARCHITECTURE NOTES
- Technical decisions made
- Tradeoffs considered
- Deviations from plan with rationale

## 4. VALIDATION TRACKING
- [x] Build passing
- [ ] Lint passing
- [ ] Visual QA (TODO)

## 5. GIT CHECKPOINT TRACKING
- **Commit Hash:** `abc1234`
- **Commit Message:** `fix(scope): description`
- **Branch:** `phase/XX-name`

## 6. UNRESOLVED ISSUES & BLOCKERS
- Any blockers encountered
- Any dependencies missing

## 7. TODO CARRYOVERS
- Tasks that belong in this batch but overflowed to next session
- Pending decisions requiring owner approval
```

---

## 8. CODE REVIEW EXPECTATIONS

When submitting a PR:

1. **Scope is clear** — Matches phase file and this document
2. **5 files or fewer** — Counts all source file changes
3. **Commits are atomic** — Each commit is a safe rollback point
4. **Build passes** — `npm run build` runs zero errors
5. **Tests added** — For logic changes; visual QA for UI changes
6. **Documentation updated** — If architecture changes
7. **Session recap attached** — Shows decision log and validation

### Reviewer Checklist

- [ ] Changes follow the 15 Architecture Principles
- [ ] All token usage via helpers, no hardcoded colors
- [ ] All text has 7:1 contrast (light + dark mode)
- [ ] Components are <200 lines and ≤3 responsibilities
- [ ] No dead code, commented-out code, or `// TODO` without phase numbers
- [ ] Scope doesn't exceed phase file
- [ ] Recap shows validation was performed

---

## 9. WHEN YOU GET STUCK

**Escalation Protocol:**

1. **Document the decision point** — What's blocking you?
2. **Provide 2-3 options** — With tradeoffs
3. **Create a PENDING decision entry** in your recap
4. **Continue other tasks** — Don't block the whole session
5. **Ask for approval** — When ready to proceed

**Do NOT:**
- Assume a default and continue
- Expand scope to work around the blocker
- Skip validation to save time

---

## 10. USEFUL COMMANDS

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Test production build locally

# Quality
npm run build            # TypeScript compile check + bundler

# Utilities
git log --oneline -10   # View recent commits
git status              # See what's changed
git diff                # See detailed changes
git show <hash>         # View specific commit
```

---

## 11. DIRECTORY STRUCTURE QUICK REFERENCE

```
src/
├── app/components/    # ← UI components (ui/, common/, layout/, features/)
├── app/pages/         # ← 15 screens
├── hooks/             # ← Custom React hooks (data fetching, UI behavior)
├── stores/            # ← Zustand state stores
├── lib/               # ← Utilities, types, constants
└── styles/            # ← CSS tokens (theme.css is THE source of truth)
```

If you're unsure where to put a file, check Principle 15: **Predictable File Organization**. File location is determinable from its name.

---

## 12. GETTING HELP

- **Architecture questions?** Read `ARCHITECTURE.md`
- **Workflow questions?** Read this document
- **Design system questions?** Check `frontend/src/styles/theme.css`
- **Blocked on decision?** Create PENDING entry in recap, ask owner
- **Found a bug outside scope?** File an issue, don't fix in current session

---

**Contributing Guidelines v2.0.0 (AETHER)**  
**Last Updated:** May 2026  
**Enforced:** Every Claude Code session and developer PR
