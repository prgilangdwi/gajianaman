# PHASE 04: DASHBOARD & OVERVIEW MODERNIZATION

> **Phase:** 04 of 12  
> **Name:** Dashboard & Overview Modernization  
> **Duration:** 5–7 days (3 Claude Code sessions)  
> **Dependencies:** Phase 03 (Navigation & Layout Restructuring) complete  
> **Status:** NOT STARTED

---

## CROSS-REFERENCE

| Document | Section |
|----------|---------|
| `GAJIAN_AMAN_REDESIGN_STRATEGY.md` | §4.1 Overview Redesigned, §4.10 Insights |
| `GAJIAN_AMAN_REVAMP_AUDIT_REPORT.md` | §4.1 Overview audit, Dashboard hierarchy problems |
| `GAJIAN_AMAN_PROJECT_CONTEXT.md` | §6 UI/UX Architecture, §7 AI Integration |
| `GAJIAN_AMAN_FIGMA_PRODUCTION_SYSTEM.md` | Dashboard frames, Chart hierarchy |
| `phase-03-navigation.md` | Layout shell, HeaderBar, SectionTabBar, route `/home/overview` |

---

## SCOPE BOUNDARIES

### ✅ IN-SCOPE

1. **Complete `Overview.tsx` redesign** following dashboard storytelling hierarchy
2. **Hero Metric card:** Balance card with oversized monospace DM Mono typography
3. **Status Row:** Income / Spent / Available (3 compact cards, 2-column grid desktop)
4. **Quick Insight card:** AI-generated summary (uses existing `useAIInsights` hook)
5. **Spending Breakdown:** Collapsible bar chart section (progressive disclosure)
6. **Top Categories:** 3 category cards with icon, amount, percentage
7. **Goals Progress:** Mini progress cards for active goals
8. **Upcoming Bills:** Recurring bills due this month
9. **New `ChartCard` wrapper component** (ResponsiveContainer + tooltip + legend)
10. **New `StatCard` component** (icon + label + amount + trend indicator)
11. **New `InsightCard` component** (AI insight display with severity)
12. **New `QuickActions` component** (Add Transaction, View Report shortcuts)
13. **Collapsible sections** with progressive disclosure (expand/collapse)
14. **"Available to Spend" calculation** (income − expenses for current month)
15. **New `useDashboardData` orchestration hook** (combines multiple data sources)
16. **Mobile layout:** vertical stack, swipeable chart area
17. **Desktop layout:** 2-column grid for status row, full-width charts
18. **Loading states:** skeleton cards preserving exact layout heights
19. **Empty states:** contextual CTAs ("Add your first transaction")
20. **Dark mode support** for all new components
21. **Accessibility:** ARIA roles, keyboard navigation, screen reader support

### ❌ OUT-OF-SCOPE

1. Navigation components (completed in Phase 03)
2. Design tokens / CSS variables (completed in Phase 02)
3. Other page contents (Pengeluaran, Budget, Goals, etc.)
4. Backend API changes
5. Database schema changes
6. New data fetching hooks (reuse existing hooks; only create orchestration hook)
7. TransactionModal changes
8. Authentication flow changes
9. Chart library changes (keep Recharts)
10. Animation system changes (use existing `transitions.ts` presets)

---

## DO NOT TOUCH SECTIONS

> [!CAUTION]
> These files/modules must NOT be modified during Phase 04.

| File/Module | Reason |
|------------|--------|
| `frontend/src/app/components/ui/*` | shadcn/ui primitives — never edit |
| `frontend/src/app/components/Layout.tsx` | Phase 03 output — stable |
| `frontend/src/app/components/BottomNavigation.tsx` | Phase 03 output — stable |
| `frontend/src/app/components/DesktopSidebar.tsx` | Phase 03 output — stable |
| `frontend/src/app/components/HeaderBar.tsx` | Phase 03 output — stable |
| `frontend/src/app/components/SectionTabBar.tsx` | Phase 03 output — stable |
| `frontend/src/lib/navigationConfig.ts` | Phase 03 output — stable |
| `frontend/src/hooks/useNavigation.tsx` | Phase 03 output — stable |
| `frontend/src/hooks/useAuth.tsx` | Auth context — stable |
| `frontend/src/hooks/useTransactions.ts` | Data fetching — stable |
| `frontend/src/hooks/useBudgets.ts` | Data fetching — stable |
| `frontend/src/hooks/useGoals.ts` | Data fetching — stable |
| `frontend/src/hooks/useWallets.ts` | Data fetching — stable |
| `frontend/src/hooks/useRecurringBills.ts` | Data fetching — stable |
| `frontend/src/hooks/data/*` | Computed data hooks — stable (consumed, not modified) |
| `frontend/src/lib/supabase.ts` | Type definitions — stable |
| `frontend/src/lib/utils.ts` | Color helpers — stable |
| `frontend/src/lib/transitions.ts` | Animation presets — stable |
| `frontend/src/styles/*` | Design tokens — Phase 02 output |
| `frontend/src/app/pages/*.tsx` (except Overview.tsx) | Other pages — stable |
| `frontend/src/app/App.tsx` | Route structure — Phase 03 output |
| `frontend/api/*` | Vercel serverless functions — stable |
| `db/*` | Database operations — stable |
| `bot/*` | Telegram bot — stable |

