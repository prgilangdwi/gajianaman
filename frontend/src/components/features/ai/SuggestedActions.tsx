import { cn } from '@/lib/utils';

export interface SuggestedAction {
  id: string;
  label: string;
  prompt: string;
}

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onActionClick: (prompt: string) => void;
  isLoading?: boolean;
  isUserTyping?: boolean;
}

export function SuggestedActions({
  actions,
  onActionClick,
  isLoading = false,
  isUserTyping = false,
}: SuggestedActionsProps) {
  if (actions.length === 0) return null;

  const isHidden = isLoading || isUserTyping;

  return (
    <div
      className={cn(
        'px-4 py-3 flex flex-wrap gap-2 border-t border-[var(--color-bg-neutral)] transition-opacity duration-200',
        isHidden && 'opacity-50 pointer-events-none'
      )}
      role="group"
      aria-label="Suggested follow-up actions"
    >
      {actions.map((action) => (
        <button
          type="button"
          key={action.id}
          onClick={() => onActionClick(action.prompt)}
          disabled={isLoading || isUserTyping}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
            'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)]',
            'hover:opacity-80',
            'disabled:cursor-not-allowed',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--color-brand-primary)]'
          )}
          aria-label={`Suggested action: ${action.label}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
