# IMPLEMENTATION SAFETY GOVERNANCE
> PROTECTING ARCHITECTURE, DESIGN, AND CONTEXT

## 1. FORBIDDEN REFACTORS
- **No Unprompted Global Renaming:** Do not rename core directories or context files unless specified in Phase 01/03.
- **No Library Swaps:** Do not replace `shadcn/ui`, `recharts`, or `framer-motion` with other libraries.
- **No Backend Modifications:** Python bot code and Supabase schemas are STRICTLY OUT OF SCOPE.

## 2. ARCHITECTURE DRIFT PREVENTION
- Ensure all new components are placed in the correct hierarchy (e.g., `src/components/ui` vs `src/features`).
- Use the established `theme.css` tokens. Hardcoded hex colors are a critical failure.
- Ensure state management follows existing patterns (Context API or Zustand) without introducing Redux or MobX.

## 3. UNRELATED EDITS PREVENTION
- If you see a typo in a file not listed in the current Phase's Touch List, IGNORE IT.
- Do not "fix" formatting in untouched files. Only format the files you modify.

## 4. ANTI-OVERENGINEERING RULES
- Implement exactly what is requested in the Phase document.
- Do not build generic, highly abstracted abstractions unless specifically requested (e.g., `CardBase` is requested; a generic `DynamicRenderEngine` is not).

## 5. ANTI-CONTEXT-EXPLOSION RULES
- Never request a recursive directory listing (`ls -R`) of `node_modules` or `.git`.
- If a file is over 1000 lines, only extract or modify the specific function needed. Do not rewrite the whole file just to change one line.

## 6. ANTI-DESIGN-DRIFT RULES
- Typography must snap to the exact scales defined in Phase 02.
- Spacing must strictly adhere to the 8px grid system.

## 7. VALIDATION ENFORCEMENT
- Code cannot be committed without a successful `npm run build`.
- If the build fails, the session must pivot to fixing the build immediately.

## 8. ROLLBACK ENFORCEMENT
- Every Git commit must represent a working state.
- If a session fails to produce a working state, invoke `git reset --hard` before exiting.
