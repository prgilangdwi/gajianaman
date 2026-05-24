import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router';
import { Sparkles, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { type BudgetRecommendation, type BudgetItem } from '@/hooks/useBudgetRecommendation';
import { saveBudgets, setGajianSetupComplete } from '@/hooks/useBudgets';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah, cn, bgColorVar, borderColorVar } from '@/lib/utils';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseAmountInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
}

function displayAmount(val: number): string {
  return val === 0 ? '' : val.toLocaleString('id-ID');
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-[var(--color-sentiment-positive)]';
  if (confidence >= 0.6) return 'bg-[var(--color-sentiment-warning)]';
  return 'bg-[var(--color-sentiment-negative)]';
}

function confidenceLabel(confidence: number): string {
  return `Kepercayaan AI: ${Math.round(confidence * 100)}%`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BudgetConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();

  const recommendation = location.state?.recommendation as BudgetRecommendation | undefined;
  const formData = location.state?.formData as {
    salaryAmount: number;
    fixedExpenses: { category: string; amount: number }[];
  } | undefined;

  const [editedItems, setEditedItems] = useState<BudgetItem[]>(recommendation?.budgetItems ?? []);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!recommendation) {
    return <Navigate to="/gajian" replace />;
  }

  const totalFixed = formData?.fixedExpenses?.reduce((sum, e) => sum + e.amount, 0) ?? 0;

  const handleAmountChange = (index: number, raw: string) => {
    const amount = parseAmountInput(raw);
    setEditedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, amount } : item)),
    );
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveBudgets(user.userId, editedItems);
      await setGajianSetupComplete(user.userId);
      toast.success('Anggaran berhasil disimpan!');
      navigate('/home/overview');
    } catch {
      toast.error('Gagal menyimpan. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-5 pb-28 sm:pb-8"
    >
      {/* Header */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate('/gajian')}
          className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-content-secondary)] hover:text-[var(--color-content-primary)] transition-colors"
          aria-label="Kembali ke halaman Gajian"
        >
 <ArrowLeft className="size-4 " />
          Kembali
        </button>

        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[var(--color-content-primary)]">
            Rekomendasi Anggaran
          </h1>
          <p className="text-sm text-[var(--color-content-secondary)]">
            Dibuat oleh AI berdasarkan profil keuangan Anda
          </p>
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold text-white bg-[var(--color-brand-primary)]"
          aria-label={`Target tabungan: ${Math.round(recommendation.savingsRate * 100)} persen`}
        >
 <CheckCircle className="size-3.5 .5" aria-hidden="true" />
          Target Tabungan: {Math.round(recommendation.savingsRate * 100)}%
        </span>
      </div>

      {/* Financial summary */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={{ ...fadeUp.transition, delay: prefersReduced ? 0 : 0.05 }}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[var(--color-content-primary)]">
              Ringkasan Keuangan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {formData && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-content-secondary)]">Penghasilan Bulanan</span>
                  <span className="font-semibold text-[var(--color-content-primary)]">
                    {formatRupiah(formData.salaryAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-content-secondary)]">Pengeluaran Tetap</span>
                  <span className="font-semibold text-[var(--color-sentiment-negative)]">
                    − {formatRupiah(totalFixed)}
                  </span>
                </div>
                <div className="h-px bg-[var(--color-border-neutral)]" />
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-content-secondary)]">Dana yang Dianggarkan</span>
              <span className="font-semibold text-[var(--color-sentiment-positive)]">
                {formatRupiah(recommendation.totalRecommended)}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Budget items */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={{ ...fadeUp.transition, delay: prefersReduced ? 0 : 0.1 }}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-[var(--color-content-primary)]">
                Alokasi Anggaran
              </CardTitle>
              <button
                type="button"
                onClick={() => setIsEditMode((v) => !v)}
                className="text-sm font-medium text-[var(--color-brand-primary)] hover:opacity-70 transition-opacity"
                aria-label={isEditMode ? 'Selesai mengedit' : 'Ubah sendiri jumlah anggaran'}
              >
                {isEditMode ? 'Selesai Edit' : 'Ubah Sendiri'}
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {editedItems.map((item, index) => (
              <div
                key={item.category}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
 className={cn('size-2 rounded-full flex-shrink-0', confidenceColor(item.confidence))}
                    title={confidenceLabel(item.confidence)}
                    aria-label={confidenceLabel(item.confidence)}
                  />
                  <span className="text-sm text-[var(--color-content-primary)] truncate">
                    {item.category}
                  </span>
                </div>

                {isEditMode ? (
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={displayAmount(item.amount)}
                    onChange={(e) => handleAmountChange(index, e.target.value)}
                    className="w-36 h-8 text-sm text-right"
                    aria-label={`Jumlah anggaran untuk ${item.category}`}
                  />
                ) : (
                  <span className="text-sm font-semibold text-[var(--color-content-primary)] flex-shrink-0">
                    {formatRupiah(item.amount)}
                  </span>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Explanation */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={{ ...fadeUp.transition, delay: prefersReduced ? 0 : 0.15 }}
      >
        <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
          <CardContent className="pt-4 flex gap-3">
            <Sparkles
 className="size-5 text-[var(--color-brand-primary)] flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-sm text-[var(--color-content-secondary)] leading-relaxed">
              {recommendation.explanation}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action buttons — sticky on mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:static bg-[var(--color-bg-screen)] border-t border-[var(--color-border-neutral)] sm:border-0 p-4 sm:p-0 flex flex-col gap-2 sm:flex-row sm:justify-end z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/spend/budget')}
          className="sm:order-1 text-[var(--color-content-secondary)]"
          aria-label="Lewati dan atur anggaran secara manual"
        >
          Lewati
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsEditMode((v) => !v)}
          className="sm:order-2"
          aria-label={isEditMode ? 'Selesai mengedit anggaran' : 'Ubah jumlah anggaran sendiri'}
        >
          {isEditMode ? 'Selesai Edit' : 'Ubah Sendiri'}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="sm:order-3 bg-[var(--color-brand-primary)] text-white hover:opacity-90"
          aria-label="Terapkan dan simpan anggaran ke akun Anda"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span
 className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Menyimpan…
            </span>
          ) : (
            'Terapkan & Simpan'
          )}
        </Button>
      </div>
    </motion.div>
  );
}
