import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, textColorVar } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  count?: number;
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  count,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const prefersReduced = useReducedMotion();

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 w-full text-left py-2 group"
        aria-expanded={isOpen}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className={cn('text-sm font-semibold flex-1', textColorVar('content-primary'))}>
          {title}
          {count !== undefined && (
            <span className={cn('ml-1 text-xs font-normal', textColorVar('content-tertiary'))}>
              ({count})
            </span>
          )}
        </span>
        <span
          className={cn(
            textColorVar('content-tertiary'),
            'group-hover:text-[var(--color-content-secondary)] transition-colors',
          )}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : { height: 'auto', opacity: 1 }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { height: 0, opacity: 0 }
            }
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
