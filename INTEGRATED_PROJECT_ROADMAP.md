# Gajian Aman — Integrated Project Roadmap (Week 2-4)

## Executive Summary

Two parallel tracks are running for Gajian Aman:
1. **Track A: Code Refactoring** (Week 2) — ✅ **COMPLETE**
2. **Track B: Figma Design System Build** (Phases 5-10) — 🔄 **IN PROGRESS**

This document ensures zero overlap and captures all critical steps across both tracks.

---

## TRACK A: CODE REFACTORING — WEEK 2 (COMPLETE ✅)

### Status: FULLY COMPLETE

**Completion Date:** May 20, 2026  
**Duration:** 5 working days (Days 1-5)  
**Quality Gate:** ✅ PASSED (0 errors, 100% responsive)

### What Was Delivered

#### Pages Refactored (7/7)
- ✅ Overview.tsx (30+ token instances)
- ✅ Login.tsx (7 token instances)
- ✅ Pengeluaran.tsx (28 token instances)
- ✅ Riwayat.tsx (25 token instances)
- ✅ Tren.tsx (11 token instances)
- ✅ Budget.tsx (8 token instances)
- ✅ Goals.tsx (13 token instances)

#### Components Extracted (6/6)
- ✅ TransactionRow.tsx (8 instances)
- ✅ BudgetCard.tsx (16 instances)
- ✅ GoalCard.tsx (CSS vars)
- ✅ TrendChip.tsx (4 instances)
- ✅ WalletChips.tsx (3 instances)
- ✅ UpcomingBillsWidget.tsx (refactored, 4 instances)

#### Metrics Achieved
- **Design Token Coverage:** 135+ instances
- **Code Duplication Removed:** ~270 lines
- **Build Status:** 0 errors ✅
- **TypeScript Errors:** 0 ✅
- **Visual Regressions:** 0 ✅
- **Responsive Design:** 100% verified ✅

#### Documentation Created
1. DESIGN_TOKEN_USAGE_GUIDE.md — Complete utility reference
2. DAY4_VISUAL_REGRESSION_REPORT.md — Visual testing results
3. DAY6_RESPONSIVE_TESTING_REPORT.md — Responsive verification
4. WEEK2_FINAL_SUMMARY.md — Executive summary
5. PR_DESCRIPTION.md — Production-ready PR

### Next Action: Commit & Merge
```bash
git add frontend/src/app/pages/*.tsx frontend/src/app/components/*.tsx
git commit -m "feat: refactor design tokens across Tier-1 pages"
git push origin main
gh pr create --title "Design Token Refactoring" --body "$(cat PR_DESCRIPTION.md)"
```

---

## TRACK B: FIGMA DESIGN SYSTEM BUILD — PHASES 5-10

### Current Status: PLANNING PHASE

**Existing Documentation:**
- ✅ FIGMA_BUILD_EXECUTION_PHASE_5.md (Foundations)
- ✅ FIGMA_BUILD_EXECUTION_PHASE_6.md (Screen System)
- ⏳ Phase 7-10 (to be created)

**Timeline:**
- Phase 5-6: Week 1-3 (19 working days)
- Phase 7-10: Week 3-4 (pending definition)

---

## PHASE 5: CONTROLLED FIGMA EXECUTION — FOUNDATIONS

**Timeline:** Week 1-2 (9 working days)  
**Output:** Token library + 10 core components (variants ready, NOT screens)  
**Status:** ⏳ READY TO START

### Part 1: Figma File Setup & Token Architecture

**Step 1.1: Create Master File**
```
File Name: "Gajian Aman Design System v2.0"
Type: Design file
Location: Team workspace
Access: Design team + Engineer team (edit)

Pages to create (in order):
├── 📋 README
├── 🎨 Design Tokens
├── 🔧 Component Library
├── 🎬 Screens [EMPTY for now]
├── 🔄 Prototypes [EMPTY for now]
└── 📊 Design Documentation
```

