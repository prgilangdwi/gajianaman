/**
 * Chart formatting utilities for displaying large numbers in compact notation
 * Used across Recharts charts for readability (K, M, B notation)
 */

/**
 * Format a number into compact readable notation
 * Examples: 1500 → "1.5K", 2500000 → "2.5M", 1500000000 → "1.5B"
 * @param value - The number to format
 * @returns Compact formatted string (K/M/B notation)
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return '0';

  const absValue = Math.abs(value);

  // Billion
  if (absValue >= 1_000_000_000) {
    const formatted = (value / 1_000_000_000).toFixed(1);
    return `${formatted === '-0.0' ? '0' : formatted}B`;
  }

  // Million
  if (absValue >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1);
    return `${formatted === '-0.0' ? '0' : formatted}M`;
  }

  // Thousand
  if (absValue >= 1_000) {
    const formatted = (value / 1_000).toFixed(1);
    return `${formatted === '-0.0' ? '0' : formatted}K`;
  }

  // Less than 1000
  return value.toString();
}

/**
 * Create a formatter function for Recharts YAxis/XAxis
 * Usage: <YAxis tickFormatter={createCompactAxisFormatter()} />
 * @returns Function that formats numbers for chart axes
 */
export function createCompactAxisFormatter() {
  return (value: number | string) => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : formatCompactNumber(num);
    }
    return formatCompactNumber(value);
  };
}

/**
 * Format a number with Rupiah currency and compact notation
 * Examples: 1500 → "Rp1.5K", 2500000 → "Rp2.5M"
 * @param value - The number to format
 * @returns Formatted string with Rp prefix
 */
export function formatRupiahCompact(value: number): string {
  return `Rp${formatCompactNumber(value)}`;
}

/**
 * Create a formatter function for Recharts tooltips with Rupiah
 * Usage: <Tooltip formatter={createRupiahAxisFormatter()} />
 * @returns Function that formats numbers as Rp with compact notation
 */
export function createRupiahAxisFormatter() {
  return (value: number | string) => {
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : formatRupiahCompact(num);
    }
    return formatRupiahCompact(value);
  };
}