---

## PRE-FLIGHT CHECKS

Before starting Phase 04, verify ALL of the following:

- [ ] Phase 03 merged: Navigation restructuring complete
- [ ] Route `/home/overview` renders current Overview.tsx
- [ ] `Layout.tsx` uses new DesktopSidebar + BottomNavigation + HeaderBar
- [ ] `SectionTabBar` renders for Home section
- [ ] `NavigationProvider` wraps the app in App.tsx
- [ ] All existing data hooks working: `useTransactions`, `useBudgets`, `useGoals`, `useWallets`, `useRecurringBills`
- [ ] AI hooks working: `useAIInsights`, `useInsights`, `useFinancialHealth`, `useBudgetRecommendations`
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without TypeScript errors
- [ ] Git is on clean branch: `git checkout -b phase-04/dashboard-modernization`
- [ ] Current Overview.tsx has 721 lines (verified)
- [ ] `theme.css` contains all required design tokens
- [ ] `transitions.ts` exports `pageEnter`, `fadeUp`, `staggerChildren`, `useReducedMotion`

---

## IMPLEMENTATION SEQUENCE

### Step 1: Create `useDashboardData` Orchestration Hook

**File:** `frontend/src/hooks/data/useDashboardData.ts`  
**Purpose:** Single hook that combines all data sources needed by the dashboard into one clean interface.

```typescript
// frontend/src/hooks/data/useDashboardData.ts
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
```

### Step 2: Create `StatCard` Component

**File:** `frontend/src/app/components/dashboard/StatCard.tsx`  
**Purpose:** Compact metric card with icon, label, formatted amount, and optional trend indicator.

```typescript
// frontend/src/app/components/dashboard/StatCard.tsx
import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { PrivacyAmount } from '../PrivacyAmount';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  trend?: { direction: 'up' | 'down' | 'flat'; value: string };
  valueClassName?: string;
  variant?: 'default' | 'hero' | 'compact';
  usePrivacy?: boolean;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  valueClassName,
  variant = 'default',
  usePrivacy = true,
}: StatCardProps) {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-border-neutral)] bg-[var(--color-bg-card)] transition-shadow',
        'hover:shadow-[var(--shadow-card-hover)]',
        isHero ? 'p-5' : isCompact ? 'p-3' : 'p-4',
      )}
      role="group"
      aria-label={label}
    >
      {/* Icon + Label row */}
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('shrink-0', isHero ? 'text-lg' : 'text-sm')}>{icon}</span>
        <span className={cn(
          'font-medium truncate',
          isHero ? 'text-sm' : 'text-xs',
          textColorVar('content-secondary')
        )}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div className={cn(
        'font-mono font-bold',
        isHero ? 'text-2xl sm:text-3xl' : isCompact ? 'text-sm' : 'text-lg',
        valueClassName ?? textColorVar('content-primary'),
      )}>
        {usePrivacy ? <PrivacyAmount value={value} /> : value}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className={cn(
          'flex items-center gap-1 mt-1.5',
          trend.direction === 'up' && textColorVar('sentiment-positive'),
          trend.direction === 'down' && textColorVar('sentiment-negative'),
          trend.direction === 'flat' && textColorVar('content-tertiary'),
        )}>
          {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend.direction === 'flat' && <Minus className="w-3 h-3" />}
          <span className="text-[10px] font-medium">{trend.value}</span>
        </div>
      )}
    </div>
  );
}
```

### Step 3: Create `ChartCard` Wrapper Component

**File:** `frontend/src/app/components/dashboard/ChartCard.tsx`  
**Purpose:** Reusable wrapper for Recharts with consistent styling, legend, tooltip, and responsive container.

```typescript
// frontend/src/app/components/dashboard/ChartCard.tsx
import { useState, type ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ResponsiveContainer } from 'recharts';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;          // The Recharts chart component
  height?: number;              // Chart height in px (default: 220)
  collapsible?: boolean;        // Whether section can be collapsed
  defaultCollapsed?: boolean;   // Start collapsed
  emptyMessage?: string;        // Message when no data
  isEmpty?: boolean;
  headerAction?: ReactNode;     // Optional action button in header
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  height = 220,
  collapsible = false,
  defaultCollapsed = false,
  emptyMessage = 'Belum ada data',
  isEmpty = false,
  headerAction,
  className,
}: ChartCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const prefersReduced = useReducedMotion();

  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'), className)}>
      <CardHeader
        className={cn('pb-2', collapsible && 'cursor-pointer select-none')}
        onClick={collapsible ? () => setIsCollapsed((prev) => !prev) : undefined}
        role={collapsible ? 'button' : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={collapsible ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsCollapsed((prev) => !prev);
          }
        } : undefined}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn('text-sm font-semibold', textColorVar('content-primary'))}>
              {title}
            </h3>
            {subtitle && (
              <p className={cn('text-xs mt-0.5', textColorVar('content-tertiary'))}>{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            {collapsible && (
              <span className={textColorVar('content-tertiary')}>
                {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={prefersReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <CardContent>
              {isEmpty ? (
                <p className={cn('text-xs text-center py-8', textColorVar('content-tertiary'))}>
                  {emptyMessage}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={height}>
                  {children as any}
                </ResponsiveContainer>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
```

