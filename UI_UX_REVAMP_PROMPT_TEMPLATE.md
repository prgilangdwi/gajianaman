# UI/UX Design Revamp Master Prompt Template

**Purpose:** Generate high-quality, error-minimizing design revamp prompts for GajianAman  
**Use Case:** Brief designers, developers, or AI assistants on complete design overhaul  
**Reference:** DESIGN_AUDIT_SUMMARY.md

---

## MASTER PROMPT TEMPLATE

### ✅ SECTION 1: PROJECT CONTEXT & VISION

Copy this section and fill in the `[BRACKETS]`:

```
PROJECT: [GajianAman Web Dashboard Redesign | Specific page name]
SCOPE: [Full app | Mobile-only | Desktop-only | Specific pages list]
TIMELINE: [Start date] → [End date] ([X weeks])
THEME: [Choose: Wellness | Power User | Banking App | Custom]
TARGET DEVICES: [Desktop 1280px+ | Mobile 375-430px | Tablet 768px+ | All]

VISION STATEMENT:
Transform GajianAman's UI/UX from [current state] to [desired state] by:
- [Key improvement 1 with metric]
- [Key improvement 2 with metric]
- [Key improvement 3 with metric]

SUCCESS CRITERIA:
✓ [Measurable outcome 1] (e.g., "Reduce Overview scroll depth from 4 screens → 2 screens")
✓ [Measurable outcome 2] (e.g., "Mobile tap-through rate increases 25%")
✓ [Measurable outcome 3] (e.g., "WCAG 2.1 AA compliance achieved")
```

---

### ✅ SECTION 2: CURRENT STATE DIAGNOSIS

Embed relevant findings from DESIGN_AUDIT_SUMMARY.md:

```
CURRENT PAIN POINTS (Priority-ordered):
🔴 CRITICAL:
  - [Issue 1: Overview information overload]
  - [Issue 2: Unclear CTA hierarchy]
  - [Issue 3: Weak mobile navigation]

🟡 MEDIUM:
  - [Issue 4: Chart density & legend placement]
  - [Issue 5: Wallet selector hidden]
  - [Issue 6: Transaction table not mobile-optimized]

🟢 NICE-TO-HAVE:
  - [Issue 7: Sidebar overflow on 1024px]
  - [Issue 8: AI Assistant buried]
  - [Issue 9: Settings scattered]

EXISTING STRENGTHS TO PRESERVE:
✓ Comprehensive Overview dashboard
✓ Strong data visualization (Recharts)
✓ Multi-wallet support & filtering
✓ Indonesian localization & dark mode
✓ Responsive design foundation
✓ shadcn/ui component library

CURRENT DESIGN SYSTEM (Reference):
- PRIMARY: Lime Green #4AE54A → [Refined to: _____]
- SIDEBAR: Forest Green #0D2818 → [Keep/Change: _____]
- FONTS: Manrope (headers) + Plus Jakarta Sans (body) → [Keep/Upgrade: _____]
- RADIUS: 20px border radius → [Keep/Refine: _____]
```

---

### ✅ SECTION 3: DESIGN REQUIREMENTS & CONSTRAINTS

```
MUST-HAVE (Non-negotiable):
□ Indonesian language UI (all labels)
□ Dark mode support (maintains current CSS var structure)
□ Mobile responsiveness (375px → 1920px)
□ Accessibility WCAG 2.1 AA minimum
□ No breaking changes to Supabase data fetching
□ Compatible with existing Tailwind + shadcn/ui setup
□ Category color system remains (but improved)

SHOULD-HAVE (High importance):
□ Reduce Overview scroll depth on mobile
□ Add persistent bottom navigation on mobile
□ Standardized component sizing (sm/md/lg)
□ Improved budget vs. actual visualization
□ Card-based transaction list (not table)
□ Wallet-centric layout option

NICE-TO-HAVE (Differentiators):
□ Micro-interactions (card hovers, loading states)
□ Animated charts (entry animations)
□ Haptic feedback cues (on mobile)
□ AI Assistant chat bubble (floating action)
□ Onboarding animations

TECHNICAL CONSTRAINTS:
- React 18 + TypeScript (no version changes)
- Tailwind CSS v4 (existing setup)
- shadcn/ui components (extend, don't replace)
- No new dependencies unless critical
- Vercel deployment (performance budget: 2.5s LCP)
- Mobile first approach required
```

