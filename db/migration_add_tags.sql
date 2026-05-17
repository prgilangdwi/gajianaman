-- Add tags column to transactions table
-- Run this in Supabase SQL Editor to add tagging support

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index for tag queries (for filtering)
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON transactions USING GIN(tags);

-- Update existing transactions to have empty array (in case any exist)
UPDATE transactions SET tags = '{}' WHERE tags IS NULL;
