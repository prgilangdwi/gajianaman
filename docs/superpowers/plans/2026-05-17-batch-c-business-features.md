# Batch C — Business Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add subscription system with plan-based gating (MVP_OVERRIDE=True, all features free for now) and a landing page at `/` for unauthenticated users.

**Architecture:** `services/subscription.py` holds all plan logic with a single `MVP_OVERRIDE = True` flag — flipping it to `False` activates real gating everywhere with zero other code changes. `Langganan.tsx` shows the pricing UI and manual transfer instructions. `Landing.tsx` replaces the `/` redirect for unauthenticated users. `useSubscription` hook exposes `canAccess(feature)` for optional gating hints in the UI.

**Prerequisites:** Batch A complete (DB migration run, routing updated).

**Tech Stack:** React 18 + TypeScript, Supabase JS, Tailwind CSS v4, shadcn/ui (Accordion), Python (services/), python-telegram-bot v20

---

## File Map

| Action | File |
|---|---|
| CREATE | `services/subscription.py` |
| MODIFY | `db/operations.py` |
| CREATE | `frontend/src/hooks/useSubscription.ts` |
| CREATE | `frontend/src/app/pages/Langganan.tsx` |
| CREATE | `frontend/src/app/pages/Landing.tsx` |
| MODIFY | `frontend/src/app/App.tsx` |

---

## Task 1: Subscription Service (Python)

**Files:**
- Create: `services/subscription.py`
- Modify: `db/operations.py`

- [ ] **Step 1: Create `services/subscription.py`**

Create `services/subscription.py`:

```python
# services/subscription.py
# Plan-based feature gating with MVP override.
# To activate real gating when Midtrans is live: set MVP_OVERRIDE = False

from __future__ import annotations
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

MVP_OVERRIDE = True  # All features free while payment is not set up

PLAN_FEATURES: dict[str, dict[str, object]] = {
    'gratis': {
        'max_wallets': 0,
        'split_bill_monthly': 0,
        'ai_features': False,
        'download_csv': False,
        'budget_categories': 3,
        'calendar': False,
    },
    'starter': {
        'max_wallets': 3,
        'split_bill_monthly': 5,
        'ai_features': True,
        'download_csv': True,
        'budget_categories': -1,  # unlimited
        'calendar': True,
    },
    'pro': {
        'max_wallets': -1,
        'split_bill_monthly': -1,
        'ai_features': True,
        'download_csv': True,
        'budget_categories': -1,
        'calendar': True,
    },
}


async def get_user_plan(session: AsyncSession, user_id: int) -> str:
    result = await session.execute(
        text("SELECT subscription_plan FROM users WHERE user_id = :uid"),
        {"uid": user_id}
    )
    row = result.fetchone()
    return (row[0] if row else None) or 'gratis'


async def check_feature_access(session: AsyncSession, user_id: int, feature: str) -> bool:
    """Returns True if the user can access the feature.

    While MVP_OVERRIDE is True, always returns True regardless of plan.
    """
    if MVP_OVERRIDE:
        return True
    plan = await get_user_plan(session, user_id)
    features = PLAN_FEATURES.get(plan, PLAN_FEATURES['gratis'])
    value = features.get(feature, False)
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return value != 0  # -1 = unlimited, 0 = blocked, N = limited
    return False


def get_plan_limit(plan: str, feature: str) -> object:
    """Get the raw limit value for a feature. -1 means unlimited, 0 means blocked."""
    return PLAN_FEATURES.get(plan, PLAN_FEATURES['gratis']).get(feature, 0)
```

- [ ] **Step 2: Add subscription DB operation to db/operations.py**

At the bottom of `db/operations.py`, add:

