import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { RecurringBillForm } from '../components/RecurringBillForm';
import { Plus, Trash2, Edit2, Check, AlertCircle, Calendar, Clock } from 'lucide-react';
import { formatRupiah, cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';
import type { RecurringTransaction } from '@/lib/supabase';

export default function RecurringPage() {
  const { user } = useAuth();
  const { wallets = [] } = useWallets(user?.userId);
  const { recurringBills, isLoading, createRecurringBill, updateRecurringBill, deleteRecurringBill, markAsPaid } = useRecurringBills();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<RecurringTransaction | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid'>('all');

  // Sort bills: overdue first, then upcoming within 7 days, then rest
  const sortedBills = useMemo(() => {
    const now = new Date();
    return [...recurringBills].sort((a, b) => {
      if (!a.next_due_date || !b.next_due_date) return 0;
      const daysA = differenceInDays(new Date(a.next_due_date), now);
      const daysB = differenceInDays(new Date(b.next_due_date), now);

      // Overdue (negative days) come first
      if (daysA < 0 && daysB >= 0) return -1;
      if (daysA >= 0 && daysB < 0) return 1;
      // Both overdue or both upcoming, sort by days
      return daysA - daysB;
    });
  }, [recurringBills]);

  // Get upcoming bills within 30 days
  const upcomingBills = useMemo(() => {
    const now = new Date();
    return sortedBills.filter((bill) => {
      if (!bill.next_due_date) return false;
      const days = differenceInDays(new Date(bill.next_due_date), now);
      return days >= 0 && days <= 30;
    });
  }, [sortedBills]);

  const handleCreateOrUpdate = async (bill: Omit<RecurringTransaction, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    try {
      if (selectedBill) {
        await updateRecurringBill(selectedBill.id, bill);
        setSelectedBill(undefined);
      } else {
        await createRecurringBill(bill);
      }
      setIsFormOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan tagihan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus tagihan ini?')) {
      try {
        await deleteRecurringBill(id);
        toast.success('Tagihan dihapus');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Gagal menghapus tagihan');
      }
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await markAsPaid(id);
      toast.success('Tagihan ditandai sebagai dibayar');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mencatat pembayaran');
    }
  };

  const handleOpenForm = (bill?: RecurringTransaction) => {
    setSelectedBill(bill);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBill(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  const totalMonthly = recurringBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Tagihan</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola tagihan dan pembayaran berulang Anda</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Tagihan
        </Button>
      </div>

      {/* Status Filter Chips */}
      {recurringBills.length > 0 && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              statusFilter === 'all'
                ? 'bg-[var(--color-brand-primary)] text-white'
                : 'bg-[var(--color-bg-screen)] text-[var(--color-content-secondary)] hover:bg-[var(--color-bg-neutral)]'
            )}
          >
            Semua ({recurringBills.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              statusFilter === 'active'
                ? 'bg-[var(--color-brand-primary)] text-white'
                : 'bg-[var(--color-bg-screen)] text-[var(--color-content-secondary)] hover:bg-[var(--color-bg-neutral)]'
            )}
          >
            Belum Bayar
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {recurringBills.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Total Tagihan Bulanan</p>
              <p className="font-['DM_Mono'] font-bold text-2xl">
                {formatRupiah(totalMonthly)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{recurringBills.length} tagihan aktif</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground mb-1">Tagihan Terdekat</p>
              {recurringBills.length > 0 && recurringBills[0].next_due_date ? (
                <>
                  <p className="font-['DM_Mono'] font-bold text-lg">
                    {formatRupiah(recurringBills[0].amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {recurringBills[0].description} • {format(new Date(recurringBills[0].next_due_date), 'dd MMM yyyy', { locale: idLocale })}
                  </p>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 30-Day Upcoming Bills Timeline */}
      {upcomingBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5" />
              Tagihan 30 Hari Ke Depan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingBills.map((bill, idx) => {
                const daysUntilDue = bill.next_due_date ? differenceInDays(new Date(bill.next_due_date), new Date()) : 0;
                const isOverdue = daysUntilDue < 0;

                return (
                  <div key={bill.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-screen)]">
                    <div className="w-1 h-12 rounded-full" style={{
                      backgroundColor: isOverdue ? '#ef4444' : daysUntilDue <= 3 ? '#f97316' : '#10b981'
                    }} />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-[var(--color-content-primary)]">{bill.description}</p>
                      <p className="text-xs text-[var(--color-content-tertiary)]">
                        {isOverdue
                          ? `${Math.abs(daysUntilDue)} hari yang lalu`
                          : daysUntilDue === 0
                          ? 'Hari ini'
                          : daysUntilDue === 1
                          ? 'Besok'
                          : `${daysUntilDue} hari lagi`} • {format(new Date(bill.next_due_date || ''), 'dd MMM', { locale: idLocale })}
                      </p>
                    </div>
                    <div className="font-mono font-bold text-sm flex-shrink-0">{formatRupiah(bill.amount)}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bills List */}
      {recurringBills.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold mb-1">Belum ada tagihan berulang</p>
            <p className="text-sm text-muted-foreground mb-4">
              Mulai tambahkan tagihan berulang untuk melacak biaya tetap Anda
            </p>
            <Button onClick={() => handleOpenForm()} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" />
              Buat Tagihan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daftar Semua Tagihan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedBills.map((bill) => {
                const daysUntilDue = bill.next_due_date ? differenceInDays(new Date(bill.next_due_date), new Date()) : 0;
                const isUrgent = daysUntilDue <= 3 && daysUntilDue >= 0;
                const isOverdue = daysUntilDue < 0;

                return (
                  <div key={bill.id} className={cn(
                    'p-4 rounded-lg border transition-colors',
                    isOverdue ? 'bg-red-50/50 border-red-200' : isUrgent ? 'bg-orange-50/50 border-orange-200' : 'bg-[var(--color-bg-screen)] border-[var(--color-border-neutral)]'
                  )}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-base text-[var(--color-content-primary)]">{bill.description}</h3>
                          <Badge variant="outline" className="text-xs">
                            {bill.frequency === 'monthly' ? 'Bulanan' : bill.frequency === 'weekly' ? 'Mingguan' : 'Tahunan'}
                          </Badge>
                          {isOverdue && (
                            <Badge className="text-xs bg-red-500">Jatuh Tempo</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-content-tertiary)]">
                          <span className="font-mono font-semibold">{formatRupiah(bill.amount)}</span>
                          {bill.next_due_date && (
                            <span className={cn(
                              isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-orange-600 font-medium' : ''
                            )}>
                              {isOverdue
                                ? `${Math.abs(daysUntilDue)} hari yang lalu`
                                : daysUntilDue === 0
                                ? 'Hari ini'
                                : daysUntilDue === 1
                                ? 'Besok'
                                : `${daysUntilDue} hari lagi`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenForm(bill)}
                          className="gap-2"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(bill.id)}
                          className="gap-2"
                        >
                          <Check className="w-3 h-3" />
                          Bayar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(bill.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      <RecurringBillForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleCreateOrUpdate}
        wallets={wallets}
        initialData={selectedBill}
        isLoading={isSubmitting}
      />
    </div>
  );
}
