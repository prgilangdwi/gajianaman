# Gajian Aman — Complete Project Context

**For use by antigravity or fresh Claude Code sessions.** This document is self-contained and requires no codebase exploration.

---

## 1. Project Identity & Goals

### Product Overview
- **Brand name:** Gajian Aman ("Safe Until Payday")
- **Internal repo name:** Fintrack
- **Live domain:** gajianaman.xyz
- **Target users:** Indonesian salaried workers tracking monthly spending
- **Mission:** Help users stay financially safe between paydays by tracking all transactions and providing AI-powered insights

### Architecture (Two Connected Apps)
1. **Python Telegram Bot** (write-heavy)
   - Users log transactions via chat commands or receipt photos
   - Real-time categorization using Claude Haiku + Gemini Flash
   - Direct database writer
   - Deployed on Railway

2. **React Web Dashboard** (read-heavy)
   - Visualization of transactions, budgets, goals, trends
   - AI-powered insights and recommendations
   - Mobile-first design
   - Deployed on Vercel

### Shared Database
- **Provider:** Supabase (PostgreSQL)
- **Region:** Singapore
- **Connection:** PgBouncer (transaction-pooling mode)
- **Single source of truth:** one database serves both apps

### Language & Localization
- **Primary language:** Indonesian (UI, labels, messages)
- **Currency:** IDR (Indonesian Rupiah)
- **Timezone:** Asia/Jakarta (WIB)
- **UI labels:** Pengeluaran (spending), Pemasukan (income), Riwayat (history), Tren (trends), Anggaran (budget), Tujuan (goals)

---

## 2. Repository Structure

```
.
├── bot/                                # Python Telegram bot (async, python-telegram-bot v20)
│   ├── main.py                         # Entry point, registers all handlers
│   └── handlers/
│       ├── commands.py                 # /start /add /income /summary /history /budget /goal /stats /delete
│       ├── messages.py                 # Free-text parsing (single + multi-transaction detection)
│       ├── callbacks.py                # Inline keyboard callbacks (40+ prefixes)
│       └── photos.py                   # Photo upload → Gemini Flash image parsing → confirm flow
│
├── db/
│   ├── schema.sql                      # Full PostgreSQL schema (5 core tables)
│   ├── database.py                     # SQLAlchemy async engine (NullPool for PgBouncer)
│   └── operations.py                   # ⭐ SINGLE SOURCE OF TRUTH for all DB queries (async functions)
│
├── services/
│   ├── categorizer.py                  # Claude Haiku (text + batch) + Gemini Flash (images) + parsing logic
│   └── formatter.py                    # Telegram message formatting, amounts, currency
│
├── scheduler/
│   └── weekly_report.py                # APScheduler BlockingScheduler (7 daily/weekly broadcast jobs)
│
├── frontend/                           # React 18 + TypeScript + Vite 6 dashboard
│   ├── api/                            # Vercel serverless functions
│   │   ├── parse-image.js              # Claude Haiku image parsing proxy
│   │   ├── parse-multi.js              # Multi-transaction parsing proxy
│   │   ├── budget-tips.js              # AI budget recommendations
│   │   ├── generate-report.js          # CSV/PDF report export
│   │   └── subscription.js             # Payment handling
│   │
│   └── src/
│       ├── app/
│       │   ├── App.tsx                 # Router setup + 4 nested context providers
│       │   ├── components/             # 20+ custom React components
│       │   │   ├── Layout.tsx          # Desktop sidebar + mobile nav shell
│       │   │   ├── TransactionModal.tsx # Add transaction (AI/Photo/Manual tabs)
│       │   │   ├── TransactionForm.tsx # Shared form fields
│       │   │   ├── BudgetCard.tsx      # Budget progress card
│       │   │   ├── GoalCard.tsx        # Goal progress card
│       │   │   ├── AIInsightCard.tsx   # Insight display
│       │   │   ├── ScreenStates.tsx    # LoadingState, ErrorState, EmptyState
│       │   │   ├── PrivacyAmount.tsx   # Blur wrapper for amounts
│       │   │   └── ui/                 # shadcn/ui components (do not edit)
│       │   │
│       │   └── pages/                  # 30+ pages (core + extended)
│       │       ├── Overview.tsx        # Dashboard home (KPIs + insights + charts)
│       │       ├── Pengeluaran.tsx     # Spending breakdown by category
│       │       ├── Pemasukan.tsx       # Income sources
│       │       ├── Budget.tsx          # Budget vs actual progress
│       │       ├── Goals.tsx           # Savings goals + progress
│       │       ├── Riwayat.tsx         # Transaction history (filterable)
│       │       ├── Tren.tsx            # 3-month trend analysis (3 charts)
│       │       ├── Login.tsx           # Telegram ID + Google OAuth
│       │       ├── AuthCallback.tsx    # Supabase OAuth handler
│       │       ├── LinkTelegram.tsx    # Link Google account to Telegram
│       │       ├── Laporan.tsx         # Detailed reports
│       │       ├── Forecasting.tsx     # Budget/goal projections
│       │       ├── SpendingPatterns.tsx # Time-based spending analysis
│       │       ├── SmartAlerts.tsx     # AI alerts + notifications
│       │       ├── Asisten.tsx         # AI chat assistant
│       │       ├── CategoryDetail.tsx  # Category drill-down
│       │       ├── Wallet.tsx          # Wallet management
│       │       ├── Recurring.tsx       # Recurring bill setup
│       │       ├── Kalender.tsx        # Calendar view
│       │       ├── Keamanan.tsx        # Security settings
│       │       ├── Langganan.tsx       # Subscription management
│       │       ├── Profile.tsx         # User profile
│       │       ├── Onboarding.tsx      # First-time setup
│       │       └── [marketing pages]   # Landing, FAQ, Blog, Terms, etc.
│       │
│       ├── hooks/                      # ⭐ Data fetching (all Supabase queries live here)
│       │   ├── useAuth.tsx             # Auth context + loginWithTelegram/Google, logout
│       │   ├── useTransactions.ts      # Fetch transactions (monthly or recent)
│       │   ├── useBudgets.ts           # Fetch + upsert budgets
│       │   ├── useGoals.ts             # Fetch + manage goals
│       │   ├── useWallets.ts           # Fetch + manage wallets
│       │   ├── useMonthFilter.tsx      # Global month/year filter context
│       │   ├── useRecurringBills.ts    # Recurring transaction CRUD
│       │   ├── useCategories.ts        # Category hierarchy
│       │   ├── useSubscription.ts      # Feature gating + plan limits
│       │   └── [10+ more specialized hooks]
│       │
│       ├── lib/
│       │   ├── supabase.ts             # ⭐ Supabase client + ALL TypeScript types
│       │   ├── utils.ts                # cn(), formatRupiah(), color helpers (bgColorVar, etc.)
│       │   ├── transitions.ts          # Centralized animation presets for motion/react
│       │   └── [helpers]
│       │
│       └── styles/
│           ├── theme.css               # ⭐ ALL design tokens as CSS variables + @theme inline
│           ├── fonts.css               # Manrope, Plus Jakarta Sans, DM Mono imports
│           └── index.css               # Global base styles, accessibility, scrollbars
│
├── .env                                # Local secrets (never commit)
├── .env.example                        # Template with required keys
├── requirements.txt                    # Python dependencies
├── railway.toml                        # Railway deployment config for bot + scheduler
├── Procfile                            # Process definitions (worker, scheduler)
└── CLAUDE.md                           # ⭐ Primary project instructions (supersedes all docs)
```

