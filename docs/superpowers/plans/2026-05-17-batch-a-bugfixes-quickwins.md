# Batch A — Bug Fixes + Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix Google login, Budget "Belum Dibuat" state, Goals daily savings calculation, add Privacy Mode, and revamp Indonesian copywriting.

**Architecture:** Pure fixes and additive changes — no new pages, no new API routes. New hooks (`usePrivacy`) and component (`PrivacyAmount`) are self-contained. Routing change (`/` → `/overview`) is the only structural change and must be done as one atomic commit with Layout nav updates.

**Tech Stack:** React 18 + TypeScript, Supabase JS client, Tailwind CSS v4, shadcn/ui, python-telegram-bot v20

---

## File Map

| Action | File |
|---|---|
| CREATE | `db/migration_major_update_1.sql` |
| MODIFY | `frontend/src/app/pages/AuthCallback.tsx` |
| MODIFY | `frontend/src/hooks/useAuth.tsx` (RequireAuth) |
| MODIFY | `frontend/src/app/App.tsx` |
| MODIFY | `frontend/src/app/components/Layout.tsx` |
| MODIFY | `frontend/src/app/pages/Budget.tsx` |
| MODIFY | `frontend/src/app/pages/Goals.tsx` |
| CREATE | `frontend/src/hooks/usePrivacy.tsx` |
| CREATE | `frontend/src/app/components/PrivacyAmount.tsx` |
| MODIFY | `frontend/src/styles/index.css` |
| MODIFY | `frontend/src/app/pages/Overview.tsx` |
| MODIFY | `frontend/src/app/pages/Riwayat.tsx` |
| MODIFY | `frontend/src/app/pages/Budget.tsx` (PrivacyAmount) |
| MODIFY | `frontend/src/app/pages/Goals.tsx` (PrivacyAmount) |
| CREATE | `frontend/src/lib/copy.ts` |
| MODIFY | `services/formatter.py` |
| MODIFY | `frontend/src/lib/supabase.ts` (Wallet, SplitBill, Subscription types — needed by later batches) |

---

## Task 1: DB Migration

**Files:**
- Create: `db/migration_major_update_1.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- db/migration_major_update_1.sql
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── Fitur 2: Google auth columns ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

-- ── Fitur 5: Gajian / Risk profile ────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS payday_date INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_budget_recommendation JSONB;

-- ── Fitur 10: Subscription ────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'gratis';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ── Fitur 6: Wallets ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash')),
  icon TEXT,
  is_primary BOOLEAN DEFAULT false,
  initial_balance NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- ── Fitur 1: Split Bills ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  participants JSONB NOT NULL,
  items JSONB,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Fitur 10: Subscription audit log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('gratis', 'starter', 'pro')),
  period TEXT NOT NULL CHECK (period IN ('monthly', '3month', '6month', 'yearly')),
  price_paid NUMERIC(10,2),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_ref TEXT,
  is_active BOOLEAN DEFAULT true
);
```

- [ ] **Step 2: Run the migration in Supabase**

Open Supabase Dashboard → SQL Editor → New query → paste the file content → Run.

Expected: All statements succeed with "Success. No rows returned."

- [ ] **Step 3: Verify columns exist**

Run in Supabase SQL Editor:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('email', 'google_id', 'payday_date', 'subscription_plan');
```
Expected: 4 rows returned.

- [ ] **Step 4: Add types to supabase.ts**

In `frontend/src/lib/supabase.ts`, append after the existing `User` interface:

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

- [ ] **Step 5: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add db/migration_major_update_1.sql frontend/src/lib/supabase.ts
git commit -m "feat(db): add migration for major update 1 — wallets, split_bills, subscriptions, user columns"
```

---

## Task 2: Fix Google Login

**Files:**
- Modify: `frontend/src/app/pages/AuthCallback.tsx`
- Modify: `frontend/src/hooks/useAuth.tsx`

The bug: `google_id` and `email` columns didn't exist yet (fixed by Task 1). Additionally, AuthCallback only queries by `google_id` with no `email` fallback for users who linked before `google_id` column was added. `RequireAuth` also doesn't check an active Supabase session as fallback.

- [ ] **Step 1: Fix AuthCallback — add email fallback**

