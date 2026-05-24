import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type { RecurringTransaction } from '@/lib/supabase';

export function useRecurringBills() {
  const { user } = useAuth();
  const [recurringBills, setRecurringBills] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchRecurringBills = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', user.userId)
          .eq('is_active', true)
          .order('next_due_date', { ascending: true });

        if (cancelled) return;
        if (fetchError) throw fetchError;

        setRecurringBills(data || []);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch recurring bills');
          setRecurringBills([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchRecurringBills();
    return () => { cancelled = true; };
  }, [user]);

  const createRecurringBill = async (bill: Omit<RecurringTransaction, 'id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error: insertError } = await supabase
        .from('recurring_transactions')
        .insert([{ ...bill, user_id: user?.userId }])
        .select()
        .single();

      if (insertError) throw insertError;

      setRecurringBills([...recurringBills, data]);
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create recurring bill');
    }
  };

  const updateRecurringBill = async (id: string, updates: Partial<RecurringTransaction>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('recurring_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setRecurringBills(recurringBills.map((b) => (b.id === id ? data : b)));
      return data;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update recurring bill');
    }
  };

  const deleteRecurringBill = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setRecurringBills(recurringBills.filter((b) => b.id !== id));
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete recurring bill');
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      // Update last occurrence and calculate next due date
      const bill = recurringBills.find((b) => b.id === id);
      if (!bill) throw new Error('Bill not found');

      const today = new Date();
      const nextDueDate = calculateNextDueDate(bill, today);

      await updateRecurringBill(id, {
        last_occurrence: today.toISOString(),
        next_due_date: nextDueDate.toISOString(),
      });

      // Create transaction record
      await supabase.from('transactions').insert([
        {
          user_id: user?.user_id,
          amount: bill.amount,
          type: bill.type,
          category: bill.category_id,
          note: bill.description || `Recurring: ${bill.description}`,
          date: today.toISOString().split('T')[0],
          wallet_id: bill.wallet_id,
          ai_confidence: 1,
        },
      ]);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to mark bill as paid');
    }
  };

  return {
    recurringBills,
    isLoading,
    error,
    createRecurringBill,
    updateRecurringBill,
    deleteRecurringBill,
    markAsPaid,
  };
}

function calculateNextDueDate(bill: RecurringTransaction, from: Date): Date {
  const next = new Date(from);

  switch (bill.frequency) {
    case 'weekly':
      next.setDate(next.getDate() + (bill.frequency_interval || 1) * 7);
      break;
    case 'monthly':
      const dueDay = bill.due_date_of_month || 1;
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      const adjustedDay = Math.min(dueDay, daysInMonth);

      next.setMonth(next.getMonth() + (bill.frequency_interval || 1));
      next.setDate(adjustedDay);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + (bill.frequency_interval || 1));
      break;
    default:
      next.setDate(next.getDate() + (bill.frequency_interval || 1));
  }

  return next;
}
