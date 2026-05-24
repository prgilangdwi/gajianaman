import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { RecurringTransaction } from '@/lib/supabase';

interface UpcomingBillsWidgetProps {
  recurringBills: RecurringTransaction[];
  isLoading: boolean;
}

export function UpcomingBillsWidget({ recurringBills, isLoading }: UpcomingBillsWidgetProps) {
  const upcomingBills = useMemo(() => {
    const now = new Date();
    return recurringBills
      .filter((bill) => {
        if (!bill.next_due_date) return false;
        const dueDate = new Date(bill.next_due_date);
        const daysUntilDue = differenceInDays(dueDate, now);
        return daysUntilDue >= 0 && daysUntilDue <= 30;
      })
      .sort((a, b) => {
        const dateA = new Date(a.next_due_date || '');
        const dateB = new Date(b.next_due_date || '');
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3);
  }, [recurringBills]);

  const totalUpcoming = useMemo(() => {
    return upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);
  }, [upcomingBills]);

  if (!recurringBills.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
 <Calendar className="size-5 " />
          Tagihan Mendatang
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Memuat…</p>
        ) : upcomingBills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Tidak ada tagihan mendatang</p>
        ) : (
          <>
            {/* Bills List */}
            <div className="space-y-2">
              {upcomingBills.map((bill) => {
                const daysUntilDue = differenceInDays(new Date(bill.next_due_date || ''), new Date());
                const isUrgent = daysUntilDue <= 3;

                return (
                  <div
                    key={bill.id}
                    className={cn(
                      'flex items-center justify-between p-2.5 rounded-lg border',
                      isUrgent
                        ? cn(bgColorVar('sentiment-negative-bg'), borderColorVar('border-neutral'))
                        : 'bg-muted/50 border-transparent'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{bill.description}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
 <Clock className="size-3 " />
                        <span>
                          {daysUntilDue === 0
                            ? 'Hari ini'
                            : daysUntilDue === 1
                            ? 'Besok'
                            : `${daysUntilDue} hari lagi`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className="font-['DM_Mono'] font-semibold text-sm whitespace-nowrap">
                        {formatRupiah(bill.amount)}
                      </span>
                      {isUrgent && (
 <AlertCircle className={cn('size-4 flex-shrink-0', textColorVar('sentiment-negative'))} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total 30 hari ke depan</span>
              <span className="font-['DM_Mono'] font-bold">
                {formatRupiah(totalUpcoming)}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
