import { motion } from 'motion/react';
import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';

interface AIInsightCardProps {
  severity: 'critical' | 'warning' | 'info';
  emoji: string;
  title: string;
  body: string;
  prefersReduced?: boolean;
  delay?: number;
}

export function AIInsightCard({
  severity,
  emoji,
  title,
  body,
  prefersReduced = false,
  delay = 0,
}: AIInsightCardProps) {
  const borderColor =
    severity === 'critical'
      ? 'border-l-[var(--color-sentiment-negative)]'
      : severity === 'warning'
        ? 'border-l-[var(--color-sentiment-warning)]'
        : 'border-l-[var(--color-brand-primary)]';

  const bgColor =
    severity === 'critical'
      ? bgColorVar('sentiment-negative-bg')
      : severity === 'warning'
        ? bgColorVar('sentiment-warning-bg')
        : bgColorVar('sentiment-positive-bg');

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReduced ? 0 : delay, duration: 0.15 }}
      className={cn(
        'flex items-start gap-3 px-3 py-2.5 rounded-lg border-l-[3px]',
        borderColor,
        bgColor
      )}
    >
      <span className="text-base leading-none mt-0.5 flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-semibold leading-tight', textColorVar('content-primary'))}>
          {title}
        </p>
        {body && (
          <p className={cn('text-[11px] mt-0.5 leading-snug', textColorVar('content-tertiary'))}>
            {body}
          </p>
        )}
      </div>
    </motion.div>
  );
}
