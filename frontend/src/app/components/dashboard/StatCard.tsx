import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PrivacyAmount } from '../PrivacyAmount';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  valueClassName?: string;
  variant?: 'default' | 'hero' | 'compact';
  usePrivacy?: boolean;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  valueClassName,
  variant = 'default',
  usePrivacy = true,
}: StatCardProps) {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-card)] transition-shadow',
        'hover:shadow-[var(--shadow-card-hover)]',
        isHero ? 'p-5' : isCompact ? 'p-3' : 'p-4',
      )}
      role="group"
      aria-label={label}
    >
      {/* Icon + Label row */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('shrink-0', isHero ? 'text-lg' : 'text-sm')}>{icon}</span>
        <span
          className={cn(
            'font-medium truncate',
            isHero ? 'text-sm' : 'text-xs',
            textColorVar('content-secondary'),
          )}
        >
          {label}
        </span>
      </div>

      {/* Value */}
      <div
        className={cn(
          'font-mono font-bold',
          isHero ? 'text-2xl sm:text-3xl' : isCompact ? 'text-sm' : 'text-lg',
          valueClassName ?? textColorVar('content-primary'),
        )}
      >
        {usePrivacy ? <PrivacyAmount value={value} /> : value}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div
          className={cn(
            'flex items-center gap-1 mt-1.5',
            trend.direction === 'up' && textColorVar('sentiment-positive'),
            trend.direction === 'down' && textColorVar('sentiment-negative'),
            trend.direction === 'flat' && textColorVar('content-tertiary'),
          )}
        >
 {trend.direction === 'up' && <TrendingUp className="size-3 " />}
 {trend.direction === 'down' && <TrendingDown className="size-3 " />}
 {trend.direction === 'flat' && <Minus className="size-3 " />}
          <span className="text-[10px] font-medium">{trend.value}</span>
        </div>
      )}
    </div>
  );
}
