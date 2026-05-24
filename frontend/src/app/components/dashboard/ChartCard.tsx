import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer } from 'recharts';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
  headerAction?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  height = 220,
  collapsible = false,
  defaultCollapsed = false,
  emptyMessage = 'Belum ada data',
  isEmpty = false,
  headerAction,
  className,
}: ChartCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const prefersReduced = useReducedMotion();

  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'), className)}>
      <CardHeader
        className={cn('pb-2', collapsible && 'cursor-pointer select-none')}
        onClick={collapsible ? () => setIsCollapsed((prev) => !prev) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsCollapsed((prev) => !prev);
                }
              }
            : undefined
        }
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn('text-sm font-semibold', textColorVar('content-primary'))}>
              {title}
            </h3>
            {subtitle && (
              <p className={cn('text-xs mt-0.5', textColorVar('content-tertiary'))}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            {collapsible && (
              <span className={textColorVar('content-tertiary')}>
                {isCollapsed ? (
 <ChevronDown className="size-4 " />
                ) : (
 <ChevronUp className="size-4 " />
                )}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={
              prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }
            }
            animate={
              prefersReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }
            }
            exit={
              prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent>
              {isEmpty ? (
                <p
                  className={cn(
                    'text-xs text-center py-8',
                    textColorVar('content-tertiary'),
                  )}
                >
                  {emptyMessage}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={height}>
                  {children as any}
                </ResponsiveContainer>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