---

## 3. Database Schema (Complete)

### Core Tables (5 in schema.sql)

#### `users`
```sql
user_id BIGINT PRIMARY KEY
name TEXT
username TEXT
currency TEXT DEFAULT 'IDR'
timezone TEXT DEFAULT 'Asia/Jakarta'
tier TEXT DEFAULT 'free'  -- free | pro | premium
created_at TIMESTAMP
-- Extended columns (from TypeScript, may not be in schema.sql):
email TEXT
google_id TEXT
payday_date INT (day of month, 1-31)
gajian_setup_complete BOOLEAN
gajian_salary NUMERIC
gajian_wallet_id UUID
subscription_plan TEXT -- gratis | starter | pro
subscription_expires_at TIMESTAMP
risk_profile TEXT
ai_budget_recommendation BOOLEAN
```

#### `transactions`
```sql
id SERIAL PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE
amount NUMERIC NOT NULL
type TEXT DEFAULT 'expense'  -- expense | income | savings | transfer
category TEXT NOT NULL       -- matches DB categories exactly
subcategory TEXT
note TEXT
ai_confidence TEXT           -- high | medium | low
date DATE DEFAULT CURRENT_DATE
created_at TIMESTAMP
-- Extended columns:
wallet_id UUID
wallet_destination_id UUID
tags TEXT ARRAY

INDEX: (user_id, date)
```

#### `budgets`
```sql
id SERIAL PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE
category TEXT NOT NULL
amount NUMERIC NOT NULL
period TEXT DEFAULT 'monthly'
month INT
year INT
created_at TIMESTAMP

UNIQUE CONSTRAINT: (user_id, category, month, year)
INDEX: (user_id, month, year)
```

#### `goals`
```sql
id SERIAL PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE
name TEXT NOT NULL
target_amount NUMERIC NOT NULL
saved_amount NUMERIC DEFAULT 0
deadline DATE
created_at TIMESTAMP
```

#### `categories`
```sql
id SERIAL PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE (nullable)
parent_group_id UUID (nullable)
name TEXT NOT NULL
type TEXT NOT NULL       -- expense | income | transfer
icon TEXT
color TEXT
is_default BOOLEAN DEFAULT false
created_at TIMESTAMP
```

### Extended Tables (used by TypeScript, may need migration)

#### `wallets`
```sql
id UUID PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE
name TEXT NOT NULL
type TEXT NOT NULL       -- bank | ewallet | cash
icon TEXT
is_primary BOOLEAN DEFAULT false
initial_balance NUMERIC
created_at TIMESTAMP
```

#### `recurring_transactions`
```sql
id UUID PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE
category TEXT
amount NUMERIC NOT NULL
type TEXT NOT NULL       -- expense | income | transfer
description TEXT
due_date_of_month INT    -- 1-31, null for flexible
frequency TEXT NOT NULL  -- weekly | monthly | yearly | custom
frequency_interval INT   -- every N weeks/months
wallet_id UUID
is_active BOOLEAN DEFAULT true
reminder_enabled BOOLEAN DEFAULT false
reminder_days_before INT
next_due_date DATE
created_at TIMESTAMP
```

#### `category_groups`
```sql
id UUID PRIMARY KEY
user_id BIGINT (nullable)
name TEXT NOT NULL
icon TEXT
color TEXT
is_default BOOLEAN DEFAULT false
created_at TIMESTAMP
```

#### `subscriptions`
```sql
id UUID PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE
plan TEXT NOT NULL       -- monthly | 3month | 6month | yearly
price_paid NUMERIC
started_at TIMESTAMP
expires_at TIMESTAMP
payment_ref TEXT
is_active BOOLEAN
created_at TIMESTAMP
```