**Step 1.2: Design Token Setup**
- Create color swatches (9-tone semantic palettes)
- Create Figma color styles: `semantic/[family]/[tone]`
- Families: Primary, Success, Warning, Danger, Neutral
- Total: ~40 color styles

**Step 1.3: Typography Setup**
- Install fonts: Inter, DM Mono
- Create text styles: `typography/[category]/[level]`
- Categories: heading, body, label, caption, mono
- Total: ~15 text styles

### Part 2: Create 10 Core Components

**Components to build:**
1. Button (primary, secondary, danger) + variants (size, state)
2. Card (default, elevated, outlined)
3. Input (text, email, number) + states (focus, error, disabled)
4. Badge (status, category)
5. Chip (filter, tag, removable)
6. Progress Bar (linear, circular)
7. Alert (info, success, warning, danger)
8. Tab Navigation
9. Modal Dialog
10. Bottom Navigation

**Per component requirement:**
- Variants for all states (default, hover, active, disabled, error, loading)
- Responsive sizes (sm, md, lg)
- Proper naming: `Component/variant/size`

**Deliverable:** 10 components × 3-8 variants each = ~50 total variants

### Success Criteria for Phase 5
- [ ] Master Figma file created and shared
- [ ] All 5 pages properly set up
- [ ] 40+ color styles created and documented
- [ ] 15+ text styles created and documented
- [ ] 10 components created with variants
- [ ] README page explains token naming and component usage
- [ ] No hardcoded colors (all use color styles)
- [ ] All components linked to design tokens
- [ ] Design team has reviewed and approved

---

## PHASE 6: SCREEN SYSTEM GENERATION

**Timeline:** Week 2-3 (10 working days)  
**Output:** 4 complete mobile screens + 3 state variants each (empty, loading, error)  
**Status:** ⏳ READY TO START (after Phase 5)

### Part 1: Screen System Architecture

**Step 1.1: Create screens page structure**
```
Page: "🎬 Screens"

Base screens (main states):
├── 01 Home Dashboard
├── 02 Transaction History
├── 03 Add Transaction
├── 04 Spending Analytics

State variants (per screen):
├── [Screen Name] - Loading
├── [Screen Name] - Empty
├── [Screen Name] - Error
```

**Total screens to create:** 4 base + (4 × 3 states) = **16 screens**

### Part 2: Mobile Canvas Setup

**Frame specifications (ALL screens):**
```
Width: 375px (iPhone SE baseline, smallest responsive target)
Height: 812px (iPhone 12 mini, accounting for safe areas)
Background: semantic/bg/default
Grid: 8px
Auto-layout: Vertical

Safe area accounting:
├── Status bar: 24px (top, reserved for OS)
├── Notch safe: 12px (top)
├── Content area: 375px × 740px
├── Home indicator: 34px (bottom)
└── Total device: 812px
```

### Part 3: Build 4 Screens

#### Screen 1: Home Dashboard (120px height estimated)
**Sections:**
- Status Bar Area (24px, OS reserved)
- Safe Area Top (12px, notch padding)
- Header Section (56px, sticky)
  - Title: "Gajian Aman"
  - Settings button
- Hero Metric Card (120px)
  - Current balance
  - Trend badge (+8.2%)
- Summary Cards Grid (96px, 2×2)
  - Income, Expense, Budget, Goals
- Recent Transactions (dynamic height)
- Floating Add Button (FAB)

#### Screen 2: Transaction History (dynamic height)
**Sections:**
- Header with search/filter
- Transaction list items
  - Category icon
  - Description
  - Amount
  - Date
- Empty state (for state variant)
- Loading skeleton (for state variant)

#### Screen 3: Add Transaction (responsive height)
**Sections:**
- Header: "Add Expense/Income"
- Form fields:
  - Amount input (numeric)
  - Category selector (dropdown with components)
  - Date picker
  - Notes field
- Action buttons:
  - Cancel
  - Save
- Image upload (receipt)

#### Screen 4: Spending Analytics (dynamic)
**Sections:**
- Period selector (month/year)
- Category breakdown (pie chart visualization)
- Spending by category (list)
- Trend chart (line/bar)
- Budget vs actual
- Insights/recommendations

