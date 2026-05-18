import { AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { useGajianSetupStatus } from '@/hooks/useGajianSetupStatus';

export function GajianSetupReminder() {
  const navigate = useNavigate();
  const { isSetupComplete, setupPercentage, missingFields } = useGajianSetupStatus();

  if (isSetupComplete) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 border-l-4 border-l-amber-500">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-200 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-900 font-bold" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-amber-900">Atur Fitur Gajian</h3>
              <p className="text-sm text-amber-800 mt-1">
                Lengkapi setup Gajian Aman untuk mengelola cashflow dengan lebih aman berdasarkan tanggal gajian Anda.
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-amber-900">Setup Progress</span>
              <span className="text-amber-700">{setupPercentage}%</span>
            </div>
            <Progress value={setupPercentage} className="h-2" />
          </div>

          {/* Missing Fields */}
          {missingFields.length > 0 && (
            <div className="bg-white/50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wide">Konfigurasi yang Hilang</p>
              <ul className="space-y-1">
                {missingFields.map((field) => (
                  <li key={field} className="text-xs text-amber-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <Button
            onClick={() => navigate('/gajian')}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            Mulai Setup Gajian
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
