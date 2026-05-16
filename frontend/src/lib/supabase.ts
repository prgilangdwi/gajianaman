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
  type: 'expense' | 'income';
  category: string;
  subcategory?: string;
  note?: string;
  ai_confidence?: string;
  date: string;
  created_at: string;
  wallet_id?: string;
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

export interface User {
  user_id: number;
  name?: string;
  username?: string;
  currency: string;
  timezone: string;
  tier: string;
  created_at: string;
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
