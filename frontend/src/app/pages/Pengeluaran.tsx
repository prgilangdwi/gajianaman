import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingDown, AlertCircle } from 'lucide-react';
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
import { formatRupiah, cn } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { CategoryDetailModal } from '../components/CategoryDetailModal';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TextNegative } from '../components/Markup';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

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
      className="px-3 py-2 rounded-lg border bg-[var(--color-bg-screen)] text-[var(--color-content-primary)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
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
    <div className="flex items-center justify-between py-4 sm:py-3 min-h-[56px] sm:min-h-auto border-b border-[var(--color-border-neutral)] last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-[var(--color-bg-neutral)] animate-pulse flex-shrink-0" />
        <div className="space-y-1 flex-1">
          <div className="h-4 w-28 bg-[var(--color-bg-neutral)] rounded animate-pulse" />
          <div className="h-3 w-16 bg-[var(--color-bg-neutral)] rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-20 bg-[var(--color-bg-neutral)] rounded animate-pulse flex-shrink-0" />
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

  const { stats: categoryStats, isLoading: categoryLoading } = useCategoryTransactions(
    selectedCategory || '',
    month,
    year,
    expenses
  );

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsModalOpen(true);
  };

  if (error) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <AlertCircle className="w-12 h-12 text-[var(--color-sentiment-negative)]" />
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-[var(--color-sentiment-negative)]">Gagal memuat data</p>
          <p className="text-sm text-[var(--color-content-tertiary)]">
            {error.message || 'Coba muat ulang halaman'}
          </p>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <Card key={i} className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
              <CardContent className="pt-6">
                <div className="h-4 bg-[var(--color-bg-neutral)] rounded animate-pulse w-24 mb-3" />
                <div className="h-8 bg-[var(--color-bg-neutral)] rounded animate-pulse w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            <div className="h-64 bg-[var(--color-bg-neutral)] rounded animate-pulse" />
          </CardContent>
        </Card>
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardContent className="pt-6">
            {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
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
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                Total Pengeluaran
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-[var(--color-sentiment-negative)]" />
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-xl md:text-2xl">
                <TextNegative>
                  <PrivacyAmount value={formatRupiah(expenses)} />
                </TextNegative>
              </div>
              <p className="text-xs text-[var(--color-content-tertiary)] mt-1">bulan ini</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                Kategori Teratas
              </CardTitle>
              <span className="text-xl">{categoryData[0] ? categoryData[0].emoji : '—'}</span>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-xl md:text-2xl text-[var(--color-content-primary)]">
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
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-[var(--color-content-primary)]">
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
                    stroke="var(--color-content-tertiary)"
                    fontSize={11}
                    tickFormatter={createCompactAxisFormatter()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--color-content-tertiary)"
                    fontSize={11}
                    width={90}
                    tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v)}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatRupiah(value), 'Pengeluaran']}
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-neutral)',
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
        <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg text-[var(--color-content-primary)]">
              Detail Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-[var(--color-content-tertiary)] text-center py-12">
                Belum ada pengeluaran untuk bulan ini
              </p>
            ) : (
              <div className="space-y-5">
                <AnimatePresence>
                  {categoryData.map((cat, idx) => {
                    const pct = (cat.spent / maxSpent) * 100;
                    return (
                      <motion.div
                        key={cat.name}
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                        transition={{ delay: prefersReduced ? 0 : idx * 0.05 }}
                        className="space-y-2 p-3 rounded-lg hover:bg-[var(--color-bg-screen)] transition-colors cursor-pointer"
                        onClick={() => handleCategoryClick(cat.name)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg sm:text-xl flex-shrink-0">{cat.emoji}</span>
                            <span className="text-base sm:text-sm font-semibold text-[var(--color-content-primary)] truncate">
                              {cat.name}
                            </span>
                          </div>
                          <div
                            className="font-mono text-xs sm:text-[11px] px-2 py-1 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: `${cat.color}20`,
                              color: cat.color,
                            }}
                          >
                            <PrivacyAmount value={formatRupiah(cat.spent)} />
                          </div>
                        </div>
                        <div className="w-full h-2 bg-[var(--color-bg-neutral)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color }}
                          />
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
