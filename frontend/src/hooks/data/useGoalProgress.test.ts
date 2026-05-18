import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGoalProgress } from './useGoalProgress';
import type { Goal, Transaction } from '@/lib/supabase';

const mockGoals: Goal[] = [
  {
    id: '1',
    user_id: 1,
    name: 'Liburan Bali',
    target_amount: 10000000,
    saved_amount: 4000000,
    deadline: '2024-06-30',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: '2',
    user_id: 1,
    name: 'Beli Motor',
    target_amount: 20000000,
    saved_amount: 8000000,
    deadline: '2024-12-31',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const mockTransactions: Transaction[] = [
  // October savings
  { id: '1', user_id: 1, amount: 1000000, type: 'saving', category: 'Savings', subcategory: null, note: 'Tabung', date: '2023-10-15', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '2', user_id: 1, amount: 500000, type: 'saving', category: 'Investment', subcategory: null, note: 'Saham', date: '2023-10-20', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // November savings
  { id: '3', user_id: 1, amount: 1200000, type: 'saving', category: 'Savings', subcategory: null, note: 'Tabung', date: '2023-11-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '4', user_id: 1, amount: 600000, type: 'saving', category: 'Investment', subcategory: null, note: 'Saham', date: '2023-11-18', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // December savings
  { id: '5', user_id: 1, amount: 1500000, type: 'saving', category: 'Savings', subcategory: null, note: 'Tabung', date: '2023-12-05', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
  { id: '6', user_id: 1, amount: 700000, type: 'saving', category: 'Investment', subcategory: null, note: 'Saham', date: '2023-12-25', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },

  // January (current month)
  { id: '7', user_id: 1, amount: 800000, type: 'saving', category: 'Savings', subcategory: null, note: 'Tabung', date: '2024-01-10', ai_confidence: 'high', wallet_id: null, created_at: '', updated_at: '' },
];

describe('useGoalProgress', () => {
  it('should calculate total savings target and saved amount', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    expect(result.current.totalSavingsTarget).toBe(30000000);
    expect(result.current.totalSaved).toBe(12000000);
  });

  it('should calculate total progress percentage', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    // 12000000 / 30000000 = 40%
    expect(result.current.totalProgress).toBe(40);
  });

  it('should calculate average monthly savings rate', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    // Should calculate a positive average monthly rate
    expect(result.current.avgMonthlyRate).toBeGreaterThan(0);
    expect(typeof result.current.avgMonthlyRate).toBe('number');
  });

  it('should generate milestones for each goal', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    const goal = result.current.goals[0];
    expect(goal.milestones.length).toBe(4);
    expect(goal.milestones[0].percent).toBe(25);
    expect(goal.milestones[1].percent).toBe(50);
    expect(goal.milestones[2].percent).toBe(75);
    expect(goal.milestones[3].percent).toBe(100);
  });

  it('should mark achieved milestones correctly', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    const goal = result.current.goals[0]; // Liburan Bali: 4M/10M = 40%
    expect(goal.milestones[0].achieved).toBe(true); // 25% achieved
    expect(goal.milestones[1].achieved).toBe(false); // 50% not achieved
    expect(goal.milestones[2].achieved).toBe(false); // 75% not achieved
  });

  it('should determine goal status correctly', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    // Check that statuses are valid
    result.current.goals.forEach((goal) => {
      expect(['on-track', 'at-risk', 'delayed']).toContain(goal.status);
    });
  });

  it('should calculate acceleration needed for at-risk goals', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    result.current.goals.forEach((goal) => {
      expect(goal.accelerationNeeded).toBeGreaterThanOrEqual(0);
      expect(typeof goal.accelerationPercent).toBe('number');
    });
  });

  it('should generate insights for each goal', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    result.current.goals.forEach((goal) => {
      expect(Array.isArray(goal.insights)).toBe(true);
      expect(goal.insights.length).toBeGreaterThan(0);
    });
  });

  it('should count goals by status', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    const { goalsOnTrack, goalsAtRisk, goalsDelayed } = result.current;
    expect(goalsOnTrack + goalsAtRisk + goalsDelayed).toBe(mockGoals.length);
  });

  it('should project completion dates based on savings rate', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    result.current.goals.forEach((goal) => {
      expect(goal.projectedDate).toBeDefined();
      expect(goal.projectedDateFormatted).toBeDefined();
      expect(goal.daysUntilProjected).toBeGreaterThanOrEqual(0);
    });
  });

  it('should include monthly history in monthly rate calculation', () => {
    const { result } = renderHook(() => useGoalProgress(mockGoals, mockTransactions, 1, 2024));

    result.current.goals.forEach((goal) => {
      expect(Array.isArray(goal.monthlyHistory)).toBe(true);
      expect(goal.monthlyHistory.length).toBe(3); // 3-month history
      expect(goal.monthlyHistory.every((m) => m >= 0)).toBe(true);
    });
  });
});
