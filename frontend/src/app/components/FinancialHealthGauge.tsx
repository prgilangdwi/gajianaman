import { Info } from 'lucide-react';
import type { HealthScore } from '@/hooks/data/useFinancialHealthScore';

interface FinancialHealthGaugeProps {
  score: HealthScore;
}

export function FinancialHealthGauge({ score }: FinancialHealthGaugeProps) {
  const getColorClass = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'from-green-400 to-green-600';
      case 'good':
        return 'from-blue-400 to-blue-600';
      case 'fair':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-red-400 to-red-600';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'excellent':
        return 'Sangat Baik';
      case 'good':
        return 'Baik';
      case 'fair':
        return 'Cukup';
      default:
        return 'Perlu Perbaikan';
    }
  };

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score.score / 100) * circumference;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Gauge */}
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gaugeGradient">
                <stop offset="0%" stopColor={score.level === 'excellent' ? '#10b981' : score.level === 'good' ? '#3b82f6' : score.level === 'fair' ? '#f59e0b' : '#ef4444'} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${getColorClass(score.level)} bg-clip-text text-transparent`}>
              {score.score}
            </div>
            <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Skor Kesehatan</div>
          </div>
        </div>

        <div className="text-center">
          <p className={`text-base sm:text-lg font-semibold`}>
            {getLevelLabel(score.level)}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Status keuangan Anda {score.level === 'excellent' ? '✨' : score.level === 'good' ? '👍' : score.level === 'fair' ? '💡' : '⚠️'}
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <p className="text-xs text-green-700 font-medium">Rasio Tabungan</p>
          <p className="text-base sm:text-lg font-bold text-green-900 mt-1">{score.breakdown.savingsRatio}%</p>
          <p className="text-[10px] sm:text-xs text-green-600 mt-1">30% bobot</p>
        </div>

        <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <p className="text-xs text-blue-700 font-medium">Disiplin Anggaran</p>
          <p className="text-base sm:text-lg font-bold text-blue-900 mt-1">{score.breakdown.budgetDiscipline}%</p>
          <p className="text-[10px] sm:text-xs text-blue-600 mt-1">25% bobot</p>
        </div>

        <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <p className="text-xs text-purple-700 font-medium">Runway Darurat</p>
          <p className="text-base sm:text-lg font-bold text-purple-900 mt-1">{score.breakdown.emergencyRunway}%</p>
          <p className="text-[10px] sm:text-xs text-purple-600 mt-1">20% bobot</p>
        </div>

        <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
          <p className="text-xs text-amber-700 font-medium">Konsistensi Arus Kas</p>
          <p className="text-base sm:text-lg font-bold text-amber-900 mt-1">{score.breakdown.cashflowConsistency}%</p>
          <p className="text-[10px] sm:text-xs text-amber-600 mt-1">10% bobot</p>
        </div>
      </div>

      {/* Help Text */}
      <div className="flex gap-2 p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] sm:text-xs text-blue-700 leading-relaxed">
          Skor kesehatan finansial Anda berdasarkan rasio tabungan, disiplin anggaran, dana darurat, dan konsistensi arus kas.
        </p>
      </div>
    </div>
  );
}
