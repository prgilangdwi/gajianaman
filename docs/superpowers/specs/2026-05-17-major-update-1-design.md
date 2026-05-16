# Gajian Aman — Major Update 1: Master Plan Design

**Date:** 2026-05-17  
**Scope:** 13 features across 4 priority batches  
**Status:** Approved — ready for implementation planning

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Subscription payment | Manual transfer MVP only | Midtrans deferred to later phase |
| Landing page routing | Smart: unauth → landing, auth → `/overview` | UX-friendly, no duplicate pages |
| Credits system | Dropped — replaced by plan-based gating | Simpler, less DB overhead |
| Wallet filter | Separate `useWalletFilter` context | No rename of existing `useMonthFilter` |
| Plan gating | Config-override (`MVP_OVERRIDE = True`) | Zero rework when Midtrans goes live |

---

## Architecture Overview

```
Gajian Aman
├── Python Bot (Railway)
│   ├── bot/handlers/commands.py     ← /splitbill, /wallet (new); /add, /income (updated)
│   ├── services/subscription.py     ← NEW: plan gating with MVP_OVERRIDE flag
│   ├── services/formatter.py        ← UPDATED: full copywriting revamp
│   ├── scheduler/weekly_report.py   ← UPDATED: payday reminder job added
│   └── db/operations.py             ← UPDATED: all new async query functions
│
├── React Frontend (Vercel)
│   ├── api/
│   │   ├── parse-image.js           ← existing
│   │   ├── split-bill-ai.js         ← NEW
│   │   ├── budget-recommendation.js ← NEW
│   │   └── generate-report.js       ← NEW
│   └── src/
│       ├── app/
│       │   ├── App.tsx              ← UPDATED: smart / routing + 6 new routes
│       │   ├── components/
│       │   │   ├── Layout.tsx       ← UPDATED: new nav items + privacy eye icon
│       │   │   └── PrivacyAmount.tsx ← NEW
│       │   └── pages/
│       │       ├── Landing.tsx      ← NEW
│       │       ├── Overview.tsx     ← UPDATED: moved to /overview, wallet balance
│       │       ├── Budget.tsx       ← UPDATED: Belum Dibuat state
│       │       ├── Goals.tsx        ← UPDATED: nabung/hari calculation
│       │       ├── Riwayat.tsx      ← UPDATED: download button + wallet filter
│       │       ├── Pengeluaran.tsx  ← UPDATED: wallet filter
│       │       ├── Kalender.tsx     ← NEW
│       │       ├── SplitBill.tsx    ← NEW
│       │       ├── SplitBillShare.tsx ← NEW (public, no auth)
│       │       ├── Gajian.tsx         ← NEW
│       │       ├── Wallet.tsx         ← NEW
│       │       └── Langganan.tsx    ← NEW
│       ├── hooks/
│       │   ├── useAuth.tsx          ← UPDATED: Google login fix
│       │   ├── usePrivacy.tsx       ← NEW
│       │   ├── useWalletFilter.tsx  ← NEW
│       │   ├── useWallets.ts        ← NEW
│       │   ├── useSplitBills.ts     ← NEW
│       │   └── useSubscription.ts   ← NEW
│       └── lib/
│           ├── supabase.ts          ← UPDATED: Wallet, Subscription, SplitBill types
│           └── copy.ts              ← NEW: full COPY object
│
└── Database (Supabase)
    ├── db/migration_major_update_1.sql ← NEW
    └── db/schema.sql                   ← UPDATED to reflect all additions
```

---

## Section 1 — Database Layer

### File: `db/migration_major_update_1.sql`

```sql
-- Fitur 2: Google auth columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

-- Fitur 5: Gajian / Risk profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS payday_date INTEGER; -- 1–31
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_profile JSONB;
-- {"type": "konservatif|moderat|agresif", "income": X, "dependents": N, "answers": {...}}
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_budget_recommendation JSONB;
-- {"categories": [{name, percentage, amount, tip}], "generated_at": ISO}

-- Fitur 10: Subscription
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'gratis';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Fitur 6: Wallet
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'bank' | 'ewallet' | 'cash'
  icon TEXT,
  is_primary BOOLEAN DEFAULT false,
  initial_balance NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id);

-- Fitur 1: Split Bill
CREATE TABLE IF NOT EXISTS split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id),
  session_name TEXT NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  participants JSONB NOT NULL,  -- [{name, amount, paid: bool}]
  items JSONB,                  -- [{name, price, assignee}] nullable
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitur 10: Subscription audit log
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id),
  plan TEXT NOT NULL,           -- 'gratis' | 'starter' | 'pro'
  period TEXT NOT NULL,         -- 'monthly' | '3month' | '6month' | 'yearly'
  price_paid NUMERIC(10,2),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_ref TEXT,
  is_active BOOLEAN DEFAULT true
);
```

