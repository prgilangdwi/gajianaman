import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { useLaporanData } from '@/hooks/data/useLaporanData';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar, colorVar } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { getCategoryMeta } from '@/lib/categoryMetadata';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TextPositive } from '../components/Markup';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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
    <div className={cn('flex items-center justify-between py-3 border-b last:border-0', borderColorVar('border-neutral'))}>
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

export default function Pemasukan() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId, setWalletId } = useWalletFilter();
  const { wallets = [] } = useWallets(user?.userId);
  const { transactions = [], isLoading, error } = useTransactions(month, year);
  const { monthlyData } = useLaporanData(user?.userId);
  const prefersReduced = useReducedMotion();

  const filteredTransactions = walletId === 'all'
    ? (transactions ?? [])
    : (transactions ?? []).filter((t) => t.wallet_id === walletId);

  const incomeTransactions = filteredTransactions.filter((t) => t.type === 'income');
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

  // Income by source/category
  const incomeBySource = useMemo(() => {
    const sources: Record<string, number> = {};
    incomeTransactions.forEach((t) => {
      sources[t.category] = (sources[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(sources)
      .map(([category, amount]) => {
        const meta = getCategoryMeta(category);
        return {
          name: category,
          amount,
          emoji: meta.emoji,
          color: meta.color,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [incomeTransactions]);

  // Last 6 months trend data
  const incomeTrend = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.slice(-6).map((m) => ({
      month: m.month,
      income: m.income || 0,
    }));
  }, [monthlyData]);

  // Average monthly income (last 6 months)
  const averageMonthlyIncome = useMemo(() => {
    if (incomeTrend.length === 0) return 0;
    const total = incomeTrend.reduce((sum, m) => sum + m.income, 0);
    return Math.round(total / incomeTrend.length);
  }, [incomeTrend]);

  // Month-over-month growth
  const momGrowth = useMemo(() => {
    if (incomeTrend.length < 2) return 0;
    const current = incomeTrend[incomeTrend.length - 1]?.income || 0;
    const previous = incomeTrend[incomeTrend.length - 2]?.income || 1;
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }, [incomeTrend]);

  // Income consistency score (lower stddev = higher consistency)
  const consistencyScore = useMemo(() => {
    if (incomeTrend.length <= 1) return 100;
    const incomes = incomeTrend.map((m) => m.income);
    const mean = incomes.reduce((a, b) => a + b) / incomes.length;
    if (mean === 0) return 0;
    const variance = incomes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / incomes.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation
    // Convert to consistency score: lower CV = higher score
    return Math.max(0, Math.round(100 - cv * 50));
  }, [incomeTrend]);

  // Pie chart data
  const pieData = incomeBySource.map((source) => ({
    name: source.name,
    value: source.amount,
    fill: source.color,
  }));

  if (error) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <AlertCircle className={cn('w-12 h-12', textColorVar('sentiment-negative'))} />
        <div className="text-center space-y-2">
          <p className={cn('text-lg font-semibold', textColorVar('sentiment-negative'))}>Gagal memuat data</p>
          <p className={cn('text-sm', textColorVar('content-tertiary'))}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
              <CardContent className="pt-6">
                <div className={cn('h-4 rounded animate-pulse w-24 mb-3', bgColorVar('bg-neutral'))} />
                <div className={cn('h-8 rounded animate-pulse w-36', bgColorVar('bg-neutral'))} />
              </CardContent>
            </Card>
          ))}
        </div>
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {/* Total Pemasukan */}
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
              <TrendingUp className={cn('h-4 w-4', textColorVar('sentiment-positive'))} />
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-xl md:text-2xl">
                <TextPositive>
                  <PrivacyAmount value={formatRupiah(totalIncome)} />
                </TextPositive>
              </div>
              <p className={cn('text-xs mt-1', textColorVar('content-tertiary'))}>bulan ini</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Average Monthly Income */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn('text-xs md:text-sm font-semibold', textColorVar('content-tertiary'))}>
                Rata-rata Bulanan
              </CardTitle>
              <span className="text-xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-xl md:text-2xl">
                <TextPositive>
                  <PrivacyAmount value={formatRupiah(averageMonthlyIncome)} />
                </TextPositive>
              </div>
              <p className={cn('text-xs mt-1', textColorVar('content-tertiary'))}>6 bulan terakhir</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* MoM Growth */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn('text-xs md:text-sm font-semibold', textColorVar('content-tertiary'))}>
                Pertumbuhan
              </CardTitle>
              <span className="text-xl">{momGrowth >= 0 ? '📈' : '📉'}</span>
            </CardHeader>
            <CardContent>
              <div className={cn(
                'font-mono font-bold text-xl md:text-2xl',
                momGrowth >= 0 ? textColorVar('sentiment-positive') : textColorVar('sentiment-negative')
              )}>
                {momGrowth > 0 ? '+' : ''}{momGrowth}%
              </div>
              <p className={cn('text-xs mt-1', textColorVar('content-tertiary'))}>bulan ke bulan</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Income Sources Count */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn('text-xs md:text-sm font-semibold', textColorVar('content-tertiary'))}>
                Sumber Pemasukan
              </CardTitle>
              <span className="text-xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className={cn('font-mono font-bold text-xl md:text-2xl', textColorVar('content-primary'))}>
                {incomeBySource.length}
              </div>
              <p className="text-xs text-[var(--color-content-tertiary)] mt-1">kategori aktif</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Income Trend Chart */}
      {incomeTrend.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg text-[var(--color-content-primary)]">
                Tren Pemasukan (6 Bulan)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={incomeTrend}>
                  <XAxis
                    dataKey="month"
                    stroke="var(--color-content-tertiary)"
                    fontSize={11}
                  />
                  <YAxis
                    stroke="var(--color-content-tertiary)"
                    fontSize={11}
                    tickFormatter={createCompactAxisFormatter()}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatRupiah(value), 'Pemasukan']}
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      border: '1px solid var(--color-border-neutral)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="income" fill="var(--color-sentiment-positive)" radius={[4, 4, 0, 0]} isAnimationActive={!prefersReduced} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Income Source Grid: Pie Chart + Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Source Pie Chart */}
        {incomeBySource.length > 0 && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
            animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
            transition={fadeUp.transition}
          >
            <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg text-[var(--color-content-primary)]">
                  Komposisi Sumber
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={!prefersReduced}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Income Consistency Score + Source List */}
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
          className="space-y-4"
        >
          {/* Consistency Score Card */}
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-[var(--color-content-primary)]">
                Stabilitas Pemasukan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative h-3 bg-[var(--color-bg-screen)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${consistencyScore}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-[var(--color-sentiment-positive)]"
                      />
                    </div>
                  </div>
                  <span className="font-mono font-bold text-lg text-[var(--color-content-primary)]">
                    {consistencyScore}%
                  </span>
                </div>
                <p className="text-xs text-[var(--color-content-tertiary)]">
                  {consistencyScore >= 80 ? 'Sangat stabil' :
                   consistencyScore >= 60 ? 'Cukup stabil' :
                   consistencyScore >= 40 ? 'Cukup variabel' :
                   'Sangat variabel'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Income Sources */}
          {incomeBySource.length > 0 && (
            <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-[var(--color-content-primary)]">
                  Detail Sumber
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {incomeBySource.map((source) => (
                    <div key={source.name} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-bg-screen)]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg flex-shrink-0">{source.emoji}</span>
                        <span className="text-sm font-medium text-[var(--color-content-primary)] truncate">
                          {source.name}
                        </span>
                      </div>
                      <div className="font-mono text-sm font-semibold text-[var(--color-sentiment-positive)] flex-shrink-0 ml-2">
                        <PrivacyAmount value={formatRupiah(source.amount)} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Recent Income Transactions */}
      {incomeTransactions.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg text-[var(--color-content-primary)]">
                Transaksi Pemasukan Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {incomeTransactions.slice(0, 10).map((tx, idx) => {
                    const meta = getCategoryMeta(tx.category);
                    return (
                      <motion.div
                        key={tx.id}
                        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                        animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        transition={{ delay: prefersReduced ? 0 : idx * 0.05 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-screen)] border border-[var(--color-border-neutral)]"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0">{meta.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-content-primary)] truncate">{tx.note || tx.category}</p>
                            <p className="text-xs text-[var(--color-content-tertiary)]">{format(new Date(tx.date), 'dd MMM yyyy', { locale: idLocale })}</p>
                          </div>
                        </div>
                        <div className="font-mono font-semibold text-sm flex-shrink-0 ml-2">
                          <TextPositive>
                            +<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
                          </TextPositive>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
              {incomeTransactions.length > 10 && (
                <div className="mt-4 text-center text-sm text-[var(--color-content-tertiary)]">
                  Menampilkan 10 dari {incomeTransactions.length} transaksi
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
