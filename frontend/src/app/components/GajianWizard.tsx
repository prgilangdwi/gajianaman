import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useBudgetRecommendation } from '@/hooks/useBudgetRecommendation';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Progress } from './ui/progress';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, bgColorVar, textColorVar, borderColorVar, formatRupiah } from '@/lib/utils';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FixedExpense {
  category: string;
  amount: number;
  description?: string;
}

interface GajianInput {
  salaryAmount: number;
  salaryDate: number;
  fixedExpenses: FixedExpense[];
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

interface GajianWizardProps {
  onBack: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RISK_OPTIONS: {
  value: GajianInput['riskProfile'];
  label: string;
  description: string;
}[] = [
  {
    value: 'conservative',
    label: 'Konservatif',
    description: 'Prioritaskan tabungan. Pengeluaran hiburan minimal.',
  },
  {
    value: 'moderate',
    label: 'Moderat',
    description: 'Keseimbangan antara tabungan dan kenikmatan hidup.',
  },
  {
    value: 'aggressive',
    label: 'Agresif',
    description: 'Investasi lebih. Siap ambil risiko untuk hasil lebih tinggi.',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseRupiahInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
}

function displayRupiah(val: number): string {
  return val === 0 ? '' : val.toLocaleString('id-ID');
}

function isEntryValid(e: FixedExpense): boolean {
  return e.amount > 0 && e.category.trim() !== '';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function GajianWizard({ onBack }: GajianWizardProps) {
  const prefersReduced = useReducedMotion();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<GajianInput>({
    salaryAmount: 0,
    salaryDate: 25,
    fixedExpenses: [],
    riskProfile: 'moderate',
  });
  // tracks whether user has attempted to advance from step 2 without valid data
  const [step2Attempted, setStep2Attempted] = useState(false);

  const navigate = useNavigate();
  const { isLoading, generateBudget } = useBudgetRecommendation();

  // ── Validation ──────────────────────────────────────────────────────────────

  const canProceedStep1 = useCallback(
    () => formData.salaryAmount > 0 && formData.salaryDate >= 1 && formData.salaryDate <= 28,
    [formData.salaryAmount, formData.salaryDate],
  );

  const canProceedStep2 = useCallback(
    () =>
      formData.fixedExpenses.length > 0 &&
      formData.fixedExpenses.every((e) => isEntryValid(e)),
    [formData.fixedExpenses],
  );

  const canProceedStep3 = useCallback(() => !!formData.riskProfile, [formData.riskProfile]);

  const canProceedCurrent =
    step === 1 ? canProceedStep1() : step === 2 ? canProceedStep2() : canProceedStep3();

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (step === 2 && !canProceedStep2()) {
      setStep2Attempted(true);
      return;
    }
    if (step < 3 && canProceedCurrent) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
      setStep2Attempted(false);
    }
  }, [step, canProceedCurrent, canProceedStep2]);

