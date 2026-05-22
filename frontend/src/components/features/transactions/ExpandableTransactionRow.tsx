import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn, bgColorVar, textColorVar, borderColorVar, formatRupiah } from '@/lib/utils';
import { getCategoryMeta } from '@/lib/categoryMetadata';
import { PrivacyAmount } from '@/app/components/PrivacyAmount';
import { TextNegative, TextPositive } from '@/app/components/Markup';
import type { Transaction } from '@/lib/supabase';

function formatDateShort(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr));
}

function formatDateLong(dateStr: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export interface ExpandableTransactionRowProps {
  tx: Transaction;
  index: number;
  prefersReduced: boolean;
  wallet?: { id: string; name: string } | null;
}

export function ExpandableTransactionRow({
  tx,
  index,
  prefersReduced,
  wallet,
}: ExpandableTransactionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const meta = getCategoryMeta(tx.category);
  const isIncome = tx.type === 'income';

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ delay: prefersReduced ? 0 : index * 0.03 }}
      className={cn('transition-colors rounded-lg', isExpanded ? bgColorVar('bg-screen') : '')}
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between py-4 sm:py-3 min-h-[56px] sm:min-h-auto',
          'hover:opacity-75 transition-opacity text-left'
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0', bgColorVar('bg-neutral'))}>
            {meta.emoji}
          </div>
          <div className="min-w-0 flex-1">
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
                  {tx.tags.slice(0, 1).map((tag) => (
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
                  {tx.tags.length > 1 && (
                    <span className={cn('text-[9px] sm:text-[8px]', textColorVar('content-tertiary'))}>
                      +{tx.tags.length - 1}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          <div className="flex items-center gap-1">
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
          <ChevronDown
            className={cn(
              'w-5 h-5 transition-transform flex-shrink-0',
              textColorVar('content-tertiary'),
              isExpanded ? 'rotate-180' : ''
            )}
          />
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={cn('border-t overflow-hidden', borderColorVar('border-neutral'))}
          >
            <div className="px-4 py-4 space-y-3 text-sm">
              {/* Date */}
              <div className="flex justify-between items-start">
                <span className={cn('font-medium', textColorVar('content-secondary'))}>
                  Tanggal
                </span>
                <span className={cn('text-right', textColorVar('content-primary'))}>
                  {formatDateLong(tx.date)}
                </span>
              </div>

              {/* Wallet */}
              {wallet && (
                <div className="flex justify-between items-start">
                  <span className={cn('font-medium', textColorVar('content-secondary'))}>
                    Dompet
                  </span>
                  <span className={cn('text-right', textColorVar('content-primary'))}>
                    {wallet.name}
                  </span>
                </div>
              )}

              {/* Full Note */}
              {tx.note && tx.note.length > 30 && (
                <div className="flex justify-between items-start gap-2">
                  <span className={cn('font-medium', textColorVar('content-secondary'))}>
                    Catatan
                  </span>
                  <span className={cn('text-right', textColorVar('content-primary'))}>
                    {tx.note}
                  </span>
                </div>
              )}

              {/* Subcategory */}
              {tx.subcategory && (
                <div className="flex justify-between items-start">
                  <span className={cn('font-medium', textColorVar('content-secondary'))}>
                    Sub-kategori
                  </span>
                  <span className={cn('text-right', textColorVar('content-primary'))}>
                    {tx.subcategory}
                  </span>
                </div>
              )}

              {/* All Tags */}
              {tx.tags && tx.tags.length > 0 && (
                <div className="flex justify-between items-start gap-2">
                  <span className={cn('font-medium', textColorVar('content-secondary'))}>
                    Tags
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {tx.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          'text-[11px] px-2 py-1 rounded-full border',
                          borderColorVar('border-neutral'),
                          textColorVar('content-tertiary')
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Confidence */}
              {tx.ai_confidence && (
                <div className="flex justify-between items-start">
                  <span className={cn('font-medium', textColorVar('content-secondary'))}>
                    Kepercayaan AI
                  </span>
                  <span className={cn('text-right font-mono', textColorVar('content-primary'))}>
                    {Math.round(Number(tx.ai_confidence) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
