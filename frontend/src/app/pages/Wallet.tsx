import { useState, useMemo } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useWallets, setPrimaryWallet, deleteWallet } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah, cn, textColorVar, bgColorVar } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { WalletOnboardingModal } from '../components/WalletOnboardingModal';
import { WalletCard } from '@/components/features/wallets/WalletCard';
import { useTransactionEventStore } from '@/stores/transactionEventStore';
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
  const lastAddedTransaction = useTransactionEventStore((s) => s.lastAddedTransaction);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Refetch wallets when transaction is added
  useMemo(() => {
    if (lastAddedTransaction) {
      refetch();
    }
  }, [lastAddedTransaction, refetch]);

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
          {/* Hero Balance Card */}
          <Card className={cn('overflow-hidden', bgColorVar('brand-primary-light'))}>
            <CardContent className="p-6 space-y-3">
              <p className={cn('text-sm font-medium uppercase tracking-wide', textColorVar('content-tertiary'))}>
                Total Saldo Semua Dompet
              </p>
              <p className="text-4xl font-bold font-mono text-[var(--color-content-primary)]">
                <PrivacyAmount value={formatRupiah(wallets.reduce((sum, w) => sum + estimatedBalance(w, transactions), 0))} />
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className={cn('text-xs', textColorVar('content-tertiary'))}>Dompet Aktif</span>
                  <p className={cn('font-semibold', textColorVar('content-primary'))}>{wallets.length}</p>
                </div>
                <div>
                  <span className={cn('text-xs', textColorVar('content-tertiary'))}>Dompet Utama</span>
                  <p className={cn('font-semibold truncate', textColorVar('content-primary'))}>
                    {wallets.find((w) => w.is_primary)?.name || '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Cards Grid */}
          <div>
            <h2 className={cn('text-sm font-semibold mb-4', textColorVar('content-primary'))}>
              Daftar Dompet Anda
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wallets.map((wallet) => {
                const balance = estimatedBalance(wallet, transactions);
                return (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    balance={balance}
                    isPrimary={wallet.is_primary || false}
                    transactions={transactions}
                    onSetPrimary={handleSetPrimary}
                    onDelete={handleDelete}
                  />
                );
              })}
            </div>
          </div>

          {/* Quick Action */}
          <div>
            <Button onClick={() => setModalOpen(true)} variant="outline" className="w-full h-11 gap-2">
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
