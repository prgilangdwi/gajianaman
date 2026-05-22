import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressBarVariants = cva('w-full h-[var(--space-3)] rounded-[var(--radius-full)] overflow-hidden', {
  variants: {
    status: {
      safe: 'bg-[var(--color-sentiment-positive-bg)]',
      warning: 'bg-[var(--color-sentiment-warning-bg)]',
      over: 'bg-[var(--color-sentiment-negative-bg)]',
      none: 'bg-[var(--color-bg-neutral)]',
    },
  },
  defaultVariants: {
    status: 'safe',
  },
});

const progressFillVariants = cva('h-full rounded-[var(--radius-full)] transition-[width] duration-300', {
  variants: {
    status: {
      safe: 'bg-[var(--color-sentiment-positive)]',
      warning: 'bg-[var(--color-sentiment-warning)]',
      over: 'bg-[var(--color-sentiment-negative)]',
      none: 'bg-[var(--color-content-tertiary)]',
    },
  },
  defaultVariants: {
    status: 'safe',
  },
});

interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressBarVariants> {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  showLabel?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      progress,
      status = 'safe',
      label,
      showPercentage = false,
      showLabel = true,
      ...props
    },
    ref
  ) => {
    // Clamp progress between 0-100
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    // Determine status if not explicitly set
    let determinedStatus = status;
    if (!status || status === 'none') {
      if (clampedProgress <= 70) determinedStatus = 'safe';
      else if (clampedProgress <= 100) determinedStatus = 'warning';
      else determinedStatus = 'over';
    }

    return (
      <div {...props}>
        {(showLabel || showPercentage) && (
          <div className="flex items-center justify-between gap-2 mb-[var(--space-2)]">
            {showLabel && label && (
              <span className="text-[var(--text-caption)] text-[var(--color-content-secondary)] font-medium">
                {label}
              </span>
            )}
            {showPercentage && (
              <span className="text-[var(--text-caption)] font-mono text-[var(--color-content-secondary)]">
                {clampedProgress}%
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={cn(progressBarVariants({ status: determinedStatus, className }))}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label || `Progress: ${clampedProgress}%`}
        >
          <div
            className={progressFillVariants({ status: determinedStatus })}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar, progressBarVariants, progressFillVariants };
export type { ProgressBarProps };
