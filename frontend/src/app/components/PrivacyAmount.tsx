import { usePrivacy } from '@/hooks/usePrivacy';
import { cn } from '@/lib/utils';

interface PrivacyAmountProps {
  value: string;
  className?: string;
}

export function PrivacyAmount({ value, className }: PrivacyAmountProps) {
  const { isHidden } = usePrivacy();
  return (
    <span className={cn(isHidden && 'privacy-hidden', className)}>
      {value}
    </span>
  );
}
