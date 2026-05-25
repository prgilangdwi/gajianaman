import { cn, bgColorVar, borderColorVar } from '@/lib/utils';

export function DashboardSkeleton() {
  return (
    <div
      className="space-y-5 animate-pulse"
      aria-busy="true"
      aria-label="Memuat dashboard..."
    >
      {/* Hero card skeleton (28 height) */}
      <div
        className={cn(
          'h-28 rounded-[var(--radius-xl)]',
          bgColorVar('bg-card'),
          borderColorVar('border-neutral'),
          'border',
        )}
      />

      {/* Status row skeleton (3 cards x 20px height) */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-20 rounded-[var(--radius-lg)]',
              bgColorVar('bg-card'),
              borderColorVar('border-neutral'),
              'border',
            )}
          />
        ))}
      </div>

      {/* Insight card skeleton (16px height) */}
      <div
        className={cn(
          'h-16 rounded-[var(--radius-md)]',
          'bg-[var(--color-brand-primary-light)]',
        )}
      />

      {/* Chart skeleton (64px height ~ 256px actual) */}
      <div
        className={cn(
          'h-64 rounded-[var(--radius-lg)]',
          bgColorVar('bg-card'),
          borderColorVar('border-neutral'),
          'border',
        )}
      />

      {/* Category cards skeleton (3 cards x 16px height) */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-16 rounded-[var(--radius-lg)]',
              bgColorVar('bg-card'),
              borderColorVar('border-neutral'),
              'border',
            )}
          />
        ))}
      </div>

      {/* Goals section skeleton (2 items x 14px height) */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-14 rounded-[var(--radius-lg)]',
              bgColorVar('bg-card'),
              borderColorVar('border-neutral'),
              'border',
            )}
          />
        ))}
      </div>
    </div>
  );
}
