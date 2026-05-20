import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { colors, type } from './design-tokens';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

// ── Design Token Utilities ─────────────────────────────────────────────────

export function colorVar(colorPath: string): string {
  return `var(--color-${colorPath})`;
}

export function bgColorVar(colorKey: string): string {
  return `bg-[${colorVar(colorKey)}]`;
}

export function textColorVar(colorKey: string): string {
  return `text-[${colorVar(colorKey)}]`;
}

export function borderColorVar(colorKey: string): string {
  return `border-[${colorVar(colorKey)}]`;
}

export function statusStyleConfig(status: 'safe' | 'warning' | 'over' | 'none') {
  const configs = {
    safe: {
      bg: bgColorVar('sentiment-positive-bg'),
      text: textColorVar('sentiment-positive'),
      label: 'Aman',
    },
    warning: {
      bg: bgColorVar('sentiment-warning-bg'),
      text: textColorVar('sentiment-warning'),
      label: 'Hampir',
    },
    over: {
      bg: bgColorVar('sentiment-negative-bg'),
      text: textColorVar('sentiment-negative'),
      label: 'Melebihi',
    },
    none: {
      bg: bgColorVar('bg-neutral'),
      text: textColorVar('content-tertiary'),
      label: 'Belum Dibuat',
    },
  };
  return configs[status];
}
