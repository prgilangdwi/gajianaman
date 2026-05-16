import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Wallet } from '@/lib/supabase';

export function useWallets(userId: number | undefined) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) console.error('[useWallets]', error.message);
    setWallets(data ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { wallets, isLoading, refetch: fetch };
}

export async function createWallet(
  userId: number,
  name: string,
  type: 'bank' | 'ewallet' | 'cash',
  isPrimary: boolean,
  initialBalance: number
): Promise<{ error?: string }> {
  const { error } = await supabase.from('wallets').insert({
    user_id: userId,
    name,
    type,
    is_primary: isPrimary,
    initial_balance: initialBalance,
  });
  return { error: error?.message };
}

export async function setPrimaryWallet(walletId: string, userId: number): Promise<{ error?: string }> {
  await supabase.from('wallets').update({ is_primary: false }).eq('user_id', userId);
  const { error } = await supabase.from('wallets').update({ is_primary: true }).eq('id', walletId);
  return { error: error?.message };
}

export async function deleteWallet(walletId: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('wallets').delete().eq('id', walletId);
  return { error: error?.message };
}
