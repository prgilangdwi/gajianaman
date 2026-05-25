# RUNTIME SESSION END TEMPLATE
> COPY AND PASTE THIS EXACT PROMPT TO CLAUDE CODE AT THE END OF A SESSION

***

**SYSTEM TERMINATION:** Project AETHER Session End.

Please perform the following wrap-up tasks:
1. **SUMMARIZE WORK:** Write a concise paragraph detailing exactly what was built, fixed, or modified in this session.
2. **LIST MODIFIED FILES:** Provide an exact list of all files that were created, updated, or deleted.
3. **VALIDATION RESULTS:** Confirm the status of `npm run build` and `npm run lint`. Confirm visual QA was performed if applicable.
4. **UNRESOLVED ISSUES / TECH DEBT:** List any blockers, bugs, or technical debt introduced that must be addressed in a future session.
5. **GIT CHECKPOINT:** Confirm that all changes have been committed using conventional commit formats. List the commit hash acting as the rollback point.
6. **CREATE RECAP:** Generate a markdown file in `aether/session-recaps/` named `YYYY-MM-DD-Phase[XX]-Batch[Y].md` using the exact structure specified in `runtime-recap-template.md`.
7. **RECOMMEND NEXT SESSION:** Briefly state what the immediate next session should focus on according to the Phase documentation.

Execute these steps now and conclude the session.
