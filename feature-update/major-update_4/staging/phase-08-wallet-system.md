# PHASE 08: WALLET & FINANCIAL TOOLS SYSTEM
> [!IMPORTANT]
> **Duration:** 5-7 days
> **Dependencies:** Phase 07 complete
> **Owner:** Principal Staff Engineer

## 1. CROSS-REFERENCE TO MASTER ROADMAP
This phase updates the specific utility pages, ensuring they utilize the primitives built in Phase 02 and the mobile interactions built in Phase 07.

## 2. SCOPE BOUNDARIES

### 2.1 IN-SCOPE
- Redesign `Wallet.tsx`: Total balance hero, drag-to-reorder, reconciliation UI, inter-wallet transfer.
- Redesign `Recurring.tsx`: Sections (Due soon/Paid/Future), Snooze/Pay actions, Import auto-detect.
- Redesign `SplitBill.tsx`: Equal split, settlement tracking, history.
- Redesign `CategoryBrowser.tsx`: Color palette picker, Emoji picker, Merge workflow.
- Redesign `Kalender.tsx`: Color-coded dots by amount, unified hover/click behavior.
- Redesign `Budget.tsx`: Inline editing, recommended chips, previous month comparisons.
- Redesign `Goals.tsx`: Countdown display, priority badges, checkpoints, celebration animation.

### 2.2 OUT-OF-SCOPE
- Core navigation, Dashboard, AI components.
- Database schema changes (must use existing tables).

## 3. PRE-FLIGHT CHECKS
- [ ] Phase 07 components (`CurrencyInput`, `BottomSheet`) are available.
- [ ] Install drag-and-drop library (e.g., `dnd-kit`) if not already present.

## 4. IMPLEMENTATION SEQUENCE (MICRO-BATCHED)

### BATCH 1: Wallet & Recurring
1. Refactor `Wallet.tsx` with a total balance hero card.
2. Implement wallet card sorting using `dnd-kit`.
3. Add reconciliation modal/flow.
4. Refactor `Recurring.tsx` utilizing the Phase 07 card list patterns.

### BATCH 2: Split Bill & Categories
1. Refactor `SplitBill.tsx` with split tracking and request payment features.
2. Refactor `CategoryBrowser.tsx`. Implement a visual color picker (12 standard colors) and an emoji picker.

### BATCH 3: Calendar, Budget, Goals
1. Update `Kalender.tsx` rendering to optimize dot scaling.
2. Implement inline editing for `Budget.tsx` and "Set to Average" logic.
3. Update `Goals.tsx` with milestone visualizers (progress bars) and confetti/celebration effects.

## 5. FILE TOUCH LIST
- `[MODIFY]` `/frontend/src/pages/Wallet.tsx`
- `[MODIFY]` `/frontend/src/pages/Recurring.tsx`
- `[MODIFY]` `/frontend/src/pages/SplitBill.tsx`
- `[MODIFY]` `/frontend/src/pages/CategoryBrowser.tsx`
- `[MODIFY]` `/frontend/src/pages/Kalender.tsx`
- `[MODIFY]` `/frontend/src/pages/Budget.tsx`
- `[MODIFY]` `/frontend/src/pages/Goals.tsx`
- `[CREATE]` `/frontend/src/components/wallet/ReconcileSheet.tsx`

## 6. EXPECTED OUTPUTS
A cohesive suite of financial tools with highly interactive, intuitive UIs.

## 7. VALIDATION STEPS
- Drag and drop a wallet card; confirm order is saved/reflected.
- Inline edit a budget amount; verify it saves instantly without a page reload.
- Mark a goal as 100% complete; verify celebration animation triggers.

## 8. GIT COMMIT CHECKPOINTS
- `feat(wallet): redesign wallet page and add drag-and-drop`
- `feat(tools): redesign recurring and split bill`
- `feat(tools): redesign categories and calendar`
- `feat(tools): redesign budget and goals pages`

## 9. ROLLBACK INSTRUCTIONS
1. `git checkout develop`
2. `git revert` the commits affecting the tools pages.

## 10. SESSION RECAP TEMPLATE
(Use standard template from Phase 01)

## 11. ARCHITECTURE NOTES
For drag-and-drop on mobile, ensure touch sensors are configured with an activation constraint (e.g., delay or distance) so that scrolling the page doesn't accidentally trigger a drag.

## 12. UI CONSISTENCY CHECKS
- All tools must use the standard `HeaderBar` established in Phase 03.

## 13. MOBILE RESPONSIVENESS CHECKS
- Calendar dots must remain visible and tappable on 320px screens.

## 14. ACCESSIBILITY CHECKS
- Drag and drop functionality must be accessible via keyboard arrows (supported by `dnd-kit`).

## 15. TECHNICAL DEBT PREVENTION CHECKS
- Avoid deeply nested state in the Budget calculator; use derived state where possible.

## 16. CLAUDE CODE SESSION BATCHES
Session 1: Wallet & Recurring.
Session 2: Split Bills & Categories.
Session 3: Calendar, Budgets & Goals.

## 17. FIGMA REFERENCE LINKS
- QPay Digital Wallet UI Kit.

## 18. DEPENDENCY OUTPUTS
All core features are now complete; leads into Phase 09 Performance optimizations.
