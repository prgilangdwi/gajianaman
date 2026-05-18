import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRecurringTransactions } from './useRecurringTransactions';
import type { Transaction } from '@/lib/supabase';

describe('useRecurringTransactions hook', () => {
  it('detects monthly recurring transactions on same day', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        user_id: 1,
        amount: 150000,
        type: 'expense',
        category: 'Bills & Utilities',
        date: '2024-01-15',
        created_at: new Date('2024-01-15').toISOString(),
      },
      {
        id: '2',
        user_id: 1,
        amount: 150000,
        type: 'expense',
        category: 'Bills & Utilities',
        date: '2024-02-15',
        created_at: new Date('2024-02-15').toISOString(),
      },
      {
        id: '3',
        user_id: 1,
        amount: 150000,
        type: 'expense',
        category: 'Bills & Utilities',
        date: '2024-03-15',
        created_at: new Date('2024-03-15').toISOString(),
      },
    ];

    const { result } = renderHook(() => useRecurringTransactions(transactions));

    expect(result.current.length).toBeGreaterThan(0);
    const recurring = result.current.find((r) => r.category === 'Bills & Utilities');
    expect(recurring).toBeDefined();
    expect(recurring?.frequency).toBe('monthly');
    expect(recurring?.dayOfMonth).toBe(15);
    expect(recurring?.confidence).toBe('high');
  });

  it('ignores income and savings transactions', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        user_id: 1,
        amount: 5000000,
        type: 'income',
        category: 'Salary',
        date: '2024-01-01',
        created_at: new Date('2024-01-01').toISOString(),
      },
      {
        id: '2',
        user_id: 1,
        amount: 5000000,
        type: 'income',
        category: 'Salary',
        date: '2024-02-01',
        created_at: new Date('2024-02-01').toISOString(),
      },
    ];

    const { result } = renderHook(() => useRecurringTransactions(transactions));
    expect(result.current.length).toBe(0);
  });

  it('requires at least 2 transactions for detection', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        user_id: 1,
        amount: 50000,
        type: 'expense',
        category: 'Food & Dining',
        date: '2024-01-10',
        created_at: new Date('2024-01-10').toISOString(),
      },
    ];

    const { result } = renderHook(() => useRecurringTransactions(transactions));
    expect(result.current.length).toBe(0);
  });

  it('detects weekly recurring transactions', () => {
    const transactions: Transaction[] = Array.from({ length: 5 }, (_, i) => ({
      id: String(i),
      user_id: 1,
      amount: 50000,
      type: 'expense' as const,
      category: 'Food & Dining',
      date: new Date(2024, 0, 1 + i * 7).toISOString().split('T')[0],
      created_at: new Date(2024, 0, 1 + i * 7).toISOString(),
    }));

    const { result } = renderHook(() => useRecurringTransactions(transactions));

    const recurring = result.current.find((r) => r.category === 'Food & Dining');
    expect(recurring).toBeDefined();
    expect(recurring?.frequency).toBe('weekly');
  });

  it('groups transactions by category and amount (with rounding)', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        user_id: 1,
        amount: 152500,
        type: 'expense',
        category: 'Shopping',
        date: '2024-01-20',
        created_at: new Date('2024-01-20').toISOString(),
      },
      {
        id: '2',
        user_id: 1,
        amount: 150000,
        type: 'expense',
        category: 'Shopping',
        date: '2024-02-20',
        created_at: new Date('2024-02-20').toISOString(),
      },
      {
        id: '3',
        user_id: 1,
        amount: 148000,
        type: 'expense',
        category: 'Shopping',
        date: '2024-03-20',
        created_at: new Date('2024-03-20').toISOString(),
      },
    ];

    const { result } = renderHook(() => useRecurringTransactions(transactions));

    const shopping = result.current.find((r) => r.category === 'Shopping');
    expect(shopping).toBeDefined();
    expect(shopping?.transactionCount).toBeGreaterThanOrEqual(2);
  });

  it('assigns confidence levels based on transaction count', () => {
    const transactions1: Transaction[] = [
      {
        id: '1',
        user_id: 1,
        amount: 200000,
        type: 'expense',
        category: 'Entertainment',
        date: '2024-01-05',
        created_at: new Date('2024-01-05').toISOString(),
      },
      {
        id: '2',
        user_id: 1,
        amount: 200000,
        type: 'expense',
        category: 'Entertainment',
        date: '2024-02-05',
        created_at: new Date('2024-02-05').toISOString(),
      },
    ];

    const { result: result1 } = renderHook(() => useRecurringTransactions(transactions1));
    const rec1 = result1.current[0];
    expect(['medium', 'low']).toContain(rec1?.confidence);
  });

  it('returns empty array for non-recurring transactions', () => {
    const transactions: Transaction[] = [
      {
        id: '1',
        user_id: 1,
        amount: 50000,
        type: 'expense',
        category: 'Food & Dining',
        date: '2024-01-10',
        created_at: new Date('2024-01-10').toISOString(),
      },
      {
        id: '2',
        user_id: 1,
        amount: 75000,
        type: 'expense',
        category: 'Food & Dining',
        date: '2024-01-20',
        created_at: new Date('2024-01-20').toISOString(),
      },
      {
        id: '3',
        user_id: 1,
        amount: 100000,
        type: 'expense',
        category: 'Food & Dining',
        date: '2024-02-08',
        created_at: new Date('2024-02-08').toISOString(),
      },
    ];

    const { result } = renderHook(() => useRecurringTransactions(transactions));
    expect(result.current.length).toBe(0);
  });

  it('sorts by transaction count (most recurring first)', () => {
    const transactions: Transaction[] = [
      // Transport: 4 occurrences
      ...Array.from({ length: 4 }, (_, i) => ({
        id: String(i),
        user_id: 1,
        amount: 50000,
        type: 'expense' as const,
        category: 'Transport',
        date: new Date(2024, 0, 1 + i * 7).toISOString().split('T')[0],
        created_at: new Date(2024, 0, 1 + i * 7).toISOString(),
      })),
      // Food: 3 occurrences
      ...Array.from({ length: 3 }, (_, i) => ({
        id: String(10 + i),
        user_id: 1,
        amount: 100000,
        type: 'expense' as const,
        category: 'Food & Dining',
        date: new Date(2024, 0, 15 + i * 7).toISOString().split('T')[0],
        created_at: new Date(2024, 0, 15 + i * 7).toISOString(),
      })),
    ];

    const { result } = renderHook(() => useRecurringTransactions(transactions));

    if (result.current.length >= 2) {
      expect(result.current[0].transactionCount).toBeGreaterThanOrEqual(
        result.current[1].transactionCount,
      );
    }
  });
});
