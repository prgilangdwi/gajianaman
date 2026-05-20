# RUNTIME MICRO SESSION TEMPLATE
> OPTIMIZING FOR LOW-CONTEXT DETERMINISTIC EXECUTION

## PURPOSE
To prevent Claude Code from analyzing the entire project unnecessarily. Use this template to constrain a session to a hyper-specific, isolated task.

## MICRO-SESSION RULES
1. **Zero Global Search:** Never use global grep or project-wide searches.
2. **Direct Targeting:** Open ONLY the files explicitly listed in the session scope.
3. **Minimal State:** Do not attempt to map the entire context tree of a component. If a component accepts `props`, just mock the `props` or trace only one level up.
4. **Fast Validation:** Validate the specific component in isolation if possible (e.g., via Storybook or a temporary route).

## CLAUDE PROMPT
***
**MICRO-SESSION EXECUTION**
Task: [Insert specific micro-task, e.g., "Implement ButtonBase variants"]
Target Files:
1. [File 1]
2. [File 2]

**Instructions:**
- Do not read any files other than the target files and their direct dependencies (max depth 1).
- Implement the requested feature exactly as specified in the Phase document.
- Generate the code, run standard linting on the modified files, and stop. Do not over-engineer.
***
