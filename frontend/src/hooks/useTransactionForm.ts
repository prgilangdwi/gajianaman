import { useState, useCallback } from 'react';

export interface TransactionFormState {
  amount: string;
  category: string;
  subcategory?: string;
  note: string;
  type: 'expense' | 'income' | 'savings' | 'transfer';
  date: string;
  sourceWalletId?: string | null;
  destinationWalletId?: string | null;
}

const initialState: TransactionFormState = {
  amount: '',
  category: '',
  subcategory: undefined,
  note: '',
  type: 'expense',
  date: new Date().toISOString().split('T')[0],
  sourceWalletId: null,
  destinationWalletId: null,
};

export function useTransactionForm(onReset?: () => void) {
  const [form, setForm] = useState<TransactionFormState>(initialState);

  const setAmount = useCallback((amount: string) => {
    setForm((prev) => ({ ...prev, amount }));
  }, []);

  const setCategory = useCallback((category: string) => {
    setForm((prev) => ({ ...prev, category }));
  }, []);

  const setSubcategory = useCallback((subcategory?: string) => {
    setForm((prev) => ({ ...prev, subcategory }));
  }, []);

  const setNote = useCallback((note: string) => {
    setForm((prev) => ({ ...prev, note }));
  }, []);

  const setType = useCallback((type: TransactionFormState['type']) => {
    setForm((prev) => ({ ...prev, type }));
  }, []);

  const setDate = useCallback((date: string) => {
    setForm((prev) => ({ ...prev, date }));
  }, []);

  const setSourceWalletId = useCallback((id: string | null) => {
    setForm((prev) => ({ ...prev, sourceWalletId: id }));
  }, []);

  const setDestinationWalletId = useCallback((id: string | null) => {
    setForm((prev) => ({ ...prev, destinationWalletId: id }));
  }, []);

  const updateFromParsed = useCallback((parsed: Partial<TransactionFormState>) => {
    setForm((prev) => ({ ...prev, ...parsed }));
  }, []);

  const reset = useCallback(() => {
    setForm(initialState);
    onReset?.();
  }, [onReset]);

  const validate = useCallback((): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!form.amount || Number(form.amount) <= 0) {
      errors.push('Jumlah harus lebih dari 0');
    }

    if (!form.category) {
      errors.push('Kategori harus dipilih');
    }

    if (form.type === 'transfer') {
      if (!form.sourceWalletId) errors.push('Wallet sumber harus dipilih');
      if (!form.destinationWalletId) errors.push('Wallet tujuan harus dipilih');
      if (form.sourceWalletId === form.destinationWalletId) {
        errors.push('Wallet sumber dan tujuan tidak boleh sama');
      }
    }

    return { valid: errors.length === 0, errors };
  }, [form]);

  return {
    form,
    setAmount,
    setCategory,
    setSubcategory,
    setNote,
    setType,
    setDate,
    setSourceWalletId,
    setDestinationWalletId,
    updateFromParsed,
    reset,
    validate,
  };
}