  const handlePrevious = useCallback(() => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
      setStep2Attempted(false);
    }
  }, [step]);

  // ── Step 1 Handlers ─────────────────────────────────────────────────────────

  const handleSalaryAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, salaryAmount: parseRupiahInput(e.target.value) }));
  }, []);

  const handleSalaryDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setFormData((prev) => ({
      ...prev,
      salaryDate: isNaN(val) ? 1 : Math.min(28, Math.max(1, val)),
    }));
  }, []);

  // ── Step 2 Handlers ─────────────────────────────────────────────────────────

  const handleAddExpense = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      fixedExpenses: [...prev.fixedExpenses, { category: '', amount: 0, description: '' }],
    }));
  }, []);

  const handleRemoveExpense = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((_, i) => i !== index),
    }));
  }, []);

  const handleExpenseChange = useCallback(
    (index: number, field: keyof FixedExpense, value: string) => {
      setFormData((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.map((e, i) => {
          if (i !== index) return e;
          if (field === 'amount') return { ...e, amount: parseRupiahInput(value) };
          return { ...e, [field]: value };
        }),
      }));
    },
    [],
  );

  // ── Step 3 Handler ──────────────────────────────────────────────────────────

  const handleRiskProfile = useCallback((val: string) => {
    setFormData((prev) => ({ ...prev, riskProfile: val as GajianInput['riskProfile'] }));
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const result = await generateBudget(formData);
    if (result.budgetItems.length === 0) {
      toast.error('Gagal menghasilkan anggaran. Silakan coba lagi.', {
        action: { label: 'Coba Lagi', onClick: handleSubmit },
      });
      return;
    }
    navigate('/gajian/confirm', { state: { recommendation: result, formData } });
  }, [formData, generateBudget, navigate]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const progressValue = (step / 3) * 100;

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className={cn(
              'text-sm font-medium transition-colors',
              textColorVar('content-secondary'),
              'hover:text-[var(--color-content-primary)]',
            )}
            aria-label="Kembali ke halaman sebelumnya"
          >
            ← Kembali
          </button>
          <span
            className={cn('text-sm font-semibold', textColorVar('content-secondary'))}
            aria-live="polite"
          >
            Langkah {step} dari 3
          </span>
        </div>
        <Progress
          value={progressValue}
          className="h-2"
          aria-label={`Progress wizard: langkah ${step} dari 3`}
        />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: prefersReduced ? 0 : 0.18 }}
        >
          {step === 1 && (
            <StepSalary
              salaryAmount={formData.salaryAmount}
              salaryDate={formData.salaryDate}
              onAmountChange={handleSalaryAmountChange}
              onDateChange={handleSalaryDateChange}
            />
          )}
          {step === 2 && (
            <StepFixedExpenses
              expenses={formData.fixedExpenses}
              salaryAmount={formData.salaryAmount}
              attempted={step2Attempted}
              onAdd={handleAddExpense}
              onRemove={handleRemoveExpense}
              onChange={handleExpenseChange}
            />
          )}
          {step === 3 && (
            <StepRiskProfile value={formData.riskProfile} onChange={handleRiskProfile} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevious}
              aria-label="Langkah sebelumnya"
            >
              Kembali
            </Button>
          )}
        </div>

        <div>
          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={step === 1 && !canProceedStep1()}
              aria-label="Lanjut ke langkah berikutnya"
            >
              Lanjut
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceedStep3() || isLoading}
              className="bg-[var(--color-brand-primary)] text-white hover:opacity-90"
              aria-label="Hasilkan rekomendasi anggaran"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                  Memproses...
                </span>
              ) : (
                'Hasilkan Anggaran'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Salary ────────────────────────────────────────────────────────────

interface StepSalaryProps {
  salaryAmount: number;
  salaryDate: number;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function StepSalary({ salaryAmount, salaryDate, onAmountChange, onDateChange }: StepSalaryProps) {
  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
      <CardHeader>
        <CardTitle className="text-lg text-[var(--color-content-primary)]">
          💰 Informasi Gaji
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="salary-amount" className="text-[var(--color-content-primary)] font-medium">
            Gaji Bulanan
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-content-tertiary)] pointer-events-none select-none">
              Rp
            </span>
            <Input
              id="salary-amount"
              type="text"
              inputMode="numeric"
              value={displayRupiah(salaryAmount)}
              onChange={onAmountChange}
              placeholder="5.000.000"
              className="pl-10"
              aria-label="Gaji bulanan dalam Rupiah"
            />
          </div>
          {salaryAmount > 0 && (
            <p className="text-sm text-[var(--color-content-secondary)]">
              {formatRupiah(salaryAmount)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="salary-date" className="text-[var(--color-content-primary)] font-medium">
            Tanggal gajian (1–28)
          </Label>
          <Input
            id="salary-date"
            type="number"
            min={1}
            max={28}
            value={salaryDate}
            onChange={onDateChange}
            className="w-28"
            aria-label="Tanggal gajian setiap bulan"
          />
          <p className="text-xs text-[var(--color-content-tertiary)]">
            Maks. tanggal 28 agar konsisten di semua bulan
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Step 2: Fixed Expenses ────────────────────────────────────────────────────

interface StepFixedExpensesProps {
  expenses: FixedExpense[];
  salaryAmount: number;
  attempted: boolean;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof FixedExpense, value: string) => void;
}

function StepFixedExpenses({
  expenses,
  salaryAmount,
  attempted,
  onAdd,
  onRemove,
  onChange,
}: StepFixedExpensesProps) {
  const totalFixed = expenses.reduce((sum, e) => sum + e.amount, 0);
  const allValid = expenses.length > 0 && expenses.every((e) => isEntryValid(e));

  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
      <CardHeader>
        <CardTitle className="text-lg text-[var(--color-content-primary)]">
          🏠 Pengeluaran Tetap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-[var(--color-content-secondary)]">
          Tambahkan pengeluaran rutin bulanan seperti sewa, cicilan, atau tagihan tetap.
        </p>

        {/* Inline error — shown after user clicks Lanjut without valid entries */}
        {attempted && expenses.length === 0 && (
          <p className="text-sm text-[var(--color-sentiment-negative)]" role="alert">
            Tambahkan minimal satu pengeluaran tetap untuk melanjutkan.
          </p>
        )}

        <div className="space-y-3">
            {expenses.map((expense, index) => {
              const entryError = attempted && !isEntryValid(expense);
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <div
                    className={cn(
                      'p-3 rounded-lg border space-y-3',
                      bgColorVar('bg-screen'),
                      entryError
                        ? 'border-[var(--color-sentiment-negative)]'
                        : borderColorVar('border-neutral'),
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--color-content-tertiary)]">
                        Pengeluaran {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemove(index)}
                        className="text-[var(--color-sentiment-negative)] hover:opacity-70 transition-opacity p-1"
                        aria-label={`Hapus pengeluaran ${index + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label
                          htmlFor={`cat-${index}`}
                          className="text-xs text-[var(--color-content-secondary)]"
                        >
                          Kategori *
                        </Label>
                        <Input
                          id={`cat-${index}`}
                          type="text"
                          value={expense.category}
                          onChange={(e) => onChange(index, 'category', e.target.value)}
                          placeholder="cth. Sewa"
                          className="h-9 text-sm"
                          aria-required="true"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label
                          htmlFor={`amt-${index}`}
                          className="text-xs text-[var(--color-content-secondary)]"
                        >
                          Jumlah (Rp) *
                        </Label>
                        <Input
                          id={`amt-${index}`}
                          type="text"
                          inputMode="numeric"
                          value={displayRupiah(expense.amount)}
                          onChange={(e) => onChange(index, 'amount', e.target.value)}
                          placeholder="1.500.000"
                          className="h-9 text-sm"
                          aria-required="true"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label
                        htmlFor={`desc-${index}`}
                        className="text-xs text-[var(--color-content-secondary)]"
                      >
                        Keterangan (opsional)
                      </Label>
                      <Input
                        id={`desc-${index}`}
                        type="text"
                        value={expense.description ?? ''}
                        onChange={(e) => onChange(index, 'description', e.target.value)}
                        placeholder="cth. Kos bulan Januari"
                        className="h-9 text-sm"
                      />
                    </div>

                    {entryError && (
                      <p className="text-xs text-[var(--color-sentiment-negative)]" role="alert">
                        Kategori dan jumlah wajib diisi.
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full border-dashed"
          aria-label="Tambah pengeluaran tetap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengeluaran
        </Button>

        {allValid && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'rounded-lg p-3 border',
              bgColorVar('bg-neutral'),
              borderColorVar('border-neutral'),
            )}
            aria-live="polite"
          >
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-content-secondary)]">Total tetap</span>
              <span className="font-semibold text-[var(--color-sentiment-negative)]">
                {formatRupiah(totalFixed)}
              </span>
            </div>
            {salaryAmount > 0 && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-[var(--color-content-secondary)]">Sisa anggaran</span>
                <span className="font-semibold text-[var(--color-sentiment-positive)]">
                  {formatRupiah(Math.max(0, salaryAmount - totalFixed))}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step 3: Risk Profile ──────────────────────────────────────────────────────

interface StepRiskProfileProps {
  value: GajianInput['riskProfile'];
  onChange: (val: string) => void;
}

function StepRiskProfile({ value, onChange }: StepRiskProfileProps) {
  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
      <CardHeader>
        <CardTitle className="text-lg text-[var(--color-content-primary)]">
          🎲 Profil Risiko Keuangan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-[var(--color-content-secondary)]">
          Pilih pendekatan yang sesuai dengan tujuan keuangan Anda.
        </p>

        <RadioGroup
          value={value}
          onValueChange={onChange}
          className="space-y-3"
          aria-label="Profil risiko keuangan"
        >
          {RISK_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`risk-${option.value}`}
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors',
                value === option.value
                  ? 'border-[var(--color-brand-primary)] bg-[var(--color-bg-elevated)]'
                  : cn(borderColorVar('border-neutral'), bgColorVar('bg-screen')),
              )}
            >
              <RadioGroupItem
                id={`risk-${option.value}`}
                value={option.value}
                className="mt-0.5 flex-shrink-0"
              />
              <div className="min-w-0 space-y-0.5">
                <p className="font-semibold text-[var(--color-content-primary)]">
                  {option.label}
                </p>
                <p className="text-sm text-[var(--color-content-secondary)] leading-relaxed">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
