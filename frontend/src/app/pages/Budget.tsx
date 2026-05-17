import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Edit, Plus, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useBudgets, upsertBudget } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { getCategoryMeta, ALL_CATEGORIES } from '@/lib/categoryMetadata';
import { formatRupiah } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import type { CSSProperties } from 'react';

type BudgetStatus = 'safe' | 'warning' | 'over' | 'none';

function getStatus(pct: number): BudgetStatus {
  if (pct > 100) return 'over';
  if (pct >= 80) return 'warning';
  return 'safe';
}

function StatusBadge({ status }: { status: BudgetStatus }) {
  if (status === 'none')
    return (
      <Badge className="bg-gray-100 text-gray-500 gap-1">
        Belum Dibuat
      </Badge>
    );
  if (status === 'over')
    return (
      <Badge className="bg-red-100 text-red-700 gap-1">
        <AlertCircle className="w-3 h-3" /> Melebihi
      </Badge>
    );
  if (status === 'warning')
    return (
      <Badge className="bg-yellow-100 text-yellow-700 gap-1">
        <AlertTriangle className="w-3 h-3" /> Hampir
      </Badge>
    );
  return (
    <Badge className="bg-green-100 text-green-700 gap-1">
      <CheckCircle className="w-3 h-3" /> Aman
    </Badge>
  );
}

export default function Budget() {
  const { month, year } = useMonthFilter();
  const { user } = useAuth();
  const { budgets, isLoading: budgetsLoading, refetch } = useBudgets(month, year);
  const { transactions, isLoading: txLoading } = useTransactions(month, year);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const spendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
      });
    return map;
  }, [transactions]);

  // Build merged list: all CATEGORY_META cats + any extra spending cats
  const allCats = useMemo(() => {
    const extra = Object.keys(spendingMap).filter(
      (c) => !ALL_CATEGORIES.includes(c) && c !== 'Food' && c !== 'Bills',
    );
    return [...ALL_CATEGORIES, ...extra];
  }, [spendingMap]);

  const budgetRows = useMemo(() => {
    return allCats
      .map((cat) => {
        const budgetEntry = budgets.find((b) => b.category === cat);
        const hasEntry = budgetEntry !== undefined;
        const budgetAmt = budgetEntry?.amount ?? 0;
        const spent = spendingMap[cat] ?? 0;
        const pct = budgetAmt > 0 ? (spent / budgetAmt) * 100 : 0;
        return {
          category: cat,
          budget: budgetAmt,
          spent,
          pct,
          hasEntry,
          status: hasEntry ? getStatus(pct) : ('none' as const),
          ...getCategoryMeta(cat),
        };
      })
      .sort((a, b) => {
        if (a.hasEntry && !b.hasEntry) return -1;
        if (!a.hasEntry && b.hasEntry) return 1;
        return b.spent - a.spent;
      });
  }, [allCats, budgets, spendingMap]);

  const totalBudget = budgetRows.reduce((s, r) => s + r.budget, 0);
  const totalUsed = budgetRows.reduce((s, r) => s + r.spent, 0);
  const remaining = totalBudget - totalUsed;
  const safeCount = budgetRows.filter((r) => r.hasEntry && r.status === 'safe').length;

  const openEdit = (category: string, currentAmount: number) => {
    setEditCategory(category);
    setEditAmount(currentAmount > 0 ? String(currentAmount) : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    const amt = parseInt(editAmount.replace(/\D/g, ''), 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Jumlah budget tidak valid');
      return;
    }
    setSaving(true);
    const { error } = await upsertBudget(user.userId, editCategory, amt, month, year);
    setSaving(false);
    if (error) {
      toast.error('Gagal menyimpan budget');
    } else {
      toast.success(`Budget ${editCategory} berhasil disimpan`);
      setDialogOpen(false);
      refetch();
    }
  };

  const isLoading = budgetsLoading || txLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-4 bg-muted rounded animate-pulse w-20 mb-3" />
                <div className="h-7 bg-muted rounded animate-pulse w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Budget', value: formatRupiah(totalBudget), color: 'text-foreground', isAmount: true },
          { label: 'Total Terpakai', value: formatRupiah(totalUsed), color: 'text-orange-600', isAmount: true },
          {
            label: 'Sisa Budget',
            value: formatRupiah(Math.max(remaining, 0)),
            color: remaining >= 0 ? 'text-green-600' : 'text-red-600',
            isAmount: true,
          },
          { label: 'Kategori Aman', value: `${safeCount} kategori`, color: 'text-green-600', isAmount: false },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-['DM_Mono'] font-bold text-xl ${kpi.color}`}>
                {kpi.isAmount ? <PrivacyAmount value={kpi.value} /> : kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget per Kategori</CardTitle>
          <Button
            size="sm"
            onClick={() => openEdit('', 0)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" /> Tambah Budget
          </Button>
        </CardHeader>
        <CardContent>
          {budgetRows.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground text-sm">Belum ada budget yang ditetapkan</p>
              <Button onClick={() => openEdit('Food & Dining', 0)} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Buat Budget Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {budgetRows.map((row) => (
                <div key={row.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{row.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold">{row.category}</p>
                        <p className="text-xs text-muted-foreground font-['DM_Mono']">
                          <PrivacyAmount value={formatRupiah(row.spent)} />
                          {row.budget > 0 && <> / <PrivacyAmount value={formatRupiah(row.budget)} /></>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={row.status} />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => openEdit(row.category, row.budget)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {row.hasEntry ? (
                    <>
                      <Progress
                        value={Math.min(row.pct, 100)}
                        className="h-2"
                        style={
                          {
                            '--progress-background':
                              row.status === 'over'
                                ? '#ef4444'
                                : row.status === 'warning'
                                  ? '#f59e0b'
                                  : row.color,
                          } as CSSProperties
                        }
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Terpakai: <PrivacyAmount value={formatRupiah(row.spent)} /></span>
                        <span>{row.pct.toFixed(0)}%</span>
                      </div>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-xs h-7"
                      onClick={() => openEdit(row.category, 0)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Buat Budget
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Budget Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? `Edit Budget: ${editCategory}` : 'Tambah Budget'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!editCategory && (
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Pilih kategori...</option>
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {getCategoryMeta(c).emoji} {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Jumlah Budget (Rp)</Label>
              <Input
                type="number"
                placeholder="cth. 500000"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || !editCategory}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
