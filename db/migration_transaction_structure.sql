-- db/migration_transaction_structure.sql
-- Section 4: Enhanced Data Structure & Transaction System
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── Add advanced transaction metadata ────────────────────────────────────────
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS merchant_name TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS recurring_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS custom_properties JSONB DEFAULT '{}'::jsonb;

-- ── Create recurring transaction patterns table ─────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  day_of_cycle INTEGER,
  is_active BOOLEAN DEFAULT true,
  confidence NUMERIC DEFAULT 0.5,
  last_occurrence DATE,
  next_expected DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Create transaction grouping/aggregation table for reporting ──────────────
CREATE TABLE IF NOT EXISTS transaction_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  category TEXT,
  transaction_type TEXT,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  count INTEGER DEFAULT 0,
  avg_amount NUMERIC,
  min_amount NUMERIC,
  max_amount NUMERIC,
  netting_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period, period_start, category, transaction_type)
);

-- ── Create multi-month transaction analysis table ───────────────────────────
CREATE TABLE IF NOT EXISTS transaction_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month_year TEXT NOT NULL, -- YYYY-MM format
  expense_total NUMERIC DEFAULT 0,
  income_total NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_transaction NUMERIC,
  volatility NUMERIC, -- standard deviation for trend analysis
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month_year)
);

-- ── Add indexes for efficient querying ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON transactions(user_id, merchant_name)
  WHERE merchant_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON transactions(user_id, is_recurring)
  WHERE is_recurring = true;

CREATE INDEX IF NOT EXISTS idx_recurring_patterns_user ON recurring_patterns(user_id, is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_recurring_patterns_next_expected ON recurring_patterns(user_id, next_expected)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_transaction_aggregates_period ON transaction_aggregates(user_id, period, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_transaction_trends_category ON transaction_trends(user_id, category, month_year);

-- ── Create view for netting analysis (income - expense per category) ────────
CREATE OR REPLACE VIEW transaction_netting_view AS
SELECT
  t.user_id,
  t.category,
  DATE_TRUNC('month', t.date)::DATE as month_start,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
  SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expense,
  SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net_amount,
  COUNT(*) as transaction_count
FROM transactions t
WHERE t.type IN ('income', 'expense')
GROUP BY t.user_id, t.category, DATE_TRUNC('month', t.date)::DATE;

-- ── Multi-month comparison view ────────────────────────────────────────────
CREATE OR REPLACE VIEW multi_month_comparison_view AS
SELECT
  user_id,
  category,
  month_year,
  expense_total,
  income_total,
  net_amount,
  transaction_count,
  LAG(expense_total) OVER (PARTITION BY user_id, category ORDER BY month_year) as prev_month_expense,
  LAG(net_amount) OVER (PARTITION BY user_id, category ORDER BY month_year) as prev_month_net,
  ROUND(
    ((net_amount - LAG(net_amount) OVER (PARTITION BY user_id, category ORDER BY month_year)) /
     LAG(net_amount) OVER (PARTITION BY user_id, category ORDER BY month_year) * 100)::numeric,
    2
  ) as month_over_month_change_percent
FROM transaction_trends
ORDER BY user_id, category, month_year DESC;

-- ── Comments for documentation ────────────────────────────────────────────
COMMENT ON TABLE recurring_patterns IS 'Detected recurring transaction patterns for budget planning and predictions';
COMMENT ON TABLE transaction_aggregates IS 'Pre-computed aggregates for faster reporting and analysis queries';
COMMENT ON TABLE transaction_trends IS 'Monthly trends and statistics for multi-month comparison and volatility analysis';
COMMENT ON VIEW transaction_netting_view IS 'Net income/expense view showing income minus expenses per category per month';
COMMENT ON VIEW multi_month_comparison_view IS 'Multi-month comparison with YoY or month-over-month changes for trend analysis';
