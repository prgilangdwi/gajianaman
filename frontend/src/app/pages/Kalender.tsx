import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useAuth } from '@/hooks/useAuth';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { formatRupiah } from '@/lib/utils';
import { AlertCircle, Check } from 'lucide-react';
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
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId } = useWalletFilter();
  const { transactions, isLoading } = useTransactions(month, year);
  const { recurringBills = [] } = useRecurringBills();
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

  // Calculate bill due dates for this month
  const billDueDates = useMemo(() => {
    const dueDates: Record<string, string[]> = {};
    recurringBills.forEach((bill) => {
      if (!bill.next_due_date) return;
      const dueDate = new Date(bill.next_due_date);
      // Only show bills due in the current month
      if (dueDate.getMonth() === month - 1 && dueDate.getFullYear() === year) {
        const dateStr = dueDate.toISOString().split('T')[0];
        if (!dueDates[dateStr]) dueDates[dateStr] = [];
        dueDates[dateStr].push(bill.description || 'Tagihan');
      }
    });
    return dueDates;
  }, [recurringBills, month, year]);

  // Payday indicator (if user has set a payday_date in Gajian settings)
  // This would be user.payday_date from user settings
  const paydayDate = useMemo(() => {
    if (!user?.payday_date) return null;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(user.payday_date).padStart(2, '0')}`;
    return dateStr;
  }, [user?.payday_date, month, year]);

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startOffset = firstDay.getDay(); // 0=Sun
  const cells: Array<number | null> = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
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
              const hasTransactions = !!byDate[dateStr];
              const bills = billDueDates[dateStr] || [];
              const isPayday = paydayDate === dateStr;
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
                    ${isPayday ? 'ring-2 ring-green-500/50' : ''}
                    hover:border-primary/50
                  `}
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-sm sm:text-xs font-bold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {day}
                    </span>
                    {/* Indicators badge */}
                    {(isPayday || bills.length > 0 || hasTransactions) && (
                      <div className="flex gap-0.5">
                        {isPayday && (
                          <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center" title="Hari Gajian">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {bills.length > 0 && (
                          <div className="w-3 h-3 rounded-full bg-orange-500 flex items-center justify-center" title={`${bills.length} tagihan`}>
                            <AlertCircle className="w-2 h-2 text-white" />
                          </div>
                        )}
                        {hasTransactions && !isPayday && !bills.length && (
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Ada transaksi" />
                        )}
                      </div>
                    )}
                  </div>
                  {expense > 0 && (
                    <p className="text-[10px] sm:text-[9px] font-mono text-muted-foreground leading-tight mt-0.5 truncate">
                      {formatRupiah(expense).replace('Rp ', '')}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Summary row */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-base sm:text-sm text-muted-foreground">
            <span>Total bulan ini: <span className="font-semibold text-foreground">{formatRupiah(totalMonth)}</span></span>
            {worstDate && <span>Hari termahal: <span className="font-semibold text-foreground">Tgl {new Date(worstDate + 'T00:00:00').getDate()} ({formatRupiah(worstAmount)})</span></span>}
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
                <div key={t.id} className="flex items-center justify-between py-3 sm:py-2 min-h-[48px] sm:min-h-auto border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-base sm:text-sm font-medium truncate">{t.category}</p>
                    {t.note && <p className="text-xs text-muted-foreground truncate">{t.note}</p>}
                  </div>
                  <span className={`text-base sm:text-sm font-mono font-semibold ml-2 flex-shrink-0 ${t.type === 'expense' ? 'text-red-500' : 'text-green-600'}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatRupiah(Number(t.amount))}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Heat Map (Pengeluaran):</p>
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border" /> Tidak ada</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100" /> {'<'} Rp 100rb</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100" /> Rp 100–500rb</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> {'>'} Rp 500rb</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Indikator:</p>
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> Hari Gajian</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500" /> Tagihan Jatuh</span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Ada Transaksi</span>
          </div>
        </div>
      </div>
    </div>
  );
}