### Step 4: Create `InsightCard` Component

**File:** `frontend/src/app/components/dashboard/InsightCard.tsx`  
**Purpose:** Display AI-generated insights with severity indicator and formatted content.

```typescript
// frontend/src/app/components/dashboard/InsightCard.tsx
import { Sparkles, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { cn, textColorVar, bgColorVar } from '@/lib/utils';

interface InsightCardProps {
  severity?: 'info' | 'warning' | 'critical' | 'success';
  emoji?: string;
  title?: string;
  body: string;
  className?: string;
}

export function InsightCard({
  severity = 'info',
  emoji,
  title,
  body,
  className,
}: InsightCardProps) {
  const severityStyles = {
    info: {
      bg: 'bg-[var(--color-brand-primary-light)]',
      icon: <Sparkles className="w-4 h-4 text-[var(--color-brand-primary)]" />,
      border: 'border-l-[var(--color-brand-primary)]',
    },
    warning: {
      bg: 'bg-[var(--color-sentiment-warning-bg)]',
      icon: <AlertTriangle className="w-4 h-4 text-[var(--color-sentiment-warning)]" />,
      border: 'border-l-[var(--color-sentiment-warning)]',
    },
    critical: {
      bg: 'bg-[var(--color-sentiment-negative-bg)]',
      icon: <AlertTriangle className="w-4 h-4 text-[var(--color-sentiment-negative)]" />,
      border: 'border-l-[var(--color-sentiment-negative)]',
    },
    success: {
      bg: 'bg-[var(--color-sentiment-positive-bg)]',
      icon: <CheckCircle className="w-4 h-4 text-[var(--color-sentiment-positive)]" />,
      border: 'border-l-[var(--color-sentiment-positive)]',
    },
  };

  const style = severityStyles[severity];

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-[var(--radius-md)] border-l-3',
        style.bg,
        style.border,
        className,
      )}
      role="status"
      aria-label={title ?? 'Insight'}
    >
      <span className="shrink-0 mt-0.5">
        {emoji ? <span className="text-sm">{emoji}</span> : style.icon}
      </span>
      <div className="min-w-0">
        {title && (
          <p className={cn('text-xs font-semibold mb-0.5', textColorVar('content-primary'))}>
            {title}
          </p>
        )}
        <p className={cn('text-xs leading-relaxed', textColorVar('content-secondary'))}>
          {body}
        </p>
      </div>
    </div>
  );
}
```

### Step 5: Create `QuickActions` Component

**File:** `frontend/src/app/components/dashboard/QuickActions.tsx`  
**Purpose:** Horizontal row of shortcut buttons for primary actions.

```typescript
// frontend/src/app/components/dashboard/QuickActions.tsx
import { Plus, FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';

interface QuickActionsProps {
  onAddTransaction: () => void;
}

export function QuickActions({ onAddTransaction }: QuickActionsProps) {
  const actions = [
    {
      icon: <Plus className="w-4 h-4" />,
      label: 'Tambah',
      onClick: onAddTransaction,
      primary: true,
    },
    {
      icon: <FileText className="w-4 h-4" />,
      label: 'Laporan',
      to: '/analytics/laporan',
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      label: 'AI Chat',
      to: '/ai/chat',
    },
  ];

  return (
    <div className="flex gap-2" role="group" aria-label="Aksi cepat">
      {actions.map((action, i) => {
        const classes = cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-colors',
          'border',
          action.primary
            ? 'bg-[var(--color-brand-primary)] text-[var(--color-brand-primary-fg)] border-transparent'
            : 'bg-transparent text-[var(--color-content-secondary)] border-[var(--color-border-neutral)] hover:bg-[var(--color-bg-card-hover)]'
        );

        if (action.to) {
          return (
            <Link key={i} to={action.to} className={classes}>
              {action.icon}
              {action.label}
            </Link>
          );
        }
        return (
          <button key={i} onClick={action.onClick} className={classes}>
            {action.icon}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
```

### Step 6: Create Dashboard Skeleton Component

**File:** `frontend/src/app/components/dashboard/DashboardSkeleton.tsx`  
**Purpose:** Layout-preserving skeleton loader that matches exact dashboard section heights.

