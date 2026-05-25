import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useDashboardData } from '@/hooks/data/useDashboardData';
import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { MetricCard } from '@/components/ui/MetricCard';
import {
  StatCard,
  ChartCard,
  InsightCard,
  QuickActions,
  DashboardSkeleton,
  CollapsibleSection,
} from '@/app/components/dashboard';
import ChartInsight from '@/app/components/ChartInsight';
import { formatRupiah, cn, bgColorVar, textColorVar } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

export default function Overview() {
  const { month, year } = useMonthFilter();
  const { setWalletId } = useWalletFilter();
  const prefersReduced = useReducedMotion();
  const { user } = useAuth();
  const { wallets = [] } = useWallets(user?.userId);

  const data = useDashboardData();
  const { transactions } = useTransactions(month, year);
  const [chartInsight, setChartInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const ringkasanCepat = useMemo(() => {
    const monthTx = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month - 1 && d.getFullYear() === year && t.type === 'expense';
    });
    if (monthTx.length === 0) return null;

    const dailySpending: Record<string, number> = {};
    monthTx.forEach((t) => {
      const key = new Date(t.date).toISOString().split('T')[0];
      dailySpending[key] = (dailySpending[key] ?? 0) + Number(t.amount);
    });
    const dailyValues = Object.entries(dailySpending);
    const totalSpending = dailyValues.reduce((s, [, v]) => s + v, 0);
    const avgDailySpending = totalSpending / 30;
    const busiestEntry = dailyValues.reduce((max, curr) => curr[1] > max[1] ? curr : max);
    const busiestDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date(busiestEntry[0]));
    const daysWithoutSpending = 30 - dailyValues.length;
    const mean = totalSpending / dailyValues.length;
    const variance = dailyValues.reduce((s, [, v]) => s + Math.pow(v - mean, 2), 0) / dailyValues.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    const spendingConsistency = Math.max(0, Math.round(100 - cv * 50));
    const walletSpending: Record<string, number> = {};
    monthTx.forEach((t) => {
      if (t.wallet_id) {
        const name = wallets.find((w) => w.id === t.wallet_id)?.name ?? 'Unknown';
        walletSpending[name] = (walletSpending[name] ?? 0) + Number(t.amount);
      }
    });
    const topWallet = Object.entries(walletSpending).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { avgDailySpending, busiestDay, totalTransactions: monthTx.length, daysWithoutSpending, spendingConsistency, topWallet };
  }, [transactions, month, year, wallets]);

  useEffect(() => {
    const generateInsight = async () => {
      if (!transactions || transactions.length === 0) return;

      setInsightLoading(true);
      try {
        const response = await fetch('/api/ask-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: 'Analisis ringkas pola pengeluaran saya bulan ini. Fokus pada kategori terbesar, tren pengeluaran, dan saran penghematan praktis.',
            transactions,
            month,
            year,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setChartInsight(result.response);
        }
      } catch (error) {
        console.error('Failed to generate chart insight:', error);
      } finally {
        setInsightLoading(false);
      }
    };

    generateInsight();
  }, [transactions, month, year]);

  // Loading state
  if (data.isLoading) {
    return <DashboardSkeleton />;
  }

  // Empty state
  if (data.isEmpty) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
        animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
        transition={pageEnter.transition}
        className="flex flex-col items-center justify-center py-16 text-center space-y-4"
      >
        <div className="text-5xl">📊</div>
        <div>
          <h2 className={cn('text-lg font-semibold mb-1', textColorVar('content-primary'))}>
            Dashboard Kosong
          </h2>
          <p className={cn('text-sm mb-6', textColorVar('content-tertiary'))}>
            Mulai dengan menambahkan transaksi pertama Anda untuk melihat ringkasan keuangan.
          </p>
          <button
            type="button"
            onClick={() => setWalletId('all')}
            className="px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] text-sm font-medium"
          >
            Tambah Transaksi
          </button>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (data.error) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
        animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
        transition={pageEnter.transition}
        className="flex flex-col items-center justify-center py-16 text-center space-y-4"
      >
        <div className="text-5xl">⚠️</div>
        <div>
          <h2 className={cn('text-lg font-semibold mb-1', textColorVar('content-primary'))}>
            Gagal memuat dashboard
          </h2>
          <p className={cn('text-sm mb-6', textColorVar('content-tertiary'))}>
            {data.error.message || 'Terjadi kesalahan. Silakan coba lagi.'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] text-sm font-medium"
          >
            Coba Lagi
          </button>
        </div>
      </motion.div>
    );
  }

  // Main dashboard content
  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-5"
    >
      {/* 1. Greeting + QuickActions */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
        className="space-y-3"
      >
        <div>
          <h1 className={cn('text-xl font-bold', textColorVar('content-primary'))}>
            {data.greeting}, {data.user?.name?.split(' ')[0] ?? 'Kamu'}
          </h1>
          <p className={cn('text-sm', textColorVar('content-tertiary'))}>
            {format(new Date(year, month - 1), 'MMMM yyyy', { locale: idLocale })}
          </p>
        </div>
        <QuickActions onAddTransaction={() => setWalletId('all')} />
      </motion.div>

      {/* 2. Hero Balance Card */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <StatCard
          variant="hero"
          icon={null}
          label="Saldo Bulan Ini"
          value={formatRupiah(data.balance)}
          trend={
            data.balance >= 0
              ? { direction: 'up' as const, value: `+${formatRupiah(data.availableToSpend)}` }
              : undefined
          }
        />
      </motion.div>

      {/* 3. Status Row: Income / Spent / Available */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <StatCard
          variant="default"
 icon={<TrendingUp className="size-4 " />}
          label="Pemasukan"
          value={formatRupiah(data.income)}
          className={cn(textColorVar('sentiment-positive'))}
        />
        <StatCard
          variant="default"
 icon={<TrendingDown className="size-4 " />}
          label="Pengeluaran"
          value={formatRupiah(data.expenses)}
          className={cn(textColorVar('sentiment-negative'))}
        />
        <StatCard
          variant="default"
          icon={null}
          label="Tersisa"
          value={formatRupiah(Math.max(0, data.availableToSpend))}
          className={cn(data.availableToSpend < 0 ? textColorVar('sentiment-negative') : textColorVar('sentiment-positive'))}
        />
      </motion.div>

      {/* 4. Ringkasan Cepat */}
      {ringkasanCepat && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
          className="space-y-3"
        >
          <div>
            <h2 className={cn('text-base font-semibold', textColorVar('content-primary'))}>⚡ Ringkasan Cepat</h2>
            <p className={cn('text-xs', textColorVar('content-tertiary'))}>Snapshot kinerja finansial bulan ini</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard label="Rata-rata per hari" value={formatRupiah(Math.round(ringkasanCepat.avgDailySpending))} icon="📊" subtext={`dari ${ringkasanCepat.totalTransactions} transaksi`} variant="default" />
            <MetricCard label="Hari terboros" value={ringkasanCepat.busiestDay} icon="🔥" subtext="Paling banyak pengeluaran" variant="warning" />
            <MetricCard label="Hari tanpa pengeluaran" value={ringkasanCepat.daysWithoutSpending.toString()} icon="✨" subtext="dari 30 hari" variant="success" />
            <MetricCard label="Total transaksi" value={ringkasanCepat.totalTransactions.toString()} icon="💳" subtext="bulan ini" variant="default" />
            <MetricCard label="Konsistensi" value={`${ringkasanCepat.spendingConsistency}%`} icon="📈" subtext="Semakin tinggi = makin konsisten" variant="default" />
            <MetricCard label="Dompet utama" value={ringkasanCepat.topWallet} icon="👛" subtext="Pengeluaran terbanyak" variant="default" />
          </div>
        </motion.div>
      )}

      {/* 5. AI Quick Insight */}
      {data.aiInsights && data.aiInsights.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <InsightCard
            severity={data.aiInsights[0].severity}
            emoji={data.aiInsights[0].emoji}
            title={data.aiInsights[0].title}
            body={data.aiInsights[0].body}
          />
        </motion.div>
      )}

      {/* 5. Spending Breakdown (Collapsible Chart) */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <CollapsibleSection title="Grafik Pengeluaran" defaultOpen={true}>
          <ChartCard
            title="Tren Mingguan"
            subtitle="Income vs Expense"
            isEmpty={!data.weeklyChartData.some(d => d.income > 0 || d.expense > 0)}
          >
            {data.weeklyChartData.some(d => d.income > 0 || d.expense > 0) && (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.weeklyChartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sentiment-positive)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-sentiment-positive)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-sentiment-negative)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-sentiment-negative)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" stroke="var(--color-content-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--color-content-tertiary)" fontSize={12} tickFormatter={createCompactAxisFormatter()} />
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ backgroundColor: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-neutral)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="income" stroke="var(--color-sentiment-positive)" strokeWidth={2} fill="url(#colorIncome)" name="Income" isAnimationActive={!prefersReduced} />
                  <Area type="monotone" dataKey="expense" stroke="var(--color-sentiment-negative)" strokeWidth={2} fill="url(#colorExpense)" name="Expense" isAnimationActive={!prefersReduced} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </CollapsibleSection>
      </motion.div>

      {/* 5.5. Chart Insight */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <ChartInsight
          insight={chartInsight || undefined}
          icon="📊"
          loading={insightLoading}
          error={!insightLoading && !chartInsight}
        />
      </motion.div>

      {/* 6. Top 3 Categories */}
      {data.topCategories.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <CollapsibleSection
            title="Kategori Teratas"
            count={data.topCategories.length}
            defaultOpen={true}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              {data.topCategories.map((cat) => (
                <StatCard
                  key={cat.category}
                  variant="compact"
                  icon={<span className="text-lg">{cat.emoji}</span>}
                  label={cat.category}
                  value={formatRupiah(cat.amount)}
                  className={cn('text-xs')}
                />
              ))}
            </div>
          </CollapsibleSection>
        </motion.div>
      )}

      {/* 7. Goals Progress */}
      {data.activeGoals.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <CollapsibleSection
            title="Tujuan Keuangan"
            count={data.activeGoals.length}
            defaultOpen={false}
          >
            <div className="space-y-3 pt-3">
              {data.activeGoals.map((goal) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                      {goal.name}
                    </p>
                    <p className={cn('text-xs font-mono', textColorVar('content-secondary'))}>
                      {Math.round(goal.progress)}%
                    </p>
                  </div>
                  <div className={cn('w-full h-2 rounded-full', bgColorVar('bg-neutral'))}>
                    <div
                      className="h-full rounded-full bg-[var(--color-brand-primary)]"
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </motion.div>
      )}

      {/* 8. Upcoming Bills */}
      {data.upcomingBills && data.upcomingBills.length > 0 && (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <CollapsibleSection
            title="Tagihan Mendatang"
            count={data.upcomingBills.length}
            defaultOpen={false}
          >
            <div className="space-y-2 pt-3">
              {data.upcomingBills.slice(0, 5).map((bill) => (
                <div
                  key={bill.id}
                  className={cn('p-3 rounded-lg border flex justify-between items-center', bgColorVar('bg-screen'), borderColorVar('border-neutral'))}
                >
                  <div className="min-w-0">
                    <p className={cn('text-sm font-medium truncate', textColorVar('content-primary'))}>
                      {bill.name}
                    </p>
                    <p className={cn('text-xs', textColorVar('content-tertiary'))}>
                      Jatuh tempo: {bill.due_date ? format(new Date(bill.due_date), 'dd MMM', { locale: idLocale }) : 'Belum diatur'}
                    </p>
                  </div>
                  <p className="font-mono font-semibold text-sm flex-shrink-0 ml-2">
                    {formatRupiah(Number(bill.amount))}
                  </p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </motion.div>
      )}
    </motion.div>
  );
}
