# Batch B — Lightweight New Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Wallet tracking (DB + web + bot), Calendar heatmap page, and CSV/PDF report download.

**Architecture:** Wallet uses a separate `useWalletFilter` context (not merged into `useMonthFilter`) to avoid breaking existing pages. Kalender reuses existing `useTransactions()` with client-side grouping — no new DB queries. Report generation uses a Vercel serverless function; CSV is no-AI, PDF uses one Claude Haiku call on pre-aggregated data.

**Prerequisites:** Batch A must be complete (DB migration run, `usePrivacy` + `PrivacyAmount` available).

**Tech Stack:** React 18 + TypeScript, Supabase JS, Tailwind CSS v4, shadcn/ui, Recharts, python-telegram-bot v20, SQLAlchemy async, Claude Haiku (`claude-haiku-4-5-20251001`), Vercel serverless (Node.js)

---

## File Map

| Action | File |
|---|---|
| MODIFY | `db/operations.py` |
| CREATE | `frontend/src/hooks/useWallets.ts` |
| CREATE | `frontend/src/hooks/useWalletFilter.tsx` |
| CREATE | `frontend/src/app/pages/Wallet.tsx` |
| CREATE | `frontend/src/app/components/WalletOnboardingModal.tsx` |
| MODIFY | `frontend/src/app/components/TransactionModal.tsx` |
| MODIFY | `frontend/src/app/App.tsx` |
| MODIFY | `frontend/src/app/pages/Overview.tsx` |
| MODIFY | `frontend/src/app/pages/Riwayat.tsx` |
| MODIFY | `frontend/src/app/pages/Pengeluaran.tsx` |
| MODIFY | `frontend/src/app/components/Layout.tsx` |
| CREATE | `frontend/src/app/pages/Kalender.tsx` |
| CREATE | `frontend/api/generate-report.js` |
| MODIFY | `bot/handlers/commands.py` |

---

## Task 1: Wallet DB Operations

**Files:**
- Modify: `db/operations.py`

- [ ] **Step 1: Add wallet functions to db/operations.py**

At the bottom of `db/operations.py`, add:

```python
# ── Wallet operations ─────────────────────────────────────────────────────────

async def get_wallets(session: AsyncSession, user_id: int) -> list:
    result = await session.execute(
        text("SELECT id, user_id, name, type, icon, is_primary, initial_balance, created_at "
             "FROM wallets WHERE user_id = :uid ORDER BY is_primary DESC, created_at ASC"),
        {"uid": user_id}
    )
    return [dict(row._mapping) for row in result.fetchall()]


async def create_wallet(
    session: AsyncSession,
    user_id: int,
    name: str,
    wallet_type: str,
    is_primary: bool = False,
    initial_balance: float = 0.0
) -> dict:
    result = await session.execute(
        text("""
            INSERT INTO wallets (user_id, name, type, is_primary, initial_balance)
            VALUES (:uid, :name, :type, :primary, :balance)
            RETURNING id, user_id, name, type, icon, is_primary, initial_balance, created_at
        """),
        {"uid": user_id, "name": name, "type": wallet_type,
         "primary": is_primary, "balance": initial_balance}
    )
    await session.commit()
    return dict(result.fetchone()._mapping)


async def get_wallet_by_name(session: AsyncSession, user_id: int, name_fragment: str) -> dict | None:
    """Case-insensitive partial match — used by bot wallet= parsing."""
    result = await session.execute(
        text("SELECT id, name, type FROM wallets "
             "WHERE user_id = :uid AND LOWER(name) LIKE LOWER(:frag) LIMIT 1"),
        {"uid": user_id, "frag": f"%{name_fragment}%"}
    )
    row = result.fetchone()
    return dict(row._mapping) if row else None


async def get_transactions_by_wallet(
    session: AsyncSession,
    user_id: int,
    wallet_id: str,
    month: int,
    year: int
) -> list:
    result = await session.execute(
        text("""
            SELECT id, amount, type, category, note, date
            FROM transactions
            WHERE user_id = :uid
              AND wallet_id = :wid
              AND EXTRACT(MONTH FROM date) = :month
              AND EXTRACT(YEAR FROM date) = :year
            ORDER BY date DESC
        """),
        {"uid": user_id, "wid": wallet_id, "month": month, "year": year}
    )
    return [dict(row._mapping) for row in result.fetchall()]
```

