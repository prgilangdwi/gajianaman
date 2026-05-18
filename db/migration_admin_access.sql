-- db/migration_admin_access.sql
-- Section 2: License & Admin Access
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ── Add admin/license fields to users table ───────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_key TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS license_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}'::jsonb;

-- ── Create admin audit log table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  affected_user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for admin audit queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin ON admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_user ON admin_audit_log(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);

-- ── Grant admin role to the initial super admin ──────────────────────────────
-- TODO: Run this manually after confirming the email exists:
-- UPDATE users SET is_admin = true WHERE email = 'pr.gilangdwi@gmail.com';

-- ── Create license configuration table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS license_tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_monthly NUMERIC(10,2),
  price_yearly NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default license tiers
INSERT INTO license_tiers (name, description, features, is_active)
VALUES
  ('free', 'Free tier with basic features',
   '{"max_transactions": 100, "wallets": 3, "export": false, "ai_insights": false}'::jsonb, true),
  ('pro', 'Professional tier for power users',
   '{"max_transactions": 1000, "wallets": 10, "export": true, "ai_insights": true, "recurring": true}'::jsonb, true),
  ('premium', 'Premium tier with all features',
   '{"max_transactions": null, "wallets": null, "export": true, "ai_insights": true, "recurring": true, "api_access": true, "white_label": false}'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- ── Index for admin queries ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin)
WHERE is_admin = true;

-- ── Comments for documentation ───────────────────────────────────────────────
COMMENT ON TABLE admin_audit_log IS 'Audit trail for admin actions to track changes and maintain accountability';
COMMENT ON COLUMN users.is_admin IS 'Boolean flag indicating if user has admin privileges';
COMMENT ON COLUMN users.license_key IS 'Optional license key for premium features or enterprise deployments';
COMMENT ON COLUMN users.features IS 'JSONB field for per-user feature flags and permissions';