---

### ✅ SECTION 4: DESIGN DIRECTION & SPECIFICATIONS

#### **4a. Visual Identity**

```
CHOSEN THEME: [Wellness | Power User | Banking App | Hybrid]

COLOR REFINEMENTS:
- Primary Green: [Keep #4AE54A | Change to: _____] 
  Rationale: [Reason for choice]
- Sidebar: [Keep #0D2818 | Change to: _____]
  Rationale: [Reason for choice]
- Accent: [New color family?] [Purpose]
- Category Colors: [Add icon system? Rename categories?]

TYPOGRAPHY CHANGES:
- Headlines: [Keep Manrope | Change to: _____]
- Body: [Keep Plus Jakarta Sans | Change to: _____]
- Monospace: [Keep DM Mono | Use for: _____ only]
- Size Scale: [Keep current | Adjust: _____]

SPACING & GRID:
- Baseline: [Keep 8px | Change to: _____]
- Max container width: [Keep current | Change to: _____]
- Card padding: [Define: sm=___, md=___, lg=___]

BORDER RADIUS:
- Keep 20px throughout | Vary by component: sm=___, md=___, lg=___ | Change to: _____
```

#### **4b. Component System**

```
COMPONENT HIERARCHY:

BUTTONS:
- Primary (filled, lime, desktop 48px / mobile 44px)
- Secondary (outlined, muted)
- Ghost (text-only)
- Danger (red fill)
- Icon-only (24px base)

CARDS:
- Summary Card (stat boxes): 180px × 140px (desktop), full-width (mobile)
- Content Card (feature): 100% width, variable height, 24px padding
- Transaction Card (list item): 100% width, 80px height, 16px padding
- Chart Card: 100% width, 320px height minimum

INPUTS:
- Text input: 40px height, 16px left padding, 12px font
- Select dropdown: 40px height, 16px left padding
- Date picker: 40px height, icon-right positioning
- Textarea: 100px minimum height, 16px padding

MODALS:
- Desktop: 90vw max width, centered, 24px padding
- Mobile: Full-width, from-bottom sheet, safe area padding

TABLES → CARDS:
- Convert all table views to card-based design on mobile
- Desktop: Keep table option with horizontal scroll
- Mobile: Full-width cards with swipe-to-delete
```

---

### ✅ SECTION 5: PAGE-BY-PAGE REVAMP SPECS

#### **Template for Each Page:**

```
PAGE: [Name] [Path]
PRIORITY: [Phase 1 | Phase 2 | Phase 3]
CURRENT STATE: [Brief description]
TARGET STATE: [Desired outcome]
KEY METRICS: 
  - [Metric 1: Current → Target]
  - [Metric 2: Current → Target]

DESIGN CHANGES:
□ [Change 1: What & Why]
□ [Change 2: What & Why]
□ [Change 3: What & Why]

LAYOUT (Desktop):
[ASCII wireframe or reference to Figma]

LAYOUT (Mobile):
[ASCII wireframe or reference to Figma]

COMPONENTS NEEDED:
- [Component A: Variant B]
- [Component C: Variant D]

INTERACTION FLOWS:
1. [User action] → [Expected outcome]
2. [User action] → [Expected outcome]

VALIDATION CHECKLIST:
□ Content fits without horizontal scroll (375px)
□ Touch targets ≥48px
□ Color contrast WCAG AA
□ Tap order logical
□ Back/dismiss always visible (mobile)
```

---

### ✅ SECTION 6: PHASED IMPLEMENTATION ROADMAP