### New types in `frontend/src/lib/supabase.ts`

```typescript
export interface Wallet {
  id: string;
  user_id: number;
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  icon?: string;
  is_primary: boolean;
  initial_balance: number;
  created_at: string;
}

export interface SplitBill {
  id: string;
  user_id: number;
  session_name: string;
  total_amount: number;
  participants: Array<{ name: string; amount: number; paid: boolean }>;
  items?: Array<{ name: string; price: number; assignee: string }>;
  share_token: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: number;
  plan: 'gratis' | 'starter' | 'pro';
  period: 'monthly' | '3month' | '6month' | 'yearly';
  price_paid?: number;
  started_at: string;
  expires_at: string;
  payment_ref?: string;
  is_active: boolean;
}
```

### New `db/operations.py` functions

```python
# Wallet
async def get_wallets(session, user_id: int) -> list[dict]
async def create_wallet(session, user_id: int, name: str, type: str, is_primary: bool, initial_balance: float) -> dict
async def get_transactions_by_wallet(session, user_id: int, wallet_id: str, month: int, year: int) -> list[dict]

# Split Bill
async def create_split_bill(session, user_id: int, session_name: str, total: float, participants: list, items: list | None) -> dict
async def get_split_bill_by_token(session, token: str) -> dict | None

# Auth
async def get_user_by_email(session, email: str) -> dict | None
async def update_user_google_auth(session, user_id: int, email: str, google_id: str) -> None

# Scheduler
async def get_payday_users(session, day: int) -> list[dict]

# Subscription
async def get_or_create_subscription(session, user_id: int, plan: str, period: str, expires_at: datetime) -> dict
```

---

## Section 2 — Backend Services

### `services/subscription.py` (NEW)

```python
MVP_OVERRIDE = True  # Set False when Midtrans goes live

PLAN_FEATURES = {
    'gratis':  {
        'max_wallets': 0,
        'split_bill_monthly': 0,
        'ai_features': False,
        'download_csv': False,
        'budget_categories': 3,
    },
    'starter': {
        'max_wallets': 3,
        'split_bill_monthly': 5,
        'ai_features': True,
        'download_csv': True,
        'budget_categories': -1,
    },
    'pro': {
        'max_wallets': -1,
        'split_bill_monthly': -1,
        'ai_features': True,
        'download_csv': True,
        'budget_categories': -1,
    },
}

async def check_feature_access(session, user_id: int, feature: str) -> bool:
    if MVP_OVERRIDE:
        return True
    user = await get_user(session, user_id)
    plan = user.get('subscription_plan', 'gratis')
    return bool(PLAN_FEATURES.get(plan, {}).get(feature, False))
```

### `services/formatter.py` — Updated message functions

All bot-facing strings revamped to casual Indonesian tone:

| Old | New |
|---|---|
| "Transaksi berhasil ditambahkan" | "✅ Catat! Pengeluaran Rp {amount} untuk {category} udah masuk ya." |
| "Error: Invalid amount" | "Hmm, nominalnya gak kebaca nih 😅 Coba ketik ulang ya. Contoh: /add 25000 makan siang" |
| "Weekly summary" | "📊 Rekap Mingguan kamu udah siap! Minggu ini kamu habis {X} total." |
| "Budget exceeded" | "⚠️ Ups! Budget {kategori}-mu udah mepet nih ({persen}% terpakai). Saatnya rem dikit?" |
| "No transactions found" | "Belum ada catatan bulan ini. Yuk mulai catat pengeluaran pertamamu!" |

New message functions added: `fmt_payday_reminder()`, `fmt_splitbill_result()`, `fmt_wallet_list()`.

### `scheduler/weekly_report.py` — New payday job

