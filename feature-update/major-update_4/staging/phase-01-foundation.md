# PHASE 01: FOUNDATION & GOVERNANCE SETUP
> [!IMPORTANT]
> **Duration:** 3-5 days
> **Dependencies:** None (First phase of Project AETHER)
> **Owner:** Principal Architect / Lead Frontend Engineer

## 1. CROSS-REFERENCE TO MASTER ROADMAP
This phase execution file operates under the rules established in `master-development-roadmap.md`. 
No code modification can occur until the Pre-Flight Checks are successfully validated.
All session persistence rules and Anti-Context-Bloating strategies apply.

## 2. SCOPE BOUNDARIES

### 2.1 IN-SCOPE
- Creation of `/aether/` governance directory structure.
- Creation of `session-recaps/` and `implementation-logs/` directories.
- Configuration of `.claude/` for session rules.
- Update of `CLAUDE.md` with Project AETHER rules.
- Setup of Git branching strategy (main → develop → phase branches).
- Creation of phase tracking files (Kanban board / markdown checklists).
- ESLint + Prettier hardened configuration setup.
- Husky pre-commit hooks installation and configuration.
- Comprehensive audit of existing `frontend/src/` structure.
- Generation of component, hook, and page inventory markdowns.
- Validation of existing build (`npm run build`).
- Validation of existing lint (`npm run lint`).
- Testing infrastructure setup (Vitest setup if not present).
- Documentation of all existing CSS variables from `theme.css`.
- Documentation of all existing TypeScript types from `supabase.ts`.
- Generation of baseline performance and accessibility reports.
- Feature flags infrastructure setup.

### 2.2 OUT-OF-SCOPE (DO NOT TOUCH)
- Any page components in `src/pages/` or `src/features/`.
- Any hook logic in `src/hooks/`.
- Any component styling (`className` changes).
- Database schema or migrations.
- Backend Python code (bot logic).
- Vercel serverless functions in `api/`.

## 3. PRE-FLIGHT CHECKS
- [ ] Read `master-development-roadmap.md` thoroughly.
- [ ] Read `GAJIAN_AMAN_PROJECT_CONTEXT.md` to understand current tech stack.
- [ ] Ensure local environment has Node.js 20+, npm 10+.
- [ ] Ensure Git is initialized and clean on the main branch.

## 4. IMPLEMENTATION SEQUENCE (MICRO-BATCHED)

### BATCH 1: Governance & Directory Structure
1. Create `aether/` directory in project root.
2. Inside `aether/`, create `session-recaps/` and `implementation-logs/`.
3. Create `.claude/` directory and configure session settings.
4. Update `CLAUDE.md` with strict rules for session memory and recap formatting.

### BATCH 2: Git Strategy & Tooling
1. Initialize the branching strategy: Create `develop` branch from `main`.
2. Create `feature/phase-01-foundation` from `develop`.
3. Install and configure Husky and lint-staged.
4. Update ESLint configuration to a hardened state (strict TS rules, no-any).
5. Update Prettier configuration and add `.prettierignore`.

### BATCH 3: Inventories & Audits
1. Run a script or manually inspect `src/components/` to create `aether/component-inventory.md`.
2. Inspect `src/hooks/` to create `aether/hook-inventory.md`.
3. Inspect `src/pages/` to create `aether/page-inventory.md`.
4. Parse `theme.css` to extract and document all CSS variables into `aether/css-variables.md`.
5. Extract DB types from `supabase.ts` into `aether/db-types-audit.md`.

### BATCH 4: Build, Test & Baselines
1. Execute `npm run build` to ensure the baseline is stable.
2. Execute `npm run lint` and fix any critical issues that prevent a clean slate (or add to a tech debt backlog).
3. Install Vitest and React Testing Library if not present. Create a baseline test.
4. Generate a Lighthouse report (Performance, Accessibility) and save to `aether/baseline-report.md`.
5. Set up a simple feature flag context provider (without integrating it into pages yet).

## 5. FILE TOUCH LIST
- `[CREATE]` `/aether/session-recaps/.keep`
- `[CREATE]` `/aether/implementation-logs/.keep`
- `[CREATE]` `/.claude/settings.json`
- `[MODIFY]` `/CLAUDE.md`
- `[MODIFY]` `/package.json`
- `[CREATE]` `/.husky/pre-commit`
- `[MODIFY]` `/eslint.config.js` or `.eslintrc.js`
- `[CREATE]` `/.prettierrc`
- `[CREATE]` `/aether/component-inventory.md`
- `[CREATE]` `/aether/hook-inventory.md`
- `[CREATE]` `/aether/page-inventory.md`
- `[CREATE]` `/aether/css-variables.md`
- `[CREATE]` `/aether/db-types-audit.md`
- `[CREATE]` `/aether/baseline-report.md`
- `[CREATE]` `/frontend/src/lib/feature-flags.ts`
- `[MODIFY]` `/vite.config.ts` (if adding Vitest)

## 6. EXPECTED OUTPUTS
By the end of Phase 01, the repository will have a robust governance structure that prevents context-bloating for future Claude Code sessions. The build will be demonstrably stable, and linting rules will enforce strict quality.

## 7. VALIDATION STEPS
- `npm run build` succeeds without warnings.
- `npm run lint` returns 0 errors.
- Committing a file with bad formatting triggers Husky and fails.
- All inventory markdown files have content (not empty).

## 8. GIT COMMIT CHECKPOINTS
Commit after each batch:
- `chore(gov): setup aether governance directories and CLAUDE rules`
- `chore(tooling): configure husky, hardened eslint, and prettier`
- `docs(audit): generate baseline inventories for components, hooks, pages`
- `test(setup): verify build, lint, and vitest infrastructure`

## 9. ROLLBACK INSTRUCTIONS
To undo this phase:
1. `git checkout develop`
2. `git branch -D feature/phase-01-foundation`
3. Delete `aether/`, `.claude/`, `.husky/` directories if they leaked into untracked.

## 10. SESSION RECAP TEMPLATE
```markdown
# Session Recap: Phase 01 - [Batch Name]
**Date:** YYYY-MM-DD
**Files Touched:**
- ...

**Decisions Made:**
- ...

**Next Steps:**
- ...
```

## 11. ARCHITECTURE NOTES
Feature flags are introduced early so that Phase 02+ components can be merged into `develop` without affecting production if continuous delivery is enabled.

## 12. UI CONSISTENCY CHECKS
N/A - No UI is modified in this phase.

## 13. MOBILE RESPONSIVENESS CHECKS
N/A - No UI is modified in this phase.

## 14. ACCESSIBILITY CHECKS
N/A - Baseline report generated, but no fixes applied yet.

## 15. TECHNICAL DEBT PREVENTION CHECKS
- Are ESLint rules strict enough to prevent `any` types? Yes.
- Is Prettier enforcing formatting automatically? Yes.

## 16. CLAUDE CODE SESSION BATCHES
Session 1: Batch 1 & 2 (Governance and Tooling)
Session 2: Batch 3 (Inventories)
Session 3: Batch 4 (Build, Test, Baselines)

## 17. FIGMA REFERENCE LINKS
N/A for Phase 01.

## 18. DEPENDENCY OUTPUTS
Produces governance structure, inventories, and strict linting that ALL subsequent phases will rely on.
