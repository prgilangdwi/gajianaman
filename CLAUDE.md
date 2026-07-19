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

---

## Go Backend (`backend/`)

Modern rewrite of the Telegram bot in Go. Replaces the Python bot.

### Tech Stack
- **Go 1.23** with standard library patterns
- **telegram-bot-api/v5** — Telegram bot framework
- **sqlx + lib/pq** — PostgreSQL with Supabase
- **golang-migrate** — Database migrations
- **viper** — Configuration management
- **zap** — Structured logging
- **opencode-sdk-go** — AI categorization (Claude)

### Project Structure
```
backend/
├── cmd/
│   ├── bot/main.go       # Bot entry point
│   ├── migrate/main.go   # Migration runner
│   └── seed/main.go      # Database seeder
├── internal/
│   ├── bot/              # Telegram handlers (commands, callbacks, photos, messages)
│   ├── config/           # Viper config loading
│   ├── db/               # Database connection (sqlx)
│   ├── handler/          # HTTP handlers (if any)
│   ├── model/            # Domain structs
│   ├── parser/           # AI parsing logic
│   ├── repository/       # Database queries (one per table)
│   └── service/          # Business logic
├── pkg/
│   ├── logger/           # Zap logger setup
│   └── utils/            # Currency formatting, helpers
└── internal/db/migrations/  # SQL migrations (000001_*.up.sql, *.down.sql)
```

### Commands
```bash
make run           # Run bot locally
make build         # Build binary
make migrate-up    # Apply migrations
make migrate-down  # Rollback migrations
make seed          # Seed default categories
make test          # Run tests
```

### Conventions
- Repository pattern: one file per table in `internal/repository/`
- Migrations in `internal/db/migrations/` with format `NNNNNN_name.up.sql`
- Use `sqlx.DB` for queries, not raw `database/sql`
- Config via `config.yaml` + environment variables
- All amounts stored in cents (multiply by 100)

---

## SvelteKit Frontend (`frontend-v2/`)

Modern rewrite of the React dashboard. Replaces `frontend/`.

### Tech Stack
- **SvelteKit 2** with Svelte 5 runes (`$state`, `$derived`, `$props`)
- **TypeScript 6**
- **Auth.js** (`@auth/sveltekit`) — Google OAuth
- **Supabase** — Database client (anon key client-side, service key server-side)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **PWA** via `@vite-pwa/sveltekit`
- **Cloudflare Pages** — Deployment target

### Project Structure
```
frontend-v2/
├── src/
│   ├── routes/           # File-based routing
│   │   ├── +page.svelte  # Landing page
│   │   ├── dashboard/    # Protected routes
│   │   └── login/        # Auth pages
│   ├── lib/
│   │   ├── supabase.ts          # Client + types + enums
│   │   ├── supabase.server.ts   # Admin client (service key)
│   │   ├── database.types.ts    # Auto-generated from Supabase
│   │   └── components/          # Reusable components
│   ├── auth.ts           # Auth.js config
│   ├── hooks.server.ts   # Request interceptor
│   └── app.d.ts          # Type augmentations
└── static/               # Static assets
```

### Commands
```bash
bun run dev        # Start dev server (port 5173)
bun run build      # Production build
bun run check      # Type checking with svelte-check
bun run db:types   # Regenerate Supabase types (after migrations)
bun run deploy     # Build and deploy to Cloudflare
```

### Svelte 5 Runes (Key Patterns)
```svelte
<script lang="ts">
  // Props from parent or +page.server.ts
  let { data, form } = $props();
  
  // Reactive state (replaces let x = value)
  let count = $state(0);
  
  // Derived values (replaces $: x = ...)
  const doubled = $derived(count * 2);
</script>
```

### Route Files
| File | Purpose | Runs On |
|------|---------|---------|
| `+page.svelte` | Page UI | Server + Client |
| `+page.server.ts` | Server-only load & form actions | Server only |
| `+layout.svelte` | Nested layout | Server + Client |
| `+server.ts` | API endpoint | Server only |

### Form Actions
```typescript
// +page.server.ts
export const actions = {
  save: async ({ request, locals }) => {
    const data = await request.formData();
    // Process form...
    return { success: true };
  }
};
```

```svelte
<!-- +page.svelte -->
<form method="POST" action="?/save" use:enhance>
  <input name="field" />
  <button>Save</button>
</form>
```

### Conventions
- Types in `src/lib/supabase.ts` — re-export from `database.types.ts`
- Server secrets via `platform.env` (Cloudflare), not `$env/static/private`
- `$lib` alias resolves to `src/lib/`
- Run `bun run db:types` after Go migrations

---

## Project AETHER Governance Rules

**Effective Date:** May 21, 2026  
**Status:** ACTIVE — Project AETHER redesign execution framework  
**Authority:** Single source of truth for all Claude Code sessions working on AETHER phases

### Overview

Project AETHER (Architecture Evolution Toward Holistic Engineering Rebuilds) is a comprehensive redesign of Gajian Aman spanning 10 phases. This section enforces strict governance rules to prevent context bloat, ensure quality gates, and maintain deterministic execution.