```python
# ── Subscription operations ───────────────────────────────────────────────────

async def get_user_subscription_plan(session: AsyncSession, user_id: int) -> str:
    result = await session.execute(
        text("SELECT subscription_plan FROM users WHERE user_id = :uid"),
        {"uid": user_id}
    )
    row = result.fetchone()
    return (row[0] if row else None) or 'gratis'


async def update_user_subscription(
    session: AsyncSession,
    user_id: int,
    plan: str,
    expires_at: str  # ISO datetime string
) -> None:
    await session.execute(
        text("""
            UPDATE users
            SET subscription_plan = :plan, subscription_expires_at = :expires
            WHERE user_id = :uid
        """),
        {"plan": plan, "expires": expires_at, "uid": user_id}
    )
    await session.commit()


async def create_subscription_record(
    session: AsyncSession,
    user_id: int,
    plan: str,
    period: str,
    price_paid: float,
    expires_at: str,
    payment_ref: str | None = None
) -> dict:
    result = await session.execute(
        text("""
            INSERT INTO subscriptions (user_id, plan, period, price_paid, expires_at, payment_ref)
            VALUES (:uid, :plan, :period, :price, :expires, :ref)
            RETURNING id, plan, period, started_at, expires_at
        """),
        {"uid": user_id, "plan": plan, "period": period,
         "price": price_paid, "expires": expires_at, "ref": payment_ref}
    )
    await session.commit()
    return dict(result.fetchone()._mapping)
```

- [ ] **Step 3: Verify imports**

```bash
python -c "from services.subscription import check_feature_access, MVP_OVERRIDE; print('MVP_OVERRIDE:', MVP_OVERRIDE)"
```
Expected: `MVP_OVERRIDE: True`

- [ ] **Step 4: Commit**

```bash
git add services/subscription.py db/operations.py
git commit -m "feat(subscription): add subscription.py service with MVP_OVERRIDE + DB operations"
```

---

## Task 2: useSubscription Hook

**Files:**
- Create: `frontend/src/hooks/useSubscription.ts`

- [ ] **Step 1: Create `useSubscription.ts`**

Create `frontend/src/hooks/useSubscription.ts`:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Mirror of Python PLAN_FEATURES — keep in sync with services/subscription.py
const PLAN_FEATURES: Record<string, Record<string, boolean | number>> = {
  gratis: {
    max_wallets: 0,
    split_bill_monthly: 0,
    ai_features: false,
    download_csv: false,
    budget_categories: 3,
    calendar: false,
  },
  starter: {
    max_wallets: 3,
    split_bill_monthly: 5,
    ai_features: true,
    download_csv: true,
    budget_categories: -1,
    calendar: true,
  },
  pro: {
    max_wallets: -1,
    split_bill_monthly: -1,
    ai_features: true,
    download_csv: true,
    budget_categories: -1,
    calendar: true,
  },
};

// Set to false when Midtrans is live and real gating should activate
const MVP_OVERRIDE = true;

export type PlanName = 'gratis' | 'starter' | 'pro';

export interface SubscriptionState {
  plan: PlanName;
  expiresAt: string | null;
  isLoading: boolean;
  /** Returns true if user can access this feature (always true while MVP_OVERRIDE) */
  canAccess: (feature: string) => boolean;
  /** Returns raw limit: -1 = unlimited, 0 = blocked, N = capped */
  getLimit: (feature: string) => number | boolean;
}

