import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TransactionRow } from '@/app/components/TransactionRow';
import { SwipeAction } from '@/components/mobile/SwipeAction';
import { cn, useMediaQuery, textColorVar } from '@/lib/utils';
import { staggerChildren, fadeUp, useReducedMotion } from '@/lib/transitions';
import type { Transaction } from '@/lib/supabase';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onDelete?: (id: number) => void;
  onEdit?: (tx: Transaction) => void;
}

/**
 * TransactionList — Responsive transaction display (table/card-list)
 * Switches between mobile card-list (<768px) and desktop table (≥768px)
 *
 * @usage
 * <TransactionList
 *   transactions={data}
 *   onDelete={handleDelete}
 *   onEdit={handleEdit}
 * />
 *
 * @a11y ARIA labels on mobile swipe actions; semantic table on desktop
 * @mobile Card layout with SwipeAction for delete/flag
 * @desktop Full table with amount, date, category columns
 * @phase Phase 07 — Mobile-First UX Optimization
 */
export function TransactionList({
  transactions,
  isLoading = false,
  onDelete,
  onEdit,
}: TransactionListProps) {
  const isMobile = !useMediaQuery('(min-width: 768px)');
  const prefersReduced = useReducedMotion();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions]
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-4xl mb-2">📝</div>
        <p className={cn('text-sm', textColorVar('content-tertiary'))}>
          Belum ada transaksi untuk periode ini
        </p>
      </div>
    );
  }

  // Mobile: Card-list layout
  if (isMobile) {
    return (
      <motion.div
        className="space-y-2"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        <AnimatePresence>
          {sortedTransactions.map((tx, idx) => (
            <motion.div key={tx.id} variants={fadeUp}>
              <SwipeAction
                onSwipeLeft={() => onDelete?.(tx.id)}
                onSwipeRight={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                isDeletable={!!onDelete}
              >
                <div
                  onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                  className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden cursor-pointer"
                >
                  <TransactionRow
                    tx={tx}
                    index={idx}
                    prefersReduced={prefersReduced}
                    onClick={() => onEdit?.(tx)}
                  />

                  {/* Expandable details on mobile */}
                  <AnimatePresence>
                    {expandedId === tx.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800 space-y-2"
                      >
                        {tx.note && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Catatan
                            </p>
                            <p className={cn('text-sm', textColorVar('content-primary'))}>
                              {tx.note}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            ID Transaksi
                          </p>
                          <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                            #{tx.id}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SwipeAction>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Desktop: Table layout
  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
      animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
      transition={fadeUp.transition}
      className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 dark:bg-slate-900">
            <TableHead className="text-xs font-semibold">Tanggal</TableHead>
            <TableHead className="text-xs font-semibold">Kategori</TableHead>
            <TableHead className="text-xs font-semibold">Keterangan</TableHead>
            <TableHead className="text-right text-xs font-semibold">Jumlah</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((tx, idx) => (
            <motion.tr
              key={tx.id}
              initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 4 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ delay: prefersReduced ? 0 : idx * 0.03 }}
              className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => onEdit?.(tx)}
            >
              <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                {new Intl.DateTimeFormat('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                }).format(new Date(tx.date))}
              </TableCell>
              <TableCell className="text-sm font-medium">{tx.category}</TableCell>
              <TableCell className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                {tx.note || '—'}
              </TableCell>
              <TableCell className={cn('text-right text-sm font-mono font-semibold')}>
                {tx.type === 'income' ? '+' : '−'}
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                }).format(tx.amount)}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