```typescript
// frontend/src/app/components/dashboard/DashboardSkeleton.tsx
import { cn, bgColorVar, borderColorVar } from '@/lib/utils';

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse" aria-busy="true" aria-label="Memuat dashboard...">
      {/* Hero card skeleton */}
      <div className={cn('h-28 rounded-[var(--radius-xl)]', bgColorVar('bg-card'), borderColorVar('border-neutral'), 'border')} />

      {/* Status row skeleton (3 cards) */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn('h-20 rounded-[var(--radius-lg)]', bgColorVar('bg-card'), borderColorVar('border-neutral'), 'border')} />
        ))}
      </div>

      {/* Insight skeleton */}
      <div className={cn('h-16 rounded-[var(--radius-md)]', 'bg-[var(--color-brand-primary-light)]')} />

      {/* Chart skeleton */}
      <div className={cn('h-64 rounded-[var(--radius-lg)]', bgColorVar('bg-card'), borderColorVar('border-neutral'), 'border')} />

      {/* Category cards skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn('h-16 rounded-[var(--radius-lg)]', bgColorVar('bg-card'), borderColorVar('border-neutral'), 'border')} />
        ))}
      </div>

      {/* Goals skeleton */}
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className={cn('h-14 rounded-[var(--radius-lg)]', bgColorVar('bg-card'), borderColorVar('border-neutral'), 'border')} />
        ))}
      </div>
    </div>
  );
}
```

### Step 7: Create `CollapsibleSection` Component

**File:** `frontend/src/app/components/dashboard/CollapsibleSection.tsx`  
**Purpose:** Generic collapsible section wrapper for progressive disclosure.

```typescript
// frontend/src/app/components/dashboard/CollapsibleSection.tsx
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, textColorVar } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  count?: number;          // e.g., "Goals (3)"
  children: ReactNode;
  className?: string;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  count,
  children,
  className,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const prefersReduced = useReducedMotion();

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 w-full text-left py-2 group"
        aria-expanded={isOpen}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span className={cn('text-sm font-semibold flex-1', textColorVar('content-primary'))}>
          {title}
          {count !== undefined && (
            <span className={cn('ml-1 text-xs font-normal', textColorVar('content-tertiary'))}>
              ({count})
            </span>
          )}
        </span>
        <span className={cn(textColorVar('content-tertiary'), 'group-hover:text-[var(--color-content-secondary)] transition-colors')}>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={prefersReduced ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={prefersReduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Step 8: Create Dashboard Component Barrel Export

**File:** `frontend/src/app/components/dashboard/index.ts`  
**Purpose:** Clean barrel export for all dashboard components.

```typescript
export { StatCard } from './StatCard';
export { ChartCard } from './ChartCard';
export { InsightCard } from './InsightCard';
export { QuickActions } from './QuickActions';
export { DashboardSkeleton } from './DashboardSkeleton';
export { CollapsibleSection } from './CollapsibleSection';
```

### Step 9: Rewrite `Overview.tsx`

**File:** `frontend/src/app/pages/Overview.tsx` (COMPLETE REWRITE)  
**Purpose:** New dashboard following the storytelling hierarchy:

1. **Greeting + Quick Actions**
2. **Hero Metric:** Balance card (monospace DM Mono, oversized)
3. **Status Row:** Income / Spent / Available (3 compact cards)
4. **Quick Insight:** AI-generated summary
5. **Spending Breakdown:** Collapsible bar chart
6. **Top Categories:** 3 category cards
7. **Goals Progress:** Mini progress cards (collapsible)
8. **Upcoming Bills:** Recurring due this month (collapsible)

**Key implementation details:**

```typescript
// frontend/src/app/pages/Overview.tsx — new structure
import { useState } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Wallet2, TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { useDashboardData } from '@/hooks/data/useDashboardData';
import {
  StatCard, ChartCard, InsightCard, QuickActions,
  DashboardSkeleton, CollapsibleSection
} from '../components/dashboard';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { UpcomingBillsWidget } from '../components/UpcomingBillsWidget';
import { WalletChips } from '../components/WalletChips';
import { ErrorState, EmptyState } from '../components/ScreenStates';
import { formatRupiah, cn, textColorVar, bgColorVar, borderColorVar } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useWalletFilter } from '@/hooks/useWalletFilter';

