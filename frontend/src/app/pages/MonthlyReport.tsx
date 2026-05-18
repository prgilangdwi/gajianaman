import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useFinancialHealth } from '@/hooks/data/useFinancialHealth';

export default function MonthlyReport() {
  const { month, year } = useMonthFilter();
  const { transactions, loading: txLoading } = useTransactions(month, year);
  const { budgets, loading: budgetLoading } = useBudgets(month, year);
  const health = useFinancialHealth(transactions, budgets, month, year);

  const stats = useMemo(() => {
    const expenses = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === month - 1 && d.getFullYear() === year && t.type === 'expense';
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const income = transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === month - 1 && d.getFullYear() === year && t.type === 'income';
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { expenses: Math.round(expenses), income: Math.round(income) };
  }, [transactions, month, year]);

  const loading = txLoading || budgetLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  const scoreColor =
    health.score >= 85
      ? 'from-green-500 to-emerald-600'
      : health.score >= 70
        ? 'from-blue-500 to-cyan-600'
        : health.score >= 50
          ? 'from-yellow-500 to-orange-600'
          : 'from-red-500 to-pink-600';

  const scoreTextColor =
    health.score >= 85
      ? 'text-green-600'
      : health.score >= 70
        ? 'text-blue-600'
        : health.score >= 50
          ? 'text-yellow-600'
          : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Laporan Bulanan</h1>
        <p className="text-gray-600 mt-1">Kartu skor kesehatan finansial Anda bulan ini</p>
      </div>

      {/* Health Score Card */}
      <div
        className={`bg-gradient-to-br ${scoreColor} rounded-lg p-8 text-white shadow-lg relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8" />

        <div className="relative z-10">
          <p className="text-white text-opacity-80 mb-2">Skor Kesehatan Finansial</p>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-6xl font-bold">{health.score}</div>
              <p className="text-lg mt-2 text-white text-opacity-80">Grade: {health.scoreGrade}</p>
            </div>
            <Award className="w-24 h-24 opacity-20" />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Pemasukan</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            Rp{stats.income.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-600 font-medium">Pengeluaran</p>
          <p className="text-2xl font-bold text-red-900 mt-2">
            Rp{stats.expenses.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">Tabungan</p>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {health.savingsRate.toFixed(1)}%
          </p>
          <p className="text-xs text-green-700 mt-1">
            Rp{(stats.income - stats.expenses).toLocaleString('id-ID')}
          </p>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Konsistensi</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">{health.spendingConsistency}%</p>
          <p className="text-xs text-purple-700 mt-1">Stabilitas pengeluaran</p>
        </div>
      </div>

      {/* Metrics Breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Analisis Detail</h2>

        {/* Budget Adherence */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Kepatuhan Budget</h3>
            <span className="text-2xl font-bold text-blue-600">{health.budgetAdherence}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-blue-500 transition-all"
              style={{ width: `${health.budgetAdherence}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {health.underBudgetCategories.length} kategori di bawah budget,{' '}
            {health.overBudgetCategories.length} melebihi
          </p>
        </div>

        {/* Over Budget Categories */}
        {health.overBudgetCategories.length > 0 && (
          <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">Kategori Melebihi Budget</h3>
            </div>
            <ul className="space-y-1">
              {health.overBudgetCategories.map((cat) => (
                <li key={cat} className="text-sm text-orange-800">
                  • {cat}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Under Budget Categories */}
        {health.underBudgetCategories.length > 0 && (
          <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Kategori Terjaga Budget</h3>
            </div>
            <ul className="space-y-1">
              {health.underBudgetCategories.map((cat) => (
                <li key={cat} className="text-sm text-green-800">
                  ✓ {cat}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Insight & Rekomendasi</h2>
        {health.insights.map((insight, idx) => (
          <div key={idx} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
            {insight}
          </div>
        ))}
      </div>

      {/* Action Items */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg">
        <h3 className="font-semibold mb-3">Rekomendasi Aksi</h3>
        <ul className="space-y-2 text-sm">
          {health.overBudgetCategories.length > 0 && (
            <li className="flex gap-2">
              <span>1.</span>
              <span>Tinjau kategori yang melebihi budget di halaman Smart Alerts</span>
            </li>
          )}
          {health.savingsRate < 10 && (
            <li className="flex gap-2">
              <span>2.</span>
              <span>Tingkatkan rasio tabungan dengan mengurangi pengeluaran atau meningkatkan income</span>
            </li>
          )}
          {health.spendingConsistency < 60 && (
            <li className="flex gap-2">
              <span>3.</span>
              <span>Stabilkan pola pengeluaran untuk prediksi budget lebih akurat</span>
            </li>
          )}
          {health.anomalyCount > 0 && (
            <li className="flex gap-2">
              <span>4.</span>
              <span>Periksa {health.anomalyCount} anomali pengeluaran di Smart Alerts</span>
            </li>
          )}
          {health.score < 70 && (
            <li className="flex gap-2">
              <span>5.</span>
              <span>Terapkan rekomendasi budget dari halaman Budget Tips</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
