import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { formatRupiah } from '@/lib/utils';

interface SpendingComparisonProps {
  currentMonth: number;
  previousMonth: number;
  monthLabel: string;
}

export function SpendingComparison({
  currentMonth,
  previousMonth,
  monthLabel,
}: SpendingComparisonProps) {
  const diff = currentMonth - previousMonth;
  const diffPercent = previousMonth > 0 ? (diff / previousMonth) * 100 : 0;
  const isHigher = diff > 0;
  const isEqual = Math.abs(diff) < 1;

  let trendLabel = 'Sama dengan bulan lalu';
  let trendColor = 'text-yellow-600';
  let trendIcon = <Minus className="w-5 h-5" />;

  if (isHigher) {
    trendLabel = `${Math.abs(diffPercent).toFixed(1)}% lebih tinggi`;
    trendColor = 'text-red-600';
    trendIcon = <TrendingUp className="w-5 h-5" />;
  } else if (!isEqual) {
    trendLabel = `${Math.abs(diffPercent).toFixed(1)}% lebih rendah`;
    trendColor = 'text-green-600';
    trendIcon = <TrendingDown className="w-5 h-5" />;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Perbandingan Pengeluaran</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Bulan ini ({monthLabel})</p>
            <p className="font-semibold text-lg">{formatRupiah(currentMonth)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Bulan lalu</p>
            <p className="font-semibold text-lg">{formatRupiah(previousMonth)}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 ${trendColor}`}>
          {trendIcon}
          <div className="flex-1">
            <p className="font-semibold text-sm">{trendLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Selisih: {isHigher ? '+' : ''}{formatRupiah(diff)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
