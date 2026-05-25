import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarkupProps {
  children: ReactNode;
  className?: string;
}

/**
 * TextPositive — Positive sentiment emphasis (WCAG AAA: 7:1 contrast)
 * Use for: income amounts, savings, "hemat", positive indicators
 */
export function TextPositive({ children, className }: MarkupProps) {
  return (
    <span
      className={cn(
        'font-semibold text-[var(--color-sentiment-positive)]',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * TextNegative — Negative sentiment emphasis (WCAG AAA: 7:1 contrast)
 * Use for: expense amounts, over-budget, warning figures
 */
export function TextNegative({ children, className }: MarkupProps) {
  return (
    <span
      className={cn(
        'font-semibold text-[var(--color-sentiment-negative)]',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * TextImportant — Primary content emphasis
 * Use for: key figures in body text, balance amounts in supporting text
 */
export function TextImportant({ children, className }: MarkupProps) {
  return (
    <span
      className={cn(
        'font-semibold text-[var(--color-content-primary)]',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * TextLink — Interactive link style
 * Use for: "Lihat semua →", inline navigational text
 */
export function TextLink({ children, className }: MarkupProps) {
  return (
    <span
      className={cn(
        'font-semibold text-[var(--color-content-link)] underline',
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * TextWarning — Warning sentiment emphasis (WCAG AAA: 7:1 contrast)
 * Use for: budget alerts, deadline warnings
 */
export function TextWarning({ children, className }: MarkupProps) {
  return (
    <span
      className={cn(
        'font-semibold text-[var(--color-sentiment-warning)]',
        className
      )}
    >
      {children}
    </span>
  );
}