### Rule 1: Pre-Flight Read Requirements

**Every Claude Code session, before ANY code modification, MUST read in this order:**

1. `feature-update/major-update_4/master-development-roadmap.md` — The single source of truth
2. `feature-update/major-update_4/staging/phase-[XX]-*.md` — The active phase execution plan
3. `feature-update/major-update_4/runtime/runtime-phase-[XX].md` — Execution parameters
4. Latest recap from `aether/session-recaps/` (if one exists)

**Violation:** Starting code work without reading these documents is an immediate failure. Stop and re-read.

### Rule 2: Anti-Context-Bloating Limit

**Hard cap: 3–5 files modified per session.**

- Session completion triggers immediately after 5 files are modified OR when a micro-batch is complete
- Do NOT attempt to start a new batch in the same session
- Fresh session = clean context, full re-read of roadmap and phase documents

**Rationale:** Prevents context window overflow and ensures clarity for the next session.

### Rule 3: Post-Session Recap Requirement

**MANDATORY: A recap MUST be written at the end of every session.**

- Template: `feature-update/major-update_4/runtime/runtime-recap-template.md`
- Output directory: `aether/session-recaps/`
- Filename format: `YYYY-MM-DD-Phase[XX]-Batch[Y].md`
- Timing: Before session termination
- Content: Decision log, files touched, next steps, unresolved issues

**Violation:** Failing to create a recap is session incompletion. The next session cannot start without it.

### Rule 4: Build Quality Gate — Non-Negotiable

**NO COMMIT WITHOUT A PASSING BUILD.**

```bash
npm run build  # Must pass with zero errors
npm run lint   # Must pass once lint is available (Batch 2 onward)
```

- Test locally BEFORE committing
- If build fails, do NOT attempt workarounds — revert, document the failure, stop
- A green build is the prerequisite for all Git checkpoints

### Rule 5: Strict Scope Separation by Phase

**Phase 01 Specific (Governance & Infrastructure):**
- ✅ Create `aether/` governance directories
- ✅ Modify `.claude/` settings
- ✅ Modify `CLAUDE.md` with governance rules
- ✅ Create inventories and audits (Batch 3+)
- ❌ NO page modifications
- ❌ NO hook modifications
- ❌ NO component styling changes
- ❌ NO database schema changes
- ❌ NO bot code changes

**Future Phases:** Each phase file defines its own IN-SCOPE and OUT-OF-SCOPE items. Violating the Touch List is an immediate failure.

### Rule 6: Git Workflow & Branching Strategy

- **Current state:** Working on `main` during Phase 01 (governance only)
- **Batch 2 onward:** Create `feature/phase-[XX]-[name]` from `develop` branch
- **Commits:** Follow conventional commits: `type(scope): description`
  - Example: `chore(gov): setup aether governance directories and CLAUDE rules`
  - Example: `fix(a11y): implement wcag aaa accessibility standards`
- **No direct main commits:** All feature work must use feature branches
- **Commit frequency:** One commit per completed micro-batch

### Rule 7: Architecture Preservation

**Do NOT modify without explicit phase instructions:**
- `frontend/src/lib/supabase.ts` (TypeScript types, DB client)
- `frontend/src/styles/theme.css` (design tokens — reserved for Phase 02)
- Existing custom hooks in `src/hooks/`
- Vercel (frontend) + Railway (bot) architectural boundary

### Rule 8: Batch Completion & Session Handoff

**When a batch is complete:**

1. ✅ Verify build passes: `npm run build`
2. ✅ Run tests (once available): `npm run typecheck` + `npm test`
3. ✅ Create Git commit with conventional format
4. ✅ Generate recap using `runtime-recap-template.md`
5. ✅ Stop and await human approval before starting next batch
6. ✅ Next session: Start fresh with full pre-flight read

### Rule 9: Stop Conditions — IMMEDIATE SESSION STOP

Stop immediately and await human validation if:

- A batch is complete ✋
- Context limits approach (3–5 files modified) ✋
- An architectural inconsistency is discovered ✋
- A build or test fails ✋
- A dependency blocker is found ✋

**Never attempt to power through.** Stop, document, wait for approval.

### Rule 10: Recap Memory Persistence

**Recap files serve as session handoff documentation.**

- Each recap is committed to Git as part of the batch checkpoint
- Next session reads the latest recap to establish context
- Recaps are the ONLY way to carry state between sessions (no environment files, no .claude/state)
- Keep recaps concise but complete: decisions, blockers, next batch scope

---

### Configuration Reference

**See `.claude/settings.json` for enforced configuration:**
- Tool call permissions (no auto-approval of Bash/Edit/Write)
- Session file limits (3–5 files max)
- Build quality gates (npm run build before commit)
- Pre-flight check list
- Validation protocols

### Questions or Clarifications

If any AETHER governance rule conflicts with other CLAUDE.md guidance, **this section takes precedence.** Project AETHER supersedes all prior conventions during its execution phases.
