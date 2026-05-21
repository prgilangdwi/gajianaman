import * as React from 'react';
import { cn } from '@/lib/utils';

interface InputBaseProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'text' | 'number' | 'currency';
  label?: string;
  error?: string;
  hint?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

const InputBase = React.forwardRef<HTMLInputElement, InputBaseProps>(
  (
    {
      type = 'text',
      label,
      error,
      hint,
      prefix,
      suffix,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);
    const internalRef = React.useRef<HTMLInputElement>(null);
    const mergedRef = ref || internalRef;

    // Initialize display value from external value prop (for currency mode)
    React.useEffect(() => {
      if (type === 'currency' && value !== undefined && value !== '') {
        const numValue = typeof value === 'string' ? value : String(value);
        const formatted = formatRupiah(parseInt(numValue, 10) || 0);
        setDisplayValue(formatted);
      }
    }, [type, value]);

    const formatRupiah = (num: number): string => {
      return `Rp ${new Intl.NumberFormat('id-ID').format(num)}`;
    };

    const stripCurrency = (str: string): number => {
      const numeric = str.replace(/\D/g, '');
      return parseInt(numeric, 10) || 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.currentTarget.value;

      if (type === 'currency') {
        // Strip non-numeric, format for display
        const numericValue = stripCurrency(inputValue);
        const formatted = formatRupiah(numericValue);
        setDisplayValue(formatted);

        // Emit raw numeric string via onChange
        const syntheticEvent = {
          ...e,
          currentTarget: { ...e.currentTarget, value: String(numericValue) },
          target: { ...e.target, value: String(numericValue) },
        } as React.ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);
      } else {
        onChange?.(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);

      if (type === 'currency' && displayValue) {
        // Show raw number on focus for easy editing
        const numericValue = stripCurrency(displayValue);
        e.currentTarget.value = String(numericValue);
      }

      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);

      if (type === 'currency') {
        // Reformat to IDR on blur
        const numericValue = stripCurrency(e.currentTarget.value);
        const formatted = formatRupiah(numericValue);
        setDisplayValue(formatted);
        e.currentTarget.value = formatted;
      }

      onBlur?.(e);
    };

    // For controlled currency input, use displayValue when focused (raw), otherwise (formatted)
    const displayInputValue =
      type === 'currency'
        ? isFocused
          ? stripCurrency(displayValue)
          : displayValue
        : value;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-semibold text-[var(--color-content-primary)]">
            {label}
          </label>
        )}

        <div
          className={cn(
            'inline-flex items-center rounded-[var(--radius-md)] border transition-all duration-[var(--duration-fast)] outline-none',
            error
              ? 'border-[var(--color-sentiment-negative)] focus-within:ring-[3px] focus-within:ring-[var(--color-sentiment-negative)]/50'
              : 'border-[var(--color-border-neutral)] focus-within:ring-[3px] focus-within:ring-[var(--color-brand-primary)]/50',
            disabled && 'opacity-50'
          )}
        >
          {prefix && (
            <div className="pl-3 text-sm font-medium text-[var(--color-content-primary)]">
              {prefix}
            </div>
          )}

          <input
            ref={mergedRef}
            type={type === 'currency' ? 'text' : type}
            value={displayInputValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            className={cn(
              'h-11 flex-1 bg-[var(--color-bg-card)] px-3 py-2 text-sm text-[var(--color-content-primary)] placeholder:text-[var(--color-content-tertiary)] outline-none disabled:cursor-not-allowed',
              prefix && 'pl-1',
              suffix && 'pr-1',
              className
            )}
            {...props}
          />

          {suffix && (
            <div className="pr-3 text-sm font-medium text-[var(--color-content-primary)]">
              {suffix}
            </div>
          )}
        </div>

        {error && (
          <span className="text-xs font-medium text-[var(--color-sentiment-negative)]">
            {error}
          </span>
        )}

        {hint && !error && (
          <span className="text-xs text-[var(--color-content-tertiary)]">
            {hint}
          </span>
        )}
      </div>
    );
  }
);

InputBase.displayName = 'InputBase';

export { InputBase };
export type { InputBaseProps };
