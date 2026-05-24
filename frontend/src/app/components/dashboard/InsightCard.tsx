import { Sparkles, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn, textColorVar, bgColorVar } from '@/lib/utils';

interface InsightCardProps {
  severity?: 'info' | 'warning' | 'critical' | 'success';
  emoji?: string;
  title?: string;
  body: string;
  className?: string;
}

export function InsightCard({
  severity = 'info',
  emoji,
  title,
  body,
  className,
}: InsightCardProps) {
  const severityStyles = {
    info: {
      bg: 'bg-[var(--color-brand-primary-light)]',
 icon: <Sparkles className="size-4 text-[var(--color-brand-primary)]" />,
      border: 'border-l-[var(--color-brand-primary)]',
    },
    warning: {
      bg: 'bg-[var(--color-sentiment-warning-bg)]',
      icon: (
 <AlertTriangle className="size-4 text-[var(--color-sentiment-warning)]" />
      ),
      border: 'border-l-[var(--color-sentiment-warning)]',
    },
    critical: {
      bg: 'bg-[var(--color-sentiment-negative-bg)]',
      icon: (
 <AlertTriangle className="size-4 text-[var(--color-sentiment-negative)]" />
      ),
      border: 'border-l-[var(--color-sentiment-negative)]',
    },
    success: {
      bg: 'bg-[var(--color-sentiment-positive-bg)]',
      icon: (
 <CheckCircle className="size-4 text-[var(--color-sentiment-positive)]" />
      ),
      border: 'border-l-[var(--color-sentiment-positive)]',
    },
  };

  const style = severityStyles[severity];

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-[var(--radius-md)] border-l-3',
        style.bg,
        style.border,
        className,
      )}
      role="status"
      aria-label={title ?? 'Insight'}
    >
      <span className="shrink-0 mt-0.5">
        {emoji ? <span className="text-sm">{emoji}</span> : style.icon}
      </span>
      <div className="min-w-0">
        {title && (
          <p className={cn('text-xs font-semibold mb-0.5', textColorVar('content-primary'))}>
            {title}
          </p>
        )}
        <p className={cn('text-xs leading-relaxed', textColorVar('content-secondary'))}>
          {body}
        </p>
      </div>
    </div>
  );
}