#### `split_bills`
```sql
id UUID PRIMARY KEY
user_id BIGINT FOREIGN KEY → users(user_id) CASCADE
session_name TEXT
total_amount NUMERIC
participants JSONB       -- [{name, amount, paid}, ...]
items TEXT ARRAY
share_token TEXT
created_at TIMESTAMP
```

### Critical Rules
⚠️ **ALL database queries must be written in `db/operations.py` as async functions.** Never write SQL in handlers or pages. This is the single source of truth for all database operations.

⚠️ **PgBouncer Prepared Statement Error (CRITICAL):** Supabase uses PgBouncer in transaction-pooling mode, which is incompatible with SQLAlchemy prepared statements. The bot uses:
- `NullPool` (no connection pooling)
- `prepared_statement_cache_size=0`
- `statement_cache_size=0`
- Each handler uses **ONE `async with session`** block — never share sessions

Do NOT revert these settings or switch to a connection pool.

---

## 4. Tech Stack (Complete)

### Python Backend

| Layer | Technology |
|-------|-----------|
| **Bot Framework** | python-telegram-bot v20 (async) |
| **Database ORM** | SQLAlchemy 2.x async (`asyncpg` driver) |
| **Database (sync)** | SQLAlchemy 2.x sync (`psycopg2` driver) — for scheduler only |
| **AI - Text** | Anthropic SDK → Claude Haiku (`claude-haiku-4-5-20251001`) |
| **AI - Images (bot)** | Google Generative AI → Gemini Flash (`gemini-2.0-flash`) |
| **Scheduling** | APScheduler (BlockingScheduler) |
| **HTTP Client** | httpx.AsyncClient (raw Telegram Bot API calls) |

### React Frontend

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 + TypeScript + Vite 6 |
| **Routing** | react-router v7 |
| **Styling** | Tailwind CSS v4 (via `@tailwindcss/vite` plugin) — NO `tailwind.config.js` |
| **Component Lib** | shadcn/ui (Radix UI primitives) |
| **Charts** | Recharts (AreaChart, BarChart, LineChart, PieChart) |
| **Animations** | `motion/react` (Framer Motion v11+ successor) |
| **Forms** | react-hook-form |
| **Backend Client** | `@supabase/supabase-js` |
| **Notifications** | Sonner (toast notifications) |
| **Path Alias** | `@` resolves to `frontend/src/` |
| **Build Chunks** | vendor (React/Router), charts (Recharts), ui (Radix), supabase, motion, pdf |
| **AI - Images (web)** | Anthropic SDK → Claude Haiku (via Vercel serverless) |

### Infrastructure

| Component | Platform | Config |
|-----------|----------|--------|
| **Telegram Bot** | Railway | `railway.toml`, `Procfile` |
| **Weekly Scheduler** | Railway | Same service as bot |
| **React Dashboard** | Vercel | `frontend/vercel.json` (or `vercel.ts` in v2) |
| **Serverless Functions** | Vercel | `frontend/api/*.js` |
| **Database** | Supabase | PostgreSQL v15+, Singapore region, via PgBouncer |

### Environment Variables

**Bot (`.env`):**
```
BOT_TOKEN=                           # Telegram BotFather token
ANTHROPIC_API_KEY=                   # Anthropic API key (Claude Haiku)
GOOGLE_API_KEY=                      # Google Generative AI API key (Gemini Flash)
DATABASE_URL=postgresql+asyncpg://...# Async asyncpg URL (bot)
DATABASE_URL_SYNC=postgresql://...   # Sync psycopg2 URL (scheduler)
```

**Frontend (`.env`):**
```
VITE_SUPABASE_URL=                   # Supabase project URL
VITE_SUPABASE_ANON_KEY=              # Supabase anon public key
VITE_ANTHROPIC_API_KEY=              # Anthropic API key (used by serverless)
```

---

## 5. Design System & Brand

### Typography

**Font Family Hierarchy:**
- **Headings / UI / Buttons:** `Manrope` (sans-serif, geometric)
- **Body text / `<p>` tags:** `Plus Jakarta Sans` (sans-serif, friendly)
- **Numbers / Amounts / Mono:** `DM Mono` (monospace) — class `.font-mono`

**Type Scale (CSS variables in theme.css):**
```
--text-display:  2rem         (largest, rare)
--text-h1:       1.75rem      (page titles)
--text-h2:       1.375rem     (section headers)
--text-h3:       1.125rem     (subsections)
--text-body-lg:  1rem         (large body)
--text-body:     0.875rem     (default body)
--text-caption:  0.75rem      (labels, small text)
--text-mono-lg:  1.25rem      (large monospace)
--text-mono:     1rem         (default monospace)
--text-mono-sm:  0.875rem     (small monospace)
```

### Color System

**Brand Colors:**
```
--color-brand-primary:       #4AE54A  (lime green — primary action, accent)
--color-brand-primary-dark:  #38C438  (hover/active state)
--color-brand-primary-light: #DCFCE7  (light tint for backgrounds)
--color-brand-primary-fg:    #0D2818  (foreground text on brand color)
```

**Sidebar (Dark Forest Green):**
```
--color-sidebar-bg:          #0D2818  (sidebar background)
--color-sidebar-active-bg:   #163D24  (active nav item)
--color-sidebar-hover-bg:    rgba(74, 229, 74, 0.08)  (hover state)
--color-sidebar-text:        #FFFFFF  (text on sidebar)
--color-sidebar-muted:       rgba(255, 255, 255, 0.55)  (secondary text)
--color-sidebar-label:       rgba(255, 255, 255, 0.35)  (section labels)
```