```python
# New APScheduler job: daily 08:00 WIB
async def send_payday_reminders(bot):
    today = datetime.now(WIB).day
    async with get_session() as session:
        users = await get_payday_users(session, today)
    for user in users:
        await bot.send_message(
            chat_id=user['user_id'],
            text=fmt_payday_reminder()
        )
```

### New bot commands in `bot/handlers/commands.py`

**`/splitbill` — ConversationHandler**
```
States:
  TOTAL      → ask total amount
  PARTICIPANTS → ask names (comma-separated)
  MODE       → Equal / Custom / Percentage
  AMOUNTS    → (if Custom) ask amount per person
  → save to split_bills table
  → reply with result + inline buttons:
    [📋 Salin Link] → web app /split/{token}
    [✅ Catat ke Transaksi Saya]
```

**`/wallet`**
```
/wallet          → list wallets + estimated balance
/wallet setup    → guided: pick from BCA|OVO|GoPay|Cash|Lainnya → create entry
```

**`/add` and `/income` — updated parsing**
```
Parse optional suffix: "wallet=gopay" or "dari=bca"
Match to user wallets table → store wallet_id on transaction
If no wallets found → "Kamu belum setup wallet. Ketik /wallet setup untuk mulai"
```

---

## Section 3 — Frontend Architecture

### `App.tsx` routing

```tsx
// Public routes
<Route path="/" element={<SmartHome />} />       // Landing or redirect to /overview
<Route path="/login" element={<Login />} />
<Route path="/auth/callback" element={<AuthCallback />} />
<Route path="/link-telegram" element={<LinkTelegram />} />
<Route path="/split/:token" element={<SplitBillShare />} />  // No auth required

// Protected routes (inside RequireAuth + Layout)
<Route path="/overview" element={<Overview />} />
<Route path="/pengeluaran" element={<Pengeluaran />} />
<Route path="/budget" element={<Budget />} />
<Route path="/goals" element={<Goals />} />
<Route path="/riwayat" element={<Riwayat />} />
<Route path="/tren" element={<Tren />} />
<Route path="/kalender" element={<Kalender />} />
<Route path="/split" element={<SplitBill />} />
<Route path="/gajian" element={<Gajian />} />
<Route path="/wallet" element={<Wallet />} />
<Route path="/langganan" element={<Langganan />} />

// SmartHome component
function SmartHome() {
  const { user } = useAuth();
  if (user) return <Navigate to="/overview" replace />;
  return <Landing />;
}
```

### New hooks

**`usePrivacy.tsx`**
```typescript
// State: { isHidden: boolean, toggle: () => void }
// Persisted to localStorage key: 'gajian_aman_privacy'
```

**`useWalletFilter.tsx`**
```typescript
// State: { walletId: 'all' | string, setWalletId: (id) => void }
// Separate context alongside useMonthFilter — no rename
// Added to App.tsx as <WalletFilterProvider>
```

**`useWallets.ts`** — fetches wallets from Supabase for current user  
**`useSplitBills.ts`** — fetches split bill history  
**`useSubscription.ts`** — fetches plan + expires_at; exposes `canAccess(feature): boolean` (returns true while MVP_OVERRIDE)

### `PrivacyAmount.tsx`

```tsx
export function PrivacyAmount({ value, className }: { value: string; className?: string }) {
  const { isHidden } = usePrivacy();
  return (
    <span className={cn(isHidden && 'privacy-hidden', className)}>
      {value}
    </span>
  );
}
// CSS in index.css:
// .privacy-hidden { filter: blur(8px); user-select: none; pointer-events: none; }
// .privacy-hidden:hover { filter: blur(4px); }
```

Applied to: Overview totals, Budget amounts, Goals saved/target, Riwayat amounts, wallet balances.

### `frontend/src/lib/copy.ts`

