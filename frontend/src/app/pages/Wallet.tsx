import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Plus, Star, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useWallets, setPrimaryWallet, deleteWallet } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { WalletOnboardingModal } from '../components/WalletOnboardingModal';
import { COPY } from '@/lib/copy';
import type { Wallet, Transaction } from '@/lib/supabase';

function estimatedBalance(wallet: Wallet, transactions: Transaction[]): number {
  const walletTx = transactions.filter((t) => t.wallet_id === wallet.id);
  const income = walletTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = walletTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  return Number(wallet.initial_balance) + income - expense;
}

export default function WalletPage() {
  const { user } = useAuth();
  const { month, year } = useMonthFilter();
  const { wallets, isLoading, refetch } = useWallets(user?.userId);
  const { transactions } = useTransactions(month, year);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSetPrimary = async (wallet: Wallet) => {
    if (!user) return;
    const { error } = await setPrimaryWallet(wallet.id, user.userId);
    if (error) { toast.error(error); return; }
    toast.success(`${wallet.name} dijadikan wallet utama`);
    refetch();
  };

  const handleDelete = async (wallet: Wallet) => {
    if (!confirm(`Hapus wallet "${wallet.name}"? Transaksi yang sudah ada tidak akan terhapus.`)) return;
    setDeleting(wallet.id);
    const { error } = await deleteWallet(wallet.id);
    setDeleting(null);
    if (error) { toast.error('Gagal menghapus: ' + error); return; }
    toast.success(`Wallet "${wallet.name}" dihapus`);
    refetch();
  };

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded-xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dompet</h1>
          <p className="text-sm text-muted-foreground">Kelola sumber dana kamu</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Wallet
        </Button>
      </div>

      {wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <WalletIcon className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground text-center">{COPY.emptyStates.wallets}</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Wallet Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => {
            const balance = estimatedBalance(wallet, transactions);
            return (
              <Card key={wallet.id} className="relative">
                {wallet.is_primary && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-yellow-100 text-yellow-700 gap-1 text-xs">
                      <Star className="w-3 h-3 fill-yellow-500" />
                      Utama
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                      {wallet.icon ?? (wallet.type === 'bank' ? '🏦' : wallet.type === 'ewallet' ? '💳' : '💵')}
                    </div>
                    <div>
                      <CardTitle className="text-base">{wallet.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimasi saldo</p>
                    <p className="font-mono font-bold text-lg">
                      <PrivacyAmount value={formatRupiah(balance)} />
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!wallet.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleSetPrimary(wallet)}
                      >
                        Jadikan Utama
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(wallet)}
                      disabled={deleting === wallet.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {user && (
        <WalletOnboardingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={refetch}
          userId={user.userId}
          isPrimary={wallets.length === 0}
        />
      )}
    </div>
  );
}
