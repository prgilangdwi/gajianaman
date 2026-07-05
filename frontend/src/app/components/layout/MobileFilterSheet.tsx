import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterSheet({ isOpen, onClose }: MobileFilterSheetProps) {
  const { user } = useAuth();
  const { wallets = [] } = useWallets(user?.userId);
  const { selectedMonth, setSelectedMonth, monthOptions } = useMonthFilter();
  const [selectedWallet, setSelectedWallet] = useState('all');
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen && sheetRef.current) {
      const focusableElements = sheetRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-[var(--color-bg-elevated)] rounded-t-[var(--radius-2xl)] shadow-[var(--shadow-modal)] max-h-[70vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Filter pilihan"
            onKeyDown={handleKeyDown}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-[var(--color-content-tertiary)]/30" />
            </div>

            <div className="px-5 pb-8 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--color-content-primary)]">Filter</h3>
 <Button variant="ghost" size="icon" onClick={onClose} className="size-8 ">
 <X className="size-4 " />
                </Button>
              </div>

              {/* Month Selector */}
              <div className="space-y-2">
                <label htmlFor="filter-month" className="text-xs font-medium text-[var(--color-content-secondary)]">Bulan</label>
                <select
                  id="filter-month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-screen)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
                  aria-label="Pilih bulan"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wallet Selector */}
              {wallets.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-content-secondary)]">Dompet</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedWallet('all')}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-primary)]',
                        selectedWallet === 'all'
                          ? 'bg-[var(--color-brand-primary)] text-white border-transparent'
                          : 'bg-transparent text-[var(--color-content-secondary)] border-[var(--color-border-neutral)]'
                      )}
                      aria-pressed={selectedWallet === 'all' ? 'true' : 'false'}
                    >
                      Semua
                    </button>
                    {wallets.map((w: any) => (
                      <button
                        type="button"
                        key={w.id}
                        onClick={() => setSelectedWallet(w.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-primary)]',
                          selectedWallet === w.id
                            ? 'bg-[var(--color-brand-primary)] text-white border-transparent'
                            : 'bg-transparent text-[var(--color-content-secondary)] border-[var(--color-border-neutral)]'
                        )}
                        aria-pressed={selectedWallet === w.id ? 'true' : 'false'}
                        aria-label={`Pilih dompet ${w.name}`}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button */}
              <Button
                onClick={onClose}
                className="w-full bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary-dark)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-brand-primary)]"
                aria-label="Terapkan filter dan tutup"
              >
                Terapkan Filter
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
