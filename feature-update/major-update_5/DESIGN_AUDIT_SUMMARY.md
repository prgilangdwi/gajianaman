# GajianAman UI/UX Design Audit & Revamp Summary

**Project:** GajianAman — Personal Finance Tracker for Indonesian Users  
**Audit Date:** May 2026  
**Target Markets:** Desktop (1280px+) & Mobile Web (320px+)

---

## 1. Current App Overview

### Purpose
GajianAman is a bilingual personal finance tracker designed specifically for Indonesian salaried workers and freelancers. Users log income, expenses, and savings through:
- **Telegram Bot** (primary input) — commands, text parsing, receipt photo upload
- **Web Dashboard** (analytics & planning) — visualization, budgeting, goal tracking

### Core User Journey
1. **Input** (Bot) → Log transaction via `/add`, `/income`, or photo upload
2. **Visualize** (Web) → View overview, spending breakdown, trends
3. **Plan** (Web) → Set budgets, goals, track progress

---

## 2. Navigation Architecture

### Desktop Navigation (Sidebar-based)
**Layout:** Fixed left sidebar (dark forest green) + main content area

**Nav Groups:**
1. **Top Section**
   - Overview (Home dashboard)
   - Gajian (Salary tracker & setup)

2. **Keuangan (Finance)**
   - Pengeluaran (Spending breakdown)
   - Budget (Monthly budgets by category)
   - Goals (Savings goals)
   - Riwayat (Transaction history)

3. **Analitik (Analytics)**
   - Laporan (Monthly reports)
   - Pola Waktu (Spending patterns)
   - Prakiraan (Forecasting)
   - Tren (3-month trends)

4. **Alat (Tools)**
   - Kategori (Category browser)
   - Dompet (Wallet management)
   - Kalender (Calendar view)
   - Asisten (AI assistant)

5. **Lainnya (Other)**
   - Berulang (Recurring bills)
   - Langganan (Subscription management)
   - Profil (Profile & settings)

### Mobile Navigation
- Hamburger menu toggle
- Bottom sticky nav (primary actions)
- Collapsible drawer (full menu)

---

## 3. Core Pages & Features

### Dashboard Pages

#### **Overview** (Main Dashboard)
**Current UX:**
- Summary cards: Income, Expenses, Balance (with trending indicators)
- Wallet selector dropdown (if multiple wallets)
- Income vs. Expense area chart
- Daily spending bar chart
- Upcoming bills widget (recurring transactions)
- Budget progress bars (top 3 categories)
- Recent transactions list
- Export to PDF button

**Key Insights:**
- Comprehensive at-a-glance view
- Multiple charts on one page (possible desktop bloat)
- Mobile responsiveness critical

#### **Pengeluaran** (Spending Breakdown)
- Category-wise spending summary
- Pie/donut chart by category
- Drilldown to category detail
- Category color-coded badges

#### **Budget**
- Monthly budget vs. actual by category
- Progress bars with visual indicators
- Budget setting modal
- Category-based filtering

#### **Goals**
- Savings goal cards
- Progress toward target
- Timeline to deadline
- Add goal modal

#### **Riwayat** (Transaction History)
- Filterable table view
- Date-based filtering
- Category filtering
- Transaction detail inline
- Edit/delete actions

#### **Laporan** (Monthly Reports)
- Summary metrics
- Category breakdown
- Income vs. expense comparison
- Month/year filter
- Export capability

#### **Additional Analytics Pages**
- **Tren** — 3-month income/expense trend (line chart)
- **Pola Waktu** — Spending patterns over time
- **Prakiraan** — Income/expense forecasting (with ML insights)
- **Kalender** — Transaction timeline view
- **Kategori** — Browse & customize categories

### Feature Pages (Less Developed)
- **Smart Alerts** — Spending alerts (stub)
- **Recurring** — Manage recurring transactions
- **Budget Recommendations** — AI-powered suggestions
- **Spending Patterns** — Behavioral insights
- **Split Bill** — Split expense tracking
- **Gajian** — Salary setup & tracking
- **Wallet** — Multi-wallet management
- **Asisten** — AI chat assistant
- **Langganan** — Subscription tracking

### Auth Pages
- **Login** — Telegram ID + Google OAuth
- **AuthCallback** — OAuth redirect handler
- **LinkTelegram** — Associate Google account with Telegram
- **Onboarding** — First-time setup flow

### Public Pages (Marketing)
- **Landing** — Public homepage
- **Cara Kerja** — How it works
- **Fitur** — Features overview
- **Keamanan** — Security info
- **Testimonial** — User testimonials
- **FAQ** — FAQ
- **Blog** — Blog posts
- **TentangKami** — About us
- **SyaratKetentuan** — Terms of Service
- **KebijakanPrivasi** — Privacy Policy

---

## 4. Visual Design System

### Color Palette

