import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import { Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { RecurringTransaction } from '@/lib/supabase';

interface RecurringBillFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (bill: Omit<RecurringTransaction, 'id' | 'created_at'>) => Promise<void>;
  wallets: Array<{ id: string; name: string }>;
  initialData?: RecurringTransaction;
  isLoading?: boolean;
}

export function RecurringBillForm({
  isOpen,
  onClose,
  onSubmit,
  wallets,
  initialData,
  isLoading = false,
}: RecurringBillFormProps) {
  const [formData, setFormData] = useState<Omit<RecurringTransaction, 'id' | 'created_at'>>({
    user_id: 0,
    category_id: undefined,
    amount: 0,
    type: 'expense',
    description: '',
    due_date_of_month: 1,
    frequency: 'monthly',
    frequency_interval: 1,
    wallet_id: wallets[0]?.id,
    is_active: true,
    reminder_enabled: true,
    reminder_days_before: 1,
    last_occurrence: undefined,
    next_due_date: undefined,
    ...(initialData || {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      toast.error('Lengkapi semua field yang diperlukan');
      return;
    }

    try {
      await onSubmit(formData);
      toast.success(initialData ? 'Tagihan diperbarui' : 'Tagihan dibuat');
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan tagihan');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Tagihan' : 'Tambah Tagihan Berulang'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              placeholder="Listrik, Internet, dll"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label>Tipe</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'expense' | 'income' })}
                />
                <span>Pengeluaran</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'expense' | 'income' })}
                />
                <span>Pemasukan</span>
              </label>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frekuensi</Label>
              <select
                id="frequency"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm min-h-[44px]"
              >
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>

            {/* Due Date (for monthly) */}
            {formData.frequency === 'monthly' && (
              <div className="space-y-2">
                <Label htmlFor="dueDate">Tanggal Jatuh Tempo</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    id="dueDate"
                    type="number"
                    min="1"
                    max="28"
                    placeholder="1-28"
                    value={formData.due_date_of_month || 1}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date_of_month: Number(e.target.value) })
                    }
                    className="flex-1 min-h-[44px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Wallet */}
          {wallets.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet</Label>
              <select
                id="wallet"
                value={formData.wallet_id || ''}
                onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reminders */}
          <div className="space-y-3 border-t pt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={formData.reminder_enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, reminder_enabled: checked as boolean })
                }
              />
              <span className="text-sm">Aktifkan reminder</span>
            </label>

            {formData.reminder_enabled && (
              <div className="flex items-center gap-2 ml-6">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  max="30"
                  value={formData.reminder_days_before || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, reminder_days_before: Number(e.target.value) })
                  }
                  className="w-20 text-sm"
                />
                <span className="text-sm text-muted-foreground">hari sebelum jatuh tempo</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Buat Tagihan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
