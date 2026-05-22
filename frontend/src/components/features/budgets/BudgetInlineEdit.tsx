import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { CurrencyInput } from '@/components/common/CurrencyInput';
import { cn, textColorVar } from '@/lib/utils';
import { fadeUp } from '@/lib/transitions';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Budget } from '@/lib/supabase';

interface BudgetInlineEditProps {
  budget: Budget;
  currentSpent: number;
  onUpdate?: (updatedBudget: Budget) => void;
  readOnly?: boolean;
}

/**
 * BudgetInlineEdit — Touch-optimized inline budget editing
 * Click to edit amount; Enter to confirm; Escape to cancel
 *
 * @usage
 * <BudgetInlineEdit
 *   budget={budgetRow}
 *   currentSpent={spentAmount}
 *   onUpdate={handleBudgetUpdate}
 * />
 *
 * @a11y ARIA labels on edit/confirm/cancel buttons; keyboard support (Enter/Escape)
 * @mobile Touch targets ≥44px; CurrencyInput for IDR formatting
 * @phase Phase 07 — Mobile-First UX Optimization
 */
export function BudgetInlineEdit({
  budget,
  currentSpent,
  onUpdate,
  readOnly = false,
}: BudgetInlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(budget.amount);
  const [isSaving, setIsSaving] = useState(false);

  const percentage = budget.amount > 0 ? (currentSpent / budget.amount) * 100 : 0;

  const handleSave = useCallback(async () => {
    if (editValue === budget.amount) {
      setIsEditing(false);
      return;
    }

    if (editValue <= 0) {
      toast.error('Jumlah budget harus lebih dari 0');
      return;
    }

    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        toast.error('Anda harus login terlebih dahulu');
        return;
      }

      const userId = sessionData.session.user.id as unknown as number;

      // Update or insert budget
      const { data, error } = await supabase
        .from('budgets')
        .upsert({
          user_id: userId,
          category: budget.category,
          amount: editValue,
          period: budget.period || 'monthly',
          month: budget.month,
          year: budget.year,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Budget ${budget.category} diperbarui ke ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(editValue)}`);

      onUpdate?.(data as Budget);
      setIsEditing(false);
    } catch (err) {
      console.error('Budget update error:', err);
      toast.error('Gagal menyimpan budget');
    } finally {
      setIsSaving(false);
    }
  }, [editValue, budget, onUpdate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isSaving) {
        handleSave();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditValue(budget.amount);
      }
    },
    [handleSave, isSaving, budget.amount]
  );

  const statusColor =
    percentage > 100
      ? 'text-[var(--color-sentiment-negative)]'
      : percentage >= 80
        ? 'text-[var(--color-sentiment-warning)]'
        : 'text-[var(--color-sentiment-positive)]';

  if (isEditing) {
    return (
      <motion.div
        initial={fadeUp.initial}
        animate={fadeUp.animate}
        transition={fadeUp.transition}
        className="space-y-2"
      >
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <CurrencyInput
              value={editValue}
              onChange={setEditValue}
              placeholder="Rp 0"
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Confirm button (≥44px touch target) */}
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'h-11 w-11 rounded-lg flex items-center justify-center transition-all',
              isSaving
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-[var(--color-sentiment-positive)] text-white hover:opacity-90'
            )}
            aria-label="Simpan perubahan budget"
          >
            {isSaving ? (
              <motion.div
                className="w-4 h-4 rounded-full border-2 border-transparent border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            ) : (
              <Check size={20} />
            )}
          </motion.button>

          {/* Cancel button (≥44px touch target) */}
          <motion.button
            onClick={() => {
              setIsEditing(false);
              setEditValue(budget.amount);
            }}
            disabled={isSaving}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'h-11 w-11 rounded-lg flex items-center justify-center transition-all',
              isSaving
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
            )}
            aria-label="Batalkan edit budget"
          >
            <X size={20} />
          </motion.button>
        </div>

        {/* Spending progress during edit */}
        <div className="pt-1 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className={cn(textColorVar('content-secondary'))}>Terpakai</span>
            <span className={cn('font-mono font-semibold', statusColor)}>
              {Math.round(percentage)}%
            </span>
          </div>
          <div className={cn('w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800')}>
            <div
              className="h-full rounded-full bg-[var(--color-brand-primary)] transition-all duration-200"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={() => !readOnly && setIsEditing(true)}
      disabled={readOnly}
      whileHover={!readOnly ? { scale: 1.02 } : undefined}
      whileTap={!readOnly ? { scale: 0.98 } : undefined}
      className={cn(
        'w-full text-left p-2.5 rounded-lg transition-colors',
        !readOnly && 'hover:bg-slate-100 dark:hover:bg-slate-800',
        readOnly && 'cursor-default'
      )}
      aria-label={`Edit budget untuk ${budget.category}: ${new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(budget.amount)}`}
    >
      <div className="space-y-2">
        {/* Display amount with spend status */}
        <div className="flex justify-between items-baseline gap-2">
          <span className={cn('font-mono font-semibold', textColorVar('content-primary'))}>
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(budget.amount)}
          </span>
          <span className={cn('text-xs font-semibold', statusColor)}>
            {Math.round(percentage)}%
          </span>
        </div>

        {/* Progress bar */}
        <div className={cn('w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800')}>
          <div
            className="h-full rounded-full bg-[var(--color-brand-primary)] transition-all duration-200"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Spent vs Budget label */}
        <div className="flex justify-between text-xs gap-2">
          <span className={cn(textColorVar('content-secondary'))}>
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(currentSpent)}
          </span>
          <span className={cn(textColorVar('content-tertiary'))}>
            {!readOnly && 'Klik untuk edit'}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
