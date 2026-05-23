import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn, bgColorVar, textColorVar, borderColorVar, formatRupiah } from '@/lib/utils';
import { useReducedMotion } from '@/lib/transitions';

export interface GajianInput {
  salaryAmount: number;
  salaryDate: number;
  fixedExpenses: Array<{ category: string; amount: number; description?: string }>;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
}

interface GajianWizardProps {
  onBack?: () => void;
}

export default function GajianWizard({ onBack }: GajianWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const prefersReduced = useReducedMotion();
  const [formData, setFormData] = useState<GajianInput>({
    salaryAmount: 0,
    salaryDate: 15,
    fixedExpenses: [{ category: 'Sewa', amount: 0, description: '' }],
    riskProfile: 'moderate',
  });

  // Step validation helpers
  const canProceedStep1 = useCallback(() => {
    return formData.salaryAmount > 0 && formData.salaryDate >= 1 && formData.salaryDate <= 28;
  }, [formData.salaryAmount, formData.salaryDate]);

  const canProceedStep2 = useCallback(() => {
    return (
      formData.fixedExpenses.length > 0 &&
      formData.fixedExpenses.every((e) => e.category.trim() && e.amount > 0)
    );
  }, [formData.fixedExpenses]);

  const canProceedStep3 = useCallback(() => {
    return !!formData.riskProfile;
  }, [formData.riskProfile]);

  const isStepValid = useCallback(() => {
    if (step === 1) return canProceedStep1();
    if (step === 2) return canProceedStep2();
    if (step === 3) return canProceedStep3();
    return false;
  }, [step, canProceedStep1, canProceedStep2, canProceedStep3]);

  const handleNext = useCallback(() => {
    if (isStepValid()) {
      setStep((prev) => Math.min(prev + 1, 3) as 1 | 2 | 3);
    }
  }, [isStepValid]);

  const handlePrevious = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1) as 1 | 2 | 3);
  }, []);

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

  const handleExpenseChange = useCallback((index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const updated = [...prev.fixedExpenses];
      if (field === 'amount') {
        updated[index].amount = typeof value === 'string' ? parseFloat(value) || 0 : value;
      } else {
        (updated[index] as Record<string, string | number>)[field] = value;
      }
      return { ...prev, fixedExpenses: updated };
    });
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <motion.div
      className="min-h-screen pb-20 px-4 sm:px-6 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={prefersReduced ? { duration: 0 } : { duration: 0.5 }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={prefersReduced ? {} : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className={cn(textColorVar('content-secondary'))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Kembali
            </Button>
            <span className={cn('text-sm font-medium', textColorVar('content-secondary'))}>
              Langkah {step} dari 3
            </span>
          </div>

          {/* Progress Bar */}
          <div className={cn('h-1 rounded-full overflow-hidden', bgColorVar('bg-neutral'))}>
            <motion.div
              className="h-full transition-all"
              style={{ background: 'var(--color-brand-primary)' }}
              initial={false}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={prefersReduced ? { duration: 0 } : { duration: 0.4 }}
            />
          </div>
        </motion.div>

        {/* Steps Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={prefersReduced ? { duration: 0 } : { duration: 0.4 }}
            >
              <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
                <CardHeader>
                  <CardTitle className={textColorVar('content-primary')}>
                    Detail Gaji Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Salary Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="salary-amount" className={textColorVar('content-primary')}>
                      Gaji Bulanan (Rp)
                    </Label>
                    <Input
                      id="salary-amount"
                      type="number"
                      placeholder="0"
                      min="0"
                      step="100000"
                      value={formData.salaryAmount || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          salaryAmount: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className={cn(
                        'text-lg font-semibold',
                        bgColorVar('bg-input'),
                        textColorVar('content-primary'),
                        borderColorVar('border-neutral')
                      )}
                    />
                    {formData.salaryAmount > 0 && (
                      <p className={cn('text-sm', textColorVar('content-secondary'))}>
                        {formatRupiah(formData.salaryAmount)}
                      </p>
                    )}
                  </div>

                  {/* Salary Date */}
                  <div className="space-y-2">
                    <Label htmlFor="salary-date" className={textColorVar('content-primary')}>
                      Tanggal Gajian (1-28)
                    </Label>
                    <Input
                      id="salary-date"
                      type="number"
                      placeholder="15"
                      min="1"
                      max="28"
                      value={formData.salaryDate}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(28, parseInt(e.target.value) || 1));
                        setFormData((prev) => ({
                          ...prev,
                          salaryDate: val,
                        }));
                      }}
                      className={cn(
                        'text-lg font-semibold',
                        bgColorVar('bg-input'),
                        textColorVar('content-primary'),
                        borderColorVar('border-neutral')
                      )}
                    />
                  </div>

                  {/* Validation Message */}
                  {!canProceedStep1() && (
                    <div className={cn('text-sm rounded p-3', bgColorVar('bg-neutral'))}>
                      <p className={textColorVar('content-secondary')}>
                        Masukkan gaji dan tanggal gajian yang valid
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={prefersReduced ? { duration: 0 } : { duration: 0.4 }}
            >
              <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
                <CardHeader>
                  <CardTitle className={textColorVar('content-primary')}>
                    Pengeluaran Tetap Bulanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.fixedExpenses.map((expense, index) => (
                    <motion.div
                      key={index}
                      layout
                      className="space-y-3 p-4 rounded-lg border"
                      style={{
                        borderColor: 'var(--color-border-neutral)',
                        backgroundColor: 'var(--color-bg-neutral)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('text-sm font-medium', textColorVar('content-secondary'))}>
                          Pengeluaran {index + 1}
                        </span>
                        {formData.fixedExpenses.length > 1 && (
                          <button
                            onClick={() => handleRemoveExpense(index)}
                            className={cn(
                              'p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition-colors',
                              textColorVar('content-secondary')
                            )}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className={cn('text-xs', textColorVar('content-secondary'))}>
                            Kategori
                          </Label>
                          <Input
                            placeholder="Sewa, Listrik, dll"
                            value={expense.category}
                            onChange={(e) =>
                              handleExpenseChange(index, 'category', e.target.value)
                            }
                            className={cn(
                              'text-sm',
                              bgColorVar('bg-input'),
                              textColorVar('content-primary'),
                              borderColorVar('border-neutral')
                            )}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className={cn('text-xs', textColorVar('content-secondary'))}>
                            Jumlah (Rp)
                          </Label>
                          <Input
                            type="number"
                            placeholder="0"
                            min="0"
                            step="10000"
                            value={expense.amount || ''}
                            onChange={(e) =>
                              handleExpenseChange(index, 'amount', e.target.value)
                            }
                            className={cn(
                              'text-sm',
                              bgColorVar('bg-input'),
                              textColorVar('content-primary'),
                              borderColorVar('border-neutral')
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className={cn('text-xs', textColorVar('content-secondary'))}>
                          Deskripsi (opsional)
                        </Label>
                        <Input
                          placeholder="Catatan..."
                          value={expense.description || ''}
                          onChange={(e) =>
                            handleExpenseChange(index, 'description', e.target.value)
                          }
                          className={cn(
                            'text-sm',
                            bgColorVar('bg-input'),
                            textColorVar('content-primary'),
                            borderColorVar('border-neutral')
                          )}
                        />
                      </div>
                    </motion.div>
                  ))}

                  {/* Add Expense Button */}
                  <button
                    onClick={handleAddExpense}
                    className={cn(
                      'w-full py-3 rounded-lg border-2 border-dashed transition-colors flex items-center justify-center gap-2',
                      'hover:bg-opacity-50',
                      textColorVar('content-secondary'),
                      borderColorVar('border-neutral')
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Pengeluaran
                  </button>

                  {/* Validation Message */}
                  {!canProceedStep2() && (
                    <div className={cn('text-sm rounded p-3', bgColorVar('bg-neutral'))}>
                      <p className={textColorVar('content-secondary')}>
                        Tambahkan minimal satu pengeluaran dengan nilai yang valid
                      </p>
                    </div>
                  )}

                  {/* Total Fixed */}
                  {canProceedStep2() && (
                    <div className={cn('p-3 rounded border-l-4 flex justify-between', bgColorVar('bg-neutral'))}>
                      <span className={cn('font-medium', textColorVar('content-primary'))}>
                        Total Pengeluaran Tetap:
                      </span>
                      <span className={cn('font-semibold', textColorVar('content-primary'))}>
                        {formatRupiah(formData.fixedExpenses.reduce((sum, e) => sum + e.amount, 0))}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={prefersReduced ? { duration: 0 } : { duration: 0.4 }}
            >
              <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
                <CardHeader>
                  <CardTitle className={textColorVar('content-primary')}>
                    Profil Risiko Anda
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className={cn('text-sm', textColorVar('content-secondary'))}>
                    Pilih preferensi risiko yang paling sesuai dengan gaya keuangan Anda:
                  </p>

                  {[
                    {
                      value: 'conservative' as const,
                      label: 'Konservatif',
                      description: 'Prioritaskan penghematan, alokasi fleksibel minimal',
                    },
                    {
                      value: 'moderate' as const,
                      label: 'Seimbang',
                      description: 'Keseimbangan antara penghematan dan pengeluaran fleksibel',
                    },
                    {
                      value: 'aggressive' as const,
                      label: 'Agresif',
                      description: 'Alokasi lebih besar untuk pengeluaran, mengurangi penghematan',
                    },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          riskProfile: option.value,
                        }))
                      }
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all',
                        formData.riskProfile === option.value
                          ? 'border-[var(--color-brand-primary)] bg-opacity-10'
                          : borderColorVar('border-neutral'),
                        bgColorVar('bg-neutral')
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                            formData.riskProfile === option.value
                              ? 'border-[var(--color-brand-primary)]'
                              : borderColorVar('border-neutral')
                          )}
                        >
                          {formData.riskProfile === option.value && (
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: 'var(--color-brand-primary)' }}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={cn('font-semibold', textColorVar('content-primary'))}>
                            {option.label}
                          </p>
                          <p className={cn('text-xs', textColorVar('content-secondary'))}>
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          className="mt-8 flex gap-3 justify-between"
          initial={prefersReduced ? {} : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.4, delay: 0.2 }}
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={step === 1}
            className={cn(
              'gap-2',
              step === 1 && 'opacity-50 cursor-not-allowed',
              bgColorVar('bg-card'),
              textColorVar('content-primary'),
              borderColorVar('border-neutral')
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Sebelumnya
          </Button>

          <div className="flex-1" />

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className={cn(
                'gap-2 text-white font-semibold',
                !isStepValid() && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                background: isStepValid() ? 'var(--color-brand-primary)' : 'var(--color-border-neutral)',
              }}
            >
              Berikutnya
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                // Step 3: Submit button will be wired to AI in Batch 2
                console.log('Form submitted:', formData);
              }}
              disabled={!isStepValid()}
              className={cn(
                'gap-2 text-white font-semibold px-8',
                !isStepValid() && 'opacity-50 cursor-not-allowed'
              )}
              style={{
                background: isStepValid() ? 'var(--color-brand-primary)' : 'var(--color-border-neutral)',
              }}
            >
              Hasilkan Anggaran
            </Button>
          )}
        </motion.div>

        {/* Step Indicator Text */}
        <motion.p
          className={cn('text-center text-sm mt-6', textColorVar('content-secondary'))}
          initial={prefersReduced ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
        >
          {step === 1 && 'Mulai dengan detail gaji Anda'}
          {step === 2 && 'Daftarkan semua pengeluaran tetap bulanan'}
          {step === 3 && 'Pilih profil risiko yang sesuai dengan Anda'}
        </motion.p>
      </div>
    </motion.div>
  );
}
