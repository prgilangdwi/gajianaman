# Gajian Aman — Project Instructions for Claude

## What this project is

**Gajian Aman** is a personal finance tracker for Indonesian users. It has two separate applications:

1. **Python backend** — a Telegram bot where users log transactions via chat commands or receipt photos
2. **React frontend** — a web dashboard deployed on Vercel where users visualize their finances

The two apps share a single **Supabase PostgreSQL** database. The bot writes data; the dashboard reads it.

---

## Project structure

```
/
├── bot/                        # Telegram bot (python-telegram-bot v20, async)
│   ├── main.py                 # Bot entry point, registers all handlers
│   └── handlers/
│       ├── commands.py         # /start, /add, /income, /summary, /budget, /goal, /history
│       ├── messages.py         # Free-text message parsing
│       ├── callbacks.py        # Inline keyboard button callbacks
│       └── photos.py           # Receipt/screenshot image parsing flow
│
├── db/
│   ├── schema.sql              # Full DB schema — run in Supabase SQL Editor
│   ├── database.py             # SQLAlchemy async engine (NullPool for PgBouncer)
│   └── operations.py           # All async DB query functions (single source of truth)
│
├── services/
│   ├── categorizer.py          # Claude Haiku text categorizer + image parser
│   └── formatter.py            # Telegram message formatting helpers
│
├── scheduler/
│   └── weekly_report.py        # APScheduler — sends weekly summaries on Monday 08:00 WIB
│
├── dashboard/
│   └── app.py                  # Legacy Streamlit dashboard (being replaced by frontend/)
│
├── frontend/                   # Modern React web dashboard
│   ├── api/
│   │   └── parse-image.js      # Vercel serverless function — proxies image to Claude Haiku
│   └── src/
│       ├── app/
│       │   ├── App.tsx          # Router setup, AuthProvider, MonthFilterProvider
│       │   ├── components/
│       │   │   ├── Layout.tsx         # Sidebar + outlet wrapper
│       │   │   ├── TransactionModal.tsx # Add transaction modal (manual entry)
│       │   │   └── ui/                # shadcn/ui components (do not edit these directly)
│       │   └── pages/
│       │       ├── Overview.tsx       # Income vs expense summary, daily bar, category pie
│       │       ├── Pengeluaran.tsx    # Spending breakdown by category
│       │       ├── Budget.tsx         # Budget vs actual progress bars
│       │       ├── Goals.tsx          # Savings goal progress
│       │       ├── Riwayat.tsx        # Filterable transaction history table
│       │       ├── Tren.tsx           # 3-month income/expense trend charts
│       │       ├── Login.tsx          # Telegram ID + Google OAuth login
│       │       ├── AuthCallback.tsx   # Supabase OAuth redirect handler
│       │       └── LinkTelegram.tsx   # Links Google account to Telegram user ID
│       ├── hooks/
│       │   ├── useAuth.tsx            # Auth context: loginWithTelegram, loginWithGoogle, logout
│       │   ├── useTransactions.ts     # Fetch + cache transactions from Supabase
│       │   ├── useBudgets.ts          # Fetch + upsert budgets
│       │   ├── useGoals.ts            # Fetch goals
│       │   └── useMonthFilter.tsx     # Global month/year filter context
│       ├── lib/
│       │   ├── supabase.ts            # Supabase client + all TypeScript types (Transaction, Budget, Goal, User)
│       │   └── utils.ts               # cn() and other small helpers
│       └── styles/
│           ├── theme.css              # Gajian Aman brand design tokens (CSS variables)
│           ├── fonts.css              # Custom font imports
│           └── index.css              # Global base styles
│
├── .env                        # Local secrets (never commit)
├── .env.example                # Template
├── requirements.txt            # Python dependencies
├── railway.toml                # Railway deploy config (bot + scheduler)
└── Procfile                    # Process definitions for Railway
```

---

## Database schema

Five tables in Supabase (PostgreSQL):

| Table | Key columns |
|---|---|
| `users` | `user_id BIGINT PK`, `name`, `username`, `currency`, `timezone`, `tier` (free/pro/premium) |
| `transactions` | `id`, `user_id FK`, `amount`, `type` (expense/income), `category`, `subcategory`, `note`, `ai_confidence`, `date` |
| `budgets` | `id`, `user_id FK`, `category`, `amount`, `period`, `month`, `year` — UNIQUE on (user_id, category, month, year) |
| `goals` | `id`, `user_id FK`, `name`, `target_amount`, `saved_amount`, `deadline` |
| `categories` | `id`, `user_id FK`, `name`, `icon`, `type`, `is_default` |

All DB queries live in `db/operations.py`. Do not write inline SQL elsewhere — add a new function there instead.

---

## AI integration — Claude Haiku

Both the Python bot and Vercel serverless function use **Claude Haiku** (`claude-haiku-4-5-20251001`):

### Text categorization (`services/categorizer.py → categorize_transaction()`)
- Input: free-text note in Indonesian, e.g. `"beli jajan di warung"`
- Output: JSON with `category`, `subcategory`, `type`, `confidence`, `reason`
- Called synchronously from bot command handlers

### Image parsing (`services/categorizer.py → parse_image_transaction()` and `frontend/api/parse-image.js`)
- Input: base64 image (receipt, payment screenshot, e-wallet confirmation)
- Output: JSON with `amount`, `type`, `category`, `subcategory`, `note`, `confidence`, `raw_text`
- Bot flow: user sends photo → bot calls `parse_image_transaction()` → shows parsed result with confirm/cancel inline keyboard
- Web flow: user uploads image → Vercel serverless → Claude Haiku → returns parsed JSON to frontend