### Success Criteria for Phase 6
- [ ] 16 screens created (4 base + 12 state variants)
- [ ] All use 375×812px frame dimensions
- [ ] All use 8px grid for alignment
- [ ] All components from library used (no custom shapes)
- [ ] All text uses typography styles
- [ ] All colors use color styles
- [ ] Loading state uses skeleton components
- [ ] Empty state has proper messaging
- [ ] Error state shows error UI
- [ ] Screens properly organized with naming
- [ ] Design team has reviewed prototypes
- [ ] Production-grade specifications exported

---

## PHASES 7-10: EXPANSION & HANDOFF (To Be Defined)

Based on Phase 5-6 completion, Phases 7-10 should cover:

### Phase 7: Responsive Variants & Desktop Screens
**Estimated timeline:** 1 week
**Outputs:**
- Tablet (768px) screen variants
- Desktop (1280px) screen variants
- Responsive component variants
- Layout adaptive systems

### Phase 8: Design-to-Code Bridge
**Estimated timeline:** 1 week
**Outputs:**
- Figma-to-React Code Connect mappings
- Component specifications
- Design token export to CSS
- CSS variable synchronization

### Phase 9: Documentation & Handoff
**Estimated timeline:** 3-4 days
**Outputs:**
- Design system documentation
- Component usage guide
- Design token reference
- Maintenance guidelines
- Team training materials

### Phase 10: CI/CD Integration & Version Control
**Estimated timeline:** 2-3 days
**Outputs:**
- Automated design token export
- CI/CD pipeline for design system
- Version control for Figma changes
- Sync strategy with code repository

---

## TRACK SYNCHRONIZATION MATRIX

### No Overlap Areas ✅

| Area | Code Track | Figma Track | Status |
|------|---|---|---|
| Design tokens | ✅ DONE (CSS vars) | 🔄 Building (Figma styles) | Parallel, complementary |
| Component extraction | ✅ DONE (React) | 🔄 Building (Figma) | 1:1 mapping potential |
| Color system | ✅ DONE (CSS) | 🔄 Building (styles) | Source of truth: Figma |
| Typography | ✅ DONE (Tailwind) | 🔄 Building (styles) | Sync in Phase 8 |
| Responsive design | ✅ DONE (code) | 🔄 Building (variants) | Phase 7 will define |
| Documentation | ✅ DONE (guide) | 🔄 Building (specs) | Separate deliverables |

### Sync Points (No Blocking Dependencies)

1. **After Phase 5 Complete:**
   - Code team has extracted components (DONE)
   - Figma team has created component library
   - ✅ No blocking — can happen in parallel

2. **After Phase 6 Complete:**
   - Code team ready to refactor screens (if needed)
   - Figma team has screen specifications
   - ✅ No blocking — informational only

3. **Phase 8 (Design-to-Code Bridge):**
   - Code Connect mapping from Figma components to React
   - Design token export to code
   - ✅ Critical sync point — requires both tracks complete

---

## INTEGRATED TIMELINE

### Week 2 (CURRENT)
**Code Track:** ✅ COMPLETE
- Days 1-5: Design token refactoring (DONE)
- Days 6-7: Documentation & PR (DONE)

**Figma Track:** 🔄 READY TO START
- Days 6-7-8-9: Phase 5 Part 1 (setup + tokens)
- Days 10-15: Phase 5 Part 2 (10 components)

### Week 3
**Code Track:** 📋 PENDING
- Days 1-3: PR review, merge, deploy
- Days 4-7: Tier-2 page refactoring (or Figma bridge prep)

**Figma Track:** 🔄 IN PROGRESS
- Days 1-5: Phase 5 completion + review
- Days 6-10: Phase 6 Screen system generation

### Week 4
**Code Track:** 📋 OPTIONAL
- Days 1-3: Figma-to-Code bridge (Phase 8)
- Days 4-5: Design system adoption

