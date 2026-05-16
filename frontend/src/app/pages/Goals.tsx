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
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Plus, Target, Trophy, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useGoals, addGoal, updateGoalSaved } from '@/hooks/useGoals';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import type { Goal } from '@/lib/supabase';

const GOAL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

function getGoalColor(idx: number) {
  return GOAL_COLORS[idx % GOAL_COLORS.length];
}

function getGoalStatus(pct: number): { label: string; variant: string } {
  if (pct >= 100) return { label: 'Tercapai 🎉', variant: 'bg-green-100 text-green-700' };
  if (pct >= 80) return { label: 'Hampir!', variant: 'bg-yellow-100 text-yellow-700' };
  return { label: 'In Progress', variant: 'bg-blue-100 text-blue-700' };
}

function GoalCard({
  goal,
  index,
  onRefetch,
}: {
  goal: Goal;
  index: number;
  onRefetch: () => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const color = getGoalColor(index);
  const saved = Number(goal.saved_amount);
  const target = Number(goal.target_amount);
  const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const status = getGoalStatus(pct);

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
    <Card className="relative overflow-hidden">
      {pct >= 100 && (
        <div className="absolute top-3 right-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Target className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <CardTitle className="text-base">{goal.name}</CardTitle>
              {goal.deadline && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
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
          <Badge className={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Circular-style numeric progress */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Terkumpul</p>
            <p className="font-['DM_Mono'] font-bold text-lg" style={{ color }}>
              {formatRupiah(saved)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="font-['DM_Mono'] font-semibold text-muted-foreground">
              {formatRupiah(target)}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Progress
            value={pct}
            className="h-3"
            style={{ '--progress-background': color } as React.CSSProperties}
          />
          <p className="text-xs text-right font-['DM_Mono'] text-muted-foreground">
            {pct.toFixed(1)}%
          </p>
        </div>

        {pct < 100 && (
          <>
            {addOpen ? (
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Jumlah (Rp)"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="h-9"
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
  );
}

export default function Goals() {
  const { user } = useAuth();
  const { goals, isLoading, refetch } = useGoals();
  const [dialogOpen, setDialogOpen] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{goals.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Tercapai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">{achieved}</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Terkumpul</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-xl">
              {formatRupiah(goals.reduce((s, g) => s + Number(g.saved_amount), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Daftar Goals</h2>
        <Button onClick={() => setDialogOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Tambah Goal
        </Button>
      </div>

      {/* Goal cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6 space-y-3">
                <div className="h-5 bg-muted rounded animate-pulse w-32" />
                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Target className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Belum ada goals. Yuk mulai menabung!</p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Buat Goal Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal, idx) => (
            <GoalCard key={goal.id} goal={goal} index={idx} onRefetch={refetch} />
          ))}
        </div>
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
    </div>
  );
}
