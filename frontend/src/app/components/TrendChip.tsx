import { ArrowUpRight, TrendingDown } from 'lucide-react';
import { cn, bgColorVar, textColorVar } from '@/lib/utils';

interface TrendChipProps {
  current: number;
  previous: number;
}

export function TrendChip({ current, previous }: TrendChipProps) {
  if (previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  const isPositive = change > 0;

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
      isPositive
        ? bgColorVar('sentiment-positive-bg')
        : bgColorVar('sentiment-negative-bg')
    )}>
      {isPositive ? (
 <ArrowUpRight className="size-3 " />
      ) : (
 <TrendingDown className="size-3 " />
      )}
      <span className={isPositive ? textColorVar('sentiment-positive') : textColorVar('sentiment-negative')}>
        {Math.abs(change).toFixed(1)}%
      </span>
    </div>
  );
}
