-- ============================================
-- FINTRACK DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    user_id     BIGINT PRIMARY KEY,
    name        TEXT,
    username    TEXT,
    currency    TEXT DEFAULT 'IDR',
    timezone    TEXT DEFAULT 'Asia/Jakarta',
    tier        TEXT DEFAULT 'free',  -- free | pro | premium
    created_at  TIMESTAMP DEFAULT now()
);

-- Categories (system defaults + user custom)
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    icon        TEXT DEFAULT '📁',
    type        TEXT NOT NULL,  -- expense | income | saving
    is_default  BOOLEAN DEFAULT false
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id              SERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    amount          NUMERIC NOT NULL,
    type            TEXT NOT NULL DEFAULT 'expense',  -- expense | income
    category        TEXT NOT NULL,
    subcategory     TEXT,
    note            TEXT,
    ai_confidence   TEXT,  -- high | medium | low
    date            DATE DEFAULT CURRENT_DATE,
    created_at      TIMESTAMP DEFAULT now()
);

-- Budgets
CREATE TABLE IF NOT EXISTS budgets (
    id          SERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    category    TEXT NOT NULL,
    amount      NUMERIC NOT NULL,
    period      TEXT DEFAULT 'monthly',  -- monthly | weekly
    month       INT,
    year        INT,
    UNIQUE(user_id, category, month, year)
);

-- Savings Goals
CREATE TABLE IF NOT EXISTS goals (
    id              SERIAL PRIMARY KEY,
    user_id         BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    target_amount   NUMERIC NOT NULL,
    saved_amount    NUMERIC DEFAULT 0,
    deadline        DATE,
    created_at      TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month, year);
