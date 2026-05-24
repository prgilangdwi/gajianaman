import { cn } from '@/lib/utils';

export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1 px-4 py-3 rounded-2xl w-fit bg-[var(--color-bg-card)] border border-[var(--color-bg-neutral)]"
      aria-label="Assistant is typing"
      role="status"
    >
      <span
        className={cn(
 'inline-block size-2 rounded-full bg-[var(--color-content-tertiary)] animate-bounce',
          '[animation-delay:-0.32s]'
        )}
      />
      <span
        className={cn(
 'inline-block size-2 rounded-full bg-[var(--color-content-tertiary)] animate-bounce',
          '[animation-delay:-0.16s]'
        )}
      />
 <span className="inline-block size-2 rounded-full bg-[var(--color-content-tertiary)] animate-bounce" />
    </div>
  );
}
