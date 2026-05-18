import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoals } from '@/hooks/useGoals';
import { useGoalProgress } from '@/hooks/data/useGoalProgress';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';

export default function GoalProgress() {
  const { month, year } = useMonthFilter();
  const { transactions, loading: transLoading } = useTransactions(month, year);
  const { goals, isLoading: goalsLoading } = useGoals();
  const goalProgress = useGoalProgress(goals, transactions, month, year);

  const loading = transLoading || goalsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Target className="w-16 h-16 text-gray-300" />
        <p className="text-lg font-semibold text-gray-600">Belum ada target tabungan</p>
        <p className="text-sm text-gray-500">Buat goal di halaman Goals untuk mulai tracking</p>
      </div>
    );
  }

  // Prepare chart data from monthly history of first goal (as aggregate trend)
  const chartData =
    goalProgress.goals.length > 0
      ? goalProgress.goals[0].monthlyHistory.map((amount, idx) => ({
          month: ['3 bulan lalu', '2 bulan lalu', '1 bulan lalu'][idx] || 'Bulan ini',
          savings: amount,
        }))
      : [];

  const statusColors = {
    'on-track': { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-700', icon: CheckCircle2 },
    'at-risk': { bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', text: 'text-yellow-700', icon: AlertTriangle },
    delayed: { bg: 'from-red-50 to-red-100', border: 'border-red-200', text: 'text-red-700', icon: AlertTriangle },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="w-8 h-8" />
          Tujuan Tabungan
        </h1>
        <p className="text-gray-600 mt-1">Tracking progress tabungan dan proyeksi pencapaian</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 font-medium">Total Target</p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            Rp{goalProgress.totalSavingsTarget.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-blue-700 mt-1">{goalProgress.goals.length} tujuan</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 font-medium">Total Tersimpan</p>
          <p className="text-2xl font-bold text-green-900 mt-2">
            Rp{goalProgress.totalSaved.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-green-700 mt-1">{goalProgress.totalProgress}% tercapai</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-600 font-medium">Rata-rata Tabungan/Bulan</p>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            Rp{goalProgress.avgMonthlyRate.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-purple-700 mt-1">3 bulan terakhir</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
          <p className="text-sm text-indigo-600 font-medium">Status Tujuan</p>
          <div className="flex gap-3 mt-3">
            <div className="text-center">
              <p className="text-xl font-bold text-green-700">{goalProgress.goalsOnTrack}</p>
              <p className="text-xs text-indigo-600">Tepat Waktu</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-yellow-700">{goalProgress.goalsAtRisk}</p>
              <p className="text-xs text-indigo-600">Berisiko</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-red-700">{goalProgress.goalsDelayed}</p>
              <p className="text-xs text-indigo-600">Terlambat</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Progress Keseluruhan</h2>
          <span className="text-sm font-medium text-gray-600">{goalProgress.totalProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
            style={{ width: `${goalProgress.totalProgress}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Rp{goalProgress.totalSaved.toLocaleString('id-ID')} dari Rp{goalProgress.totalSavingsTarget.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Savings Trend Chart */}
      {chartData.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Tren Tabungan Bulanan</h2>
          <div className="p-4 bg-white border rounded-lg">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={createCompactAxisFormatter()} />
                <Tooltip formatter={(value) => `Rp${value.toLocaleString('id-ID')}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="savings"
                  stroke="#10b981"
                  dot={{ fill: '#10b981' }}
                  name="Tabungan"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Individual Goals */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detail Tujuan</h2>

        {goalProgress.goals.map((goal) => {
          const colors = statusColors[goal.status];
          const StatusIcon = colors.icon;
          const isCompleted = goal.progressPercent >= 100;
          const daysText = isCompleted
            ? '✅ Selesai'
            : goal.status === 'delayed'
              ? `⏰ ${goal.daysUntilDeadline} hari`
              : goal.status === 'at-risk'
                ? `⚠️ ${goal.daysUntilDeadline} hari`
                : `✓ ${goal.daysUntilDeadline} hari`;

          return (
            <div key={goal.id} className={`p-4 border rounded-lg bg-gradient-to-br ${colors.bg} ${colors.border}`}>
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                  <p className={`text-sm ${colors.text} font-medium flex items-center gap-1 mt-1`}>
                    <StatusIcon className="w-4 h-4" />
                    {goal.status === 'on-track'
                      ? 'Tepat Waktu'
                      : goal.status === 'at-risk'
                        ? 'Berisiko Terlambat'
                        : 'Terlambat'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{goal.progressPercent}%</p>
                  <p className="text-xs text-gray-600">{daysText}</p>
                </div>
              </div>

              {/* Main Progress Bar */}
              <div className="space-y-2 mb-4">
                <div className="w-full bg-gray-300 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      isCompleted
                        ? 'bg-green-500'
                        : goal.status === 'delayed'
                          ? 'bg-red-500'
                          : goal.status === 'at-risk'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, goal.progressPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">
                    Rp{goal.savedAmount.toLocaleString('id-ID')}
                  </span>
                  <span className="text-gray-600">Rp{goal.targetAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="bg-white bg-opacity-60 p-2 rounded">
                  <p className="text-gray-600 text-xs">Deadline</p>
                  <p className="font-semibold text-gray-900">{goal.deadline}</p>
                </div>
                <div className="bg-white bg-opacity-60 p-2 rounded">
                  <p className="text-gray-600 text-xs">Proyeksi Selesai</p>
                  <p className="font-semibold text-gray-900">{goal.projectedDateFormatted}</p>
                </div>
                <div className="bg-white bg-opacity-60 p-2 rounded">
                  <p className="text-gray-600 text-xs">Tabungan/Bulan</p>
                  <p className="font-semibold text-gray-900">Rp{goal.monthlyRate.toLocaleString('id-ID')}</p>
                </div>
                <div className="bg-white bg-opacity-60 p-2 rounded">
                  <p className="text-gray-600 text-xs">Bulan Tersisa</p>
                  <p className="font-semibold text-gray-900">{goal.monthsRemaining} bulan</p>
                </div>
              </div>

              {/* Acceleration Needed (if at-risk or delayed) */}
              {goal.accelerationNeeded > 0 && (
                <div className="bg-white bg-opacity-70 p-3 rounded mb-4 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      +Rp{goal.accelerationNeeded.toLocaleString('id-ID')}/bulan diperlukan
                    </p>
                    <p className="text-xs text-gray-600">
                      ({goal.accelerationPercent}% lebih tinggi dari pace saat ini)
                    </p>
                  </div>
                </div>
              )}

              {/* Milestones */}
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">Milestone</p>
                <div className="space-y-2">
                  {goal.milestones.map((milestone) => (
                    <div key={milestone.percent} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-medium ${milestone.achieved ? 'text-green-700' : 'text-gray-600'}`}>
                            {milestone.percent}% (Rp{milestone.amount.toLocaleString('id-ID')})
                          </span>
                          <span className="text-gray-500">{milestone.targetMonth}</span>
                        </div>
                        <div className="w-full bg-gray-300 rounded h-2">
                          <div
                            className={`h-2 rounded transition-all ${
                              milestone.achieved ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                            style={{
                              width: `${milestone.achieved ? 100 : Math.min(100, (goal.savedAmount / milestone.amount) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      {milestone.achieved && <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              {goal.insights.length > 0 && (
                <div className="space-y-2">
                  {goal.insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-white bg-opacity-70 rounded text-sm">
                      <span className="flex-shrink-0">💡</span>
                      <span className="text-gray-800">{insight}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          <strong>💡 Tips:</strong> Milestone dihitung berdasarkan pace tabungan saat ini. Jika Anda butuh mempercepat,
          tingkatkan tabungan bulanan Anda sesuai saran "Acceleration Needed".
        </p>
      </div>
    </div>
  );
}
