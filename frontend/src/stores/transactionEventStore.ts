import { create } from 'zustand';
import type { Transaction } from '@/lib/supabase';

interface TransactionEventStore {
  lastAddedTransaction: Transaction | null;
  addTransaction: (transaction: Transaction) => void;
}

export const useTransactionEventStore = create<TransactionEventStore>((set) => ({
  lastAddedTransaction: null,
  addTransaction: (transaction: Transaction) => set({ lastAddedTransaction: transaction }),
}));
