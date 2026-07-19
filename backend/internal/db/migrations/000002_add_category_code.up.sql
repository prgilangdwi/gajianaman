-- 000002_add_category_code.up.sql
-- Add code column to categories for machine-readable identifiers

ALTER TABLE categories ADD COLUMN IF NOT EXISTS code TEXT;

-- Create unique index on code for system categories (where user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_code_system
    ON categories(code)
    WHERE user_id IS NULL AND deleted_at IS NULL AND code IS NOT NULL;

-- Create index for user categories with code
CREATE INDEX IF NOT EXISTS idx_categories_code_user
    ON categories(user_id, code)
    WHERE deleted_at IS NULL AND code IS NOT NULL;
