# GAJIAN AMAN — COMPLETE REDESIGN STRATEGY
**Revised:** May 20, 2026  
**Maturity Level:** Implementation-Ready Blueprint  
**Target Release:** 2026 Q3 (MVP), Q4 (Full Suite)

---

## EXECUTIVE SUMMARY — REDESIGN VISION

### The Transformation
Gajian Aman evolves from a **feature-dense finance dashboard** into an **AI-first financial companion** that feels calm, intelligent, and deeply personal.

**Current State:** 39 pages, 63 components, information overload, unclear navigation  
**Future State:** 15 essential screens, 40 reusable components, progressive disclosure, conversational UX

### Quality Target Improvements
| Dimension | Current | Target | Delta |
|-----------|---------|--------|-------|
| **UI Quality** | 7/10 | 9/10 | +200bps visual polish, premium fintech feel |
| **UX Quality** | 6.5/10 | 9/10 | +350bps clarity, reduced cognitive load |
| **Mobile Experience** | 6/10 | 9.5/10 | Bottom nav, thumb-zone optimization, gesture UX |
| **Design System** | 8/10 | 9.5/10 | Component consolidation, token rigor |
| **AI Integration** | 5/10 | 9/10 | Multi-turn chat, personalization, proactive insights |
| **Accessibility** | 6/10 | 9/10 | WCAG AAA compliance, keyboard nav, screen readers |

### Design Philosophy
The redesigned Gajian Aman should feel like:
- **Emotional Clarity:** Your finances should feel calm and understandable, never overwhelming
- **Intelligent Proactivity:** The AI anticipates needs before you ask
- **Progressive Transparency:** Complex data revealed on-demand, simple summaries by default
- **Premium Modern:** Inspired by Linear, Notion, Revolut, and Copilot Money
- **Indonesian Warmth:** Culturally resonant without condescension; designed for salaried Indonesian workers
- **Mobile-First Native:** Built for thumb interaction, not retrofitted to desktop

---

## 1. REFERENCE DESIGN DNA ANALYSIS

### 1.1 QPay Digital Wallet UI Kit — Visual & Interaction DNA

**Why It Works:**
- **Vertical Breathing:** Massive top padding on cards (40px) creates emotional space—finances don't feel rushed
- **Premium Depth:** Subtle blur layers + soft shadows (not harsh) = luxury without clutter
- **Hierarchy Through Size:** Headers 2.5x larger than body text; impossible to miss primary info
- **Wallet-Centric Hub:** Card designs mimic physical wallets—trust-building through familiarity
- **Bottom Navigation Native:** 5 primary actions always accessible; zero hunting for main features
- **Number Emphasis:** Large monospace typography for amounts; financial confidence
- **Gradient Restraint:** Single subtle gradient per screen (header or card); colors remain stable, feel
- **Empty Space as Feature:** Whitespace is luxurious, not wasted; visual rest

**Fintech Trust Principles:**
- Amounts displayed in oversized, familiar fonts (monospace)
- Visual confirmation (checkmarks, progress fills) for every action
- Color carries meaning but never solely color (icons + color redundancy)
- Transactions flow vertically (natural reading); familiar mental model
- Wallet balance is the hero; everything else is supporting info

**Design DNA for Gajian Aman Adaptation:**
- Apply vertical spacing scale: 8px, 12px, 16px, 24px, 40px between sections
- Use monospace DM Mono for all financial numbers (amounts, percentages)
- Soft shadow system (single soft shadow per elevation level, not hard shadows)
- Hero metric dominates screen real estate (balance, savings rate, health score)
- Bottom navigation as primary navigation hub (not sidebar on mobile)
- Gradient accents: Gajian green gradient only on hero section, nowhere else

---

### 1.2 Wise Design System — Interaction & Accessibility Quality

**Why It's Standard-Setting:**
- **Accessibility DNA:** Every component tested for WCAG AAA, not AAA-adjacent
- **Density Intelligence:** Information fits without crowding via smart use of micro-typography
- **Interaction Confidence:** Hover/focus/active states are predictable and obvious
- **Financial Clarity:** Data visualization defaults to accessibility (not aesthetics)
- **Component Logic:** Every component solves a specific fintech problem (not generic UI kit)
- **International Readiness:** Typography scales for 9-language fintech stack
- **Gesture-Aware:** Bottom sheets, swipe actions, long-press menus built-in

**Wise's Key Interaction Patterns:**
- **Chips for categorization:** Color-coded, dismissible, scannable
- **Dropdowns for dense selection:** Show 4 items, search-enabled, keyboard navigable
- **Progress indicators for trust:** Transparent methodology (shows calculation logic)
- **Confirmation patterns:** Every destructive action requires double confirmation
- **Financial input:** Currency formatting automatic; commas, decimals handled invisibly
- **Status badges:** Icon + color + text (triple-coding for accessibility)
- **Cards as atoms:** Reusable in 1-column, 2-column, 3-column layouts without code change

**Design DNA for Gajian Aman Adaptation:**
- Adopt Wise's accessibility rigor: WCAG AAA minimum, not AAA passable
- Implement Wise's status badge system: Icon + color + label (never color-only)
- Use Wise-style chips for category selection, tag filtering, and budget status
- Follow Wise's currency input pattern: Automatic formatting, never require manual comma entry
- Adopt long-press menus for secondary actions (delete, edit, share)
- Implement Wise-style progress indicators: Show "75% of budget" with calculation tooltip

---

### 1.3 Data Visualization UI Kit — Dashboard Storytelling

**Why Dashboard Clarity Matters:**
- **Visual Hierarchy:** Top chart is hero (income/expense balance); secondary charts support
- **Chart Density:** Single chart > layered complexity; if 2+ charts show same data, delete one
- **Mobile Responsiveness:** Charts stack vertically; zoom/pan on touch devices
- **Legend Mandatory:** Every chart has legend explaining axes and colors
- **Tooltip Design:** Hover shows exact values; on mobile, tap to see tooltip
- **Color Consistency:** Same color across all views (Income = always green, Expense = always red)
- **Progressive Disclosure:** Summary first (totals), details on drill-down (category breakdown)
- **Trend Indication:** Arrow or line overlay showing direction without interpretation

**Dashboard Storytelling Pattern (for financial apps):**
1. **Hero Metric:** Single large number (balance, savings rate, health score)
2. **Primary Comparison:** Bar/area chart showing income vs expense (month view)
3. **Category Breakdown:** Pie/doughnut or bar chart (top 5 categories)
4. **Trend Line:** Line chart showing 3-month pattern
5. **Alert Zone:** Anomalies, budget breaches, milestones
6. **Action Zone:** Recommended next steps based on data

**Design DNA for Gajian Aman Adaptation:**
- Implement "Hero + Primary + Category + Trend + Alert" dashboard pattern
- Every chart has automatic legend; never rely on user memory
- Color consistency matrix: Freeze category colors (Food always amber, Transport always blue)
- Mobile chart behavior: Stack vertically; swipe to reveal next metric
- Drill-down pattern: Click category → navigate to dedicated analysis page
- Forecast visualization: Show historical + forecast as overlaid area (different opacity)

---

### 1.4 Responsive Dynamic Table UI Kit — Transaction History & Analytics

**Why Table UX Is Critical:**
- **Scannability:** Column headers aligned left; data aligned by data type (numbers right, text left)
- **Row Density:** 48px row height balances touch targets (44px min) with scanability
- **Sorting Intelligence:** Every column is sortable; active column highlighted
- **Filtering Integration:** Filter row above table shows active filters; easy to modify
- **Expandable Details:** Click row → expand inline details (not modal overlay)
- **Mobile Transformation:** On narrow screens, switches to card list view (not cramped table)
- **Sticky Headers:** Table header stays visible while scrolling
- **Selection:** Checkbox column for bulk actions (delete, categorize, export)

**Table Interaction Patterns:**
- **Single tap:** Expand row details inline
- **Long press:** Show context menu (edit, delete, categorize, move)
- **Swipe left:** Archive action
- **Swipe right:** Flag as review
- **Column reorder:** Drag header to reorder
- **Filter chips:** Above table, dismissible, shows "3 filters applied"

**Design DNA for Gajian Aman Adaptation:**
- Riwayat (transaction history) table: 48px rows, left-aligned text, right-aligned amounts
- Expandable rows: Click transaction → show details (category, wallet, notes, tags)
- Sticky header with active filter indicator
- Mobile fallback: Card-list view below 768px (list items instead of table)
- Sorting options: Date, Amount, Category (3 columns only, not overwhelming)
- Bulk actions: Select transactions → categorize, tag, delete
- Filter chips above table: Quick filters (Last 7 days, This month, Recurring)

---

## 2. GAJIAN AMAN FUTURE PRODUCT VISION

### 2.1 Emotional Product Direction

**The Core Feeling:**
Users should feel **financially empowered, not overwhelmed.**

Every interaction should answer one question at a time:
- Overview: "How am I doing financially this month?"
- Spending: "Where did my money go?"
- Budget: "Am I on track?"
- Goals: "How close to my dreams?"
- AI Assistant: "What should I do next?"

**Design Personality:**
- **Tone:** Warm, supportive, non-judgmental ("You're doing well—here's how to do better")
- **Pace:** Calm and deliberate (no urgency, no FOMO)
- **Intelligence:** Proactive suggestions feel like a trusted friend's advice, not an algorithm
- **Accessibility:** Never assumes financial literacy; always explains assumptions
- **Respect:** Honors that money is personal; privacy paramount, sharing explicit

### 2.2 AI Assistant Personality

**The Future AI Persona:**
Not a search box. Not a help system. A **financial coach** that:
- **Remembers context:** "You asked about Food spending last week; it's up 15% this week"
- **Explains methodology:** "I calculated your budget by averaging last 3 months + inflation"
- **Offers agency:** "Here's my recommendation, but you decide" (not prescriptive)
- **Uses your language:** Indonesian phrases, local references, culturally resonant examples
- **Proactive:** Surfaces insights unprompted ("Your savings rate hit a new high this month")
- **Celebratory:** Recognizes milestones ("3 months on budget! 🎉")

**AI Interactions Model:**
- **Conversational:** Multi-turn chat with history (not isolated Q&A)
- **Contextual:** "Based on YOUR spending, not everyone's"
- **Actionable:** Follow-up suggestions: "Set Food budget to Rp 500k?" with one-tap confirmation
- **Explainable:** Every recommendation includes rationale: "I suggested this because..."

### 2.3 Visual & Interaction Philosophy

