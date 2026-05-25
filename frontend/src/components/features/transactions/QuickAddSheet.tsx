import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { BottomSheet } from '@/components/mobile/BottomSheet';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { cn, textColorVar, bgColorVar } from '@/lib/utils';
import { fadeUp, staggerChildren } from '@/lib/transitions';
import { ALL_CATEGORIES, getCategoryMeta } from '@/lib/categoryMetadata';
import { supabase } from '@/lib/supabase';
import type { Transaction } from '@/lib/supabase';
import { toast } from 'sonner';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (transaction: Transaction) => void;
  type?: 'expense' | 'income';
}

/**
 * QuickAddSheet — Mobile quick-add transaction form in bottom sheet
 * Frictionless UX: amount → category → note → confirm (4 taps max)
 *
 * @usage
 * const [open, setOpen] = useState(false);
 * <QuickAddSheet isOpen={open} onClose={() => setOpen(false)} type="expense" />
 *
 * @a11y Tab navigation between fields; Enter to submit; Escape to close
 * @spacing --space-4 between fields, --space-5 around sections
 * @phase Phase 07 — Mobile-First UX Optimization
 */
export function QuickAddSheet({
  isOpen,
  onClose,
  onSuccess,
  type = 'expense',
}: QuickAddSheetProps) {
  const [amount, setAmount] = useState(0);
  const [category, setCategory] = useState<string>(ALL_CATEGORIES[0] || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryMeta = getCategoryMeta(category);

  const handleSubmit = useCallback(async () => {
    if (amount === 0) {
      toast.error('Masukkan jumlah transaksi');
      return;
    }
    if (!category) {
      toast.error('Pilih kategori');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      const userId = sessionData.session.user.id as unknown as number;

      // Create transaction
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          amount,
          type,
          category,
          note: note || null,
          date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Transaksi berhasil ditambahkan: ${category}`);
      onSuccess?.(data as Transaction);
      onClose();

      // Reset form
      setAmount(0);
      setCategory(ALL_CATEGORIES[0] || '');
      setNote('');
    } catch (err) {
      console.error('QuickAdd error:', err);
      toast.error('Gagal menambahkan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, category, note, type, onSuccess, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isSubmitting) {
        handleSubmit();
      }
    },
    [handleSubmit, isSubmitting]
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'expense' ? 'Tambah Pengeluaran' : 'Tambah Pemasukan'}
      snapPoints={[0.5, 1]}
      className="bg-white dark:bg-slate-900"
    >
      {/* Form content */}
      <motion.div
        className="space-y-[var(--space-5)]"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        {/* Amount section */}
        <motion.div className="space-y-2" variants={fadeUp}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Jumlah
          </label>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            placeholder="Rp 0"
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </motion.div>

        {/* Category selection (grid for thumb-friendly) */}
        <motion.div className="space-y-2" variants={fadeUp}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Kategori
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ALL_CATEGORIES.map((cat) => {
              const meta = getCategoryMeta(cat);
              const isSelected = category === cat;

              return (
                <motion.button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    // Base: 44px minimum touch target
                    'p-3 rounded-lg flex flex-col items-center justify-center',
                    'transition-all duration-150',
                    // Selected: brand color background
                    isSelected
                      ? bgColorVar('brand-primary-light') + ' ring-2 ring-[var(--color-brand-primary)]'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-2xl mb-1">{meta.emoji}</span>
                  <span className="text-xs font-medium text-center text-slate-700 dark:text-slate-300">
                    {cat}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Note section (optional) */}
        <motion.div className="space-y-2" variants={fadeUp}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Catatan (opsional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tambahkan catatan untuk transaksi ini..."
            rows={2}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg',
              'border-2 border-slate-300 dark:border-slate-600',
              'focus:border-[var(--color-brand-primary)] focus:outline-none',
              'bg-white dark:bg-slate-900',
              'text-slate-900 dark:text-white placeholder:text-slate-500',
              'text-sm resize-none transition-colors duration-150'
            )}
          />
        </motion.div>

        {/* Submit button (≥44px height) */}
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting || amount === 0}
          variants={fadeUp}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            // Base: 48px height (≥44px requirement)
            'w-full h-12 rounded-lg font-semibold',
            'transition-all duration-150',
            'flex items-center justify-center gap-2',
            // Active state
            amount > 0 && !isSubmitting
              ? cn(bgColorVar('brand-primary'), 'text-white hover:opacity-90')
              : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <motion.div
 className="size-4 rounded-full border-2 border-transparent border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              Menyimpan…
            </>
          ) : (
            <>
              <Plus size={20} />
              Tambah Transaksi
            </>
          )}
        </motion.button>
      </motion.div>
    </BottomSheet>
  );
}
