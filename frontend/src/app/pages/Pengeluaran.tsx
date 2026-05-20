import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingDown, ChevronDown } from 'lucide-react';
import { ErrorState, EmptyState, LoadingState } from '../components/ScreenStates';
import { motion, AnimatePresence } from 'motion/react';
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
import { useWalletStats } from '@/hooks/data/useWalletStats';
import { useCategoryTransactions } from '@/hooks/useCategoryTransactions';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { CategoryDetailModal } from '../components/CategoryDetailModal';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TextNegative } from '../components/Markup';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import { useScreenState } from '@/hooks/useScreenState';

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

function SkeletonRow() {
  return (
    <div className={cn('flex items-center justify-between py-4 sm:py-3 min-h-[56px] sm:min-h-auto border-b last:border-0', borderColorVar('border-neutral'))}>
      <div className="flex items-center gap-3 flex-1">
        <div className={cn('w-10 h-10 rounded-full animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
        <div className="space-y-1 flex-1">
          <div className={cn('h-4 w-28 rounded animate-pulse', bgColorVar('bg-neutral'))} />
          <div className={cn('h-3 w-16 rounded animate-pulse', bgColorVar('bg-neutral'))} />
        </div>
      </div>
      <div className={cn('h-4 w-20 rounded animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
    </div>
  );
}

export default function Pengeluaran() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId, setWalletId } = useWalletFilter();
  const { wallets = [] } = useWallets(user?.userId);
  const { transactions = [], isLoading, error } = useTransactions(month, year);
  const prefersReduced = useReducedMotion();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTransactions = walletId === 'all'
    ? (transactions ?? [])
    : (transactions ?? []).filter((t) => t.wallet_id === walletId);

  const { totalExpenses: expenses = 0, categoryData = [], maxSpent = 1 } = useWalletStats(filteredTransactions);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Screen state: loading, error, empty, or loaded
  const screenState = useScreenState({
    isLoading,
    error: error || null,
    isEmpty: filteredTransactions.filter((t) => t.type === 'expense').length === 0,
  });

  const { stats: categoryStats, isLoading: categoryLoading } = useCategoryTransactions(
    selectedCategory || '',
    month,
    year,
    expenses
  );

  // Get last 5 transactions for expanded category
  const expandedTransactions = useMemo(() => {
    if (!expandedCategory) return [];
    return filteredTransactions
      .filter((t) => t.category === expandedCategory && t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expandedCategory, filteredTransactions]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsModalOpen(true);
  };

  const toggleExpand = (categoryName: string) => {
    setExpandedCategory(expandedCategory === categoryName ? null : categoryName);
  };

  // Show error state if fetch failed
  if (screenState.error) {
    return (
      <ErrorState
        title="Gagal memuat pengeluaran"
        message={screenState.error.message || 'Terjadi kesalahan saat mengambil data pengeluaran.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show loading state while fetching data
  if (screenState.isLoading) {
    return <LoadingState count={3} type="card" />;
  }

  // Show empty state if no expenses this month
  if (screenState.isEmpty) {
    return (
      <EmptyState
        title="Belum ada pengeluaran"
        message="Anda belum mencatat pengeluaran untuk bulan ini. Mulai dengan menambahkan transaksi pertama."
        actionLabel="Tambah Pengeluaran"
        onAction={() => (window.location.href = '/add-transaction')}
      />
    );
  }

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-6"
    >
      {/* Wallet Filter */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
        className="flex items-center gap-3"
      >
        <WalletFilterBar wallets={wallets} walletId={walletId} setWalletId={setWalletId} />
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: prefersReduced ? 0 : 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      >
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn('text-xs md:text-sm font-semibold', textColorVar('content-tertiary'))}>
                Total Pengeluaran
              </CardTitle>
              <TrendingDown className={cn('h-4 w-4', textColorVar('sentiment-negative'))} />
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-xl md:text-2xl">
                <TextNegative>
                  <PrivacyAmount value={formatRupiah(expenses)} />
                </TextNegative>
              </div>
              <p className={cn('text-xs mt-1', textColorVar('content-tertiary'))}>bulan ini</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn('text-xs md:text-sm font-semibold', textColorVar('content-tertiary'))}>
                Kategori Teratas
              </CardTitle>
              <span className="text-xl">{categoryData[0] ? categoryData[0].emoji : '—'}</span>
            </CardHeader>
            <CardContent>
              <div className={cn('font-bold text-xl md:text-2xl', textColorVar('content-primary'))}>
                {categoryData[0]?.name ?? '—'}
              </div>
              <p className="text-xs text-[var(--color-content-tertiary)] mt-1">
                {categoryData[0] ? (
                  <PrivacyAmount value={formatRupiah(categoryData[0].spent)} />
                ) : (
                  'Belum ada data'
                )}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Horizontal Bar Chart */}
      {categoryData.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader className="pb-3">
              <CardTitle className={cn('text-base sm:text-lg', textColorVar('content-primary'))}>
                Pengeluaran per Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(categoryData.length * 40, 120)}>
                <BarChart
                  data={categoryData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <XAxis
                    type="number"
                    stroke={colorVar('content-tertiary')}
                    fontSize={11}
                    tickFormatter={createCompactAxisFormatter()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={colorVar('content-tertiary')}
                    fontSize={11}
                    width={90}
                    tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatRupiah(value), 'Pengeluaran']}
                    contentStyle={{
                      backgroundColor: colorVar('bg-elevated'),
                      border: `1px solid ${colorVar('border-neutral')}`,
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="spent" radius={[0, 4, 4, 0]} isAnimationActive={!prefersReduced}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Category List */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader>
            <CardTitle className={cn('text-base sm:text-lg', textColorVar('content-primary'))}>
              Detail Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className={cn('text-sm text-center py-12', textColorVar('content-tertiary'))}>
                Belum ada pengeluaran untuk bulan ini
              </p>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {categoryData.map((cat, idx) => {
                    const pct = (cat.spent / maxSpent) * 100;
                    const isExpanded = expandedCategory === cat.name;
                    const catTransactions = isExpanded ? expandedTransactions : [];

                    return (
                      <motion.div
                        key={cat.name}
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ delay: prefersReduced ? 0 : idx * 0.05 }}
                        className="space-y-0 rounded-lg border border-[var(--color-border-neutral)] overflow-hidden bg-[var(--color-bg-screen)]"
                      >
                        {/* Category Header Row */}
                        <div className="p-3 flex items-center justify-between group hover:bg-[var(--color-bg-neutral)]/50 transition-colors">
                          <div
                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleCategoryClick(cat.name)}
                          >
                            <span className="text-lg sm:text-xl flex-shrink-0">{cat.emoji}</span>
                            <span className="text-base sm:text-sm font-semibold text-[var(--color-content-primary)] truncate">
                              {cat.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <div
                              className="font-mono text-xs sm:text-[11px] px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: `${cat.color}20`,
                                color: cat.color,
                              }}
                            >
                              <PrivacyAmount value={formatRupiah(cat.spent)} />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(cat.name);
                              }}
                              className="p-1 rounded-lg hover:bg-[var(--color-bg-screen)] transition-colors flex-shrink-0"
                              title={isExpanded ? 'Tutup' : 'Buka'}
                            >
                              <ChevronDown
                                className={cn(
                                  'w-4 h-4 transition-transform',
                                  isExpanded && 'rotate-180',
                                  'text-[var(--color-content-tertiary)]'
                                )}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="px-3 pb-2">
                          <div className="w-full h-2 bg-[var(--color-bg-neutral)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }}
                            />
                          </div>
                        </div>

                        {/* Expandable Transactions */}
                        <AnimatePresence>
                          {isExpanded && catTransactions.length > 0 && (
                            <motion.div
                              initial={prefersReduced ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
                              animate={prefersReduced ? { opacity: 1, height: 'auto' } : { opacity: 1, height: 'auto' }}
                              exit={prefersReduced ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="border-t border-[var(--color-border-neutral)] bg-[var(--color-bg-card)]"
                            >
                              <div className="p-3 space-y-2">
                                {catTransactions.map((tx) => (
                                  <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-screen)]">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-[var(--color-content-primary)] truncate">
                                        {tx.note || tx.category}
                                      </p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-[var(--color-content-tertiary)]">
                                          {new Date(tx.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                                        </span>
                                        {tx.wallet_id && (
                                          <span className="text-xs text-[var(--color-content-tertiary)] px-1.5 py-0.5 rounded bg-[var(--color-bg-neutral)]">
                                            Dompet
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="font-mono text-xs font-semibold text-[var(--color-sentiment-negative)] ml-2 flex-shrink-0">
                                      <PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <CategoryDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCategory(null);
          }}
          category={selectedCategory}
          stats={categoryStats}
          isLoading={categoryLoading}
          totalSpending={expenses}
        />
      )}
    </motion.div>
  );
}
