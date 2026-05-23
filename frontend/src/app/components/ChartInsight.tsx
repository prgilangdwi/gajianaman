import React from 'react';
import { motion } from 'motion/react';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent } from './ui/card';
import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { fadeUp, useReducedMotion } from '@/lib/transitions';

interface ChartInsightProps {
  insight?: string;
  icon?: string | React.ReactNode;
  loading?: boolean;
  error?: boolean;
}

const FALLBACK_TEXT = 'Chart data loaded. AI insight unavailable.';

export default function ChartInsight({
  insight,
  icon = '📊',
  loading = false,
  error = false,
}: ChartInsightProps) {
  const prefersReduced = useReducedMotion();

  const displayText = error ? FALLBACK_TEXT : insight || FALLBACK_TEXT;

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
      animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
      transition={fadeUp.transition}
    >
      <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-shrink-0 text-xl">{icon}</div>
              <p className={cn('text-sm leading-relaxed', textColorVar('content-secondary'))}>
                {displayText}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