```
PHASE 1: FOUNDATION & CORE PAGES [Weeks 1-3]
Goal: Redesign high-impact pages; establish design system

🎯 DELIVERABLES:
  □ Component library (Figma or coded)
    - Buttons (all variants)
    - Cards (all sizes)
    - Inputs (all types)
    - Modals (desktop + mobile)
    - Navigation patterns
  
  □ Design tokens (updated theme.css)
    - Color variables (refined palette)
    - Typography scale
    - Spacing scale
    - Border radius variants
  
  □ Redesigned pages (high-fidelity)
    - /overview (Dashboard) [HIGHEST PRIORITY]
    - /budget (Budget tracking)
    - /riwayat (Transaction history)
  
  □ Mobile navigation
    - Bottom tab bar (Home, Add, Analytics, Wallet, Profile)
    - Improved drawer menu
  
  □ Accessibility baseline
    - Color contrast audit
    - Focus state design
    - Alt text templates

📋 DELIVERABLE CHECKLIST:
  □ Figma design file (components + pages)
  □ Updated theme.css with new tokens
  □ Component migration guide (which old → new)
  □ Mobile navigation spec (dimensions, interactions)
  □ Accessibility report (contrast, focus, keyboard nav)

🔍 VALIDATION:
  □ Design system completeness (all used components covered)
  □ Mobile responsiveness tested (375px, 768px, 1920px)
  □ Color contrast verified (WCAG AA)
  □ Peer design review (design team or stakeholders)

---

PHASE 2: MOBILE OPTIMIZATION [Weeks 4-5]
Goal: Optimize all pages for mobile-first experience

🎯 DELIVERABLES:
  □ Bottom navigation implementation
    - Persistent positioning
    - Active state styling
    - Touch-friendly sizing (48px+ buttons)
  
  □ Card-based redesigns (mobile)
    - Riwayat (table → cards with swipe actions)
    - Pengeluaran (category breakdown → card grid)
    - Budget (progress bars → card layout)
  
  □ Progressive disclosure patterns
    - Expandable cards
    - Modal drilldown
    - Lazy-loaded charts
  
  □ Touch interactions
    - Swipe-to-delete
    - Long-press for more options
    - Pull-to-refresh (if needed)
  
  □ Mobile-specific pages
    - Optimized Overview (2-screen max)
    - Quick-add modal (prominent, easy)
    - Wallet quick-switch (chips, not dropdown)

📋 DELIVERABLE CHECKLIST:
  □ Updated Figma (all mobile layouts)
  □ Interaction specs (swipes, taps, animations)
  □ Touch target verification (48px minimum)
  □ Performance optimization (chart rendering < 500ms)
  □ Mobile usability test results (feedback from 3-5 users)

🔍 VALIDATION:
  □ Tested on actual devices (iPhone + Android)
  □ Scroll depth measured (≤3 screens)
  □ Form filling tested (time to complete)
  □ Chart readability at 375px verified
  □ Accessibility re-tested on mobile

---

PHASE 3: SECONDARY FEATURES & REFINEMENT [Weeks 6-7]
Goal: Polish detail pages and advanced features

🎯 DELIVERABLES:
  □ Secondary page redesigns
    - /laporan (Reports with new layout)
    - /tren (Trends with improved charts)
    - /goals (Goals with circular progress)
    - /categories (Category browser with search)
  
  □ Advanced feature polish
    - Smart Alerts (exit stub, finalize design)
    - Recurring Bills (improve prominence)
    - AI Assistant (chat bubble implementation)
    - Split Bill (if high priority)
  
  □ Consistency pass
    - Verify all pages use new design system
    - Update stub pages (out-of-date content)
    - Standardize spacing & alignment
  
  □ Animation & micro-interactions
    - Page transitions
    - Loading states
    - Hover effects
    - Success/error animations

📋 DELIVERABLE CHECKLIST:
  □ Figma file fully updated (all pages)
  □ Micro-interaction specs (duration, easing)
  □ Animation guidelines (when to use, which library)
  □ Dark mode re-tested (theme switching)
  □ Responsive tested at all breakpoints

🔍 VALIDATION:
  □ Full design system audit
  □ Consistency checklist (colors, spacing, typography)
  □ A/B test results (if running variants)
  □ User feedback (usability testing round 2)
  □ Performance profiling (no regressions)

---

PHASE 4: HANDOFF & LAUNCH [Week 8]
Goal: Prepare for development; establish implementation process

🎯 DELIVERABLES:
  □ Implementation guide
    - Component usage documentation
    - CSS variable mapping
    - Token substitution guide
    - Tailwind class conventions
  
  □ Developer handoff
    - Figma specs (measurements, colors, fonts)
    - Code snippets (example components)
    - Accessibility checklist
    - QA testing script
  
  □ Changelog documentation
    - What changed & why
    - Migration path (old component → new)
    - Breaking changes (none expected)
    - Deprecation timeline
  
  □ Launch checklist
    - Visual regression testing (Chromatic, Percy, etc.)
    - Accessibility audit (full WCAG 2.1 AA)
    - Performance testing (Lighthouse)
    - Browser/device testing matrix

📋 DELIVERABLE CHECKLIST:
  □ Implementation guide (design → code)
  □ Component storybook or reference (if using shadcn)
  □ QA testing plan (pages × devices)
  □ Accessibility report (final)
  □ Performance baseline (Lighthouse, CLS, LCP)

🔍 VALIDATION:
  □ Developer review (can they implement from specs?)
  □ QA walkthrough (test cases defined)
  □ Accessibility audit signed off
  □ Stakeholder sign-off (design approved)
  □ Ready for staging environment test
```

