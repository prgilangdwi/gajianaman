# PHASE 02: DESIGN SYSTEM & TOKEN ARCHITECTURE
> [!IMPORTANT]
> **Duration:** 5-7 days
> **Dependencies:** Phase 01 complete
> **Owner:** Principal Architect / Lead Frontend Engineer

## 1. CROSS-REFERENCE TO MASTER ROADMAP
All component primitives must adhere to the Design System Standards (Section 8 of Master Roadmap) and Figma Synchronization Rules (Section 9).

## 2. SCOPE BOUNDARIES

### 2.1 IN-SCOPE
- Redesign token architecture in `theme.css`.
- Implement responsive typography scale.
- Implement refined color system (brand, sentiment, category, neutral).
- Implement 6-level shadow system and simplified 4-level border radius.
- Implement spacing rules per component type.
- Implement dark mode token architecture.
- Create Component Primitive Layer (`ButtonBase`, `InputBase`, `CardBase`, `BadgeBase`, `ChipBase`).
- Create Utility Components (`ScreenStates`, `ErrorBoundary`).
- Create animation token system (spring presets, durations).
- Update `transitions.ts` with new motion tokens.
- Generate Figma sync documentation and token-to-code mapping document.

### 2.2 OUT-OF-SCOPE (DO NOT TOUCH)
- Page layouts and Navigation structure.
- Route definitions.
- Data fetching hooks and API integrations.
- Database operations.

## 3. PRE-FLIGHT CHECKS
- [ ] Phase 01 is merged to `develop`.
- [ ] `theme.css` has been audited.
- [ ] Review Figma References (QPay, Wise).

## 4. IMPLEMENTATION SEQUENCE (MICRO-BATCHED)

### BATCH 1: CSS Token Architecture
1. Rewrite `frontend/src/index.css` (or `theme.css`) to define CSS variables for Colors, Typography, Spacing, Shadows, Radius, and Z-Index.
2. Implement `@media (prefers-color-scheme: dark)` overrides.
3. Configure Tailwind config (`tailwind.config.js` or v4 CSS equivalent) to map these CSS variables to utility classes.

### BATCH 2: Typography & Motion
1. Define fluid typography logic if required, or strict breakpoints.
2. Add framer-motion custom variants into `frontend/src/lib/transitions.ts` using the new animation tokens.

### BATCH 3: Component Primitives (Inputs & Buttons)
1. Create `ButtonBase.tsx` supporting Primary, Secondary, Ghost, Danger variants and states (hover, active, disabled, loading).
2. Create `InputBase.tsx` including text, number, and currency formatting capabilities.

### BATCH 4: Component Primitives (Cards & Indicators)
1. Create `CardBase.tsx` with surface, elevated, and floating shadow variants.
2. Create `BadgeBase.tsx` for status and categories.
3. Create `ChipBase.tsx` for filter toggles (icon + label + close).

### BATCH 5: Utilities & States
1. Create `ErrorBoundary.tsx`.
2. Create `ScreenStates.tsx` (exports `LoadingState`, `ErrorState`, `EmptyState` components).

## 5. FILE TOUCH LIST
- `[MODIFY]` `/frontend/src/index.css`
- `[MODIFY]` `/frontend/tailwind.config.js` (if applicable)
- `[MODIFY]` `/frontend/src/lib/transitions.ts`
- `[CREATE]` `/frontend/src/components/ui/ButtonBase.tsx`
- `[CREATE]` `/frontend/src/components/ui/InputBase.tsx`
- `[CREATE]` `/frontend/src/components/ui/CardBase.tsx`
- `[CREATE]` `/frontend/src/components/ui/BadgeBase.tsx`
- `[CREATE]` `/frontend/src/components/ui/ChipBase.tsx`
- `[CREATE]` `/frontend/src/components/ui/ScreenStates.tsx`
- `[CREATE]` `/frontend/src/components/ErrorBoundary.tsx`
- `[CREATE]` `/aether/token-mapping.md`

## 6. EXPECTED OUTPUTS
A cohesive, WCAG AAA compliant set of CSS variables and primitive React components that will serve as the foundation for all UI restructuring in future phases.

## 7. VALIDATION STEPS
- Storybook (or a temporary test page) demonstrates all variants of `ButtonBase`.
- Dark mode toggle accurately flips background/text colors with appropriate contrast.
- `npm run build` succeeds.

## 8. GIT COMMIT CHECKPOINTS
- `feat(design): establish semantic token architecture in css and tailwind`
- `feat(ui): implement ButtonBase and InputBase primitives`
- `feat(ui): implement CardBase, BadgeBase, ChipBase`
- `feat(ui): add ErrorBoundary and ScreenStates`

## 9. ROLLBACK INSTRUCTIONS
1. Revert `index.css` and `tailwind.config.js`.
2. Delete new components from `src/components/ui/`.

## 10. SESSION RECAP TEMPLATE
(Use standard template from Phase 01)

## 11. ARCHITECTURE NOTES
We use raw CSS variables mapped to Tailwind configuration to allow for runtime theme switching (light/dark/custom). 

## 12. UI CONSISTENCY CHECKS
- Are button heights perfectly 44px on mobile, 40px on desktop?
- Do focus rings appear distinctly on keyboard navigation?

## 13. MOBILE RESPONSIVENESS CHECKS
- Touch targets must be >= 44x44px.

## 14. ACCESSIBILITY CHECKS
- Contrast ratios for brand colors evaluated (Primary Green requires dark text for AAA).

## 15. TECHNICAL DEBT PREVENTION CHECKS
- Ensure components extend native HTML attributes properly (e.g. `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>`).

## 16. CLAUDE CODE SESSION BATCHES
Session 1: Tokens and Tailwind config.
Session 2: Buttons and Inputs.
Session 3: Cards, Badges, Chips, Utilities.

## 17. FIGMA REFERENCE LINKS
- QPay Digital Wallet UI Kit (Spacing/Typography).
- Wise Design System (Accessibility/Interaction states).

## 18. DEPENDENCY OUTPUTS
Produces all foundational UI elements necessary for Phase 03+ layout construction.
