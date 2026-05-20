import { ReactNode } from 'react';
import { Card, CardContent } from './ui/card';
import { cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';

interface BriefingCardProps {
  icon: ReactNode;
  iconColorClass: string;
  label: string;
  value: ReactNode;
  subtitle: string;
  valueClassName?: string;
}

export function BriefingCard({
  icon,
  iconColorClass,
  label,
  value,
  subtitle,
  valueClassName,
}: BriefingCardProps) {
  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'), 'shadow-[var(--shadow-card)]')}>
      <CardContent className="p-3 sm:p-4 space-y-1.5">
        <div className={cn('w-6 h-6 flex items-center justify-center', iconColorClass)}>
          {icon}
        </div>
        <p className={cn('text-[10px] sm:text-xs font-medium leading-tight', textColorVar('content-tertiary'))}>
          {label}
        </p>
        <div className={cn('text-sm sm:text-base leading-none', valueClassName)}>
          {value}
        </div>
        <p className={cn('text-[9px] sm:text-[11px]', textColorVar('content-tertiary'))}>
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}
