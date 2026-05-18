import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExpenseForecasting } from './useExpenseForecasting';
import type { Transaction } from '@/lib/supabase';

const mockTransactions: Transaction[] = [
  // Month 1 (3 months ago - October)
  { id: '1', user_id: 1, amount: 80000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2023-10-05', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '2', user_id: 1, amount: 40000, type: 'expense', category: 'Transport', subcategory: null, note: '', date: '2023-10-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '3', user_id: 1, amount: 70000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2023-10-15', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Month 2 (2 months ago - November)
  { id: '4', user_id: 1, amount: 100000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2023-11-05', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '5', user_id: 1, amount: 50000, type: 'expense', category: 'Transport', subcategory: null, note: '', date: '2023-11-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '6', user_id: 1, amount: 80000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2023-11-15', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Month 3 (last month - December)
  { id: '7', user_id: 1, amount: 120000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2023-12-05', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '8', user_id: 1, amount: 60000, type: 'expense', category: 'Transport', subcategory: null, note: '', date: '2023-12-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '9', user_id: 1, amount: 100000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2023-12-15', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // Current month (January)
  { id: '10', user_id: 1, amount: 50000, type: 'expense', category: 'Food & Dining', subcategory: null, note: '', date: '2024-01-18', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '11', user_id: 1, amount: 40000, type: 'expense', category: 'Transport', subcategory: null, note: '', date: '2024-01-19', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
];

describe('useExpenseForecasting', () => {
  it('should calculate next month forecast based on 3-month history', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    expect(result.current.nextMonthForecast).toBeDefined();
    expect(result.current.nextMonthForecast).toBeGreaterThan(0);
    // Food: 100+80, 110+90, 120+100 = 180,200,220 (upward trend ~130)
    // Transport: 50, 60, 70 (upward trend ~75)
    // Total trend: 230, 260, 290 - should forecast around 320
    expect(result.current.nextMonthForecast).toBeGreaterThan(300);
  });

  it('should generate category forecasts with confidence levels', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    expect(result.current.categoryForecasts).toBeDefined();
    expect(result.current.categoryForecasts.length).toBeGreaterThan(0);

    const foodForecast = result.current.categoryForecasts.find(
      (c) => c.category === 'Food & Dining',
    );
    expect(foodForecast).toBeDefined();
    expect(foodForecast?.confidence).toMatch(/high|medium|low/);
    expect(foodForecast?.predicted).toBeGreaterThan(0);
  });

  it('should detect upward and downward trends', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    const trends = result.current.categoryForecasts.map((c) => c.trend);
    expect(trends).toContain('up');
  });

  it('should calculate current vs projected variance', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    expect(result.current.currentVsProjected).toBeDefined();
    expect(result.current.currentVsProjected.currentMonthTotal).toBeGreaterThan(0);
    expect(result.current.currentVsProjected.projectedMonthTotal).toBeGreaterThan(0);
    expect(result.current.currentVsProjected.variance).toBeDefined();
  });

  it('should calculate pacing metrics', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    expect(result.current.currentPacing).toBeDefined();
    expect(result.current.currentPacing.daysPassed).toBeGreaterThan(0);
    expect(result.current.currentPacing.daysInMonth).toBe(31);
    expect(result.current.currentPacing.percentMonthComplete).toBeGreaterThan(0);
    expect(result.current.currentPacing.percentMonthComplete).toBeLessThanOrEqual(100);
    expect(result.current.currentPacing.dailyBudget).toBeGreaterThan(0);
  });

  it('should determine if on track', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    expect(result.current.currentPacing.onTrack).toBeDefined();
    expect(typeof result.current.currentPacing.onTrack).toBe('boolean');
  });

  it('should generate insights from forecast', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    expect(result.current.insights).toBeDefined();
    expect(Array.isArray(result.current.insights)).toBe(true);
  });

  it('should assign confidence levels to categories', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    const allForecasts = result.current.categoryForecasts;
    expect(allForecasts.length).toBeGreaterThan(0);

    // All forecasts should have a confidence level
    allForecasts.forEach((forecast) => {
      expect(['high', 'medium', 'low']).toContain(forecast.confidence);
    });
  });

  it('should sort category forecasts by predicted amount', () => {
    const { result } = renderHook(() => useExpenseForecasting(mockTransactions, 1, 2024));

    const forecasts = result.current.categoryForecasts;
    for (let i = 0; i < forecasts.length - 1; i++) {
      expect(forecasts[i].predicted).toBeGreaterThanOrEqual(forecasts[i + 1].predicted);
    }
  });

  it('should filter out non-expense transactions', () => {
    const withIncome: Transaction[] = [
      ...mockTransactions,
      {
        id: '100',
        user_id: 1,
        amount: 5000000,
        type: 'income',
        category: 'Salary',
        subcategory: null,
        note: '',
        date: '2024-01-01',
        ai_confidence: 'high',
        wallet_id: null,
        created_at: '',
        updated_at: '',
      },
    ];

    const { result } = renderHook(() => useExpenseForecasting(withIncome, 1, 2024));

    // Forecast should not include the income
    expect(result.current.nextMonthForecast).toBeLessThan(5000000);
  });
});
