-- db/migration_transaction_types.sql
-- Section 16: Extend transactions to support savings and transfer types
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── Extend transaction type to support savings and transfer ──────────────────
-- Note: If the original schema has a CHECK constraint, it will need to be dropped first
-- For Supabase, run these queries in order:

-- 1. Drop any existing type constraints
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;

-- 2. Add the new constraint that includes all 4 types
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('expense', 'income', 'savings', 'transfer'));

-- ── Add wallet_destination_id for transfer transactions ────────────────────
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS wallet_destination_id UUID REFERENCES wallets(id) ON DELETE SET NULL;

-- Add index for destination wallet queries
CREATE INDEX IF NOT EXISTS idx_transactions_wallet_destination ON transactions(wallet_destination_id)
WHERE wallet_destination_id IS NOT NULL;

-- ── Update schema documentation ──────────────────────────────────────────────
-- The transactions table now supports:
-- - type: 'expense' | 'income' | 'savings' | 'transfer'
-- - wallet_id: source wallet (required for wallet tracking)
-- - wallet_destination_id: destination wallet (required for transfers)
--
-- Transaction rules:
-- - 'expense': money out, has wallet_id, category required
-- - 'income': money in, has wallet_id, category optional
-- - 'savings': transfer to savings/investment, has wallet_id, category from savings categories
-- - 'transfer': move between wallets, has wallet_id AND wallet_destination_id
