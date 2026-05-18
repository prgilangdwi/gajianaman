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
      {/* Premium Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">💳 Dompet Saya</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola semua sumber dana dan akun keuangan Anda</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2 flex-shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>

      {wallets.length === 0 ? (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex flex-col items-center gap-6 py-16 px-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl">
              💼
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold">Belum Ada Wallet</h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                Buat wallet pertama Anda untuk mulai mencatat transaksi dari berbagai sumber dana
              </p>
            </div>
            <Button onClick={() => setModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Buat Wallet Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Wallet Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  <PrivacyAmount value={formatRupiah(wallets.reduce((sum, w) => sum + estimatedBalance(w, transactions), 0))} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{wallets.length} wallet aktif</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Wallet Utama</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">
                  {wallets.find((w) => w.is_primary)?.name || '—'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">untuk transaksi default</p>
              </CardContent>
            </Card>
          </div>

          {/* Wallet Cards Grid */}
          <div>
            <h2 className="text-sm font-semibold mb-4">Daftar Dompet</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wallets.map((wallet) => {
                const balance = estimatedBalance(wallet, transactions);
                return (
                  <Card key={wallet.id} className={`relative ${wallet.is_primary ? 'border-2 border-primary' : ''}`}>
                    {wallet.is_primary && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-primary/20 text-primary gap-1 text-xs">
                          <Star className="w-3 h-3 fill-primary" />
                          Utama
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                          {wallet.icon ?? (wallet.type === 'bank' ? '🏦' : wallet.type === 'ewallet' ? '💳' : '💵')}
                        </div>
                        <div>
                          <CardTitle className="text-base">{wallet.name}</CardTitle>
                          <p className="text-xs text-muted-foreground capitalize">{wallet.type}</p>
                        </div>
                      </div>
                    </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Estimasi Saldo</p>
                    <p className="font-mono font-bold text-xl">
                      <PrivacyAmount value={formatRupiah(balance)} />
                    </p>
                  </div>
                  <div className="border-t pt-3 flex gap-2">
                    {!wallet.is_primary && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSetPrimary(wallet)}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Jadikan Utama
                      </Button>
                    )}
                    {wallet.is_primary && (
                      <div className="flex-1 text-center">
                        <p className="text-xs text-muted-foreground">Wallet Utama</p>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                      onClick={() => handleDelete(wallet)}
                      disabled={deleting === wallet.id}
                      title="Hapus wallet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Action */}
          <div>
            <Button onClick={() => setModalOpen(true)} variant="outline" className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Tambah Wallet Baru
            </Button>
          </div>
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
