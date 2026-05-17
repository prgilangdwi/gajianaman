import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';

interface ConfidenceTooltipProps {
  level: 'high' | 'medium' | 'low';
  transactionCount?: number;
}

export function ConfidenceTooltip({ level, transactionCount = 0 }: ConfidenceTooltipProps) {
  const tooltips = {
    high: {
      label: '✓ Tinggi',
      description: `Rekomendasi ini didasarkan pada ${transactionCount || '5+'} transaksi historis. Sangat reliable untuk perencanaan budget Anda.`,
    },
    medium: {
      label: '◐ Sedang',
      description: 'Data masih terbatas, tapi cukup untuk memberikan rekomendasi awal. Rekomendasi akan meningkat seiring catatan transaksi bertambah.',
    },
    low: {
      label: '○ Rendah',
      description: 'Belum ada data yang cukup untuk kategori ini. Mulai catat transaksi untuk mendapat rekomendasi yang lebih akurat.',
    },
  };

  const config = tooltips[level];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 cursor-help">
            <span className="text-xs font-medium">{config.label}</span>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          {config.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
