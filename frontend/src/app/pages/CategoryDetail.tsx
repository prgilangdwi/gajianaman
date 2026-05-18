import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useParams } from 'react-router';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useBudgets } from '@/hooks/useBudgets';
import { useCategoryIntelligence } from '@/hooks/data/useCategoryIntelligence';

export default function CategoryDetail() {
  const { category: encodedCategory } = useParams<{ category: string }>();
  const category = encodedCategory ? decodeURIComponent(encodedCategory) : '';

  const { month, year } = useMonthFilter();
  const { transactions, loading: txLoading } = useTransactions(month, year);
  const { budgets, loading: budgetLoading } = useBudgets(month, year);
  const intelligence = useCategoryIntelligence(transactions, budgets, month, year);

  const categoryData = intelligence.categories.find((c) => c.category === category);

  if (txLoading || budgetLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  if (!categoryData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Kategori tidak ditemukan</p>
      </div>
    );
  }

  const trendChart = [
    { month: 'Bulan Lalu -2', spending: categoryData.monthlyHistory[2] },
    { month: 'Bulan Lalu -1', spending: categoryData.monthlyHistory[1] },
    { month: 'Bulan Ini', spending: categoryData.monthlyHistory[0] },
  ];

  const merchantChart = categoryData.topMerchants.map((m) => ({
    name: m.name.length > 12 ? m.name.slice(0, 10) + '..' : m.name,
    amount: m.amount,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{category}</h1>
        <p className="text-gray-600 mt-1">Detail pengeluaran dan analisis merchant</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Pengeluaran Bulan Ini</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            Rp{categoryData.spending.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-blue-700 mt-1">{categoryData.transactionCount} transaksi</p>
        </div>

        {categoryData.budget && (
          <div
            className={`p-4 rounded-lg border ${
              categoryData.variance <= 0
                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
            }`}
          >
            <p
              className={`text-sm font-medium ${
                categoryData.variance <= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              Budget
            </p>
            <p
              className={`text-2xl font-bold mt-2 ${
                categoryData.variance <= 0 ? 'text-green-900' : 'text-red-900'
              }`}
            >
              Rp{categoryData.budget.toLocaleString('id-ID')}
            </p>
            <p
              className={`text-xs mt-1 ${
                categoryData.variance <= 0 ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {categoryData.variance > 0 ? '+' : ''}{categoryData.variancePercent}%
            </p>
          </div>
        )}

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Proyeksi Akhir Bulan</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            Rp{categoryData.projectedTotal.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-purple-700 mt-1">Berdasarkan pace saat ini</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-600 font-medium">Sisa Budget</p>
          <p className="text-2xl font-bold text-orange-900 mt-2">
            {categoryData.daysRemaining > 0
              ? `Rp${categoryData.amountRemaining.toLocaleString('id-ID')}`
              : 'Bulan Berakhir'}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            {categoryData.daysRemaining} hari lagi • Rp{(
              categoryData.amountRemaining / Math.max(1, categoryData.daysRemaining)
            ).toLocaleString('id-ID')}/hari
          </p>
        </div>
      </div>

      {/* Status & Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            {categoryData.trend === 'up' && <TrendingUp className="w-5 h-5 text-red-500" />}
            {categoryData.trend === 'down' && <TrendingDown className="w-5 h-5 text-green-500" />}
            {categoryData.trend === 'stable' && <span className="text-lg">→</span>}
            Tren
          </h3>
          <p className="text-sm text-gray-600">
            {categoryData.trend === 'up'
              ? '📈 Pengeluaran naik dibanding rata-rata'
              : categoryData.trend === 'down'
                ? '📉 Pengeluaran lebih rendah dari biasanya'
                : '→ Pengeluaran stabil'}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Confidence
          </h3>
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 h-2 rounded-full ${
                categoryData.confidence === 'high'
                  ? 'bg-green-500'
                  : categoryData.confidence === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium">
              {categoryData.confidence === 'high'
                ? 'High'
                : categoryData.confidence === 'medium'
                  ? 'Medium'
                  : 'Low'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {categoryData.confidence === 'high'
              ? 'Pola pengeluaran sangat konsisten'
              : categoryData.confidence === 'medium'
                ? 'Pola pengeluaran cukup konsisten'
                : 'Pola pengeluaran bervariasi'}
          </p>
        </div>
      </div>

      {/* Insights */}
      {categoryData.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Insight</h2>
          {categoryData.insights.map((insight, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                insight.includes('⚠️') || insight.includes('💰')
                  ? 'bg-orange-50 border border-orange-200'
                  : insight.includes('✅')
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}

      {/* Trend Chart */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Tren 3 Bulan</h2>
        <div className="p-4 bg-white border rounded-lg">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `Rp${value.toLocaleString('id-ID')}`} />
              <Legend />
              <Line type="monotone" dataKey="spending" stroke="#3b82f6" name="Pengeluaran" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Merchants */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Top Merchant / Penjual</h2>
        {merchantChart.length > 0 ? (
          <>
            <div className="p-4 bg-white border rounded-lg">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={merchantChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rp${value.toLocaleString('id-ID')}`} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {categoryData.topMerchants.map((merchant) => (
                <div key={merchant.name} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{merchant.name}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {merchant.count}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm">Rp{merchant.amount.toLocaleString('id-ID')}</p>
                    <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${merchant.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium w-12 text-right">{merchant.percentage.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-gray-600 text-center py-4">Tidak ada data merchant</p>
        )}
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-600">Total Transaksi</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{categoryData.transactionCount}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-600">Rata-rata per Transaksi</p>
          <p className="text-xl font-bold text-gray-900 mt-2">
            Rp{categoryData.avgTransaction.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-xs text-gray-600">Pengeluaran Harian</p>
          <p className="text-xl font-bold text-gray-900 mt-2">
            Rp{categoryData.dailyRate.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>💡 Tips:</strong> Fokus pada merchant dengan persentase tinggi untuk peluang
          penghematan terbesar. Jika proyeksi melebihi budget, pertimbangkan untuk
          mengurangi pengeluaran di merchant tersebut atau mengalihkan ke alternatif yang lebih
          murah.
        </p>
      </div>
    </div>
  );
}