**Content / Text Hierarchy:**
```
--color-content-primary:     #1A2B1A  (main text)
--color-content-secondary:   #454745  (secondary text)
--color-content-tertiary:    #6A6C6A  (muted text)
--color-content-link:        #163D24  (hyperlinks)
```

**Backgrounds:**
```
--color-bg-screen:           #F4F6F4  (page background)
--color-bg-card:             #FFFFFF  (card background)
--color-bg-card-hover:       #F9FDF9  (card hover state)
--color-bg-elevated:         #FFFFFF  (elevated surfaces)
--color-bg-neutral:          rgba(22, 51, 0, 0.08)  (subtle background)
```

**Sentiment / Status:**
```
--color-sentiment-positive:  #2F5711  (income, safe, good)
--color-sentiment-positive-bg: #F0FDF4
--color-sentiment-negative:  #A8200D  (expense, over-budget, bad)
--color-sentiment-negative-bg: #FEF2F2
--color-sentiment-warning:   #EDC843  (near-limit, caution)
--color-sentiment-warning-bg: #FFFBEB
```

**Category Colors (consistent across all pages):**
```
--color-cat-food:            #F59E0B   (amber)
--color-cat-transport:       #3B82F6   (blue)
--color-cat-groceries:       #4AE54A   (green — brand-like)
--color-cat-shopping:        #EC4899   (pink)
--color-cat-bills:           #8B5CF6   (purple)
--color-cat-health:          #EF4444   (red)
--color-cat-entertainment:   #F97316   (orange)
--color-cat-education:       #06B6D4   (cyan)
--color-cat-income:          #2F5711   (dark green)
--color-cat-savings:         #0891B2   (teal)
```

**Radius (Border Radius Scale):**
```
--radius-xs:    4px
--radius-sm:    8px
--radius-md:    12px
--radius-lg:    16px
--radius-xl:    20px
--radius-2xl:   24px
--radius-full:  9999px
```

**Spacing (8px baseline):**
```
--space-1:  4px    --space-2:  8px     --space-3:  12px
--space-4:  16px   --space-5:  20px    --space-6:  24px
--space-8:  32px   --space-10: 40px    --space-12: 48px
--space-16: 64px
```

**Motion Tokens:**
```
--duration-instant: 100ms
--duration-fast:    150ms
--duration-normal:  200ms
--duration-slow:    300ms
--ease-standard:    cubic-bezier(0.4, 0, 0.2, 1)
--ease-enter:       cubic-bezier(0, 0, 0.2, 1)
--ease-exit:        cubic-bezier(0.4, 0, 1, 1)
--ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Shadow Tokens:**
```
--shadow-card:       0 1px 2px rgba(0,0,0,0.05)
--shadow-card-hover: 0 4px 12px rgba(0,0,0,0.08)
--shadow-modal:      0 20px 48px rgba(0,0,0,0.12)
--shadow-nav:        top border shadow for sticky nav
```

### How to Apply Colors (Critical Pattern)

⚠️ **ALWAYS use helper functions from `src/lib/utils.ts`, NEVER raw Tailwind color classes.**

```typescript
// ✅ CORRECT:
bgColorVar('sentiment-positive')    // → "bg-[var(--color-sentiment-positive)]"
textColorVar('content-primary')     // → "text-[var(--color-content-primary)]"
borderColorVar('brand-primary')     // → "border-[var(--color-brand-primary)]"
colorVar('sidebar-bg')              // → "var(--color-sidebar-bg)"

// ❌ NEVER:
className="bg-green-500"            // Raw Tailwind
className="bg-[#4AE54A]"           // Hardcoded hex
```

**Why:** CSS variables are the single source of truth. Using helpers ensures consistency and makes theme changes trivial.

### Tailwind Configuration

Tailwind v4 uses **no `tailwind.config.js`** file. Instead:
1. `@tailwindcss/vite` plugin handles compilation
2. `theme.css` contains `@theme inline { ... }` block mapping all tokens as Tailwind utilities
3. All arbitrary-value classes use CSS variables: `bg-[var(--color-brand-primary)]`

### shadcn/ui Legacy Tokens (for Radix compatibility)

```
--primary:              #4AE54A
--primary-foreground:   #0D2818
--secondary:            (not heavily used)
--background:           #F9FAFB
--foreground:           #1A1A1A
--card:                 #FFFFFF
--card-foreground:      #1A1A1A
--muted:                #F1F5F9
--muted-foreground:     #6B7280
--accent:               #DCFCE7
--destructive:          #EF4444
--destructive-fg:       #FFFFFF
--border:               #E2E8F0
--input:                #FFFFFF
--ring:                 #4AE54A
```

---

## 6. UI/UX Architecture

### Layout System (Layout.tsx)

**Desktop:**
- Fixed left sidebar (240px wide, dark forest green `#0D2818`)
- Sidebar contains nav groups with icons + labels
- Active nav item: `border-l-4 border-[var(--color-brand-primary)]`, highlighted background
- Main content scrolls vertically
- Top bar with month filter `<select>`, privacy toggle (Eye icon), Bell (notifications), User Avatar
- Floating Action Button (FAB): fixed bottom-right, lime green, pulsing shadow, 2.5s infinite animation
- Avatar: DiceBear `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`

**Mobile:**
- Hamburger menu → animated drawer (`<MobileNav>`)
  - Drawer animation: `x: -280 → 0`, spring physics, 300ms duration
  - Backdrop fade: `opacity: 0 → 0.5`
- Fixed bottom navigation (4 tabs): Beranda (Home), Dompet (Wallet), empty center, Analitik (Analytics), Profil (Profile)
- FAB button centered on bottom nav, `z-40`, "Add Transaction" on click
- Month filter still visible, usually in top bar
- No sidebar, full-width content