**Primary Brand Color**
- **Bright Mint/Vivid Lime:** `#4AE54A` (CTAs, active states, primary actions)
- Dark variant: `#38C438`
- Light variant: `#72ED72`
- Foreground on lime: `#0D2818` (deep forest green text)

**Sidebar**
- Deep Forest Green: `#0D2818` (background)
- White foreground text
- Lime accent for active states
- Secondary accent: `#163D24`

**Backgrounds**
- Off-white: `#F9FAFB` (page background)
- White: `#FFFFFF` (cards, modals)
- Charcoal/Near-black: `#1A1A1A` (text)

**Semantic Colors**
- Success: Lime `#4AE54A`
- Warning: Amber `#F59E0B`
- Danger: Red `#EF4444`
- Info: Blue `#3B82F6`

**Category Colors (for visual coding)**
- Food & Dining: `#F59E0B` (Amber)
- Transport: `#3B82F6` (Blue)
- Groceries: `#4AE54A` (Lime)
- Shopping: `#EC4899` (Pink)
- Bills & Utilities: `#8B5CF6` (Purple)
- Health: `#EF4444` (Red)
- Entertainment: `#F97316` (Orange)
- Education: `#06B6D4` (Cyan)

### Typography

**Fonts**
- Headings: `Manrope` (Modern, geometric sans-serif)
- Body: `Plus Jakarta Sans` (Friendly, readable sans-serif)
- Monospace: `DM Mono` (Charts, data display)

**Type Scale**
- Heading 1: 32px (700 weight)
- Heading 2: 24px (700 weight)
- Heading 3: 20px (600 weight)
- Body: 16px (400-500 weight)
- Small: 14px (400-500 weight)

### Radius & Spacing
- Border radius: `1.25rem` (20px) — generous rounding
- Padding: Uses Tailwind scale
- Component spacing: `gap-4` to `gap-6` (16-24px)

### Dark Mode
- Full dark mode support via CSS variables
- Sidebar remains dark in both themes
- Charts adapt colors (OKLCH format for perceptual consistency)

---

## 5. Tech Stack (Frontend)

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Routing | react-router v7 |
| Styling | Tailwind CSS v4 + CSS Variables |
| Components | shadcn/ui (Radix UI primitives) |
| Charts | Recharts |
| Animations | Motion (Framer Motion successor) |
| Forms | react-hook-form |
| Backend Client | Supabase JS (`@supabase/supabase-js`) |
| Notifications | Sonner toasts |
| Icons | Lucide React |
| Date Handling | date-fns (with Indonesian locale) |

---

## 6. Target Users & Use Cases

### Primary User Personas

**1. Salaried Worker (Monthly Income, Predictable)**
- Fixed monthly salary (gajian)
- Predictable expenses (rent, utilities, groceries)
- Savings goals (emergency fund, vacation)
- Budget adherence is critical
- Use case: Log receipt → visualize spending → adjust budget

**2. Freelancer (Variable Income)**
- Irregular income from projects
- Unpredictable expenses
- Tax planning (save % of income)
- Forecasting & trend analysis needed
- Use case: Log daily expenses → track burn rate → adjust pricing

**3. Family Financial Manager**
- Multi-person transactions
- Shared wallets
- Split bills among family
- Budget allocation by person
- Use case: Log shared expenses → split → visualize per-person spending

### Usage Patterns
- **Peak times:** Evening (logging daily expenses), weekends (planning/analysis)
- **Device split:** Mobile for logging, desktop for analysis
- **Frequency:** Daily expense logging, weekly budget check, monthly review

---

## 7. Current UX Strengths

✅ **Comprehensive Dashboard** — Single Overview page gives clear financial snapshot  
✅ **Strong Data Visualization** — Multiple chart types (area, bar, pie, line)  
✅ **Multi-wallet Support** — Track multiple accounts (checking, savings, e-wallets)  
✅ **Indonesian Localization** — UI labels, locale formatting, currency  
✅ **Flexible Filtering** — Month/year, wallet, category filters across views  
✅ **Recurring Expense Tracking** — Dedicated UI for recurring bills  
✅ **Goal Tracking** — Visual progress toward savings targets  
✅ **PDF Export** — Generate monthly reports  
✅ **Dark Mode** — Full theme support  
✅ **Responsive Design** — Mobile-first layout (sidebar collapses on mobile)  

---

## 8. Current UX Pain Points & Improvement Opportunities

### 🔴 Critical Issues

**1. Information Overload on Overview**
- Too many charts & widgets on single page (desktop)
- Mobile scrolling burden
- Conflicting visual hierarchy
- **Fix:** Prioritize key metrics; progressive disclosure; card-based layout

**2. Inconsistent Component Sizing**
- Cards have varied padding/sizing
- Chart heights not standardized
- **Fix:** Establish 8px baseline grid; define card sizes (sm, md, lg)

