import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Target, Trophy, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { updateGoalSaved } from '@/hooks/useGoals';
import { formatRupiah, cn } from '@/lib/utils';
import { PrivacyAmount } from './PrivacyAmount';
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

export interface GoalCardProps {
  goal: Goal;
  index: number;
  onRefetch: () => void;
  prefersReduced: boolean;
}

export function GoalCard({
  goal,
  index,
  onRefetch,
  prefersReduced,
}: GoalCardProps) {
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
      initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
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
