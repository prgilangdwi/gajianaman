import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * CurrencyInput — Mobile-optimized IDR currency input
 * Displays formatted Rp while accepting numeric input; stores raw integer internally
 *
 * @usage
 * const [amount, setAmount] = useState(0);
 * <CurrencyInput value={amount} onChange={setAmount} placeholder="Rp 0" />
 *
 * @note Uses numeric inputMode for native mobile number pad (iOS/Android)
 * @font DM Mono (--text-mono-lg for visual alignment with financial data)
 * @a11y aria-label for screen readers; input[type="text"] with numeric validation
 * @phase Phase 07 — Mobile-First UX Optimization
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = 'Rp 0',
  disabled = false,
  className,
  onFocus,
  onBlur,
}: CurrencyInputProps) {
  // Format internal number to display string (e.g. 150000 → "Rp 150.000")
  const displayValue = useMemo(() => {
    if (value === 0) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, [value]);

  // Handle input: extract digits only, convert to number
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;

      // Extract only digits
      const digitsOnly = rawInput.replace(/\D/g, '');

      // Convert to number; handle empty input as 0
      const numericValue = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);

      // Limit to reasonable transaction size (max 1 billion IDR)
      const clamped = Math.min(numericValue, 1_000_000_000);

      onChange(clamped);
    },
    [onChange]
  );

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
      className={cn(
        // Base styles
        'w-full px-3 py-2.5',
        // Typography: DM Mono (financial data standard)
        'font-mono text-lg leading-relaxed',
        // Focus state: blue accent
        'border-2 border-slate-300 dark:border-slate-600 rounded-lg',
        'focus:border-[var(--color-brand-primary)] focus:outline-none',
        // Disabled state
        disabled ? 'bg-slate-100 dark:bg-slate-800 opacity-50 cursor-not-allowed' : 'bg-white dark:bg-slate-900',
        // Text color
        'text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400',
        // Touch target: 44px minimum (py-2.5 = 20px, with padding)
        'min-h-[44px] touch-manipulation',
        // Transitions for smooth focus
        'transition-colors duration-150',
        className
      )}
      aria-label="Jumlah transaksi dalam Rupiah"
    />
  );
}