export function useSubscription(userId: number | undefined): SubscriptionState {
  const [plan, setPlan] = useState<PlanName>('gratis');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    supabase
      .from('users')
      .select('subscription_plan, subscription_expires_at')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPlan((data.subscription_plan as PlanName) ?? 'gratis');
          setExpiresAt(data.subscription_expires_at ?? null);
        }
        setIsLoading(false);
      });
  }, [userId]);

  const canAccess = (feature: string): boolean => {
    if (MVP_OVERRIDE) return true;
    const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.gratis;
    const val = features[feature];
    if (typeof val === 'boolean') return val;
    if (typeof val === 'number') return val !== 0;
    return false;
  };

  const getLimit = (feature: string): number | boolean => {
    const features = PLAN_FEATURES[plan] ?? PLAN_FEATURES.gratis;
    return features[feature] ?? false;
  };

  return { plan, expiresAt, isLoading, canAccess, getLimit };
}
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useSubscription.ts
git commit -m "feat(subscription): add useSubscription hook with MVP_OVERRIDE pattern"
```

---

## Task 3: Langganan Page

**Files:**
- Create: `frontend/src/app/pages/Langganan.tsx`
- Modify: `frontend/src/app/App.tsx`

- [ ] **Step 1: Create `Langganan.tsx`**

Create `frontend/src/app/pages/Langganan.tsx`:

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

type Period = 'monthly' | '3month' | '6month' | 'yearly';

const PRICES: Record<string, Record<Period, number>> = {
  starter: { monthly: 9_900, '3month': 27_000, '6month': 49_000, yearly: 89_000 },
  pro:     { monthly: 19_900, '3month': 54_000, '6month': 99_000, yearly: 169_000 },
};

const PERIOD_LABELS: Record<Period, string> = {
  monthly: '1 Bulan',
  '3month': '3 Bulan',
  '6month': '6 Bulan',
  yearly: '1 Tahun',
};

const PERIOD_MONTHS: Record<Period, number> = {
  monthly: 1, '3month': 3, '6month': 6, yearly: 12,
};

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

const FEATURES = {
  gratis: [
    'Catat transaksi (unlimited)',
    'Dashboard dasar: Overview, Riwayat',
    'Budget 3 kategori',
    'Tidak ada fitur AI',
  ],
  starter: [
    'Semua fitur Gratis',
    'Wallet tracking (maks 3)',
    'Budget semua kategori',
    'Kalender heatmap',
    'Download CSV',
    'Split bill (maks 5/bulan)',
    'AI: scan struk',
    'Laporan PDF',
  ],
  pro: [
    'Semua fitur Starter',
    'Wallet unlimited',
    'Split bill unlimited',
    'AI Budget Recommendation',
    'Risk Profile + Gajian fitur',
    'Priority support',
  ],
};

interface PaymentModalProps {
  plan: 'starter' | 'pro';
  period: Period;
  userId: number;
  onClose: () => void;
}

function PaymentModal({ plan, period, userId, onClose }: PaymentModalProps) {
  const price = PRICES[plan][period];
  const ref = `GA-${userId}-${plan}-${period}`.toUpperCase();
  const planLabel = plan === 'starter' ? 'Starter' : 'Pro';

  return (
    <DialogContent className="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>Upgrade ke {planLabel}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{planLabel} — {PERIOD_LABELS[period]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-primary text-lg">{formatRp(price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kode Transfer</span>
            <span className="font-mono font-bold">{ref}</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-semibold">Transfer ke:</p>
          <div className="bg-muted rounded-lg p-3 space-y-1 font-mono">
            <p>Bank BCA</p>
            <p>No. Rek: <span className="font-bold">1234567890</span></p>
            <p>a.n. Gajian Aman</p>
          </div>
          <p className="text-muted-foreground text-xs">
            Sertakan kode <span className="font-semibold text-foreground">{ref}</span> di berita transfer.
            Akun akan diaktifkan dalam 1×24 jam setelah konfirmasi.
          </p>
        </div>

        <Button
          className="w-full gap-2"
          onClick={() => {
            const msg = encodeURIComponent(
              `Halo, saya sudah transfer untuk upgrade Gajian Aman.\n` +
              `Plan: ${planLabel} (${PERIOD_LABELS[period]})\n` +
              `Jumlah: ${formatRp(price)}\n` +
              `Kode: ${ref}\n` +
              `User ID: ${userId}`
            );
            window.open(`https://wa.me/628123456789?text=${msg}`, '_blank');
          }}
        >
          💬 Konfirmasi via WhatsApp
        </Button>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </DialogContent>
  );
}

