-- db/migration_major_update_1.sql
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── Fitur 2: Google auth columns ──────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT;

-- ── Fitur 5: Gajian / Risk profile ────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS payday_date INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_profile JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_budget_recommendation JSONB;

-- ── Fitur 10: Subscription ────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'gratis';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ── Fitur 6: Wallets ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash')),
  icon TEXT,
  is_primary BOOLEAN DEFAULT false,
  initial_balance NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- ── Fitur 1: Split Bills ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  participants JSONB NOT NULL,
  items JSONB,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Fitur 10: Subscription audit log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('gratis', 'starter', 'pro')),
  period TEXT NOT NULL CHECK (period IN ('monthly', '3month', '6month', 'yearly')),
  price_paid NUMERIC(10,2),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_ref TEXT,
  is_active BOOLEAN DEFAULT true
);
