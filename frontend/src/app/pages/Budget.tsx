import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Label } from '../components/ui/label';
import { useBudgets, upsertBudget } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useAuth } from '@/hooks/useAuth';
import { getCategoryMeta, ALL_CATEGORIES } from '@/lib/categoryMetadata';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TextPositive, TextNegative, TextWarning } from '../components/Markup';
import { BudgetRow } from '@/components/features/budgets/BudgetRow';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

export default function Budget() {
  const { month, year } = useMonthFilter();
  const { user } = useAuth();
  const { budgets, isLoading: budgetsLoading, refetch } = useBudgets(month, year);
  const { transactions, isLoading: txLoading } = useTransactions(month, year);
  const prefersReduced = useReducedMotion();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');
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
      .filter((cat) => budgets.some((b) => b.category === cat))
      .map((cat) => {
        const budgetEntry = budgets.find((b) => b.category === cat);
        const budgetAmt = budgetEntry?.amount ?? 0;
        const spent = spendingMap[cat] ?? 0;
        return {
          category: cat,
          budget: budgetAmt,
          spent,
          ...getCategoryMeta(cat),
        };
      })
      .sort((a, b) => b.spent - a.spent);
  }, [allCats, budgets, spendingMap]);

  const totalBudget = budgetRows.reduce((s, r) => s + r.budget, 0);
  const totalUsed = budgetRows.reduce((s, r) => s + r.spent, 0);
  const remaining = totalBudget - totalUsed;
  const safeCount = budgetRows.filter((r) => r.budget > 0 && (r.spent / r.budget) * 100 <= 80).length;

  const handleBudgetSave = async (category: string, newBudget: number) => {
    if (!user) return;
    setSaving(true);
    const { error } = await upsertBudget(user.userId, category, newBudget, month, year);
    setSaving(false);
    if (error) {
      toast.error('Gagal menyimpan budget');
    } else {
      toast.success(`Budget ${category} berhasil disimpan`);
      refetch();
    }
  };

  const handleAddBudget = async () => {
    if (!user || !newCategory.trim()) {
      toast.error('Pilih kategori');
      return;
    }
    const amt = parseInt(newAmount.replace(/\D/g, ''), 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Jumlah budget tidak valid');
      return;
    }
    setSaving(true);
    const { error } = await upsertBudget(user.userId, newCategory, amt, month, year);
    setSaving(false);
    if (error) {
      toast.error('Gagal menyimpan budget');
    } else {
      toast.success(`Budget ${newCategory} berhasil ditambahkan`);
      setShowAddDialog(false);
      setNewCategory('');
      setNewAmount('');
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
 <Sparkles className="size-4 " /> Saran AI
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddDialog(true)}
                className="gap-1 text-xs"
              >
 <Plus className="size-4 " /> Tambah
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {budgetRows.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-sm text-[var(--color-content-tertiary)]">Belum ada budget yang ditetapkan</p>
                <Button onClick={() => setShowAddDialog(true)} variant="outline" size="sm">
 <Plus className="size-4 mr-1" /> Buat Budget Pertama
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetRows.map((row) => (
                  <BudgetRow
                    key={row.category}
                    category={row.category}
                    icon={row.emoji}
                    budget={row.budget}
                    spent={row.spent}
                    onSave={(newBudget) => handleBudgetSave(row.category, newBudget)}
                    isLoading={saving}
                  />
                ))}
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
 <Sparkles className="size-5 text-[var(--color-sentiment-warning)]" />
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

      {/* Add Budget Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Budget Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="category-select">Kategori</Label>
              <select
                id="category-select"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-[var(--color-bg-screen)] text-[var(--color-content-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              >
                <option value="">Pilih kategori…</option>
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {getCategoryMeta(c).emoji} {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budget-amount-input">Jumlah Budget (Rp)</Label>
              <input
                id="budget-amount-input"
                type="text"
                inputMode="numeric"
                placeholder="cth. 500000"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-[var(--color-bg-screen)] text-[var(--color-content-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddBudget} disabled={saving || !newCategory.trim()}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
