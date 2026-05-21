import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-full)] h-9 px-3 py-1.5 text-sm font-medium transition-all duration-[var(--duration-fast)] outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      active: {
        true: 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] focus-visible:ring-[var(--color-brand-primary)]/50',
        false:
          'bg-[var(--color-bg-neutral)] text-[var(--color-content-primary)] border border-[var(--color-border-neutral)] hover:bg-[var(--color-bg-elevated)] focus-visible:ring-[var(--color-brand-primary)]/50',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface ChipBaseProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  icon?: React.ReactNode;
  onClose?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  active?: boolean;
}

const ChipBase = React.forwardRef<HTMLButtonElement, ChipBaseProps>(
  ({ className, active = false, icon, onClose, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(chipVariants({ active, className }))}
        disabled={disabled}
        {...props}
      >
        {icon && <span className="flex items-center justify-center">{icon}</span>}
        <span>{children}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-1 flex items-center justify-center rounded-full p-0 hover:bg-current/10 focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-offset-1 focus-visible:ring-current transition-colors"
            aria-label="Remove filter"
            disabled={disabled}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <path
                d="M11 3L3 11M3 3L11 11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </button>
    );
  }
);

ChipBase.displayName = 'ChipBase';

export { ChipBase, chipVariants };
export type { ChipBaseProps };
