import { useMemo } from 'react';
import type { Transaction } from '@/lib/supabase';

export interface TransactionFilterOptions {
  search?: string;
  type?: 'all' | 'income' | 'expense' | 'savings' | 'transfer';
  walletId?: string | null;
  tags?: Set<string>;
}

export function useFilteredTransactions(
  transactions: Transaction[],
  options: TransactionFilterOptions = {}
) {
  return useMemo(() => {
    const {
      search = '',
      type = 'all',
      walletId,
      tags = new Set(),
    } = options;

    const q = search.toLowerCase().trim();

    return transactions.filter((t) => {
      // Type filter
      const matchType = type === 'all' || t.type === type;

      // Text search filter (note, category, subcategory)
      const matchSearch =
        !q ||
        (t.note ?? '').toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.subcategory ?? '').toLowerCase().includes(q);

      // Wallet filter
      const matchWallet =
        !walletId ||
        walletId === 'all' ||
        t.wallet_id === walletId;

      // Tag filter (OR logic: match if any tag matches)
      const matchTags =
        tags.size === 0 ||
        (Array.isArray(t.tags) && t.tags.some((tag) => tags.has(tag)));

      return matchType && matchSearch && matchWallet && matchTags;
    });
  }, [transactions, options.search, options.type, options.walletId, options.tags]);
}
