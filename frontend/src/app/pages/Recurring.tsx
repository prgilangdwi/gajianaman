import { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringTransactions } from '@/hooks/data/useRecurringTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { Check, X, AlertCircle, TrendingDown } from 'lucide-react';
import type { RecurringTransaction } from '@/lib/supabase';

export default function RecurringPage() {
  const { month, year } = useMonthFilter();
  const { transactions, loading } = useTransactions(month, year);
  const detected = useRecurringTransactions(transactions);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());

  const recurringTransactions = useMemo(() => {
    return detected.map((r) => ({
      ...r,
      isConfirmed: confirmed.has(r.id),
    }));
  }, [detected, confirmed]);

  const confirmedTotal = useMemo(() => {
    return recurringTransactions
      .filter((r) => r.isConfirmed)
      .reduce((sum, r) => sum + r.amount, 0);
  }, [recurringTransactions]);

  const toggleConfirm = (id: string) => {
    const newSet = new Set(confirmed);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setConfirmed(newSet);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  if (detected.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transaksi Berulang</h1>
          <p className="text-gray-600 mt-1">Identifikasi biaya berulang otomatis</p>
        </div>

        <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-blue-600" />
          <p className="text-blue-800 font-medium">Tidak ada transaksi berulang terdeteksi</p>
          <p className="text-blue-700 text-sm mt-2">
            Perlu minimal 2 transaksi dengan jumlah dan kategori sama untuk deteksi
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Transaksi Berulang</h1>
        <p className="text-gray-600 mt-1">Identifikasi biaya berulang otomatis</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Terdeteksi</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">
            Rp{recurringTransactions
              .reduce((sum, r) => sum + r.amount, 0)
              .toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-blue-700 mt-1">{recurringTransactions.length} pengeluaran</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">Dikonfirmasi</p>
          <p className="text-2xl font-bold text-green-900 mt-1">
            Rp{confirmedTotal.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-green-700 mt-1">{confirmed.size} pengeluaran</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-600 font-medium">Belum Dikonfirmasi</p>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            Rp
            {(recurringTransactions.reduce((sum, r) => sum + r.amount, 0) - confirmedTotal).toLocaleString(
              'id-ID',
            )}
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            {recurringTransactions.length - confirmed.size} pengeluaran
          </p>
        </div>
      </div>

      {/* Recurring Transactions List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-gray-600" />
          Pengeluaran Berulang
        </h2>

        {recurringTransactions.map((recurring) => (
          <div
            key={recurring.id}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleConfirm(recurring.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                      recurring.isConfirmed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {recurring.isConfirmed && <Check className="w-4 h-4 text-white" />}
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900">{recurring.category}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {recurring.note || 'Transaksi berulang'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  Rp{recurring.amount.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {recurring.frequency === 'weekly'
                    ? 'Mingguan'
                    : recurring.frequency === 'biweekly'
                      ? 'Dua minggu'
                      : 'Bulanan'}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Hari dalam bulan</p>
                <p className="font-medium text-gray-900">{recurring.dayOfMonth}</p>
              </div>
              <div>
                <p className="text-gray-600">Kejadian</p>
                <p className="font-medium text-gray-900">{recurring.transactionCount}x</p>
              </div>
              <div>
                <p className="text-gray-600">Terakhir</p>
                <p className="font-medium text-gray-900">
                  {new Date(recurring.lastOccurrence).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Keyakinan</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      recurring.confidence === 'high'
                        ? 'bg-green-500'
                        : recurring.confidence === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                    }`}
                  />
                  <span className="font-medium text-gray-900">
                    {recurring.confidence === 'high'
                      ? 'Tinggi'
                      : recurring.confidence === 'medium'
                        ? 'Sedang'
                        : 'Rendah'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-sm text-indigo-700">
          💡 <strong>Tip:</strong> Konfirmasi transaksi berulang untuk mengecualikannya dari anomali
          pengeluaran dan membantu sistem memberikan rekomendasi yang lebih akurat.
        </p>
      </div>
    </div>
  );
}