```typescript
export const COPY = {
  emptyStates: {
    transactions: "Belum ada transaksi. Yuk catat yang pertama!",
    budget: "Budget belum dibuat. Atur sekarang biar keuangan lebih terarah.",
    goals: "Belum ada goals. Mulai tentukan target finansialmu!",
    wallets: "Belum ada wallet. Tambah sumber dana kamu dulu ya.",
    splitBill: "Belum ada sesi split bill. Yuk mulai yang pertama!",
  },
  success: {
    transactionAdded: "✅ Transaksi berhasil dicatat!",
    budgetSaved: "Budget disimpan. Semangat nabung!",
    goalCreated: "Goal baru dibuat. You got this! 💪",
    walletCreated: "Wallet berhasil ditambahkan!",
  },
  errors: {
    generic: "Ups, ada yang error nih. Coba lagi ya.",
    noConnection: "Koneksi terputus. Cek internet kamu dulu.",
    sessionExpired: "Sesimu habis. Login lagi yuk.",
  },
  labels: {
    income: "Pemasukan", expense: "Pengeluaran", savings: "Tabungan",
    budget: "Anggaran", remaining: "Sisa", spent: "Terpakai",
    overview: "Ringkasan", history: "Riwayat", trends: "Tren",
    goals: "Tujuan", calendar: "Kalender", splitBill: "Split Bill",
    payday: "Gajian", wallet: "Dompet", subscription: "Langganan",
  }
}
```

### `Layout.tsx` updates

New sidebar nav items: Kalender (ti-calendar), Split Bill (ti-users), Gajian (ti-cash), Dompet (ti-wallet), Langganan (ti-crown). Eye icon toggle (ti-eye / ti-eye-off) in header for privacy mode with tooltip "Sembunyikan angka".

---

## Section 4 — Batch A: Bug Fixes + Quick Wins

### Fitur 2 — Fix Google Login

**`frontend/src/hooks/useAuth.tsx`**
- Add `loginWithGoogle` already calls `supabase.auth.signInWithOAuth`
- Add `resolveUserFromSupabaseSession()`: after OAuth, get session email/id → query users table → set localStorage

**`frontend/src/app/pages/AuthCallback.tsx`**
```
After supabase.auth.getSession() succeeds:
  1. Get auth.user.email and auth.user.id
  2. Query: SELECT * FROM users WHERE email = $1 OR google_id = $2
  3. Found → set gajian_aman_user in localStorage → navigate('/overview')
  4. Not found → navigate('/link-telegram')
```

**`frontend/src/app/pages/LinkTelegram.tsx`**
```
After successful Telegram ID link:
  UPDATE users SET email = auth.email, google_id = auth.id
  WHERE user_id = input_telegram_id
  → set localStorage → navigate('/overview')
```

**`RequireAuth`** — checks `localStorage` OR active `supabase.auth.getSession()`.

### Fitur 3 — Fix Budget "Belum Dibuat"

**`frontend/src/app/pages/Budget.tsx`**

Three explicit states per category:

| Condition | Badge | Progress bar | Action |
|---|---|---|---|
| No budget entry for month/year | "Belum Dibuat" (gray) | Hidden | "+ Buat Budget" button |
| Budget exists, spent = 0 | "Aman" (green) | Empty (0%) | Edit button |
| spent > 0 && spent < budget | "Aman" (green) | Filled | Edit button |
| spent ≥ 80% budget | "Mepet" (yellow) | Filled | Edit button |
| spent > budget | "Melebihi" (red) | Overfilled | Edit button |

Join logic: iterate `ALL_CATEGORIES`, check if budget entry exists in `useBudgets()` result for current `{ month, year }`.

### Fitur 4 — Goals nabung/hari

**`frontend/src/app/pages/Goals.tsx` — `GoalCard` component**

```typescript
const today = new Date();
const deadline = goal.deadline ? new Date(goal.deadline) : null;
const gap = target - saved;
const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000)) : null;
const perDay = daysLeft && daysLeft > 0 && gap > 0 ? Math.ceil(gap / daysLeft) : null;
```

Display below progress bar:
- `gap <= 0` → "✅ Target tercapai!"
- `daysLeft === 0` → "⚠️ Deadline terlewat"
- Otherwise → "📅 {daysLeft} hari lagi | 💰 Nabung Rp {perDay}/hari"
- Color: `perDay > 500_000` → red text, `perDay <= 50_000` → green text, else default

### Fitur 11 — Privacy Mode

1. `usePrivacy.tsx` — context + localStorage persistence
2. `PrivacyAmount.tsx` — blur wrapper component
3. CSS in `index.css` — `.privacy-hidden` class
4. `Layout.tsx` — eye icon toggle in header
5. Apply `PrivacyAmount` to all currency displays in: Overview, Budget, Goals, Riwayat, Wallet

### Fitur 13 — Copywriting Revamp

