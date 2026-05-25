# RUNTIME PHASE 10: QA, Polish & Production Readiness
> EXECUTION PARAMETERS FOR THIS SPECIFIC PHASE

## 1. REFERENCES
- **Roadmap:** master-development-roadmap.md
- **Execution Plan:** phase-10-*.md

## 2. SCOPE BOUNDARIES
### 2.1 IMPLEMENTATION SCOPE
- Refer to Section 2.1 in phase-10-*.md for the exact IN-SCOPE items.

### 2.2 FORBIDDEN SCOPE
- Refer to Section 2.2 in phase-10-*.md for OUT-OF-SCOPE items.
- Any modification outside the explicit Touch List is an immediate failure.

## 3. EXACT WORKFLOW
1. Load 
untime-session-start-template.md.
2. Follow the Micro-Batch sequence defined in the Phase Execution plan.
3. Validate locally after each batch.
4. Execute Git Checkpoint.
5. Create Recap.
6. Stop session.

## 4. VALIDATION RULES
- **Build/Lint:** Must pass without warnings.
- **Phase Specific:** Must meet criteria defined in Section 7 of phase-10-*.md.

## 5. FIGMA INSPECTION SEQUENCE
- Trigger Figma MCP extraction strictly according to 
untime-figma-inspection.md rules if UI changes are required in this phase.

## 6. QA SEQUENCE
- Execute 
pm run build and 
pm run lint.
- Verify mobile viewport (375px) layout integrity.
- Check accessibility (contrast, ARIA) for new components.

## 7. GIT CHECKPOINT RULES
- Commit only after a fully successful Micro-Batch.
- Follow conventional commits mapping to the batch scope.

## 8. RECAP REQUIREMENTS
- Generate recap using 
untime-recap-template.md.
- File naming: YYYY-MM-DD-Phase10-Batch[X].md.

## 9. COMPLETION CONDITIONS
- All batches in phase-10-*.md are complete.
- Build is green.
- Final phase recap is committed.
