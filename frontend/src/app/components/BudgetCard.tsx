import { motion } from 'motion/react';
import { Edit, Plus } from 'lucide-react';
import { cn, bgColorVar, textColorVar, borderColorVar, formatRupiah } from '@/lib/utils';
import { Button } from './ui/button';
import { PrivacyAmount } from './PrivacyAmount';

export type BudgetStatus = 'safe' | 'warning' | 'over' | 'none';

export interface BudgetCardProps {
  category: string;
  emoji: string;
  budget: number;
  spent: number;
  pct: number;
  hasEntry: boolean;
  status: BudgetStatus;
  index: number;
  prefersReduced: boolean;
  onEdit: (category: string, currentAmount: number) => void;
}

function StatusBadge({ status }: { status: BudgetStatus }) {
  const config: Record<BudgetStatus, { bg: string; text: string; label: string }> = {
    safe: {
      bg: bgColorVar('sentiment-positive-bg'),
      text: textColorVar('sentiment-positive'),
      label: 'Aman',
    },
    warning: {
      bg: bgColorVar('sentiment-warning-bg'),
      text: textColorVar('sentiment-warning'),
      label: 'Hampir',
    },
    over: {
      bg: bgColorVar('sentiment-negative-bg'),
      text: textColorVar('sentiment-negative'),
      label: 'Melebihi',
    },
    none: {
      bg: bgColorVar('bg-neutral'),
      text: textColorVar('content-tertiary'),
      label: 'Belum Dibuat',
    },
  };

  const styles = config[status];
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', styles.bg, styles.text)}>
      {styles.label}
    </span>
  );
}

export function BudgetCard({
  category,
  emoji,
  budget,
  spent,
  pct,
  hasEntry,
  status,
  index,
  prefersReduced,
  onEdit,
}: BudgetCardProps) {
  return (
    <motion.div
      key={category}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ delay: prefersReduced ? 0 : index * 0.05 }}
      className="space-y-2"
    >
      {/* Header row: icon + name/amounts + badge + edit button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg flex-shrink-0">{emoji}</span>
          <div className="min-w-0">
            <p className={cn('text-sm font-medium', textColorVar('content-primary'))}>{category}</p>
            <p className={cn('text-xs font-mono', textColorVar('content-tertiary'))}>
              <PrivacyAmount value={formatRupiah(spent)} />
              {budget > 0 && (
                <> / <PrivacyAmount value={formatRupiah(budget)} /></>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={status} />
          <Button
            size="icon"
            variant="ghost"
 className="size-8 "
            onClick={() => onEdit(category, budget)}
          >
 <Edit className="size-4 " />
          </Button>
        </div>
      </div>

      {/* Progress bar or "create budget" CTA */}
      {hasEntry ? (
        <>
          <div className={cn('w-full h-2 rounded-full overflow-hidden', bgColorVar('bg-neutral'))}>
            <div
              className={cn(
                'h-full rounded-full transition-all',
                status === 'over'
                  ? bgColorVar('sentiment-negative')
                  : status === 'warning'
                    ? bgColorVar('sentiment-warning')
                    : bgColorVar('sentiment-positive')
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className={cn('flex justify-between text-xs', textColorVar('content-tertiary'))}>
            <span>
              Terpakai: <PrivacyAmount value={formatRupiah(spent)} />
            </span>
            <span>{pct.toFixed(0)}%</span>
          </div>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs h-7"
          onClick={() => onEdit(category, 0)}
        >
 <Plus className="size-3 mr-1" /> Buat Budget
        </Button>
      )}
    </motion.div>
  );
}
