# PHASE 07: MOBILE-FIRST UX OPTIMIZATION
> [!IMPORTANT]
> **Duration:** 5-7 days
> **Dependencies:** Phase 06 complete
> **Owner:** Principal Product Design Architect

## 1. CROSS-REFERENCE TO MASTER ROADMAP
All UI optimizations in this phase must align with the "Mobile-first UX modernization plans" specified in the roadmap. We target smooth, native-like gesture interactions.

## 2. SCOPE BOUNDARIES

### 2.1 IN-SCOPE
- Transaction entry redesign (Quick-add, AI parsing flow, Photo parsing flow).
- TransactionModal split into `QuickAddSheet` + `DetailedAddModal`.
- Pre-filled data from recent transactions and context-aware category suggestions.
- Mobile gesture system implementation (Swipe actions, Pull-to-refresh).
- Bottom sheet for filters and secondary navigation.
- Long-press context menus.
- Responsive table → card list transformation for mobile.
- Form optimization (CurrencyInput auto-formatting, inline budget editing, category grid).
- Create mobile-specific components (`BottomSheet`, `SwipeAction`, `PullToRefresh`).
- Performance optimizations for mobile (lazy loading, passive listeners, viewport animations).

### 2.2 OUT-OF-SCOPE
- Desktop navigation/sidebar (Phase 03).
- Backend APIs or Database schema.

## 3. PRE-FLIGHT CHECKS
- [ ] Review Figma references (Awwwards Bottom Nav, QPay card layouts).
- [ ] Ensure framer-motion or similar library is installed for gesture detection.

## 4. IMPLEMENTATION SEQUENCE (MICRO-BATCHED)

### BATCH 1: Gestures & Primitives
1. Create `SwipeAction.tsx` for transaction rows (swipe left to delete, right to flag).
2. Create `BottomSheet.tsx` leveraging motion for snap points and swipe-to-dismiss.
3. Create `PullToRefresh.tsx` wrapper for lists.

### BATCH 2: Transaction Entry Flow
1. Build `CurrencyInput.tsx` to handle auto-formatting (e.g. 1500000 → Rp 1,500,000) on the fly.
2. Build `QuickAddSheet.tsx` (amount → category → confirm, max 3 taps).
3. Connect the new quick-add flow to the dashboard FAB.
4. Implement category selection grid (replaces dropdown).

### BATCH 3: Layouts & Forms
1. Refactor transaction tables to switch to a card list below 768px.
2. Implement inline budget editing.
3. Optimize scroll handlers (throttle/passive) and disable heavy animations on small viewports.

## 5. FILE TOUCH LIST
- `[CREATE]` `/frontend/src/components/mobile/SwipeAction.tsx`
- `[CREATE]` `/frontend/src/components/mobile/BottomSheet.tsx`
- `[CREATE]` `/frontend/src/components/mobile/PullToRefresh.tsx`
- `[CREATE]` `/frontend/src/components/forms/CurrencyInput.tsx`
- `[CREATE]` `/frontend/src/features/transactions/QuickAddSheet.tsx`
- `[MODIFY]` `/frontend/src/features/transactions/TransactionTable.tsx`
- `[MODIFY]` `/frontend/src/pages/Budget.tsx`

## 6. EXPECTED OUTPUTS
A fast, thumb-friendly mobile experience that rivals native iOS/Android apps in responsiveness and interaction quality.

## 7. VALIDATION STEPS
- Open Chrome DevTools, set device to iPhone 12, verify swipe-to-dismiss works on bottom sheets.
- Verify currency formatting applies correctly while typing.
- Verify pulling down on a list triggers the refresh indicator.

## 8. GIT COMMIT CHECKPOINTS
- `feat(mobile): add gesture primitives (SwipeAction, BottomSheet)`
- `feat(transactions): implement QuickAddSheet and CurrencyInput`
- `refactor(ui): convert tables to card lists on mobile`

## 9. ROLLBACK INSTRUCTIONS
1. `git revert` the changes.

## 10. SESSION RECAP TEMPLATE
(Use standard template from Phase 01)

## 11. ARCHITECTURE NOTES
For gestures, prioritize CSS scroll snap or native browser behavior before falling back to heavy JS simulation to ensure 60fps.

## 12. UI CONSISTENCY CHECKS
- All primary actions must be reachable in the bottom 40% of the screen.

## 13. MOBILE RESPONSIVENESS CHECKS
- Test thoroughly at 320px, 375px, 390px, 430px.

## 14. ACCESSIBILITY CHECKS
- Swiping actions must have a visible fallback (e.g., an edit/delete button or long-press menu).

## 15. TECHNICAL DEBT PREVENTION CHECKS
- Ensure passive event listeners on scroll events.

## 16. CLAUDE CODE SESSION BATCHES
Session 1: Mobile primitives.
Session 2: Transaction Quick Add.
Session 3: Tables and Forms.

## 17. FIGMA REFERENCE LINKS
- Awwwards Bottom Navigation (gestures).

## 18. DEPENDENCY OUTPUTS
Mobile primitives used by Phase 08 Wallet tools.
