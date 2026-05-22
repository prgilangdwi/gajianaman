import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCw } from 'lucide-react';
import { textColorVar } from '@/lib/utils';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

/**
 * PullToRefresh — Mobile pull-to-refresh gesture wrapper
 * Detects momentum scroll, shows refresh indicator, triggers callback
 *
 * @usage
 * <PullToRefresh onRefresh={async () => await refetchData()}>
 *   <TransactionList transactions={data} />
 * </PullToRefresh>
 *
 * @a11y Uses passive event listeners for smooth 60fps scrolling
 * @phase Phase 07 — Mobile-First UX Optimization
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pull, setPull] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const isTopRef = useRef(false);

  // Check if scroll is at top
  const checkIfAtTop = useCallback((e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const scrollable = target.closest('[data-scrollable="true"]') || containerRef.current;
    if (!scrollable) return false;

    // If there's no scroll container or it's at the top, we're "at top"
    return scrollable.scrollTop === 0 || !scrollable.scrollTop;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!checkIfAtTop(e)) {
        isTopRef.current = false;
        return;
      }
      isTopRef.current = true;
      startYRef.current = e.touches[0]?.clientY ?? 0;
      setPull(0);
    },
    [checkIfAtTop]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isTopRef.current || isRefreshing) return;

      const currentY = e.touches[0]?.clientY ?? 0;
      const distance = Math.max(0, currentY - startYRef.current);

      // Ease off resistance as pull increases
      const eased = Math.sqrt(distance) * 3;
      setPull(Math.min(eased, threshold * 1.5));
    },
    [isRefreshing, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isTopRef.current) return;

    if (pull >= threshold) {
      setIsRefreshing(true);
      onRefresh()
        .catch((err) => console.error('Pull-to-refresh failed:', err))
        .finally(() => {
          setIsRefreshing(false);
          setPull(0);
        });
    } else {
      setPull(0);
    }
    isTopRef.current = false;
  }, [pull, threshold, onRefresh]);

  // Use passive listeners for performance
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pull / threshold, 1);

  return (
    <div ref={containerRef} className={className} data-scrollable="true">
      {/* Refresh indicator */}
      <motion.div
        className="relative h-0 overflow-visible"
        animate={{ height: isRefreshing ? 64 : pull * 0.5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex items-center justify-center">
          <motion.div
            className={`flex items-center justify-center h-10 w-10 rounded-full ${
              progress >= 1 ? 'bg-green-100 dark:bg-green-900' : 'bg-slate-100 dark:bg-slate-800'
            }`}
            animate={{
              rotate: isRefreshing ? 360 : progress * 180,
              scale: progress >= 1 ? 1.1 : 1,
            }}
            transition={{
              rotate: isRefreshing ? { duration: 1, repeat: Infinity } : { duration: 0 },
              scale: { duration: 0.2 },
            }}
          >
            <RotateCw
              size={20}
              className={`${
                progress >= 1
                  ? textColorVar('sentiment-positive')
                  : textColorVar('content-tertiary')
              }`}
            />
          </motion.div>

          {/* Status text */}
          {progress >= 1 && !isRefreshing && (
            <motion.span
              className={`ml-2 text-sm font-medium ${textColorVar('sentiment-positive')}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Lepaskan untuk segarkan
            </motion.span>
          )}

          {isRefreshing && (
            <motion.span
              className={`ml-2 text-sm font-medium ${textColorVar('content-tertiary')}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Menyegarkan...
            </motion.span>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
