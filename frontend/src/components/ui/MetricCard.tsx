import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const metricCardVariants = cva(
  'rounded-[var(--radius-lg)] p-[var(--space-4)] shadow-[var(--shadow-card)] transition-shadow duration-300',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-bg-card)] hover:shadow-[var(--shadow-card-hover)]',
        elevated:
          'bg-[var(--color-bg-elevated)] hover:shadow-[var(--shadow-float)]',
        success: 'bg-[var(--color-sentiment-positive-bg)]',
        warning: 'bg-[var(--color-sentiment-warning-bg)]',
        error: 'bg-[var(--color-sentiment-negative-bg)]',
        neutral: 'bg-[var(--color-bg-neutral)]',
      },
      interactive: {
        true: 'cursor-pointer active:scale-95',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
    },
  }
);

interface MetricCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof metricCardVariants> {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  subtext?: React.ReactNode;
  trend?: React.ReactNode;
  textColor?: string;
  onClick?: () => void;
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      className,
      label,
      value,
      icon,
      subtext,
      trend,
      variant = 'default',
      interactive,
      textColor,
      onClick,
      ...props
    },
    ref
  ) => {
    // Determine text color based on variant if not provided
    const determinedTextColor =
      textColor ||
      {
        success: 'text-[var(--color-sentiment-positive)]',
        warning: 'text-[var(--color-sentiment-warning)]',
        error: 'text-[var(--color-sentiment-negative)]',
        neutral: 'text-[var(--color-content-secondary)]',
        default: 'text-[var(--color-content-primary)]',
        elevated: 'text-[var(--color-content-primary)]',
      }[variant as string];

    return (
      <div
        ref={ref}
        className={cn(
          metricCardVariants({
            variant,
            interactive: Boolean(onClick) || interactive,
            className,
          })
        )}
        role={onClick ? 'button' : 'region'}
        aria-label={label}
        tabIndex={onClick ? 0 : -1}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        {...props}
      >
        {/* Header: Icon + Label */}
        <div className="flex items-center justify-between gap-[var(--space-3)] mb-[var(--space-3)]">
          <span className="text-[var(--text-caption)] font-medium text-[var(--color-content-secondary)] uppercase tracking-tight">
            {label}
          </span>
          {icon && (
            <span className="text-xl flex-shrink-0" role="img" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>

        {/* Value */}
        <div className={cn('text-[var(--text-h2)] font-bold font-mono mb-[var(--space-2)]', determinedTextColor)}>
          {value}
        </div>

        {/* Subtext + Trend */}
        {(subtext || trend) && (
          <div className="flex items-center justify-between gap-[var(--space-2)]">
            {subtext && (
              <span className="text-[var(--text-caption)] text-[var(--color-content-tertiary)]">
                {subtext}
              </span>
            )}
            {trend && <div>{trend}</div>}
          </div>
        )}
      </div>
    );
  }
);

MetricCard.displayName = 'MetricCard';

export { MetricCard, metricCardVariants };
export type { MetricCardProps };