---

### ✅ SECTION 7: ERROR PREVENTION CHECKLIST

Use this before starting design work:

```
REQUIREMENTS CLARITY:
□ THEME chosen and documented ([Wellness/Power User/Banking App])
□ Scope defined (which pages, which devices)
□ Success metrics written (measurable, not vague)
□ Timeline realistic (account for review cycles)
□ Stakeholders identified (who approves each phase)

TECHNICAL ALIGNMENT:
□ Current tech stack confirmed (React 18, Tailwind v4, shadcn/ui)
□ Constraints documented (no new dependencies? Version locks?)
□ Supabase schema reviewed (no UI changes requiring backend work)
□ Mobile breakpoints confirmed (375px minimum)
□ Browser support defined (which versions to test)

DESIGN CONSISTENCY:
□ Current design system exported (theme.css, colors, fonts)
□ Color palette refined & contrast-checked
□ Typography scale tested on mobile
□ Spacing scale defined (baseline unit: 4px / 8px / 16px)
□ Component inventory completed (what exists, what's missing)

MOBILE-FIRST APPROACH:
□ Mobile-first wireframes created (375px first, scale up)
□ Bottom navigation specs written (if adopting)
□ Touch targets verified (≥48px)
□ Scroll depth limited (≤3 screens max)
□ Chart readability tested at 375px

ACCESSIBILITY SAFEGUARDS:
□ WCAG 2.1 AA as minimum standard
□ Color contrast tool bookmarked (WebAIM, WAVE)
□ Focus state designs in wireframes
□ Icon + text for all category colors (not color-only)
□ Form labels associated (not floating)
□ Dark mode design included (not afterthought)

STAKEHOLDER ALIGNMENT:
□ Design direction approved (before Figma work starts)
□ Budget for revamp allocated (design time, dev time, testing)
□ Timeline agreed (phases, milestones, reviews)
□ Approval process defined (who signs off, by when)
□ Success metrics shared (all team understands goals)

HANDOFF PLANNING:
□ Developer assigned (familiar with React + Tailwind)
□ QA process defined (manual + automated testing)
□ Rollout plan (staged rollout, feature flags?)
□ Fallback plan (if issues arise, how to revert)
□ Monitoring plan (track success metrics post-launch)
```

---

### ✅ SECTION 8: PROMPT QUALITY VALIDATION

Before sending prompt to designer/team, verify:

