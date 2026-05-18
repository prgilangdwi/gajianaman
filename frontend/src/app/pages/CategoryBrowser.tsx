import { useState } from 'react';
import { Link } from 'react-router';
import { TrendingUp, TrendingDown, AlertCircle, ChevronRight } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategoryIntelligence } from '@/hooks/data/useCategoryIntelligence';

export default function CategoryBrowser() {
  const { month, year } = useMonthFilter();
  const { transactions, loading: txLoading } = useTransactions(month, year);
  const { budgets, loading: budgetLoading } = useBudgets(month, year);
  const intelligence = useCategoryIntelligence(transactions, budgets, month, year);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = intelligence.categories.filter((cat) =>
    cat.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const loading = txLoading || budgetLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <AlertCircle className="w-8 h-8" />
          Kategori Pengeluaran
        </h1>
        <p className="text-gray-600 mt-1">Analisis mendalam per kategori dan merchant</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            Rp{intelligence.totalSpending.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-blue-700 mt-1">Semua kategori</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Total Budget</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            Rp{intelligence.totalBudget.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            {intelligence.budgetAdherence >= 0 ? '✅' : '⚠️'} {intelligence.budgetAdherence}%
            tersisa
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">Jumlah Kategori</p>
          <p className="text-2xl font-bold text-green-900 mt-2">{intelligence.categoryCount}</p>
          <p className="text-xs text-green-700 mt-1">Kategori aktif</p>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Cari kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <Link
            key={cat.category}
            to={`/category/${encodeURIComponent(cat.category)}`}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white hover:border-primary"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{cat.category}</h3>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Pengeluaran</p>
                  <p className="text-lg font-bold text-gray-900">
                    Rp{cat.spending.toLocaleString('id-ID')}
                  </p>
                </div>

                {cat.budget && (
                  <div>
                    <p className="text-xs text-gray-600">Budget</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Rp{cat.budget.toLocaleString('id-ID')}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          cat.variance <= 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {cat.variance > 0 ? '+' : ''}{cat.variancePercent}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <div className="flex items-center gap-1 flex-1">
                  {cat.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                  {cat.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                  {cat.trend === 'stable' && <span className="text-sm text-gray-600">→</span>}
                  <span className="text-xs text-gray-600">
                    {cat.trend === 'up'
                      ? 'Naik'
                      : cat.trend === 'down'
                        ? 'Turun'
                        : 'Stabil'}
                  </span>
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded ${
                    cat.confidence === 'high'
                      ? 'bg-green-100 text-green-700'
                      : cat.confidence === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {cat.confidence === 'high'
                    ? 'High'
                    : cat.confidence === 'medium'
                      ? 'Med'
                      : 'Low'}
                </span>
              </div>

              <div className="text-xs text-gray-500 pt-1">
                {cat.transactionCount} transaksi • Rp{cat.avgTransaction.toLocaleString('id-ID')}/tx
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Tidak ada kategori yang cocok</p>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>💡 Tips:</strong> Klik pada kategori untuk melihat detail merchant,
          trend 3 bulan, dan rekomendasi penghematan.
        </p>
      </div>
    </div>
  );
}
