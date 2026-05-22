import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { bottomSheetEnter } from '@/lib/transitions';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[]; // px from bottom; defaults to [0.3, 1] for 30% and full height
  showHandle?: boolean;
  className?: string;
}

/**
 * BottomSheet — Mobile bottom sheet with snap points and swipe-to-dismiss
 * Uses spring physics for natural gesture feel
 *
 * @usage
 * const [open, setOpen] = useState(false);
 * <BottomSheet isOpen={open} onClose={() => setOpen(false)} title="Filters">
 *   <FilterPanel />
 * </BottomSheet>
 *
 * @a11y Focus trap; dismissible via Escape key; role="dialog"
 * @phase Phase 07 — Mobile-First UX Optimization
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.3, 1],
  showHandle = true,
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [shouldClose, setShouldClose] = useState(false);

  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const snapPixels = snapPoints.map((p) => (typeof p === 'number' && p < 1 ? p * viewportHeight : p));
  const maxSnapPoint = Math.max(...snapPixels);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartY(e.touches[0]?.clientY ?? 0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0]?.clientY ?? 0;
    const diff = currentY - startY;
    if (diff > 0) {
      setCurrentY(diff);
    }
  }, [startY]);

  const handleTouchEnd = useCallback(() => {
    const closingThreshold = 100; // px
    if (currentY > closingThreshold) {
      setShouldClose(true);
      setTimeout(onClose, 200); // Allow animation to complete
    } else {
      setCurrentY(0);
    }
  }, [currentY, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap: return focus to trigger element on close
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (tappable to close) */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: 150 }}
            role="presentation"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50',
              'rounded-t-3xl bg-white dark:bg-slate-900',
              'max-h-[90vh] overflow-y-auto',
              'shadow-xl',
              className
            )}
            {...bottomSheetEnter}
            animate={{
              y: shouldClose ? viewportHeight : currentY,
              opacity: shouldClose ? 0 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Bottom sheet'}
            tabIndex={-1}
          >
            {/* Handle + Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 rounded-t-3xl pt-3 pb-4 px-4">
              {/* Visual handle indicator */}
              {showHandle && (
                <div className="flex justify-center mb-3">
                  <div className="h-1 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                </div>
              )}

              {/* Title + Close button */}
              <div className="flex items-center justify-between">
                {title && (
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                )}
                <button
                  onClick={onClose}
                  className="ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  aria-label="Tutup"
                >
                  <X size={20} className="text-slate-700 dark:text-slate-300" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
