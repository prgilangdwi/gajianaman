import { motion } from 'motion/react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn, bgColorVar, textColorVar, borderColorVar, formatRupiah } from '@/lib/utils';
import { getCategoryMeta } from '@/lib/categoryMetadata';
import { PrivacyAmount } from './PrivacyAmount';
import { TextNegative, TextPositive } from './Markup';
import type { Transaction } from '@/lib/supabase';

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

export interface TransactionRowProps {
  tx: Transaction;
  index: number;
  prefersReduced: boolean;
  onClick?: (tx: Transaction) => void;
}

export function TransactionRow({ tx, index, prefersReduced, onClick }: TransactionRowProps) {
  const meta = getCategoryMeta(tx.category);
  const isIncome = tx.type === 'income';

  return (
    <motion.div
      key={tx.id}
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ delay: prefersReduced ? 0 : index * 0.03 }}
      className="flex items-center justify-between py-4 sm:py-3 min-h-[56px] sm:min-h-auto"
      onClick={() => onClick?.(tx)}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0', bgColorVar('bg-neutral'))}>
          {meta.emoji}
        </div>
        <div className="min-w-0">
          <p className={cn('text-base sm:text-sm font-semibold truncate', textColorVar('content-primary'))}>
            {tx.note || tx.category}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className={cn('text-xs sm:text-[12px]', textColorVar('content-tertiary'))}>
              {formatDateShort(tx.date)}
            </span>
            <span
              className="text-[11px] sm:text-[10px] h-5 sm:h-4 px-1.5 rounded-full font-medium"
              style={{
                backgroundColor: `var(--color-cat-${tx.category.toLowerCase().replace(/\s+/g, '-')}-bg, ${meta.color}20)`,
                color: meta.color,
              }}
            >
              {tx.category}
            </span>
            {tx.tags && tx.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {tx.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      'text-[9px] sm:text-[8px] h-4 px-1 rounded-full border',
                      borderColorVar('border-neutral'),
                      textColorVar('content-tertiary')
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
        {isIncome ? (
          <ArrowUpRight className={cn('w-4 h-4', textColorVar('sentiment-positive'))} />
        ) : (
          <ArrowDownRight className={cn('w-4 h-4', textColorVar('content-tertiary'))} />
        )}
        <span className="font-mono font-bold text-base sm:text-sm flex-shrink-0">
          {isIncome ? (
            <TextPositive>
              +<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
            </TextPositive>
          ) : (
            <TextNegative>
              −<PrivacyAmount value={formatRupiah(Number(tx.amount))} />
            </TextNegative>
          )}
        </span>
      </div>
    </motion.div>
  );
}
