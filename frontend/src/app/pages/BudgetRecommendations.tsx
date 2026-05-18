import { useState } from 'react';
import { Lightbulb, TrendingUp, TrendingDown, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useBudgetRecommendations } from '@/hooks/data/useBudgetRecommendations';

export default function BudgetRecommendations() {
  const { month, year } = useMonthFilter();
  const { transactions, loading: txLoading } = useTransactions(month, year);
  const { budgets, loading: budgetLoading } = useBudgets(month, year);
  const recommendations = useBudgetRecommendations(transactions, budgets, month, year);
  const [appliedRecommendations, setAppliedRecommendations] = useState<Set<string>>(new Set());

  const loading = txLoading || budgetLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  const criticalCount = recommendations.filter((r) => r.priority === 'critical').length;
  const highCount = recommendations.filter((r) => r.priority === 'high').length;
  const potentialSavings = recommendations
    .filter((r) => !r.isIncrease)
    .reduce((sum, r) => sum + (r.currentBudget - r.suggestedBudget), 0);

  const handleApply = (category: string) => {
    const newSet = new Set(appliedRecommendations);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setAppliedRecommendations(newSet);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Lightbulb className="w-8 h-8 text-yellow-500" />
          Rekomendasi Budget
        </h1>
        <p className="text-gray-600 mt-1">Saran perubahan budget berdasarkan pola pengeluaran</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600 font-medium">Kritis</p>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-2">{criticalCount}</p>
          <p className="text-xs text-red-700 mt-1">kategori perlu penyesuaian segera</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-orange-600 font-medium">Tinggi</p>
          </div>
          <p className="text-2xl font-bold text-orange-900 mt-2">{highCount}</p>
          <p className="text-xs text-orange-700 mt-1">rekomendasi untuk dipertimbangkan</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-600 font-medium">Potensi Hemat</p>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-2">
            Rp{potentialSavings.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-green-700 mt-1">jika semua rekomendasi diterapkan</p>
        </div>
      </div>

      {/* No Recommendations */}
      {recommendations.length === 0 && (
        <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-3 text-blue-600" />
          <p className="text-blue-800 font-medium">Budget Anda sudah optimal!</p>
          <p className="text-blue-700 text-sm mt-2">
            Pengeluaran sesuai dengan budget yang telah ditetapkan
          </p>
        </div>
      )}

      {/* Recommendations List */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Rekomendasi Rinci</h2>

          {recommendations.map((rec) => (
            <div
              key={rec.category}
              className={`p-4 border rounded-lg transition-all ${
                rec.priority === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : rec.priority === 'high'
                    ? 'bg-orange-50 border-orange-200'
                    : rec.priority === 'medium'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{rec.category}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        rec.priority === 'critical'
                          ? 'bg-red-200 text-red-900'
                          : rec.priority === 'high'
                            ? 'bg-orange-200 text-orange-900'
                            : rec.priority === 'medium'
                              ? 'bg-yellow-200 text-yellow-900'
                              : 'bg-blue-200 text-blue-900'
                      }`}
                    >
                      {rec.priority === 'critical'
                        ? 'Kritis'
                        : rec.priority === 'high'
                          ? 'Tinggi'
                          : rec.priority === 'medium'
                            ? 'Sedang'
                            : 'Rendah'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{rec.reason}</p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Pengeluaran Rata-rata</p>
                      <p className="font-medium text-gray-900">
                        Rp{rec.avgSpending.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Budget Saat Ini</p>
                      <p className="font-medium text-gray-900">
                        {rec.currentBudget ? `Rp${rec.currentBudget.toLocaleString('id-ID')}` : 'Tidak ada'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Saran Budget</p>
                      <p className="font-medium text-gray-900">
                        Rp{rec.suggestedBudget.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Perbedaan</p>
                      <p className={`font-medium ${rec.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {rec.variance > 0 ? '+' : ''}{rec.variance}%
                      </p>
                    </div>
                  </div>

                  {/* Impact */}
                  <div className="flex items-start gap-2 p-3 bg-white bg-opacity-50 rounded border border-current border-opacity-10">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{rec.impact}</p>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => handleApply(rec.category)}
                  className={`flex-shrink-0 px-4 py-2 rounded font-medium transition-colors whitespace-nowrap ${
                    appliedRecommendations.has(rec.category)
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {appliedRecommendations.has(rec.category) ? '✓ Diterapkan' : 'Terapkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
        <p className="text-sm text-indigo-700">
          <strong>💡 Cara Kerja:</strong> Rekomendasi didasarkan pada analisis pengeluaran 3 bulan
          terakhir. Sistem membandingkan pengeluaran aktual dengan budget yang ditetapkan dan
          rata-rata historis.
        </p>
        <p className="text-sm text-indigo-700">
          <strong>⚠️ Catatan:</strong> Perubahan budget akan membantu Anda mengelola keuangan dengan
          lebih baik. Periksa rekomendasi secara berkala seiring perubahan pola pengeluaran.
        </p>
      </div>
    </div>
  );
}
