import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInsights } from './useInsights';
import type { Transaction } from '@/lib/supabase';

describe('useInsights hook', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      user_id: 1,
      amount: 50000,
      type: 'expense',
      category: 'Food & Dining',
      subcategory: null,
      note: 'Lunch',
      ai_confidence: 0.95,
      date: '2024-05-10',
      created_at: new Date('2024-05-10').toISOString(),
    },
    {
      id: '2',
      user_id: 1,
      amount: 30000,
      type: 'expense',
      category: 'Food & Dining',
      subcategory: null,
      note: 'Dinner',
      ai_confidence: 0.92,
      date: '2024-05-11',
      created_at: new Date('2024-05-11').toISOString(),
    },
    {
      id: '3',
      user_id: 1,
      amount: 100000,
      type: 'expense',
      category: 'Transport',
      subcategory: null,
      note: 'Uber',
      ai_confidence: 0.88,
      date: '2024-04-10',
      created_at: new Date('2024-04-10').toISOString(),
    },
    {
      id: '4',
      user_id: 1,
      amount: 80000,
      type: 'expense',
      category: 'Transport',
      subcategory: null,
      note: 'Grab',
      ai_confidence: 0.90,
      date: '2024-04-15',
      created_at: new Date('2024-04-15').toISOString(),
    },
  ];

  it('calculates spending patterns correctly', () => {
    const { result } = renderHook(() => useInsights(mockTransactions, 5, 2024));

    expect(result.current.patterns).toBeDefined();
    expect(result.current.patterns.length).toBeGreaterThan(0);

    const foodPattern = result.current.patterns.find(p => p.category === 'Food & Dining');
    expect(foodPattern).toBeDefined();
    expect(foodPattern?.lastMonth).toBeGreaterThan(0);
  });

  it('generates budget recommendations with confidence scoring', () => {
    const { result } = renderHook(() => useInsights(mockTransactions, 5, 2024));

    expect(result.current.budgetRecommendations).toBeDefined();
    expect(result.current.budgetRecommendations.length).toBeGreaterThan(0);

    result.current.budgetRecommendations.forEach(rec => {
      expect(['high', 'medium', 'low']).toContain(rec.confidence);
      expect(rec.recommendedAmount).toBeGreaterThan(rec.avgSpending);
      expect(rec.recommendedAmount).toBeLessThan(rec.avgSpending * 1.2);
    });
  });

  it('applies 15% buffer to recommendations', () => {
    const { result } = renderHook(() => useInsights(mockTransactions, 5, 2024));

    result.current.budgetRecommendations.forEach(rec => {
      const expectedRecommendation = Math.round(rec.avgSpending * 1.15);
      expect(rec.recommendedAmount).toBe(expectedRecommendation);
    });
  });

  it('calculates spending forecast correctly', () => {
    const { result } = renderHook(() => useInsights(mockTransactions, 5, 2024));

    expect(result.current.forecast).toBeDefined();
    expect(result.current.forecast.daysRemaining).toBeGreaterThanOrEqual(0);
    expect(result.current.forecast.daysElapsed).toBeGreaterThan(0);
    expect(result.current.forecast.projectedMonthEnd).toBeGreaterThanOrEqual(result.current.forecast.currentSpent);
  });

  it('marks insufficient data flag when needed', () => {
    const minimalTransactions: Transaction[] = [
      mockTransactions[0],
    ];

    const { result } = renderHook(() => useInsights(minimalTransactions, 5, 2024));
    expect(result.current.hasEnoughData).toBe(false);
  });

  it('identifies sufficient data with 10+ transactions', () => {
    const sufficientTransactions = Array.from({ length: 12 }, (_, i) => ({
      ...mockTransactions[0],
      id: String(i),
      date: new Date(2024, 4, i + 1).toISOString().split('T')[0],
    }));

    const { result } = renderHook(() => useInsights(sufficientTransactions, 5, 2024));
    expect(result.current.hasEnoughData).toBe(true);
  });

  it('sorts patterns by last month spending', () => {
    const { result } = renderHook(() => useInsights(mockTransactions, 5, 2024));

    for (let i = 1; i < result.current.patterns.length; i++) {
      expect(result.current.patterns[i - 1].lastMonth).toBeGreaterThanOrEqual(result.current.patterns[i].lastMonth);
    }
  });

  it('returns top 5 budget recommendations', () => {
    const manyTransactions: Transaction[] = Array.from({ length: 60 }, (_, i) => ({
      ...mockTransactions[i % 4],
      id: String(i),
      date: new Date(2024, i % 3, (i % 28) + 1).toISOString().split('T')[0],
    }));

    const { result } = renderHook(() => useInsights(manyTransactions, 5, 2024));
    expect(result.current.budgetRecommendations.length).toBeLessThanOrEqual(5);
  });
});
