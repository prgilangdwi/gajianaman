-- ============================================
-- Migration: Expand Schema for Minor Update v1
-- Adds category hierarchy, recurring bills, Gajian setup detection
-- ============================================

-- 1. Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS payday_date INT; -- 1-28 or NULL
ALTER TABLE users ADD COLUMN IF NOT EXISTS gajian_setup_complete BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gajian_salary NUMERIC(12, 2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gajian_wallet_id TEXT;

-- 2. Create category_groups table for financial grouping (Kebutuhan, Keinginan, etc.)
CREATE TABLE IF NOT EXISTS category_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, name)
);

-- 3. Expand categories table to support hierarchy
ALTER TABLE categories ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_group_id UUID REFERENCES category_groups(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color VARCHAR(7);
-- Make user_id nullable for system categories
-- (Note: original schema has user_id NOT NULL, so this may need special handling in Supabase)

-- 4. Create recurring_transactions table for bills and recurring income
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category TEXT, -- Fallback to text if category_id not used
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50), -- 'expense', 'income'
    description VARCHAR(255),
    due_date_of_month INT, -- 1-28, NULL for "last day"
    frequency VARCHAR(50), -- 'weekly', 'monthly', 'yearly', 'custom'
    frequency_interval INT DEFAULT 1, -- repeat every N days/weeks/months
    wallet_id TEXT,
    is_active BOOLEAN DEFAULT true,
    reminder_enabled BOOLEAN DEFAULT true,
    reminder_days_before INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT now(),
    last_occurrence TIMESTAMP,
    next_due_date TIMESTAMP,
    UNIQUE(user_id, description, due_date_of_month, frequency)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_groups_user ON category_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_due ON recurring_transactions(next_due_date);
CREATE INDEX IF NOT EXISTS idx_users_payday_date ON users(payday_date);

-- 6. Create system category groups and categories (if not exist)
-- This should be run AFTER migration, with seeding logic in application code