```
PROMPT CONTENT VALIDATION:
□ Is the vision statement clear & inspiring?
  Weakness: Vague language ("improve UX", "make better")
  Strength: Specific outcomes ("reduce Overview scroll from 4 → 2 screens")

□ Are pain points prioritized by business impact?
  Weakness: All issues weighted equally
  Strength: 🔴 Critical → 🟡 Medium → 🟢 Nice-to-have

□ Are constraints documented (tech, time, resources)?
  Weakness: "Use Tailwind" without specifying version
  Strength: "Tailwind CSS v4, shadcn/ui, no new dependencies"

□ Is the roadmap realistic for timeline?
  Weakness: 25 pages redesigned in 2 weeks
  Strength: Phase 1 (3 critical pages) + Phase 2 (mobile) + Phase 3 (secondary) in 8 weeks

□ Are deliverables measurable?
  Weakness: "Create beautiful design"
  Strength: "WCAG 2.1 AA compliant, 375px → 1920px responsive, <3 screens scroll depth"

□ Is mobile-first approach explicit?
  Weakness: "Responsive design"
  Strength: "Mobile-first: design 375px, then scale desktop. Bottom nav required on mobile."

□ Are accessibility requirements non-negotiable?
  Weakness: "Accessibility nice-to-have"
  Strength: "WCAG 2.1 AA compliance required. No color-only indicators. Focus states designed."

TONE & CLARITY:
□ Is language specific (not generic design advice)?
□ Are examples from THIS project included (not generic tips)?
□ Are checklists actionable (not aspirational)?
□ Is the structure scannable (sections, bullets, checkboxes)?
□ Is length appropriate (detailed but not overwhelming)?
  Target: 2,000-3,000 words for full redesign
  Target: 500-800 words for single-page redesign

USABILITY:
□ Can a designer follow this without asking questions?
□ Can a developer implement from this (with Figma)?
□ Can QA test against this (clear acceptance criteria)?
□ Can stakeholders verify success (metrics defined)?
```

---

## EXAMPLE: FILLED PROMPT (OVERVIEW PAGE ONLY)