**3. Weak Mobile Navigation**
- Drawer menu feels clunky on small screens
- No persistent bottom tab bar
- **Fix:** Add bottom tab navigation for primary actions (like Telegram bot)

**4. Unclear Call-to-Action Hierarchy**
- Multiple green buttons (primary color overuse)
- "Add Transaction" button placement inconsistent
- **Fix:** Define button hierarchy (primary, secondary, tertiary)

**5. Category Colors Not Intuitive**
- Amber for "Food" makes sense, but others arbitrary
- Hard to remember category-color mapping
- **Fix:** Use icons + colors together; category legend in sidebar

---

### 🟡 Medium Priority Issues

**6. Chart Density on Dashboard**
- Area chart + bar chart + pie chart (if category visible) = visual clutter
- Legend placement inconsistent
- **Fix:** One primary chart per section; modal for deep dive

**7. Wallet Selector Underutilized**
- Hidden in dropdown (desktop) / not visible (mobile)
- Should be more prominent (like iOS banking apps)
- **Fix:** Wallet tabs or chips at top; quick-switch design

**8. Budget vs. Actual Not Intuitive**
- Progress bars used, but labels small
- No visual "danger zone" (exceeded budget)
- **Fix:** Larger labels, color shift (yellow → red as over-budget)

**9. Transaction History (Riwayat) Too Dense**
- Table view doesn't optimize for mobile
- Row-based design wastes space
- **Fix:** Card-based design; swipe-to-delete on mobile

**10. Recurring Expenses Buried**
- "Berulang" page exists but not discoverable from Overview
- Should preview upcoming recurring charges
- **Fix:** Add "Upcoming Bills" card to Overview (already done!) but make more prominent

**11. Goal Progress Hard to Track**
- Linear progress bars lack visual interest
- No "days remaining" context
- **Fix:** Circular progress + days to deadline; motivational design

**12. Forecasting Page Not Clear**
- Icon is "Prakiraan" but intent unclear
- ML predictions need explanation
- **Fix:** Better naming; explainability UI; confidence scores

---

### 🟢 Nice-to-Have Improvements

**13. Sidebar Overflow on Small Desktops**
- Text labels truncate on 1024px screens
- **Fix:** Responsive sidebar (collapse to icons, then hide)

**14. AI Assistant (Asisten) Underutilized**
- Buried in Tools section
- Should be "ask a question" floating action
- **Fix:** Chat bubble button; more accessible placement

**15. Category Browse Experience**
- Grid/list toggle not obvious
- No search/filter
- **Fix:** Add search; improve visual hierarchy

**16. Settings Scattered**
- Profile page has some settings, category customization elsewhere
- **Fix:** Unified Settings page

---

## 9. Mobile Web-Specific Considerations

### Screen Sizes Supported
- iPhone SE (375px)
- Standard phones (390-430px)
- Tablets (768px+)

### Current Mobile Behaviors
- Sidebar collapses to hamburger
- Bottom nav appears on some pages
- Modals stack full-width
- Charts become single-column

### Mobile Optimization Opportunities
1. **Bottom navigation bar** (like mobile banking apps)
   - Home, Add, Insights, Wallet, Profile
   - Always accessible
   - Tap-friendly (48px minimum height)

2. **Quick actions** above main content
   - "Add Transaction" prominent
   - Photo receipt upload easy access

3. **Progressive disclosure** 
   - Hide secondary metrics
   - Expand cards for detail

4. **Touch-optimized interactions**
   - Swipe to delete transactions
   - Tap to expand details
   - Long-press for more options

---

## 10. Data Architecture (from Frontend Perspective)

### Key Data Types

**Transaction**
```
{
  id: string
  user_id: bigint
  amount: number
  type: 'expense' | 'income'
  category: string
  subcategory?: string
  note: string
  ai_confidence: number
  date: Date
  wallet_id?: string
  is_recurring?: boolean
  recurring_id?: string
}
```

**Budget**
```
{
  id: string
  user_id: bigint
  category: string
  amount: number
  period: 'monthly'
  month: number
  year: number
  UNIQUE(user_id, category, month, year)
}
```

**Goal**
```
{
  id: string
  user_id: bigint
  name: string
  target_amount: number
  saved_amount: number
  deadline: Date
}
```

**Wallet**
```
{
  id: string
  user_id: bigint
  name: string
  balance: number
  currency: string
  is_primary: boolean
}
```

### Data Fetching Patterns
- Uses custom hooks (`useTransactions`, `useBudgets`, `useGoals`, `useWallets`)
- Real-time Supabase subscriptions (where implemented)
- Monthly/year filters applied client-side and in queries
- Month filter is global context (`useMonthFilter`)

---

## 11. Proposed Revamp Themes