Replace the entire content of `frontend/src/app/pages/AuthCallback.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'gajian_aman_user';
const PENDING_KEY = 'gajian_aman_pending_google';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Menghubungkan akun Google...');

  useEffect(() => {
    async function handle() {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setStatus('Login gagal. Kembali ke halaman login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      const googleId = session.user.id;
      const email = session.user.email ?? '';

      // Try by google_id first
      let { data: linked } = await supabase
        .from('users')
        .select('user_id, name, username')
        .eq('google_id', googleId)
        .maybeSingle();

      // Fallback: try by email (covers users who linked before google_id column existed)
      if (!linked && email) {
        const { data: byEmail } = await supabase
          .from('users')
          .select('user_id, name, username')
          .eq('email', email)
          .maybeSingle();
        linked = byEmail;

        // Backfill google_id so future lookups use the fast path
        if (linked) {
          await supabase
            .from('users')
            .update({ google_id: googleId })
            .eq('user_id', linked.user_id);
        }
      }

      if (linked) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          userId: linked.user_id,
          name: linked.name ?? linked.username ?? email,
          email,
        }));
        navigate('/overview', { replace: true });
        return;
      }

      // First time — store pending session and ask to link Telegram ID
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({
        googleId,
        email,
        name: session.user.user_metadata?.full_name ?? '',
      }));
      setStatus('Akun baru. Menghubungkan ke Telegram...');
      navigate('/link-telegram', { replace: true });
    }

    handle();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-muted-foreground">{status}</p>
    </div>
  );
}
```

- [ ] **Step 2: Fix RequireAuth — check Supabase session as fallback**

In `frontend/src/hooks/useAuth.tsx`, replace the `AuthProvider` `useEffect` and `RequireAuth`:

```typescript
// Replace the useEffect in AuthProvider (lines 39-42) with:
useEffect(() => {
  async function init() {
    // Primary: localStorage (Telegram login or already-resolved Google login)
    const stored = resolveUserFromStorage();
    if (stored) {
      setUser(stored);
      setIsLoading(false);
      return;
    }

    // Fallback: active Supabase session (Google OAuth in same browser)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: found } = await supabase
        .from('users')
        .select('user_id, name, username, email')
        .or(`google_id.eq.${session.user.id},email.eq.${session.user.email ?? ''}`)
        .maybeSingle();
      if (found) {
        setAndPersist({
          userId: found.user_id,
          name: found.name ?? found.username ?? session.user.email ?? 'User',
          email: found.email ?? session.user.email ?? undefined,
        });
      }
    }
    setIsLoading(false);
  }
  init();
}, [resolveUserFromStorage]);
```

- [ ] **Step 3: Fix LinkTelegram — navigate to /overview after linking**

In `frontend/src/app/pages/LinkTelegram.tsx`, change the two `navigate('/', ...)` calls to `navigate('/overview', ...)`:

Line 99: `navigate('/', { replace: true });` → `navigate('/overview', { replace: true });`
Line 167: `navigate('/login')` → stays as `/login` (this one is correct)

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/AuthCallback.tsx frontend/src/hooks/useAuth.tsx frontend/src/app/pages/LinkTelegram.tsx
git commit -m "fix(auth): add email fallback to Google login + Supabase session check in RequireAuth"
```

---

## Task 3: Routing Update — /overview + Layout nav

**Files:**
- Modify: `frontend/src/app/App.tsx`
- Modify: `frontend/src/app/components/Layout.tsx`

This is one atomic commit: moving Overview from `index` to `/overview` and adding new nav items. Must be done together to avoid broken links.

- [ ] **Step 1: Update App.tsx routing**

Replace the entire content of `frontend/src/app/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { AuthProvider, RequireAuth, useAuth } from '@/hooks/useAuth';
import { MonthFilterProvider } from '@/hooks/useMonthFilter';
import { PrivacyProvider } from '@/hooks/usePrivacy';
import Overview from './pages/Overview';
import Pengeluaran from './pages/Pengeluaran';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Riwayat from './pages/Riwayat';
import Tren from './pages/Tren';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import LinkTelegram from './pages/LinkTelegram';