// ... Implementation follows storytelling hierarchy
```

**Mobile layout:** All sections stack vertically  
**Desktop layout:** Status row 3-column grid, chart + bills 2-column (2:1 ratio)  
**Collapsible sections:** Spending Breakdown, Goals, Upcoming Bills default-open on desktop, default-closed on mobile  

**Hero Metric Card (balance):**
- Background: subtle gradient with `--color-brand-primary-light`
- Balance number: `text-3xl sm:text-4xl font-mono font-bold`
- Uses DM Mono for all financial numbers
- Shows "Sisa Budget: X%" badge inline

**Available to Spend calculation:**
```typescript
const availableToSpend = Math.max(0, totalBudget - displayExpenses);
// Displayed as: "Rp 2.8M tersisa dari anggaran"
```

### Step 10: Verify & Polish

1. Run `npm run build` — zero TypeScript errors
2. Test all screen states: loading → empty → data → error
3. Test dark mode (if tokens support it)
4. Test responsive breakpoints (375px, 390px, 768px, 1024px, 1440px)
5. Verify all data hooks return expected data
6. Verify chart interactions (tooltips, hover states)
7. Verify collapsible sections animate smoothly
8. Verify keyboard navigation through all interactive elements
9. Verify screen reader announces section titles and values correctly

---

## FILE TOUCH LIST

### Created (New Files)
| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `frontend/src/hooks/data/useDashboardData.ts` | Dashboard data orchestration hook |
| 2 | `frontend/src/app/components/dashboard/StatCard.tsx` | Metric display card |
| 3 | `frontend/src/app/components/dashboard/ChartCard.tsx` | Chart wrapper with collapse |
| 4 | `frontend/src/app/components/dashboard/InsightCard.tsx` | AI insight display |
| 5 | `frontend/src/app/components/dashboard/QuickActions.tsx` | Action shortcut buttons |
| 6 | `frontend/src/app/components/dashboard/DashboardSkeleton.tsx` | Loading skeleton |
| 7 | `frontend/src/app/components/dashboard/CollapsibleSection.tsx` | Collapsible wrapper |
| 8 | `frontend/src/app/components/dashboard/index.ts` | Barrel export |

### Modified (Existing Files)
| # | File Path | Changes |
|---|-----------|---------|
| 9 | `frontend/src/app/pages/Overview.tsx` | Complete rewrite (~400 lines → ~500 lines) |

### Unchanged (Referenced but Not Modified)
| # | File Path | Status |
|---|-----------|--------|
| 10 | `frontend/src/app/components/UpcomingBillsWidget.tsx` | Used as-is |
| 11 | `frontend/src/app/components/WalletChips.tsx` | Used as-is |
| 12 | `frontend/src/app/components/PrivacyAmount.tsx` | Used as-is |
| 13 | `frontend/src/app/components/ScreenStates.tsx` | Used as-is |
| 14 | `frontend/src/app/components/AIInsightCard.tsx` | Referenced but new InsightCard replaces usage |

---

## EXPECTED OUTPUTS

When Phase 04 is complete, the following must be true:

- [ ] **Dashboard renders at `/home/overview`** with new storytelling hierarchy
- [ ] **Hero Metric card** shows balance in oversized DM Mono font (≥ 2rem)
- [ ] **Status Row** shows 3 cards: Income (green), Spent (red), Available (neutral)
- [ ] **"Available to Spend"** calculated correctly as `totalBudget - displayExpenses`
- [ ] **Quick Insight card** shows AI-generated summary from `useAIInsights`
- [ ] **Spending Breakdown** chart is collapsible (click header to toggle)
- [ ] **Top 3 Categories** displayed with emoji, amount, percentage
- [ ] **Goals Progress** shows mini progress bars for active goals
- [ ] **Upcoming Bills** shows recurring bills due this month
- [ ] **Loading state** uses `DashboardSkeleton` preserving exact layout heights
- [ ] **Empty state** shows contextual CTA ("Tambah transaksi pertama")
- [ ] **Error state** shows retry button
- [ ] **`useDashboardData` hook** orchestrates all data sources cleanly
- [ ] **ChartCard** wrapper provides consistent chart styling
- [ ] **StatCard** component used for all metric displays
- [ ] **Mobile (375px):** Sections stack vertically, charts full-width
- [ ] **Desktop (1024px+):** Status row 3-col, chart + bills 2-col grid
- [ ] **`npm run build`** passes with zero TypeScript errors
- [ ] **Keyboard navigation** works through all interactive elements
- [ ] **Screen reader** announces section titles, values, and chart data

---

## VALIDATION STEPS

### Build Validation
```bash
cd frontend
npm run build    # Must pass with zero errors
npm run dev      # Must start without crashes
```

### Visual Testing (Manual)
1. Navigate to `/home/overview` — dashboard renders with all sections
2. Verify Hero Metric shows balance in large monospace font
3. Verify Status Row shows 3 cards with correct colors (green income, red expense)
4. Verify "Available to Spend" equals `totalBudget - expenses`
5. Verify AI Insight card shows content (or loading animation if fetching)
6. Click "Spending Breakdown" header → collapses/expands chart
7. Verify Top Categories shows top 3 with correct emojis and percentages
8. Verify Goals section shows active goals with progress bars
9. Verify Upcoming Bills shows due items

### Responsive Testing
1. **375px:** All sections stack vertically, no horizontal overflow
2. **768px:** Status row stays 3-column, chart adjusts width
3. **1024px+:** Status row 3-column, chart + bills side-by-side
4. **1440px:** Content constrained to max-width 1200px

### Screen State Testing
1. Clear all transactions → Empty state shows with CTA button
2. Disconnect network → Error state shows with retry button
3. Refresh with data → Loading skeleton appears, then content

### Accessibility Testing
1. Tab through all interactive elements — focus ring visible
2. Screen reader: Hero card announces "Saldo: Rp 3.200.000"
3. Screen reader: Collapsible sections announce expanded/collapsed state
4. Chart: tooltip data accessible via keyboard (tab to chart, arrow keys)
5. Color contrast: all text meets WCAG AA minimum (4.5:1)

### Data Accuracy Testing
1. Add a transaction via FAB → dashboard updates (after refresh)
2. Change month filter → all sections update
3. Change wallet filter → filtered data reflects in all cards
4. Verify balance = income - expenses (exact match)
5. Verify Available = totalBudget - expenses (never negative)

---

## GIT COMMIT CHECKPOINTS

| Checkpoint | Files | Commit Message |
|-----------|-------|----------------|
| CP-04.1 | `useDashboardData.ts` | `feat(dashboard): add useDashboardData orchestration hook` |
| CP-04.2 | `StatCard.tsx`, `ChartCard.tsx` | `feat(dashboard): add StatCard and ChartCard components` |
| CP-04.3 | `InsightCard.tsx`, `QuickActions.tsx` | `feat(dashboard): add InsightCard and QuickActions components` |
| CP-04.4 | `DashboardSkeleton.tsx`, `CollapsibleSection.tsx`, `index.ts` | `feat(dashboard): add skeleton, collapsible, and barrel export` |
| CP-04.5 | `Overview.tsx` | `refactor(dashboard): complete Overview.tsx rewrite with storytelling hierarchy` |
| CP-04.6 | — | `chore(dashboard): verify build, cleanup, final polish` |

---

## ROLLBACK INSTRUCTIONS

### Full Phase Rollback
```bash
git stash          # Save any work in progress
git checkout main  # Return to pre-phase-04 state
git branch -D phase-04/dashboard-modernization  # Delete phase branch
```

### Partial Rollback (Keep Components, Revert Overview)
```bash
git checkout HEAD~2 -- frontend/src/app/pages/Overview.tsx
# Keep: all dashboard/* components, useDashboardData hook
```

### Emergency Rollback (Overview Only)
The old Overview.tsx is preserved in git history. To restore:
```bash
git log --oneline -- frontend/src/app/pages/Overview.tsx  # Find pre-phase commit
git checkout <commit-hash> -- frontend/src/app/pages/Overview.tsx
```

---

## SESSION RECAP TEMPLATE

```markdown
## Phase 04 Session Recap — [DATE]

