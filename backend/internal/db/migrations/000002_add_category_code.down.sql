-- 000002_add_category_code.down.sql

DROP INDEX IF EXISTS idx_categories_code_user;
DROP INDEX IF EXISTS idx_categories_code_system;
ALTER TABLE categories DROP COLUMN IF EXISTS code;
