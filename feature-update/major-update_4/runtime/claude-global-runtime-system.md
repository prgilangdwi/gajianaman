# CLAUDE GLOBAL RUNTIME SYSTEM
> THE MASTER EXECUTION BRAIN FOR PROJECT AETHER

## 1. MANDATORY READING ORDER
Before initiating any code modification, Claude Code MUST read the following context in this exact order:
1. `runtime/runtime-execution-order.md`
2. `runtime/claude-global-runtime-system.md` (This file)
3. `master-development-roadmap.md`
4. The corresponding Phase Execution file (e.g., `phase-01-foundation.md`)
5. The corresponding Runtime Phase file (e.g., `runtime/runtime-phase-01.md`)
6. The latest recap from `session-recaps/`

## 2. IMPLEMENTATION PROTOCOL
- **Execution Mode:** Deterministic, micro-batched, heavily validated.
- **Scope Integrity:** Stick strictly to the defined IN-SCOPE items.
- **Stop Conditions:** Halt immediately if encountering an architectural inconsistency, missing dependency, or when a batch is complete. Await human validation.

## 3. ANTI-CONTEXT-BLOAT RULES
- **Batch Limit:** Modify NO MORE than 3-5 files per session.
- **Re-read Prohibition:** Do not repeatedly read the entire project directory. Target specific files identified in the Phase Execution plan.
- **Memory Purge:** End sessions completely after a git commit and recap generation. Start fresh for the next batch.

## 4. ARCHITECTURE PRESERVATION RULES
- Do not modify `supabase.ts` or `theme.css` without explicit Phase instructions.
- Preserve all existing custom hooks unless targeted for a specific refactor.
- Maintain the Vercel (frontend) + Railway (bot) architectural boundary.

## 5. GIT WORKFLOW RULES
- **Branching:** Ensure you are on `develop` or a specific `feature/phase-XX` branch before working. NEVER commit directly to `main`.
- **Commits:** Conventional commits required. Format: `type(scope): description`.
- **Checkpoints:** Commit after every successful batch.

## 6. FIGMA MCP RULES
- When UI implementation is required, invoke the Figma MCP to extract tokens, spacing, and variants using the exact node IDs provided in the Figma synchronization rules.
- Do not guess paddings or colors. Extract them deterministically.

## 7. ROADMAP SYNCHRONIZATION RULES
- Before modifying a file, cross-reference it with the Phase Touch List to ensure it is authorized for modification.
- Document any deviations from the roadmap in the session recap under "Unresolved Issues".

## 8. FORBIDDEN BEHAVIOR RULES
- NO global dependency updates (e.g., `npm update all`) unless explicitly requested in Phase 01.
- NO unprompted refactoring of unrelated components.
- NO changing database table structures.

## 9. IMPLEMENTATION SEQUENCING RULES
- Do not start a new Phase until the previous Phase has a committed sign-off recap.
- Execute batches within a phase in numerical order.

## 10. QA & VALIDATION PROTOCOLS
- **Mobile QA:** All UI changes must be validated against a 375px viewport (mobile).
- **Accessibility QA:** Ensure ARIA labels, focus traps, and WCAG AAA contrast are maintained.
- **Performance QA:** Ensure no large bundle additions without lazy loading boundaries.
- **Design Consistency:** Verify changes against the global token architecture in `theme.css`.

## 11. EMERGENCY RECOVERY & ROLLBACK RULES
- If a test fails after a batch: `git reset --hard HEAD` and re-evaluate.
- If a build fails, DO NOT attempt cascading hacks. Revert, document the failure in a recap, and stop.
