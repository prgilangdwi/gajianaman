import { ReactNode } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

/**
 * Error state — shows when data fetch fails
 * Includes retry button for user to recover
 */
interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Gagal memuat data',
  message = 'Ada kesalahan saat mengambil data. Silakan coba lagi.',
  onRetry,
}: ErrorStateProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4"
    >
      <AlertCircle className={cn('w-12 h-12', textColorVar('sentiment-negative'))} />
      <div className="text-center space-y-3">
        <p className={cn('text-lg font-semibold', textColorVar('sentiment-negative'))}>{title}</p>
        <p className={cn('text-sm max-w-sm', textColorVar('content-tertiary'))}>{message}</p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="default" className="mt-2">
          Coba Lagi
        </Button>
      )}
    </motion.div>
  );
}

/**
 * Empty state — shows when there's no data to display
 * Guides user on what to do next
 */
interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title = 'Belum ada data',
  message = 'Mulai dengan menambahkan transaksi pertama Anda',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center py-16 sm:py-20 gap-4"
    >
      {icon || <TrendingUp className={cn('w-12 h-12 opacity-40', textColorVar('content-tertiary'))} />}
      <div className="text-center space-y-2">
        <p className={cn('text-lg font-semibold', textColorVar('content-primary'))}>{title}</p>
        <p className={cn('text-sm max-w-sm', textColorVar('content-tertiary'))}>{message}</p>
      </div>
      {onAction && actionLabel && (
        <Button onClick={onAction} variant="default" className="mt-2">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

/**
 * Loading state — shows skeleton placeholders while data loads
 */
interface LoadingStateProps {
  count?: number;
  type?: 'card' | 'row' | 'chart';
}

function SkeletonCard() {
  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
      <CardContent className="pt-6">
        <div className={cn('h-4 rounded animate-pulse w-24 mb-3', bgColorVar('bg-neutral'))} />
        <div className={cn('h-8 rounded animate-pulse w-36', bgColorVar('bg-neutral'))} />
      </CardContent>
    </Card>
  );
}

function SkeletonRow() {
  return (
    <div className={cn('flex items-center justify-between py-3 border-b last:border-0', borderColorVar('border-neutral'))}>
      <div className="flex items-center gap-3 flex-1">
        <div className={cn('w-10 h-10 rounded-full animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
        <div className="space-y-1 flex-1">
          <div className={cn('h-4 w-32 rounded animate-pulse', bgColorVar('bg-neutral'))} />
          <div className={cn('h-3 w-24 rounded animate-pulse', bgColorVar('bg-neutral'))} />
        </div>
      </div>
      <div className={cn('h-4 w-20 rounded animate-pulse flex-shrink-0', bgColorVar('bg-neutral'))} />
    </div>
  );
}

function SkeletonChart() {
  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
      <CardContent className="pt-6">
        <div className={cn('h-64 rounded animate-pulse', bgColorVar('bg-neutral'))} />
      </CardContent>
    </Card>
  );
}

export function LoadingState({ count = 3, type = 'card' }: LoadingStateProps) {
  const prefersReduced = useReducedMotion();

  const renderSkeleton = () => {
    switch (type) {
      case 'row':
        return Array.from({ length: count }).map((_, i) => <SkeletonRow key={i} />);
      case 'chart':
        return <SkeletonChart />;
      case 'card':
      default:
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {renderSkeleton()}
    </motion.div>
  );
}
