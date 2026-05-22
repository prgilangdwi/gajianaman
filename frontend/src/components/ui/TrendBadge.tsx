import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

const trendBadgeVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-xs font-medium',
  {
    variants: {
      sentiment: {
        positive:
          'bg-[var(--color-sentiment-positive-bg)] text-[var(--color-sentiment-positive)]',
        negative:
          'bg-[var(--color-sentiment-negative-bg)] text-[var(--color-sentiment-negative)]',
        neutral: 'bg-[var(--color-bg-neutral)] text-[var(--color-content-secondary)]',
      },
    },
    defaultVariants: {
      sentiment: 'neutral',
    },
  }
);

interface TrendBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof trendBadgeVariants> {
  value?: number;
  trend: 'up' | 'down' | 'stable';
  label?: string;
  showIcon?: boolean;
}

const TrendBadge = React.forwardRef<HTMLDivElement, TrendBadgeProps>(
  (
    { className, value, trend, label, showIcon = true, sentiment, ...props },
    ref
  ) => {
    // Determine sentiment based on trend if not explicitly provided
    const determinedSentiment =
      sentiment ||
      (trend === 'up' ? 'positive' : trend === 'down' ? 'negative' : 'neutral');

    const getIcon = () => {
      if (!showIcon) return null;
      const iconProps = {
        className: 'w-3.5 h-3.5 flex-shrink-0',
        'aria-hidden': 'true' as const,
      };
      switch (trend) {
        case 'up':
          return <TrendingUp {...iconProps} />;
        case 'down':
          return <TrendingDown {...iconProps} />;
        case 'stable':
          return <Minus {...iconProps} />;
        default:
          return null;
      }
    };

    const displayText = label || (value ? `${value > 0 ? '+' : ''}${value}%` : '');

    return (
      <div
        ref={ref}
        className={cn(trendBadgeVariants({ sentiment: determinedSentiment, className }))}
        role="status"
        aria-label={`Trend: ${trend}${displayText ? `, ${displayText}` : ''}`}
        {...props}
      >
        {getIcon()}
        {displayText && <span className="font-mono">{displayText}</span>}
      </div>
    );
  }
);

TrendBadge.displayName = 'TrendBadge';

export { TrendBadge, trendBadgeVariants };
export type { TrendBadgeProps };