- [ ] **Step 2: Verify import (text is already imported in operations.py)**

```bash
python -c "from db.operations import get_wallets, create_wallet, get_wallet_by_name; print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add db/operations.py
git commit -m "feat(db): add wallet CRUD operations to db/operations.py"
```

---

## Task 2: Wallet Frontend Hooks

**Files:**
- Create: `frontend/src/hooks/useWallets.ts`
- Create: `frontend/src/hooks/useWalletFilter.tsx`

- [ ] **Step 1: Create `useWallets.ts`**

Create `frontend/src/hooks/useWallets.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Wallet } from '@/lib/supabase';

export function useWallets(userId: number | undefined) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    setWallets(data ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { wallets, isLoading, refetch: fetch };
}

export async function createWallet(
  userId: number,
  name: string,
  type: 'bank' | 'ewallet' | 'cash',
  isPrimary: boolean,
  initialBalance: number
): Promise<{ error?: string }> {
  const { error } = await supabase.from('wallets').insert({
    user_id: userId,
    name,
    type,
    is_primary: isPrimary,
    initial_balance: initialBalance,
  });
  return { error: error?.message };
}

export async function setPrimaryWallet(walletId: string, userId: number): Promise<{ error?: string }> {
  // Unset all primary first
  await supabase.from('wallets').update({ is_primary: false }).eq('user_id', userId);
  const { error } = await supabase.from('wallets').update({ is_primary: true }).eq('id', walletId);
  return { error: error?.message };
}

export async function deleteWallet(walletId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('wallets').delete().eq('id', walletId);
  return { error: error?.message };
}
```

- [ ] **Step 2: Create `useWalletFilter.tsx`**

Create `frontend/src/hooks/useWalletFilter.tsx`:

```typescript
import { createContext, useContext, useState, type ReactNode } from 'react';

interface WalletFilterContextValue {
  walletId: 'all' | string;
  setWalletId: (id: 'all' | string) => void;
}

const WalletFilterContext = createContext<WalletFilterContextValue | null>(null);

export function WalletFilterProvider({ children }: { children: ReactNode }) {
  const [walletId, setWalletId] = useState<'all' | string>('all');

  return (
    <WalletFilterContext.Provider value={{ walletId, setWalletId }}>
      {children}
    </WalletFilterContext.Provider>
  );
}

export function useWalletFilter() {
  const ctx = useContext(WalletFilterContext);
  if (!ctx) throw new Error('useWalletFilter must be used inside WalletFilterProvider');
  return ctx;
}
```

- [ ] **Step 3: Add WalletFilterProvider to App.tsx**

In `frontend/src/app/App.tsx`, import and wrap:

```typescript
import { WalletFilterProvider } from '@/hooks/useWalletFilter';

// Inside the return, add WalletFilterProvider around MonthFilterProvider:
<WalletFilterProvider>
  <MonthFilterProvider>
    {/* ...existing routes... */}
  </MonthFilterProvider>
</WalletFilterProvider>
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useWallets.ts frontend/src/hooks/useWalletFilter.tsx frontend/src/app/App.tsx
git commit -m "feat(wallet): add useWallets and useWalletFilter hooks + WalletFilterProvider"
```

---

## Task 3: Wallet Page

**Files:**
- Create: `frontend/src/app/pages/Wallet.tsx`
- Create: `frontend/src/app/components/WalletOnboardingModal.tsx`

- [ ] **Step 1: Create `WalletOnboardingModal.tsx`**

Create `frontend/src/app/components/WalletOnboardingModal.tsx`:

