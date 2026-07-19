-- Add ledger_entries table
CREATE TABLE ledger_entries (
    id               UUID PRIMARY KEY,
    account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    transaction_id   UUID REFERENCES transactions(id) ON DELETE SET NULL,
    type             VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount           NUMERIC NOT NULL CHECK (amount >= 0),
    starting_balance NUMERIC NOT NULL,
    ending_balance   NUMERIC NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX idx_ledger_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX idx_ledger_created_at ON ledger_entries(account_id, created_at);

-- Add voided_at column to transactions
ALTER TABLE transactions ADD COLUMN voided_at TIMESTAMPTZ NULL;
CREATE INDEX idx_transactions_voided ON transactions(voided_at) WHERE voided_at IS NOT NULL;
