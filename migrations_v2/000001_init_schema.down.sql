-- 000001_init_schema.down.sql
-- Rollback v2 schema

DROP TRIGGER IF EXISTS trg_recurring_updated ON recurring_transactions;
DROP TRIGGER IF EXISTS trg_goals_updated ON goals;
DROP TRIGGER IF EXISTS trg_budgets_updated ON budgets;
DROP TRIGGER IF EXISTS trg_transactions_updated ON transactions;
DROP TRIGGER IF EXISTS trg_categories_updated ON categories;
DROP TRIGGER IF EXISTS trg_accounts_updated ON accounts;
DROP TRIGGER IF EXISTS trg_users_updated ON users;

DROP FUNCTION IF EXISTS update_updated_at();

DROP TABLE IF EXISTS recurring_transactions;
DROP TABLE IF EXISTS budgets;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS goals;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
