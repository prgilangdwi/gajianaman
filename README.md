# Gajian Aman v2.0.0 — Safe Until Payday

> AI-powered personal finance tracker for Indonesian salaried workers. Track expenses, manage budgets, achieve financial goals with intelligent insights powered by Claude Haiku.

**Live:** [gajianaman.xyz](https://gajianaman.xyz)

---

## 📦 Project Architecture

**Gajian Aman** is a full-stack fintech application with two independently deployable components:

| Component | Technology | Deploy Target | Repository |
|-----------|-----------|----------------|------------|
| **React Frontend** (v2.0.0 AETHER) | React 18 + TypeScript + Tailwind CSS v4 | Vercel | `/frontend` |
| **Telegram Bot** | python-telegram-bot v20 + async | Railway | `/bot` |
| **Database** | Supabase PostgreSQL (shared) | Supabase | Tables: users, transactions, budgets, goals, categories |

---

## 🎯 v2.0.0 AETHER Redesign

Project AETHER is a comprehensive UX/architecture overhaul completed in 10 phases over 5 months:

| Metric | Target | Status |
|--------|--------|--------|
| **UI Quality** | 9/10 | ✅ Complete |
| **UX Quality** | 9/10 | ✅ Complete |
| **Accessibility** | WCAG AAA (7:1 text contrast) | ✅ Complete (Batch 2) |
| **Performance** | Lighthouse ≥90 (all categories) | 🔄 In Progress (Phase 09) |
| **Pages** | 15 essential screens (consolidated from 39) | ✅ Complete |
| **Components** | ~40 reusable (from 63 fragmented) | ✅ Complete |
| **Mobile-First** | 375px baseline → 1280px enhanced | ✅ Complete |

**Key Improvements:**
- 5-tier bottom navigation (Home, Spend, Analytics, Tools, AI) — zero cognitive overload
- Hero-first dashboard with progressive disclosure
- Multi-turn AI assistant with conversation memory
- WCAG AAA contrast compliance across light/dark modes
- Optimized category colors for 7:1 text contrast (Batch 2)

---

## 🚀 Quick Start (Frontend Development)

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project with schema imported

### Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Environment Variables (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://[ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJh...
```

### Build for Production

```bash
npm run build          # Vite build (dist/)
npm run preview        # Preview production build locally
```

---

## 🚀 Telegram Bot Deployment

The Telegram bot runs independently on Railway.

### Setup
1. Create Telegram bot via **@BotFather** → save `BOT_TOKEN`
2. Get Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
3. Deploy to Railway with env vars: `BOT_TOKEN`, `ANTHROPIC_API_KEY`, `DATABASE_URL`

**Bot Commands:**
- `/start` — Register user
- `/add <amount> <note>` — Log expense
- `/income <amount> <note>` — Log income
- `/summary` — Monthly summary
- `/budget <category> <amount>` — Set budget
- `/goal add <name> <target>` — Create savings goal

---

## 🏗️ Directory Structure

```
.
├── frontend/                          # React v18 + Vite app (AETHER v2.0)
│   ├── src/
│   │   ├── app/                      # Router + providers + pages
│   │   ├── components/               # Organized by type (ui, common, features, layout)
│   │   ├── hooks/                    # Data fetching + UI behavior
│   │   ├── stores/                   # Zustand state (filters, privacy, nav)
│   │   ├── lib/                      # Utilities, types, theme config
│   │   └── styles/                   # CSS tokens (theme.css), global styles
│   ├── index.html                    # Entry HTML with SEO meta tags
│   ├── vercel.json                   # Vercel deploy config
│   ├── vite.config.ts                # Vite build config
│   └── package.json
│
├── bot/                              # Python Telegram bot
│   ├── handlers/                     # Command + message handlers
│   ├── main.py                       # Bot entry point
│   └── services/                     # Claude Haiku integration, formatting
│
├── db/                               # Database schema + operations
│   ├── schema.sql                    # Supabase DDL
│   ├── database.py                   # Async/sync connection
│   └── operations.py                 # All DB queries (single SSOT)
│
├── scheduler/                        # APScheduler for weekly reports
│
├── ARCHITECTURE.md                   # AETHER design principles & patterns
├── CONTRIBUTING.md                   # Developer workflow guidelines
├── README.md                          # This file
├── CLAUDE.md                         # Project instructions for Claude Code
├── requirements.txt                  # Python dependencies
├── railway.toml                      # Railway deploy config (bot)
└── Procfile                          # Process definitions
```

---

## 🔐 Deployment & Rollback

### Production Environments

| Environment | URL | Branch | Auto-Deploy | Notes |
|------------|-----|--------|------------|-------|
| Development | localhost:5173 | `phase/*` | — | Local dev |
| Preview | `*.vercel.app` | PR to develop | ✅ Yes | Automatic previews |
| Staging | `staging.gajianaman.xyz` | `develop` | ✅ Yes | Test before prod |
| Production | `gajianaman.xyz` | `main` | ✅ Yes | Vercel auto-deploy |

### Emergency Rollback Procedure

If production breaks, **revert immediately to pre-AETHER state:**

```bash
# 1. Go to git tag (pre-AETHER, stable build)
git checkout v1.9.0-pre-aether      # Last stable before redesign

# 2. Deploy Vercel
git checkout main
git reset --hard v1.9.0-pre-aether
git push origin main --force

# 3. Vercel auto-deploys from main (within 1-2 minutes)
# Monitor: dashboard.vercel.com

# 4. Once stable, investigate failure in phase branch
# Do NOT merge broken phases to develop/main
```

**Critical:** All AETHER phases are on `phase/*` branches. Rollback only reverts `main`, leaving phase work intact for investigation.

---

## ✅ Quality Assurance

### Build Validation (Required Before Each Commit)

```bash
cd frontend
npm run build          # Must pass zero errors
npm run preview        # Local production test
```

### Lighthouse Targets (Phase 09 Complete)

- **Performance:** ≥90
- **Accessibility:** ≥90 (WCAG AAA)
- **Best Practices:** ≥90
- **SEO:** ≥90

### Accessibility Compliance

- **WCAG AAA:** 7:1 contrast ratio for text, 3:1 for UI components
- **Keyboard Navigation:** All pages fully keyboard-navigable
- **Dark Mode:** Full support across all 15 pages
- **Reduced Motion:** All animations respect `prefers-reduced-motion`

### Color Darkening (Batch 2)

Category colors were systematically darkened in Phase 10, Batch 2 to achieve WCAG AAA text contrast on light backgrounds:
- Food & Dining: `#f59e0b` → `#b86f0d` (7:1+)
- Transport: `#3b82f6` → `#1d4ed8` (7:1+)
- Health: `#ef4444` → `#b91c1c` (7:1+)
- Sentiment colors (positive/negative/warning) similarly updated

See `ARCHITECTURE.md` for full darkening rationale.

---

## 📖 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — AETHER design principles, anti-bloat execution model, token-driven styling system
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Developer onboarding: atomic commits, pre-flight reads, session recap requirements
- **[CLAUDE.md](./CLAUDE.md)** — Project instructions for Claude Code sessions
- **[Phase Roadmap](./feature-update/major-update_4/master-development-roadmap.md)** — Complete 10-phase implementation plan

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| **Live App** | https://gajianaman.xyz |
| **Supabase Dashboard** | https://app.supabase.com |
| **Vercel Deployments** | https://vercel.com |
| **Railway (Bot)** | https://railway.app |
| **Figma Design System** | (Design file reference) |

---

## 📞 Support & Contributions

**Project Owner:** Gilang Dwi  
**Tech Lead:** Claude Code (Anthropic)

For contribution guidelines, see **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

---

**v2.0.0 AETHER completed:** May 2026  
**Production Status:** ✅ Ready
