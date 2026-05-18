import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { useWallets } from '@/hooks/useWallets';
import { useAuth } from '@/hooks/useAuth';
import { RecurringBillForm } from '../components/RecurringBillForm';
import { Plus, Trash2, Edit2, Check, AlertCircle, Calendar } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
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
          <h1 className="text-3xl font-bold">Tagihan Berulang</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola tagihan dan pembayaran berulang Anda</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Tagihan
        </Button>
      </div>

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
        <div className="space-y-3">
          {recurringBills.map((bill) => {
            const daysUntilDue = bill.next_due_date ? differenceInDays(new Date(bill.next_due_date), new Date()) : 0;
            const isUrgent = daysUntilDue <= 3;
            const isOverdue = daysUntilDue < 0;

            return (
              <Card key={bill.id} className={isUrgent ? 'border-red-200 bg-red-50/50' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base">{bill.description}</h3>
                        <Badge variant="outline" className="text-xs">
                          {bill.frequency === 'monthly' ? 'Bulanan' : bill.frequency === 'weekly' ? 'Mingguan' : 'Tahunan'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>Rp {formatRupiah(bill.amount)}</span>
                        {bill.next_due_date && (
                          <span className={isOverdue ? 'text-red-600 font-medium' : isUrgent ? 'text-orange-600 font-medium' : ''}>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
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
