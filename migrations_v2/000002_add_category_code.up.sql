-- 000002_add_category_code.up.sql
-- Add code column to categories for cleaner queries

ALTER TABLE categories ADD COLUMN IF NOT EXISTS code TEXT;

-- Create unique index on code (for global categories)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_code_global
    ON categories(code)
    WHERE user_id IS NULL AND deleted_at IS NULL;

-- Create index on code for user categories (not unique, allows same code per user)
CREATE INDEX IF NOT EXISTS idx_categories_code_user
    ON categories(user_id, code)
    WHERE user_id IS NOT NULL AND deleted_at IS NULL;

-- Update existing categories with codes
UPDATE categories SET code = 'FOOD_AND_DINING' WHERE name = 'Food & Dining' AND code IS NULL;
UPDATE categories SET code = 'GROCERIES' WHERE name = 'Groceries' AND code IS NULL;
UPDATE categories SET code = 'TRANSPORT' WHERE name = 'Transport' AND code IS NULL;
UPDATE categories SET code = 'SHOPPING' WHERE name = 'Shopping' AND code IS NULL;
UPDATE categories SET code = 'HEALTH' WHERE name = 'Health' AND code IS NULL;
UPDATE categories SET code = 'ENTERTAINMENT' WHERE name = 'Entertainment' AND code IS NULL;
UPDATE categories SET code = 'BILLS_AND_UTILITIES' WHERE name = 'Bills & Utilities' AND code IS NULL;
UPDATE categories SET code = 'EDUCATION' WHERE name = 'Education' AND code IS NULL;
UPDATE categories SET code = 'PERSONAL_CARE' WHERE name = 'Personal Care' AND code IS NULL;
UPDATE categories SET code = 'DINING_OUT' WHERE name = 'Dining Out' AND code IS NULL;
UPDATE categories SET code = 'OTHER' WHERE name = 'Other' AND code IS NULL;
UPDATE categories SET code = 'SALARY' WHERE name = 'Salary' AND code IS NULL;
UPDATE categories SET code = 'FREELANCE' WHERE name = 'Freelance' AND code IS NULL;
UPDATE categories SET code = 'INVESTMENT_RETURN' WHERE name = 'Investment Return' AND code IS NULL;
UPDATE categories SET code = 'OTHER_INCOME' WHERE name = 'Other Income' AND code IS NULL;
UPDATE categories SET code = 'SAVINGS' WHERE name = 'Savings' AND code IS NULL;
UPDATE categories SET code = 'INVESTMENT' WHERE name = 'Investment' AND code IS NULL;
UPDATE categories SET code = 'TRANSFER' WHERE name = 'Transfer' AND code IS NULL;

-- Make code NOT NULL after populating existing rows
-- For any remaining categories without code, generate from name
UPDATE categories
SET code = UPPER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9 ]', '', 'g'), ' +', '_', 'g'))
WHERE code IS NULL;

ALTER TABLE categories ALTER COLUMN code SET NOT NULL;
