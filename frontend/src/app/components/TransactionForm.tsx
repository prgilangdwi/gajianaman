import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { TagInput } from './TagInput';
import type { TransactionFormState } from '@/hooks/useTransactionForm';
import type { Wallet, Category } from '@/lib/supabase';

const defaultExpenseCategories = [
  { id: 'Food & Dining', emoji: '🍔', label: 'Food', color: '#f59e0b' },
  { id: 'Transport', emoji: '🚗', label: 'Transport', color: '#3b82f6' },
  { id: 'Groceries', emoji: '🛒', label: 'Groceries', color: '#4AE54A' },
  { id: 'Shopping', emoji: '🛍️', label: 'Shopping', color: '#ec4899' },
  { id: 'Bills & Utilities', emoji: '📱', label: 'Bills', color: '#8b5cf6' },
  { id: 'Health', emoji: '🏥', label: 'Health', color: '#ef4444' },
  { id: 'Entertainment', emoji: '🎬', label: 'Entertain', color: '#f97316' },
  { id: 'Education', emoji: '📚', label: 'Education', color: '#06b6d4' },
];

const defaultSavingsCategories = [
  { id: 'Savings', emoji: '🏦', label: 'Savings', color: '#10b981' },
  { id: 'Investment', emoji: '📈', label: 'Investment', color: '#3b82f6' },
  { id: 'Emergency Fund', emoji: '🚨', label: 'Emergency', color: '#f59e0b' },
];

interface DisplayCategory {
  id: string;
  emoji: string;
  label: string;
  color?: string;
}

interface TransactionFormProps {
  form: TransactionFormState;
  onAmountChange: (amount: string) => void;
  onCategoryChange: (category: string) => void;
  onNoteChange: (note: string) => void;
  onTypeChange: (type: TransactionFormState['type']) => void;
  onDateChange: (date: string) => void;
  onSourceWalletChange?: (id: string | null) => void;
  onDestinationWalletChange?: (id: string | null) => void;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  wallets?: Wallet[];
  tagSuggestions?: string[];
  showType?: boolean;
  showDate?: boolean;
  showWallet?: boolean;
  sourceWalletLabel?: string;
  destinationWalletLabel?: string;
  expenseCategories?: DisplayCategory[];
  incomeCategories?: DisplayCategory[];
  savingsCategories?: DisplayCategory[];
}

export function TransactionForm({
  form,
  onAmountChange,
  onCategoryChange,
  onNoteChange,
  onTypeChange,
  onDateChange,
  onSourceWalletChange,
  onDestinationWalletChange,
  onAddTag,
  onRemoveTag,
  wallets = [],
  tagSuggestions = [],
  showType = true,
  showDate = true,
  showWallet = false,
  sourceWalletLabel = 'Dari wallet (opsional)',
  destinationWalletLabel = 'Ke wallet',
  expenseCategories = defaultExpenseCategories,
  incomeCategories = defaultExpenseCategories,
  savingsCategories = defaultSavingsCategories,
}: TransactionFormProps) {
  const isSavingsType = form.type === 'savings';
  const isTransferType = form.type === 'transfer';
  const visibleCategories = isSavingsType ? savingsCategories : (form.type === 'income' ? incomeCategories : expenseCategories);

  return (
    <div className="space-y-6">
      {/* Type Picker */}
      {showType && (
        <div className="space-y-2">
          <Label>Tipe Transaksi</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              type="button"
              variant={form.type === 'expense' ? 'default' : 'outline'}
              className="h-9"
              onClick={() => onTypeChange('expense')}
            >
              Keluar
            </Button>
            <Button
              type="button"
              variant={form.type === 'income' ? 'default' : 'outline'}
              className="h-9"
              onClick={() => onTypeChange('income')}
            >
              Masuk
            </Button>
            <Button
              type="button"
              variant={form.type === 'savings' ? 'default' : 'outline'}
              className="h-9"
              onClick={() => onTypeChange('savings')}
            >
              Tabung
            </Button>
            <Button
              type="button"
              variant={form.type === 'transfer' ? 'default' : 'outline'}
              className="h-9"
              onClick={() => onTypeChange('transfer')}
            >
              Transfer
            </Button>
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="space-y-2">
        <Label>Jumlah</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono font-semibold text-muted-foreground">
            Rp
          </span>
          <Input
            type="text"
            placeholder="0"
            className="pl-16 text-3xl font-mono font-bold h-16"
            value={form.amount ? Number(form.amount).toLocaleString('id-ID') : ''}
            onChange={(e) => onAmountChange(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>

      {/* Category Picker */}
      {!isTransferType && (
        <div className="space-y-2">
          <Label>Kategori</Label>
          <div className="grid grid-cols-4 gap-2">
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                  form.category === cat.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[9px] font-medium text-center leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transfer-specific fields */}
      {isTransferType && wallets.length > 0 && (
        <>
          <div className="space-y-2">
            <Label>{sourceWalletLabel}</Label>
            <select
              value={form.sourceWalletId ?? ''}
              onChange={(e) => onSourceWalletChange?.(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Pilih wallet sumber…</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.is_primary ? ' ⭐' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>{destinationWalletLabel}</Label>
            <select
              value={form.destinationWalletId ?? ''}
              onChange={(e) => onDestinationWalletChange?.(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Pilih wallet tujuan…</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{w.is_primary ? ' ⭐' : ''}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* Note Input */}
      <div className="space-y-2">
        <Label>Catatan (opsional)</Label>
        <Input
          placeholder="Tambahan informasi..."
          value={form.note}
          onChange={(e) => onNoteChange(e.target.value)}
        />
      </div>

      {/* Tags Input */}
      {onAddTag && onRemoveTag && (
        <div className="space-y-2">
          <Label>Tag (opsional)</Label>
          <TagInput
            tags={form.tags}
            onAddTag={onAddTag}
            onRemoveTag={onRemoveTag}
            suggestions={tagSuggestions}
          />
        </div>
      )}

      {/* Date Picker */}
      {showDate && (
        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input type="date" value={form.date} onChange={(e) => onDateChange(e.target.value)} />
        </div>
      )}

      {/* Optional wallet selector for expenses/income */}
      {showWallet && !isTransferType && wallets.length > 0 && (
        <div className="space-y-2">
          <Label>Dari wallet mana? (opsional)</Label>
          <select
            value={form.sourceWalletId ?? ''}
            onChange={(e) => onSourceWalletChange?.(e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border bg-input text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Pilih wallet…</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}{w.is_primary ? ' ⭐' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