export default function Langganan() {
  const { user } = useAuth();
  const { plan, expiresAt, isLoading } = useSubscription(user?.userId);
  const [period, setPeriod] = useState<Period>('monthly');
  const [upgradeTarget, setUpgradeTarget] = useState<{ plan: 'starter' | 'pro'; period: Period } | null>(null);

  const planLabel: Record<string, string> = { gratis: 'Gratis', starter: 'Starter', pro: 'Pro' };
  const planIcon: Record<string, React.ReactNode> = {
    gratis: <Zap className="w-4 h-4" />,
    starter: <Star className="w-4 h-4" />,
    pro: <Crown className="w-4 h-4" />,
  };

  const daysLeft = expiresAt
    ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000))
    : null;

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Kamu Sekarang</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              {planIcon[plan]}
            </div>
            <div>
              <p className="font-bold text-lg">{planLabel[plan]}</p>
              {expiresAt && daysLeft !== null ? (
                <p className="text-sm text-muted-foreground">Aktif sampai {new Date(expiresAt).toLocaleDateString('id-ID')} ({daysLeft} hari lagi)</p>
              ) : (
                <p className="text-sm text-muted-foreground">Tanpa batas waktu</p>
              )}
            </div>
          </div>
          {plan === 'gratis' && (
            <Badge className="bg-gray-100 text-gray-600">Gratis</Badge>
          )}
          {plan === 'starter' && (
            <Badge className="bg-blue-100 text-blue-700">Starter</Badge>
          )}
          {plan === 'pro' && (
            <Badge className="bg-yellow-100 text-yellow-700">Pro ⭐</Badge>
          )}
        </CardContent>
      </Card>

      {/* Period toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Periode:</span>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
              period === p ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Pricing cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gratis */}
        <Card className={plan === 'gratis' ? 'border-primary' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Gratis</CardTitle>
              {plan === 'gratis' && <Badge className="bg-primary/10 text-primary">Aktif</Badge>}
            </div>
            <p className="text-3xl font-bold">Rp 0</p>
            <p className="text-xs text-muted-foreground">Selamanya</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {FEATURES.gratis.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Starter */}
        <Card className={`${plan === 'starter' ? 'border-primary' : ''} relative`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Starter</CardTitle>
              {plan === 'starter' && <Badge className="bg-primary/10 text-primary">Aktif</Badge>}
            </div>
            <p className="text-3xl font-bold">{formatRp(PRICES.starter[period])}</p>
            <p className="text-xs text-muted-foreground">per {PERIOD_MONTHS[period]} bulan</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.starter.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
            {plan !== 'starter' && plan !== 'pro' && (
              <Button
                className="w-full mt-4"
                onClick={() => setUpgradeTarget({ plan: 'starter', period })}
              >
                Upgrade ke Starter
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className={`${plan === 'pro' ? 'border-primary' : 'border-yellow-400'} relative`}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-yellow-400 text-yellow-900">Most Popular</Badge>
          </div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pro</CardTitle>
              {plan === 'pro' && <Badge className="bg-primary/10 text-primary">Aktif</Badge>}
            </div>
            <p className="text-3xl font-bold">{formatRp(PRICES.pro[period])}</p>
            <p className="text-xs text-muted-foreground">per {PERIOD_MONTHS[period]} bulan</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.pro.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
            {plan !== 'pro' && (
              <Button
                className="w-full mt-4 bg-yellow-400 text-yellow-900 hover:bg-yellow-500"
                onClick={() => setUpgradeTarget({ plan: 'pro', period })}
              >
                Upgrade ke Pro
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-bold mb-4">FAQ</h2>
        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="1" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Bagaimana cara upgrade?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Pilih plan dan periode, lalu transfer sesuai instruksi dan konfirmasi via WhatsApp. Akun diaktifkan dalam 1×24 jam.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="2" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Bisa ganti plan di tengah jalan?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Bisa. Sisa waktu langganan lama akan diperhitungkan sebagai kredit untuk plan baru. Hubungi kami via WhatsApp.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="3" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Ada refund tidak?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Untuk sekarang belum ada kebijakan refund. Kamu bisa coba fitur Gratis dulu sebelum upgrade.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="4" className="border rounded-xl px-4">
            <AccordionTrigger className="text-sm font-medium">Data saya aman?</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              Ya. Data tersimpan di Supabase (infrastruktur PostgreSQL enterprise). Kami tidak menjual data kamu ke pihak ketiga.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Payment dialog */}
      {upgradeTarget && user && (
        <Dialog open onOpenChange={() => setUpgradeTarget(null)}>
          <PaymentModal
            plan={upgradeTarget.plan}
            period={upgradeTarget.period}
            userId={user.userId}
            onClose={() => setUpgradeTarget(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add /langganan route to App.tsx**

In `frontend/src/app/App.tsx`:
```typescript
import Langganan from './pages/Langganan';
// Inside protected routes:
<Route path="/langganan" element={<Langganan />} />
```

- [ ] **Step 3: Check shadcn Accordion is installed**

```bash
ls frontend/src/app/components/ui/accordion.tsx 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

If MISSING, install it:
```bash
cd frontend && npx shadcn@latest add accordion
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/Langganan.tsx frontend/src/app/App.tsx
git commit -m "feat(subscription): add Langganan page with pricing cards and manual transfer flow"
```

---

## Task 4: Landing Page

**Files:**
- Create: `frontend/src/app/pages/Landing.tsx`
- Modify: `frontend/src/app/App.tsx`

- [ ] **Step 1: Create `Landing.tsx`**

Create `frontend/src/app/pages/Landing.tsx`:

```typescript
import { useRef } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { Check, ChevronRight } from 'lucide-react';

function formatRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

const FEATURES = [
  { emoji: '📸', title: 'Scan Struk', desc: 'Upload foto struk, AI langsung parse dan catat otomatis.' },
  { emoji: '🤖', title: 'AI Kategorisasi', desc: 'Ketik bebas, AI yang kategoriin pengeluaranmu.' },
  { emoji: '💰', title: 'Split Bill', desc: 'Bagi tagihan bareng teman, share link langsung ke WhatsApp.' },
  { emoji: '📊', title: 'Laporan Bulanan', desc: 'Download laporan CSV atau ringkasan PDF tiap bulan.' },
  { emoji: '🎯', title: 'Goals & Budget', desc: 'Set target menabung dan pantau anggaran per kategori.' },
  { emoji: '👜', title: 'Multi-Wallet', desc: 'Lacak BCA, OVO, GoPay, Cash — semua dalam satu dashboard.' },
];

const STEPS = [
  { step: '1', icon: '💬', title: 'Kirim pesan ke bot Telegram', desc: '/add 25000 makan siang — sesimple itu.' },
  { step: '2', icon: '🤖', title: 'AI kategoriin otomatis', desc: 'Claude Haiku langsung tahu ini Food & Dining.' },
  { step: '3', icon: '📊', title: 'Dashboard siap', desc: 'Buka web, lihat semua laporan dan tren keuanganmu.' },
];

const COMPARISON = [
  { item: 'Setup', ga: 'Instan, pakai Telegram', spreadsheet: 'Manual buat tabel', catatan: 'Manual tulis', buku: 'Manual tulis' },
  { item: 'Kategorisasi', ga: 'AI otomatis ✅', spreadsheet: 'Manual ❌', catatan: 'Manual ❌', buku: 'Manual ❌' },
  { item: 'Laporan', ga: 'Otomatis + download ✅', spreadsheet: 'Hitung manual ❌', catatan: 'Tidak ada ❌', buku: 'Tidak ada ❌' },
  { item: 'Akses', ga: 'Telegram + Web ✅', spreadsheet: 'PC saja ⚠️', catatan: 'HP saja ⚠️', buku: 'Fisik saja ❌' },
  { item: 'Split Bill', ga: '✅', spreadsheet: '❌', catatan: '❌', buku: '❌' },
];

const PRICING = [
  {
    name: 'Gratis',
    price: 0,
    period: 'selamanya',
    badge: null,
    features: ['Catat transaksi unlimited', 'Dashboard basic', 'Budget 3 kategori'],
    cta: 'Mulai Gratis',
    ctaStyle: 'outline' as const,
  },
  {
    name: 'Starter',
    price: 9_900,
    period: '/bulan',
    badge: null,
    features: ['Semua fitur Gratis', 'Wallet tracking (3)', 'Split bill (5/bulan)', 'AI scan struk', 'Download CSV + PDF'],
    cta: 'Pilih Starter',
    ctaStyle: 'default' as const,
  },
  {
    name: 'Pro',
    price: 19_900,
    period: '/bulan',
    badge: 'Terpopuler',
    features: ['Semua fitur Starter', 'Wallet unlimited', 'Split bill unlimited', 'AI Budget Recommendation', 'Risk Profile & Gajian'],
    cta: 'Pilih Pro',
    ctaStyle: 'default' as const,
  },
];

const FAQ = [
  { q: 'Apakah Gajian Aman gratis?', a: 'Ya, ada plan Gratis tanpa batas waktu. Upgrade ke Starter atau Pro untuk fitur lebih lengkap.' },
  { q: 'Bagaimana cara mulai?', a: 'Cari bot Gajian Aman di Telegram, kirim /start, dan mulai catat. Dashboard web langsung tersedia.' },
  { q: 'Data saya aman?', a: 'Ya. Tersimpan di Supabase (PostgreSQL enterprise). Tidak dijual ke pihak ketiga.' },
  { q: 'Bisa pakai tanpa Telegram?', a: 'Untuk mencatat transaksi perlu bot Telegram. Dashboard web bisa diakses secara terpisah.' },
  { q: 'Apa itu Gajian Credits?', a: 'Tidak ada lagi! Fitur AI sekarang berbasis plan langganan, bukan kredit terpisah.' },
];

export default function Landing() {
  const howItWorksRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/light-logo.png" alt="Gajian Aman" className="w-8 h-8" />
            <span className="font-extrabold tracking-tight">Gajian Aman</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Masuk</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-primary text-primary-foreground">Coba Gratis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">
          🇮🇩 Dibuat untuk pekerja Indonesia
        </Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Udah gajian,<br />
          <span className="text-primary">tapi duit ke mana?</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Catat, pantau, dan kelola keuanganmu dari Telegram &amp; Web.
          AI yang kategoriin, kamu yang kontrol. Simple banget.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login">
            <Button size="lg" className="bg-primary text-primary-foreground gap-2 px-8">
              Coba Gratis <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Pelajari Lebih Lanjut
          </Button>
        </div>
      </section>

      {/* 2. How It Works */}
      <section ref={howItWorksRef} className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Cara Kerjanya</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <div className="text-4xl">{s.icon}</div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Fitur Unggulan</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-colors">
                <div className="text-4xl mb-3">{f.emoji}</div>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Comparison */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Yuk Bandingin</h2>
          <p className="text-center text-muted-foreground mb-12">Gajian Aman vs cara lama</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-semibold text-muted-foreground">Fitur</th>
                  <th className="py-3 px-4 font-bold text-primary">Gajian Aman</th>
                  <th className="py-3 px-4 text-muted-foreground">Spreadsheet</th>
                  <th className="py-3 px-4 text-muted-foreground">Catatan HP</th>
                  <th className="py-3 px-4 text-muted-foreground">Buku Tulis</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.item} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{row.item}</td>
                    <td className="py-3 px-4 text-center text-primary font-medium">{row.ga}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{row.spreadsheet}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{row.catatan}</td>
                    <td className="py-3 px-4 text-center text-muted-foreground">{row.buku}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Pricing */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-3">Harga</h2>
          <p className="text-center text-muted-foreground mb-12">Mulai gratis, upgrade kalau udah siap</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PRICING.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border-2 p-6 relative ${p.badge ? 'border-primary' : 'border-border'}`}
              >
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">{p.badge}</Badge>
                  </div>
                )}
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="mb-4">
                  <span className="text-3xl font-extrabold">{p.price === 0 ? 'Gratis' : formatRp(p.price)}</span>
                  {p.price > 0 && <span className="text-muted-foreground text-sm">{p.period}</span>}
                </p>
                <div className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link to="/login">
                  <Button variant={p.ctaStyle} className="w-full">{p.cta}</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Social Proof */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Kata Mereka</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Andi, 28', role: 'Software Engineer Jakarta', quote: 'Akhirnya ada apps finance yang gak ribet. Ketik di Telegram, beres.' },
              { name: 'Sari, 25', role: 'Marketing Staff Bandung', quote: 'Split bill bareng temen sekarang gak pake drama. Langsung share link!' },
              { name: 'Budi, 31', role: 'Freelancer Surabaya', quote: 'AI-nya akurat banget. Jarang salah kategoriin. Suka banget.' },
            ].map((t) => (
              <div key={t.name} className="bg-card rounded-2xl border p-6 space-y-3">
                <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
                <div>
                  <p className="font-bold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={String(i)} className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 8. CTA Footer */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-extrabold">Mulai gratis sekarang.</h2>
          <p className="text-primary-foreground/80">Gak perlu kartu kredit. Setup dalam 2 menit.</p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="gap-2 px-10">
              Mulai Sekarang <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© 2025 Gajian Aman · Dibuat dengan ❤️ untuk pekerja Indonesia</p>
        <p className="mt-1">Powered by Claude AI · Supabase · Vercel</p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Update SmartHome in App.tsx to show Landing**

In `frontend/src/app/App.tsx`, update the `SmartHome` component to import and return Landing:

```typescript
import Landing from './pages/Landing';

function SmartHome() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/overview" replace />;
  return <Landing />;
}
```

- [ ] **Step 3: Type-check and build**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build
```
Expected: No errors, successful build.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/Landing.tsx frontend/src/app/App.tsx
git commit -m "feat(landing): add landing page at / for unauthenticated users"
```

---

## Batch C Complete ✅

```bash
cd frontend && npm run build
```

All 3 business features delivered:
- ✅ Subscription service with MVP_OVERRIDE pattern (Python + frontend hook)
- ✅ Langganan page with pricing cards + manual transfer flow
- ✅ Landing page at `/` for unauthenticated visitors
