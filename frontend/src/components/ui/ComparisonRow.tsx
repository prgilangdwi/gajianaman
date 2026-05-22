import * as React from 'react';
import { cn } from '@/lib/utils';

interface ComparisonRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value1: React.ReactNode;
  value2: React.ReactNode;
  label1?: string;
  label2?: string;
  icon1?: React.ReactNode;
  icon2?: React.ReactNode;
  comparison?: React.ReactNode;
  direction?: 'row' | 'column';
}

const ComparisonRow = React.forwardRef<HTMLDivElement, ComparisonRowProps>(
  (
    {
      className,
      label,
      value1,
      value2,
      label1,
      label2,
      icon1,
      icon2,
      comparison,
      direction = 'row',
      ...props
    },
    ref
  ) => {
    const containerClass = direction === 'column' ? 'flex-col' : 'flex-row';

    return (
      <div
        ref={ref}
        className={cn('space-y-[var(--space-3)]', className)}
        role="region"
        aria-label={label}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text-body)] font-semibold text-[var(--color-content-primary)]">
            {label}
          </h3>
          {comparison && (
            <span className="text-[var(--text-caption)] text-[var(--color-content-tertiary)]">
              {comparison}
            </span>
          )}
        </div>

        {/* Comparison Grid */}
        <div className={cn('flex gap-[var(--space-4)] items-stretch', containerClass)}>
          {/* Value 1 */}
          <div className={cn('flex-1 flex flex-col gap-[var(--space-2)]', {
            'p-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--color-bg-neutral)]':
              direction === 'column',
          })}>
            {icon1 && (
              <div className="flex items-center gap-[var(--space-2)]">
                <span className="text-lg flex-shrink-0" role="img" aria-label={label1}>
                  {icon1}
                </span>
                {label1 && (
                  <span className="text-[var(--text-caption)] text-[var(--color-content-secondary)]">
                    {label1}
                  </span>
                )}
              </div>
            )}
            <div className="text-[var(--text-body-lg)] font-mono font-semibold text-[var(--color-content-primary)]">
              {value1}
            </div>
          </div>

          {/* Value 2 */}
          <div className={cn('flex-1 flex flex-col gap-[var(--space-2)]', {
            'p-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--color-bg-neutral)]':
              direction === 'column',
          })}>
            {icon2 && (
              <div className="flex items-center gap-[var(--space-2)]">
                <span className="text-lg flex-shrink-0" role="img" aria-label={label2}>
                  {icon2}
                </span>
                {label2 && (
                  <span className="text-[var(--text-caption)] text-[var(--color-content-secondary)]">
                    {label2}
                  </span>
                )}
              </div>
            )}
            <div className="text-[var(--text-body-lg)] font-mono font-semibold text-[var(--color-content-primary)]">
              {value2}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ComparisonRow.displayName = 'ComparisonRow';

export { ComparisonRow };
export type { ComparisonRowProps };
