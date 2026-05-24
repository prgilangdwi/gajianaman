import { useCallback, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BudgetItem {
  category: string;
  amount: number;
  confidence: number;
}

export interface BudgetRecommendation {
  budgetItems: BudgetItem[];
  totalRecommended: number;
  savingsRate: number;
  explanation: string;
}

interface GajianPayload {
  salaryAmount: number;
  salaryDate: number;
  fixedExpenses: { category: string; amount: number; description?: string }[];
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useBudgetRecommendation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null);

  const generateBudget = useCallback(
    async (input: GajianPayload): Promise<BudgetRecommendation> => {
      setIsLoading(true);
      setError(null);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch('/api/generate-budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: BudgetRecommendation = await res.json();
        setRecommendation(data);
        return data;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Terjadi kesalahan';
        setError(msg);
        const fallback: BudgetRecommendation = {
          budgetItems: [],
          totalRecommended: input.salaryAmount,
          savingsRate: 0.2,
          explanation: 'Gagal memuat rekomendasi AI. Silakan coba lagi.',
        };
        setRecommendation(fallback);
        return fallback;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { isLoading, error, recommendation, generateBudget };
}
