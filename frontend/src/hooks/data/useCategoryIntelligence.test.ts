import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCategoryIntelligence } from './useCategoryIntelligence';
import type { Transaction, Budget } from '@/lib/supabase';

const mockTransactions: Transaction[] = [
  // October - Food
  { id: '1', user_id: 1, amount: 100000, type: 'expense', category: 'Food & Dining', subcategory: null, note: 'Warung Makan Soto', date: '2023-10-05', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '2', user_id: 1, amount: 85000, type: 'expense', category: 'Food & Dining', subcategory: null, note: 'Restoran Nusantara', date: '2023-10-12', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '3', user_id: 1, amount: 45000, type: 'expense', category: 'Transport', subcategory: null, note: 'Ojek Online', date: '2023-10-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // November - Food
  { id: '4', user_id: 1, amount: 110000, type: 'expense', category: 'Food & Dining', subcategory: null, note: 'Warung Makan Soto', date: '2023-11-05', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '5', user_id: 1, amount: 95000, type: 'expense', category: 'Food & Dining', subcategory: null, note: 'Restoran Padang', date: '2023-11-12', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '6', user_id: 1, amount: 50000, type: 'expense', category: 'Transport', subcategory: null, note: 'Taksi Online', date: '2023-11-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // December - Food
  { id: '7', user_id: 1, amount: 120000, type: 'expense', category: 'Food & Dining', subcategory: null, note: 'Warung Makan Soto', date: '2023-12-05', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '8', user_id: 1, amount: 105000, type: 'expense', category: 'Food & Dining', subcategory: null, note: 'Kafe Kopi Baru', date: '2023-12-12', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '9', user_id: 1, amount: 60000, type: 'expense', category: 'Transport', subcategory: null, note: 'Bus Kota', date: '2023-12-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // January current month
  { id: '10', user_id: 1, amount: 75000, type: 'expense', category: 'Food & Dining', subcategory: null, note: 'Warung Makan Soto', date: '2024-01-18', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '11', user_id: 1, amount: 40000, type: 'expense', category: 'Transport', subcategory: null, note: 'Ojek Online', date: '2024-01-19', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
];

const mockBudgets: Budget[] = [
  {
    id: '1',
    user_id: 1,
    category: 'Food & Dining',
    amount: 400000,
    period: 'monthly',
    month: 1,
    year: 2024,
    created_at: '',
    updated_at: '',
  },
  {
    id: '2',
    user_id: 1,
    category: 'Transport',
    amount: 200000,
    period: 'monthly',
    month: 1,
    year: 2024,
    created_at: '',
    updated_at: '',
  },
];

describe('useCategoryIntelligence', () => {
  it('should categorize and aggregate transactions by category', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    expect(result.current.categories).toBeDefined();
    expect(result.current.categories.length).toBe(2); // Food & Dining and Transport
  });

  it('should calculate spending and variance against budget', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    const foodCategory = result.current.categories.find((c) => c.category === 'Food & Dining');
    expect(foodCategory).toBeDefined();
    expect(foodCategory?.spending).toBe(75000); // Current month
    expect(foodCategory?.budget).toBe(400000);
    expect(foodCategory?.variance).toBeLessThan(0); // Under budget
  });

  it('should calculate monthly history for trend detection', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    const foodCategory = result.current.categories.find((c) => c.category === 'Food & Dining');
    expect(foodCategory?.monthlyHistory).toHaveLength(3);
    expect(foodCategory?.monthlyHistory[0]).toBe(75000); // Current
    expect(foodCategory?.monthlyHistory[1]).toBe(225000); // Previous
  });

  it('should detect spending trends', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    const foodCategory = result.current.categories.find((c) => c.category === 'Food & Dining');
    expect(['up', 'down', 'stable']).toContain(foodCategory?.trend);
  });

  it('should identify top merchants in each category', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    const foodCategory = result.current.categories.find((c) => c.category === 'Food & Dining');
    expect(foodCategory?.topMerchants).toBeDefined();
    expect(foodCategory?.topMerchants.length).toBeGreaterThan(0);
    expect(foodCategory?.topMerchants[0].name).toBeDefined();
    expect(foodCategory?.topMerchants[0].amount).toBeGreaterThan(0);
  });

  it('should calculate transaction statistics', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    const foodCategory = result.current.categories.find((c) => c.category === 'Food & Dining');
    expect(foodCategory?.transactionCount).toBeGreaterThan(0);
    expect(foodCategory?.avgTransaction).toBeGreaterThan(0);
    expect(foodCategory?.dailyRate).toBeGreaterThan(0);
  });

  it('should assign confidence levels based on consistency', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    result.current.categories.forEach((cat) => {
      expect(['high', 'medium', 'low']).toContain(cat.confidence);
    });
  });

  it('should generate category insights', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    const foodCategory = result.current.categories.find((c) => c.category === 'Food & Dining');
    expect(foodCategory?.insights).toBeDefined();
    expect(Array.isArray(foodCategory?.insights)).toBe(true);
  });

  it('should calculate total budget adherence', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    expect(result.current.budgetAdherence).toBeDefined();
    expect(typeof result.current.budgetAdherence).toBe('number');
  });

  it('should sort categories by spending descending', () => {
    const { result } = renderHook(() => useCategoryIntelligence(mockTransactions, mockBudgets, 1, 2024));

    const categories = result.current.categories;
    for (let i = 0; i < categories.length - 1; i++) {
      expect(categories[i].spending).toBeGreaterThanOrEqual(categories[i + 1].spending);
    }
  });
});
