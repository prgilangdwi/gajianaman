import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold transition-all duration-[var(--duration-fast)] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--color-brand-primary)]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] whitespace-nowrap',
  {
    variants: {
      variant: {
        primary: [
          'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)]',
          'hover:bg-[var(--color-brand-primary-dark)]',
          'border border-transparent',
        ],
        secondary: [
          'bg-transparent text-[var(--color-content-primary)]',
          'border border-[var(--color-border-neutral)]',
          'hover:bg-[var(--color-bg-neutral)]',
        ],
        ghost: [
          'bg-transparent text-[var(--color-content-secondary)]',
          'border border-transparent',
          'hover:bg-[var(--color-bg-neutral)] hover:text-[var(--color-content-primary)]',
        ],
        danger: [
          'bg-[var(--color-sentiment-negative)] text-white',
          'border border-transparent',
          'hover:opacity-90',
        ],
      },
      size: {
        sm: 'h-9 px-3 py-1.5 text-sm',
        default: 'h-11 px-4 py-2 text-sm md:h-11',
        lg: 'h-12 px-6 py-2.5 text-base',
        icon: 'size-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

interface ButtonBaseProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  loadingText?: string;
}

const ButtonBase = React.forwardRef<HTMLButtonElement, ButtonBaseProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        type="button"
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
 className="animate-spin size-4 "
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

ButtonBase.displayName = 'ButtonBase';

export { ButtonBase, buttonVariants };
export type { ButtonBaseProps };