**Fintech Premium Aesthetic:**
- **Color:** Gajian green (#4AE54A) as brand + accent; neutrals as foundation
- **Typography:** Manrope for hierarchy (headings), Plus Jakarta Sans for body (warmth), DM Mono for money
- **Spacing:** Generous margins create breathing room (40px vertical sections on desktop, 24px on mobile)
- **Motion:** Subtle spring animations (100-200ms duration; never flashy)
- **Elevation:** Soft shadows (blur-based, not hard shadows) for depth
- **Icons:** Consistent system (lucide-react as base; custom fintech icons for categories)
- **Emptiness:** Whitespace is premium; filled layouts feel cheap

**Interaction Philosophy:**
- **Mobile-First:** Thumb-zone optimized (bottom 40% of screen for primary actions)
- **Gesture-Native:** Swipe, long-press, and scroll patterns feel natural
- **Feedback Immediate:** Every action has visual confirmation (loading state, success animation)
- **Keyboard Complete:** Full keyboard navigation with visible focus indicators
- **Progressive Disclosure:** Show summary by default; details on demand

---

## 3. INFORMATION ARCHITECTURE REDESIGN

### 3.1 Navigation Structure (Current vs Redesigned)

**Current IA Problems:**
- 39 pages in sidebar = cognitive overload
- Feature grouping unclear (why is Kalender in "Alat" vs "Analytics"?)
- No primary/secondary navigation distinction
- Settings scattered (Profil, Langganan, Asisten) across different sections
- Mobile bottom-sheet drawer same as desktop sidebar (doesn't respect platform)

**Redesigned IA: 5-Tier Structure**

```
Tier 1: Primary Navigation (Bottom Navigation, Mobile)
├─ 🏠 Home (Overview + Insights)
├─ 💰 Spend (Spending + Budget management)
├─ 📊 Analytics (Reports, Trends, Forecasting)
├─ 🛠️ Tools (Wallets, Recurring, Split Bill, Categories)
└─ 🤖 AI (Chat assistant + recommendations)

Tier 2: Secondary Navigation (Tabs within each section)
├─ Home
│  ├─ Overview (default, hero metrics)
│  └─ Insights (AI-generated summaries, smart recommendations)
├─ Spend
│  ├─ Spending (category breakdown)
│  ├─ Budget (budget management)
│  └─ Goals (savings goals)
├─ Analytics
│  ├─ Laporan (monthly report)
│  ├─ Tren (3-month trends)
│  └─ Forecasting (next-month prediction)
├─ Tools
│  ├─ Wallets (multi-wallet management)
│  ├─ Recurring (recurring bills)
│  ├─ Split Bill (expense splitting)
│  └─ Categories (category customization)
└─ AI
   └─ Chat (multi-turn conversation)

Tier 3: Tertiary Navigation (Context-specific actions)
├─ Quick Add (FAB from anywhere)
├─ Filters (wallet, date range, category)
└─ Context Menu (•••, long-press actions)

Tier 4: Settings & Account (Menu → Profile → Settings)
├─ Profile (name, email, avatar)
├─ Settings (notifications, privacy, theme)
├─ Subscription (plan, billing)
└─ Logout
```

### 3.2 Navigation Implementation Strategy

**Desktop (1920px+):**
- Sidebar fixed left (200px) with 5 primary + sub-navigation
- Main content area 70% width, right sidebar for context (filters, related actions)
- No hamburger menu needed
- Breadcrumbs show current location

**Tablet (768px - 1024px):**
- Sidebar collapses to icon-only rail (60px width)
- Hover reveals labels
- Main content expands to fill
- Still has right sidebar for context

**Mobile (375px - 768px):**
- **No sidebar.** Instead: Bottom navigation (5 icons)
- Top header with logo, filters toggle, and menu (•••)
- Full-screen pages per navigation item
- Secondary navigation as tabs (below header)
- Filters as bottom sheet (modal-style)
- Settings accessed via header menu (•••)

### 3.3 Primary Navigation — 5 Icon System

**Design Guidance:**
- Icons from lucide-react (consistent, customizable)
- Color: Gray in inactive state, Gajian green (#4AE54A) in active
- Label always visible below icon (mobile accessibility)
- Badge system for notifications (unread count on AI, alerts on Spend)
- Touch target 56px x 56px (exceeds 44px minimum)

| Icon | Label | Primary Purpose | Badge |
|------|-------|-----------------|-------|
| 🏠 | Home | Dashboard, balance, monthly summary | None |
| 💰 | Spend | Spending breakdown, budgets, goals | Alert if budget breached |
| 📊 | Analytics | Reports, trends, forecasting | None |
| 🛠️ | Tools | Wallets, categories, recurring | Count of pending actions |
| 🤖 | AI | Chat assistant | Unread messages |

### 3.4 Navigation State Management

**Design Requirement:**
Navigation state persists across sessions:
- Last viewed tab per section (user visits Spend → Budget, closes app → reopens to Budget)
- Filter state preserved (Wallet filter, date range remain applied)
- Scroll position remembered (user scrolls to bottom of Riwayat → navigates away → returns → scrolls to same position)

**Implementation via Context:**
```typescript
// useNavigation hook
const { currentSection, setCurrentSection } = useNavigation();
const { activeTab, setActiveTab } = useTabState(currentSection);
const { filters, setFilters } = useFilterState(currentSection);
```

---

## 4. COMPLETE SCREEN ECOSYSTEM REDESIGN

### 4.1 Overview (Home Dashboard) — Redesigned

**User Goal:** Understand monthly financial snapshot in 10 seconds.

**Emotional Goal:** Feel in-control and calm.

**Information Hierarchy:**
1. **Hero Metric:** Balance card (current month balance, YTD savings)
2. **Status Row:** Income received, spent, available to spend (3 cards)
3. **Spending Summary:** Bar chart (income vs expense for month)
4. **Quick Insights:** AI-generated summary ("You're 12% under budget this month")
5. **Category Breakdown:** Top 3 spending categories
6. **Recent Transactions:** Last 5 transactions (expandable)
7. **Goals Progress:** Mini progress cards for top 2 goals
8. **Upcoming Bills:** Recurring bills due this month

**Design Changes vs Audit:**
- ✅ Remove 6 charts → 3 main visuals (balance, income/expense, top categories)
- ✅ Move recent transactions to dedicated tab (not on dashboard)
- ✅ Add "Available to Spend" card (budget - spent calculation visible)
- ✅ AI insights moved to top (most valuable info first)
- ✅ Goals mini-view inline (not separate page)
- ✅ Collapsible sections for progressive disclosure (charts collapse)

**Visual Layout (Mobile):**
```
┌─────────────────────────┐
│ Header: Overview Tab    │
├─────────────────────────┤
│ [Balance Hero Card] ▼   │  ← 44px tall, monospace number
│ Rp 3.2M balance | +15%  │
│ YTD: Rp 2.1M saved      │
├─────────────────────────┤
│ [Status Row - 3 Cards]  │  ← Tappable for detail
│ [Received] [Spent] [Available]
│ Rp 8M      Rp 5.2M    Rp 2.8M
├─────────────────────────┤
│ 💡 Quick Insight       │  ← AI-generated
│ "You're 12% under      │
│ budget this month      │
│ (best this year!) 🎉"  │
├─────────────────────────┤
│ Spending Breakdown ▼    │  ← Bar chart, collapsible
│ [Chart area]            │
├─────────────────────────┤
│ Top Spending ▼          │  ← 3 categories
│ 🍔 Food: Rp 2.1M (40%) │
│ 🚗 Transport: Rp 1.5M   │
│ 🏠 Bills: Rp 1M         │
├─────────────────────────┤
│ Goals ▼                 │  ← Mini progress
│ 💰 Emergency Fund       │
│ ████░░░░░ 65% (Rp 5.2M)│
├─────────────────────────┤
│ Upcoming Bills          │  ← Recurring, next 30 days
│ Mar 15: Netflix Rp 50k  │
│ Mar 20: Rent Rp 5M      │
└─────────────────────────┘
```

**Chart Implementation (Recharts):**
- Income/Expense: Stacked bar chart (2 bars: income green, expense red)
- Mobile: Chart auto-scales to fit width; labels rotate if needed
- Tooltip: Tap to see exact amounts
- Legend: Below chart, horizontal layout

**Empty State:**
- If no data: "Add your first transaction to see insights"
- Contextual CTA: "Add Income" or "Log Expense" button

**Loading State:**
- Skeleton cards for balance, status row, charts (preserve layout height)
- Shimmer animation (pulse effect, not rotating skeleton)

---

### 4.2 Spending (Pengeluaran) — Redesigned

**User Goal:** Understand where money went; identify overspending categories.

**Layout:**
- **Tab Navigation:** Chart View | List View | Budget Comparison
- **Chart View:** Horizontal bar chart (categories ranked by amount)
- **List View:** Table of categories with amount, % of total, trend indicator
- **Budget Comparison:** Category with budget bar next to actual bar

**Design Changes:**
- ✅ Remove pie/donut chart (redundant with bar chart)
- ✅ Add budget progress bar inline with spending amount
- ✅ Consolidate wallet filter to chip bar (persistent across app)
- ✅ Add "On-Track," "Warning," "Over" status inline
- ✅ Sortable list (by amount, trend, category)
- ✅ Drill-down: Tap category → dedicated detail page

**Visual Layout:**
```
┌─────────────────────────┐
│ Pengeluaran Tabs        │
│ [Chart] [List] [Budget] │
├─────────────────────────┤
│ Wallet Filter (Chips)   │
│ [All] [Bank] [GoPay]    │
├─────────────────────────┤
│ Spending Breakdown      │
│ 🍔 Food & Dining        │
│ Rp 2.1M of Rp 2.5M (84%)│ ← Budget bar integrated
│ ▓▓▓▓▓▓▓▓░░ OK           │ ← Status badge
│                         │
│ 🚗 Transport            │
│ Rp 1.5M of Rp 1M (150%) │
│ ▓▓▓▓▓▓▓▓▓▓ OVER         │ ← Red status
│                         │
│ 🏠 Bills & Utilities    │
│ Rp 900k of Rp 1M (90%)  │
│ ▓▓▓▓▓▓▓▓░░ OK           │
└─────────────────────────┘
```

**Drill-Down Detail Page (Category Detail):**
- Category header (icon, name, total spent)
- Budget bar + progress
- Recent transactions for category (table)
- Trend (last 3 months)
- Subcategory breakdown (if applicable)
- Edit budget quick action

---

### 4.3 Budget (Anggaran) — Redesigned

**User Goal:** Set and monitor category budgets; get alerts when approaching limits.

**Design Philosophy:** **Inline editing, not modal fatigue.**

**Layout:**
- Per-category budget input (click to edit inline)
- Visual progress bars (green safe, yellow warning 80%, red over 100%)
- Recommended budget chip (AI-generated suggestion)
- Budget vs Actual comparison
- Quick "Set All" action (distribute available income across categories)

**Design Changes:**
- ✅ Replace modal edit with inline editing (click amount → input appears → save inline)
- ✅ Show recommended budget as always-visible chip: "Recommended: Rp 300k"
- ✅ Add "Set to Average" button (use last 3 months average as budget)
- ✅ Show previous month's budget for comparison
- ✅ Status badges simplified (safe/warning/over, not 4 variants)

**Visual Layout:**
```
┌─────────────────────────┐
│ Budget Management       │
├─────────────────────────┤
│ Income Available: Rp 8M │ ← Alert if too much unbudgeted
│ Allocated: Rp 7.2M      │
│ Unallocated: Rp 800k    │
├─────────────────────────┤
│ 🍔 Food & Dining        │
│ Rp 2.5M budget | Spent: Rp 2.1M
│ ▓▓▓▓▓▓▓▓░░ 84% (Safe)   │
│ Recommended: Rp 2.8k ◄─ Tap to use
│ Last month: Rp 2.4M     │
│ [Edit] [Set Average] [Trend] │
│                         │
│ 🚗 Transport            │
│ Rp 1M budget | Spent: Rp 1.5M
│ ▓▓▓▓▓▓▓▓▓▓ 150% (Over)   │ ← Red styling
│ Action: Consider increasing to Rp 1.8M
│ [Edit] [Increase] [History] │
├─────────────────────────┤
│ [Set All Budgets] ────► Wizard to distribute budget across all categories
│ [Quick Actions] ────► Recommended budgets from AI
└─────────────────────────┘
```

**Inline Edit UX:**
- Click budget amount → input appears in-place (not modal)
- Currency input auto-formats (type "2500000" → displays "2,500,000")
- Tab to next budget (streamline multi-edit)
- Save on blur or Enter key
- Undo option available (toast with undo button)

---

### 4.4 Goals (Tujuan) — Redesigned

**User Goal:** Track progress toward savings goals; celebrate milestones.

**Design Changes:**
- ✅ Larger progress cards (full-width on mobile)
- ✅ Show deadline as countdown ("47 days left")
- ✅ Add priority badge (High, Medium, Low)
- ✅ Milestone checkpoints (25%, 50%, 75%, 100%)
- ✅ Inline contribution button ("Add Rp 50k to this goal")
- ✅ Show "On track to complete by June" prediction
- ✅ Celebration animation when goal reached (confetti, achievement badge)

**Visual Layout:**
```
┌──────────────────────────────┐
│ Goals (Tujuan)               │
├──────────────────────────────┤
│ 💰 Emergency Fund (HIGH)     │ ← Priority badge
│ Target: Rp 10M | Saved: Rp 6.5M
│ ████████░░ 65%              │
│ Milestone: ✓✓✓░ (3/4 reached)│ ← Show 25%, 50%, 75%
│                              │
│ ⏰ 8 months left (Nov 2026)  │ ← Countdown, not date
│ On track to complete by Sep  │ ← Prediction based on trend
│                              │
│ [+ Add Rp 50k] [Edit] [View History] │ ← Quick actions
│                              │
│────────────────────────────│
│ 🎓 Education Fund (MEDIUM)   │
│ Target: Rp 30M | Saved: Rp 12M
│ ██████░░░░ 40%              │
│ Milestone: ✓✓░░ (2/4)       │
│ ⏰ 18 months left            │
│ At current pace: Jan 2028    │
│ [⬆️ Accelerate] [+ Add] [Edit]│
└──────────────────────────────┘
```

**Contribution Methods:**
- Quick add (button with preset amounts: Rp 50k, 100k, 250k)
- Custom amount input
- Auto-contribute from savings (future: linked automation)

**Achievement Celebration:**
- When goal reaches 100%: Confetti animation, "🎉 You did it!" message
- Badge added to user profile
- AI message: "You completed Emergency Fund! Here's what's next..."

---

### 4.5 Riwayat (Transaction History) — Redesigned

**User Goal:** Browse, filter, search, and manage past transactions with speed.

**Layout:**
- **Smart Filters:** Quick filter chips (Last 7 days, This month, Recurring) + advanced filters
- **Sort Options:** Date (default), Amount, Category
- **Search:** Full-text search across transaction notes
- **Table/List View:** Expandable rows for details

**Design Changes:**
- ✅ Replace dropdown filters with chip bar (persistent, visible)
- ✅ Add date range picker (not just month/year global)
- ✅ Add sort toggle (Date, Amount, Category)
- ✅ Row expansion instead of modal (click row → details appear inline)
- ✅ Swipe actions (archive, flag, delete) on mobile
- ✅ Export moved to context menu (•••), not prominent button
- ✅ Add quick filter presets (Last 7 days, This month, Recurring)

**Visual Layout:**
```
┌──────────────────────────────┐
│ Riwayat (Transactions)       │
├──────────────────────────────┤
│ Quick Filters (Chips):       │
│ [Last 7 days] [This Month]   │
│ [Recurring] [Income] [Custom]│
├──────────────────────────────┤
│ Sort: [Date ▼] Amount Category│
│ Search: [__________]          │
├──────────────────────────────┤
│ Mar 14: Amazon Shopping       │ ← Expandable row
│ 🛍️ Rp 450,000 (Expense)       │
│ ├─ Wallet: BCA Debit         │ ← Details on expand
│ ├─ Category: Shopping         │
│ ├─ Confidence: 95%            │
│ └─ [Edit] [Recategorize]     │
│                               │
│ Mar 13: Salary Payment        │
│ 💼 Rp 8,000,000 (Income)     │
│                               │
│ Mar 12: Starbucks            │
│ ☕ Rp 75,000 (Food)           │
│                               │
│ [Load More] or infinite scroll│
└──────────────────────────────┘
```

**Expandable Row Details:**
```
┌─ Transaction Details ────────────┐
│ Rp 450,000 | 14 Mar, 5:30 PM    │
│                                 │
│ Category: 🛍️ Shopping          │
│ Confidence: ▓▓▓▓▓░░░░░ 95%      │
│ Wallet: BCA Debit               │
│ Note: "Books and stationery"    │
│ Tags: [work] [quarterly-plan]   │
│                                 │
│ [Edit] [Recategorize] [Delete]  │
│ [Add to Goal] [Mark Recurring]   │
└─────────────────────────────────┘
```

**Mobile Swipe Actions:**
- Swipe left: Archive or Delete (user configurable)
- Swipe right: Flag for review or Add to Goal
- Long-press: Context menu (edit, categorize, delete, add to goal)

---

### 4.6 Laporan (Monthly Report) — Redesigned

**User Goal:** Comprehensive monthly snapshot for review and export.

**Design Philosophy:** **Insights first, charts second.**

**Layout:**
1. **AI Insights Section:** 2-3 key findings ("You saved 25% more this month")
2. **Health Score:** Visual gauge (0-100) with clear explanation
3. **Main Charts:** Income/Expense bar, Savings Rate trend
4. **Category Breakdown:** Top 5 categories (pie or bar)
5. **Budget Summary:** Categories on-track vs off-track
6. **Recommendations:** AI-generated action items
7. **Export Options:** PDF, CSV with customization

**Design Changes:**
- ✅ Move insights above charts (top priority content)
- ✅ Add inline explanation for health score
- ✅ Replace circular gauge with linear bar (clearer at a glance)
- ✅ Simplify to 2 main charts (income/expense + savings rate)
- ✅ Add month selector to compare 2-3 months side-by-side
- ✅ Add "Share Report" button (generates sharable link or PDF)
- ✅ Collapsible sections (start collapsed, user chooses what to see)

**Visual Layout:**
```
┌──────────────────────────────┐
│ Laporan (Monthly Report)     │
├──────────────────────────────┤
│ March 2026 Report [◄] [►]   │
├──────────────────────────────┤
│ 💡 Key Insights              │
│ • You saved 25% more than    │
│   your monthly average       │
│ • Food spending ↑ 12% due to │
│   dining out more often      │
│ • Budget adherence: 95%      │
│   (only Transport over)      │
├──────────────────────────────┤
│ Financial Health             │
│ ██████████░░░░░░░░░░ 62/100 │
│ "Good" — Safe spending with  │
│ room for optimization        │
│                              │
│ Calculation:                 │ ← Explain methodology
│ • Savings Rate: 30% (50%)   │
│ • Budget Adherence: 95% (50%)│
├──────────────────────────────┤
│ ▼ Income vs Expense          │ ← Collapsible sections
│   [Bar chart showing income  │
│    Rp 8M vs expense Rp 5.2M]│
│                              │
│ ▼ Savings Rate               │
│   [Line chart: 28%, 25%, 30%]│ ← 3-month trend
│                              │
│ ▼ Top Spending Categories    │
│   [Pie chart or bar chart]   │
│                              │
│ ▼ Budget Status              │
│   • On Track: 8 categories   │
│   • Warning: 1 (Transport)   │
│   • Over: 0                  │
│                              │
│ ▼ Recommendations            │
│   AI suggests:               │
│   → Increase Transport budget│
│   → Consider meal prep to    │
│     reduce Food spending     │
├──────────────────────────────┤
│ [Share Report] [Export PDF]  │
│ [Compare to Last Month]      │
└──────────────────────────────┘
```

**Comparison Mode (User clicks [Compare to Last Month]):**
```
Side-by-side view:
┌─────────────────┬─────────────────┐
│ February 2026   │ March 2026       │
├─────────────────┼─────────────────┤
│ Rp 7.5M income  │ Rp 8M income     │
│ Rp 5.8M expense │ Rp 5.2M expense │
│ Savings: 22%    │ Savings: 35%     │
│ ↓ vs Jan        │ ↑ vs Feb         │
└─────────────────┴─────────────────┘
```

---

### 4.7 Analytics (Tren & Forecasting) — Redesigned

#### Tren (Trends)

**User Goal:** Identify spending patterns and seasonal variations over 3-12 months.

**Design Changes:**
- ✅ Single hero chart: Income/Expense stacked area (3/6/12-month toggle)
- ✅ Add trend line overlay (polynomial fit showing direction)
- ✅ Replace trend arrows with text: "↑ Food +8% vs average"
- ✅ Add seasonal annotation ("Higher spending typical in December")
- ✅ Category drill-down: Click category → see individual trend
- ✅ Data export for spreadsheet analysis

**Visual Layout:**
```
┌──────────────────────────────┐
│ Tren (Trends)                │
├──────────────────────────────┤
│ View: [3 months] [6m] [12m]  │
│                              │
│ Income/Expense Trend         │
│ [Area chart showing:          │
│  Green income, Red expense,   │
│  Trend line overlay]          │
│ Mar 8M income                │
│ May 7.5M income (↓ -6%)      │
│                              │
│ Savings Rate: 28% avg        │
│ Trending: ↑ Improving        │
├──────────────────────────────┤
│ Category Trends              │
│ 🍔 Food ↑ +8% vs avg        │
│    Spending increased due to  │
│    dining out more           │
│ 🚗 Transport → Stable        │
│    Consistent month-to-month │
│ 🏠 Bills → Stable            │
│                              │
│ Seasonal Notes:              │
│ Mar spending typical for Q1  │
│ (holiday recovery period)    │
├──────────────────────────────┤
│ [Export Data] [Category Drill-down]
└──────────────────────────────┘
```

#### Forecasting (Prakiraan)

**User Goal:** Predict next month's spending by category.

**Design Changes:**
- ✅ Add methodology card (explain calculation)
- ✅ Explain volatility in plain language
- ✅ Inline forecast adjustment (not modal)
- ✅ Alert if forecast exceeds budget
- ✅ Show comparison to 3-month average
- ✅ Quick "Use Forecast as Budget" action

**Visual Layout:**
```
┌──────────────────────────────┐
│ Prakiraan (Forecast)         │
├──────────────────────────────┤
│ April 2026 Forecast          │
├──────────────────────────────┤
│ 📊 How We Calculate:         │ ← Expand/collapse
│ "Based on your last 3 months │
│ of spending, adjusted for    │
│ inflation and trends. ML     │
│ model confidence: 87%"       │
├──────────────────────────────┤
│ 🍔 Food & Dining             │
│ Forecast: Rp 2.3M            │
│ Confidence: ▓▓▓▓▓░░░░░ 87%  │
│ Volatility: ↔ Medium         │
│ (varies Rp 50k-150k month)   │
│ Budget: Rp 2.5M              │
│ Status: ✓ Safe               │
│ [Adjust Forecast]            │
│                              │
│ Your Override: Rp 2.1M ◄─ If user changed
│                              │
│ 🚗 Transport                 │
│ Forecast: Rp 1.8M            │
│ Budget: Rp 1M                │
│ ⚠️ Alert: Forecast exceeds   │
│    budget by Rp 800k         │
│ Consider: Increase budget?   │
│ [Use Forecast as Budget]     │
│                              │
│ Summary:                     │
│ Forecasted Total: Rp 5.8M    │
│ vs Budget: Rp 7.2M           │
│ ✓ On track                   │
├──────────────────────────────┤
│ [Use All Forecasts as Budget]
│ [Adjust All] [Compare to Last Month]
└──────────────────────────────┘
```

**Forecast Adjustment UX (Inline):**
```
Click [Adjust Forecast]
┌──────────────────────────────┐
│ Rp 2.3M                      │
│ [Input appears inline]       │
│ Type "2100000" → displays    │
│ "Rp 2,100,000"              │
│ [Save] [Cancel]              │
│ Your Override: Rp 2.1M       │
└──────────────────────────────┘
```

---

### 4.8 AI Assistant (Asisten) — Redesigned

**Current Problem:** Isolated Q&A, no history, generic responses, limited personality.

**Future Vision:** Multi-turn chat with conversation history, personalization, and proactive insights.

**Layout:**
- Full-screen chat interface (like ChatGPT, not sidebar)
- Conversation history (last 10 conversations)
- Typing indicator while AI responds
- Formatted responses (markdown: bold, lists, tables)
- Suggested follow-ups after each response
- Contextual action buttons ("Set This Budget", "Create This Goal")

**Chat Features:**
- **Memory:** Last 5 messages in context (user can clear history)
- **Personalization:** "Based on YOUR spending" (uses real data)
- **Proactivity:** AI surfaces insights unprompted
- **Explainability:** Every recommendation includes reasoning
- **Agency:** "Here's my suggestion, but you decide"

**Visual Layout:**
```
┌──────────────────────────────┐
│ Asisten (AI Chat)            │
│ History [Last 5 Chats] [···] │ ← Conversation list
├──────────────────────────────┤
│                              │
│ User: "Can I reduce food     │ ← User message (right-aligned)
│ spending?"                   │
│                              │
│ 🤖 Assistant: (Typing...)    │ ← Typing indicator
│                              │
│ 🤖 Assistant:                │ ← AI response (left-aligned)
│ "You spent **Rp 2.1M** on   │
│ food last month. Here are   │
│ ways to reduce:             │
│                              │
│ 1. **Meal prep** — You spent│
│    Rp 450k on dining out    │
│    (21%). Cooking at home   │
│    could save Rp 200k.      │
│                              │
│ 2. **Category shift** — Your│
│    grocery spending (Rp 1.6M)│
│    is 8% higher than your   │
│    food budget (Rp 2.5M).   │
│    Consider increasing       │
│    grocery budget.           │
│                              │
│ Based on your trends, I'd    │
│ suggest Rp 2M is realistic." │
│                              │
│ Suggested Follow-Ups:        │ ← AI suggestions
│ [Show Me Meal Prep Ideas]   │
│ [What if I Meal Prep 50%?]  │
│ [Increase Groceries Budget]  │
│                              │
│ Action Buttons:              │ ← Contextual actions
│ [Set Food Budget to 2M] [Create Meal Prep Goal]
│                              │
├──────────────────────────────┤
│ [Input: "Ask a question..."] │
│ [Attach] [Send] [Clear ...]  │
└──────────────────────────────┘
```

**Conversation History View:**
```
┌──────────────────────────────┐
│ Recent Conversations         │
├──────────────────────────────┤
│ Today                        │
│ "Can I reduce food spending?"│ ← Click to resume
│                              │
│ Yesterday                    │
│ "How can I save more?"       │
│                              │
│ 2 Days Ago                   │
│ "What's my savings rate?"    │
│                              │
│ [Start New Conversation]     │
└──────────────────────────────┘
```

**AI Personality Guidelines:**
- Use second person ("You spent...", not "The user spent...")
- Explain methodology ("I calculated this by...")
- Offer options ("You could try... or...")
- Celebrate wins ("That's 3 months on budget! 🎉")
- Use local references ("Like a nice meal at Warung Buncit")
- Non-judgmental tone ("No judgment if you spent more—here's how to adjust")

---

### 4.9 Tools Section — Multi-Page Design

#### Wallets (Dompet)

**Design Philosophy:** Minimal, trust-building, clear balance.

**Layout:**
- Total balance across all wallets (hero metric)
- Wallet cards (balance, type, transaction count)
- Drag-to-reorder wallets
- Add/Edit/Delete wallet actions
- Reconciliation feature ("Verify balance is accurate")
- Transfer between wallets

**Visual Layout:**
```
┌──────────────────────────────┐
│ Wallets (Dompet)             │
├──────────────────────────────┤
│ Total Balance: Rp 8.5M       │ ← Hero metric
│                              │
│ [BCA Debit] (1 / 3 wallets)  │ ← Plan limit indicator
│ 🏦 Rp 5.2M                   │
│ 47 transactions              │
│ [Edit] [Transfer] [Reconcile]│
│                              │
│ [GoPay E-wallet]             │
│ 💳 Rp 1.8M                   │
│ 23 transactions              │
│ [Edit] [Transfer]            │
│                              │
│ [Cash Box]                   │
│ 💰 Rp 1.5M                   │
│ 12 transactions              │
│ [Edit] [Transfer]            │
│                              │
│ [+ Add Wallet]               │
├──────────────────────────────┤
│ Recent Transfers             │
│ "BCA → GoPay: Rp 500k"       │
│ "Cash Box → BCA: Rp 1M"      │
└──────────────────────────────┘
```

**Reconciliation UX:**
```
Click [Reconcile]
┌──────────────────────────────┐
│ Reconcile BCA Debit          │
├──────────────────────────────┤
│ App balance: Rp 5.2M         │
│ Actual balance: [_______]    │ ← User enters actual
│ Difference: +Rp 200k         │ ← Auto-calculated
│                              │
│ [Record Difference]          │ ← Creates adjustment transaction
│ [Investigate]                │ ← Shows suspicious transactions
│ [Cancel]                     │
└──────────────────────────────┘
```

#### Recurring (Tagihan Berulang)

**Purpose:** Track recurring expenses; automate reminders.

**Visual Layout:**
```
┌──────────────────────────────┐
│ Recurring Bills (Tagihan)    │
├──────────────────────────────┤
│ This Month's Total: Rp 5.5M  │
│ 5 recurring bills due        │
│                              │
│ ⏰ Mar 15: Netflix Rp 50k    │ ← Due soon
│    [Pay Now] [Snooze] [Edit] │
│                              │
│ ⏰ Mar 20: Rent Rp 5M        │
│    [Pay Now] [Snooze] [Edit] │
│                              │
│ ✓ Mar 1: Salary Rp 8M (Paid)│ ← Completed
│                              │
│ 📅 Apr 5: Insurance Rp 450k  │ ← Future
│                              │
│ [+ Add Recurring Bill]       │
│ [Import from Transactions]   │ ← Auto-detect recurring
└──────────────────────────────┘
```

#### Split Bill (Pisah Tagihan)

**Purpose:** Split expenses with friends; track settlement.

**Visual Layout:**
```
┌──────────────────────────────┐
│ Split Bills (Pisah Tagihan)  │
├──────────────────────────────┤
│ [+ New Split]                │
├──────────────────────────────┤
│ Active Splits:               │
│                              │
│ 🍽️ Dinner with Team         │
│ Total: Rp 300k               │ ← Split 3 ways
│ Your share: Rp 100k (paid)   │
│ Status: ✓ Settled            │
│ [View Details]               │
│                              │
│ 🎬 Movie Night               │
│ Total: Rp 150k (4 people)    │
│ You paid: Rp 150k            │
│ You're owed: Rp 112.5k       │ ← Multi-person settlement
│ From: Budi (Rp 50k)          │
│      Siti (Rp 62.5k)         │
│ [Request Payment]            │
│ [Mark as Settled]            │
├──────────────────────────────┤
│ Settled Splits (Archive)     │
│ [Show History]               │
└──────────────────────────────┘
```

#### Categories (Kategori)

**Purpose:** Browse, customize, and manage spending categories.

**Visual Layout:**
```
┌──────────────────────────────┐
│ Categories (Kategori)        │
├──────────────────────────────┤
│ Expense Categories:          │
│                              │
│ 🍔 Food & Dining             │
│ 42 transactions | Custom      │ ← Custom badge
│ [Edit] [Merge] [Delete]      │
│                              │
│ 🚗 Transport                 │
│ 28 transactions | Default     │
│ [Edit]                       │
│                              │
│ [+ Custom Category]          │
├──────────────────────────────┤
│ Category Customization:      │
│ Name | Icon | Color          │
│ Auto-Assign Rules (future)   │ ← Future feature
│ "Starbucks always → Coffee" │
└──────────────────────────────┘
```

---

### 4.10 Insights (Smart Recommendations) — New Page

**Purpose:** AI-generated insights and recommendations (not search-driven, proactive).

**This is the future AI-first value proposition.**

**Layout:**
- **Personalized Insights:** AI surfaces 3-5 key findings weekly
- **Recommended Actions:** "Set this budget", "Create this goal", "Try meal prep"
- **Pattern Detection:** "You spend more on weekends" (behavioral insights)
- **Milestone Tracking:** "3 months on budget! 🎉"
- **Opportunity Identification:** "Savings potential: Rp 200k/month"

**Visual Layout:**
```
┌──────────────────────────────┐
│ Insights (Wawasan)           │
├──────────────────────────────┤
│ This Week (Mar 10-16)        │ ← Weekly refresh
│                              │
│ 🎯 Key Insights              │
│ 1. "You're 15% under budget" │
│    (best week this month)"   │
│                              │
│ 2. "Food spending ↑ 20%"     │
│    "due to dining out Fri &  │
│    Sat. Weekend meals avg    │
│    Rp 180k."                 │
│                              │
│ 3. "Savings rate: 32%"       │
│    "↑ 4% vs last week.       │
│    Trending positive! 📈"    │
│                              │
│ 💡 Recommended Actions       │
│ ✓ "Set Transport budget to   │
│   Rp 1.2M" (you spent Rp 1.5M
│   last 2 months)             │
│   [Set Budget] [Dismiss]     │
│                              │
│ ✓ "Try meal prep to reduce   │
│   Food spending"             │
│   (potential: save Rp 200k)  │
│   [Create Meal Prep Goal]    │
│   [Learn More]               │
│                              │
│ 📊 Patterns                  │
│ • Weekend spending: +45%     │
│   (Fri/Sat avg Rp 150k/day  │
│    vs weekday Rp 103k)       │
│                              │
│ • Monthly trend: Stable      │
│   (Spending varies ±5%)      │
│                              │
│ 🏆 Achievements              │
│ ✓ 3 months on budget (Mar)   │
│ ✓ Savings goal reached (Feb) │
│ ✓ New personal best (April)  │
│   (Rp 2.1M savings)          │
└──────────────────────────────┘
```

**Insights Algorithm (Backend):**
- Weekly recalculation (Tuesday morning, 8am user's timezone)
- ML model trained on user's data + cohort patterns
- Alert threshold: Only surface insights > 10% variance from baseline
- Actionable only: Only recommend if user can act (not just observations)

---

### 4.11 Auth & Login — Redesigned

**Current Problem:** Two auth methods confusing, Telegram ID friction, multiple redirects.

**Future State:** Simple, fast, single flow.

**Design Decision:** Move to **Google OAuth primary** (simple for Telegram users who link accounts), with **SMS fallback** for users without Google.

**Visual Layout:**
```
┌──────────────────────────────┐
│ Gajian Aman                  │ ← Logo, not decorative icons
├──────────────────────────────┤
│ Sign In                      │
│                              │
│ Your financial companion     │ ← Value prop
│ for Indonesian salaries      │
│                              │
│ [Continue with Google] ───── OAuth flow
│ [Continue with Phone] ────── SMS verification
│                              │
│ ─────────────────────────    │
│  or enter Telegram ID        │
│ Telegram ID: [__________]    │ ← Secondary option
│ (e.g. 1234567890)            │ ← Example shown
│ [Sign In]                    │
│                              │
├──────────────────────────────┤
│ New to Gajian Aman?          │
│ [Create Account] ────────    Link to signup flow
│                              │
│ [Privacy Policy] [Help]      │ ← Footer
└──────────────────────────────┘
```

**Account Linking Flow (First-time Google OAuth):**
```
1. User clicks [Continue with Google]
2. Google OAuth redirect
3. Account created (if new)
4. If Telegram user exists: "Link Google to Telegram account?"
   [Link] [Create New Account]
5. Redirect to /onboarding or /overview
```

---

### 4.12 Landing Page — Redesigned

**Current Problem:** Weak value prop, feature-list confusion, no social proof, pricing unclear.

**Future State:** Clear, conversion-focused, trust-building.

**Visual Structure:**
```
1. Sticky Navigation
   [Gajian Aman Logo] ... [Sign In] [Sign Up]

2. Hero Section
   Headline: "Save Rp 500k More Per Month"
   Subheading: "AI-powered budgeting for Indonesian salaried workers"
   CTA: [Get Started Free]
   Background: Subtle gradient, not distracting

3. Social Proof (Early)
   "1,200+ users • Rp 2.3B tracked • 4.8★ on App Store"

4. Features (Top 3 Only)
   ✓ AI-Powered Categorization — Snap receipt, we categorize
   ✓ Intelligent Budgeting — Monthly budgets with real-time alerts
   ✓ Financial Insights — Personalized recommendations from Claude AI

5. How It Works (3 Steps with Visuals)
   Step 1: Log in with Google or Telegram
   Step 2: Link wallets and set budgets
   Step 3: Get insights and save more

6. Comparison Table
   Gajian Aman vs Status Quo (spreadsheet/notebook)
   Features | GA | Spreadsheet | Notebook
   Auto-categorize | ✓ | ✗ | ✗
   Budget alerts | ✓ | ✗ | ✗
   AI insights | ✓ | ✗ | ✗
   Multi-wallet | ✓ | ~ | ~

7. Pricing
   Free: Unlimited transactions, 1 wallet
   Starter: Rp 49k/month, 5 wallets, advanced analytics
   Pro: Rp 99k/month, unlimited wallets, AI priority, API access
   (Show Free as default recommendation)

8. FAQ (Trust-Building)
   "Is my data secure?" - Supabase encryption, Indonesia-hosted
   "Can I import existing transactions?" - Yes, via CSV upload
   "Does it sync with my bank?" - Manual entry + photo recognition, not auto-sync yet
   "What about privacy?" - Never sold, GDPR compliant

9. Trust Section (New)
   "Trusted by Indonesian Finance Professionals"
   Partner logos (Supabase, Vercel, Anthropic)
   Security badges (Encrypted, Privacy-first)

10. CTA Footer
    "Ready to take control of your finances?"
    [Get Started Free] [See Demo]

11. Footer Links
    Product | Pricing | Blog | Security | Privacy | Contact
```

---

### 4.13 Onboarding — Redesigned

**Current Problem:** Wallet creation mandatory, no guidance after setup.

**Future State:** Fast, optional, contextual.

**Flow Changes:**
- Skip wallet creation (users can explore first)
- Move feature education to contextual help (highlighted on first visit)
- Show tutorial prompts on first transaction

**Redesigned Flow:**
```
Step 1: Welcome (Optional)
┌──────────────────────────────┐
│ Welcome to Gajian Aman!      │
│                              │
│ Track spending               │
│ Build budgets                │
│ Achieve financial goals      │
│                              │
│ [Create First Wallet]        │
│ [Skip & Explore] ────────    Optional
│                              │
│ 1 / 3 wallets created        │
└──────────────────────────────┘

Step 2: Wallet Creation (if chosen)
┌──────────────────────────────┐
│ Add Your First Wallet        │
│                              │
│ Wallet Name: [BCA Bank]     │
│ Type: ✓ Bank [ ] E-wallet   │
│       [ ] Cash               │
│ Balance: [5,000,000]         │
│                              │
│ This is for tracking only;   │
│ doesn't connect to your      │
│ actual account yet.          │
│                              │
│ [Create Wallet] [Skip]       │
│                              │
│ 2 / 3                        │
└──────────────────────────────┘

Step 3: Budget Setup (Optional)
┌──────────────────────────────┐
│ Let's Set Your Budget        │
│                              │
│ Monthly Income: [8,000,000]  │
│                              │
│ AI-Recommended Budget:       │
│ 🍔 Food: Rp 2.5M             │
│ 🚗 Transport: Rp 1M          │
│ 🏠 Bills: Rp 3.5M            │
│ ...                          │
│                              │
│ [Use Recommendations]        │
│ [Customize Budget] [Skip]    │
│                              │
│ 3 / 3                        │
└──────────────────────────────┘

Step 4: Complete
┌──────────────────────────────┐
│ You're All Set! 🎉           │
│                              │
│ Next steps:                  │
│ → Add your first transaction │
│ → Set financial goals        │
│ → Check weekly insights      │
│                              │
│ [Go to Dashboard]            │
│                              │
│ Tour tips will appear as you │
│ explore.                     │
└──────────────────────────────┘
```

**Contextual Help (On Dashboard):**
- First-time visitor: Highlight hero metrics
- On spending click: Show tooltip explaining categories
- On budget: Highlight recommended budget chip
- On AI chat: Quick tutorial on conversation flow

---

## 5. DESIGN SYSTEM ARCHITECTURE — PRODUCTION-GRADE

### 5.1 Typography System (Refined)

**Responsive Scale (8-step system):**
```css
/* Desktop (1024px+) */
--text-display: 32px;        /* Hero metrics, page titles */
--text-h1: 28px;             /* Section headers */
--text-h2: 22px;             /* Subsection headers */
--text-h3: 18px;             /* Card headers, subheadings */
--text-body-lg: 16px;        /* Primary body text */
--text-body: 14px;           /* Secondary body, descriptions */
--text-small: 12px;          /* Captions, hints, timestamps */
--text-code: 12px;           /* Monospace code/data */

/* Mobile (375px - 768px) */
--text-display: 28px;        /* Scaled down from 32px */
--text-h1: 24px;             /* Scaled down from 28px */
--text-h2: 20px;             /* Scaled down from 22px */
--text-h3: 16px;             /* Scaled down from 18px */
--text-body-lg: 16px;        /* Same as desktop */
--text-body: 14px;           /* Same as desktop */
--text-small: 12px;          /* Same as desktop */
--text-code: 12px;           /* Same as desktop */

/* Line Height Scale */
--line-height-display: 1.2;  /* Tight headlines */
--line-height-heading: 1.3;  /* Subheadings */
--line-height-body: 1.5;     /* Normal body */
--line-height-large: 1.6;    /* Large body text for readability */

/* Font Weight Levels */
--weight-regular: 400;       /* Normal text */
--weight-medium: 500;        /* Slightly emphasized */
--weight-semibold: 600;      /* Emphasized (headers) */
--weight-bold: 700;          /* Strong emphasis (display) */

/* Font Family */
--font-heading: Manrope;     /* Modern, geometric */
--font-body: "Plus Jakarta Sans"; /* Warm, readable */
--font-mono: "DM Mono";      /* Monospace for numbers/code */
```

**Typography Rules:**
- Display text (page titles): Use `--text-display`, `--weight-bold`, `--line-height-display`
- Headings (section titles): Use `--text-h1/h2/h3`, `--weight-semibold`, `--line-height-heading`
- Body text: Use `--text-body`, `--weight-regular`, `--line-height-body`
- Financial amounts: Always use `--font-mono` (DM Mono) for easy scanning
- Links: Underline on hover, `color: --color-brand-primary`
- Small text/captions: Use `--text-small`, `color: --color-text-secondary`, never below 12px

---

### 5.2 Color System (Semantic, WCAG AAA)

**Brand Palette:**
```css
/* Primary Brand Color */
--color-brand-primary: #4AE54A;      /* Gajian Green */
--color-brand-primary-dark: #38C438;   /* Darker (hover) */
--color-brand-primary-light: #DCFCE7;  /* Light (background) */

/* Secondary Brand */
--color-brand-secondary: #06B6D4;     /* Cyan (accent) */
--color-brand-secondary-dark: #0891B2;
--color-brand-secondary-light: #CFFAFE;
```

**Sentiment Colors (Dual-Coded: Icon + Color):**
```css
/* Success / Positive */
--color-success: #16A34A;      /* Income, budget ok, goal progress */
--color-success-bg: #DCFCE7;

/* Error / Negative */
--color-error: #DC2626;        /* Over budget, warning, expense */
--color-error-bg: #FEE2E2;

/* Warning / Alert */
--color-warning: #D97706;      /* Approaching limit, caution */
--color-warning-bg: #FEF3C7;

/* Info / Neutral */
--color-info: #0369A1;         /* Information, neutral action */
--color-info-bg: #E0F2FE;
```

**Category Colors (Distinct, WCAG AA min):**
```css
/* Expense Categories */
--color-cat-food: #F59E0B;        /* Amber (warm, food-like) */
--color-cat-transport: #3B82F6;   /* Blue (movement, travel) */
--color-cat-shopping: #EC4899;    /* Pink (purchasing) */
--color-cat-bills: #8B5CF6;       /* Purple (utility, serious) */
--color-cat-health: #EF4444;      /* Red (health, important) */
--color-cat-entertainment: #F97316; /* Orange (fun, vibrant) */
--color-cat-education: #06B6D4;   /* Cyan (knowledge, tech) */
--color-cat-personal: #6366F1;    /* Indigo (self-care) */
--color-cat-other: #6B7280;       /* Gray (miscellaneous) */

/* Income Categories */
--color-inc-salary: #059669;      /* Green (main income) */
--color-inc-freelance: #7C3AED;   /* Purple (side work) */
--color-inc-other: #78716C;       /* Brown (other) */

/* Savings Categories */
--color-sav-savings: #0891B2;     /* Cyan (liquid savings) */
--color-sav-investment: #DC2626;  /* Red (higher risk) */
```

**Neutral Scale (Text, Backgrounds):**
```css
/* Light Mode */
--color-surface: #FFFFFF;          /* Pure white (cards, sections) */
--color-surface-secondary: #F9FAFB; /* Subtle background */
--color-surface-tertiary: #F3F4F6;  /* Slight depth */
--color-border: #E5E7EB;            /* Subtle borders */
--color-text-primary: #111827;      /* Darkest text (headings) */
--color-text-secondary: #6B7280;    /* Medium text (body) */
--color-text-tertiary: #9CA3AF;     /* Light text (captions, hints) */

/* Dark Mode (oklch for automatic conversion) */
--color-surface-dark: oklch(0.14 0.02 0);
--color-surface-secondary-dark: oklch(0.17 0.02 0);
--color-text-primary-dark: oklch(0.98 0.02 0);
--color-text-secondary-dark: oklch(0.7 0.02 0);
```

**Interactive States:**
```css
/* All interactive elements use consistent states */
--state-default: var(--color-brand-primary);
--state-hover: var(--color-brand-primary-dark);
--state-active: darken(var(--color-brand-primary-dark), 10%);
--state-disabled: var(--color-text-tertiary);
--state-focus-ring: var(--color-brand-primary);
--state-focus-ring-width: 2px;
```

**WCAG AAA Compliance:**
- All text > 12px: Minimum 7:1 contrast ratio
- All interactive elements: 4.5:1 minimum ratio (text), 3:1 minimum ratio (UI components)
- Color never sole means of conveyance (icon + color always)
- Focus ring: 2px solid brand primary around interactive elements

---

### 5.3 Spacing System (8px Baseline, Refined)

**Spacing Scale:**
```css
--space-1: 4px;    /* Tiny gaps (between icon + text) */
--space-2: 8px;    /* Small gaps (between form inputs) */
--space-3: 12px;   /* Small-medium (form field gap) */
--space-4: 16px;   /* Medium (section internal) */
--space-5: 20px;   /* Medium-large (card gaps) */
--space-6: 24px;   /* Large (section spacing) */
--space-8: 32px;   /* Extra large (major sections) */
--space-10: 40px;  /* Huge (page sections, breathing room) */
--space-12: 48px;  /* Massive (hero sections) */
```

**Component Spacing Rules:**

| Component | Rule |
|-----------|------|
| **Button** | Padding: 12px (vert) × 16px (horiz); Min height: 44px |
| **Form Input** | Padding: 12px; Border radius: 8px; Height: 44px |
| **Card Padding** | Desktop: 24px; Mobile: 16px; Never less than 16px |
| **Form Field Gap** | 16px between label and input; 8px between input and error |
| **List Item Gap** | 12px between items (consistent row spacing) |
| **Section Margin** | Desktop: 40px vertical; Mobile: 24px vertical |
| **Modal Padding** | 24px (consistent with card padding) |
| **Navigation Gap** | 8px between nav items |
| **Hero Section** | Top padding: 48px; Bottom: 40px |

**Responsive Spacing:**
- Desktop (1024px+): Use full spacing scale
- Tablet (768px-1024px): Reduce section margins by 20% (40px → 32px)
- Mobile (< 768px): Reduce all margins by 30% (40px → 24px, 24px → 16px)

**Implementation in Tailwind:**
```jsx
// Use Tailwind spacing utilities directly
<div className="p-6 md:p-8 lg:p-10">  // 24px, 32px, 40px
<div className="space-y-6 md:space-y-8"> // 24px, 32px gaps
```

---

### 5.4 Elevation & Shadow System

**Shadow Tokens (6 Levels):**
```css
/* Level 0: No shadow (default surface) */
--shadow-0: none;

/* Level 1: Subtle (cards, inputs) */
--shadow-1: 0 1px 3px rgba(13, 40, 24, 0.06),
            0 1px 2px rgba(13, 40, 24, 0.04);

/* Level 2: Card Hover */
--shadow-2: 0 4px 12px rgba(13, 40, 24, 0.10),
            0 2px 4px rgba(13, 40, 24, 0.06);

/* Level 3: Floating Action / Tooltip */
--shadow-3: 0 12px 24px rgba(13, 40, 24, 0.15),
            0 4px 8px rgba(13, 40, 24, 0.08);

/* Level 4: Popover / Dropdown */
--shadow-4: 0 20px 40px rgba(13, 40, 24, 0.20),
            0 8px 16px rgba(13, 40, 24, 0.10);

/* Level 5: Modal / Sidebar */
--shadow-5: 0 25px 50px rgba(13, 40, 24, 0.25),
            0 10px 20px rgba(13, 40, 24, 0.12);
```

**Elevation Usage:**
| Element | Shadow Level |
|---------|---|
| Inputs, plain cards | Level 1 |
| Hoverable cards | Level 2 (on hover) |
| FAB, floating content | Level 3 |
| Dropdowns, popovers | Level 4 |
| Modals, sidebars | Level 5 |

**Dark Mode Shadow:**
- Use same shadow tokens but increase opacity 20% (shadows darker in dark mode for contrast)

---

### 5.5 Border Radius System (Simplified)

**Simplified 4-Level System:**
```css
--radius-sm: 8px;    /* Inputs, small buttons, chips */
--radius-md: 12px;   /* Cards, standard buttons, modals */
--radius-lg: 20px;   /* Large cards, hero sections */
--radius-full: 9999px; /* Avatars, chips, fully rounded elements */
```

**Usage Rules:**
- Inputs: `--radius-sm` (8px)
- Buttons: `--radius-sm` (8px) for compact, `--radius-md` for standard
- Cards: `--radius-md` (12px)
- Large sections (hero): `--radius-lg` (20px)
- Avatars: `--radius-full`
- Chips/badges: `--radius-full`

---

### 5.6 Component Library (40 Reusable Components)

**Core Components (10):**
1. **Button** — Primary, secondary, ghost, danger; sizes: sm, md, lg; states: default, hover, active, disabled, loading
2. **Input** — Text, currency, date, time; with label, hint, error; icon support
3. **Card** — Surface, elevated, floating; with header, body, footer
4. **Badge/Chip** — Status (safe, warning, over), category, tag, type
5. **Select/Dropdown** — With search, multi-select, custom rendering
6. **Tab** — Underline style, pill style
7. **Modal** — With header, body, footer; focus trap; close button
8. **BottomSheet** — Mobile-optimized modal alternative
9. **Toast/Notification** — Success, error, warning, info
10. **Progress Bar** — Linear, circular; with percentage label

**Form Components (8):**
1. **FormField** — Label + input + error + hint wrapper
2. **CurrencyInput** — Auto-formatting, Rp prefix, thousands separator
3. **DatePicker** — Calendar popup, range selection
4. **Checkbox** — Single, group
5. **Radio** — Single, group
6. **Toggle** — On/off switch
7. **TextArea** — Multi-line input
8. **FormError** — Inline error message

**Data Display Components (8):**
1. **Table** — Sortable columns, sticky header, expandable rows
2. **List** — Vertical list with dividers, action menu
3. **Card Grid** — Responsive 1/2/3 column layout
4. **Chart Card** — Wrapper for Recharts with legend, tooltip
5. **Metric Card** — Hero number with label and trend
6. **Progress Card** — Progress bar with metadata
7. **Transaction Row** — Expandable transaction details
8. **Avatar** — User profile picture, initials fallback

**Navigation Components (6):**
1. **Bottom Navigation** — 5-icon primary nav
2. **Sidebar** — Left nav with collapse
3. **Header** — Top bar with logo, menu, filters
4. **Breadcrumbs** — Path navigation
5. **Pagination** — Page numbers, prev/next
6. **Stepper** — Step indicator for onboarding/wizards

**Feedback Components (4):**
1. **Skeleton** — Placeholder while loading
2. **Empty State** — Illustration + message + CTA
3. **Loading State** — Spinner, shimmer effect
4. **Error Boundary** — Fallback error UI

**AI-Specific Components (5):**
1. **ChatBubble** — User/assistant message styling
2. **TypingIndicator** — "AI is responding..." animation
3. **SuggestedAction** — Button for AI follow-up actions
4. **InsightCard** — AI recommendation with explanation
5. **ConfidenceIndicator** — Shows AI confidence percentage

---

## 6. AI-FIRST EXPERIENCE REDESIGN

### 6.1 Conversational Budgeting (Multi-Turn Chat)

**Example Flow:**

```
User: "How can I save more money?"

AI: "Looking at your spending, you have two opportunities:

1. **Meal Prep** — Last month you spent Rp 450k dining out (21% of Food budget).
   If you meal-prepped 50% of those meals, you'd save ~Rp 225k/month.

2. **Transport Optimization** — Your transport spending averages Rp 1.5M but 
   varies wildly. Could you use ride-sharing less and use the monthly bus pass
   you mentioned setting up last week?

Combined potential: **Rp 275k/month** (6% of current spending).

Want me to help you set up a meal prep goal or adjust your budget?"

[Suggested Actions]:
[Set Up Meal Prep Goal] [Adjust Transport Budget] [Show More Options]

---

User: "Let's do meal prep. How much should I budget?"

AI: "Based on your pattern:
- Current dining out: Rp 450k/month
- If you prep 50% of meals: spend ~Rp 225k
- Plus groceries for prep: ~Rp 100k extra
- **Total Food budget I'd suggest: Rp 1.7M** (current: Rp 2.1M)

That's a Rp 400k reduction while actually eating better.

Ready to create a 'Meal Prep' goal to track this?"

[Create Goal] [Adjust Amount] [Tell Me More]

---

User: "Create goal please"

AI: "I've created your **Meal Prep** goal with:
- Target: Rp 1.7M monthly (food budget)
- Deadline: 6 months (to build habit)
- First milestone: 25% reduction by month 2

I'll check in weekly with updates. Next week I'll show you your 
progress and any new insights.

By the way, I've also flagged that your Transport budget might need 
adjusting. Want to tackle that next?"

[Yes, Let's Optimize Transport] [Not Right Now] [View Goal]
```

**Key Conversational Features:**
- **Multi-turn memory:** AI remembers user's constraints (mentioned budget limits, preferences)
- **Personalization:** "Based on YOUR spending" — uses real data, not generic advice
- **Explainability:** Every suggestion includes calculation rationale
- **Progressive actions:** "Want to..." suggestions instead of prescriptive demands
- **Context continuity:** Can follow up on previous conversations naturally

### 6.2 Proactive Insights (Weekly)

**AI Surfaces These Insights Proactively:**

1. **Milestone Celebrations** (when achieved)
   - "3 months on budget! 🎉 This is the longest you've maintained discipline. Keep it up!"
   - "Savings rate hit all-time high: 35%! You're officially in the top 10% of users."

2. **Pattern Discoveries**
   - "You spend 45% more on weekends. Every Saturday dinner out averages Rp 180k."
   - "Food spending drops to Rp 1.2M in months with company trips. Maybe travel makes you cook more?"

3. **Anomalies & Alerts**
   - "Transport spending jumped 30%. Uber price surge? Or new routine?"
   - "You've exceeded Entertainment budget on Day 5 of the month. On track to overshoot by Rp 200k."

4. **Optimization Opportunities**
   - "You pay for 3 streaming services. Consolidated they could save Rp 150k/month."
   - "Savings rate improved 8% since you started meal prep. Keep going!"

5. **Behavioral Insights**
   - "Spending drops by 20% after checking weekly report. Accountability works for you!"
   - "You tend to splurge after stressful weeks. Budget for self-care?"

### 6.3 AI Action Integration

**"Apply This Recommendation" Flows:**

After AI suggests insight, user can immediately act:
```
AI: "Consider increasing Transport budget to Rp 1.5M (you've exceeded every month)."

[Set Budget to 1.5M] [Show Trend] [Dismiss]

Click [Set Budget to 1.5M] → Inline edit appears → [Save] [Cancel]
→ Toast: "Budget updated. Your Transport budget is now Rp 1.5M." [Undo]
```

### 6.4 AI Confidence & Explainability

**Always Show Methodology:**

```
AI: "I forecast you'll spend Rp 5.8M next month."

What's this based on?
  • Last 3 months average: Rp 5.5M
  • Inflation adjustment: +2% (based on category trends)
  • ML confidence: 87% (fairly reliable)
  
Why this accuracy?
  • Your spending is stable (varies ±5% month-to-month)
  • No major life changes detected

Less confident about:
  • Transport (high variability, depends on fuel/travel)
  • Entertainment (discretionary, unpredictable)
```

---

## 7. DASHBOARD & ANALYTICS REDESIGN STRATEGY

### 7.1 Dashboard Storytelling Pattern

**Redesigned Overview follows this hierarchy:**

1. **Hero Metric** (40% of above-fold)
   - Single large number: Current month balance or savings achieved
   - Supporting text: "↑ 15% vs last month" or "You're on track"

2. **Status Row** (30% of above-fold)
   - 3 cards: Income received | Money spent | Available to spend
   - Tappable for drill-down

3. **Quick Insight** (20% of above-fold)
   - AI-generated summary: "You're 12% under budget (best month this year!)"
   - Conversational tone, encouraging

**Below fold:**
4. Primary Chart: Income vs Expense (stacked bar)
5. Category Breakdown: Top 3 spending categories
6. Goals Progress: Mini cards for top goals
7. Upcoming Bills: Next 5 recurring items
8. Recent Transactions: Last 5 (expandable)

**Progressive Disclosure:**
- All charts start collapsed (headline visible, chart hidden)
- Click "▼ Income vs Expense" → chart expands
- Save user's preferences (which charts expanded) in localStorage

### 7.2 Mobile-First Responsive Charts

**Recharts Responsive Strategy:**

```jsx
// Mobile behavior for charts
{isMobile ? (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart layout="vertical" data={data}> // Horizontal on mobile
      <Bar dataKey="amount" fill={color} />
    </BarChart>
  </ResponsiveContainer>
) : (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}> // Vertical on desktop
      <Bar dataKey="amount" fill={color} />
    </BarChart>
  </ResponsiveContainer>
)}
```

**Chart Accessibility:**
- Tooltip: Tap on mobile, hover on desktop (show exact values)
- Legend: Always visible below chart, horizontal layout
- Accessible description: `aria-label="Income vs Expense for March: Rp 8M income, Rp 5.2M expense"`

### 7.3 Insight Card System

**Insight Card Structure:**

```
┌─────────────────────────────┐
│ 💡 Smart Insight            │
│                             │
│ "You're 12% under budget    │
│ this month — your best      │
│ performance this year! 🎉"  │
│                             │
│ Based on: April spending    │
│ Confidence: 98%             │
│                             │
│ [Learn More] [Dismiss]      │
└─────────────────────────────┘
```

---

## 8. TRANSACTION EXPERIENCE REDESIGN

### 8.1 Quick Add Flow (Optimized for Speed)

**Current problem:** Multiple taps to add transaction. Future: 3 taps, 5 seconds.

**Redesigned Flow:**
```
1. Tap FAB (+) anywhere in app
   ↓ Bottom sheet appears
   
┌─────────────────────────────┐
│ [Quick Add] [Photo] [AI]    │ ← 3 quick tabs
├─────────────────────────────┤
│ Amount: [2500000]           │ ← Numeric keyboard
│                             │
│ Category: 🍔 Food [▼]       │ ← Pre-filled from last trans
│ Wallet: BCA [▼]             │ ← Default wallet
│                             │
│ Note: [Optional...]         │ ← Optional
│                             │
│ [Cancel] [Save]             │
└─────────────────────────────┘

2. Enter amount (currency formatting automatic)
3. Tap [Save]
```

**Smart Defaults:**
- Category: Pre-filled based on last transaction type (or time of day)
- Wallet: Use default or last used wallet
- Date: Today (can edit by clicking date)

### 8.2 Photo-Based Entry (AI Parsing)

**Existing feature, streamlined UI:**

```
[Photo Tab]
┌─────────────────────────────┐
│ Take Photo or Upload        │
│                             │
│ 📷 [Take Photo] [Upload]    │
│                             │
│ Or use Gallery:             │
│ [Recent Receipt]            │
│ [Receipt from 5 mins ago]   │
└─────────────────────────────┘

After photo uploaded → AI parsing → Results sheet:
┌─────────────────────────────┐
│ Parsed Transaction          │
├─────────────────────────────┤
│ Amount: Rp 450,000          │
│ Confidence: ▓▓▓▓▓░░░░░ 92% │
│                             │
│ Category: 🛍️ Shopping       │
│ Note: "Amazon book order"   │
│ Wallet: BCA                 │
│                             │
│ [Confirm] [Edit] [Discard]  │
└─────────────────────────────┘
```

### 8.3 Categorization UX

**Smart Category Selection:**

Option 1: **Dropdown** (for quick selection of common categories)
```
[Dropdown shows recent categories first]
- 🍔 Food (5 recent)
- 🚗 Transport (4 recent)
- 🏠 Bills (2 recent)
- ─────────────
- 🛍️ Shopping
- 💊 Health
- [+ Custom]
```

Option 2: **Grid** (when not sure, browse categories)
```
┌─┬─┬─┐
│🍔│🚗│🏠│ ← Most common
├─┼─┼─┤
│💳│💊│🎮│ ← Secondary
├─┼─┼─┤
│🎓│🏋️│📚│ ← Tertiary
│ │ │ │
│[+ Add Custom]
```

Option 3: **AI Suggestion** (photo-parsed or text-analyzed)
```
"Based on your receipt and spending patterns,
this looks like Shopping (95% confidence).

[Agree] [No, Choose Different] [Show Options]"
```

---

## 9. MOBILE UX STRATEGY (CRITICAL)

### 9.1 Thumb-Zone Optimization

**iPhone/Android Safe Zone (44-668px from bottom):**

```
┌────────────────┐  ←────── Top bar (header)
│ [≡] [Logo] [•••]│         Safe to tap but reach
├────────────────┤
│                │         Easy reach zone
│                │ ← 50-60% of screen
│                │
│                │
├────────────────┤
│ [🏠] [💰] [📊] │ ← Primary nav (bottom)
│ [🛠️] [🤖]      │    Easy tap targets
└────────────────┘

Safe Tap Zones:
• Bottom 20% (nav, FAB, CTA buttons)
• Center 60% (main content)
• Top 20% (headers, non-critical)

Avoid:
• Top-left corner (hard reach, too close to notch)
• Bottom-left corner (swipe gesture area)
```

### 9.2 Bottom Navigation Best Practices

**Mobile Navigation Setup:**

```
Structure (Fixed Bottom):
┌────────────────────────┐
│ Rp 3.2M Balance        │ ← Main content scrolls
│ Mar 14: Supermarket    │   up behind nav
│ ...                    │
├────────────────────────┤
│ [Home] [Spend] [Analytics] │ ← 5 primary icons
│ [Tools] [AI]           │   Always visible
└────────────────────────┘

Icon + Label:
┌──┐
│🏠│ ← 24x24px icon
│Home│ ← 12px label
└──┘

Min tap target: 56px × 56px (exceeds 44px)
Spacing: 12px between items
Background: Solid (not translucent; improves readability)
Safe area: 20px bottom padding on iPhone X+
```

### 9.3 Mobile Form UX

**Form Optimization for Mobile:**

1. **One input per screen** (if possible)
2. **Large touch targets** (56px min)
3. **Smart keyboard** (numeric for amounts, email for email)
4. **Auto-focus** (first input focused on sheet open)
5. **Autocomplete** (for recurring fields)
6. **Error inline** (below input, not modal)

```
┌─────────────────────────────┐
│ Add Transaction             │
├─────────────────────────────┤
│                             │
│ Amount:                     │
│ [        2,500,000] ← Large input
│                             │ ← Numeric keyboard auto-open
│ Category:                   │
│ [Food         ▼]  ← Dropdown
│                             │
│ Wallet:                     │
│ [BCA          ▼]            │
│                             │
│ Note:                       │
│ [Optional...] ← Optional, click to expand
│                             │
│ [Cancel]   [Save]           │ ← Full-width buttons
└─────────────────────────────┘
```

### 9.4 Mobile Gesture System

**Standard Mobile Gestures:**

| Gesture | Action | Context |
|---------|--------|---------|
| **Tap** | Primary action | Everything |
| **Double-tap** | Favorite/star | Transaction rows (optional) |
| **Swipe left** | Delete or Archive | Transaction rows |
| **Swipe right** | Flag or Add to Goal | Transaction rows |
| **Long-press** | Context menu | Transaction rows, categories |
| **Pinch zoom** | Zoom charts | Chart cards (if applicable) |
| **Pull-down** | Refresh | Any list or table |
| **Scroll** | Navigate | Vertical scrolling for content |

---

## 10. MOTION & MICRO-INTERACTIONS SYSTEM

### 10.1 Animation Principles

**Philosophy:** Smooth, subtle, purposeful (never gratuitous).

**Timing:**
- Micro-interactions (button press, toggle): 150-200ms
- Page transitions: 300-400ms
- Chart animations: 500-800ms
- Toast notifications: Fade in 200ms, fade out 300ms

**Easing:**
- Default: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring physics)
- Ease-out: For dismissals, completions
- Ease-in: For entering interactions

### 10.2 Micro-Interactions

**Button Press:**
```
Default state
  ↓ [User presses]
Pressed state (scale 0.98, shadow reduced 50%, 100ms)
  ↓ [User releases]
Release animation (scale back to 1.0, spring easing, 200ms)
```

**Input Focus:**
```
Unfocused: border-color: --color-border
Focused: border-color: --color-brand-primary, box-shadow: 0 0 0 3px --color-brand-primary-light
Focus ring: 2px solid --color-brand-primary
```

**Toast Notification:**
```
Enter: Slide in from bottom, fade in (200ms, ease-out)
Stay: Visible for 4-6 seconds (action-dependent)
Exit: Fade out, slide out (300ms, ease-in)
```

**Chart Animation (on first load):**
```
Bars grow from 0 to full height (800ms, spring easing)
Line chart path animates left-to-right (600ms, ease-out)
Area chart fills from bottom-up (800ms, ease-out)
```

### 10.3 Loading States

**Skeleton Loading:**
```
// Layout-preserving skeleton
┌──────────────────────────┐
│ [Skeleton Title    ]     │ ← 60% width, 16px height, shimmer
│ [Skeleton text...] [   ] │ ← Multiple lines
│ [                       ]│ ← Full-width skeleton
│ [Skeleton content]      │
└──────────────────────────┘

Shimmer animation:
  • Gradient pulse: left → right, 2 seconds
  • Opacity: 0.6 → 1.0 → 0.6
  • Never rotate/spin (too eye-catching)
```

**AI Typing State:**
```
"🤖 Asisten is typing..."
  
Animated dots:
"🤖 Asisten is typing. 
  🤖 Asisten is typing..
  🤖 Asisten is typing..."
  
Loop every 600ms
```

---

## 11. FIGMA IMPLEMENTATION ARCHITECTURE

### 11.1 Figma File Structure

**Recommended Organization:**

```
Gajian Aman Design System
├── 📑 Cover Page
│   └── Project intro, team, version
│
├── 🎨 Design Tokens
│   ├── Colors (light + dark palette)
│   ├── Typography (scales, font family, line heights)
│   ├── Spacing (8px scale, responsive adjustments)
│   ├── Shadows (elevation levels)
│   ├── Radius (4 levels: sm, md, lg, full)
│   └── Motion (easing, duration tokens)
│
├── 🧩 Components Library
│   ├── Buttons (Primary, Secondary, Ghost, Danger)
│   │   ├── Sizes: SM, MD, LG
│   │   └── States: Default, Hover, Active, Disabled, Loading
│   ├── Inputs (Text, Currency, Date, Email)
│   │   └── States: Default, Focused, Error, Disabled
│   ├── Cards (Surface, Elevated, Floating)
│   ├── Chips/Badges (Status, Category, Type)
│   ├── Forms (FormField wrapper, error states)
│   ├── Charts (ChartCard wrapper, Recharts placeholder)
│   ├── Tables (Header, Row, Expandable)
│   ├── Modals (Header, Body, Footer)
│   ├── BottomSheets (Mobile alternate to modal)
│   ├── Toasts (Success, Error, Warning, Info)
│   └── ...all 40 components
│
├── 📱 Mobile Screens (375px width, iPhone 12)
│   ├── 01-Auth
│   │   ├── Login
│   │   ├── Onboarding Wizard
│   │   └── Account Linking
│   ├── 02-Home (Bottom Nav)
│   │   ├── Overview
│   │   ├── Insights
│   │   └── [Quick Add Modal]
│   ├── 03-Spend
│   │   ├── Spending (Chart/List tabs)
│   │   ├── Budget
│   │   └── Goals
│   ├── 04-Analytics
│   │   ├── Reports
│   │   ├── Trends
│   │   └── Forecasting
│   ├── 05-Tools
│   │   ├── Wallets
│   │   ├── Recurring
│   │   ├── Split Bill
│   │   └── Categories
│   ├── 06-AI Chat
│   │   ├── Chat Thread
│   │   ├── Chat History
│   │   └── [Suggested Actions]
│   └── 07-Transaction
│       ├── Riwayat (History Table)
│       ├── Transaction Details (Expanded)
│       └── [Edit Transaction Modal]
│
├── 🖥️ Desktop Screens (1920px width)
│   ├── Same structure as mobile
│   ├── With sidebar navigation
│   ├── Right context panels
│   └── Expanded layouts
│
├── 📐 Page Transitions & Flows
│   ├── Onboarding Flow
│   ├── Add Transaction Flow
│   ├── Budget Management Flow
│   ├── AI Chat Flow
│   └── Explainer Annotations
│
└── 🔍 References & Documentation
    ├── Design System Version (1.0)
    ├── Changelog
    ├── Handoff Notes (for dev)
    └── Accessibility Checklist
```

### 11.2 Auto-Layout & Responsive Design

**Button Component Example:**

```
Button (Component)
├── Wrapper (auto-layout, horizontal)
│   ├── Label (text, responsive sizing)
│   ├── Gap: 8px (between icon + label)
│   └── Padding: 12px vertical, 16px horizontal
│       (responsive: mobile 10px × 12px)
│
Variants:
├── Property: Variant
│   ├── Primary / Secondary / Ghost / Danger
│   └── Sm / Md / Lg (size)
├── Property: State
│   ├── Default / Hover / Active / Disabled / Loading
│
Mobile 375px:
├── Button height: 44px
├── Horizontal padding: 12px (reduces from 16px)
├── Font: --text-body (14px)
└── Icon size: 16px
```

**Card Component Example:**

```
Card (Component)
├── Wrapper (auto-layout, vertical)
│   ├── Padding: 24px (desktop), 16px (mobile)
│   ├── Background: --color-surface
│   ├── Border-radius: --radius-md (12px)
│   ├── Shadow: --shadow-1
│   │
│   └── Card Content (auto-layout, vertical)
│       ├── Header (if included)
│       ├── Body
│       └── Footer (if included)
│
Responsive:
├── Desktop: 24px padding
├── Tablet: 20px padding
├── Mobile: 16px padding (auto-layout adjust)
```

### 11.3 Design Token Implementation

**In Figma (using Variables feature):**

```
Variables → Collections:
├── Colors
│   ├── Brand
│   │   ├── primary: #4AE54A
│   │   ├── primary-dark: #38C438
│   │   └── primary-light: #DCFCE7
│   ├── Sentiment
│   │   ├── success: #16A34A
│   │   ├── error: #DC2626
│   │   └── warning: #D97706
│   └── Categories
│       ├── food: #F59E0B
│       ├── transport: #3B82F6
│       └── ...
│
├── Spacing
│   ├── space-1: 4px
│   ├── space-2: 8px
│   ├── space-4: 16px
│   └── ...
│
├── Shadows
│   ├── shadow-1: {...}
│   ├── shadow-2: {...}
│   └── ...
│
├── Radius
│   ├── radius-sm: 8px
│   ├── radius-md: 12px
│   └── ...
│
└── Typography
    ├── font-heading: Manrope
    ├── font-body: Plus Jakarta Sans
    └── font-mono: DM Mono
```

---

## 12. FRONTEND IMPLEMENTATION STRATEGY

### 12.1 Design Token Architecture (Tailwind + CSS Variables)

**File Structure:**

```
frontend/src/
├── styles/
│   ├── tokens/
│   │   ├── colors.css        # Color variables
│   │   ├── spacing.css       # Spacing scale
│   │   ├── typography.css    # Font families, sizes
│   │   ├── shadows.css       # Shadow tokens
│   │   ├── radius.css        # Border radius
│   │   └── index.css         # All tokens imported
│   │
│   ├── theme.css             # Theme application
│   ├── fonts.css             # Font imports
│   ├── base.css              # Global base styles
│   ├── responsive.css        # Media queries
│   ├── animations.css        # Keyframe definitions
│   └── index.css             # Master import
│
└── tailwind.config.js        # Tailwind customization
```

**Tailwind Config Integration:**

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-brand-primary)',
          'primary-dark': 'var(--color-brand-primary-dark)',
          // ...
        },
        sentiment: {
          success: 'var(--color-success)',
          error: 'var(--color-error)',
          // ...
        },
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        4: 'var(--space-4)',
        // ...
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        // ...
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        // ...
      },
    },
  },
};
```

### 12.2 Component Architecture

**reusable component structure:**

```
frontend/src/app/components/
├── ui/                          # shadcn/ui base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
│
├── atoms/                       # Simple, single-purpose components
│   ├── Badge.tsx
│   ├── Chip.tsx
│   ├── Avatar.tsx
│   ├── Metric.tsx               # Hero metric card
│   ├── StatusBadge.tsx          # Status indicator
│   └── ...
│
├── molecules/                   # Composed atoms
│   ├── FormField.tsx            # Label + input + error wrapper
│   ├── CurrencyInput.tsx        # Auto-formatting amount input
│   ├── ProgressCard.tsx         # Progress bar + label
│   ├── TransactionRow.tsx       # Expandable transaction item
│   ├── ChartCard.tsx            # Recharts wrapper
│   └── ...
│
├── sections/                    # Page sections / containers
│   ├── Overview/
│   │   ├── HeroBalance.tsx
│   │   ├── StatusRow.tsx
│   │   ├── SpendingChart.tsx
│   │   └── index.tsx            # Combines all sections
│   ├── Spending/
│   ├── Budget/
│   └── ...
│
└── layout/
    ├── Layout.tsx               # Main wrapper (sidebar + outlet)
    ├── BottomNav.tsx            # Mobile bottom navigation
    ├── MobileNav.tsx            # Mobile menu
    ├── Header.tsx               # Top bar
    └── Sidebar.tsx              # Desktop left sidebar
