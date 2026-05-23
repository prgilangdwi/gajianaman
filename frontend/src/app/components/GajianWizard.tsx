import { useState, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Progress } from './ui/progress';
import { Plus, Trash2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatRupiah, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FixedExpense {
  id: string;
  category: string;
  amount: number;
  description?: string;
}

export interface GajianInput {
  salaryAmount: number;
  salaryDate: number;
  fixedExpenses: FixedExpense[];
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

export interface GajianWizardProps {
  onBack: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RISK_OPTIONS: {
  value: GajianInput['riskProfile'];
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'conservative',
    label: 'Konservatif',
    description: 'Prioritaskan tabungan dan dana darurat. Belanja ketat, aman untuk yang baru mulai.',
    icon: '🛡️',
  },
  {
    value: 'moderate',
    label: 'Moderat',
    description: 'Seimbang antara tabungan dan pengeluaran. Fleksibel untuk kebutuhan sehari-hari.',
    icon: '⚖️',
  },
  {
    value: 'aggressive',
    label: 'Agresif',
    description: 'Fokus pada investasi dan pertumbuhan aset. Cocok untuk yang sudah punya dana darurat.',
    icon: '🚀',
  },
];

const EXPENSE_CATEGORY_SUGGESTIONS = [
  'Sewa / KPR', 'Listrik & Air', 'Internet', 'Transportasi', 'Cicilan', 'Asuransi',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAmountInput(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  return digits === '' ? 0 : parseInt(digits, 10);
}

function displayAmount(val: number): string {
  return val === 0 ? '' : val.toLocaleString('id-ID');
}

// ── Wizard Component ──────────────────────────────────────────────────────────

export default function GajianWizard({ onBack }: GajianWizardProps) {
  const prefersReduced = useReducedMotion();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<GajianInput>({
    salaryAmount: 0,
    salaryDate: 25,
    fixedExpenses: [],
    riskProfile: 'moderate',
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  const canProceedStep1 = useCallback(
    () => formData.salaryAmount > 0 && formData.salaryDate >= 1 && formData.salaryDate <= 28,
    [formData.salaryAmount, formData.salaryDate],
  );

  const canProceedStep2 = useCallback(
    () =>
      formData.fixedExpenses.length > 0 &&
      formData.fixedExpenses.every((e) => e.amount > 0 && e.category.trim() !== ''),
    [formData.fixedExpenses],
  );

  const canProceedStep3 = useCallback(() => !!formData.riskProfile, [formData.riskProfile]);

  const canProceedCurrent =
    step === 1 ? canProceedStep1() : step === 2 ? canProceedStep2() : canProceedStep3();

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (step < 3 && canProceedCurrent) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  }, [step, canProceedCurrent]);

  const handlePrevious = useCallback(() => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  }, [step]);

  // ── Step 1 Handlers ─────────────────────────────────────────────────────────

  const handleSalaryAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = formatAmountInput(e.target.value);
    setFormData((prev) => ({ ...prev, salaryAmount: val }));
  }, []);

  const handleSalaryDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, salaryDate: isNaN(val) ? 1 : Math.min(28, Math.max(1, val)) }));
  }, []);

  // ── Step 2 Handlers ─────────────────────────────────────────────────────────

  const handleAddExpense = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      fixedExpenses: [
        ...prev.fixedExpenses,
        { id: crypto.randomUUID(), category: '', amount: 0, description: '' },
      ],
    }));
  }, []);

  const handleRemoveExpense = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id),
    }));
  }, []);

  const handleExpenseChange = useCallback(
    (id: string, field: keyof Omit<FixedExpense, 'id'>, value: string) => {
      setFormData((prev) => ({
        ...prev,
        fixedExpenses: prev.fixedExpenses.map((e) => {
          if (e.id !== id) return e;
          if (field === 'amount') return { ...e, amount: formatAmountInput(value) };
          return { ...e, [field]: value };
        }),
      }));
    },
    [],
  );

  // ── Step 3 Handlers ─────────────────────────────────────────────────────────

  const handleRiskProfile = useCallback((val: string) => {
    setFormData((prev) => ({
      ...prev,
      riskProfile: val as GajianInput['riskProfile'],
    }));
  }, []);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    // Placeholder — Batch 2 will wire the API call here
    console.log('[GajianWizard] Submit payload:', formData);
  }, [formData]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const progressPercent = (step / 3) * 100;

  const slideVariants = {
    enter: (direction: number) => ({
      x: prefersReduced ? 0 : direction * 40,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({
      x: prefersReduced ? 0 : direction * -40,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              textColorVar('content-secondary'),
              'hover:text-[var(--color-content-primary)] transition-colors',
            )}
            aria-label="Kembali ke halaman sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </button>
          <span
            className={cn('text-sm font-semibold', textColorVar('content-secondary'))}
            aria-live="polite"
            aria-label={`Langkah ${step} dari 3`}
          >
            Langkah {step} dari 3
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-2"
          aria-label={`Progress: langkah ${step} dari 3`}
        />
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={step}>
        <motion.div
          key={step}
          custom={step}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: prefersReduced ? 0 : 0.2, ease: 'easeInOut' }}
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
              onAdd={handleAddExpense}
              onRemove={handleRemoveExpense}
              onChange={handleExpenseChange}
            />
          )}
          {step === 3 && (
            <StepRiskProfile
              value={formData.riskProfile}
              onChange={handleRiskProfile}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={step === 1}
          className="flex items-center gap-1"
          aria-label="Langkah sebelumnya"
        >
          <ChevronLeft className="w-4 h-4" />
          Sebelumnya
        </Button>

        {step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceedCurrent}
            className="flex items-center gap-1"
            aria-label="Lanjut ke langkah berikutnya"
          >
            Selanjutnya
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!canProceedCurrent}
            className="flex items-center gap-1 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)]"
            aria-label="Hasilkan rekomendasi anggaran"
          >
            <Sparkles className="w-4 h-4" />
            Hasilkan Anggaran
          </Button>
        )}
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
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[var(--color-content-primary)]">
            💰 Informasi Gaji
          </h2>
          <p className={cn('text-sm', 'text-[var(--color-content-secondary)]')}>
            Masukkan gaji bulanan dan tanggal gajian kamu.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salary-amount" className="text-[var(--color-content-primary)] font-medium">
              Gaji Bulanan (Rupiah)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-content-tertiary)] pointer-events-none select-none">
                Rp
              </span>
              <Input
                id="salary-amount"
                type="text"
                inputMode="numeric"
                value={displayAmount(salaryAmount)}
                onChange={onAmountChange}
                placeholder="5.000.000"
                className="pl-10"
                aria-label="Masukkan jumlah gaji bulanan dalam Rupiah"
                aria-describedby="salary-amount-hint"
              />
            </div>
            {salaryAmount > 0 && (
              <p id="salary-amount-hint" className="text-xs text-[var(--color-content-tertiary)]">
                {formatRupiah(salaryAmount)} / bulan
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary-date" className="text-[var(--color-content-primary)] font-medium">
              Tanggal Gajian
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="salary-date"
                type="number"
                min={1}
                max={28}
                value={salaryDate}
                onChange={onDateChange}
                className="w-24 text-center"
                aria-label="Tanggal gajian setiap bulan (1 sampai 28)"
                aria-describedby="salary-date-hint"
              />
              <span className="text-sm text-[var(--color-content-secondary)]">
                setiap bulan
              </span>
            </div>
            <p id="salary-date-hint" className="text-xs text-[var(--color-content-tertiary)]">
              Tanggal 1–28 (maks. 28 untuk konsistensi semua bulan)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Step 2: Fixed Expenses ────────────────────────────────────────────────────

interface StepFixedExpensesProps {
  expenses: FixedExpense[];
  salaryAmount: number;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Omit<FixedExpense, 'id'>, value: string) => void;
}

function StepFixedExpenses({
  expenses,
  salaryAmount,
  onAdd,
  onRemove,
  onChange,
}: StepFixedExpensesProps) {
  const totalFixed = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = salaryAmount - totalFixed;
  const allValid =
    expenses.length > 0 && expenses.every((e) => e.amount > 0 && e.category.trim() !== '');

  return (
    <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[var(--color-content-primary)]">
            📋 Pengeluaran Tetap
          </h2>
          <p className="text-sm text-[var(--color-content-secondary)]">
            Tambahkan pengeluaran rutin kamu setiap bulan (sewa, cicilan, dll).
          </p>
        </div>

        {/* Suggestions chips */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-content-tertiary)]">Contoh kategori:</p>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORY_SUGGESTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  const entry = expenses.find((e) => e.category === '');
                  if (entry) {
                    onChange(entry.id, 'category', cat);
                  } else {
                    onAdd();
                  }
                }}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-full border transition-colors',
                  borderColorVar('border-neutral'),
                  'text-[var(--color-content-secondary)]',
                  'hover:bg-[var(--color-bg-neutral)] hover:text-[var(--color-content-primary)]',
                )}
                aria-label={`Tambah kategori ${cat}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Expense entries */}
        <div className="space-y-3" role="list" aria-label="Daftar pengeluaran tetap">
          <AnimatePresence>
            {expenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.15 }}
                role="listitem"
              >
                <div
                  className={cn(
                    'p-3 rounded-lg border space-y-2',
                    bgColorVar('bg-screen'),
                    borderColorVar('border-neutral'),
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--color-content-tertiary)]">
                      Pengeluaran {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(expense.id)}
                      className="text-[var(--color-sentiment-negative)] hover:opacity-70 transition-opacity p-1 rounded"
                      aria-label={`Hapus pengeluaran ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`expense-cat-${expense.id}`}
                        className="text-xs text-[var(--color-content-secondary)]"
                      >
                        Kategori *
                      </Label>
                      <Input
                        id={`expense-cat-${expense.id}`}
                        type="text"
                        value={expense.category}
                        onChange={(e) => onChange(expense.id, 'category', e.target.value)}
                        placeholder="cth. Sewa"
                        className="h-9 text-sm"
                        aria-required="true"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor={`expense-amt-${expense.id}`}
                        className="text-xs text-[var(--color-content-secondary)]"
                      >
                        Jumlah (Rp) *
                      </Label>
                      <Input
                        id={`expense-amt-${expense.id}`}
                        type="text"
                        inputMode="numeric"
                        value={displayAmount(expense.amount)}
                        onChange={(e) => onChange(expense.id, 'amount', e.target.value)}
                        placeholder="1.500.000"
                        className="h-9 text-sm"
                        aria-required="true"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor={`expense-desc-${expense.id}`}
                      className="text-xs text-[var(--color-content-secondary)]"
                    >
                      Keterangan (opsional)
                    </Label>
                    <Input
                      id={`expense-desc-${expense.id}`}
                      type="text"
                      value={expense.description ?? ''}
                      onChange={(e) => onChange(expense.id, 'description', e.target.value)}
                      placeholder="cth. Kos bulan Januari"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add button */}
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full border-dashed"
          aria-label="Tambah pengeluaran tetap baru"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengeluaran
        </Button>

        {/* Summary */}
        {allValid && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'rounded-lg p-3 space-y-1',
              bgColorVar('bg-neutral'),
              borderColorVar('border-neutral'),
              'border',
            )}
            aria-live="polite"
          >
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-content-secondary)]">Total pengeluaran tetap</span>
              <span className="font-semibold text-[var(--color-sentiment-negative)]">
                {formatRupiah(totalFixed)}
              </span>
            </div>
            {salaryAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--color-content-secondary)]">Sisa untuk anggaran</span>
                <span
                  className={cn(
                    'font-semibold',
                    remaining >= 0
                      ? 'text-[var(--color-sentiment-positive)]'
                      : 'text-[var(--color-sentiment-negative)]',
                  )}
                >
                  {formatRupiah(Math.max(0, remaining))}
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
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[var(--color-content-primary)]">
            🎯 Profil Risiko Keuangan
          </h2>
          <p className="text-sm text-[var(--color-content-secondary)]">
            Pilih pendekatan yang sesuai dengan tujuan keuangan kamu.
          </p>
        </div>

        <RadioGroup
          value={value}
          onValueChange={onChange}
          className="space-y-3"
          aria-label="Pilih profil risiko keuangan"
        >
          {RISK_OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`risk-${option.value}`}
              className={cn(
                'flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                value === option.value
                  ? cn(
                      'border-[var(--color-brand-primary)]',
                      bgColorVar('bg-elevated'),
                    )
                  : cn(borderColorVar('border-neutral'), bgColorVar('bg-screen')),
              )}
            >
              <RadioGroupItem
                id={`risk-${option.value}`}
                value={option.value}
                className="mt-1 flex-shrink-0"
              />
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{option.icon}</span>
                  <span className="font-semibold text-[var(--color-content-primary)]">
                    {option.label}
                  </span>
                </div>
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
