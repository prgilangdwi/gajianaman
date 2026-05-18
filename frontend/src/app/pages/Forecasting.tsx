import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useExpenseForecasting } from '@/hooks/data/useExpenseForecasting';

export default function Forecasting() {
  const { month, year } = useMonthFilter();
  const { transactions, loading } = useTransactions(month, year);
  const forecast = useExpenseForecasting(transactions, month, year);

  const chartData = forecast.categoryForecasts.slice(0, 10).map((cat) => ({
    name: cat.category.length > 15 ? cat.category.slice(0, 12) + '...' : cat.category,
    predicted: cat.predicted,
    historical: cat.historical[0],
  }));

  const varianceColor =
    forecast.currentVsProjected.variance > 0
      ? 'from-red-50 to-red-100'
      : 'from-green-50 to-green-100';
  const varianceBorder =
    forecast.currentVsProjected.variance > 0 ? 'border-red-200' : 'border-green-200';
  const varianceText =
    forecast.currentVsProjected.variance > 0 ? 'text-red-700' : 'text-green-700';

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
          <TrendingUp className="w-8 h-8" />
          Prakiraan Pengeluaran
        </h1>
        <p className="text-gray-600 mt-1">Prediksi pengeluaran berdasarkan tren 3 bulan</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Target Bulan Depan</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            Rp{forecast.nextMonthForecast.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-blue-700 mt-1">Berdasarkan rata-rata 3 bulan</p>
        </div>

        <div className={`p-4 bg-gradient-to-br ${varianceColor} rounded-lg border ${varianceBorder}`}>
          <p className={`text-sm font-medium ${varianceText}`}>Status Bulan Ini</p>
          <p className={`text-2xl font-bold ${varianceText} mt-2`}>
            Rp{Math.abs(forecast.currentVsProjected.variance).toLocaleString('id-ID')}
          </p>
          <p className={`text-xs ${varianceText} mt-1`}>
            {forecast.currentVsProjected.variance > 0 ? '↑' : '↓'} {Math.abs(forecast.currentVsProjected.variancePercent)}% dari target
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Budget Harian</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            Rp{forecast.currentPacing.dailyBudget.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-purple-700 mt-1">
            Pengeluaran saat ini: Rp{forecast.currentPacing.currentDailyRate.toLocaleString('id-ID')}/hari
          </p>
        </div>
      </div>

      {/* Pacing Progress */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Progress Bulan Ini</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Hari</span>
              <span className="text-sm text-gray-600">
                {forecast.currentPacing.daysPassed} / {forecast.currentPacing.daysInMonth} hari
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${forecast.currentPacing.percentMonthComplete}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Pengeluaran</span>
              <span className="text-sm text-gray-600">
                Rp{forecast.currentVsProjected.currentMonthTotal.toLocaleString('id-ID')} / Rp
                {forecast.currentVsProjected.projectedMonthTotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  forecast.currentVsProjected.variance > 0 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (forecast.currentVsProjected.currentMonthTotal /
                      forecast.currentVsProjected.projectedMonthTotal) *
                      100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            {forecast.currentPacing.onTrack ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-700">✅ Pengeluaran sesuai target</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-sm text-orange-700">
                  ⚠️ Pengeluaran {forecast.currentVsProjected.variance > 0 ? 'di atas' : 'di bawah'} target
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      {forecast.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Info className="w-5 h-5" />
            Insight
          </h2>
          {forecast.insights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* Category Forecast Chart */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Prakiraan Kategori (Top 10)</h2>
        <div className="p-4 bg-white border rounded-lg">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value) => `Rp${value.toLocaleString('id-ID')}`} />
              <Legend />
              <Bar dataKey="predicted" fill="#3b82f6" name="Prakiraan" />
              <Bar dataKey="historical" fill="#10b981" name="Bulan Lalu" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Details */}
        <div className="space-y-2">
          {forecast.categoryForecasts.slice(0, 5).map((cat) => (
            <div key={cat.category} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{cat.category}</span>
                <div className="flex items-center gap-2">
                  {cat.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                  {cat.trend === 'down' && (
                    <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />
                  )}
                  {cat.trend === 'stable' && <span className="text-sm text-gray-600">→</span>}
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      cat.confidence === 'high'
                        ? 'bg-green-100 text-green-700'
                        : cat.confidence === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {cat.confidence === 'high'
                      ? 'High'
                      : cat.confidence === 'medium'
                        ? 'Medium'
                        : 'Low'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Prakiraan</p>
                  <p className="font-medium">Rp{cat.predicted.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Bulan Lalu</p>
                  <p className="font-medium">Rp{cat.historical[0].toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tren</p>
                  <p className="font-medium text-center">{cat.trend === 'up' ? '📈' : cat.trend === 'down' ? '📉' : '→'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>💡 Tips:</strong> Prakiraan ini berdasarkan pola 3 bulan terakhir. Semakin konsisten
          pengeluaran Anda, semakin akurat prakiraan. Confidence level menunjukkan seberapa andal prediksi
          untuk kategori tersebut.
        </p>
      </div>
    </div>
  );
}
