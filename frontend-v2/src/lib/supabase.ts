import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './database.types';

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// Enums matching backend SMALLINT values
export const TransactionType = { EXPENSE: 0, INCOME: 1, TRANSFER: 2 } as const;
export const CategoryType = { EXPENSE: 0, INCOME: 1 } as const;
export const AccountType = { CASH: 0, BANK: 1, EWALLET: 2, CREDIT: 3, INVESTMENT: 4 } as const;

export const AccountTypeLabels: Record<number, string> = {
	0: 'Cash',
	1: 'Bank',
	2: 'E-Wallet',
	3: 'Credit Card',
	4: 'Investment'
};

export const AccountTypeIcons: Record<number, string> = {
	0: '💵',
	1: '🏦',
	2: '📱',
	3: '💳',
	4: '📈'
};

// Re-export generated types for convenience
export type User = Database['public']['Tables']['users']['Row'];
export type Account = Database['public']['Tables']['accounts']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Budget = Database['public']['Tables']['budgets']['Row'];
export type Goal = Database['public']['Tables']['goals']['Row'];
export type UserConfig = Database['public']['Tables']['user_config']['Row'];

// Insert types for creating records
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
export type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
export type GoalInsert = Database['public']['Tables']['goals']['Insert'];
export type UserConfigInsert = Database['public']['Tables']['user_config']['Insert'];

// Update types for partial updates
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];
export type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];
export type GoalUpdate = Database['public']['Tables']['goals']['Update'];
export type UserConfigUpdate = Database['public']['Tables']['user_config']['Update'];

// Fixed expense categories for budgeting
export const FixedExpenseCategory = {
	HOUSING: 'HOUSING',
	BILLS: 'BILLS',
	LIFESTYLE: 'LIFESTYLE',
	TRANSPORTATION: 'TRANSPORTATION',
	DINING: 'DINING',
	UNEXPECTED_EXPENSE: 'UNEXPECTED_EXPENSE',
	SAVING: 'SAVING',
	EDUCATION: 'EDUCATION'
} as const;

export type FixedExpenseCategoryKey = keyof typeof FixedExpenseCategory;

export const FixedExpenseCategoryLabel: Record<FixedExpenseCategoryKey, string> = {
	HOUSING: 'Housing',
	BILLS: 'Utilities',
	LIFESTYLE: 'Lifestyle & Entertainment',
	TRANSPORTATION: 'Transportation',
	DINING: 'Food & Dining',
	UNEXPECTED_EXPENSE: 'Unexpected Expenses',
	SAVING: 'Savings & Investment',
	EDUCATION: 'Education'
};

export type FixedExpenses = Partial<Record<FixedExpenseCategoryKey, number>>;
