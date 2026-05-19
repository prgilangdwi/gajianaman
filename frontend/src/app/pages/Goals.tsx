import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible';
import { Plus, Target, Trophy, Calendar, ChevronDown, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useGoals, addGoal, updateGoalSaved } from '@/hooks/useGoals';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useGoalProgress } from '@/hooks/data/useGoalProgress';
import { formatRupiah, cn } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { PrivacyAmount } from '../components/PrivacyAmount';
import { TextPositive, TextNegative, TextWarning } from '../components/Markup';
import { pageEnter, fadeUp, slideInRight, useReducedMotion } from '@/lib/transitions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Goal } from '@/lib/supabase';

const GOAL_COLORS = [
  'var(--color-sentiment-positive)',
  'var(--color-brand-primary)',
  'var(--color-sentiment-warning)',
  'var(--color-sentiment-negative)',
  '#8b5cf6',
  '#ec4899',
];

function getGoalColor(idx: number) {
  return GOAL_COLORS[idx % GOAL_COLORS.length];
}

function getGoalStatus(pct: number): { label: string; type: 'achieved' | 'warning' | 'progress' } {
  if (pct >= 100) return { label: 'Tercapai 🎉', type: 'achieved' };
  if (pct >= 80) return { label: 'Hampir!', type: 'warning' };
  return { label: 'In Progress', type: 'progress' };
}

