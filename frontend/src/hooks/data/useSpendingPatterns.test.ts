import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSpendingPatterns } from './useSpendingPatterns';
import type { Transaction } from '@/lib/supabase';

const mockTransactions: Transaction[] = [
  // First week
  { id: '1', user_id: 1, amount: 50000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2024-01-01', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '2', user_id: 1, amount: 30000, type: 'expense', category: 'Transport', subcategory: null, note: '', date: '2024-01-03', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Second week
  { id: '3', user_id: 1, amount: 100000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2024-01-08', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '4', user_id: 1, amount: 40000, type: 'expense', category: 'Shopping', subcategory: null, note: '', date: '2024-01-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Third week
  { id: '5', user_id: 1, amount: 60000, type: 'expense', category: 'Bills & Utilities', subcategory: null, note: '', date: '2024-01-15', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Fourth week
  { id: '6', user_id: 1, amount: 80000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2024-01-22', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '7', user_id: 1, amount: 25000, type: 'expense', category: 'Entertainment', subcategory: null, note: '', date: '2024-01-23', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Fifth week
  { id: '8', user_id: 1, amount: 35000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2024-01-29', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '9', user_id: 1, amount: 45000, type: 'expense', category: 'Transport', subcategory: null, note: '', date: '2024-01-31', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Income (should be filtered out)
  { id: '10', user_id: 1, amount: 5000000, type: 'income', category: 'Salary', subcategory: null, note: '', date: '2024-01-01', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
];

describe('useSpendingPatterns', () => {
  it('should calculate daily patterns correctly', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    expect(result.current.dailyPatterns).toBeDefined();
    expect(result.current.dailyPatterns.length).toBe(31);

    // Day 1: 50000
    expect(result.current.dailyPatterns[0].spending).toBe(50000);
    expect(result.current.dailyPatterns[0].transactionCount).toBe(1);

    // Day 8: 100000
    expect(result.current.dailyPatterns[7].spending).toBe(100000);
  });

  it('should calculate weekly patterns correctly', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    expect(result.current.weeklyPatterns).toBeDefined();
    expect(result.current.weeklyPatterns.length).toBe(5);

    // Week 1: 50000 + 30000 = 80000
    expect(result.current.weeklyPatterns[0].spending).toBe(80000);
    expect(result.current.weeklyPatterns[0].week).toBe(1);

    // Week 2: 100000 + 40000 = 140000 (up from week 1)
    expect(result.current.weeklyPatterns[1].spending).toBe(140000);
    expect(result.current.weeklyPatterns[1].trend).toBe('up');
  });

  it('should identify peak day correctly', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    expect(result.current.peakDay).toBe('Monday, 8');
    expect(result.current.peakDayAmount).toBe(100000);
  });

  it('should calculate average daily spend correctly', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    const totalExpenses = 50000 + 30000 + 100000 + 40000 + 60000 + 80000 + 25000 + 35000 + 45000;
    const expected = Math.round(totalExpenses / 31);

    expect(result.current.averageDailySpend).toBe(expected);
  });

  it('should identify highest and lowest weeks', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    expect(result.current.highestWeek).toBe(2); // Week 2: 140000
    expect(result.current.lowestWeek).toBe(3); // Week 3: 60000
  });

  it('should identify day of week with most transactions', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    expect(result.current.mostActiveDay).toBeDefined();
    expect(typeof result.current.mostActiveDay).toBe('string');
  });

  it('should generate insights when peak day is significantly above average', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    const insightTexts = result.current.insights.map(i => i.toLowerCase());
    const hasPeakDayInsight = insightTexts.some(i => i.includes('pengeluaran tertinggi') || i.includes('hari'));

    expect(result.current.insights.length).toBeGreaterThan(0);
    expect(hasPeakDayInsight).toBe(true);
  });

  it('should filter out non-expense transactions', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    const totalFromResult = result.current.weeklyPatterns.reduce((sum, w) => sum + w.spending, 0);
    const expectedTotal = 465000; // All expenses except income

    expect(totalFromResult).toBe(expectedTotal);
  });

  it('should calculate transaction counts per day', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    expect(result.current.dailyPatterns[0].transactionCount).toBe(1); // Day 1
    expect(result.current.dailyPatterns[7].transactionCount).toBe(1); // Day 8
  });

  it('should detect trend changes between weeks', () => {
    const { result } = renderHook(() => useSpendingPatterns(mockTransactions, 1, 2024));

    // Week 1 to 2: 80000 -> 140000 (increase > 10%) = up
    expect(result.current.weeklyPatterns[1].trend).toBe('up');

    // Week 2 to 3: 140000 -> 60000 (decrease > 10%) = down
    expect(result.current.weeklyPatterns[2].trend).toBe('down');
  });
});
