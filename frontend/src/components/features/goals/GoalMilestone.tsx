import { useState, useRef, useEffect } from 'react';
import { formatRupiah, cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';
import { differenceInDays } from 'date-fns';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Button } from '@/app/components/ui/button';
import { Check, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface GoalMilestoneProps {
  goalId: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  onContribute: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

const MILESTONES = [25, 50, 75, 100] as const;

export function GoalMilestone({
  goalId,
  name,
  target,
  saved,
  deadline,
  onContribute,
  isLoading = false,
}: GoalMilestoneProps) {
  const [contributionValue, setContributionValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = Math.min((saved / target) * 100, 100);
  const remaining = Math.max(target - saved, 0);
  const daysLeft = deadline ? differenceInDays(new Date(deadline), new Date()) : null;
  const isCompleted = percentage >= 100;

  const handleContribute = async () => {
    const amount = parseInt(contributionValue.replace(/\D/g, ''), 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Masukkan jumlah yang valid');
      return;
    }

    setIsSubmitting(true);
    try {
      await onContribute(amount);
      toast.success(`Berhasil menambah ${formatRupiah(amount)} ke goal`);
      setContributionValue('');
    } catch (error) {
      toast.error('Gagal menambah kontribusi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleContribute();
    }
  };

  return (
    <div className={cn(
      'p-4 rounded-lg border transition-colors',
      bgColorVar('bg-screen'),
      borderColorVar('border-neutral')
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className={cn('font-semibold text-base truncate', textColorVar('content-primary'))}>
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono font-semibold text-sm text-[var(--color-content-primary)]">
              {formatRupiah(saved)} / {formatRupiah(target)}
            </p>
            <p className={cn('text-xs font-medium', textColorVar('content-tertiary'))}>
              {Math.round(percentage)}%
            </p>
          </div>
        </div>

        {isCompleted && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--color-sentiment-positive)] flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full h-3 rounded-full bg-[var(--color-bg-neutral)] overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-[var(--color-brand-primary)] transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Milestone Indicators */}
        <div className="flex justify-between gap-1 px-1">
          {MILESTONES.map((milestone) => {
            const isReached = percentage >= milestone;
            return (
              <div
                key={milestone}
                className={cn(
                  'flex-1 h-1.5 rounded-full transition-all',
                  isReached ? 'bg-[var(--color-sentiment-positive)]' : 'bg-[var(--color-bg-neutral)]'
                )}
                title={`${milestone}% goal`}
              />
            );
          })}
        </div>

        {/* Milestone Labels */}
        <div className="flex justify-between gap-1 mt-2">
          {MILESTONES.map((milestone) => (
            <span
              key={milestone}
              className={cn('text-xs font-medium flex-1 text-center', textColorVar('content-tertiary'))}
            >
              {milestone}%
            </span>
          ))}
        </div>
      </div>

      {/* Deadline Countdown */}
      {deadline && daysLeft !== null && (
        <div className={cn(
          'p-3 rounded-lg mb-4 flex items-center gap-2',
          daysLeft < 0
            ? 'bg-[var(--color-sentiment-negative-bg)] text-[var(--color-sentiment-negative)]'
            : daysLeft <= 7
            ? 'bg-[var(--color-sentiment-warning-bg)] text-[var(--color-sentiment-warning)]'
            : 'bg-[var(--color-bg-neutral)] text-[var(--color-content-secondary)]'
        )}>
          <Zap className="w-4 h-4 flex-shrink-0" />
          <div className="text-sm">
            {daysLeft < 0
              ? `${Math.abs(daysLeft)} hari yang lalu (Tenggat waktu terlewati)`
              : daysLeft === 0
              ? 'Tenggat hari ini!'
              : daysLeft === 1
              ? 'Tenggat besok'
              : `${daysLeft} hari lagi • ${format(new Date(deadline), 'dd MMM', { locale: idLocale })}`}
          </div>
        </div>
      )}

      {/* Contribution Input */}
      {!isCompleted && (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            placeholder={`Tambah ke goal (sisa ${formatRupiah(remaining)})`}
            value={contributionValue}
            onChange={(e) => setContributionValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || isLoading}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border text-sm',
              'font-mono placeholder-[var(--color-content-tertiary)]',
              bgColorVar('bg-screen'),
              borderColorVar('border-neutral')
            )}
          />
          <Button
            size="sm"
            onClick={handleContribute}
            disabled={isSubmitting || isLoading || !contributionValue.trim()}
            className="h-10 flex-shrink-0"
          >
            Tambah
          </Button>
        </div>
      )}

      {/* Completed State */}
      {isCompleted && (
        <div className={cn(
          'p-3 rounded-lg text-center text-sm font-semibold',
          'bg-[var(--color-sentiment-positive-bg)]',
          'text-[var(--color-sentiment-positive)]'
        )}>
          ✓ Goal tercapai!
        </div>
      )}
    </div>
  );
}
