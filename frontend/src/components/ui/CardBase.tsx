import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-[var(--radius-md)] bg-[var(--color-bg-card)] transition-all duration-[var(--duration-fast)]',
  {
    variants: {
      variant: {
        surface: 'shadow-[var(--shadow-card)]',
        elevated: 'shadow-[var(--shadow-card-hover)]',
        floating: 'shadow-[var(--shadow-float)]',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3 md:p-4',
        md: 'p-4 md:p-6',
        lg: 'p-6 md:p-8',
      },
    },
    defaultVariants: {
      variant: 'surface',
      padding: 'md',
    },
  }
);

interface CardBaseProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const CardBase = React.forwardRef<HTMLDivElement, CardBaseProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, className }))}
        {...props}
      />
    );
  }
);

CardBase.displayName = 'CardBase';

export { CardBase, cardVariants };
export type { CardBaseProps };
