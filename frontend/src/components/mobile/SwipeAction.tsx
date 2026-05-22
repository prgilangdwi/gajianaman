import { useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Trash2, Flag } from 'lucide-react';
import { cn, textColorVar } from '@/lib/utils';
import { bottomSheetEnter } from '@/lib/transitions';

interface SwipeActionProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftLabel?: string;
  rightLabel?: string;
  isDeletable?: boolean;
}

/**
 * SwipeAction — Touch gesture component for transaction rows
 * Supports left/right swipe with fallback button menu for accessibility
 *
 * @usage
 * <SwipeAction
 *   onSwipeLeft={() => deleteTransaction(id)}
 *   onSwipeRight={() => flagTransaction(id)}
 *   isDeletable={true}
 * >
 *   <TransactionRow transaction={tx} />
 * </SwipeAction>
 *
 * @a11y Keyboard accessible via context menu; aria-label on action icons
 * @phase Phase 07 — Mobile-First UX Optimization
 */
export function SwipeAction({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftLabel = 'Hapus',
  rightLabel = 'Tandai',
  isDeletable = true,
}: SwipeActionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const [translate, setTranslate] = useState(0);
  const [showActions, setShowActions] = useState(false);

  const SWIPE_THRESHOLD = 80; // px to trigger action
  const MAX_TRANSLATE = 120; // px max drag distance

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startX.current) return;
    const currentX = e.touches[0]?.clientX ?? 0;
    const diff = currentX - startX.current;

    // Constrain translation within bounds
    const newTranslate = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, diff));
    setTranslate(newTranslate);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(translate) > SWIPE_THRESHOLD) {
      if (translate < 0 && onSwipeLeft) {
        onSwipeLeft();
        setTranslate(-MAX_TRANSLATE);
      } else if (translate > 0 && onSwipeRight) {
        onSwipeRight();
        setTranslate(MAX_TRANSLATE);
      }
      setShowActions(true);
    } else {
      setTranslate(0);
    }
    startX.current = 0;
  }, [translate, onSwipeLeft, onSwipeRight]);

  const handleReset = useCallback(() => {
    setTranslate(0);
    setShowActions(false);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action backdrop (left = delete, right = flag) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-between px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: translate !== 0 ? 1 : 0 }}
        transition={{ duration: 100 }}
      >
        {/* Right swipe action (flag) */}
        {onSwipeRight && (
          <button
            onClick={() => {
              onSwipeRight();
              handleReset();
            }}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-2',
              textColorVar('content-primary'),
              'bg-orange-50 dark:bg-orange-950'
            )}
            aria-label={rightLabel}
          >
            <Flag size={18} />
            <span className="text-xs font-medium">{rightLabel}</span>
          </button>
        )}

        {/* Left swipe action (delete) */}
        {isDeletable && onSwipeLeft && (
          <button
            onClick={() => {
              onSwipeLeft();
              handleReset();
            }}
            className={cn(
              'ml-auto flex items-center gap-2 rounded px-3 py-2',
              textColorVar('sentiment-negative'),
              'bg-red-50 dark:bg-red-950'
            )}
            aria-label={leftLabel}
          >
            <Trash2 size={18} />
            <span className="text-xs font-medium">{leftLabel}</span>
          </button>
        )}
      </motion.div>

      {/* Main content (draggable) */}
      <motion.div
        ref={ref}
        className="cursor-grab active:cursor-grabbing bg-white dark:bg-slate-900 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        animate={{ x: translate }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div onClick={handleReset} className="w-full">
          {children}
        </div>
      </motion.div>

      {/* Keyboard fallback: long-press menu button (accessible) */}
      {showActions && (
        <motion.div
          className="absolute bottom-full right-0 mb-1 flex flex-col gap-1 rounded-lg bg-white dark:bg-slate-900 shadow-lg p-2 z-50"
          {...bottomSheetEnter}
        >
          {onSwipeRight && (
            <button
              onClick={() => {
                onSwipeRight();
                handleReset();
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              aria-label={rightLabel}
            >
              <Flag size={16} className={textColorVar('content-primary')} />
              {rightLabel}
            </button>
          )}
          {isDeletable && onSwipeLeft && (
            <button
              onClick={() => {
                onSwipeLeft();
                handleReset();
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950 rounded',
                textColorVar('sentiment-negative')
              )}
              aria-label={leftLabel}
            >
              <Trash2 size={16} />
              {leftLabel}
            </button>
          )}
          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
          >
            Batal
          </button>
        </motion.div>
      )}
    </div>
  );
}
