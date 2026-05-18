import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Search, Trash2, Edit2 } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { getCategoryMeta } from '@/lib/categoryMetadata';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { Transaction } from '@/lib/supabase';

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  stats: {
    category: string;
    total: number;
    count: number;
    average: number;
    percentageOfTotal: number;
    transactions: Transaction[];
  } | null;
  isLoading: boolean;
  totalSpending: number;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export function CategoryDetailModal({
  isOpen,
  onClose,
  category,
  stats,
  isLoading,
  totalSpending,
  onEdit,
  onDelete,
}: CategoryDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const meta = getCategoryMeta(category);

  if (!stats) return null;

  const filteredTransactions = stats.transactions.filter((tx) =>
    (tx.note || tx.category).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return Number(b.amount) - Number(a.amount);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-2xl sm:text-3xl">{meta.emoji}</span>
            <div className="min-w-0">
              <DialogTitle className="text-lg sm:text-2xl">{category}</DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {stats.count} transaksi • {stats.percentageOfTotal.toFixed(1)}%
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="font-['DM_Mono'] font-bold text-lg">
                  {formatRupiah(stats.total)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Rata-rata</p>
                <p className="font-['DM_Mono'] font-bold text-lg">
                  {formatRupiah(stats.average)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-1">Transaksi</p>
                <p className="font-bold text-lg">{stats.count}</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 min-h-[44px] text-base"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="px-3 py-2 rounded-lg border bg-input text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
            >
              <option value="date">Tanggal ↓</option>
              <option value="amount">Jumlah ↓</option>
            </select>
          </div>

          {/* Transaction List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Memuat...</p>
            ) : sortedTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada transaksi yang cocok
              </p>
            ) : (
              sortedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.note || tx.category}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.date), 'dd MMM yyyy, HH:mm', { locale: idLocale })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <span className="font-['DM_Mono'] font-semibold text-sm">
                      {formatRupiah(Number(tx.amount))}
                    </span>
                    {(onEdit || onDelete) && (
                      <div className="flex gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(tx)}
                            className="h-7 w-7 p-0"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(tx.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