### Session Number: [X/3]
### Duration: ~[X] minutes
### Context Used: ~[X]% estimated

### Completed:
- [ ] Step 1: useDashboardData hook
- [ ] Step 2: StatCard component
- [ ] Step 3: ChartCard wrapper
- [ ] Step 4: InsightCard component
- [ ] Step 5: QuickActions component
- [ ] Step 6: DashboardSkeleton
- [ ] Step 7: CollapsibleSection
- [ ] Step 8: Barrel export
- [ ] Step 9: Overview.tsx rewrite
- [ ] Step 10: Verify & Polish

### Files Created:
- [list]

### Files Modified:
- [list]

### Issues Encountered:
- [any TypeScript errors, rendering issues]

### Deferred to Next Session:
- [anything not completed]

### Build Status:
- `npm run build`: [PASS/FAIL]
- `npm run dev`: [PASS/FAIL]

### Git Commits Made:
- [list commit hashes and messages]
```

---

## ARCHITECTURE NOTES

### Decision: Orchestration Hook Pattern
**Choice:** `useDashboardData` as a single orchestration hook instead of calling 10+ hooks directly in Overview.tsx  
**Rationale:** The current Overview.tsx calls 12 different hooks (useAuth, useTransactions, useBudgets, useGoals, useWallets, useRecurringBills, useInsights, useFinancialHealth, useFinancialHealthScore, useBudgetRecommendations, useAIInsights, useMonthFilter). This creates a massive component header and makes the component hard to test. An orchestration hook consolidates all data into a single interface, reducing the Overview component to pure rendering logic.  
**Tradeoff:** The orchestration hook has many dependencies and may trigger unnecessary re-renders. Mitigated by memoizing derived values with `useMemo`.

### Decision: Storytelling Hierarchy
**Choice:** Hero → Status → Insight → Chart → Categories → Goals → Bills  
**Rationale:** Based on the Data Visualization UI Kit pattern and QPay design: the most important information (balance) should be visually dominant. AI insights are placed high (position 4) because they're the app's differentiator. Charts are collapsible because most users check numbers, not charts, on daily visits.  
**Tradeoff:** Moving recent transactions off the dashboard reduces feature density. Acceptable because Riwayat (transaction history) is accessible via nav.

### Decision: Progressive Disclosure via Collapsible Sections
**Choice:** Spending Breakdown, Goals, and Upcoming Bills are collapsible  
**Rationale:** The current dashboard has 6+ sections requiring heavy scrolling on mobile (audit finding: "Information Overload"). Collapsible sections let users see section titles and expand only what they need. Default state: open on desktop (screen real estate), closed on mobile for charts (less scrolling).  
**Tradeoff:** Users must interact to see content. Mitigated by showing section header with summary data (e.g., "Goals (3)" shows count even when collapsed).

### Decision: Available to Spend vs. Balance
**Choice:** Show both "Balance" (income - expenses) and "Available to Spend" (budget - expenses)  
**Rationale:** Balance shows net financial position. Available to Spend shows how much budget remains. Users need both: Balance for reality, Available for planning. QPay and YNAB both show these as separate metrics.  
**Tradeoff:** Two similar-looking numbers could confuse users. Mitigated by clear labeling and different visual treatment (Balance = hero, Available = status row).

### Decision: Separate Dashboard Components Directory
**Choice:** `frontend/src/app/components/dashboard/` subfolder  
**Rationale:** Dashboard-specific components (StatCard, ChartCard, InsightCard) are only used by Overview.tsx and potentially Insights page. Keeping them in a subfolder prevents polluting the global components directory. Barrel export (`index.ts`) provides clean imports.  
**Tradeoff:** One more directory level. Acceptable for organizational clarity.

---

## UI CONSISTENCY CHECKS

- [ ] Hero card uses `font-mono` (DM Mono) for balance amount
- [ ] All financial numbers in status row use `font-mono`
- [ ] Status card income uses `--color-sentiment-positive` (green)
- [ ] Status card expense uses `--color-sentiment-negative` (red)
- [ ] Status card available uses `--color-content-primary` (neutral)
- [ ] Chart colors: income = `--color-sentiment-positive`, expense = `--color-sentiment-negative`
- [ ] Category cards use category-specific colors from `--color-cat-*` tokens
- [ ] Progress bars use `--color-brand-primary` for fill
- [ ] All card borders use `--color-border-neutral`
- [ ] All card backgrounds use `--color-bg-card`
- [ ] Hover states use `--shadow-card-hover`
- [ ] Section headers use `text-sm font-semibold` consistently
- [ ] Body text uses `text-xs` consistently
- [ ] Spacing between sections: `space-y-5` (20px)

---

## MOBILE RESPONSIVENESS CHECKS

- [ ] **375px (iPhone SE):** Hero card full-width, status row 3-column (compact), charts scroll horizontally if needed
- [ ] **390px (iPhone 14):** Same layout, numbers don't wrap
- [ ] **768px (iPad):** Status row 3-column with more padding, chart + bills side by side
- [ ] **1024px (Desktop):** Full 2-column layout for chart area, max-width 1200px
- [ ] Hero card number: `text-2xl` on mobile, `text-3xl` on `sm:`, `text-4xl` on `lg:`
- [ ] Chart height: 180px on mobile, 220px on desktop
- [ ] Collapsible sections: default open on `lg:`, may be default closed on mobile
- [ ] Quick Actions: horizontal scroll on very narrow screens
- [ ] All touch targets ≥ 44px height on mobile
- [ ] Main content padding: `px-3 py-3` mobile, `px-4 py-4` tablet, `p-6` desktop

---

## ACCESSIBILITY CHECKS

- [ ] Dashboard sections use semantic HTML: `<section>` with `aria-labelledby`
- [ ] Hero card: `role="group"`, `aria-label="Saldo bulan ini"`
- [ ] Status cards: `role="group"`, each with `aria-label`
- [ ] Insight card: `role="status"`, content announced by screen readers
- [ ] Collapsible sections: `aria-expanded` attribute on toggle buttons
- [ ] Collapsible sections: `Enter` and `Space` keys toggle state
- [ ] Charts: `aria-label` on chart container describing data
- [ ] Progress bars: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- [ ] Loading state: `aria-busy="true"`, `aria-label="Memuat dashboard..."`
- [ ] Empty state: CTA button is focusable with visible focus ring
- [ ] Error state: retry button announced as "Coba lagi"
- [ ] Color contrast: all text meets WCAG AA (4.5:1 for normal, 3:1 for large)
- [ ] Trend indicators: icon + text (never color-only)
- [ ] Financial amounts: screen reader reads full number ("Rp 3.200.000" not "Rp 3.2jt")

---

## TECHNICAL DEBT PREVENTION CHECKS

- [ ] No hardcoded colors — all via CSS variables
- [ ] No hardcoded strings — all Indonesian labels centralized
- [ ] No `any` types — strict TypeScript throughout
- [ ] No inline `supabase.from()` calls — all data via hooks
- [ ] No duplicate calculations — `useDashboardData` is single source
- [ ] All memoized values use proper dependency arrays
- [ ] No magic numbers — chart heights, spacing as named constants or tokens
- [ ] Components accept `className` prop for extension
- [ ] ChartCard works with any Recharts chart type (not locked to AreaChart)
- [ ] StatCard works with any content (not locked to financial data)
- [ ] Old Overview.tsx backup accessible via git history
- [ ] No circular imports between dashboard components

---

## CLAUDE CODE SESSION BATCHES

### Session 1: Data Hook + Base Components (Steps 1–5)
**Estimated context:** ~40%  
**Duration:** ~45 minutes  

**Tasks:**
1. Create `useDashboardData.ts` (Step 1)
2. Create `StatCard.tsx` (Step 2)
3. Create `ChartCard.tsx` (Step 3)
4. Create `InsightCard.tsx` (Step 4)
5. Create `QuickActions.tsx` (Step 5)
6. Commit CP-04.1, CP-04.2, CP-04.3

**Session start prompt:**
```
Read phase-04-dashboard.md. Execute Steps 1-5 only.
Create useDashboardData.ts, StatCard.tsx, ChartCard.tsx, InsightCard.tsx, QuickActions.tsx.
Do NOT modify Overview.tsx yet.
All components go in frontend/src/app/components/dashboard/ directory.
Commit after each group is verified.
```

### Session 2: Support Components + Barrel (Steps 6–8)
**Estimated context:** ~30%  
**Duration:** ~30 minutes  

**Tasks:**
1. Create `DashboardSkeleton.tsx` (Step 6)
2. Create `CollapsibleSection.tsx` (Step 7)
3. Create `index.ts` barrel export (Step 8)
4. Commit CP-04.4

**Session start prompt:**
```
Read phase-04-dashboard.md. Execute Steps 6-8 only.
Files already created: useDashboardData.ts, StatCard.tsx, ChartCard.tsx, InsightCard.tsx, QuickActions.tsx.
Create DashboardSkeleton.tsx, CollapsibleSection.tsx, and index.ts barrel export.
All in frontend/src/app/components/dashboard/ directory.
```

### Session 3: Overview Rewrite + Polish (Steps 9–10)
**Estimated context:** ~55%  
**Duration:** ~60 minutes  

**Tasks:**
1. Complete rewrite of `Overview.tsx` (Step 9)
2. Import and compose all dashboard components
3. Implement storytelling hierarchy layout
4. Implement responsive grid (mobile stack, desktop 2-col)
5. Implement collapsible sections with correct default states
6. Run `npm run build` to verify
7. Test all screen states (loading, empty, data, error)
8. Commit CP-04.5, CP-04.6

**Session start prompt:**
```
Read phase-04-dashboard.md. Execute Steps 9-10 only.
All dashboard components are created in frontend/src/app/components/dashboard/.
The useDashboardData hook is at frontend/src/hooks/data/useDashboardData.ts.
Now rewrite frontend/src/app/pages/Overview.tsx completely.
Follow the storytelling hierarchy:
1. Greeting + QuickActions
2. Hero Balance Card (oversized monospace)
3. Status Row (3 cards: Income, Spent, Available)
4. AI Quick Insight
5. Spending Breakdown (collapsible chart)
6. Top 3 Categories
7. Goals Progress (collapsible)
8. Upcoming Bills (collapsible)