**Privacy Mode:**
- Toggle via Eye/EyeOff icon in top bar
- Enabled: `.privacy-hidden { filter: blur(8px) }` on all amounts
- Hover: reduced to `blur(4px)` for quick visibility
- `usePrivacy()` hook manages state

### Provider Chain (App.tsx)

Wraps entire app in 4 nested contexts (order matters):
```
AuthProvider
  → PrivacyProvider
    → WalletFilterProvider
      → MonthFilterProvider
        → <Router> <Outlet> </Router>
```

Protected routes use `<RequireAuth>` guard:
```
<RequireAuth>
  <Layout>
    <Outlet/>
  </Layout>
</RequireAuth>
```

### Navigation Groups (Sidebar)

**Group 1: Top** (no label)
- Overview (icon: Home)
- Gajian (icon: TrendingUp)

**Group 2: KEUANGAN** ("FINANCES")
- Pengeluaran (Spending, icon: TrendingDown)
- Pemasukan (Income, icon: TrendingUp)
- Anggaran (Budget, icon: Target)
- Tujuan (Goals, icon: PiggyBank)
- Riwayat (History, icon: Clock)

**Group 3: ANALITIK** ("ANALYTICS")
- Laporan (Reports, icon: BarChart)
- Pola Waktu (Spending Patterns, icon: Calendar)
- Prakiraan (Forecasting, icon: TrendingUp)
- Tren (Trends, icon: LineChart)

**Group 4: ALAT** ("TOOLS")
- Kategori (Categories, icon: Folder)
- Dompet (Wallets, icon: Wallet)
- Kalender (Calendar, icon: Calendar)
- Asisten (Assistant, icon: Sparkles)

**Group 5: LAINNYA** ("OTHER")
- Tagihan (Recurring Bills, icon: Repeat)
- Langganan (Subscription, icon: Star)
- Profil (Profile, icon: User)

### TransactionModal (Add Transaction UI)

A `Dialog` component with two levels of tabs:

**Outer Tabs (4):**
1. **Pengeluaran** (Expense) — red accent, TrendingDown icon
2. **Pemasukan** (Income) — green accent, TrendingUp icon
3. **Tabung** (Savings) — brand-primary accent, PiggyBank icon
4. **Transfer** — warning accent, ArrowLeftRight icon

**Inner Tabs (for Pengeluaran & Pemasukan):**
1. **AI** (Sparkles icon) — free-text input, calls Claude to categorize
2. **Foto** (Camera icon) — image upload, sends to Claude Haiku
3. **Manual** (PenLine icon) — form fields (amount, category, note, date)

**AI Flow:**
- User types a note (e.g., "beli jajan di warung")
- System detects if multi-transaction (2+ amounts OR commas/newlines)
- If multi: POST `/api/parse-multi` → returns array of parsed transactions with preview
- If single: local regex parsing → Claude categorization → confidence-coded result
- User can confirm or edit before saving