**Figma Track:** 🔄 IN PROGRESS
- Days 1-3: Phase 6 completion + review
- Days 4-5: Phase 7 (responsive variants)
- Days 6-7: Phase 8 (design-to-code bridge)
- Days 8-10: Phase 9-10 (documentation & CI/CD)

---

## CRITICAL SUCCESS FACTORS

### For Code Track (COMPLETED ✅)
- ✅ All Tier-1 pages refactored
- ✅ Design tokens applied consistently
- ✅ 0 build errors, 0 TypeScript errors
- ✅ 100% responsive design verified
- ✅ All documentation created
- ⏳ Ready for PR merge

### For Figma Track (STARTING)
- ⏳ Phase 5: Complete 10 components with full variants
- ⏳ Phase 6: Generate 16 screens with state variants
- ⏳ Phase 8: Create 1:1 mapping to React components
- ⏳ Design token export must match CSS variables
- ⏳ All team members trained on design system

### Integration Criteria
- ⏳ Design tokens in Figma match CSS variables in code
- ⏳ Component variants in Figma match React component props
- ⏳ Screen specifications match responsive breakpoints in code
- ⏳ Color styles match Tailwind design tokens

---

## NEXT IMMEDIATE ACTIONS

### This Session (May 20)
1. ✅ Complete Week 2 code refactoring
2. ✅ Create all documentation
3. 🔄 **Create this roadmap** (current file)
4. ⏳ **Commit documentation to git**

### Next Session (May 21+)
1. **Code Track:**
   - [ ] Create PR from Week 2 changes
   - [ ] Conduct code review
   - [ ] Merge to main
   - [ ] Deploy to production

2. **Figma Track:**
   - [ ] Create new Figma master file
   - [ ] Set up 6 pages
   - [ ] Create 40+ color styles
   - [ ] Create 15+ text styles
   - [ ] Start building 10 core components

### Parallel Execution
- Code team: PR review + merge (1-2 days)
- Figma team: Phase 5 execution (5-7 days)
- Both teams: Attend sync meetings (daily standups)

---

## DELIVERABLES CHECKPOINT

### Week 2 Code Track ✅ COMPLETE
- [x] 7 pages refactored
- [x] 6 components extracted
- [x] Design token guide created
- [x] Testing reports completed
- [x] PR description written
- [x] Build verified (0 errors)

### Phase 5 Figma Track ⏳ TODO
- [ ] Master Figma file created
- [ ] 5 pages set up
- [ ] 40+ color styles created
- [ ] 15+ text styles created
- [ ] 10 components with variants
- [ ] README documentation

### Phase 6 Figma Track ⏳ TODO
- [ ] 4 base screens created
- [ ] 12 state variant screens (3 per base)
- [ ] 16 screens total, properly named
- [ ] All screens use components from library
- [ ] Screen specifications documented

### Phase 8 (Bridge) ⏳ TODO (Week 4)
- [ ] Figma-to-React mappings created
- [ ] Design token export pipeline
- [ ] CSS variable synchronization
- [ ] Code Connect setup

---

## QUESTIONS & CLARIFICATIONS NEEDED

Before starting Phase 5, clarify with design team:

1. **Figma Workspace:** Where should the new file live? (Team, org, project?)
2. **Color Palette:** Use exact RGB from Phase 5 doc or adjust?
3. **Component Library:** Should Phase 5 components exactly match React components or design-only?
4. **Screen Mockups:** Level of detail for Phase 6? (Wireframe or pixel-perfect?)
5. **Responsive Variants:** Phase 7 scope — all sizes or just mobile + desktop?
6. **Export Strategy:** Automated token export or manual sync?

---

## CONCLUSION

**Status Summary:**
- ✅ Code refactoring (Week 2): COMPLETE & DOCUMENTED
- 🔄 Figma design system (Phases 5-10): READY TO START
- ⏳ Integration (Phase 8): PLANNED FOR WEEK 4
- 📋 Zero overlap: CONFIRMED

**Next step:** Start new chat with Phase 5 execution when ready.

---

**Document Created:** May 20, 2026  
**Prepared by:** Claude Code  
**Status:** READY FOR EXECUTION
