-- 000002_add_category_code.down.sql
-- Remove code column from categories

DROP INDEX IF EXISTS idx_categories_code_global;
DROP INDEX IF EXISTS idx_categories_code_user;
ALTER TABLE categories DROP COLUMN IF EXISTS code;