### Option A: **"Financial Wellness" – Holistic & Reassuring**
- Softer color palette (mint green instead of neon lime)
- Wellness-focused copy ("Financial health," "Smart planning")
- Circular progress indicators (less clinical than bars)
- Empathetic error/warning messages
- Focus: Making finance feel less intimidating

### Option B: **"Power User" – Data-Dense & Insightful**
- Cleaner data visualization (less decoration)
- More options per page (advanced filters, comparisons)
- Dark-mode first (tech-savvy audience)
- Keyboard shortcuts
- Focus: Serious financial management for power users

### Option C: **"Banking App" – Familiar & Functional**
- Adopt iOS/Android banking app patterns
- Bottom tab navigation
- Card-based design throughout
- Wallet-centric layout (cards first, then analytics)
- Focus: Comfortable for everyday users

---

## 12. Design Audit Checklist for Revamp

### Visual Consistency
- [ ] Standardize card sizes (sm/md/lg)
- [ ] Define button hierarchy (primary/secondary/ghost/danger)
- [ ] Consistent icon sizing (16px for inline, 24px for buttons, 32px for section icons)
- [ ] Standardize input field heights (40px recommended)
- [ ] Define spacing scale (4px/8px/12px/16px/24px/32px/40px)

### Hierarchy & Readability
- [ ] Clear page titles (consistent size/placement)
- [ ] Scannable headings (white space above/below)
- [ ] Readable text (16px minimum body text on mobile)
- [ ] Sufficient contrast (WCAG AA minimum)

### Mobile Optimization
- [ ] Bottom tab bar (primary actions)
- [ ] Touch-friendly tap targets (48px minimum)
- [ ] Readable charts at 375px width
- [ ] Readable tables (or convert to cards)
- [ ] Modals full-width on mobile, modal on desktop

### Navigation & Discoverability
- [ ] Primary actions obvious (budget, add, goals)
- [ ] Secondary features discoverable (not buried)
- [ ] Search/filter on list pages
- [ ] Breadcrumbs on detail pages
- [ ] Back button prominent on mobile

### Data Density
- [ ] No page requires excessive scrolling (>3 screens)
- [ ] Progressive disclosure (expand for details)
- [ ] Filter results before showing all
- [ ] Lazy-load charts if multiple

### Accessibility
- [ ] Color not the only differentiator (use icons + labels)
- [ ] Focus states visible (keyboard navigation)
- [ ] Form labels associated with inputs
- [ ] Alt text on charts
- [ ] Reduced motion support

---

## 13. Success Metrics for Design Revamp

### Quantitative
- Mobile conversion (new user signup from web)
- Time to first transaction log
- Feature adoption (% using each page)
- Time spent on Overview (too high = confusion)

### Qualitative
- User testing feedback (5-10 users)
- A/B test key layouts (Overview variations)
- Accessibility audit (WCAG 2.1 AA)
- Mobile usability testing (iOS Safari + Chrome)

---

## 14. File Structure Reference

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              ← Router setup
│   │   ├── components/
│   │   │   ├── Layout.tsx        ← Sidebar + main layout
│   │   │   ├── MobileNav.tsx     ← Mobile navigation
│   │   │   ├── TransactionModal.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── ui/              ← shadcn/ui components (don't edit)
│   │   │   └── ...
│   │   └── pages/               ← All page components
│   ├── hooks/                   ← Data fetching hooks
│   ├── lib/
│   │   ├── supabase.ts          ← Types + client
│   │   ├── utils.ts             ← Helpers
│   │   └── categoryMetadata.ts  ← Category colors/icons
│   └── styles/
│       ├── theme.css            ← Design tokens (CSS vars)
│       ├── fonts.css
│       └── index.css
└── vercel.json                  ← Deployment config
```

---

## 15. Next Steps for Design Revamp

1. **Create Design System** (Figma)
   - Component kit (buttons, cards, inputs, modals)
   - Color palette with accessibility checks
   - Typography scale
   - Spacing/grid system

2. **Wireframe Key Pages** (mobile + desktop)
   - Overview (most important)
   - Budget
   - Riwayat
   - Mobile bottom nav

3. **Component Inventory**
   - List all components used in codebase
   - Identify duplicates / inconsistencies
   - Plan consolidation

4. **Accessibility Audit**
   - WCAG 2.1 contrast check
   - Keyboard navigation test
   - Screen reader test (NVDA/JAWS)

5. **Mobile Usability Testing**
   - Test on actual devices (iPhone, Android)
   - Form filling flow
   - Chart readability at 375px

6. **Implementation Roadmap**
   - Phase 1: Core page redesign (Overview, Budget, Riwayat)
   - Phase 2: Mobile optimization (bottom nav, touch interactions)
   - Phase 3: Detail pages & refinement
   - Phase 4: Accessibility improvements

---

**End of Audit Summary**  
Ready to begin design revamp! 🎨
