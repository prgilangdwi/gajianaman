import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Star, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { formatRupiah, cn, textColorVar, bgColorVar } from '@/lib/utils';
import type { Wallet, Transaction } from '@/lib/supabase';

interface WalletCardProps {
  wallet: Wallet;
  balance: number;
  isPrimary: boolean;
  transactions: Transaction[];
  onSetPrimary: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}

/**
 * WalletCard — Individual wallet display card
 * Shows balance, type, transaction count, and quick actions
 * Touch-optimized for mobile-first interaction (≥44px buttons)
 *
 * @phase Phase 08 — Wallet & Financial Tools System
 */
export function WalletCard({
  wallet,
  balance,
  isPrimary,
  transactions,
  onSetPrimary,
  onDelete,
}: WalletCardProps) {
  const walletTxCount = transactions.filter((t) => t.wallet_id === wallet.id).length;
  const walletIncome = transactions
    .filter((t) => t.wallet_id === wallet.id && t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const walletExpense = transactions
    .filter((t) => t.wallet_id === wallet.id && t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200',
      isPrimary ? `border-2 border-[var(--color-brand-primary)]` : ''
    )}>
      <div className={cn(
        'p-4 space-y-4',
        isPrimary ? bgColorVar('brand-primary-light') : ''
      )}>
        {/* Header: Name + Primary Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={cn('text-lg font-semibold truncate', textColorVar('content-primary'))}>
              {wallet.name}
            </h3>
            <p className={cn('text-xs mt-1', textColorVar('content-tertiary'))}>
              {wallet.type === 'bank' ? '🏦 Bank Account' : wallet.type === 'cash' ? '💵 Tunai' : '💳 Kartu'}
            </p>
          </div>
          {isPrimary && (
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[var(--color-brand-primary)]">
              <Star className="w-4 h-4 text-[var(--color-brand-primary-fg)] fill-current" />
            </div>
          )}
        </div>

        {/* Balance Display (Hero Metric) */}
        <div className="space-y-1">
          <p className={cn('text-xs font-medium uppercase tracking-wide', textColorVar('content-tertiary'))}>
            Saldo Saat Ini
          </p>
          <p className="text-2xl font-semibold font-mono text-[var(--color-content-primary)]">
            {formatRupiah(balance)}
          </p>
        </div>

        {/* Transaction Summary */}
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-1">
            <ArrowDownLeft className="w-4 h-4 text-[var(--color-sentiment-positive)]" />
            <span className={cn('font-medium', textColorVar('sentiment-positive'))}>
              {formatRupiah(walletIncome)}
            </span>
          </div>
          <div className="text-xs text-[var(--color-content-tertiary)]">
            {walletTxCount} transaksi
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4 text-[var(--color-sentiment-negative)]" />
            <span className={cn('font-medium', textColorVar('sentiment-negative'))}>
              {formatRupiah(walletExpense)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {!isPrimary && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSetPrimary(wallet)}
              className="flex-1 h-10"
            >
              <Star className="w-4 h-4 mr-1" />
              Utamakan
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(wallet)}
            className="h-10 text-[var(--color-sentiment-negative)]"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
