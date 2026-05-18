import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Types matching the DB schema ──────────────────────────────────────────────

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  type: 'expense' | 'income' | 'savings' | 'transfer';
  category: string;
  subcategory?: string;
  note?: string;
  ai_confidence?: string;
  date: string;
  created_at: string;
  wallet_id?: string;
  wallet_destination_id?: string;
  tags?: string[];
}

export interface Budget {
  id: number;
  user_id: number;
  category: string;
  amount: number;
  period: string;
  month: number;
  year: number;
}

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline?: string;
  created_at: string;
}

export interface CategoryGroup {
  id: string;
  user_id?: number;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id?: number;
  parent_group_id?: string;
  name: string;
  type: 'expense' | 'income' | 'transfer';
  icon?: string;
  color?: string;
  is_default: boolean;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: number;
  category?: string;
  amount: number;
  type: 'expense' | 'income';
  description?: string;
  due_date_of_month?: number;
  frequency: 'weekly' | 'monthly' | 'yearly' | 'custom';
  frequency_interval: number;
  wallet_id?: string;
  is_active: boolean;
  reminder_enabled: boolean;
  reminder_days_before: number;
  created_at: string;
  last_occurrence?: string;
  next_due_date?: string;
}

export interface User {
  user_id: number;
  name?: string;
  username?: string;
  currency: string;
  timezone: string;
  tier: string;
  created_at: string;
  email?: string;
  google_id?: string;
  payday_date?: number;
  gajian_setup_complete?: boolean;
  gajian_salary?: number;
  gajian_wallet_id?: string;
  risk_profile?: Record<string, unknown>;
  ai_budget_recommendation?: Record<string, unknown>;
  subscription_plan?: 'gratis' | 'starter' | 'pro';
  subscription_expires_at?: string;
}

export interface Wallet {
  id: string;
  user_id: number;
  name: string;
  type: 'bank' | 'ewallet' | 'cash';
  icon?: string;
  is_primary: boolean;
  initial_balance: number;
  created_at: string;
}

export interface SplitBill {
  id: string;
  user_id: number;
  session_name: string;
  total_amount: number;
  participants: Array<{ name: string; amount: number; paid: boolean }>;
  items?: Array<{ name: string; price: number; assignee: string }>;
  share_token: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: number;
  plan: 'gratis' | 'starter' | 'pro';
  period: 'monthly' | '3month' | '6month' | 'yearly';
  price_paid?: number;
  started_at: string;
  expires_at: string;
  payment_ref?: string;
  is_active: boolean;
}
