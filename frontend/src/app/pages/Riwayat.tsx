import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Search, ArrowUpRight, ArrowDownRight, Download, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredTransactions } from '@/hooks/data/useFilteredTransactions';
import { getCategoryMeta } from '@/lib/categoryMetadata';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TextPositive, TextNegative } from '../components/Markup';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import { COPY } from '@/lib/copy';

type FilterType = 'all' | 'income' | 'expense';

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
      className={cn('px-3 py-2 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]', bgColorVar('bg-screen'), textColorVar('content-primary'))}
    >
      <option value="all">Semua Wallet</option>
      {wallets.map((w) => (
        <option key={w.id} value={w.id}>{w.name}{w.is_primary ? ' ⭐' : ''}</option>
      ))}
    </select>
  );
}

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

function SkeletonRow() {
  return (
    <div className={cn('flex items-center justify-between py-3 border-b last:border-0', borderColorVar('border-neutral'))}>
      <div className="flex items-center gap-3 flex-1">
        <div className={cn('w-10 h-10 rounded-full animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
        <div className="space-y-1 flex-1">
          <div className={cn('h-4 w-32 rounded animate-pulse', bgColorVar('bg-neutral'))} />
          <div className={cn('h-3 w-24 rounded animate-pulse', bgColorVar('bg-neutral'))} />
        </div>
      </div>
      <div className={cn('h-4 w-20 rounded animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
    </div>
  );
}

export default function Riwayat() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId, setWalletId } = useWalletFilter();
  const { wallets } = useWallets(user?.userId);
  const { transactions, isLoading } = useTransactions(month, year);
  const prefersReduced = useReducedMotion();

  const filteredTransactions = walletId === 'all'
    ? transactions
    : transactions.filter((t) => t.wallet_id === walletId);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
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

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    filteredTransactions.forEach((t) => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [filteredTransactions]);

  const filtered = useFilteredTransactions(filteredTransactions, {
    search,
    type: typeFilter === 'all' ? 'all' : typeFilter,
    tags: selectedTags,
  });

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  if (isLoading) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {[0, 1].map((i) => (
            <Card key={i} className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
              <CardContent className="pt-6">
                <div className={cn('h-4 rounded animate-pulse w-20 mb-3', bgColorVar('bg-neutral'))} />
                <div className={cn('h-7 rounded animate-pulse w-32', bgColorVar('bg-neutral'))} />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-6 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-4 sm:space-y-6"
    >
      {/* KPI Summary */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: prefersReduced ? 0 : 0.05 }}
        className="grid grid-cols-2 gap-2 sm:gap-4"
      >
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardContent className="pt-6">
              <p className={cn('text-xs sm:text-sm font-medium mb-2 flex items-center gap-1', textColorVar('content-tertiary'))}>
                <ArrowUpRight className={cn('w-4 h-4', textColorVar('sentiment-positive'))} /> Pemasukan
              </p>
              <div className="font-mono font-bold text-lg sm:text-2xl">
                <TextPositive>
                  <PrivacyAmount value={formatRupiah(totalIncome)} />
                </TextPositive>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardContent className="pt-6">
              <p className={cn('text-xs sm:text-sm font-medium mb-2 flex items-center gap-1', textColorVar('content-tertiary'))}>
                <ArrowDownRight className={cn('w-4 h-4', textColorVar('sentiment-negative'))} /> Pengeluaran
              </p>
              <div className="font-mono font-bold text-lg sm:text-2xl">
                <TextNegative>
                  <PrivacyAmount value={formatRupiah(totalExpense)} />
                </TextNegative>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
        className="flex flex-col gap-2 sm:gap-3"
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <WalletFilterBar wallets={wallets} walletId={walletId} setWalletId={setWalletId} />
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as FilterType)}
          >
            <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-sm">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="income">Pemasukan</SelectItem>
              <SelectItem value="expense">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', textColorVar('content-tertiary'))} />
            <Input
              placeholder="Cari catatan atau kategori…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn('pl-9 h-9 sm:h-10 text-sm', bgColorVar('bg-screen'), borderColorVar('border-neutral'), textColorVar('content-primary'))}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={downloading} className="gap-2">
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload('csv')}>
                📊 CSV bulan ini
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                📄 PDF bulan ini
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  const newTags = new Set(selectedTags);
                  if (newTags.has(tag)) {
                    newTags.delete(tag);
                  } else {
                    newTags.add(tag);
                  }
                  setSelectedTags(newTags);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  selectedTags.has(tag)
                    ? cn(bgColorVar('brand-primary'), textColorVar('brand-primary-fg'), borderColorVar('brand-primary'))
                    : cn(borderColorVar('border-neutral'), textColorVar('content-secondary'), 'hover:border-[var(--color-brand-primary)]')
                )}
              >
                {tag}
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTags(new Set())}
                className={cn('px-3 py-1.5 rounded-full text-xs font-medium', textColorVar('content-tertiary'), 'hover:text-[var(--color-content-primary)]')}
              >
                Reset
              </button>
            )}
          </div>
        )}
      </motion.div>

      {/* Transaction List */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader className="pb-3">
            <CardTitle className={cn('text-base sm:text-lg', textColorVar('content-primary'))}>
              {filtered.length} Transaksi
              {search && ` · "${search}"`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className={cn('text-sm text-center py-12', textColorVar('content-tertiary'))}>
                {search || typeFilter !== 'all'
                  ? 'Tidak ada transaksi yang cocok dengan filter'
                  : COPY.emptyStates.history}
              </p>
            ) : (
              <div className={cn('divide-y', `divide-[${colorVar('border-neutral')}]`)}>
                <AnimatePresence>
                  {filtered.map((tx, idx) => {
                    const meta = getCategoryMeta(tx.category);
                    const isIncome = tx.type === 'income';
                    return (
                      <motion.div
                        key={tx.id}
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ delay: prefersReduced ? 0 : idx * 0.03 }}
                        className="flex items-center justify-between py-4 sm:py-3 min-h-[56px] sm:min-h-auto"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0', bgColorVar('bg-neutral'))}>
                            {meta.emoji}
                          </div>
                          <div className="min-w-0">
                            <p className={cn('text-base sm:text-sm font-semibold truncate', textColorVar('content-primary'))}>
                              {tx.note || tx.category}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className={cn('text-xs sm:text-[12px]', textColorVar('content-tertiary'))}>
                                {formatDateShort(tx.date)}
                              </span>
                              <span
                                className="text-[11px] sm:text-[10px] h-5 sm:h-4 px-1.5 rounded-full font-medium"
                                style={{
                                  backgroundColor: `var(--color-cat-${tx.category.toLowerCase().replace(/\s+/g, '-')}-bg, ${meta.color}20)`,
                                  color: meta.color,
                                }}
                              >
                                {tx.category}
                              </span>
                              {tx.tags && tx.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {tx.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className={cn('text-[9px] sm:text-[8px] h-4 px-1 rounded-full border', borderColorVar('border-neutral'), textColorVar('content-tertiary'))}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                          {isIncome ? (
                            <ArrowUpRight className={cn('w-4 h-4', textColorVar('sentiment-positive'))} />
                          ) : (
                            <ArrowDownRight className={cn('w-4 h-4', textColorVar('content-tertiary'))} />
                          )}
                          <span className="font-mono font-bold text-base sm:text-sm flex-shrink-0">
                            {isIncome ? (
                              <TextPositive>
                                +<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                              </TextPositive>
                            ) : (
                              <TextNegative>
                                −<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                              </TextNegative>
                            )}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
