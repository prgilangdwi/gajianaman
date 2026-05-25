import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, ChevronDown } from 'lucide-react';
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
import { TextPositive } from '../components/Markup';
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
 <div className={cn('size-10 rounded-full animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
        <div className="space-y-1 flex-1">
          <div className={cn('h-4 w-28 rounded animate-pulse', bgColorVar('bg-neutral'))} />
          <div className={cn('h-3 w-16 rounded animate-pulse', bgColorVar('bg-neutral'))} />
        </div>
      </div>
      <div className={cn('h-4 w-20 rounded animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
    </div>
  );
}

export default function Pemasukan() {
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

  // Filter for income transactions only
  const incomeTransactions = filteredTransactions.filter((t) => t.type === 'income');
  const { totalExpenses: income = 0, categoryData = [], maxSpent = 1 } = useWalletStats(incomeTransactions);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Screen state: loading, error, empty, or loaded
  const screenState = useScreenState({
    isLoading,
    error: error || null,
    isEmpty: incomeTransactions.length === 0,
  });

  const { stats: categoryStats, isLoading: categoryLoading } = useCategoryTransactions(
    selectedCategory || '',
    month,
    year,
    income
  );

  // Get last 5 transactions for expanded category
  const expandedTransactions = useMemo(() => {
    if (!expandedCategory) return [];
    return incomeTransactions
      .filter((t) => t.category === expandedCategory && t.type === 'income')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expandedCategory, incomeTransactions]);

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
        title="Gagal memuat pemasukan"
        message={screenState.error.message || 'Terjadi kesalahan saat mengambil data pemasukan.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show loading state while fetching data
  if (screenState.isLoading) {
    return <LoadingState count={3} type="card" />;
  }

  // Show empty state if no income this month
  if (screenState.isEmpty) {
    return (
      <EmptyState
        title="Belum ada pemasukan"
        message="Anda belum mencatat pemasukan untuk bulan ini. Mulai dengan menambahkan transaksi pertama."
        actionLabel="Tambah Pemasukan"
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
                Total Pemasukan
              </CardTitle>
 <TrendingUp className={cn('size-4 ', textColorVar('sentiment-positive'))} />
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-xl md:text-2xl">
                <TextPositive>
                  <PrivacyAmount value={formatRupiah(income)} />
                </TextPositive>
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
                Pemasukan per Kategori
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(categoryData.length * 40, 120)} role="img" aria-label="Pemasukan bulanan berdasarkan kategori">
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
                    formatter={(value: any) => formatRupiah(value as number)}
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-neutral)',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'var(--color-content-primary)' }}
                  />
                  <Bar dataKey="spent" radius={[0, 6, 6, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Categories List */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader>
            <CardTitle className={cn('text-base sm:text-lg', textColorVar('content-primary'))}>
              Daftar Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              <AnimatePresence mode="popLayout">
                {categoryData.map((cat, idx) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: prefersReduced ? 0 : idx * 0.02 }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(cat.name)}
                      className={cn(
                        'w-full flex items-center justify-between py-4 px-3 border-b rounded-lg transition-colors hover:bg-[var(--color-bg-elevated)]',
                        borderColorVar('border-neutral'),
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-primary)]'
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                        <div className="text-left min-w-0">
                          <p className={cn('font-medium', textColorVar('content-primary'))}>
                            {cat.name}
                          </p>
                          <p className={cn('text-sm', textColorVar('content-tertiary'))}>
                            {formatRupiah(cat.spent)}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedCategory === cat.name ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
 <ChevronDown className={cn('size-4 ', textColorVar('content-tertiary'))} />
                      </motion.div>
                    </button>

                    {/* Expanded Transaction List */}
                    <AnimatePresence>
                      {expandedCategory === cat.name && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-[var(--color-bg-screen)] border-b"
                        >
                          <div className="p-3 space-y-2">
                            {categoryLoading ? (
                              Array(3)
                                .fill(null)
                                .map((_, i) => <SkeletonRow key={i} />)
                            ) : expandedTransactions.length > 0 ? (
                              expandedTransactions.map((t) => (
                                <div
                                  key={t.id}
                                  className={cn('flex items-center justify-between py-3 text-sm border-b last:border-0', borderColorVar('border-neutral'))}
                                >
                                  <div>
                                    <p className={cn('font-medium', textColorVar('content-primary'))}>
                                      {t.note || t.category}
                                    </p>
                                    <p className={cn('text-xs', textColorVar('content-tertiary'))}>
                                      {new Date(t.date).toLocaleDateString('id-ID')}
                                    </p>
                                  </div>
                                  <TextPositive>
                                    <p className="font-mono font-semibold">
                                      <PrivacyAmount value={formatRupiah(t.amount)} />
                                    </p>
                                  </TextPositive>
                                </div>
                              ))
                            ) : (
                              <p className={cn('py-2 text-sm text-center', textColorVar('content-tertiary'))}>
                                Tidak ada transaksi
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Detail Modal */}
      <CategoryDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        categoryName={selectedCategory || ''}
        isLoading={categoryLoading}
        stats={categoryStats}
      />
    </motion.div>
  );
}