1. Create `frontend/src/lib/copy.ts` with full `COPY` object
2. Update all existing pages to import and use `COPY` strings for empty states, errors, labels
3. Update `services/formatter.py` — revamp all message-returning functions to new tone
4. No structural changes to handlers — only the string content of `formatter.py` functions changes

---

## Section 5 — Batch B: New Lightweight Features

### Fitur 7 — Kalender Heatmap

**`frontend/src/app/pages/Kalender.tsx`**

Data: `useTransactions()` (existing) + `useMonthFilter()` + `useWalletFilter()`.

```typescript
// Group transactions by date
const byDate = transactions.reduce((acc, t) => {
  const d = t.date.split('T')[0];
  acc[d] = (acc[d] ?? 0) + (t.type === 'expense' ? t.amount : 0);
  return acc;
}, {} as Record<string, number>);
```

Heatmap tiers:
```
0         → bg-white
1–100_000 → bg-green-100
100k–500k → bg-yellow-100
500k+     → bg-red-100
```

Calendar grid: 7-column CSS grid, day-of-week headers (Min–Sab). Each cell: date number (top-left) + formatted total (bottom). Click cell → Dialog with transaction list for that date. Summary row below grid: "Total bulan ini: Rp X | Hari termahal: Tgl Y (Rp Z)".

No new DB queries — pure frontend grouping.

### Fitur 9 — Download Laporan

**`frontend/api/generate-report.js`**

```javascript
// POST { user_id, month, year, wallet_id, format: 'csv' | 'pdf' }

// CSV path (no AI):
// → query Supabase for transactions
// → build string: Date,Category,Type,Amount,Note,Wallet
// → return as text/csv with Content-Disposition: attachment

// PDF path (one Claude Haiku call):
// → query Supabase for transactions
// → compute aggregates: total_income, total_expense, top_3_categories
// → send ONLY aggregates to Claude Haiku:
//   "Buat ringkasan keuangan 3 paragraf: Income Rp X, Expense Rp Y, Top kategori: A, B, C"
//   max_tokens: 300
// → render simple HTML template with data + narrative
// → return as text/html with print-friendly CSS (MVP; puppeteer deferred)
```

**`frontend/src/app/pages/Riwayat.tsx`** — Download dropdown in header:
- CSV bulan ini
- PDF summary bulan ini
- CSV semua waktu

Download dialog: month picker, wallet selector, format radio (CSV / PDF), Download button.

### Fitur 6 — Wallet Tracking

**DB:** `wallets` table + `wallet_id` on `transactions` (migration file).

**`frontend/src/hooks/useWallets.ts`** — fetch wallets for current user.

**`frontend/src/hooks/useWalletFilter.tsx`** — `{ walletId: 'all' | uuid, setWalletId }` context.

**Onboarding modal** (shown on first login if `wallets.length === 0`):
Quick-pick grid: BCA / Mandiri / BRI / BNI / GoPay / OVO / Dana / ShopeePay / Cash / Lainnya. Creates wallet with `is_primary = true`. Can be skipped.

**`TransactionModal.tsx`** — "Dari wallet mana?" dropdown added before save.

**`Overview.tsx`** — when wallet selected: show "Saldo estimasi: Rp X" = `initial_balance + income - expense`.

**Wallet filter bar** added to Overview, Riwayat, Pengeluaran — renders only if user has wallets.

**Bot — `bot/handlers/commands.py`:**
- `/wallet` lists wallets
- `/wallet setup` creates first wallet interactively
- `/add` / `/income` parse `wallet=X` or `dari=X` suffix

---

## Section 6 — Batch C: Business Features

### Fitur 12 — Landing Page

**`frontend/src/app/pages/Landing.tsx`**

Sections (top to bottom):

1. **Hero** — "Udah gajian, tapi duit ke mana?" / "Catat, pantau, dan kelola keuanganmu dari Telegram & Web. Simple banget." / CTAs: [Coba Gratis → /login] [Pelajari Lebih Lanjut → smooth scroll to How It Works section]
2. **How It Works** — 3-step card row with step number + icon + text
3. **Feature Cards** — 6-card grid: 📸 Scan Struk, 🤖 AI Kategorisasi, 💰 Split Bill, 📊 Laporan, 🎯 Goals & Budget, 👜 Multi-wallet
4. **Comparison** — 3-column table: vs Spreadsheet / vs Catatan HP / vs Buku Tulis
5. **Pricing** — 3 cards (Gratis / Starter / Pro) with monthly/yearly toggle; exact prices from spec
6. **Social Proof** — placeholder testimonial cards (3 cards with avatar + quote + name)
7. **FAQ** — shadcn Accordion, 5 common questions
8. **CTA Footer** — "Mulai gratis sekarang. Gak perlu kartu kredit." + [Mulai Sekarang → /login]

