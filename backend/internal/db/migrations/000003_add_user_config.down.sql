-- 000003_add_user_config.down.sql

DROP TRIGGER IF EXISTS trg_user_config_updated ON user_config;
DROP INDEX IF EXISTS idx_user_config_fixed_expenses;
DROP TABLE IF EXISTS user_config;
