import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { formatRupiah } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { COPY } from '@/lib/copy';

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

type FilterType = 'all' | 'income' | 'expense';

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

export default function Riwayat() {
  const { month, year } = useMonthFilter();
  const { transactions, isLoading } = useTransactions(month, year);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transactions.filter((t) => {
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchSearch =
        !q ||
        (t.note ?? '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.subcategory ?? '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [transactions, search, typeFilter]);

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari catatan atau kategori…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as FilterType)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Semua Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filtered.length} Transaksi
            {search && ` · "${search}"`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {search || typeFilter !== 'all'
                ? 'Tidak ada transaksi yang cocok dengan filter'
                : COPY.emptyStates.history}
            </p>
          ) : (
            <div className="divide-y">
              {filtered.map((tx) => {
                const meta = getCatMeta(tx.category);
                const isIncome = tx.type === 'income';
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg flex-shrink-0">
                        {meta.emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {tx.note || tx.category}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {formatDateShort(tx.date)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5"
                            style={{
                              backgroundColor: `${meta.color}20`,
                              color: meta.color,
                            }}
                          >
                            {tx.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span
                        className={`font-['DM_Mono'] font-bold text-sm ${
                          isIncome ? 'text-green-600' : 'text-foreground'
                        }`}
                      >
                        {isIncome ? '+' : '-'}
                        <PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer summary */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" /> Total Pemasukan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-['DM_Mono'] font-bold text-lg text-green-600">
                <PrivacyAmount value={formatRupiah(totalIncome)} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                <ArrowDownRight className="w-4 h-4 text-muted-foreground" /> Total Pengeluaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-['DM_Mono'] font-bold text-lg">
                <PrivacyAmount value={formatRupiah(totalExpense)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