function GoalCard({
  goal,
  index,
  onRefetch,
  prefersReduced,
}: {
  goal: Goal;
  index: number;
  onRefetch: () => void;
  prefersReduced: boolean;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const color = getGoalColor(index);
  const saved = Number(goal.saved_amount);
  const target = Number(goal.target_amount);
  const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const status = getGoalStatus(pct);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadlineDate = goal.deadline ? (() => { const d = new Date(goal.deadline); d.setHours(0, 0, 0, 0); return d; })() : null;
  const gap = Math.max(0, target - saved);
  const daysLeft = deadlineDate ? Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / 86_400_000)) : null;
  const perDay = daysLeft !== null && daysLeft > 0 && gap > 0
    ? Math.ceil(gap / daysLeft)
    : null;
  const deadlinePassed = deadlineDate !== null && deadlineDate < today && gap > 0;

  const handleAddSavings = async () => {
    const amt = parseInt(addAmount.replace(/\D/g, ''), 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Jumlah tidak valid');
      return;
    }
    setSaving(true);
    const { error } = await updateGoalSaved(goal.id, saved + amt);
    setSaving(false);
    if (error) {
      toast.error('Gagal menambah tabungan');
    } else {
      toast.success(`+${formatRupiah(amt)} ditambahkan ke "${goal.name}"`);
      setAddAmount('');
      setAddOpen(false);
      onRefetch();
    }
  };

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
      animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
      transition={fadeUp.transition}
    >
      <Card className="relative overflow-hidden bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
        {pct >= 100 && (
          <motion.div
            initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute top-3 right-3"
          >
            <Trophy className="w-5 h-5 text-[var(--color-sentiment-warning)]" />
          </motion.div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${color}20` }}
              >
                <Target className="w-5 h-5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base text-[var(--color-content-primary)]">{goal.name}</CardTitle>
                {goal.deadline && (
                  <p className="text-xs text-[var(--color-content-tertiary)] flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Intl.DateTimeFormat('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(goal.deadline))}
                  </p>
                )}
              </div>
            </div>
            <div className={cn(
              'px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0',
              status.type === 'achieved'
                ? 'bg-[var(--color-sentiment-positive-bg)] text-[var(--color-sentiment-positive)]'
                : status.type === 'warning'
                  ? 'bg-[var(--color-sentiment-warning-bg)] text-[var(--color-sentiment-warning)]'
                  : 'bg-[var(--color-bg-neutral)] text-[var(--color-content-secondary)]'
            )}>
              {status.label}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress info */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-[var(--color-content-tertiary)]">Terkumpul</p>
              <p className="font-mono font-bold text-lg" style={{ color }}>
                <PrivacyAmount value={formatRupiah(saved)} />
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-content-tertiary)]">Target</p>
              <p className="font-mono font-semibold text-[var(--color-content-tertiary)]">
                <PrivacyAmount value={formatRupiah(target)} />
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-3 bg-[var(--color-bg-neutral)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
              />
            </div>
            <p className="text-xs text-right font-mono text-[var(--color-content-tertiary)]">
              {pct.toFixed(1)}%
            </p>

            {/* Status messages */}
            {gap <= 0 ? (
              <p className="text-xs text-[var(--color-sentiment-positive)] font-medium flex items-center gap-1 mt-1">
                ✅ Target tercapai!
              </p>
            ) : deadlinePassed ? (
              <p className="text-xs text-[var(--color-sentiment-negative)] font-medium flex items-center gap-1 mt-1">
                ⚠️ Deadline terlewat
              </p>
            ) : perDay !== null && daysLeft !== null ? (
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-[var(--color-content-tertiary)]">📅 {daysLeft} hari lagi</span>
                <span
                  className={cn(
                    'font-semibold',
                    perDay > 500_000
                      ? 'text-[var(--color-sentiment-negative)]'
                      : perDay <= 50_000
                        ? 'text-[var(--color-sentiment-positive)]'
                        : 'text-[var(--color-content-tertiary)]'
                  )}
                >
                  💰 <PrivacyAmount value={formatRupiah(perDay)} />/hari
                </span>
              </div>
            ) : null}
          </div>

          {/* Add savings button */}
          {pct < 100 && (
            <>
              {addOpen ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Jumlah (Rp)"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    className="h-9 bg-[var(--color-bg-screen)] border-[var(--color-border-neutral)]"
                    min={0}
                  />
                  <Button size="sm" onClick={handleAddSavings} disabled={saving}>
                    {saving ? '…' : 'Simpan'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddOpen(false);
                      setAddAmount('');
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-1"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="w-4 h-4" /> Tambah Tabungan
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Goals() {
  const { user } = useAuth();
  const { goals, isLoading, refetch } = useGoals();
  const { month, year } = useMonthFilter();
  const { transactions, loading: transLoading } = useTransactions(month, year);
  const goalProgress = useGoalProgress(goals, transactions, month, year);
  const prefersReduced = useReducedMotion();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddGoal = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error('Nama goal tidak boleh kosong');
      return;
    }
    const amt = parseInt(targetAmount.replace(/\D/g, ''), 10);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Target amount tidak valid');
      return;
    }
    setSaving(true);
    const { error } = await addGoal(user.userId, name.trim(), amt, deadline || undefined);
    setSaving(false);
    if (error) {
      toast.error('Gagal menyimpan goal');
    } else {
      toast.success(`Goal "${name}" berhasil ditambahkan!`);
      setName('');
      setTargetAmount('');
      setDeadline('');
      setDialogOpen(false);
      refetch();
    }
  };

  const achieved = goals.filter(
    (g) => Number(g.saved_amount) >= Number(g.target_amount),
  ).length;

  if (isLoading) {
    return (
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
              <CardHeader className="pb-2">
                <div className="h-4 bg-[var(--color-bg-neutral)] rounded animate-pulse w-20" />
              </CardHeader>
              <CardContent>
                <div className="h-7 bg-[var(--color-bg-neutral)] rounded animate-pulse w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-3 sm:space-y-6"
    >
      {/* Summary KPIs */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: prefersReduced ? 0 : 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4"
      >
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                Total Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl text-[var(--color-content-primary)]">{goals.length}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                Tercapai
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">
                <TextPositive>{achieved}</TextPositive>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
          className="col-span-2 sm:col-span-1"
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                Total Terkumpul
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-mono font-bold text-lg md:text-xl text-[var(--color-content-primary)]">
                <PrivacyAmount value={formatRupiah(goals.reduce((s, g) => s + Number(g.saved_amount), 0))} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Header + Add button */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : slideInRight.initial}
        animate={prefersReduced ? { opacity: 1 } : slideInRight.animate}
        transition={slideInRight.transition}
        className="flex items-center justify-between"
      >
        <h2 className="text-lg font-bold text-[var(--color-content-primary)]">Daftar Goals</h2>
        <Button onClick={() => setDialogOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Tambah Goal
        </Button>
      </motion.div>

      {/* Goal cards grid */}
      {goals.length === 0 ? (
        <motion.div
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CardContent className="py-16 text-center space-y-3">
              <Target className="w-12 h-12 text-[var(--color-content-tertiary)] mx-auto" />
              <p className="text-[var(--color-content-tertiary)]">Belum ada goals. Yuk mulai menabung!</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="w-4 h-4 mr-1" /> Buat Goal Pertama
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <AnimatePresence>
            {goals.map((goal, idx) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={idx}
                onRefetch={refetch}
                prefersReduced={prefersReduced}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Progress Detail Section */}
      {goals.length > 0 && !transLoading && (
        <Collapsible open={progressOpen} onOpenChange={setProgressOpen} className="space-y-4">
          <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-6 py-4 h-auto hover:bg-[var(--color-bg-screen)]"
              >
                <div className="flex items-center gap-2 text-base font-semibold text-[var(--color-content-primary)]">
                  <TrendingUp className="w-5 h-5" />
                  Lihat Progres Detail
                </div>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 transition-transform text-[var(--color-content-secondary)]',
                    progressOpen ? 'rotate-180' : ''
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="space-y-6 pt-6 border-t border-[var(--color-border-neutral)]">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                        Total Target
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg md:text-2xl font-bold text-[var(--color-content-primary)]">
                        <PrivacyAmount value={formatRupiah(goalProgress.totalSavingsTarget)} />
                      </p>
                      <p className="text-xs text-[var(--color-content-tertiary)] mt-1">
                        {goalProgress.goals.length} tujuan
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                        Total Tersimpan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg md:text-2xl font-bold">
                        <TextPositive>
                          <PrivacyAmount value={formatRupiah(goalProgress.totalSaved)} />
                        </TextPositive>
                      </p>
                      <p className="text-xs text-[var(--color-content-tertiary)] mt-1">
                        {goalProgress.totalProgress}% tercapai
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                        Rata-rata/Bulan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg md:text-2xl font-bold text-[var(--color-brand-primary)]">
                        <PrivacyAmount value={formatRupiah(goalProgress.avgMonthlyRate)} />
                      </p>
                      <p className="text-xs text-[var(--color-content-tertiary)] mt-1">
                        3 bulan terakhir
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs md:text-sm font-semibold text-[var(--color-content-tertiary)]">
                        Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3 mt-2">
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--color-sentiment-positive)]">
                            {goalProgress.goalsOnTrack}
                          </p>
                          <p className="text-xs text-[var(--color-content-tertiary)]">Tepat</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--color-sentiment-warning)]">
                            {goalProgress.goalsAtRisk}
                          </p>
                          <p className="text-xs text-[var(--color-content-tertiary)]">Risiko</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-[var(--color-sentiment-negative)]">
                            {goalProgress.goalsDelayed}
                          </p>
                          <p className="text-xs text-[var(--color-content-tertiary)]">Terlambat</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Overall Progress */}
                <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
                  <CardHeader>
                    <CardTitle className="text-base text-[var(--color-content-primary)]">
                      Progress Keseluruhan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm text-[var(--color-content-primary)]">
                      <span>{goalProgress.totalProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-[var(--color-bg-neutral)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-sentiment-positive)] rounded-full transition-all"
                        style={{ width: `${goalProgress.totalProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--color-content-tertiary)]">
                      <PrivacyAmount value={formatRupiah(goalProgress.totalSaved)} /> dari{' '}
                      <PrivacyAmount value={formatRupiah(goalProgress.totalSavingsTarget)} />
                    </p>
                  </CardContent>
                </Card>

                {/* Trend Chart */}
                {goalProgress.goals.length > 0 && goalProgress.goals[0].monthlyHistory && (
                  <Card className="bg-[var(--color-bg-card)] border-[var(--color-border-neutral)]">
                    <CardHeader>
                      <CardTitle className="text-base text-[var(--color-content-primary)]">
                        Tren Tabungan Bulanan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart
                          data={goalProgress.goals[0].monthlyHistory.map((amount, idx) => ({
                            month: ['3 bln lalu', '2 bln lalu', '1 bln lalu'][idx] || 'Bulan ini',
                            savings: amount,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-neutral)" />
                          <XAxis dataKey="month" stroke="var(--color-content-tertiary)" />
                          <YAxis
                            stroke="var(--color-content-tertiary)"
                            tickFormatter={createCompactAxisFormatter()}
                          />
                          <Tooltip
                            formatter={(value: any) => formatRupiah(value)}
                            contentStyle={{
                              backgroundColor: 'var(--color-bg-elevated)',
                              border: '1px solid var(--color-border-neutral)',
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="savings"
                            stroke="var(--color-sentiment-positive)"
                            dot={{ fill: 'var(--color-sentiment-positive)' }}
                            name="Tabungan"
                            isAnimationActive={!prefersReduced}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Goal Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama Goal</Label>
              <Input
                placeholder="cth. Dana Darurat, Liburan Bali…"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target Amount (Rp)</Label>
              <Input
                type="number"
                placeholder="cth. 10000000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                min={0}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline (opsional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddGoal} disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