**Foto Flow:**
- File input (5MB limit, image/*), base64 encode
- POST `/api/parse-image` → Claude Haiku vision analysis
- Returns: `{ amount, type, category, subcategory, note, confidence, raw_text, wallet }`
- Show parsed result with Confirm / Edit Amount / Cancel buttons

**Manual Flow:**
- Inputs: amount (number), category (dropdown), note (textarea), date (date picker)
- Save: direct `supabase.from('transactions').insert()`

**Save Logic:**
- All flows call `useTransactionForm()` hook
- On success: calls `window.location.reload()` with 600ms delay (refreshes page to show new transaction)
- Fires Sonner toast notification

### Animation System (transitions.ts)

**Presets imported from `frontend/src/lib/transitions.ts`:**

| Preset | Pattern | Use |
|--------|---------|-----|
| `pageEnter` | opacity 0→1, y 8→0, 200ms easeInOut | Page load, section appear |
| `fadeUp` | opacity 0→1, y 8→0, 200ms easeOut | Card/item appear |
| `fadeIn` | opacity 0→1, 200ms easeInOut | Generic fade |
| `modalEnter` | opacity 0→1 + scale 0.97→1, 150ms easeOut | Modal open/close |
| `bottomSheetEnter` | y 100%→0, 300ms easeOut | Mobile sheet slide |
| `slideInRight` | x 32→0, 200ms easeOut | Right slide |
| `slideInLeft` | x -32→0, 200ms easeOut | Left slide |
| `scaleIn` | scale 0.95→1, 200ms easeOut | Scale emphasis |
| `staggerChildren` | staggerChildren: 0.05, delayChildren: 0 | List animations |

**Accessibility:**
```typescript
const prefersReduced = useReducedMotion()

// Conditional rendering:
const variants = prefersReduced 
  ? { opacity: 0 }
  : { opacity: 0, y: 8 }

// Charts:
<AreaChart isAnimationActive={!prefersReduced} />
```

All animated lists use `staggerChildren: 0.05` with item-level delays calculated as `index * 0.05s`.

### Page & Chart Inventory

| Route | Page | Charts | Key Hooks |
|-------|------|--------|-----------|
| `/overview` | Overview.tsx | AreaChart (weekly income/expense, gradient), calendar heatmap (CSS grid) | useAuth, useTransactions, useInsights |
| `/pengeluaran` | Pengeluaran.tsx | BarChart (horizontal, per-category colored) | useWalletStats, useCategoryTransactions |
| `/pemasukan` | Pemasukan.tsx | BarChart or PieChart (income sources) | useTransactions |
| `/budget` | Budget.tsx | None (progress bars only, CSS divs) | useBudgets, useTransactions |
| `/goals` | Goals.tsx | LineChart (monthly savings, collapsible section) | useGoals, useGoalProgress |
| `/riwayat` | Riwayat.tsx | None (filtered list only) | useTransactions, useFilteredTransactions |
| `/tren` | Tren.tsx | LineChart (6mo), AreaChart (stacked categories), BarChart (cumulative savings) | useLaporanData |
| `/laporan` | Laporan.tsx | Multiple combined | useLaporanData |
| `/forecasting` | Forecasting.tsx | Projection charts | useForecasting |
| `/kalender` | Kalender.tsx | Calendar grid (CSS) | useTransactions |
| `/spending-patterns` | SpendingPatterns.tsx | Heatmaps, time-based | useSpendingPatterns |
| `/asisten` | Asisten.tsx | None (chat interface) | useChat |
| `/smart-alerts` | SmartAlerts.tsx | Alert cards | useAIAlerts |

### Standard Screen States (ScreenStates.tsx)

Three UI states used consistently:

**`<LoadingState variant="card" count={3} />`**
- Skeleton loaders
- Variants: `card`, `row`, `chart`, `default`
- Full-width, animating gradient

**`<ErrorState message="..." onRetry={fn} />`**
- Error icon + message
- Retry button

**`<EmptyState icon={...} title="..." description="..." action={<Button />} />`**
- Icon + title + subtitle
- CTA button (e.g., "Add your first transaction")

### Formatting & Utilities

**Currency:**
```typescript
formatRupiah(amount: number) 
→ Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR', 
    minimumFractionDigits: 0 
  })
// Output: "Rp15.000" (no decimals)
```

**Date:**
```typescript
formatDate(date: Date) 
→ Intl.DateTimeFormat('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
// Output: "5 Mei 2025"
```

**Chart Formatting:**
```typescript
createCompactAxisFormatter(value: number) 
→ if (value >= 1e9) return (value / 1e9) + 'M'
  if (value >= 1e6) return (value / 1e6) + 'jt'
  if (value >= 1e3) return (value / 1e3) + 'k'
  return value
// Output: "15k", "1.2jt"
```

**Class Merging (ALWAYS use this):**
```typescript
import { cn } from '@/lib/utils'

className={cn(
  'px-4 py-2 rounded-md',
  isActive && 'bg-[var(--color-brand-primary)]',
  disabled && 'opacity-50 cursor-not-allowed'
)}
```

---

## 7. AI Integration (Complete)

### Claude Haiku (Text & Web Image Parsing)

**Model:** `claude-haiku-4-5-20251001`

#### Text Categorization (`services/categorizer.py → categorize_transaction(note: str)`)
- **Input:** Free-text Indonesian note (e.g., "beli jajan di warung")
- **Output:** JSON with category, subcategory, type, confidence, reason
- **Categories:**
  - **Expense (10):** Food & Dining, Groceries, Transport, Shopping, Health, Entertainment, Bills & Utilities, Education, Personal Care, Dining Out
  - **Income (4):** Salary, Freelance, Investment Return, Other Income
  - **Saving (2):** Savings, Investment
- **Confidence levels:** `high`, `medium`, `low`
- **Fallback on error:** `{ category: "Other", subcategory: "Uncategorized", type: "expense", confidence: "low", reason: "Error occurred" }`
- **API calls:** Synchronous (runs in async handler via `asyncio.to_thread()`)

#### Batch Transaction Parsing (`parse_batch_transactions(text: str)`)
- Detects multi-transaction input (2+ amount patterns OR commas/newlines)
- Returns JSON array: `[{ amount, type, note, date, category, subcategory, confidence }, ...]`
- Date values: `"today"`, `"yesterday"`, `"tomorrow"`, or `"YYYY-MM-DD"` exact dates
- Max 10 transactions per batch
- Followed by `summarize_batch_transactions()` → 1-2 line Indonesian summary

#### Web Image Parsing (`frontend/api/parse-image.js`)
- **Endpoint:** POST `/api/parse-image`
- **Body:** `{ imageBase64: string, mediaType: string }`
- **Model:** Claude Haiku with vision
- **Output:** `{ amount, type, category, subcategory, note, confidence, raw_text, wallet }`
- **Error response:** `{ error: "Tidak dapat membaca informasi transaksi dari gambar ini" }`
- Uses Anthropic SDK (`@anthropic-ai/sdk`)

### Gemini Flash (Bot Image Parsing ONLY)

**Model:** `gemini-2.0-flash` (Google Generative AI SDK)

**Function:** `services/categorizer.py → parse_image_transaction(image_b64: str, media_type: str)`
- **Used by:** Bot photo handler ONLY (`bot/handlers/photos.py`)
- **Input:** Base64-encoded image + media type
- **Output:** Same schema as Claude image parser
- **Note:** Web frontend uses Claude Haiku, bot uses Gemini Flash — this is intentional
- API key: `GOOGLE_API_KEY` environment variable

### Frontend AI Features

**Vercel Serverless Functions:**
1. `/api/parse-image` — Claude Haiku image parsing proxy
2. `/api/parse-multi` — Multi-transaction text parsing
3. `/api/budget-tips` — AI budget recommendations (POST with budget summary)
4. `/api/generate-report` — CSV/PDF export
5. `/api/subscription` — Payment handling

**React Hooks:**
- `useAIInsights()` — fetches insight feed from API
- `useInsights()` — AI insight aggregation
- `useFinancialHealth()` — health score calculation
- `useAIAlerts()` — smart alerts

**Components:**
- `<AIInsightCard>` — displays insight with severity badge (critical/warning/info)
- `<FinancialHealthGauge>` — score visualization `/100`

**Insight Feed Logic:**
1. Try API fetch (`useAIInsights()`)
2. Fallback: client-side `buildInsightFeed()` combining:
   - Anomaly detection (unusual spending)
   - Health insights (safety score)
   - Budget recommendations
   - Trend alerts

---

## 8. Telegram Bot (Complete)

### Command Reference

| Command | Format | Handler | Notes |
|---------|--------|---------|-------|
| `/start` | — | `cmd_start` | Register user; show today's stats; display MAIN_MENU_KEYBOARD |
| `/add` | `/add <amount> <note>` | `cmd_add` | Log expense; supports backdating & wallet suffix |
| `/income` | `/income <amount> <note>` | `cmd_income` | Log income; same suffixes as `/add` |
| `/summary` | — | `cmd_summary` | Period picker (inline keyboard) → monthly/daily summary |
| `/history` | — | `cmd_history` | Month picker → last 20 transactions |
| `/stats` | — | `cmd_stats` | Today's quick stats (expense, income, net, count) |
| `/delete` | — | `cmd_delete` | Last transaction with confirm/cancel buttons |
| `/budget` | `/budget <category> <amount>` | `cmd_budget` | Upsert monthly budget for category |
| `/goal` | — | `cmd_goal` | List all savings goals with ASCII progress |
| `/goal add` | `/goal add <name> <target>` | `tutorial:goal_add` | Create new savings goal |
| `/commands` | — | `cmd_commands` | Full command reference listing |
| `/help` | — | `cmd_help` | Interactive help (topic navigator) |
| `/tutorial` | — | `cmd_tutorial` | 5-step interactive onboarding |
| `/cancel` | — | `cmd_cancel` | Cancel in-progress conversation |

### Amount Parsing (services/categorizer.py)

`parse_amount(raw_text)` handles all these formats:
```
15000, 15k, 15rb, 15ribu
1500000, 1.5jt, 1.5juta, 1,5juta
1000000, 1jt, 10mio (Million in Indonesian)
Plus raw integers: 123, 50, etc.
```

### Wallet Suffix Parsing

After the note, users can append:
- `wallet=<name>` — source wallet
- `dari=<name>` — alternate syntax for source

Example: `/add 50000 bensin wallet=bca` → creates transaction with wallet "bca"

### Backdating Syntax

Users can append backdating info to note:
- `@DD/MM` — specific month/day (e.g., `@14/05` = May 14th)
- `@5mei` — Indonesian month name (e.g., `@5mei` = May 5th)
- `@DD/MM/YYYY` — full date (e.g., `@14/05/2025`)
- No suffix → today's date

Example: `/add 100000 gaji @25/05` → log income for May 25th

### Gamification

**Streaks:**
- `maybe_send_streak()` checks if user made multiple transactions in one hour
- Double Kill (2 tx in 1 hour)
- Triple Kill (3 tx in 1 hour)
- Rampage (4+ tx in 1 hour)

**Budget Alerts:**
- `maybe_send_budget_alert()` fires when category budget:
  - Reaches 80% of limit
  - Exceeds 100%

### Callback Prefixes (40+)

When user taps an inline button, `handle_callback(update, context)` dispatches on `query.data` prefix:

**Photo Flow:**
- `photo:save` — confirm photo parsing
- `photo:cancel` — discard photo
- `photo:edit_amount` — adjust amount before save

**Menu/Navigation:**
- `menu:main` → refresh main menu with today's stats
- `menu:commands` → show command list
- `menu:dashboard` → show dashboard URL
- `menu:helpdesk` → show admin contact

**Summary & History:**
- `summary:picker` → show period picker (this month, last month, etc.)
- `summary:monthly:{month}:{year}` → fetch & display monthly summary
- `summary:daily:today` / `summary:daily:yesterday` → daily summary
- `history:picker` → month picker
- `history:month:{month}:{year}` → 20 transactions for month

**Transaction Management:**
- `recat_tx:{id}` → recategorize specific transaction
- `recat_apply:{tx_id}:{category}` → apply new category
- `hapus:list` → show last 10 transactions for deletion
- `hapus:tx:{id}` → confirm deletion
- `delete:last` / `confirm_delete:{id}` / `cancel_delete` → quick delete

**Goals & Savings:**
- `quick:goals` → show goals list
- `savings_alloc:{goal_id}:{tx_id}:{amount}` → allocate savings to goal

**Other:**
- `help:{page}` → help topic navigation
- `tutorial:{step}` → tutorial step (2-5, done, try_qb)
- `qb_cat:{key}` → quick budget: select category
- `qb_amt:{cat}:{amount}` → quick budget: set amount
- `sub:pricing` → subscription pricing
- `sub:history` → payment history

### Scheduler Jobs (APScheduler, Asia/Jakarta timezone)

Runs from `scheduler/weekly_report.py` using `BlockingScheduler`.

| Time (WIB) | Day | Job | Function |
|---|---|---|---|
| 08:00 | Daily | Payday reminder | Sends to users where `payday_date = today.day` |
| 09:00 | Sunday | Weekly report | 7-day expense total + top 3 categories |
| 09:00 | Daily | Morning reminder | Random message from `REMINDER_MESSAGES["morning"]` |
| 12:00 | Daily | Lunch reminder | Lunch-themed reminder |
| 15:00 | Daily | Afternoon nudge | Afternoon check-in |
| 18:00 | Daily | Evening reminder | Evening reflection |
| 21:00 | Daily | Night recap | Night summary |

**Broadcast Logic:**
- Fetches all users from DB
- Sends personalized Telegram message via HTTP (raw Bot API)
- 40% chance to include user's first name in message
- No-op if user hasn't registered

### Message Handler State Machine (messages.py)

`handle_message(update, context)` checks `context.user_data["awaiting"]` for state:
- `history_month` — user picking history month
- `summary_month` — user picking summary month
- `photo_edit_amount` — user editing photo-parsed amount
- `summary_date` — user picking summary date
- `recat_date` — user picking date for recategorization

Also detects:
- **Multi-transaction:** 2+ amounts OR commas/newlines in text
  - Calls `parse_batch_transactions()` → shows preview → confirm/cancel
- **Single transaction:** calls `detect_natural_transaction()` → extracts amount, type, note, wallets
  - For expense/income: `categorize_transaction_v2()` (profile-aware) or fallback
  - For transfer: stores wallet names in note with `[src → dest]` pattern

---

## 9. Conventions & Critical Rules

### Python (bot + services)

**Database queries:**
- ✅ All DB queries live in `db/operations.py` as `async def` functions
- ✅ Each function takes `AsyncSession` as first parameter
- ✅ Handlers import from `db.operations` and call async functions
- ❌ NEVER write inline SQL in handler files

**Async/Sync:**
- Use `asyncio.to_thread()` to run sync code (e.g., Claude API) from async handlers
- Scheduler uses sync SQLAlchemy (`psycopg2`), bot uses async (`asyncpg`)
- Each handler: ONE `async with session:` block, never share sessions across calls

**Currency & Formatting:**
- ✅ Use `services/formatter.py` for all message formatting
- ✅ Use `services.formatter.format_amount(amount)` for currency display
- ❌ Never format amounts inline (`f"{amount:,}"`)

**Error Handling:**
- Categorization fallback: `{ category: "Other", type: "expense", confidence: "low" }`
- Image parsing error: return `{ error: "message" }`
- DB errors: log and notify user via Telegram

### TypeScript/React

**Data fetching:**
- ✅ All Supabase queries live in `src/hooks/` as custom hooks
- ✅ Pages call hooks ONLY: `const { data, loading } = useTransactions()`
- ❌ NEVER call `supabase.from()` directly in pages

**Supabase types:**
- ✅ ALL types defined in `src/lib/supabase.ts` (single source of truth)
- ✅ Import types: `import type { Transaction, Budget } from '@/lib/supabase'`
- ❌ Never define TypeScript types elsewhere

**Class merging:**
- ✅ ALWAYS use `cn()` from `@/lib/utils`: `cn('px-4', isActive && 'bg-brand')`
- ❌ Never use bare `clsx` or `classnames`

**Color application:**
- ✅ Use color helpers: `bgColorVar('sentiment-positive')`, `textColorVar('content-primary')`
- ❌ Never use raw Tailwind: `bg-green-500` or `bg-[#4AE54A]`

**shadcn/ui components:**
- ✅ Use provided components from `src/app/components/ui/`
- ✅ Extend via wrapper components if needed
- ❌ NEVER edit files in `src/app/components/ui/` directly

**Path alias:**
- ✅ `@` resolves to `frontend/src/` — use it everywhere
- ❌ Never use relative paths like `../../../lib/utils`

**Animations:**
- ✅ Import presets from `@/lib/transitions`
- ✅ Check `useReducedMotion()` before animating
- ❌ Never hardcode animation values

### Naming Conventions

**UI Labels (Indonesian):**
- Pengeluaran (spending / expenses)
- Pemasukan (income / earnings)
- Riwayat (history / transaction list)
- Tren (trends / analysis)
- Anggaran (budget)
- Tujuan (goals)
- Dompet (wallet)
- Kalender (calendar)
- Asisten (assistant)
- Tagihan (recurring bills)
- Langganan (subscription)
- Profil (profile)

**Categories (English, match DB exactly):**
- `Food & Dining`, `Groceries`, `Transport`, `Shopping`
- `Health`, `Entertainment`, `Bills & Utilities`, `Education`
- `Personal Care`, `Dining Out`, `Salary`, `Freelance`
- `Investment Return`, `Other Income`, `Savings`, `Investment`

**Routes (lowercase, hyphen-separated):**
- `/overview`, `/pengeluaran`, `/pemasukan`, `/budget`
- `/spending-patterns`, `/smart-alerts`, `/asisten`
- NOT `/Pengeluaran`, `/pengeluaran_detail`

**Git & Commits:**
- Always use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
- Include issue references: `fix: resolve #123 PgBouncer prepared statement error`

### Active Development Branch

⚠️ **Branch:** `fix/pgbouncer-prepared-statement-error`

- PgBouncer fixes (NullPool, cache settings) are applied and stable
- Main branch is behind by these fixes
- **Before any new DB work, merge this branch into main**

---

## Quick Reference for New Sessions

**Starting a task? Check:**
1. Is it DB-related? → Code is in `db/operations.py`
2. Is it frontend data? → Code is in `src/hooks/`
3. Is it a new page? → Create in `src/app/pages/` + add route in `App.tsx`
4. Is it a new component? → Create in `src/app/components/` (not `ui/`)
5. Need a color? → Use `bgColorVar()`, `textColorVar()`, etc. from `@/lib/utils`
6. Need animation? → Import from `@/lib/transitions`
7. Writing Python? → DB queries go in `operations.py`, use `asyncio.to_thread()` for sync code
8. Touching sessions? → Use NullPool, one `async with session:` block per handler

**Critical files to know:**
- `CLAUDE.md` — primary instructions (supersedes all docs)
- `frontend/src/lib/supabase.ts` — all TypeScript types
- `frontend/src/lib/utils.ts` — color helpers + cn()
- `frontend/src/lib/transitions.ts` — animation presets
- `frontend/src/styles/theme.css` — ALL design tokens
- `db/operations.py` — all DB queries
- `services/categorizer.py` — all AI logic