```

### 12.3 AI Component Integration

**AI-specific components:**

```
frontend/src/app/components/ai/
├── ChatBubble.tsx              # User/assistant message
├── TypingIndicator.tsx         # "AI is responding..." animation
├── SuggestedAction.tsx          # Clickable AI recommendation
├── InsightCard.tsx             # AI insight with action
├── ConfidenceIndicator.tsx     # AI confidence percentage
└── ChatInterface.tsx           # Multi-turn chat container
```

### 12.4 State Management Strategy

**Recommended approach:** Context API + Zustand for complex state.

```typescript
// hooks/useNavigation.ts
export const useNavigation = () => {
  const [currentSection, setCurrentSection] = useState('home');
  const [activeTab, setActiveTab] = useState({}); // per section
  return { currentSection, setCurrentSection, activeTab, setActiveTab };
};

// hooks/useFilterState.ts
export const useFilterState = (section: string) => {
  const [filters, setFilters] = useState({
    wallet: 'all',
    dateRange: null,
    category: null,
  });
  
  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(`filters-${section}`, JSON.stringify(filters));
  }, [filters]);
  
  return { filters, setFilters };
};

// hooks/useChatHistory.ts
export const useChatHistory = () => {
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  
  // Store in sessionStorage (not persisted, cleared on logout)
  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setCurrentChat(prev => ({
      ...prev,
      messages: [...prev.messages, { role, content }]
    }));
  };
  
  return { conversations, currentChat, addMessage };
};
```

---

## 13. REDESIGN ROADMAP & PHASING

### Phase 1: Foundation (Q3 2026 — 6 weeks)

**Focus:** Core UX improvements, navigation restructure, design system.

**Deliverables:**
- ✅ 5-tab bottom navigation (mobile)
- ✅ Redesigned Overview dashboard
- ✅ Updated Spending & Budget pages
- ✅ Design token system complete
- ✅ Component library (20 core components)
- ✅ New landing page + onboarding flow

**Tech Work:**
- Tailwind config with design tokens
- shadcn/ui baseline components
- Navigation context refactor
- Form validation system

**User Impact:**
- Clearer navigation
- Calmer dashboard experience
- Faster transaction entry
- Better mobile experience

### Phase 2: Analytics & AI (Q3-Q4 2026 — 4 weeks)

**Focus:** Advanced analytics, AI chat redesign.

**Deliverables:**
- ✅ Multi-turn chat interface
- ✅ Conversation history
- ✅ Redesigned Laporan, Tren, Forecasting
- ✅ Insights page (proactive recommendations)
- ✅ Chart upgrades (legend, mobile responsiveness)

**Tech Work:**
- Chat state management
- Conversation persistence
- Chart optimization
- API integration for insights

**User Impact:**
- AI feels like a coach, not a search box
- Analytics more understandable
- Insights surface proactively
- Better mobile chart experience

### Phase 3: Tools & Polish (Q4 2026 — 3 weeks)

**Focus:** Tools section, motion, accessibility, refinement.

**Deliverables:**
- ✅ Wallets, Recurring, Split Bill, Categories
- ✅ Motion system (animations, micro-interactions)
- ✅ Accessibility audit & fixes (WCAG AAA)
- ✅ Dark mode (if applicable)
- ✅ Performance optimization

**Tech Work:**
- Tool page implementations
- Animation framework setup
- Accessibility testing
- Performance profiling

**User Impact:**
- Feature parity with old app
- Premium feel (smooth animations)
- Full accessibility
- Faster loading

### Phase 4: Beta & Refinement (Q4 2026 — ongoing)

**Focus:** User testing, bug fixes, iteration.

**Activities:**
- Public beta (invite-only)
- Gather feedback
- Fix edge cases
- Monitor performance
- Plan future features (dark mode, native apps, etc.)

---

## CONCLUSION — REDESIGN PHILOSOPHY SUMMARY

This redesign transforms Gajian Aman from a **feature-crowded dashboard** into an **emotionally intelligent financial companion**.

**Core Transformations:**

| Dimension | Current | Redesigned |
|-----------|---------|-----------|
| **Navigation** | 39 pages, sidebar | 5 primary tabs, bottom nav |
| **Cognitive Load** | High (6+ charts per page) | Low (progressive disclosure) |
| **AI Experience** | Q&A box | Multi-turn coach with memory |
| **Visual Feel** | Cluttered, dense | Calm, spacious, premium |
| **Mobile Experience** | Retrofit to desktop | Mobile-native, thumb-optimized |
| **Data Presentation** | Many charts, unclear | Hero metric + supporting story |
| **User Emotion** | Overwhelmed, confused | Empowered, confident |

**Why This Redesign Matters:**

Personal finance apps succeed when they make users **feel confident, not anxious**. The current Gajian Aman is feature-rich but emotionally draining—too much data, unclear priorities, passive AI.

The redesign prioritizes **calm, intelligence, and progressivity**:
- **Calm:** Generous spacing, clear hierarchy, one question at a time
- **Intelligence:** AI understands context, explains reasoning, anticipates needs
- **Progressive:** Summary by default, details on demand, learning curve gentle

This creates an app users **want** to open, not feel obligated to use—the foundation of long-term engagement.

---

**Document Version:** 1.0  
**Last Updated:** May 20, 2026  
**Maturity:** Implementation-Ready  
**Next Steps:** Figma design file creation (1-2 weeks), Frontend component build (4-6 weeks)