Use useDashboardData() as the single data source.
Run npm run build to verify zero errors.
```

---

## FIGMA REFERENCE LINKS

| Reference | Usage in Phase 04 |
|-----------|-------------------|
| **QPay Digital Wallet UI Kit** | Hero metric card styling (oversized balance, subtle gradient bg, monospace font), status row card layout, card spacing |
| **Data Visualization UI Kit** | Chart hierarchy pattern (hero → primary comparison → category breakdown → trend), chart legend placement, tooltip styling |
| **Wise Design System** | Card interaction patterns (hover shadow, focus ring), progress bar styling, status badge design (icon + color + text), collapsible section chevron |

**Specific design elements to extract:**
- Hero card: 24px top/bottom padding, balance font size 2.5rem, gradient from `--color-brand-primary-light` to transparent
- Status row cards: 16px padding, 12px label font, 20px value font mono
- Insight card: 3px left border, 12px padding, icon + text layout
- Chart card: 16px header padding, 220px chart height, collapsible with 200ms animation
- Category cards: 48px height, emoji 20px, amount right-aligned mono
- Progress bars: 4px height, `--color-brand-primary` fill, rounded-full
- Collapsible chevron: 16px icon, transitions 150ms

---

## DEPENDENCY OUTPUTS

Phase 04 produces the following for subsequent phases:

| Output | Consumed By |
|--------|------------|
| `useDashboardData` hook | Phase 10 (if dashboard widgets are reused elsewhere) |
| `StatCard` component | Phase 05 (spending page stats), Phase 06 (budget stats), Phase 07 (goals stats) |
| `ChartCard` component | Phase 05 (spending charts), Phase 08 (analytics charts), Phase 09 (forecasting charts) |
| `InsightCard` component | Phase 08 (analytics insights), Phase 10 (AI assistant proactive insights) |
| `QuickActions` component | Phase 05 (spending quick actions), Phase 06 (budget quick actions) |
| `CollapsibleSection` component | Phase 05+ (used in any page with progressive disclosure) |
| `DashboardSkeleton` pattern | Phase 05+ (skeleton pattern replicated per page) |
| Dashboard storytelling hierarchy | Phase 08 (Laporan uses similar hierarchy), Phase 09 (Tren uses chart patterns) |

> [!NOTE]
> Phase 05 (Spending & Transaction Redesign) will consume `StatCard`, `ChartCard`, `InsightCard`, and `CollapsibleSection` from this phase. The component API is designed to be generic enough for reuse across all analytical pages.

> [!TIP]
> The `useDashboardData` hook pattern (orchestration hook that composes multiple data hooks) should be replicated for other complex pages: `useSpendPageData`, `useAnalyticsData`, etc. This keeps page components as pure rendering functions.
