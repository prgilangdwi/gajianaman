import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import { ErrorState, EmptyState, LoadingState } from '../components/ScreenStates';

interface WeeklyBreakdown {
  week: string;
  total: number;
  count: number;
  transactions: Array<{ id: string; date: string; amount: number; note: string }>;
}

interface MonthlyBreakdown {
  month: string;
  total: number;
  count: number;
  transactions: Array<{ id: string; date: string; amount: number; note: string }>;
}

export default function DetailKategori() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { month, year } = useMonthFilter();
  const { walletId } = useWalletFilter();
  const { transactions = [], isLoading, error } = useTransactions(month, year);
  const prefersReduced = useReducedMotion();
  const [viewPeriod, setViewPeriod] = useState<'weekly' | 'monthly'>('monthly');

  const decodedCategory = category ? decodeURIComponent(category) : '';

  const filteredTransactions = useMemo(() => {
    return (transactions ?? [])
      .filter((t) => t.category === decodedCategory && t.type === 'expense')
      .filter((t) => walletId === 'all' || t.wallet_id === walletId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, decodedCategory, walletId]);

  const categoryData = useMemo(() => {
    if (viewPeriod === 'monthly') {
      const byMonth: Record<string, MonthlyBreakdown> = {};

      filteredTransactions.forEach((tx) => {
        const date = new Date(tx.date);
        const monthKey = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        if (!byMonth[monthKey]) {
          byMonth[monthKey] = { month: monthKey, total: 0, count: 0, transactions: [] };
        }
        byMonth[monthKey].total += Number(tx.amount);
        byMonth[monthKey].count += 1;
        byMonth[monthKey].transactions.push({
          id: tx.id,
          date: tx.date,
          amount: Number(tx.amount),
          note: tx.note || tx.category,
        });
      });

      return Object.values(byMonth);
    } else {
      const byWeek: Record<string, WeeklyBreakdown> = {};
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      filteredTransactions.forEach((tx) => {
        const date = new Date(tx.date);
        const dayOfWeek = date.getDay();
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - dayOfWeek);

        const weekKey = `${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;

        if (!byWeek[weekKey]) {
          byWeek[weekKey] = { week: weekKey, total: 0, count: 0, transactions: [] };
        }
        byWeek[weekKey].total += Number(tx.amount);
        byWeek[weekKey].count += 1;
        byWeek[weekKey].transactions.push({
          id: tx.id,
          date: tx.date,
          amount: Number(tx.amount),
          note: tx.note || tx.category,
        });
      });

      return Object.values(byWeek).slice(0, 4);
    }
  }, [filteredTransactions, viewPeriod]);

  if (isLoading) {
    return <LoadingState count={3} type="card" />;
  }

  if (error) {
    return (
      <ErrorState
        title="Gagal memuat detail kategori"
        message={error || 'Terjadi kesalahan saat mengambil data.'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <EmptyState
        title="Belum ada transaksi"
        message={`Belum ada pengeluaran untuk kategori ${decodedCategory} pada bulan ini.`}
        actionLabel="Kembali"
        onAction={() => navigate('/pengeluaran')}
      />
    );
  }

  const totalSpent = filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const getCategoryEmoji = () => {
    const emojiMap: Record<string, string> = {
      'Food & Dining': '🍽️',
      'Groceries': '🛒',
      'Transport': '🚗',
      'Shopping': '🛍️',
      'Health': '🏥',
      'Entertainment': '🎬',
      'Bills & Utilities': '💡',
      'Education': '📚',
      'Personal Care': '💇',
      'Dining Out': '🍕',
    };
    return emojiMap[decodedCategory] || '💰';
  };

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-6"
    >
      {/* Header with Back Button */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
        className="flex items-center gap-3"
      >
        <button
          type="button"
          onClick={() => navigate('/pengeluaran')}
          className="p-2 rounded-lg hover:bg-[var(--color-bg-neutral)] transition-colors"
          title="Kembali"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={cn('text-3xl font-bold flex items-center gap-2', textColorVar('content-primary'))}>
            <span>{getCategoryEmoji()}</span>
            {decodedCategory}
          </h1>
          <p className={cn('text-sm mt-1', textColorVar('content-tertiary'))}>
            Detail pengeluaran per kategori
          </p>
        </div>
      </motion.div>

      {/* Total Spent Card */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className={cn('text-sm font-medium', textColorVar('content-secondary'))}>
                Total Pengeluaran {decodedCategory}
              </p>
              <p className={cn('text-3xl font-bold font-mono', textColorVar('sentiment-negative'))}>
                {formatRupiah(totalSpent)}
              </p>
              <p className={cn('text-xs', textColorVar('content-tertiary'))}>
                {filteredTransactions.length} transaksi
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Period Toggle */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <div className="flex gap-2">
          <Button
            variant={viewPeriod === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewPeriod('weekly')}
            className="text-xs"
          >
            Mingguan
          </Button>
          <Button
            variant={viewPeriod === 'monthly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewPeriod('monthly')}
            className="text-xs"
          >
            Bulanan
          </Button>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader>
            <CardTitle className={textColorVar('content-primary')}>
              Breakdown {viewPeriod === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((period, idx) => {
                const periodLabel = viewPeriod === 'weekly' ? period.week : period.month;
                const pct = (period.total / (Math.max(...categoryData.map((p) => p.total), 1))) * 100;

                return (
                  <div key={periodLabel} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                        {periodLabel}
                      </span>
                      <span className={cn('text-sm font-mono font-semibold', textColorVar('sentiment-negative'))}>
                        {formatRupiah(period.total)}
                      </span>
                    </div>
                    <div className={cn('w-full h-2 rounded-full', bgColorVar('bg-neutral'))}>
                      <div
                        className="h-full rounded-full bg-[var(--color-sentiment-negative)] transition-all"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className={cn('text-xs', textColorVar('content-tertiary'))}>
                      {period.count} transaksi
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader>
            <CardTitle className={textColorVar('content-primary')}>
              Daftar Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    bgColorVar('bg-screen'),
                    borderColorVar('border-neutral')
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', textColorVar('content-primary'))}>
                      {tx.note || tx.category}
                    </p>
                    <p className={cn('text-xs', textColorVar('content-tertiary'))}>
                      {new Date(tx.date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <p className={cn('font-mono font-semibold text-sm ml-3', textColorVar('sentiment-negative'))}>
                    -{formatRupiah(Number(tx.amount))}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
