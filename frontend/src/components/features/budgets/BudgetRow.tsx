import { useState, useRef, useEffect } from 'react';
import { formatRupiah, cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';

interface BudgetRowProps {
  category: string;
  icon: string;
  budget: number;
  spent: number;
  onSave: (newBudget: number) => void;
  isLoading?: boolean;
}

export function BudgetRow({ category, icon, budget, spent, onSave, isLoading = false }: BudgetRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(budget || ''));
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = percentage > 100;
  const isWarning = percentage >= 80 && percentage <= 100;

  const statusColor = isOver
    ? 'sentiment-negative'
    : isWarning
    ? 'sentiment-warning'
    : 'sentiment-positive';

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = parseInt(editValue.replace(/\D/g, ''), 10) || 0;
    if (numValue !== budget) {
      onSave(numValue);
    }
    setIsEditing(false);
    setEditValue(String(numValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(String(budget || ''));
      setIsEditing(false);
    }
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-colors',
      bgColorVar('bg-screen'),
      borderColorVar('border-neutral')
    )}>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-2xl flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className={cn('font-semibold text-sm truncate', textColorVar('content-primary'))}>
              {category}
            </h3>
            <p className={cn('text-xs', textColorVar('content-tertiary'))}>
              Terpakai {formatRupiah(spent)}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className={cn(
                'text-right font-mono font-semibold text-sm w-24 px-2 py-1 rounded border',
                bgColorVar('bg-screen'),
                borderColorVar('border-brand-primary')
              )}
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="text-right font-mono font-semibold text-sm hover:opacity-75 transition-opacity"
              title="Click to edit budget"
            >
              {formatRupiah(budget)}
            </button>
          )}
          <p className={cn('text-xs font-medium', textColorVar(statusColor))}>
            {percentage > 0 ? `${Math.round(percentage)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-[var(--color-bg-neutral)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isOver ? 'bg-[var(--color-sentiment-negative)]' : 'bg-[var(--color-sentiment-positive)]'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
