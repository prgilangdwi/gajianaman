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
