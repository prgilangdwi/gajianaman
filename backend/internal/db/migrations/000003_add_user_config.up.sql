-- 000003_add_user_config.up.sql
-- User configuration for budgeting: monthly income and fixed expenses

-- Fixed expense categories enum (for documentation/validation reference)
-- HOUSING, BILLS, LIFESTYLE, TRANSPORTATION, DINING, UNEXPECTED_EXPENSE, SAVING, EDUCATION

CREATE TABLE IF NOT EXISTS user_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    monthly_income  NUMERIC,
    fixed_expenses  JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_config_user_id ON user_config(user_id);

-- GIN index for JSONB key lookups
CREATE INDEX IF NOT EXISTS idx_user_config_fixed_expenses ON user_config USING GIN (fixed_expenses jsonb_path_ops);

-- Trigger for updated_at
CREATE TRIGGER trg_user_config_updated BEFORE UPDATE ON user_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE user_config IS 'User budgeting configuration: income and fixed monthly expenses';
COMMENT ON COLUMN user_config.fixed_expenses IS 'JSONB with keys: HOUSING, BILLS, LIFESTYLE, TRANSPORTATION, DINING, UNEXPECTED_EXPENSE, SAVING, EDUCATION. Values are amounts in user currency.';
