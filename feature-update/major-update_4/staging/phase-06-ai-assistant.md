# PHASE 06: AI ASSISTANT & INTELLIGENCE LAYER
> [!IMPORTANT]
> **Duration:** 5-7 days
> **Dependencies:** Phase 05 complete
> **Owner:** Principal AI System Architect

## 1. CROSS-REFERENCE TO MASTER ROADMAP
This phase handles the intelligence layer modernization, specifically adhering to the "Multi-turn AI chat assistant with memory" requirement. 

## 2. SCOPE BOUNDARIES

### 2.1 IN-SCOPE
- Complete `Asisten.tsx` redesign into a multi-turn chat interface.
- Implement user/AI message bubbles (`ChatBubble`).
- Implement typing indicators for API calls.
- Implement markdown formatting for AI responses.
- Implement suggested follow-up questions and contextual action buttons.
- Setup local conversation history storage (last 10 conversations).
- Create `InsightsPage.tsx` under the Home section for proactive insights.
- Enhance SmartAlerts (unusual spending, threshold settings, snoozing).
- Coordinate minor backend enhancements (e.g., passing context for multi-turn).

### 2.2 OUT-OF-SCOPE
- Prompt engineering for the Claude Haiku backend API (only UI/payload formatting here, backend modifications are limited to payload structures).
- Navigation and Dashboard layouts.

## 3. PRE-FLIGHT CHECKS
- [ ] Phase 03 routing is stable.
- [ ] Ensure markdown parser library (e.g. `react-markdown`) is installed.

## 4. IMPLEMENTATION SEQUENCE (MICRO-BATCHED)

### BATCH 1: Chat UI Fundamentals
1. Create `ChatBubble.tsx` (differentiates between `user` and `assistant`).
2. Create `TypingIndicator.tsx`.
3. Create the input area with submit button and attachment (if applicable) functionality.

### BATCH 2: Asisten Page Assembly
1. Refactor `Asisten.tsx` to use the full-screen layout.
2. Implement conversation state management (React Context or Zustand) to store current and past chats.
3. Integrate `react-markdown` to parse AI output.
4. Add quick action chips below AI responses based on specific JSON payloads from the backend.

### BATCH 3: Proactive Insights
1. Create `InsightsPage.tsx` and integrate it into the `Home` tier navigation.
2. Implement `InsightCard.tsx` mapping to AI-generated insights (achievements, alerts, opportunities).
3. Enhance the `SmartAlerts` component logic.

## 5. FILE TOUCH LIST
- `[CREATE]` `/frontend/src/components/chat/ChatBubble.tsx`
- `[CREATE]` `/frontend/src/components/chat/TypingIndicator.tsx`
- `[MODIFY]` `/frontend/src/pages/Asisten.tsx`
- `[CREATE]` `/frontend/src/pages/InsightsPage.tsx`
- `[CREATE]` `/frontend/src/components/ui/InsightCard.tsx`
- `[MODIFY]` `/frontend/src/hooks/useAI.ts` (or similar)
- `[MODIFY]` `/package.json` (add react-markdown)

## 6. EXPECTED OUTPUTS
A premium, conversational AI experience that remembers context, formats responses beautifully, and triggers actionable UI elements.

## 7. VALIDATION STEPS
- Type a message, verify typing indicator appears while awaiting response.
- Verify markdown (bold, lists, code) renders correctly in the `ChatBubble`.
- Verify clearing history resets the UI and storage.

## 8. GIT COMMIT CHECKPOINTS
- `feat(chat): implement chat UI primitives and markdown parser`
- `feat(ai): refactor Asisten to multi-turn chat with history`
- `feat(insights): build InsightsPage and proactive alert cards`

## 9. ROLLBACK INSTRUCTIONS
1. Revert `package.json` if `react-markdown` breaks builds.
2. Delete new `/chat/` components.

## 10. SESSION RECAP TEMPLATE
(Use standard template from Phase 01)

## 11. ARCHITECTURE NOTES
State for chats will be stored in `localStorage` initially for quick retrieval, matching the "last 10 conversations" requirement. 

## 12. UI CONSISTENCY CHECKS
- Ensure chat bubbles use `surface-secondary` for AI and `brand-primary` for User.

## 13. MOBILE RESPONSIVENESS CHECKS
- Chat input must stay attached to the virtual keyboard on mobile devices. (Test with `dvh` or `env(safe-area-inset-bottom)`).

## 14. ACCESSIBILITY CHECKS
- Focus must return to the input field after sending a message.

## 15. TECHNICAL DEBT PREVENTION CHECKS
- Ensure the markdown parser sanitizes HTML to prevent XSS.

## 16. CLAUDE CODE SESSION BATCHES
Session 1: Chat UI.
Session 2: Asisten integration and state.
Session 3: InsightsPage.

## 17. FIGMA REFERENCE LINKS
- Reference typical AI chat UI patterns.

## 18. DEPENDENCY OUTPUTS
The AI action buttons will trigger modals/pages built in other phases.
