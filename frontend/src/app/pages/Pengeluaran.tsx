import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { TrendingDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import type { CSSProperties } from 'react';

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  'Food & Dining': { emoji: '🍔', color: '#f59e0b' },
  'Food': { emoji: '🍔', color: '#f59e0b' },
  'Transport': { emoji: '🚗', color: '#3b82f6' },
  'Groceries': { emoji: '🛒', color: '#10b981' },
  'Shopping': { emoji: '🛍️', color: '#ec4899' },
  'Bills & Utilities': { emoji: '📱', color: '#8b5cf6' },
  'Bills': { emoji: '📱', color: '#8b5cf6' },
  'Health': { emoji: '🏥', color: '#ef4444' },
  'Entertainment': { emoji: '🎬', color: '#f97316' },
  'Education': { emoji: '📚', color: '#06b6d4' },
};
function getCatMeta(cat: string) {
  return CATEGORY_META[cat] ?? { emoji: '💰', color: '#94a3b8' };
}

function WalletFilterBar({ wallets, walletId, setWalletId }: {
  wallets: import('@/lib/supabase').Wallet[];
  walletId: string;
  setWalletId: (id: string) => void;
}) {
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

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-1">
          <div className="h-4 w-28 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
    </div>
  );
}

export default function Pengeluaran() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId, setWalletId } = useWalletFilter();
  const { wallets } = useWallets(user?.userId);
  const { transactions, isLoading } = useTransactions(month, year);

  const filteredTransactions = walletId === 'all'
    ? transactions
    : transactions.filter((t) => t.wallet_id === walletId);

  const expenses = filteredTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
      });
    return Object.entries(map)
      .map(([name, spent]) => ({ name, spent, ...getCatMeta(name) }))
      .sort((a, b) => b.spent - a.spent);
  }, [filteredTransactions]);

  const maxSpent = categoryData[0]?.spent ?? 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded animate-pulse w-24 mb-3" />
                <div className="h-8 bg-muted rounded animate-pulse w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="h-64 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Filter */}
      <div className="flex items-center gap-3">
        <WalletFilterBar wallets={wallets} walletId={walletId} setWalletId={setWalletId} />
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Total Pengeluaran
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-2xl">{formatRupiah(expenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              Kategori Teratas
            </CardTitle>
            <span className="text-xl">{categoryData[0] ? getCatMeta(categoryData[0].name).emoji : '—'}</span>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {categoryData[0]?.name ?? '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {categoryData[0] ? formatRupiah(categoryData[0].spent) : 'Belum ada data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Horizontal Bar Chart */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(categoryData.length * 44, 140)}>
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <XAxis
                  type="number"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={90}
                  tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                />
                <Tooltip
                  formatter={(value: number) => [formatRupiah(value), 'Pengeluaran']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="spent" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Category List */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Kategori</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Belum ada pengeluaran untuk bulan ini
            </p>
          ) : (
            <div className="space-y-5">
              {categoryData.map((cat) => {
                const pct = (cat.spent / maxSpent) * 100;
                return (
                  <div key={cat.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-sm font-semibold">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-['DM_Mono'] text-xs"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color } as CSSProperties}
                        >
                          {formatRupiah(cat.spent)}
                        </Badge>
                      </div>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2"
                      style={{ '--progress-background': cat.color } as CSSProperties}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
