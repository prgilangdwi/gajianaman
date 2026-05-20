import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import { Edit, Plus, CheckCircle, AlertCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useBudgets, upsertBudget } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { getCategoryMeta, ALL_CATEGORIES } from '@/lib/categoryMetadata';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TextPositive, TextNegative, TextWarning } from '../components/Markup';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

type BudgetStatus = 'safe' | 'warning' | 'over' | 'none';

function getStatus(pct: number): BudgetStatus {
  if (pct > 100) return 'over';
  if (pct >= 80) return 'warning';
  return 'safe';
}

function StatusBadge({ status }: { status: BudgetStatus }) {
  const statusConfig = {
    none: {
      bg: bgColorVar('bg-neutral'),
      text: textColorVar('content-tertiary'),
      icon: null,
      label: 'Belum Dibuat',
    },
    over: {
      bg: bgColorVar('sentiment-negative-bg'),
      text: textColorVar('sentiment-negative'),
      icon: AlertCircle,
      label: 'Melebihi',
    },
    warning: {
      bg: bgColorVar('sentiment-warning-bg'),
      text: textColorVar('sentiment-warning'),
      icon: AlertTriangle,
      label: 'Hampir',
    },
    safe: {
      bg: bgColorVar('sentiment-positive-bg'),
      text: textColorVar('sentiment-positive'),
      icon: CheckCircle,
      label: 'Aman',
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
      config.bg,
      config.text
    )}>
      {IconComponent && <IconComponent className="w-3 h-3" />}
      {config.label}
    </div>
  );
}

export default function Budget() {
  const { month, year } = useMonthFilter();
  const { user } = useAuth();
  const { budgets, isLoading: budgetsLoading, refetch } = useBudgets(month, year);
  const { transactions, isLoading: txLoading } = useTransactions(month, year);
  const prefersReduced = useReducedMotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  const spendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + Number(t.amount);
      });
    return map;
  }, [transactions]);

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

  const handleGetAITips = async () => {
    if (showTips) {
      setShowTips(false);
      return;
    }

    setShowTips(true);
    setTipsLoading(true);

    try {
      const budgetSummary = budgetRows
        .filter((r) => r.hasEntry)
        .map((r) => `${r.category}: Rp${r.budget} (terpakai ${r.pct.toFixed(0)}%)`)
        .join(', ');

      const response = await fetch('/api/budget-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetData: budgetSummary,
          totalBudget,
          totalUsed,
          month,
          year,
        }),
      });

      if (!response.ok) throw new Error('Failed to get tips');

      const data = await response.json();
      setAiTips(data.tips || []);
    } catch (error) {
      toast.error('Gagal memuat saran AI');
      setAiTips([]);
      console.error('Error:', error);
    } finally {
      setTipsLoading(false);
    }
  };

  const isLoading = budgetsLoading || txLoading;

  if (isLoading) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
              <CardContent className="pt-6">
                <div className={cn('h-4 rounded animate-pulse w-20 mb-3', bgColorVar('bg-neutral'))} />
                <div className={cn('h-7 rounded animate-pulse w-28', bgColorVar('bg-neutral'))} />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-6 space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn('h-16 rounded animate-pulse', bgColorVar('bg-neutral'))} />
            ))}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-6"
    >
      {/* Summary KPIs */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: prefersReduced ? 0 : 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
      >
        {[
          {
            label: 'Total Budget',
            value: formatRupiah(totalBudget),
            component: 'default',
          },
          {
            label: 'Total Terpakai',
            value: formatRupiah(totalUsed),
            component: totalUsed > totalBudget * 0.8 ? 'warning' : 'default',
          },
          {
            label: 'Sisa Budget',
            value: formatRupiah(Math.max(remaining, 0)),
            component: remaining >= 0 ? 'positive' : 'negative',
          },
          {
            label: 'Kategori Aman',
            value: `${safeCount} kategori`,
            component: 'default',
          },
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
            animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
            transition={fadeUp.transition}
          >
            <Card className={cn(bgColorVar("bg-card"), borderColorVar("border-neutral"))}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-lg md:text-xl font-bold">
                  {kpi.component === 'positive' ? (
                    <TextPositive>
                      <PrivacyAmount value={kpi.value} />
                    </TextPositive>
                  ) : kpi.component === 'negative' ? (
                    <TextNegative>
                      <PrivacyAmount value={kpi.value} />
                    </TextNegative>
                  ) : kpi.component === 'warning' ? (
                    <TextWarning>
                      <PrivacyAmount value={kpi.value} />
                    </TextWarning>
                  ) : (
                    <span className="text-[var(--color-content-primary)]">
                      <PrivacyAmount value={kpi.value} />
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Budget Cards */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
      >
        <Card className={cn(bgColorVar("bg-card"), borderColorVar("border-neutral"))}>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold text-[var(--color-content-primary)]">
              Budget per Kategori
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showTips ? 'default' : 'outline'}
                onClick={handleGetAITips}
                disabled={tipsLoading}
                className="gap-1 text-xs"
              >
                <Sparkles className="w-4 h-4" /> Saran AI
              </Button>
              <Button
                size="sm"
                onClick={() => openEdit('', 0)}
                className="gap-1 text-xs"
              >
                <Plus className="w-4 h-4" /> Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {budgetRows.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-sm text-[var(--color-content-tertiary)]">Belum ada budget yang ditetapkan</p>
                <Button onClick={() => openEdit('Food & Dining', 0)} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Buat Budget Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <AnimatePresence>
                  {budgetRows.map((row, idx) => (
                    <motion.div
                      key={row.category}
                      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      transition={{ delay: prefersReduced ? 0 : idx * 0.05 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg flex-shrink-0">{row.emoji}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-content-primary)]">{row.category}</p>
                            <p className="text-xs text-[var(--color-content-tertiary)] font-mono">
                              <PrivacyAmount value={formatRupiah(row.spent)} />
                              {row.budget > 0 && (
                                <> / <PrivacyAmount value={formatRupiah(row.budget)} /></>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
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
                          <div
                            className="w-full h-2 bg-[var(--color-bg-neutral)] rounded-full overflow-hidden"
                          >
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                row.status === 'over'
                                  ? 'bg-[var(--color-sentiment-negative)]'
                                  : row.status === 'warning'
                                    ? 'bg-[var(--color-sentiment-warning)]'
                                    : 'bg-[var(--color-sentiment-positive)]'
                              )}
                              style={{ width: `${Math.min(row.pct, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-[var(--color-content-tertiary)]">
                            <span>Terpakai: <PrivacyAmount value={formatRupiah(row.spent)} /></span>
                            <span>{row.pct.toFixed(0)}%</span>
                          </div>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-7"
                          onClick={() => openEdit(row.category, 0)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Buat Budget
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Budget Tips Panel */}
      <AnimatePresence>
        {showTips && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-[var(--color-bg-card)] border border-[var(--color-sentiment-warning-bg)]">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-[var(--color-content-primary)]">
                  <Sparkles className="w-5 h-5 text-[var(--color-sentiment-warning)]" />
                  Saran AI untuk Anggaran Anda
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tipsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin">⏳</div>
                  </div>
                ) : aiTips.length > 0 ? (
                  <ul className="space-y-3">
                    {aiTips.map((tip, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="font-bold text-[var(--color-sentiment-warning)] flex-shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="text-[var(--color-content-secondary)]">{tip}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[var(--color-content-tertiary)]">
                    Tidak ada saran AI tersedia saat ini.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

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
                  className="w-full px-3 py-2 rounded-lg border bg-[var(--color-bg-screen)] text-[var(--color-content-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
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
    </motion.div>
  );
}
