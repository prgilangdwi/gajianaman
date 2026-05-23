# RUNTIME RECAP TEMPLATE
> STANDARDIZED FORMAT FOR SESSION PERSISTENCE (DUAL-SESSION ARCHITECTURE)

Every generated recap file must STRICTLY follow this markdown format.

```markdown
# Session Recap: Phase [XX] — [Batch Name]
**Date:** YYYY-MM-DD  
**Author:** Claude Code  
**Phase:** [XX] — [Phase Name]  
**Batch:** [YY] — [Batch Name]  
**Status:** ✅ COMPLETE / 🔄 IN PROGRESS / ❌ BLOCKED  

## 0. SESSION TYPE
- **Session Type:** Executor
- **Model Used:** claude-sonnet-4-6
- **Approved By:** Architect (YYYY-MM-DD)

---

## 1. IMPLEMENTATION LOGS
- [Brief description of action taken]
- [Brief description of action taken]

---

## 2. MODIFIED FILES
- `[CREATE]` /path/to/new/file.ts — [what it does]
- `[MODIFY]` /path/to/updated/file.ts — [what changed]

---

## 3. ARCHITECTURE NOTES
- [Document any technical decisions, tradeoffs, or deviations from the roadmap]
- [E.g., "Used local state instead of context to reduce re-renders"]
- [E.g., "Reused ChartInsight component rather than recreating — consistent pattern"]

---

## 4. VALIDATION TRACKING
- [x] Build passing (npm run build)
- [x] TypeScript strict — no errors in modified files
- [x] WCAG AAA maintained (prefers-reduced-motion, contrast, labels)
- [ ] Mobile tested (375px viewport)
- [ ] Console: no errors on affected pages
- [ ] Supabase mutations verified (if applicable)

---

## 5. GIT CHECKPOINT TRACKING
- **Commit Hash:** `[hash]`
- **Commit Message:** `feat(scope): description`
- **Files Modified:** [N] ([within / exceeded] anti-bloat limit)
- **Insertions:** [N] lines total

---

## 6. UNRESOLVED ISSUES & BLOCKERS
- [List any issues encountered during implementation]
- [List missing dependencies or blocked work]
- [None. if none]

---

## 7. TODO CARRYOVERS
- [Tasks that belong to this batch but could not be completed]
- [Phase X, Batch Y: specific carryover item]
- [None. if none]

---

## VERIFICATION CHECKLIST
- [ ] Pre-flight reads completed (roadmap, staging doc, runtime doc, latest recap)
- [ ] All batch tasks implemented per staging doc spec
- [ ] Build passes zero errors (npm run build)
- [ ] Recap created in aether/session-recaps/
- [ ] Commit created with conventional format
- [ ] Session stopped — awaiting Architect approval

---

## STATUS

[✅ COMPLETE / 🔄 IN PROGRESS / ❌ BLOCKED]

[One sentence summary of what was accomplished and what's next.]
```
