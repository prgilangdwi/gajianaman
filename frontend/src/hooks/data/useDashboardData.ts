import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';
import { useTransactions, useRecentTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { useWallets } from '@/hooks/useWallets';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { useInsights } from '@/hooks/data/useInsights';
import { useFinancialHealth } from '@/hooks/data/useFinancialHealth';
import { useFinancialHealthScore } from '@/hooks/data/useFinancialHealthScore';
import { useBudgetRecommendations } from '@/hooks/data/useBudgetRecommendations';
import { useAIInsights } from '@/hooks/data/useAIInsights';
import { getCategoryMeta } from '@/lib/categoryMetadata';

export interface DashboardData {
  // User
  user: ReturnType<typeof useAuth>['user'];
  greeting: string;

  // Core financials
  income: number;
  expenses: number;
  balance: number;
  availableToSpend: number;
  totalBudget: number;
  budgetRemainingPct: number | null;

  // Metadata
  daysInMonth: number;
  daysRemaining: number;
  dailyBudget: number;
  daysUntilPayday: number | null;

  // Top categories (sorted by amount, top 3)
  topCategories: Array<{
    category: string;
    emoji: string;
    color: string;
    amount: number;
    percentage: number;
  }>;

  // Goals (active, sorted by progress descending)
  activeGoals: Array<{
    id: number;
    name: string;
    target: number;
    saved: number;
    progress: number;
    deadline: string | null;
  }>;

  // Recurring bills due this month
  upcomingBills: ReturnType<typeof useRecurringBills>['recurringBills'];

  // AI insights
  aiInsights: ReturnType<typeof useAIInsights>['insights'];
  aiLoading: boolean;
  healthScore: number;
  healthLabel: string;

  // Chart data (weekly income vs expense)
  weeklyChartData: Array<{ week: string; income: number; expense: number }>;

  // Loading states
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;

  // Wallets for filter
  wallets: ReturnType<typeof useWallets>['wallets'];
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { walletId } = useWalletFilter();
  const { wallets } = useWallets(user?.userId);
  const { transactions, income, expenses, isLoading, error } = useTransactions(month, year);
  const { transactions: recentTx } = useRecentTransactions(10);
  const { recurringBills } = useRecurringBills();
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  // AI data
  const healthScore = useFinancialHealthScore(transactions, budgets, month, year);
  const insights = useInsights(transactions, month, year);
  const financialHealth = useFinancialHealth(transactions, budgets, month, year);
  const budgetRecs = useBudgetRecommendations(transactions, budgets, month, year);
  const { insights: aiInsights, loading: aiLoading } = useAIInsights(month, year);

  // ── Derived calculations ──

  // Filter by wallet
  const filtered = useMemo(() => {
    if (walletId === 'all') return transactions;
    return transactions.filter((t) => t.wallet_id === walletId);
  }, [transactions, walletId]);

  const filteredIncome = useMemo(
    () => filtered.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    [filtered]
  );
  const filteredExpenses = useMemo(
    () => filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    [filtered]
  );

  const displayIncome = walletId === 'all' ? income : filteredIncome;
  const displayExpenses = walletId === 'all' ? expenses : filteredExpenses;
  const balance = displayIncome - displayExpenses;

  // Budget calculations
  const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + b.amount, 0), [budgets]);
  const availableToSpend = Math.max(0, totalBudget - displayExpenses);
  const budgetRemainingPct = useMemo(() => {
    if (totalBudget <= 0) return null;
    return Math.round(((totalBudget - displayExpenses) / totalBudget) * 100);
  }, [totalBudget, displayExpenses]);

  // Time calculations
  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [month, year]);
  const currentDay = new Date().getDate();
  const daysRemaining = daysInMonth - currentDay + 1;
  const dailyBudget = useMemo(() => {
    if (daysRemaining <= 0 || totalBudget <= 0) return 0;
    const remaining = Math.max(0, totalBudget - displayExpenses);
    return Math.floor(remaining / daysRemaining);
  }, [totalBudget, daysRemaining, displayExpenses]);

  const daysUntilPayday = useMemo(() => {
    if (!user?.payday_date) return null;
    const payday = Number(user.payday_date);
    const daysLeft = payday >= currentDay ? payday - currentDay : daysInMonth - currentDay + payday;
    return daysLeft;
  }, [user?.payday_date, currentDay, daysInMonth]);

  // Top categories
  const topCategories = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    filtered
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + Number(t.amount);
      });

    const sorted = Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const total = sorted.reduce((s, [, v]) => s + v, 0);

    return sorted.map(([category, amount]) => {
      const meta = getCategoryMeta(category);
      return {
        category,
        emoji: meta.emoji,
        color: meta.color ?? 'var(--color-content-tertiary)',
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      };
    });
  }, [filtered]);

  // Active goals
  const activeGoals = useMemo(() => {
    return goals
      .filter((g) => Number(g.saved_amount) < Number(g.target_amount))
      .map((g) => ({
        id: g.id,
        name: g.name,
        target: Number(g.target_amount),
        saved: Number(g.saved_amount),
        progress: Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100),
        deadline: g.deadline,
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  }, [goals]);

  // Weekly chart data
  const weeklyChartData = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    return Array.from({ length: 4 }, (_, weekIdx) => {
      let weekIncome = 0;
      let weekExpense = 0;
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + weekIdx * 7 + i);
        if (date.getMonth() !== month - 1) continue;
        const dateStr = date.toISOString().split('T')[0];
        const dayTxs = filtered.filter((t) => t.date === dateStr);
        weekIncome += dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
        weekExpense += dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
      }
      return { week: `W${weekIdx + 1}`, income: weekIncome, expense: weekExpense };
    });
  }, [filtered, month, year]);

  // Greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Selamat pagi' : h < 17 ? 'Selamat siang' : 'Selamat sore';
  }, []);

  return {
    user,
    greeting,
    income: displayIncome,
    expenses: displayExpenses,
    balance,
    availableToSpend,
    totalBudget,
    budgetRemainingPct,
    daysInMonth,
    daysRemaining,
    dailyBudget,
    daysUntilPayday,
    topCategories,
    activeGoals,
    upcomingBills: recurringBills,
    aiInsights,
    aiLoading,
    healthScore: healthScore.score,
    healthLabel: healthScore.label,
    weeklyChartData,
    isLoading,
    error: error || null,
    isEmpty: transactions.length === 0,
    wallets,
  };
}