```typescript
import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { createWallet } from '@/hooks/useWallets';
import { COPY } from '@/lib/copy';

const QUICK_WALLETS = [
  { name: 'BCA',        type: 'bank' as const,    icon: '🏦' },
  { name: 'Mandiri',    type: 'bank' as const,    icon: '🏦' },
  { name: 'BRI',        type: 'bank' as const,    icon: '🏦' },
  { name: 'BNI',        type: 'bank' as const,    icon: '🏦' },
  { name: 'GoPay',      type: 'ewallet' as const, icon: '💚' },
  { name: 'OVO',        type: 'ewallet' as const, icon: '💜' },
  { name: 'Dana',       type: 'ewallet' as const, icon: '💙' },
  { name: 'ShopeePay',  type: 'ewallet' as const, icon: '🧡' },
  { name: 'Cash',       type: 'cash' as const,    icon: '💵' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: number;
  isPrimary?: boolean;
}

export function WalletOnboardingModal({ isOpen, onClose, onSaved, userId, isPrimary = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const walletName = selected === 'Lainnya' ? customName.trim() : selected ?? '';

  const handleSave = async () => {
    if (!walletName) { toast.error('Pilih atau masukkan nama wallet'); return; }
    setSaving(true);
    const walletType = QUICK_WALLETS.find((w) => w.name === selected)?.type ?? 'bank';
    const balance = parseInt(initialBalance.replace(/\D/g, ''), 10) || 0;
    const { error } = await createWallet(userId, walletName, walletType, isPrimary, balance);
    setSaving(false);
    if (error) { toast.error(error); return; }
    toast.success(COPY.success.walletCreated);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Tambah Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Pilih sumber dana kamu:</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_WALLETS.map((w) => (
              <button
                key={w.name}
                onClick={() => setSelected(w.name)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selected === w.name
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{w.icon}</span>
                {w.name}
              </button>
            ))}
            <button
              onClick={() => setSelected('Lainnya')}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                selected === 'Lainnya'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">➕</span>
              Lainnya
            </button>
          </div>

          {selected === 'Lainnya' && (
            <div className="space-y-1">
              <Label>Nama Wallet</Label>
              <Input
                placeholder="Nama wallet kustom..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Saldo awal (opsional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
              <Input
                className="pl-10"
                placeholder="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || !walletName}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create `Wallet.tsx` page**

Create `frontend/src/app/pages/Wallet.tsx`:

```typescript
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, Star, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useWallets, setPrimaryWallet, deleteWallet } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { WalletOnboardingModal } from '../components/WalletOnboardingModal';
import { COPY } from '@/lib/copy';
import type { Wallet } from '@/lib/supabase';