```
PROJECT: GajianAman Overview Dashboard Redesign
SCOPE: /overview page (highest-traffic, most critical)
TIMELINE: 2 weeks
THEME: Banking App (familiar patterns, wallet-centric)
TARGET DEVICES: Desktop 1280px+, Mobile 375-430px, Tablet 768px+

VISION STATEMENT:
Transform the Overview dashboard from an information-dense, chart-heavy layout to a 
card-based, wallet-first design that surfaces key financial health metrics at a glance 
and requires minimal scrolling on mobile.

SUCCESS CRITERIA:
✓ Mobile scroll depth: 4 screens → 2 screens (50% reduction)
✓ Time-to-primary-metric: <1 second (metric visible above fold)
✓ Accessibility: WCAG 2.1 AA compliance on colors, contrast, focus states
✓ Mobile usability: 5/5 test users complete primary task (view balance) without scrolling

---

CURRENT PAIN POINTS:
🔴 CRITICAL:
  - Too many charts & widgets (6+) causing scroll fatigue on mobile
  - Income/Expense area chart + bar chart + category pie chart = visual clutter
  - No clear visual hierarchy (all cards same size/weight)

🟡 MEDIUM:
  - Wallet selector hidden in dropdown (should be prominent tabs)
  - Upcoming bills widget position inconsistent
  - Chart legends positioned inline (taking space)

🟢 NICE-TO-HAVE:
  - Add motivational copy (financial health messaging)
  - Animate chart entries (Recharts supports this)

---

MUST-HAVE REQUIREMENTS:
□ Responsive: 375px → 1920px without horizontal scroll
□ Dark mode: Keep existing CSS var system, test both themes
□ Accessibility: ≥4.5:1 contrast, no color-only indicators, keyboard navigable
□ No backend changes (data fetching via existing useTransactions hook)
□ Indonesian labels throughout

---

DESIGN SPECIFICATIONS:

COLOR:
- Primary (lime): Keep #4AE54A (for balance "positive" indicator)
- Sidebar: Keep #0D2818 (background consistent)
- Accent: Add #DCFCE7 (light green) for card highlights

TYPOGRAPHY:
- Keep Manrope (headers), Plus Jakarta Sans (body)
- Heading: 28px (h1), 20px (h2), 16px (h3)

SPACING:
- Card padding: 24px
- Section margin: 32px
- Grid gap: 16px

COMPONENTS:
- Summary Cards (3-column on desktop, 1-column on mobile)
  Desktop: 280px × 140px, 24px padding
  Mobile: 100% width, 80px height, 16px padding

- Wallet Tabs
  Desktop: Horizontal chips at top
  Mobile: Horizontal scroll, sticky at top

- Chart Container
  Desktop: 60% width, 320px height
  Mobile: 100% width, 240px height

---

LAYOUT (DESKTOP):
[Wallet tabs at top]
[Summary cards: 3-column grid]
[Charts section: 2-column (primary chart + upcoming bills)]
[Recent transactions: Full width below]
[Optional: Footer with export button]

LAYOUT (MOBILE):
[Wallet tabs at top, horizontally scrollable]
[Summary cards: 1-column stack]
[Primary chart only: Full width, 240px height]
[Upcoming bills: Card below]
[Recent transactions: Card view below]
[Optional: Scroll-to-see more indicator]

---

INTERACTION FLOWS:
1. Load → Show skeleton loaders (all cards) → Fade in when data ready
2. Switch wallet → Chart updates immediately, summary recalculates, scroll to top
3. Hover summary card → Subtle background change (desktop only)
4. Tap chart (mobile) → Expand to modal with full view
5. Scroll to bottom → Recent transactions auto-load next page (pagination)

---

VALIDATION:
□ Tested at 375px width (no overflow)
□ Tested at 768px (tablet layout)
□ Tested at 1440px (desktop)
□ Touch targets ≥48px (mobile buttons)
□ Color contrast ≥4.5:1 (WCAG AA)
□ Focus state visible (tab through all interactive elements)
□ Screen reader tested (chart alt text, card labels)
□ Dark mode verified (all colors render correctly)
□ Performance: Chart renders <500ms

---

PHASE 1 DELIVERABLES (Week 1):
□ Figma file (wireframes + high-fidelity)
  - Desktop layout (1440px)
  - Mobile layout (375px)
  - Component variants (loading, empty, error states)
  - Dark mode theme

□ Component specifications
  - Summary Card (dimensions, padding, shadow, hover state)
  - Wallet Tabs (sizing, spacing, active state)
  - Chart Container (height, legend position, responsive behavior)
  - Recent Transactions Card (list view, variant comparison)

□ Accessibility specs
  - Color contrast report (all colors verified WCAG AA)
  - Focus state design (visible outline style & color)
  - Alt text for charts (example provided)
  - Form labels (if wallet selector includes search)

PHASE 2 DELIVERABLES (Week 2):
□ Developer handoff
  - Updated theme.css (new color variables if any)
  - Component usage guide (which shadcn components to use)
  - Responsive breakpoint specs (when layout shifts)
  - Animation specs (entry, hover, transition durations)

□ QA testing script
  - Test cases by device (mobile, tablet, desktop)
  - Accessibility checklist (contrast, focus, keyboard nav)
  - Browser matrix (Chrome, Safari, Firefox on desktop/mobile)
  - Performance benchmark (Lighthouse score target: 90+)

□ Launch checklist
  - Visual regression test (pixel-perfect on target devices)
  - A/B test setup (old vs. new layout)
  - Metrics collection (time-on-page, scroll depth, feature adoption)
```

---

## HOW TO USE THIS TEMPLATE

### For Designers:
1. **Copy Section 1-4** (Context, Current State, Requirements, Design Direction)
2. **Fill in [BRACKETS]** with your specific choices
3. **Add Section 5** (Page-by-page specs for your target pages)
4. **Fill out Section 6** (Roadmap tailored to your timeline)
5. **Run Section 7** (Error prevention checklist before starting Figma)

### For Project Managers:
1. **Use Sections 1, 2, 6, 8** (Vision, Pain Points, Roadmap, Validation)
2. **Print Section 7** (Error Prevention) as stakeholder alignment checklist
3. **Create Gantt from Section 6** (Phase timeline)

### For Developers/QA:
1. **Reference Sections 3, 4, 5** (Constraints, Specs, Page Details)
2. **Use Section 7** (Error Prevention) to catch underspecified designs
3. **Build QA plan from Section 6** (Phase 4 deliverables)

### For AI/Claude Prompts:
1. **Paste Sections 1-5** into Claude to generate Figma mockups
2. **Use Section 8** to validate Claude's output (is it addressing all pain points?)
3. **Reference the example** (how detailed specs look) for follow-up prompts

---

**End of Master Template**  
Save this file. Customize it for each major design revamp you undertake.
