import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { createWallet } from '@/hooks/useWallets';
import { COPY } from '@/lib/copy';

const QUICK_WALLETS = [
  { name: 'BCA',        type: 'bank' as const,    icon: '🏦' },
  { name: 'Mandiri',    type: 'bank' as const,    icon: '🏦' },
  { name: 'BRI',        type: 'bank' as const,    icon: '🏦' },
  { name: 'BNI',        type: 'bank' as const,    icon: '🏦' },
  { name: 'GoPay',      type: 'ewallet' as const, icon: '💚' },
  { name: 'OVO',        type: 'ewallet' as const, icon: '💜' },
  { name: 'Dana',       type: 'ewallet' as const, icon: '💙' },
  { name: 'ShopeePay',  type: 'ewallet' as const, icon: '🧡' },
  { name: 'Cash',       type: 'cash' as const,    icon: '💵' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  userId: number;
  isPrimary?: boolean;
}

export function WalletOnboardingModal({ isOpen, onClose, onSaved, userId, isPrimary = false }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [saving, setSaving] = useState(false);

  const walletName = selected === 'Lainnya' ? customName.trim() : selected ?? '';

  const handleSave = async () => {
    if (!walletName) { toast.error('Pilih atau masukkan nama wallet'); return; }
    setSaving(true);
    const walletType = QUICK_WALLETS.find((w) => w.name === selected)?.type ?? 'bank';
    const balance = parseInt(initialBalance.replace(/\D/g, ''), 10) || 0;
    const { error } = await createWallet(userId, walletName, walletType, isPrimary, balance);
    setSaving(false);
    if (error) { toast.error(error); return; }
    toast.success(COPY.success.walletCreated);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Tambah Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Pilih sumber dana kamu:</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_WALLETS.map((w) => (
              <button
                type="button"
                key={w.name}
                onClick={() => setSelected(w.name)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  selected === w.name
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{w.icon}</span>
                {w.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelected('Lainnya')}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                selected === 'Lainnya'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">➕</span>
              Lainnya
            </button>
          </div>

          {selected === 'Lainnya' && (
            <div className="space-y-1">
              <Label>Nama Wallet</Label>
              <Input
                placeholder="Nama wallet kustom..."
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Saldo awal (opsional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
              <Input
                className="pl-10"
                placeholder="0"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSave} disabled={saving || !walletName}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