function estimatedBalance(wallet: Wallet, transactions: ReturnType<typeof useTransactions>['transactions']): number {
  const walletTx = transactions.filter((t) => t.wallet_id === wallet.id);
  const income = walletTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = walletTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  return Number(wallet.initial_balance) + income - expense;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { wallets, isLoading, refetch } = useWallets(user?.userId);
  const { transactions } = useTransactions(month, year);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSetPrimary = async (wallet: Wallet) => {
    if (!user) return;
    const { error } = await setPrimaryWallet(wallet.id, user.userId);
    if (error) { toast.error(error); return; }
    toast.success(`${wallet.name} dijadikan wallet utama`);
    refetch();
  };

  const handleDelete = async (wallet: Wallet) => {
    if (!confirm(`Hapus wallet "${wallet.name}"? Transaksi yang sudah ada tidak akan terhapus.`)) return;
    setDeleting(wallet.id);
    const { error } = await deleteWallet(wallet.id);
    setDeleting(null);
    if (error) { toast.error('Gagal menghapus: ' + error); return; }
    toast.success(`Wallet "${wallet.name}" dihapus`);
    refetch();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dompet</h1>
          <p className="text-sm text-muted-foreground">Kelola sumber dana kamu</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Wallet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <WalletIcon className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-center">{COPY.emptyStates.wallets}</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Wallet Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => {
            const balance = estimatedBalance(wallet, transactions);
            return (
              <Card key={wallet.id} className="relative">
                {wallet.is_primary && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-yellow-100 text-yellow-700 gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-500" />
                      Utama
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                      {wallet.icon ?? (wallet.type === 'bank' ? '🏦' : wallet.type === 'ewallet' ? '💳' : '💵')}
                    </div>
                    <div>
                      <CardTitle className="text-base">{wallet.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimasi saldo</p>
                    <p className="font-mono font-bold text-lg">
                      <PrivacyAmount value={formatRupiah(balance)} />
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!wallet.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleSetPrimary(wallet)}
                      >
                        Jadikan Utama
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(wallet)}
                      disabled={deleting === wallet.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {user && (
        <WalletOnboardingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={refetch}
          userId={user.userId}
          isPrimary={wallets.length === 0}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add /wallet route to App.tsx**

In `frontend/src/app/App.tsx`, import and add the route:

```typescript
import WalletPage from './pages/Wallet';

// Inside the protected Routes block:
<Route path="/wallet" element={<WalletPage />} />
```

- [ ] **Step 4: Type-check**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit
```
Expected: No errors. Note: `useTransactions` returns objects with `wallet_id` since the DB column now exists — the type in `supabase.ts` needs `wallet_id?: string` added to `Transaction`:

In `frontend/src/lib/supabase.ts`, add to `Transaction` interface:
```typescript
wallet_id?: string;
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/pages/Wallet.tsx frontend/src/app/components/WalletOnboardingModal.tsx frontend/src/app/App.tsx frontend/src/lib/supabase.ts
git commit -m "feat(wallet): add Wallet page with balance estimation and onboarding modal"
```

---

## Task 4: Wallet Filter Bar + TransactionModal Wallet Dropdown

**Files:**
- Modify: `frontend/src/app/components/TransactionModal.tsx`
- Modify: `frontend/src/app/pages/Overview.tsx`
- Modify: `frontend/src/app/pages/Riwayat.tsx`
- Modify: `frontend/src/app/pages/Pengeluaran.tsx`

- [ ] **Step 1: Add wallet dropdown to TransactionModal**

In `frontend/src/app/components/TransactionModal.tsx`:

Add imports:
```typescript
import { useWallets } from '@/hooks/useWallets';
import { supabase } from '@/lib/supabase'; // already imported
```

Add state inside `TransactionModal`:
```typescript
const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
const { wallets } = useWallets(user?.userId);
```

In `handleSave`, update the insert to include `wallet_id`:
```typescript
const { error } = await supabase.from('transactions').insert({
  user_id: user.userId,
  ...txData,
  wallet_id: selectedWalletId || null,
});
```

In the Manual tab JSX (before the Save button), add wallet dropdown. Search for the Date input block and add after it:

```typescript
{wallets.length > 0 && (
  <div className="space-y-2">
    <Label>Dari wallet mana? (opsional)</Label>
    <select
      value={selectedWalletId ?? ''}
      onChange={(e) => setSelectedWalletId(e.target.value || null)}
      className="w-full px-3 py-2 rounded-lg border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">Pilih wallet...</option>
      {wallets.map((w) => (
        <option key={w.id} value={w.id}>
          {w.name}{w.is_primary ? ' ⭐' : ''}
        </option>
      ))}
    </select>
  </div>
)}
```

Also add to `handleClose` reset:
```typescript
setSelectedWalletId(null);
```

- [ ] **Step 2: Create WalletFilterBar component inline**

In Overview, Riwayat, and Pengeluaran, add a wallet filter select. Create a small reusable component at the top of each page file (or extract to a shared component):

```typescript
// Add this component at the top of pages that need wallet filter
function WalletFilterBar({ wallets }: { wallets: import('@/lib/supabase').Wallet[] }) {
  const { walletId, setWalletId } = useWalletFilter();
  if (wallets.length === 0) return null;
  return (
    <select
      value={walletId}
      onChange={(e) => setWalletId(e.target.value)}
      className="px-3 py-2 rounded-lg border bg-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="all">Semua Wallet</option>
      {wallets.map((w) => (
        <option key={w.id} value={w.id}>{w.name}</option>
      ))}
    </select>
  );
}
```

- [ ] **Step 3: Apply wallet filter to Overview.tsx**

In `frontend/src/app/pages/Overview.tsx`:

Add imports:
```typescript
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
```

Add inside component:
```typescript
const { walletId } = useWalletFilter();
const { wallets } = useWallets(user?.userId);
```

Filter transactions before computing totals:
```typescript
const filteredTransactions = walletId === 'all'
  ? transactions
  : transactions.filter((t) => t.wallet_id === walletId);
// Use filteredTransactions instead of transactions for income/expense calculations
```

Add `<WalletFilterBar wallets={wallets} />` to the page header area next to the month filter.

If a wallet is selected, show estimated balance:
```typescript
{walletId !== 'all' && (() => {
  const wallet = wallets.find((w) => w.id === walletId);
  if (!wallet) return null;
  const income = filteredTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = Number(wallet.initial_balance) + income - expense;
  return (
    <div className="text-sm text-muted-foreground">
      Estimasi saldo {wallet.name}: <PrivacyAmount value={formatRupiah(balance)} className="font-semibold text-foreground" />
    </div>
  );
})()}
```

- [ ] **Step 4: Apply wallet filter to Riwayat.tsx and Pengeluaran.tsx**

In both files, add the same wallet filter pattern:

```typescript
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';

// Inside component:
const { walletId } = useWalletFilter();
const { wallets } = useWallets(user?.userId);
const filteredTransactions = walletId === 'all'
  ? transactions
  : transactions.filter((t) => t.wallet_id === walletId);

// Add <WalletFilterBar wallets={wallets} /> to page header
// Use filteredTransactions instead of transactions in rendering
```

- [ ] **Step 5: Type-check and build**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build
```
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/components/TransactionModal.tsx frontend/src/app/pages/Overview.tsx frontend/src/app/pages/Riwayat.tsx frontend/src/app/pages/Pengeluaran.tsx
git commit -m "feat(wallet): add wallet dropdown to TransactionModal + wallet filter to Overview/Riwayat/Pengeluaran"
```

---

## Task 5: Wallet Bot Commands

**Files:**
- Modify: `bot/handlers/commands.py`

- [ ] **Step 1: Add wallet parsing to /add and /income handlers**

In `bot/handlers/commands.py`, find the `/add` handler function. Add wallet parsing at the end of the note parsing logic (before the DB insert):

```python
# At top of file, add import if not present:
from db.operations import get_wallet_by_name

# In the /add and /income handlers, after parsing the note text,
# check for "wallet=X" or "dari=X" pattern:
import re as _re

def parse_wallet_suffix(text: str) -> tuple[str, str | None]:
    """Returns (cleaned_text, wallet_name_fragment). Removes wallet= or dari= from text."""
    pattern = r'\s+(?:wallet|dari)=(\S+)\s*$'
    match = _re.search(pattern, text, _re.IGNORECASE)
    if match:
        wallet_frag = match.group(1)
        cleaned = text[:match.start()].strip()
        return cleaned, wallet_frag
    return text, None
```

In the add handler body, after extracting `note`, add:
```python
note, wallet_frag = parse_wallet_suffix(note)
wallet_id = None

if wallet_frag:
    async with get_session() as session:
        wallet = await get_wallet_by_name(session, user_id, wallet_frag)
    if wallet:
        wallet_id = str(wallet['id'])
    else:
        await update.message.reply_text(
            f"Wallet '{wallet_frag}' gak ketemu nih. "
            "Cek /wallet untuk lihat daftar walletmu."
        )
        return

# In the DB insert call, add wallet_id to the transaction dict
```

- [ ] **Step 2: Add /wallet command**

In `bot/handlers/commands.py`, add a new handler:

```python
from services.formatter import fmt_wallet_list

async def wallet_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    args = context.args or []

    async with get_session() as session:
        wallets_raw = await get_wallets(session, user_id)

    if args and args[0].lower() == 'setup':
        await update.message.reply_text(
            "👜 Yuk setup wallet!\n\n"
            "Ketik nama wallet dan saldo awalnya:\n"
            "/wallet buat BCA 5000000\n\n"
            "Atau pilih dari: BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay, Cash"
        )
        return

    if args and args[0].lower() == 'buat' and len(args) >= 2:
        wallet_name = args[1]
        initial_balance = float(args[2]) if len(args) >= 3 else 0.0
        wtype = 'ewallet' if wallet_name.lower() in ['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja'] else \
                'cash' if wallet_name.lower() == 'cash' else 'bank'
        async with get_session() as session:
            await create_wallet(session, user_id, wallet_name, wtype, len(wallets_raw) == 0, initial_balance)
        await update.message.reply_text(f"✅ Wallet *{wallet_name}* berhasil ditambahkan!", parse_mode='Markdown')
        return

    # Default: show list
    # Compute estimated balance per wallet (sum income - expense from transactions)
    wallets_with_balance = []
    for w in wallets_raw:
        wallets_with_balance.append({**w, 'balance': float(w.get('initial_balance', 0))})

    await update.message.reply_text(
        fmt_wallet_list(wallets_with_balance),
        parse_mode='Markdown'
    )
```

- [ ] **Step 3: Register the new handler in main.py**

In `bot/main.py`, find where other command handlers are registered and add:

```python
from bot.handlers.commands import wallet_command

application.add_handler(CommandHandler("wallet", wallet_command))
```

- [ ] **Step 4: Test bot handlers**

```bash
python -c "from bot.handlers.commands import wallet_command; print('OK')"
```
Expected: `OK`

- [ ] **Step 5: Commit**

```bash
git add bot/handlers/commands.py bot/main.py
git commit -m "feat(bot): add /wallet command and wallet=X parsing in /add and /income"
```

---

## Task 6: Kalender Heatmap Page

**Files:**
- Create: `frontend/src/app/pages/Kalender.tsx`
- Modify: `frontend/src/app/App.tsx`

- [ ] **Step 1: Create Kalender.tsx**

Create `frontend/src/app/pages/Kalender.tsx`:

```typescript
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { formatRupiah } from '@/lib/utils';
import type { Transaction } from '@/lib/supabase';

const DAY_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function getHeatColor(amount: number): string {
  if (amount === 0) return 'bg-white dark:bg-muted';
  if (amount <= 100_000) return 'bg-green-100 dark:bg-green-900/30';
  if (amount <= 500_000) return 'bg-yellow-100 dark:bg-yellow-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

interface DayTransactions {
  [dateStr: string]: Transaction[];
}

export default function Kalender() {
  const { month, year } = useMonthFilter();
  const { walletId } = useWalletFilter();
  const { transactions, isLoading } = useTransactions(month, year);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const filtered = useMemo(
    () => walletId === 'all' ? transactions : transactions.filter((t) => t.wallet_id === walletId),
    [transactions, walletId]
  );

  const byDate = useMemo(() => {
    const map: DayTransactions = {};
    filtered.forEach((t) => {
      const d = t.date.split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [filtered]);

  const expenseByDate = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(byDate).forEach(([d, txs]) => {
      map[d] = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    });
    return map;
  }, [byDate]);

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay(); // 0=Sun
  const cells: Array<number | null> = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTxs = selectedDate ? (byDate[selectedDate] ?? []) : [];

  const totalMonth = Object.values(expenseByDate).reduce((s, v) => s + v, 0);
  const [worstDate, worstAmount] = Object.entries(expenseByDate).reduce(
    (best, [d, v]) => v > best[1] ? [d, v] : best,
    ['', 0]
  );

  if (isLoading) return <div className="animate-pulse h-96 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kalender</h1>
        <p className="text-sm text-muted-foreground">Pengeluaran per tanggal bulan ini</p>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const expense = expenseByDate[dateStr] ?? 0;
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`
                    relative rounded-lg p-1 min-h-[60px] text-left transition-all border-2
                    ${getHeatColor(expense)}
                    ${isSelected ? 'border-primary' : 'border-transparent'}
                    ${isToday ? 'ring-2 ring-primary/50' : ''}
                    hover:border-primary/50
                  `}
                >
                  <span className={`text-xs font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                    {day}
                  </span>
                  {expense > 0 && (
                    <p className="text-[9px] font-mono text-muted-foreground leading-tight mt-0.5 truncate">
                      {formatRupiah(expense).replace('Rp ', '')}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Total bulan ini: <span className="font-semibold text-foreground">{formatRupiah(totalMonth)}</span></span>
            {worstDate && <span>Hari termahal: <span className="font-semibold text-foreground">Tgl {new Date(worstDate).getDate()} ({formatRupiah(worstAmount)})</span></span>}
          </div>
        </CardContent>
      </Card>

      {/* Day detail panel */}
      {selectedDate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(selectedDate + 'T00:00:00'))}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedTxs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada transaksi.</p>
            ) : (
              selectedTxs.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-1 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{t.category}</p>
                    {t.note && <p className="text-xs text-muted-foreground">{t.note}</p>}
                  </div>
                  <span className={`text-sm font-mono font-semibold ${t.type === 'expense' ? 'text-red-500' : 'text-green-600'}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatRupiah(Number(t.amount))}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border" /> Tidak ada</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100" /> &lt; Rp 100rb</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100" /> Rp 100–500rb</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> &gt; Rp 500rb</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add /kalender route to App.tsx**

```typescript
import Kalender from './pages/Kalender';
// Inside protected routes:
<Route path="/kalender" element={<Kalender />} />
```

- [ ] **Step 3: Type-check and build**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/Kalender.tsx frontend/src/app/App.tsx
git commit -m "feat(kalender): add calendar heatmap page with daily spending visualization"
```

---

## Task 7: Download Report API

**Files:**
- Create: `frontend/api/generate-report.js`

- [ ] **Step 1: Create `generate-report.js`**

Create `frontend/api/generate-report.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use service role key for server-side
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, month, year, wallet_id = 'all', format = 'csv' } = req.body;

  if (!user_id || !month || !year) {
    return res.status(400).json({ error: 'user_id, month, year required' });
  }

  // Query transactions
  let query = supabase
    .from('transactions')
    .select('date, category, type, amount, note, wallet_id, wallets(name)')
    .eq('user_id', user_id)
    .order('date', { ascending: false });

  if (wallet_id !== 'all') query = query.eq('wallet_id', wallet_id);

  // Filter by month/year using date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  query = query.gte('date', startDate).lte('date', endDate);

  const { data: transactions, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  if (format === 'csv') {
    const headers = ['Tanggal', 'Kategori', 'Tipe', 'Jumlah', 'Catatan', 'Wallet'];
    const rows = (transactions ?? []).map((t) => [
      t.date?.split('T')[0] ?? '',
      t.category ?? '',
      t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
      t.amount ?? 0,
      (t.note ?? '').replace(/,/g, ';'), // escape commas in notes
      t.wallets?.name ?? '',
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const filename = `gajian-aman-${monthNames[month-1]}-${year}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send('﻿' + csv); // BOM for Excel compatibility
  }

  if (format === 'pdf') {
    const txs = transactions ?? [];
    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // Aggregate top 3 categories
    const catMap = {};
    txs.filter((t) => t.type === 'expense').forEach((t) => {
      catMap[t.category] = (catMap[t.category] ?? 0) + Number(t.amount);
    });
    const top3 = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: Rp ${Number(amt).toLocaleString('id-ID')}`)
      .join(', ');

    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    // One Claude Haiku call with aggregated data only — NOT row-by-row
    const { content } = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Buat ringkasan keuangan 3 paragraf singkat dalam bahasa Indonesia casual (gaya Gojek/Grab) berdasarkan data berikut:
Bulan: ${monthNames[month-1]} ${year}
Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
Saldo Bersih: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}
Top 3 Kategori: ${top3 || 'Tidak ada data'}
Jumlah Transaksi: ${txs.length}

Paragraf 1: ringkasan kondisi keuangan bulan ini.
Paragraf 2: analisis singkat pengeluaran terbesar.
Paragraf 3: satu saran praktis yang actionable.`
      }]
    });

    const narrative = content[0]?.text ?? 'Laporan tidak tersedia.';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Keuangan — ${monthNames[month-1]} ${year}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
    h1 { color: #10b981; font-size: 24px; }
    h2 { font-size: 16px; color: #555; margin-top: 24px; }
    .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .stat .label { color: #666; }
    .stat .value { font-weight: 700; font-family: monospace; }
    .income { color: #10b981; }
    .expense { color: #ef4444; }
    .narrative { background: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin-top: 24px; border-radius: 4px; line-height: 1.6; white-space: pre-wrap; }
    .footer { margin-top: 40px; font-size: 12px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <h1>📊 Laporan Keuangan</h1>
  <p style="color:#666">${monthNames[month-1]} ${year} — Gajian Aman</p>
  <h2>Ringkasan</h2>
  <div class="stat"><span class="label">Total Pemasukan</span><span class="value income">Rp ${totalIncome.toLocaleString('id-ID')}</span></div>
  <div class="stat"><span class="label">Total Pengeluaran</span><span class="value expense">Rp ${totalExpense.toLocaleString('id-ID')}</span></div>
  <div class="stat"><span class="label">Saldo Bersih</span><span class="value">Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}</span></div>
  <div class="stat"><span class="label">Jumlah Transaksi</span><span class="value">${txs.length}</span></div>
  <h2>Analisis AI</h2>
  <div class="narrative">${narrative}</div>
  <div class="footer">Dibuat oleh Gajian Aman · ${new Date().toLocaleDateString('id-ID')}</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="laporan-${monthNames[month-1]}-${year}.html"`);
    return res.status(200).send(html);
  }

  return res.status(400).json({ error: 'format must be csv or pdf' });
}
```

Note: Add `SUPABASE_SERVICE_KEY` to Vercel environment variables. For frontend env file add `VITE_SUPABASE_URL` (already exists) — the serverless function reads `process.env.VITE_SUPABASE_URL` since Vercel exposes all env vars to serverless functions.

- [ ] **Step 2: Commit**

```bash
git add frontend/api/generate-report.js
git commit -m "feat(report): add generate-report.js serverless — CSV (no AI) + PDF with Haiku narrative"
```

---

## Task 8: Download Button in Riwayat

**Files:**
- Modify: `frontend/src/app/pages/Riwayat.tsx`

- [ ] **Step 1: Add download button + dialog to Riwayat.tsx**

In `frontend/src/app/pages/Riwayat.tsx`, add imports:
```typescript
import { Download, Loader2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useMonthFilter } from '@/hooks/useMonthFilter';
```

Add download state and handler inside the component:
```typescript
const { walletId } = useWalletFilter();
const { month, year } = useMonthFilter();
const [downloading, setDownloading] = useState(false);

const handleDownload = async (format: 'csv' | 'pdf') => {
  if (!user) return;
  setDownloading(true);
  try {
    const res = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.userId, month, year, wallet_id: walletId, format }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? 'Gagal download');
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'csv' ? `laporan-${month}-${year}.csv` : `laporan-${month}-${year}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Laporan berhasil didownload!');
  } catch {
    toast.error('Gagal download. Coba lagi ya.');
  } finally {
    setDownloading(false);
  }
};
```

Add download button to the page header area (next to the existing filter/search):
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm" disabled={downloading} className="gap-2">
      {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Download
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => handleDownload('csv')}>
      📊 CSV bulan ini
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDownload('pdf')}>
      📄 PDF summary bulan ini
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

- [ ] **Step 2: Type-check and build**

```bash
cd frontend && npx tsc -p tsconfig.app.json --noEmit && npm run build
```
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/pages/Riwayat.tsx
git commit -m "feat(riwayat): add CSV/PDF download button with wallet and month filter"
```

---

## Batch B Complete ✅

```bash
cd frontend && npm run build
```

All 3 features delivered:
- ✅ Wallet tracking (DB ops, hooks, page, bot commands, wallet filter)
- ✅ Kalender heatmap page
- ✅ Download laporan (CSV no-AI + PDF with Haiku narrative)
