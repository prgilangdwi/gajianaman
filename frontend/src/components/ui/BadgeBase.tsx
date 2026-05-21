import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center gap-1 rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        success:
          'bg-[var(--color-sentiment-positive-bg)] text-[var(--color-sentiment-positive)]',
        warning:
          'bg-[var(--color-sentiment-warning-bg)] text-[var(--color-sentiment-warning)]',
        error:
          'bg-[var(--color-sentiment-negative-bg)] text-[var(--color-sentiment-negative)]',
        neutral:
          'bg-[var(--color-bg-neutral)] text-[var(--color-content-primary)]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

interface BadgeBaseProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  categoryColor?: string;
}

const BadgeBase = React.forwardRef<HTMLDivElement, BadgeBaseProps>(
  ({ className, variant = 'neutral', categoryColor, ...props }, ref) => {
    // If categoryColor is provided, override variant styling with custom category color
    if (categoryColor) {
      return (
        <div
          ref={ref}
          className={cn(
            'inline-flex items-center justify-center gap-1 rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
            className
          )}
          style={{
            backgroundColor: `color-mix(in srgb, ${categoryColor} 15%, transparent)`,
            color: categoryColor,
          }}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, className }))}
        {...props}
      />
    );
  }
);

BadgeBase.displayName = 'BadgeBase';

export { BadgeBase, badgeVariants };
export type { BadgeBaseProps };
