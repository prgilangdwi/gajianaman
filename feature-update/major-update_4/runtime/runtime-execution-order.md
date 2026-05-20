# RUNTIME EXECUTION ORDER
> MASTER SEQUENCING FOR PROJECT AETHER

## 1. THE EXECUTION HIERARCHY
This file defines the exact order in which runtime files and execution templates must be invoked.

### STEP 1: INITIALIZATION
When starting a completely new workday or picking up after a long break:
1. Load `runtime-session-start-template.md`.
2. Read the latest file in `session-recaps/` to establish context.
3. Determine the current active Phase.

### STEP 2: PLANNING THE MICRO-SESSION
1. Identify the next Batch within the current Phase Execution file (`phase-XX-*.md`).
2. Load `runtime-micro-session-template.md` to scope the exact tasks for this session.
3. Review `runtime-safety-governance.md` to ensure the planned work violates no rules.

### STEP 3: EXECUTION (THE LOOP)
1. If UI work is required: Load `runtime-figma-inspection.md` and execute Figma MCP extraction.
2. Implement code.
3. Validate locally (Build, Lint, UI consistency).

### STEP 4: CLOSING THE SESSION
When the batch is complete or context limits are approaching (3-5 files modified):
1. Run QA procedures defined in `claude-global-runtime-system.md`.
2. Commit to Git.
3. Load `runtime-session-end-template.md`.
4. Generate the recap using `runtime-recap-template.md`.
5. Terminate the session to flush context.

## 2. PHASE DEPENDENCY ORDER
Phases MUST be executed sequentially. No parallel phase execution.
- Phase 01: Foundation
- Phase 02: Design System
- Phase 03: Navigation
- Phase 04: Dashboard
- Phase 05: Analytics
- Phase 06: AI Assistant
- Phase 07: Mobile UX
- Phase 08: Wallet System
- Phase 09: Performance
- Phase 10: QA Polish

## 3. WHEN TO INVOKE SPECIFIC PROTOCOLS

**Invoke Validation:**
- After completing a component.
- Before committing to Git.

**Invoke Figma MCP Inspection:**
- At the start of Phase 02 (Tokens).
- When building new primitives (Phase 02).
- When restructuring layouts (Phase 03, 04, 07).

**Invoke Git Checkpoint:**
- ONLY when tests and build pass.
- At the end of every completed Batch.

**Create Recaps:**
- MANDATORY at the end of every session, before termination.