Styling: dark background (`--color-bg-dark` from theme.css) + teal-green accent. No new libraries — shadcn Accordion + existing Tailwind.

### Fitur 10 — Subscription System

**DB:** `subscriptions` table + columns on `users` (migration file).

**`services/subscription.py`** with `MVP_OVERRIDE = True` and `PLAN_FEATURES` dict.

**`frontend/src/hooks/useSubscription.ts`**
```typescript
// Fetches users.subscription_plan + subscription_expires_at
// Exposes canAccess(feature: string): boolean
// While MVP_OVERRIDE (server config): always returns true
// When live: checks plan against PLAN_FEATURES
```

**`frontend/src/app/pages/Wallet.tsx`**

Content:
- List of user's wallets: name, type icon, estimated balance (initial_balance + income - expense)
- "Set as Primary" toggle per wallet
- "Tambah Wallet" button → same quick-pick modal as onboarding
- Delete wallet (only if no transactions linked to it)
- Empty state from `COPY.emptyStates.wallets`

**`frontend/src/app/pages/Langganan.tsx`**

Sections:
1. Current plan badge + days remaining (or "Gratis — tanpa batas waktu")
2. Feature comparison table (Gratis / Starter / Pro columns)
3. Pricing cards with period toggle (monthly / 3bln / 6bln / yearly) — exact prices from spec
4. Upgrade CTA → modal with manual transfer instructions:
   - Bank: BCA a/n Gajian Aman
   - Amount: exact plan price
   - Reference: `GA-{user_id}-{plan}`
   - WhatsApp konfirmasi button
5. Gajian Credits display removed (credits system dropped)

### Fitur 8 (simplified) — Plan-Based Gating UI

No `credits_balance`. No `credit_transactions` table.

`useSubscription.ts` exposes:
```typescript
canAccess(feature: 'ai_features' | 'download_csv' | 'wallet' | 'split_bill'): boolean
// Returns true for all while MVP_OVERRIDE
```

Gating applied in UI as disabled state + upgrade prompt tooltip. No hard blocks in MVP — just visual indicators of what's included in each plan (shown in Langganan comparison table).

---

## Section 7 — Batch D: Complex AI Features

### Fitur 5 — Gajian + Risk Profile + AI Budget

**`frontend/src/app/pages/Gajian.tsx`** — 3 sequential sections:

**Section 1 — Payday Date**
- Number picker (1–31) + "Akhir Bulan" option
- Save to `users.payday_date` via Supabase update
- Info callout: "Kamu akan dapat reminder di Telegram setiap tanggal X"

**Section 2 — Risk Profile Quiz** (unlocks after Section 1 is saved)
- 5-step progress bar
- Q1: Monthly fixed expenses → slider Rp 500rb–Rp 10jt
- Q2: Tanggungan → 0 / 1–2 / 3+
- Q3: Emergency Rp 2jt → A) Bisa langsung / B) Perlu pinjam / C) Susah banget
- Q4: Target 1 tahun → A) Dana darurat / B) Beli besar / C) Investasi / D) Bebas utang
- Q5: Keketatan budgeting → A) Super ketat / B) Seimbang / C) Santai
- Result: Konservatif / Moderat / Agresif badge shown
- Save to `users.risk_profile JSONB`

**Section 3 — AI Budget Recommendation** (unlocks after quiz complete)
- "Generate Rekomendasi" button → calls `api/budget-recommendation.js`
- Result: editable table (8 categories, percentage + Rp amount columns)
- User can adjust percentages (auto-recalculate Rp)
- "Terapkan ke Budget" → upserts budget entries for current month
- Result cached in `users.ai_budget_recommendation` — reloaded on next visit, not regenerated

