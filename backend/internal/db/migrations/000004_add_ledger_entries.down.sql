-- Remove voided_at from transactions
DROP INDEX IF EXISTS idx_transactions_voided;
ALTER TABLE transactions DROP COLUMN IF EXISTS voided_at;

-- Remove ledger_entries table
DROP TABLE IF EXISTS ledger_entries;