### Supported categories
**Expense:** Food & Dining, Groceries, Transport, Shopping, Health, Entertainment, Bills & Utilities, Education, Personal Care, Dining Out
**Income:** Salary, Freelance, Investment Return, Other Income
**Saving:** Savings, Investment

---

## Telegram bot commands

| Command | Format | Notes |
|---|---|---|
| `/start` | — | Register user + show main menu |
| `/add` | `/add <amount> <note>` | Log expense; supports `@DD/MM` for backdating |
| `/income` | `/income <amount> <note>` | Log income |
| `/summary` | — | Monthly summary |
| `/history` | — | Last 10 transactions |
| `/budget` | `/budget <category> <amount>` | Set monthly budget |
| `/goal` | — | View savings goals |
| `/goal add` | `/goal add <name> <target>` | Add savings goal |

Backdated entry syntax: `/add 15000 makan siang @14/05`

---

## Frontend tech stack

| Concern | Tool |
|---|---|
| Framework | React 18 + TypeScript + Vite 6 |
| Routing | react-router v7 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Component library | shadcn/ui (Radix UI primitives) — files in `src/app/components/ui/` |
| Charts | Recharts |
| Animations | Motion (Framer Motion successor) |
| Forms | react-hook-form |
| Backend | Supabase JS client (`@supabase/supabase-js`) |
| Notifications | Sonner toasts |
| Path alias | `@` → `frontend/src/` |

---

## Auth flow

Two login methods on `/login`:

1. **Telegram ID login** — user enters their Telegram numeric ID, looked up in `users` table. Persisted in `localStorage` under key `gajian_aman_user`.
2. **Google OAuth** — Supabase OAuth, redirects to `/auth/callback`, then `/link-telegram` to associate the Google session with a `user_id`.

`useAuth` hook manages the session. `RequireAuth` wraps all protected routes and redirects to `/login` if no user.

---

## Environment variables

### Python backend (`.env`)
```
BOT_TOKEN=                    # Telegram BotFather token
ANTHROPIC_API_KEY=            # Anthropic API key
DATABASE_URL=postgresql+asyncpg://postgres:[pw]@db.[ref].supabase.co:5432/postgres
DATABASE_URL_SYNC=postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres
```

### React frontend (`frontend/.env`)
```
VITE_SUPABASE_URL=            # Supabase project URL
VITE_SUPABASE_ANON_KEY=       # Supabase anon public key
VITE_ANTHROPIC_API_KEY=       # Used by Vercel serverless function
```

---

## Deployment

| Component | Platform | Config file |
|---|---|---|
| Telegram bot | Railway | `railway.toml`, `Procfile` |
| Weekly scheduler | Railway | Same service as bot |
| React dashboard | Vercel | `frontend/vercel.json`, `frontend/.vercel/project.json` |
| Image parse API | Vercel serverless | `frontend/api/parse-image.js` |
| Database | Supabase | Hosted PostgreSQL (Singapore region) |

---

## Critical gotchas — read before touching the DB layer

### PgBouncer prepared statement errors
Supabase uses PgBouncer in transaction-pooling mode, which is **incompatible with SQLAlchemy prepared statements**. The fix applied in `db/database.py`:
- Use `NullPool` (no connection reuse across requests)
- Pass `prepared_statement_cache_size=0` and `statement_cache_size=0` to asyncpg
- Each bot operation must use a **single `async with session` block** — do not share sessions across calls

Do NOT revert these settings or switch to a regular connection pool.

### Two database URLs
The bot uses `asyncpg` (async). The Streamlit dashboard and scheduler use `psycopg2` (sync). They must use separate connection strings (`DATABASE_URL` vs `DATABASE_URL_SYNC`). Do not use the asyncpg URL in sync code or vice versa.

---

## Conventions

### Python (bot + services)
- All DB queries go in `db/operations.py` as `async` functions taking an `AsyncSession`
- Bot handlers in `bot/handlers/` import from `db.operations` and `services.categorizer`
- Claude Haiku calls are synchronous — the bot runs them inside async handlers using `asyncio.to_thread()` if needed
- Format currency with `services/formatter.py` helpers — never format inline

### TypeScript (frontend)
- All Supabase types are defined in `frontend/src/lib/supabase.ts` — add new types there
- Data fetching belongs in hooks (`src/hooks/`) — pages should only call hooks, not query Supabase directly
- Use `cn()` from `src/lib/utils.ts` for conditional className merging
- shadcn/ui components in `src/app/components/ui/` — do not edit these files; extend by wrapping
- The `@` path alias resolves to `frontend/src/`

### Naming
- Indonesian UI labels (consistent with the bot's Indonesian UX): Pengeluaran, Pemasukan, Riwayat, Tren, Anggaran, Tujuan
- Categories use English strings in the DB (`Food & Dining`, `Transport`, etc.) — match exactly when inserting

---

## Current active branch

`fix/pgbouncer-prepared-statement-error` — PgBouncer fixes are applied and stable. Main is behind by these fixes; merge before any new DB work.

---

## Brand

- **Name:** Gajian Aman
- **Colors:** custom CSS variables in `frontend/src/styles/theme.css`
- **Logo assets:** `logo/arc/` (transparent PNG, white variant, icon 1024px)
- Target users: Indonesian salaried workers tracking monthly spending
