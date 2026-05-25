import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { cn, bgColorVar, textColorVar, borderColorVar, formatRupiah } from '@/lib/utils';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

export default function PolaWaktu() {
  const { month, year, setMonth, setYear } = useMonthFilter();
  const { transactions } = useTransactions();
  const prefersReduced = useReducedMotion();
  const [calendarMonth, setCalendarMonth] = useState({ month, year });

  const dailyBreakdown = useMemo(() => {
    if (!transactions) return {};

    const breakdown: Record<string, { total: number; count: number }> = {};
    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getMonth() === calendarMonth.month - 1 && txDate.getFullYear() === calendarMonth.year) {
        const day = txDate.getDate();
        if (!breakdown[day]) breakdown[day] = { total: 0, count: 0 };
        breakdown[day].total += Number(tx.amount);
        breakdown[day].count += 1;
      }
    });
    return breakdown;
  }, [transactions, calendarMonth.month, calendarMonth.year]);

  const daysInMonth = new Date(calendarMonth.year, calendarMonth.month, 0).getDate();
  const firstDay = new Date(calendarMonth.year, calendarMonth.month - 1, 1).getDay();
  const monthName = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(calendarMonth.year, calendarMonth.month - 1)
  );

  const handlePrevMonth = () => {
    if (calendarMonth.month === 1) {
      setCalendarMonth({ month: 12, year: calendarMonth.year - 1 });
    } else {
      setCalendarMonth({ month: calendarMonth.month - 1, year: calendarMonth.year });
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth.month === 12) {
      setCalendarMonth({ month: 1, year: calendarMonth.year + 1 });
    } else {
      setCalendarMonth({ month: calendarMonth.month + 1, year: calendarMonth.year });
    }
  };

  const calendarDays = Array(firstDay)
    .fill(null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <h1 className={cn('text-3xl font-bold', textColorVar('content-primary'))}>📅 Pola Waktu</h1>
        <p className={cn('text-sm mt-1', textColorVar('content-tertiary'))}>
          Lihat pengeluaran harian Anda dan identifikasi pola pengeluaran
        </p>
      </motion.div>

      {/* Calendar */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          {/* Calendar Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className={textColorVar('content-primary')}>{monthName}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
 <ChevronLeft className="size-4 " />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
 <ChevronRight className="size-4 " />
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div
                  key={day}
                  className={cn('text-center text-xs font-semibold py-2', textColorVar('content-tertiary'))}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayData = day ? dailyBreakdown[day] : null;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'aspect-square rounded-lg p-2 text-xs flex flex-col items-center justify-center',
                      day
                        ? cn(
                            'border',
                            dayData
                              ? cn(bgColorVar('bg-elevated'), borderColorVar('border-neutral'))
                              : cn(bgColorVar('bg-screen'), borderColorVar('border-neutral'))
                          )
                        : ''
                    )}
                  >
                    {day && (
                      <>
                        <span className={cn('font-medium mb-0.5', textColorVar('content-tertiary'))}>
                          {day}
                        </span>
                        {dayData && (
                          <>
                            <span className={cn('font-semibold text-xs leading-tight', textColorVar('content-primary'))}>
                              {formatRupiah(dayData.total).replace('Rp ', '').substring(0, 8)}
                            </span>
                            <span className={cn('text-xs', textColorVar('content-tertiary'))}>
                              ({dayData.count})
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
        className={cn('p-4 rounded-lg', bgColorVar('bg-screen'))}
      >
        <p className={cn('text-sm font-medium', textColorVar('content-primary'))}>Format Kalender</p>
        <p className={cn('text-xs mt-2', textColorVar('content-secondary'))}>
          Setiap hari menampilkan jumlah rupiah yang dibelanjakan dan jumlah transaksi dalam kurung (N)
        </p>
      </motion.div>
    </motion.div>
  );
}