**`frontend/api/budget-recommendation.js`**
```javascript
// POST { risk_profile, monthly_income, answers }
// Claude Haiku: claude-haiku-4-5-20251001
// System: "Kamu advisor keuangan Indonesia. Return JSON only."
// max_tokens: 500
// Output: [{category, percentage, amount, tip_singkat}] (8 categories)
```

**`scheduler/weekly_report.py`** — payday reminder job:
```python
scheduler.add_job(
    send_payday_reminders,
    trigger=CronTrigger(hour=8, minute=0, timezone='Asia/Jakarta'),
    args=[application.bot]
)
```

### Fitur 1 — Split Bill

**`frontend/src/app/pages/SplitBill.tsx`** — creation flow:

Step 1: Session name + upload receipt (→ `api/parse-image.js`) or manual amount input  
Step 2: Add participants (name fields, dynamic add/remove)  
Step 3: Split mode — Equal / Custom / Percentage / Item-based  
Step 4 (item-based only): Item list from AI parse or manual; assign items to participants  
Result: Per-person breakdown card list + Share section + "Catat ke Transaksi Saya" button

Share section: copy link, WhatsApp deep link `wa.me/?text=...`, QR code via `qrcode.react`.

**`frontend/src/app/pages/SplitBillShare.tsx`** — public view:
- No `RequireAuth`
- Fetches split bill by token from Supabase (anon key)
- Read-only: session name, total, per-person breakdown

**`frontend/api/split-bill-ai.js`**
```javascript
// POST { image_base64?, items_text?, participants }
// Claude Haiku: claude-haiku-4-5-20251001
// max_tokens: 400
// Output: { items: [{name, price}], suggestions: [{person, items, subtotal}] }
```

**Bot — `/splitbill` ConversationHandler:**
```
TOTAL       → "Berapa total tagihan?"
PARTICIPANTS → "Siapa saja yang ikut? (pisah koma)"
MODE        → "Mode split? (1) Rata (2) Custom"
AMOUNTS     → (if Custom) amount per person
→ Save to split_bills table
→ Reply with formatted result
→ Inline buttons:
    [📋 Salin Link] → {VITE_APP_URL}/split/{token}  (env var set in Railway + Vercel)
    [✅ Catat ke Transaksi Saya] → creates transaction entry
```

---

## Implementation Order

```
Batch A — Bug Fixes + Quick Wins (implement first)
  1. DB migration file (run in Supabase)
  2. Fitur 2: Fix Google Login (useAuth + AuthCallback + LinkTelegram)
  3. Fitur 3: Fix Budget "Belum Dibuat" (Budget.tsx)
  4. Fitur 4: Goals nabung/hari (Goals.tsx)
  5. Fitur 11: Privacy mode (usePrivacy + PrivacyAmount + Layout)
  6. Fitur 13: Copywriting (copy.ts + formatter.py)

Batch B — New Lightweight Features
  7. Fitur 7: Kalender (Kalender.tsx + route)
  8. Fitur 9: Download Laporan (generate-report.js + Riwayat.tsx button)
  9. Fitur 6: Wallet (DB ops + useWallets + useWalletFilter + TransactionModal + bot)

Batch C — Business Features
  10. Fitur 12: Landing page (Landing.tsx + SmartHome routing)
  11. Fitur 10: Subscription (subscription.py + Langganan.tsx + useSubscription)
  12. Fitur 8 (simplified): canAccess() wired into feature components

Batch D — Complex AI Features
  13. Fitur 5: Gajian (Gajian.tsx + budget-recommendation.js + scheduler job)
  14. Fitur 1: Split Bill (SplitBill.tsx + Split/[token].tsx + split-bill-ai.js + bot /splitbill)
```

---

## Critical Constraints (from CLAUDE.md)

- `NullPool` + `prepared_statement_cache_size=0` in `db/database.py` — do NOT revert
- All DB queries in `db/operations.py` only — no inline SQL elsewhere
- All new Supabase types in `frontend/src/lib/supabase.ts`
- Data fetching in hooks — pages call hooks, not Supabase directly
- All Claude Haiku calls from frontend go via Vercel serverless — never expose `ANTHROPIC_API_KEY` client-side
- Use `claude-haiku-4-5-20251001` for all AI calls — never Sonnet or Opus
- Always set `max_tokens` as low as possible per call
- Cache AI results to DB — never regenerate on every load
- Path alias `@` → `frontend/src/`