// Smart home: landing page for guests, redirect to /overview for authenticated users
function SmartHome() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/overview" replace />;
  // Landing page will be added in Batch C — for now redirect to login
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrivacyProvider>
          <MonthFilterProvider>
            <Routes>
              {/* Smart home */}
              <Route path="/" element={<SmartHome />} />

              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/link-telegram" element={<LinkTelegram />} />

              {/* Protected routes */}
              <Route
                element={
                  <RequireAuth>
                    <Layout />
                  </RequireAuth>
                }
              >
                <Route path="/overview" element={<Overview />} />
                <Route path="/pengeluaran" element={<Pengeluaran />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/riwayat" element={<Riwayat />} />
                <Route path="/tren" element={<Tren />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-center" richColors />
          </MonthFilterProvider>
        </PrivacyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

Note: `PrivacyProvider` import will resolve once Task 5 creates the file.

- [ ] **Step 2: Update Layout.tsx nav items**

In `frontend/src/app/components/Layout.tsx`, replace the `navItems` array (lines 33-40):

```typescript
import {
  Home, TrendingDown, Target, Star, History, TrendingUp,
  LogOut, Bell, Plus, Menu, X,
  Calendar, Users, Wallet, Crown, Zap, Eye, EyeOff,
} from 'lucide-react';

const navItems = [
  { icon: Home,        label: 'Overview',     path: '/overview' },
  { icon: TrendingDown,label: 'Pengeluaran',  path: '/pengeluaran' },
  { icon: Target,      label: 'Budget',       path: '/budget' },
  { icon: Star,        label: 'Goals',        path: '/goals' },
  { icon: History,     label: 'Riwayat',      path: '/riwayat' },
  { icon: TrendingUp,  label: 'Tren',         path: '/tren' },
  { icon: Calendar,    label: 'Kalender',     path: '/kalender' },
  { icon: Users,       label: 'Split Bill',   path: '/split' },
  { icon: Zap,         label: 'Gajian',       path: '/gajian' },
  { icon: Wallet,      label: 'Dompet',       path: '/wallet' },
  { icon: Crown,       label: 'Langganan',    path: '/langganan' },
];
```

- [ ] **Step 3: Add privacy eye icon to desktop header in Layout.tsx**

In the desktop top bar `<header>` div (around line 229), inside the `flex items-center gap-4` div that contains the month select, add the privacy toggle button. Import `usePrivacy` at the top of the file:

```typescript
import { usePrivacy } from '@/hooks/usePrivacy';
```

Inside `Layout()`, add after `const { user, logout } = useAuth();`:
```typescript
const { isHidden, toggle } = usePrivacy();
```

Add eye toggle button before the Bell button in the desktop header:
```typescript
<Button variant="ghost" size="icon" onClick={toggle} title={isHidden ? 'Tampilkan angka' : 'Sembunyikan angka'}>
  {isHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
</Button>
```

- [ ] **Step 4: Fix the page title in Layout.tsx desktop header**

The desktop header currently uses `navItems.find((item) => item.path === location.pathname)?.label` — this still works since the paths match. No change needed.

- [ ] **Step 5: Type-check and build**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```

Expected: Errors only for `usePrivacy` import (not created yet — that's Task 5). The import will be resolved then. For now, to test this task alone, temporarily comment out the `PrivacyProvider` import in `App.tsx` and `usePrivacy` in `Layout.tsx`.

- [ ] **Step 6: Commit (after Task 5 is done — defer this commit)**

This commit is deferred until after Task 5 creates `usePrivacy.tsx`. Then commit together:
```bash
git add frontend/src/app/App.tsx frontend/src/app/components/Layout.tsx
git commit -m "feat(routing): move Overview to /overview, add new nav items, add privacy toggle"
```

---

## Task 4: Fix Budget "Belum Dibuat"

**Files:**
- Modify: `frontend/src/app/pages/Budget.tsx`

- [ ] **Step 1: Update `budgetRows` logic to include "Belum Dibuat" state**

In `Budget.tsx`, find the `budgetRows` useMemo (around line 101). Replace the entire useMemo:

```typescript
const budgetRows = useMemo(() => {
  return allCats
    .map((cat) => {
      const budgetEntry = budgets.find((b) => b.category === cat);
      const hasEntry = budgetEntry !== undefined;
      const budgetAmt = budgetEntry?.amount ?? 0;
      const spent = spendingMap[cat] ?? 0;
      const pct = budgetAmt > 0 ? (spent / budgetAmt) * 100 : 0;
      return {
        category: cat,
        budget: budgetAmt,
        spent,
        pct,
        hasEntry,
        status: hasEntry ? getStatus(pct) : ('none' as const),
        ...getCatMeta(cat),
      };
    })
    // Show categories that have a budget entry OR have spending this month
    // Always show all ALL_CATEGORIES entries (even with no spending and no budget)
    .sort((a, b) => {
      // Sort: has budget first, then by spending desc
      if (a.hasEntry && !b.hasEntry) return -1;
      if (!a.hasEntry && b.hasEntry) return 1;
      return b.spent - a.spent;
    });
}, [allCats, budgets, spendingMap]);
```

- [ ] **Step 2: Update `BudgetStatus` type and `StatusBadge` to handle 'none'**

Find `type BudgetStatus` and replace:
```typescript
type BudgetStatus = 'safe' | 'warning' | 'over' | 'none';
```

Find `StatusBadge` component and replace:
```typescript
function StatusBadge({ status }: { status: BudgetStatus }) {
  if (status === 'none')
    return (
      <Badge className="bg-gray-100 text-gray-500 gap-1">
        Belum Dibuat
      </Badge>
    );
  if (status === 'over')
    return (
      <Badge className="bg-red-100 text-red-700 gap-1">
        <AlertCircle className="w-3 h-3" /> Melebihi
      </Badge>
    );
  if (status === 'warning')
    return (
      <Badge className="bg-yellow-100 text-yellow-700 gap-1">
        <AlertTriangle className="w-3 h-3" /> Hampir
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-700 gap-1">
      <CheckCircle className="w-3 h-3" /> Aman
    </Badge>
  );
}
```

- [ ] **Step 3: Update the budget row render to hide progress bar when status is 'none'**

In the JSX where each budget row is rendered (find where `pct` and `Progress` are used), wrap the Progress bar and realized amount with a `hasEntry` condition. Find the budget row render (search for `<Progress` in Budget.tsx) and add:

```typescript
// Before rendering Progress bar for each row, check hasEntry:
{row.hasEntry ? (
  <>
    <Progress value={row.pct} className="h-2" />
    <div className="flex justify-between text-xs text-muted-foreground mt-1">
      <span>Terpakai: {formatRupiah(row.spent)}</span>
      <span>{row.pct.toFixed(0)}%</span>
    </div>
  </>
) : (
  <Button
    variant="outline"
    size="sm"
    className="w-full mt-2 text-xs h-7"
    onClick={() => openEdit(row.category, 0)}
  >
    <Plus className="w-3 h-3 mr-1" /> Buat Budget
  </Button>
)}
```

- [ ] **Step 4: Update summary counts — exclude 'none' from safeCount**

Find `const safeCount` and update:
```typescript
const safeCount = budgetRows.filter((r) => r.hasEntry && r.status === 'safe').length;
const budgetedCount = budgetRows.filter((r) => r.hasEntry).length;
```

- [ ] **Step 5: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/pages/Budget.tsx
git commit -m "fix(budget): show 'Belum Dibuat' state for unbudgeted categories"
```

---

## Task 5: Goals — Daily Savings Calculation

**Files:**
- Modify: `frontend/src/app/pages/Goals.tsx`

- [ ] **Step 1: Add daily savings calculation to GoalCard**

In `Goals.tsx`, find the `GoalCard` component. After the existing `const pct = ...` line, add:

```typescript
// Daily savings calculation
const today = new Date();
today.setHours(0, 0, 0, 0);
const deadline = goal.deadline ? (() => { const d = new Date(goal.deadline); d.setHours(0, 0, 0, 0); return d; })() : null;
const gap = Math.max(0, target - saved);
const daysLeft = deadline ? Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000)) : null;
const perDay = daysLeft !== null && daysLeft > 0 && gap > 0
  ? Math.ceil(gap / daysLeft)
  : null;
const deadlinePassed = deadline !== null && deadline < today && gap > 0;
```

- [ ] **Step 2: Add daily savings display below the progress bar**

In `GoalCard` JSX, after the `</div>` that closes the progress bar section (after the `{pct.toFixed(1)}%` line), add:

```typescript
{/* Daily savings info */}
{gap <= 0 ? (
  <p className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
    ✅ Target tercapai!
  </p>
) : deadlinePassed ? (
  <p className="text-xs text-red-500 font-medium flex items-center gap-1 mt-1">
    ⚠️ Deadline terlewat
  </p>
) : perDay !== null && daysLeft !== null ? (
  <div className="flex items-center justify-between text-xs mt-1">
    <span className="text-muted-foreground">📅 {daysLeft} hari lagi</span>
    <span
      className={
        perDay > 500_000
          ? 'text-red-500 font-semibold'
          : perDay <= 50_000
          ? 'text-green-600 font-semibold'
          : 'text-muted-foreground font-medium'
      }
    >
      💰 {formatRupiah(perDay)}/hari
    </span>
  </div>
) : null}
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/Goals.tsx
git commit -m "feat(goals): add daily savings calculation below progress bar"
```

---

## Task 6: Privacy Mode — Context + Component + CSS

**Files:**
- Create: `frontend/src/hooks/usePrivacy.tsx`
- Create: `frontend/src/app/components/PrivacyAmount.tsx`
- Modify: `frontend/src/styles/index.css`

- [ ] **Step 1: Create `usePrivacy.tsx`**

Create `frontend/src/hooks/usePrivacy.tsx`:

```typescript
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface PrivacyContextValue {
  isHidden: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyContextValue | null>(null);

const STORAGE_KEY = 'gajian_aman_privacy';

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isHidden));
  }, [isHidden]);

  const toggle = () => setIsHidden((prev) => !prev);

  return (
    <PrivacyContext.Provider value={{ isHidden, toggle }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error('usePrivacy must be used inside PrivacyProvider');
  return ctx;
}
```

- [ ] **Step 2: Create `PrivacyAmount.tsx`**

Create `frontend/src/app/components/PrivacyAmount.tsx`:

```typescript
import { usePrivacy } from '@/hooks/usePrivacy';
import { cn } from '@/lib/utils';

interface PrivacyAmountProps {
  value: string;
  className?: string;
}

export function PrivacyAmount({ value, className }: PrivacyAmountProps) {
  const { isHidden } = usePrivacy();
  return (
    <span className={cn(isHidden && 'privacy-hidden', className)}>
      {value}
    </span>
  );
}
```

- [ ] **Step 3: Add privacy CSS to index.css**

In `frontend/src/styles/index.css`, append:

```css
/* Privacy mode — blur sensitive numbers */
.privacy-hidden {
  filter: blur(8px);
  user-select: none;
  pointer-events: none;
  transition: filter 0.2s ease;
}

.privacy-hidden:hover {
  filter: blur(4px);
}
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors (PrivacyProvider import in App.tsx now resolves).

- [ ] **Step 5: Commit Tasks 3+6 together (since App.tsx depends on usePrivacy)**

```bash
git add frontend/src/hooks/usePrivacy.tsx frontend/src/app/components/PrivacyAmount.tsx frontend/src/styles/index.css frontend/src/app/App.tsx frontend/src/app/components/Layout.tsx
git commit -m "feat(privacy): add privacy mode — blur toggle for sensitive numbers"
```

---

## Task 7: Apply PrivacyAmount to Pages

**Files:**
- Modify: `frontend/src/app/pages/Overview.tsx`
- Modify: `frontend/src/app/pages/Budget.tsx`
- Modify: `frontend/src/app/pages/Goals.tsx`
- Modify: `frontend/src/app/pages/Riwayat.tsx`

- [ ] **Step 1: Apply PrivacyAmount to Overview.tsx**

In `frontend/src/app/pages/Overview.tsx`, add import at top:
```typescript
import { PrivacyAmount } from '../components/PrivacyAmount';
```

Find every `formatRupiah(...)` call that renders a currency total visible to the user (total income, total expense, net balance, category amounts) and wrap with `<PrivacyAmount value={formatRupiah(...)} />`.

Example pattern — find:
```typescript
<p className="...font-mono...">{formatRupiah(totalIncome)}</p>
```
Replace with:
```typescript
<p className="...font-mono..."><PrivacyAmount value={formatRupiah(totalIncome)} /></p>
```

Apply to: total income card, total expense card, net balance card, and any per-category amounts in charts or lists.

- [ ] **Step 2: Apply PrivacyAmount to Budget.tsx**

Add import:
```typescript
import { PrivacyAmount } from '../components/PrivacyAmount';
```

Wrap `formatRupiah(row.budget)`, `formatRupiah(row.spent)`, `formatRupiah(totalBudget)`, `formatRupiah(totalUsed)`, `formatRupiah(remaining)` with `<PrivacyAmount value={formatRupiah(...)} />`.

- [ ] **Step 3: Apply PrivacyAmount to Goals.tsx**

Add import:
```typescript
import { PrivacyAmount } from '../components/PrivacyAmount';
```

Wrap `formatRupiah(saved)`, `formatRupiah(target)`, `formatRupiah(perDay)` with `<PrivacyAmount value={formatRupiah(...)} />`.

- [ ] **Step 4: Apply PrivacyAmount to Riwayat.tsx**

Add import:
```typescript
import { PrivacyAmount } from '../components/PrivacyAmount';
```

Wrap the `amount` field in the transaction list rows with `<PrivacyAmount value={formatRupiah(Number(t.amount))} />`.

- [ ] **Step 5: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/pages/Overview.tsx frontend/src/app/pages/Budget.tsx frontend/src/app/pages/Goals.tsx frontend/src/app/pages/Riwayat.tsx
git commit -m "feat(privacy): apply PrivacyAmount blur to all currency displays"
```

---

## Task 8: Copywriting Revamp

**Files:**
- Create: `frontend/src/lib/copy.ts`
- Modify: `services/formatter.py`

- [ ] **Step 1: Create `frontend/src/lib/copy.ts`**

```typescript
export const COPY = {
  emptyStates: {
    transactions: 'Belum ada transaksi. Yuk catat yang pertama!',
    budget: 'Budget belum dibuat. Atur sekarang biar keuangan lebih terarah.',
    goals: 'Belum ada goals. Mulai tentukan target finansialmu!',
    wallets: 'Belum ada wallet. Tambah sumber dana kamu dulu ya.',
    splitBill: 'Belum ada sesi split bill. Yuk mulai yang pertama!',
    history: 'Belum ada riwayat transaksi bulan ini.',
  },
  success: {
    transactionAdded: '✅ Transaksi berhasil dicatat!',
    budgetSaved: 'Budget disimpan. Semangat nabung!',
    goalCreated: 'Goal baru dibuat. You got this! 💪',
    walletCreated: 'Wallet berhasil ditambahkan!',
    splitBillCreated: 'Split bill berhasil dibuat. Bagikan linknya ke temen-temen!',
    goalFunded: (name: string, amount: string) => `+${amount} ditambahkan ke "${name}" 🎉`,
  },
  errors: {
    generic: 'Ups, ada yang error nih. Coba lagi ya.',
    noConnection: 'Koneksi terputus. Cek internet kamu dulu.',
    sessionExpired: 'Sesimu habis. Login lagi yuk.',
    invalidAmount: 'Nominalnya gak valid nih. Coba isi lagi ya.',
    notFound: 'Data tidak ditemukan.',
  },
  labels: {
    income: 'Pemasukan',
    expense: 'Pengeluaran',
    savings: 'Tabungan',
    budget: 'Anggaran',
    remaining: 'Sisa',
    spent: 'Terpakai',
    overview: 'Ringkasan',
    history: 'Riwayat',
    trends: 'Tren',
    goals: 'Tujuan',
    calendar: 'Kalender',
    splitBill: 'Split Bill',
    payday: 'Gajian',
    wallet: 'Dompet',
    subscription: 'Langganan',
    save: 'Simpan',
    cancel: 'Batal',
    add: 'Tambah',
    edit: 'Edit',
    delete: 'Hapus',
  },
  status: {
    safe: 'Aman',
    warning: 'Hampir',
    over: 'Melebihi',
    notSet: 'Belum Dibuat',
    achieved: 'Tercapai 🎉',
    inProgress: 'Jalan terus',
    deadlinePassed: 'Deadline Terlewat',
  },
} as const;
```

- [ ] **Step 2: Update `services/formatter.py` — revamp tone + add new functions**

Add these new functions to the bottom of `services/formatter.py`:

```python
def fmt_transaction_added(amount: float, category: str, currency: str = "IDR") -> str:
    icon = category_icon(category)
    return (
        f"✅ Catat! Pengeluaran {fmt_currency(amount, currency)} "
        f"untuk {icon} {category} udah masuk ya."
    )


def fmt_income_added(amount: float, category: str, currency: str = "IDR") -> str:
    return (
        f"💚 Mantap! Pemasukan {fmt_currency(amount, currency)} "
        f"dari {category} berhasil dicatat."
    )


def fmt_invalid_amount() -> str:
    return (
        "Hmm, nominalnya gak kebaca nih 😅 Coba ketik ulang ya.\n"
        "Contoh: /add 25000 makan siang"
    )


def fmt_no_transactions() -> str:
    return "Belum ada catatan bulan ini. Yuk mulai catat pengeluaran pertamamu!"


def fmt_budget_warning(category: str, pct: float) -> str:
    return (
        f"⚠️ Ups! Budget {category}-mu udah mepet nih "
        f"({pct:.0f}% terpakai). Saatnya rem dikit?"
    )


def fmt_budget_over(category: str, pct: float) -> str:
    return (
        f"🔴 Aduh! Budget {category} udah kelewat nih "
        f"({pct:.0f}% terpakai). Hati-hati ya pengeluarannya!"
    )


def fmt_payday_reminder() -> str:
    return (
        "💰 Hei! Hari ini hari gajian kan? Jangan lupa catat income-mu "
        "biar keuangan makin terpantau!\n\n"
        "Ketik: /income [jumlah] gaji [bulan ini]\n"
        "Contoh: /income 5000000 gaji bulan ini"
    )


def fmt_wallet_list(wallets: list, currency: str = "IDR") -> str:
    if not wallets:
        return (
            "Kamu belum punya wallet nih. "
            "Ketik /wallet setup untuk tambah wallet pertamamu!"
        )
    lines = ["👜 *Daftar Wallet kamu:*\n"]
    for w in wallets:
        primary = " ⭐" if w.get('is_primary') else ""
        balance = fmt_currency(w.get('balance', 0), currency)
        lines.append(f"  • *{w['name']}*{primary} — {balance}")
    return "\n".join(lines)


def fmt_splitbill_result(session_name: str, participants: list, share_url: str, currency: str = "IDR") -> str:
    lines = [f"🍽️ *Split Bill: {session_name}*\n"]
    for p in participants:
        lines.append(f"  • {p['name']}: {fmt_currency(p['amount'], currency)}")
    lines.append(f"\n🔗 Link share: {share_url}")
    return "\n".join(lines)


def fmt_goal_reminder(goal_name: str, per_day: float, deadline: str, currency: str = "IDR") -> str:
    return (
        f"🎯 Update goal *{goal_name}*: kamu butuh nabung "
        f"{fmt_currency(per_day, currency)}/hari biar bisa tercapai sebelum {deadline}!"
    )


def fmt_weekly_summary(user_name: str, total_expense: float, currency: str = "IDR") -> str:
    return (
        f"📊 Rekap Mingguan kamu udah siap, {user_name}! "
        f"Minggu ini kamu habis {fmt_currency(total_expense, currency)} total."
    )
```

- [ ] **Step 3: Type-check and import test**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
python -c "from services.formatter import fmt_transaction_added; print(fmt_transaction_added(25000, 'Food & Dining'))"
```
Expected frontend: No errors. Expected Python: `✅ Catat! Pengeluaran Rp 25.000 untuk 🍜 Food & Dining udah masuk ya.`

- [ ] **Step 4: Update existing pages to use COPY strings**

In `frontend/src/app/pages/Riwayat.tsx`, find the empty state message and replace with:
```typescript
import { COPY } from '@/lib/copy';
// ...
// Find empty state text and replace:
{transactions.length === 0 && <p className="text-muted-foreground text-center py-12">{COPY.emptyStates.history}</p>}
```

In `frontend/src/app/pages/Goals.tsx`, update the empty state:
```typescript
import { COPY } from '@/lib/copy';
// Find "Belum ada goals" or equivalent and replace with COPY.emptyStates.goals
```

In `frontend/src/app/pages/Budget.tsx`, update any empty state or error strings to use COPY.

In `frontend/src/app/components/TransactionModal.tsx`, update `toast.success('Transaksi berhasil disimpan!')` to `toast.success(COPY.success.transactionAdded)`.

- [ ] **Step 5: Final type-check and build**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build
```
Expected: No errors, successful build.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/copy.ts services/formatter.py frontend/src/app/pages/Riwayat.tsx frontend/src/app/pages/Goals.tsx frontend/src/app/pages/Budget.tsx frontend/src/app/components/TransactionModal.tsx
git commit -m "feat(copy): add COPY object and revamp formatter.py to casual Indonesian tone"
```

---

## Batch A Complete ✅

Verify the full build passes:
```bash
cd frontend && npm run build
```
Expected: Successful build, no TypeScript errors.

All 5 features delivered:
- ✅ Google login fix (email fallback + Supabase session check)
- ✅ Budget "Belum Dibuat" state
- ✅ Goals daily savings calculation
- ✅ Privacy mode (blur toggle)
- ✅ Copywriting revamp (copy.ts + formatter.py)
