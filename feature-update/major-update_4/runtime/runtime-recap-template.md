# RUNTIME RECAP TEMPLATE
> STANDARDIZED FORMAT FOR SESSION PERSISTENCE

Every generated recap file must STRICTLY follow this markdown format.

```markdown
# Session Recap: Phase [XX] - [Batch Name]
**Date:** YYYY-MM-DD
**Author:** Claude Code

## 1. IMPLEMENTATION LOGS
- [Brief description of action taken]
- [Brief description of action taken]

## 2. MODIFIED FILES
- `[CREATE]` /path/to/new/file.ts
- `[MODIFY]` /path/to/updated/file.ts

## 3. ARCHITECTURE NOTES
- [Document any technical decisions, tradeoffs, or deviations from the roadmap]
- [E.g., "Used local state instead of context to reduce re-renders"]

## 4. VALIDATION TRACKING
- [x] Build passing
- [x] Lint passing
- [ ] Visual QA (if applicable)

## 5. GIT CHECKPOINT TRACKING
- **Commit Hash:** `[hash]`
- **Commit Message:** `feat(scope): description`

## 6. UNRESOLVED ISSUES & BLOCKERS
- [List any issues encountered]
- [List missing dependencies]

## 7. TODO CARRYOVERS
- [List tasks that belong to this batch but overflowed into the next session]
```
