import { useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useSpendingPatterns } from '@/hooks/data/useSpendingPatterns';

export default function SpendingPatterns() {
  const { month, year } = useMonthFilter();
  const { transactions, loading } = useTransactions(month, year);
  const patterns = useSpendingPatterns(transactions, month, year);

  const weeklyChartData = useMemo(() => {
    return patterns.weeklyPatterns.map((w) => ({
      week: `Minggu ${w.week}`,
      spending: w.spending,
      avgDaily: w.avgDaily,
    }));
  }, [patterns.weeklyPatterns]);

  const dailyChartData = useMemo(() => {
    return patterns.dailyPatterns.slice(0, 20).map((d) => ({
      day: `${d.day}`,
      spending: d.spending,
      transactions: d.transactionCount,
    }));
  }, [patterns.dailyPatterns]);

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
          <Calendar className="w-8 h-8" />
          Pola Pengeluaran Waktu
        </h1>
        <p className="text-gray-600 mt-1">Analisis kapan Anda paling banyak belanja</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Rata-rata Harian</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            Rp{patterns.averageDailySpend.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-blue-700 mt-1">per hari</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
          <p className="text-sm text-red-600 font-medium">Hari Pengeluaran Tertinggi</p>
          <p className="text-lg font-bold text-red-900 mt-2">{patterns.peakDay}</p>
          <p className="text-xs text-red-700 mt-1">
            Rp{patterns.peakDayAmount.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Hari Paling Aktif</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">{patterns.mostActiveDay}</p>
          <p className="text-xs text-purple-700 mt-1">Transaksi terbanyak</p>
        </div>
      </div>

      {/* Insights */}
      {patterns.insights.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Insight
          </h2>
          {patterns.insights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
              {insight}
            </div>
          ))}
        </div>
      )}

      {/* Weekly Chart */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Pengeluaran Per Minggu</h2>
        <div className="p-4 bg-white border rounded-lg">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip formatter={(value) => `Rp${value.toLocaleString('id-ID')}`} />
              <Legend />
              <Bar dataKey="spending" fill="#3b82f6" name="Total Minggu" />
              <Bar dataKey="avgDaily" fill="#10b981" name="Rata-rata Harian" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Breakdown */}
        <div className="space-y-2">
          {patterns.weeklyPatterns.map((week) => (
            <div key={week.week} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Minggu {week.week}</span>
                <div className="flex items-center gap-2">
                  {week.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                  {week.trend === 'down' && <TrendingUp className="w-4 h-4 text-green-500 rotate-180" />}
                  <span className="text-sm text-gray-600">{week.trend}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-medium">Rp{week.spending.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Rata-rata/Hari</p>
                  <p className="font-medium">Rp{week.avgDaily.toLocaleString('id-ID')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Transaksi</p>
                  <p className="font-medium">{week.transactionCount}x</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Chart (first 20 days) */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Pengeluaran Harian (20 hari pertama)</h2>
        <div className="p-4 bg-white border rounded-lg">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `Rp${value.toLocaleString('id-ID')}`} />
              <Legend />
              <Line type="monotone" dataKey="spending" stroke="#ef4444" name="Pengeluaran" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Breakdown Grid */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Detail Harian</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {patterns.dailyPatterns.map((day) => (
            <div
              key={day.day}
              className={`p-3 rounded-lg border text-center ${
                day.spending > patterns.averageDailySpend * 1.2
                  ? 'bg-red-50 border-red-200'
                  : day.spending < patterns.averageDailySpend * 0.5
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <p className="font-medium text-gray-900">{day.day}</p>
              <p className="text-xs text-gray-600">{day.dayName.slice(0, 3)}</p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                Rp{(day.spending / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-gray-500">{day.transactionCount} tx</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <p className="text-sm text-indigo-700">
          <strong>💡 Tip:</strong> Pahami pola pengeluaran Anda untuk perencanaan budget yang lebih baik.
          Hindari belanja pada hari-hari dengan pengeluaran tertinggi, atau alokasikan budget lebih besar untuk hari-hari tersebut.
        </p>
      </div>
    </div>
  );
}
