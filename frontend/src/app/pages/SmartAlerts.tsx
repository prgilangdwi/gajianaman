import { useMemo } from 'react';
import { AlertCircle, TrendingUp, Clock, Target } from 'lucide-react';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useInsights } from '@/hooks/data/useInsights';

export default function SmartAlerts() {
  const { month, year } = useMonthFilter();
  const { transactions, loading } = useTransactions(month, year);
  const { anomalies, velocities, hasEnoughData } = useInsights(transactions, month, year);

  const noAlerts = useMemo(() => {
    return anomalies.length === 0 && velocities.every((v) => v.riskLevel === 'safe');
  }, [anomalies, velocities]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
        <p className="text-yellow-800">Perlu minimal 10 transaksi untuk analisis smart alerts</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Smart Alerts</h1>
        <p className="text-gray-600 mt-1">Anomali pengeluaran & peringatan budget</p>
      </div>

      {/* No Alerts State */}
      {noAlerts && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg text-center">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-green-800 font-medium">Semua baik! Tidak ada anomali terdeteksi</p>
          <p className="text-green-700 text-sm mt-1">Pengeluaran Anda sesuai dengan pola historis</p>
        </div>
      )}

      {/* Spending Anomalies */}
      {anomalies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold">Anomali Pengeluaran ({anomalies.length})</h2>
          </div>

          {anomalies.map((anom) => (
            <div
              key={anom.category}
              className={`p-4 rounded-lg border ${
                anom.severity === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{anom.category}</h3>
                  <p
                    className={`text-sm mt-1 ${
                      anom.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'
                    }`}
                  >
                    {anom.reason}
                  </p>
                  <div className="flex gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Saat ini: </span>
                      <span className="font-medium text-gray-900">
                        Rp{anom.currentSpent.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ekspektasi: </span>
                      <span className="font-medium text-gray-900">
                        Rp{anom.expectedSpend.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold ${
                      anom.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
                    }`}
                  >
                    +{anom.deviationPercent}%
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    +Rp{anom.deviation.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Velocity Warnings */}
      {velocities.some((v) => v.riskLevel !== 'safe') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">
              Peringatan Budget ({velocities.filter((v) => v.riskLevel !== 'safe').length})
            </h2>
          </div>

          {velocities
            .filter((v) => v.riskLevel !== 'safe')
            .map((vel) => (
              <div
                key={vel.category}
                className={`p-4 rounded-lg border ${
                  vel.riskLevel === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{vel.category}</h3>
                  <span
                    className={`text-sm font-medium px-2 py-1 rounded ${
                      vel.riskLevel === 'critical'
                        ? 'bg-red-200 text-red-900'
                        : 'bg-yellow-200 text-yellow-900'
                    }`}
                  >
                    {vel.riskLevel === 'critical' ? 'Kritis' : 'Peringatan'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">
                      Rp{vel.currentSpent.toLocaleString('id-ID')} / Rp
                      {vel.monthlyBudget.toLocaleString('id-ID')}
                    </span>
                    <span className="font-medium">{vel.percentUsed}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        vel.riskLevel === 'critical' ? 'bg-red-600' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(vel.percentUsed, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    ETA {vel.projectedETA} hari — {vel.daysRemaining} hari tersisa bulan ini
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* All Budget Status */}
      {!noAlerts && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Status Budget Aman
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {velocities
              .filter((v) => v.riskLevel === 'safe')
              .map((vel) => (
                <div key={vel.category} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">{vel.category}</h4>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {vel.percentUsed}% dari Rp{vel.monthlyBudget.toLocaleString('id-ID')}
                    </span>
                    <span className="text-green-700 font-medium">✓ Aman</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
