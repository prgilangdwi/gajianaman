# Gajian Aman — Frontend Implementation Specifications

**Version:** 1.0  
**Date:** 2026-05-20  
**Status:** Ready for Development Phase

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [TypeScript Type Definitions](#typescript-type-definitions)
3. [Design Tokens to Tailwind Mapping](#design-tokens-to-tailwind-mapping)
4. [Component API Specifications](#component-api-specifications)
5. [State Management Architecture](#state-management-architecture)
6. [Data-Binding Patterns](#data-binding-patterns)
7. [Navigation & Routing Structure](#navigation--routing-structure)
8. [Screen Implementation Specifications](#screen-implementation-specifications)
9. [Form & Input Validation Patterns](#form--input-validation-patterns)
10. [Animation & Motion Implementation](#animation--motion-implementation)
11. [Mobile Layout & Responsive Design](#mobile-layout--responsive-design)
12. [File Structure & Development Conventions](#file-structure--development-conventions)

---

## Overview & Architecture

### Project Scope
Gajian Aman is a personal finance tracker for Indonesian salaried workers. The React frontend provides a dashboard with transaction logging, budget tracking, savings goals, and financial analytics.

### Key Characteristics
- **Mobile-First:** Baseline 375px (iPhone SE), responsive to tablet (768px+)
- **Tab-Based Navigation:** 5 main sections with bottom navigation
- **Real-time Data:** Supabase client with React hooks for live sync
- **Dual Auth:** Telegram ID login or Google OAuth
- **AI-Powered:** Claude Haiku for transaction parsing and categorization
- **Internationalization:** Indonesian UI labels, IDR currency formatting

### Tech Stack Breakdown

| Concern | Technology | Version | Notes |
|---------|-----------|---------|-------|
| Framework | React | 18.x | JSX, hooks, functional components |
| Language | TypeScript | 5.x | Strict mode enabled |
| Build Tool | Vite | 6.x | Lightning-fast HMR, optimized builds |
| Styling | Tailwind CSS | 4.x | Via `@tailwindcss/vite` plugin |
| Components | shadcn/ui | Latest | Radix UI + Tailwind, composable |
| Routing | react-router | 7.x | Data loaders, nested routes, protected layouts |
| Forms | react-hook-form | 7.x | Minimal re-renders, validation integration |
| Data Fetching | @supabase/supabase-js | 2.x | Real-time subscriptions, auth helpers |
| Charts | recharts | 2.x | Responsive, composable charts |
| Animations | motion | Latest | Framer Motion successor |
| Notifications | sonner | Latest | Toast notifications |
| UI Utilities | class-variance-authority | Latest | Variant composition for components |

### Directory Structure
```
frontend/src/
├── app/
│   ├── App.tsx                    # Root router setup
│   ├── components/
│   │   ├── Layout.tsx             # Sidebar/bottom nav wrapper
│   │   ├── TransactionModal.tsx   # Reusable modal for adding transactions
│   │   ├── ProtectedRoute.tsx     # Auth guard wrapper
│   │   ├── LoadingSpinner.tsx     # Global loading state
│   │   ├── CompoundComponents.tsx # Custom compound components (TransactionRow, BudgetCard, etc.)
│   │   └── ui/                    # shadcn/ui library (do not edit)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       ├── tabs.tsx
│   │       ├── badge.tsx
│   │       ├── popover.tsx
│   │       ├── progress.tsx
│   │       └── ... (other shadcn/ui components)
│   └── pages/
│       ├── Home.tsx               # Dashboard overview
│       ├── Pengeluaran.tsx        # Spending by category
│       ├── Tren.tsx               # 3-month trend analysis
│       ├── Budget.tsx             # Budget management
│       ├── Goals.tsx              # Savings goals
│       ├── Settings.tsx           # User preferences
│       ├── Login.tsx              # Auth entry
│       ├── AuthCallback.tsx       # OAuth redirect
│       ├── LinkTelegram.tsx       # Account linking
│       └── AiChat.tsx             # AI transaction assistant
├── hooks/
│   ├── useAuth.tsx                # Auth state & methods
│   ├── useTransactions.ts         # Transaction CRUD & caching
│   ├── useBudgets.ts              # Budget management
│   ├── useGoals.ts                # Goals management
│   ├── useMonthFilter.tsx         # Global month/year context
│   └── useImageParser.ts          # Claude image parsing hook
├── lib/
│   ├── supabase.ts                # Supabase client + types
│   ├── utils.ts                   # cn(), formatters, helpers
│   └── constants.ts               # Enum-like constants (categories, currencies)
├── styles/
│   ├── globals.css                # Base reset + utilities
│   ├── theme.css                  # Design token CSS variables
│   ├── fonts.css                  # Font imports (@font-face)
│   └── animations.css             # Reusable animation classes
└── main.tsx                        # Vite entry point
```

---

## TypeScript Type Definitions

All types live in `lib/supabase.ts` as the single source of truth.

### Core Domain Types

```typescript
// lib/supabase.ts

// ===== User & Auth =====
export type User = {
  user_id: number;           // Telegram ID or UUID
  name: string;
  username?: string;         // Telegram username
  email?: string;            // From Google OAuth
  avatar_url?: string;
  currency: 'IDR' | 'USD';
  timezone: string;          // e.g., 'Asia/Jakarta'
  tier: 'free' | 'pro' | 'premium';
  created_at: string;        // ISO 8601
  updated_at: string;
};

export type AuthSession = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginMethod?: 'telegram' | 'google';
};

// ===== Transactions =====
export type Transaction = {
  id: string;                // UUID
  user_id: number;
  amount: number;            // Always positive; type determines direction
  type: 'expense' | 'income' | 'saving';
  category: string;          // Exact match from categories table
  subcategory?: string;
  note: string;
  ai_confidence?: number;    // 0–1, from Claude categorization
  date: string;              // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  image_url?: string;        // If from receipt/screenshot
};

export type TransactionInput = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

export type TransactionFilter = {
  month: number;
  year: number;
  category?: string;
  type?: Transaction['type'];
  startDate?: string;
  endDate?: string;
};

// ===== Budgets =====
export type Budget = {
  id: string;
  user_id: number;
  category: string;
  amount: number;            // IDR
  period: 'monthly';
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
};

export type BudgetWithProgress = Budget & {
  spent: number;
  remaining: number;
  percentUsed: number;
};

// ===== Goals =====
export type Goal = {
  id: string;
  user_id: number;
  name: string;
  description?: string;
  target_amount: number;
  saved_amount: number;
  deadline: string;          // YYYY-MM-DD
  category?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
};

export type GoalWithProgress = Goal & {
  progressPercent: number;
  daysRemaining: number;
};

// ===== Categories =====
export type Category = {
  id: string;
  user_id: number;
  name: string;
  icon: string;              // Emoji or icon code
  type: 'expense' | 'income' | 'saving';
  is_default: boolean;
  color?: string;            // Hex or Tailwind class name
};

// ===== Analytics =====
export type DailyAggregate = {
  date: string;              // YYYY-MM-DD
  totalExpense: number;
  totalIncome: number;
  netFlow: number;
};

export type CategoryAggregate = {
  category: string;
  total: number;
  percentage: number;
  transactionCount: number;
};

export type TrendData = {
  month: string;             // YYYY-MM or "May 2026"
  income: number;
  expense: number;
  savings: number;
  netFlow: number;
};

// ===== API Response Types =====
export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  success: boolean;
};

export type ImageParseResponse = {
  success: boolean;
  amount?: number;
  type?: 'expense' | 'income';
  category?: string;
  subcategory?: string;
  note?: string;
  confidence?: number;
  error?: string;
  raw_text?: string;
};

// ===== UI State Types =====
export type ModalState = {
  isOpen: boolean;
  mode: 'add' | 'edit' | 'confirm';
  transaction?: Transaction;
};

export type NotificationState = {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
};
```

---

## Design Tokens to Tailwind Mapping

### Theme Configuration (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',   // Main primary (emerald)
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
        // Secondary (Accent)
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f8b4e6',
          400: '#f472b6',
          500: '#ec4899',   // Pink accent
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // Neutrals
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        // Semantic
        success: '#10b981',   // Emerald
        warning: '#f59e0b',   // Amber
        error: '#ef4444',     // Red
        info: '#3b82f6',      // Blue
        // Type-specific colors
        expense: '#ef4444',   // Red
        income: '#10b981',    // Emerald
        saving: '#8b5cf6',    // Violet
      },
      typography: {
        // Font stacks
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      fontSize: {
        // Mobile-first baseline: 375px
        // Heading scale
        'heading-xl': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'heading-lg': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'heading-md': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'heading-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'heading-xs': ['18px', { lineHeight: '26px', fontWeight: '600' }],
        // Body text
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['12px', { lineHeight: '18px', fontWeight: '400' }],
        // Label
        'label-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-sm': ['12px', { lineHeight: '18px', fontWeight: '500' }],
        // Amount display (mono)
        'amount-lg': ['24px', { lineHeight: '32px', fontWeight: '700', fontFamily: 'DM Mono' }],
        'amount-md': ['18px', { lineHeight: '26px', fontWeight: '700', fontFamily: 'DM Mono' }],
      },
      spacing: {
        // Grid: 4px base unit
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
      },
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
        md: '0 4px 6px rgba(0, 0, 0, 0.10)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.12)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
        elevation: '0 8px 12px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-light': 'bounceLight 0.6s ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      height: {
        safe: 'calc(100vh - env(safe-area-inset-bottom))',
      },
    },
  },
  plugins: [],
};

export default config;
```

### CSS Variables in `styles/theme.css`

```css
:root {
  /* Colors */
  --color-primary: #22c55e;
  --color-primary-dark: #16a34a;
  --color-secondary: #ec4899;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  --color-expense: #ef4444;
  --color-income: #10b981;
  --color-saving: #8b5cf6;
  
  /* Neutrals */
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-text-primary: #171717;
  --color-text-secondary: #525252;
  --color-text-muted: #a3a3a3;
  --color-border: #e5e5e5;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'DM Mono', monospace;
  
  /* Border Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.10);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.12);
  
  /* Safe Area (iOS notch/Dynamic Island) */
  --safe-area-inset-top: env(safe-area-inset-top, 0);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0);
  --safe-area-inset-left: env(safe-area-inset-left, 0);
  --safe-area-inset-right: env(safe-area-inset-right, 0);
}

/* Dark mode (if implemented) */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0f172a;
    --color-bg-secondary: #1e293b;
    --color-text-primary: #f1f5f9;
    --color-text-secondary: #cbd5e1;
    --color-text-muted: #64748b;
    --color-border: #334155;
  }
}
```

---

## Component API Specifications

### 1. Compound Components

#### `<TransactionRow>`
Displays a single transaction in lists (History, Dashboard feed).

```typescript
// components/CompoundComponents.tsx
interface TransactionRowProps {
  transaction: Transaction;
  showDate?: boolean;
  showAmount?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'expanded';
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  showDate = true,
  showAmount = true,
  onClick,
  variant = 'default',
  isSelectable = false,
  isSelected = false,
  onSelect,
}) => {
  const amountColor = transaction.type === 'expense' ? 'text-expense' : 'text-income';
  const amountSign = transaction.type === 'expense' ? '−' : '+';

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between px-lg py-md border-b border-border',
        isSelectable && 'cursor-pointer hover:bg-neutral-100',
        variant === 'compact' && 'py-sm px-md',
        variant === 'expanded' && 'py-lg px-xl'
      )}
    >
      {isSelectable && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect?.(transaction.id, e.target.checked)}
          className="mr-md"
        />
      )}
      
      <div className="flex-1">
        <p className="font-label-md text-text-primary">{transaction.category}</p>
        {transaction.note && (
          <p className="text-body-sm text-text-secondary truncate">{transaction.note}</p>
        )}
      </div>

      <div className="text-right">
        {showAmount && (
          <p className={cn('font-amount-md', amountColor)}>
            {amountSign} Rp {transaction.amount.toLocaleString('id-ID')}
          </p>
        )}
        {showDate && (
          <p className="text-body-sm text-text-muted">{formatDate(transaction.date)}</p>
        )}
      </div>
    </div>
  );
};
```

#### `<BudgetCard>`
Budget progress display with spending visualization.

```typescript
interface BudgetCardProps {
  budget: BudgetWithProgress;
  onClick?: () => void;
  showWarning?: boolean;
  variant?: 'compact' | 'expanded';
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onClick,
  showWarning = true,
  variant = 'expanded',
}) => {
  const isOverBudget = budget.spent > budget.amount;
  const warningColor = isOverBudget ? 'text-error' : budget.percentUsed > 80 ? 'text-warning' : 'text-success';

  return (
    <Card className={cn('p-lg cursor-pointer hover:shadow-md transition-shadow', variant === 'compact' && 'p-md')} onClick={onClick}>
      <div className="flex justify-between items-start mb-md">
        <div>
          <h3 className="font-heading-sm text-text-primary">{budget.category}</h3>
          <p className={cn('text-body-sm', warningColor)}>
            Rp {budget.spent.toLocaleString('id-ID')} / Rp {budget.amount.toLocaleString('id-ID')}
          </p>
        </div>
        <Badge variant={isOverBudget ? 'destructive' : 'secondary'}>
          {budget.percentUsed.toFixed(0)}%
        </Badge>
      </div>

      <Progress value={Math.min(budget.percentUsed, 100)} className="h-2" />

      {isOverBudget && showWarning && (
        <p className="text-body-sm text-error mt-md">
          Rp {(budget.spent - budget.amount).toLocaleString('id-ID')} over budget
        </p>
      )}
    </Card>
  );
};
```

#### `<GoalCard>`
Savings goal progress with deadline and motivation.

```typescript
interface GoalCardProps {
  goal: GoalWithProgress;
  onClick?: () => void;
  showDeadline?: boolean;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  onClick,
  showDeadline = true,
}) => {
  const urgency = goal.daysRemaining < 30 ? 'urgent' : goal.daysRemaining < 90 ? 'soon' : 'relaxed';

  return (
    <Card className="p-lg cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <div className="flex justify-between items-start mb-md">
        <h3 className="font-heading-sm text-text-primary">{goal.name}</h3>
        <Badge variant={urgency === 'urgent' ? 'destructive' : 'secondary'}>
          {goal.progressPercent.toFixed(0)}%
        </Badge>
      </div>

      <Progress value={goal.progressPercent} className="h-2 mb-md" />

      <div className="grid grid-cols-2 gap-md text-body-sm">
        <div>
          <p className="text-text-secondary">Saved</p>
          <p className="font-amount-md text-text-primary">
            Rp {goal.saved_amount.toLocaleString('id-ID')}
          </p>
        </div>
        <div>
          <p className="text-text-secondary">Target</p>
          <p className="font-amount-md text-primary">
            Rp {goal.target_amount.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {showDeadline && (
        <p className="text-body-sm text-text-muted mt-md">
          {goal.daysRemaining} days remaining
        </p>
      )}
    </Card>
  );
};
```

#### `<CategoryPieChart>`
Transaction distribution by category (custom Recharts wrapper).

```typescript
interface CategoryPieChartProps {
  data: CategoryAggregate[];
  variant?: 'donut' | 'pie';
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  variant = 'donut',
  size = 'md',
}) => {
  const sizeMap = { sm: 150, md: 200, lg: 250 };
  const radius = sizeMap[size];

  return (
    <ResponsiveContainer width="100%" height={radius}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={variant === 'donut' ? radius * 0.6 : 0}
          outerRadius={radius}
          label={({ category, percentage }) => `${category} ${percentage}%`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
```

### 2. Form Components

#### `<AmountInput>`
Specialized input for IDR amounts with validation.

```typescript
interface AmountInputProps {
  value?: number;
  onChange?: (amount: number) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  max?: number;
  required?: boolean;
}

export const AmountInput: React.FC<AmountInputProps> = ({
  value,
  onChange,
  placeholder = 'Rp 0',
  error,
  disabled = false,
  max,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0;
    if (!max || numValue <= max) {
      onChange?.(numValue);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={value ? `Rp ${value.toLocaleString('id-ID')}` : ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'w-full px-lg py-md border border-border rounded-md font-amount-md',
          error && 'border-error'
        )}
        required={required}
      />
      {error && <p className="text-error text-body-sm mt-sm">{error}</p>}
    </div>
  );
};
```

#### `<CategorySelect>`
Dropdown with category icons and colors.

```typescript
interface CategorySelectProps {
  value?: string;
  onChange?: (category: string) => void;
  categories: Category[];
  type?: 'expense' | 'income' | 'saving';
  error?: string;
  required?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  value,
  onChange,
  categories,
  type,
  error,
  required = false,
}) => {
  const filtered = type ? categories.filter(c => c.type === type) : categories;

  return (
    <Select value={value} onValueChange={onChange} required={required}>
      <SelectTrigger className={error ? 'border-error' : ''}>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {filtered.map(cat => (
          <SelectItem key={cat.id} value={cat.name}>
            <span className="flex items-center gap-md">
              <span className="text-lg">{cat.icon}</span>
              {cat.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

#### `<DateRangePicker>`
Date input for filtering by range.

```typescript
interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  mode?: 'single' | 'range';
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  mode = 'range',
}) => {
  return (
    <div className="flex gap-md">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange?.(e.target.value)}
        className="flex-1 px-lg py-md border border-border rounded-md"
      />
      {mode === 'range' && (
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange?.(e.target.value)}
          className="flex-1 px-lg py-md border border-border rounded-md"
        />
      )}
    </div>
  );
};
```

### 3. Layout Components

#### `<BottomNav>`
Mobile-optimized tab navigation at screen bottom.

```typescript
interface BottomNavProps {
  activeTab: 'home' | 'pengeluaran' | 'tren' | 'budget' | 'ai';
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'pengeluaran', label: 'Pengeluaran', icon: '📊' },
    { id: 'tren', label: 'Tren', icon: '📈' },
    { id: 'budget', label: 'Anggaran', icon: '💰' },
    { id: 'ai', label: 'AI', icon: '🤖' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex justify-around pb-safe-area-inset-bottom">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 py-md flex flex-col items-center gap-xs text-body-sm transition-colors',
            activeTab === tab.id ? 'text-primary' : 'text-text-secondary'
          )}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="text-xs">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};
```

---

## State Management Architecture

### Authentication Hook (`hooks/useAuth.tsx`)

```typescript
interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithTelegram: (telegramId: number) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  linkTelegram: (telegramId: number) => Promise<void>;
  linkGoogle: () => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('gajian_aman_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const loginWithTelegram = async (telegramId: number) => {
    setIsLoading(true);
    try {
      // Query users table by telegram ID
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', telegramId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUser(data);
        localStorage.setItem('gajian_aman_user', JSON.stringify(data));
      } else {
        throw new Error('Telegram ID not found. Use /start in bot first.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gajian_aman_user');
  };

  // ... linkTelegram, linkGoogle methods
  
  return { user, isLoading, isAuthenticated: !!user, loginWithTelegram, loginWithGoogle, logout, ... };
};
```

### Transactions Hook (`hooks/useTransactions.ts`)

```typescript
interface UseTransactionsReturn {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: Partial<TransactionInput>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  fetchTransactions: (filter: TransactionFilter) => Promise<void>;
  dailyAggregates: DailyAggregate[];
  categoryAggregates: CategoryAggregate[];
}

export const useTransactions = (userId: number | null): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (filter: TransactionFilter) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', `${filter.year}-${String(filter.month).padStart(2, '0')}-01`);

      if (filter.category) query = query.eq('category', filter.category);
      if (filter.type) query = query.eq('type', filter.type);

      const { data, error: queryError } = await query.order('date', { ascending: false });

      if (queryError) throw queryError;
      setTransactions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const addTransaction = async (input: TransactionInput) => {
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase.from('transactions').insert([
      {
        ...input,
        user_id: userId,
        ai_confidence: input.ai_confidence || 0.85,
      },
    ]);

    if (error) throw error;
    await fetchTransactions({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  };

  // ... updateTransaction, deleteTransaction

  const dailyAggregates = useMemo(() => {
    const grouped = new Map<string, DailyAggregate>();
    
    transactions.forEach(t => {
      const existing = grouped.get(t.date) || {
        date: t.date,
        totalExpense: 0,
        totalIncome: 0,
        netFlow: 0,
      };

      if (t.type === 'expense') {
        existing.totalExpense += t.amount;
      } else if (t.type === 'income') {
        existing.totalIncome += t.amount;
      }
      existing.netFlow = existing.totalIncome - existing.totalExpense;
      
      grouped.set(t.date, existing);
    });

    return Array.from(grouped.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [transactions]);

  return {
    transactions,
    isLoading,
    error,
    addTransaction,
    updateTransaction: async () => {},
    deleteTransaction: async () => {},
    fetchTransactions,
    dailyAggregates,
    categoryAggregates: [], // Compute similarly
  };
};
```

### Month Filter Context (`hooks/useMonthFilter.tsx`)

```typescript
interface MonthFilterContextType {
  month: number;
  year: number;
  setMonth: (m: number) => void;
  setYear: (y: number) => void;
  dateRange: { start: string; end: string };
}

const MonthFilterContext = createContext<MonthFilterContextType | null>(null);

export const MonthFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const dateRange = useMemo(() => {
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const end = new Date(year, month, 0).toISOString().split('T')[0];
    return { start, end };
  }, [month, year]);

  return (
    <MonthFilterContext.Provider value={{ month, year, setMonth, setYear, dateRange }}>
      {children}
    </MonthFilterContext.Provider>
  );
};

export const useMonthFilter = (): MonthFilterContextType => {
  const ctx = useContext(MonthFilterContext);
  if (!ctx) throw new Error('useMonthFilter must be used inside MonthFilterProvider');
  return ctx;
};
```

---

## Data-Binding Patterns

### Real-Time Subscription Example

```typescript
// Hook to listen to transactions in real-time
export const useTransactionsRealtime = (userId: number, filter: TransactionFilter) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);
      setTransactions(data || []);
    };

    fetchInitial();

    // Subscribe to changes
    const subscription = supabase
      .channel(`transactions_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTransactions(prev =>
              prev.map(t => (t.id === (payload.new as Transaction).id ? payload.new as Transaction : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== (payload.old as Transaction).id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return transactions;
};
```

### Page-to-Data Flow Example (Home Dashboard)

```typescript
// pages/Home.tsx
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { transactions, dailyAggregates, isLoading } = useTransactions(user?.user_id || null);

  useEffect(() => {
    if (user) {
      fetchTransactions({ month, year });
    }
  }, [user, month, year]);

  const totalIncome = dailyAggregates.reduce((sum, d) => sum + d.totalIncome, 0);
  const totalExpense = dailyAggregates.reduce((sum, d) => sum + d.totalExpense, 0);
  const netFlow = totalIncome - totalExpense;

  return (
    <div className="p-lg pb-24">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-md mb-2xl">
        <Card>
          <p className="text-text-secondary">Pemasukan</p>
          <p className="font-amount-md text-income">+Rp {totalIncome.toLocaleString('id-ID')}</p>
        </Card>
        <Card>
          <p className="text-text-secondary">Pengeluaran</p>
          <p className="font-amount-md text-expense">−Rp {totalExpense.toLocaleString('id-ID')}</p>
        </Card>
        <Card>
          <p className="text-text-secondary">Saldo</p>
          <p className={cn('font-amount-md', netFlow >= 0 ? 'text-income' : 'text-expense')}>
            {netFlow >= 0 ? '+' : '−'}Rp {Math.abs(netFlow).toLocaleString('id-ID')}
          </p>
        </Card>
      </div>

      {/* Daily chart */}
      <Card className="mb-2xl">
        <h3 className="font-heading-sm mb-lg">Daily Spending</h3>
        <BarChart data={dailyAggregates} />
      </Card>

      {/* Recent transactions */}
      <h3 className="font-heading-sm mb-lg">Recent Transactions</h3>
      {transactions.slice(0, 5).map(t => (
        <TransactionRow key={t.id} transaction={t} />
      ))}
    </div>
  );
};
```

---

## Navigation & Routing Structure

### Router Setup (`app/App.tsx`)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { MonthFilterProvider } from '@/hooks/useMonthFilter';

function App() {
  return (
    <AuthProvider>
      <MonthFilterProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/link-telegram" element={<LinkTelegram />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Home />} />
              <Route path="pengeluaran" element={<Pengeluaran />} />
              <Route path="tren" element={<Tren />} />
              <Route path="budget" element={<Budget />} />
              <Route path="goals" element={<Goals />} />
              <Route path="ai" element={<AiChat />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MonthFilterProvider>
    </AuthProvider>
  );
}
```

### Protected Route Component

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner fullScreen />;
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};
```

### Layout with Bottom Navigation

```typescript
export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = location.pathname === '/' ? 'home'
    : location.pathname.startsWith('/pengeluaran') ? 'pengeluaran'
    : location.pathname.startsWith('/tren') ? 'tren'
    : location.pathname.startsWith('/budget') ? 'budget'
    : 'ai';

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          const paths: Record<string, string> = {
            home: '/',
            pengeluaran: '/pengeluaran',
            tren: '/tren',
            budget: '/budget',
            ai: '/ai',
          };
          navigate(paths[tab]);
        }}
      />
    </div>
  );
};
```

---

## Screen Implementation Specifications

### 1. Home Dashboard (`pages/Home.tsx`)

**Purpose:** Overview of financial status, recent transactions, and quick actions.

**Sections:**
1. **Header** — Month selector, user greeting
2. **Summary Cards** — Income, Expense, Balance (3-column grid)
3. **Daily Spending Chart** — BarChart of last 30 days
4. **Category Pie Chart** — Expense distribution
5. **Recent Transactions** — Last 5 with TransactionRow
6. **Floating Action Button** — Add transaction modal

**Implementation Structure:**

```typescript
export const Home: React.FC = () => {
  const { user } = useAuth();
  const { month, year, setMonth, setYear } = useMonthFilter();
  const { transactions, dailyAggregates, categoryAggregates } = useTransactions(user?.user_id || null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="relative">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 p-lg border-b border-border">
        <div className="flex justify-between items-center mb-md">
          <h1 className="font-heading-lg">Gajian Aman</h1>
          <button className="text-2xl">⚙️</button>
        </div>
        <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      {/* Summary Cards */}
      <div className="p-lg grid grid-cols-3 gap-md">
        <SummaryCard label="Pemasukan" amount={totalIncome} type="income" />
        <SummaryCard label="Pengeluaran" amount={totalExpense} type="expense" />
        <SummaryCard label="Saldo" amount={netFlow} type={netFlow >= 0 ? 'income' : 'expense'} />
      </div>

      {/* Charts Section */}
      <div className="px-lg py-md space-y-2xl">
        <Card>
          <h3 className="font-heading-sm p-lg border-b border-border">Daily Spending</h3>
          <BarChart data={dailyAggregates} height={250} />
        </Card>

        <Card>
          <h3 className="font-heading-sm p-lg border-b border-border">Expense by Category</h3>
          <CategoryPieChart data={categoryAggregates} variant="donut" size="md" />
        </Card>
      </div>

      {/* Recent Transactions */}
      <div className="px-lg py-md">
        <h3 className="font-heading-sm mb-md">Recent Transactions</h3>
        {transactions.slice(0, 5).map(t => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-lg w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center text-2xl hover:bg-primary-dark"
      >
        +
      </button>

      {/* Modal */}
      {isAddModalOpen && (
        <TransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={async (data) => {
            await addTransaction(data);
            setIsAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
```

### 2. Pengeluaran (Spending) (`pages/Pengeluaran.tsx`)

**Purpose:** Detailed breakdown of all expenses by category with filters.

**Sections:**
1. **Category Filters** — Buttons for each expense category + All
2. **Category Cards** — BudgetCard-style display of totals per category
3. **Transactions List** — Full history filtered by category

**Key Features:**
- Filter by category with visual indicator
- Sort by amount or date
- Swipe-to-delete on mobile (optional)

### 3. Tren (Trends) (`pages/Tren.tsx`)

**Purpose:** 3-month historical analysis of income vs. expenses.

**Sections:**
1. **Line Chart** — Income, Expense, Savings over 3 months
2. **Summary Stats** — Average monthly, highest month, trend direction
3. **Category Breakdown** — Top categories for the period

### 4. Budget (`pages/Budget.tsx`)

**Purpose:** Set and monitor budgets per category.

**Sections:**
1. **Add Budget Button** — Modal form to set budget for category + amount
2. **Budget Cards** — BudgetCard component for each active budget
3. **Over-Budget Warnings** — Highlighted when spent > budget

### 5. Goals (`pages/Goals.tsx`)

**Purpose:** Track savings goals with progress and deadlines.

**Sections:**
1. **Goal Cards** — GoalCard component for each goal
2. **Add Goal Button** — Modal to create new goal
3. **Goal Analytics** — Time remaining, contribution needed monthly

### 6. AI Chat (`pages/AiChat.tsx`)

**Purpose:** Multi-turn conversation for transaction parsing and financial advice.

**Features:**
- Message input with send button
- Typing indicator while Claude processes
- Message history with timestamps
- Suggested quick actions ("Parse receipt", "Categorize", "Show budget")
- Image upload for receipt parsing

**Message Type:**

```typescript
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: { url: string; type: 'receipt' | 'screenshot' };
};
```

---

## Form & Input Validation Patterns

### Transaction Form Validation

```typescript
import { useForm, Controller } from 'react-hook-form';

interface TransactionFormInputs {
  amount: number;
  type: 'expense' | 'income' | 'saving';
  category: string;
  note: string;
  date: string;
}

const TransactionForm: React.FC<{ onSubmit: (data: TransactionFormInputs) => void }> = ({ onSubmit }) => {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<TransactionFormInputs>({
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const transactionType = watch('type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-lg">
      {/* Amount */}
      <Controller
        name="amount"
        control={control}
        rules={{
          required: 'Amount is required',
          min: { value: 100, message: 'Minimum Rp 100' },
          max: { value: 100000000, message: 'Maximum Rp 100.000.000' },
        }}
        render={({ field }) => (
          <div>
            <label className="font-label-md block mb-sm">Amount</label>
            <AmountInput
              {...field}
              error={errors.amount?.message}
            />
          </div>
        )}
      />

      {/* Type */}
      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <div>
            <label className="font-label-md block mb-sm">Type</label>
            <div className="flex gap-sm">
              {(['expense', 'income', 'saving'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => field.onChange(t)}
                  className={cn(
                    'flex-1 py-md rounded-md border-2 transition-colors',
                    field.value === t ? 'border-primary bg-primary-50' : 'border-border'
                  )}
                >
                  {t === 'expense' ? '📉' : t === 'income' ? '📈' : '💰'} {t}
                </button>
              ))}
            </div>
          </div>
        )}
      />

      {/* Category */}
      <Controller
        name="category"
        control={control}
        rules={{ required: 'Category is required' }}
        render={({ field }) => (
          <div>
            <label className="font-label-md block mb-sm">Category</label>
            <CategorySelect
              {...field}
              type={transactionType}
              error={errors.category?.message}
            />
          </div>
        )}
      />

      {/* Note */}
      <Controller
        name="note"
        control={control}
        rules={{
          required: 'Note is required',
          minLength: { value: 3, message: 'Minimum 3 characters' },
          maxLength: { value: 100, message: 'Maximum 100 characters' },
        }}
        render={({ field }) => (
          <div>
            <label className="font-label-md block mb-sm">Note</label>
            <input
              {...field}
              type="text"
              placeholder="e.g., Lunch at warung"
              className={cn(
                'w-full px-lg py-md border border-border rounded-md',
                errors.note && 'border-error'
              )}
            />
            {errors.note && <p className="text-error text-body-sm mt-sm">{errors.note.message}</p>}
          </div>
        )}
      />

      {/* Date */}
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <div>
            <label className="font-label-md block mb-sm">Date</label>
            <input
              {...field}
              type="date"
              className="w-full px-lg py-md border border-border rounded-md"
            />
          </div>
        )}
      />

      <button type="submit" className="w-full bg-primary text-white py-md rounded-md font-label-md hover:bg-primary-dark">
        Save Transaction
      </button>
    </form>
  );
};
```

---

## Animation & Motion Implementation

### Page Transitions

```typescript
// Using Motion for smooth layout transitions
import { motion, AnimatePresence } from 'motion/react';

export const LayoutWithMotion: React.FC = () => {
  const location = useLocation();

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
```

### Modal Animations

```typescript
export const TransactionModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 max-h-[90vh] overflow-y-auto pb-safe-area-inset-bottom"
          >
            <div className="p-lg">
              <h2 className="font-heading-md mb-2xl">Add Transaction</h2>
              <TransactionForm onSubmit={async (data) => {
                await onSubmit(data);
                onClose();
              }} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
```

### Loading States

```typescript
export const LoadingSpinner: React.FC<{ fullScreen?: boolean }> = ({ fullScreen = false }) => {
  return (
    <div className={cn(
      'flex items-center justify-center',
      fullScreen ? 'fixed inset-0 bg-white/80 z-50' : 'h-32'
    )}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );
};
```

---

## Mobile Layout & Responsive Design

### Viewport & Safe Area

```html
<!-- index.html -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
/* styles/globals.css */
body {
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* For content that should respect bottom inset (navbar) */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### Responsive Breakpoints

| Breakpoint | Width | Use Case |
|-----------|-------|----------|
| Mobile | 320–479px | Small phones (iPhone SE) |
| Baseline | 375px | iPhone 12/13/14 baseline |
| Large Mobile | 480–599px | Larger phones (Plus models) |
| Tablet | 600px+ | iPad, landscape phones |

```typescript
// Responsive component example
export const ResponsiveGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-md p-lg">
      {children}
    </div>
  );
};
```

### Touch-Friendly Sizing

- **Minimum touch target:** 44px (CSS `h-11` or `py-md + py-sm`)
- **Comfortable padding:** 16px around interactive elements
- **Safe thumb zone:** Bottom 60% of screen for primary actions

```typescript
// Button sizing
<button className="min-h-11 px-lg py-md rounded-md">
  Touch-friendly button
</button>
```

---

## File Structure & Development Conventions

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase.tsx | `TransactionRow.tsx` |
| Pages | PascalCase.tsx | `Home.tsx` |
| Hooks | camelCase.ts(x) | `useAuth.tsx` |
| Utils | camelCase.ts | `formatters.ts` |
| Types | Exported from lib | `User`, `Transaction` |

### Component Template

```typescript
// components/MyComponent.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  children?: React.ReactNode;
  // ... other props
}

/**
 * Brief description of what this component does.
 */
export const MyComponent: React.FC<MyComponentProps> = ({
  variant = 'primary',
  disabled = false,
  children,
  // ... destructure props
}) => {
  return (
    <div className={cn(
      'base-classes',
      variant === 'primary' && 'primary-variant-classes',
      variant === 'secondary' && 'secondary-variant-classes',
      disabled && 'disabled-classes'
    )}>
      {children}
    </div>
  );
};
```

### Import Organization

```typescript
// 1. React & Framework
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// 2. External libraries
import { motion, AnimatePresence } from 'motion/react';

// 3. Internal - hooks
import { useAuth } from '@/hooks/useAuth';
import { useMonthFilter } from '@/hooks/useMonthFilter';

// 4. Internal - components
import { Button } from '@/app/components/ui/button';
import { TransactionRow } from '@/app/components/CompoundComponents';

// 5. Internal - utilities
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// 6. Styles
import '@/styles/custom.css';
```

### Environment Variables

```
# frontend/.env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[public_key]
VITE_ANTHROPIC_API_KEY=[key]          # Used by parse-image.js
```

### Error Handling

All async operations should follow this pattern:

```typescript
try {
  setIsLoading(true);
  const result = await someAsyncOperation();
  // Handle success
} catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  toast.error(message); // Show user-friendly error
  setError(message);
} finally {
  setIsLoading(false);
}
```

---

## Deployment & Build Checklist

Before deploying to Vercel:

- [ ] All TypeScript types are defined in `lib/supabase.ts`
- [ ] All Supabase queries use the client from `lib/supabase.ts`
- [ ] No hardcoded API keys or secrets (use `.env`)
- [ ] All pages are protected with `ProtectedRoute` where needed
- [ ] Mobile viewport meta tag is in `index.html`
- [ ] Tailwind config includes all custom colors and spacing
- [ ] No console errors or warnings
- [ ] All components have proper prop typing
- [ ] Responsive design tested on 375px, 768px, and 1024px viewports
- [ ] Auth flow tested: Telegram login, Google OAuth, linking
- [ ] Image parsing API endpoint is configured in Vercel env vars

### Build & Test Commands

```bash
# Development
npm run dev

# Type check
npm run type-check

# Build
npm run build

# Preview production build
npm run preview

# Linting (if configured)
npm run lint
```

---

## Summary

This specification document provides:

1. **Complete TypeScript types** for all domain entities
2. **Tailwind configuration** mapping design tokens exactly
3. **Component APIs** with prop signatures and variants
4. **State management patterns** using React hooks + Supabase
5. **Data-binding examples** from Supabase to UI
6. **Navigation setup** with protected routes and bottom tabs
7. **Screen specifications** with implementation examples
8. **Form validation** using react-hook-form
9. **Animation patterns** using Motion
10. **Mobile-first responsive design** with safe areas

**Next Steps:**
1. Set up Vite project with React + TypeScript
2. Install Tailwind CSS v4 via `@tailwindcss/vite`
3. Configure Supabase JS client
4. Scaffold directory structure and shadcn/ui components
5. Implement pages in order: Login → Home → Pengeluaran → Tren → Budget → Goals → AiChat
6. Test auth flow end-to-end
7. Deploy to Vercel with environment variables

**Estimated Development Time:** 40–60 hours for one frontend engineer following this spec.

