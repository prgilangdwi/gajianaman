import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import {
  Sparkles,
  Camera,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  ArrowLeftRight,
  PenLine,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useWallets } from '@/hooks/useWallets';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionForm } from '@/hooks/useTransactionForm';
import { TransactionForm } from './TransactionForm';
import { COPY } from '@/lib/copy';

const defaultCategories = [
  { id: 'Food & Dining', emoji: '🍔', label: 'Food', color: '#f59e0b' },
  { id: 'Transport', emoji: '🚗', label: 'Transport', color: '#3b82f6' },
  { id: 'Groceries', emoji: '🛒', label: 'Groceries', color: '#4AE54A' },
  { id: 'Shopping', emoji: '🛍️', label: 'Shopping', color: '#ec4899' },
  { id: 'Bills & Utilities', emoji: '📱', label: 'Bills', color: '#8b5cf6' },
  { id: 'Health', emoji: '🏥', label: 'Health', color: '#ef4444' },
  { id: 'Entertainment', emoji: '🎬', label: 'Entertain', color: '#f97316' },
  { id: 'Education', emoji: '📚', label: 'Education', color: '#06b6d4' },
];

type PhotoPhase = 'idle' | 'preview' | 'analyzing' | 'confirm' | 'error';
type TransactionType = 'pengeluaran' | 'pemasukan' | 'tabung' | 'transfer';
type InputMethod = 'ai' | 'foto' | 'manual';

interface ParsedTx {
  type: 'expense' | 'income' | 'savings' | 'transfer';
  amount: string;
  category?: string;
  note: string;
  date: string;
}

interface PhotoResult {
  amount: number;
  type: 'expense' | 'income';
  category: string;
  subcategory?: string;
  note: string;
  confidence: 'high' | 'medium' | 'low';
  raw_text?: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function TransactionModal({ isOpen, onClose, onSaved }: TransactionModalProps) {
  const { user } = useAuth();
  const { wallets } = useWallets(user?.userId);
  const { categories: dbCategories, isLoading: categoriesLoading } = useCategories('expense');
  const form = useTransactionForm();

  // Convert database categories to display format
  const displayCategories = dbCategories.length > 0
    ? dbCategories.map((cat) => ({
        id: cat.name,
        emoji: cat.icon || '📦',
        label: cat.name,
        color: cat.color,
      }))
    : defaultCategories;

  // Transaction type tab
  const [transactionType, setTransactionType] = useState<TransactionType>('pengeluaran');

  // Input method sub-tabs (for pengeluaran/pemasukan only)
  const [inputMethod, setInputMethod] = useState<InputMethod>('ai');

  // AI state
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTx | null>(null);

  // Photo state
  const [photoPhase, setPhotoPhase] = useState<PhotoPhase>('idle');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMediaType, setPhotoMediaType] = useState<string>('image/jpeg');
  const [photoResult, setPhotoResult] = useState<PhotoResult | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual entry state
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState('Food & Dining');
  const [manualNote, setManualNote] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);

  // Multi-transaction state
  const [isParsingMulti, setIsParsingMulti] = useState(false);
  const [multiInput, setMultiInput] = useState('');
  const [multiParsedTxs, setMultiParsedTxs] = useState<any[]>([]);
  const [multiError, setMultiError] = useState<string | null>(null);

  // Savings & transfer state
  const [allUserTags, setAllUserTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadTagSuggestions = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('transactions')
        .select('tags')
        .eq('user_id', user.userId)
        .not('tags', 'is', null);

      const allTags = new Set<string>();
      data?.forEach((tx: any) => {
        if (Array.isArray(tx.tags)) {
          tx.tags.forEach((tag: string) => allTags.add(tag));
        }
      });
      setAllUserTags(Array.from(allTags).sort());
    } catch {
      // Silently fail if tags column doesn't exist
    }
  };

  // ───── AI Parsing ─────
  const isMultiTransaction = (text: string) => {
    const amountRegex = /\b(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|mio)?\b/gi;
    const matches = text.match(amountRegex);
    return (matches && matches.length >= 2) || text.includes(',') || text.includes('\n');
  };

  const handleParseAI = async () => {
    if (!aiInput.trim()) return;
    console.log('[AI Parse] Starting with input:', aiInput);
    setIsParsingAI(true);
    setMultiError(null);
    setMultiParsedTxs([]);
    setParsedData(null);

    try {
      // Detect if it's a multi-transaction input
      const isMulti = isMultiTransaction(aiInput);
      console.log('[AI Parse] Is multi-transaction:', isMulti);

      if (isMulti) {
        // Use API for multi-transaction parsing
        console.log('[AI Parse] Calling /api/parse-multi');
        const res = await fetch('/api/parse-multi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiInput }),
        });

        console.log('[AI Parse] Response status:', res.status);
        const data = await res.json();
        console.log('[AI Parse] Response data:', data);

        if (data.error) {
          console.error('[AI Parse] API returned error:', data.error);
          setMultiError(data.error);
          return;
        }
        if (!data.transactions || data.transactions.length === 0) {
          console.warn('[AI Parse] No transactions in response');
          setMultiError('Tidak dapat menganalisis transaksi. Coba lagi dengan format yang lebih jelas.');
          return;
        }

        console.log('[AI Parse] Parsed transactions:', data.transactions);
        setMultiParsedTxs(data.transactions);
        return;
      }

      // Single transaction - use local parsing (fast)
      console.log('[AI Parse] Using local single-tx parser');
      const lower = aiInput.toLowerCase();
      let category = 'Shopping';
      let type: 'expense' | 'income' = transactionType === 'pemasukan' ? 'income' : 'expense';

      if (/makan|minum|kopi|resto|warung|cafe|nasi|soto|bakso|pizza|burger/.test(lower)) category = 'Food & Dining';
      else if (/bensin|parkir|gojek|grab|ojek|bus|krl|transjakarta|taxi/.test(lower)) category = 'Transport';
      else if (/indomaret|alfamart|supermarket|belanja|sayur|buah/.test(lower)) category = 'Groceries';
      else if (/listrik|air|pdam|wifi|internet|pulsa|data|gas/.test(lower)) category = 'Bills & Utilities';
      else if (/dokter|obat|apotek|rs|rumah sakit|klinik/.test(lower)) category = 'Health';
      else if (/netflix|spotify|bioskop|film|game|hiburan/.test(lower)) category = 'Entertainment';
      else if (/sekolah|kuliah|kursus|buku|les/.test(lower)) category = 'Education';

      const amountMatch = aiInput.match(/(\d[\d.,]*)\s*(juta|jt|mio|ribu|rb|k)\b/i);
      let parsedAmount = '0';
      if (amountMatch) {
        const raw = parseFloat(amountMatch[1].replace(/[.,]/g, ''));
        const suffix = amountMatch[2].toLowerCase();
        if (/^(juta|jt|mio)$/.test(suffix)) parsedAmount = String(raw * 1_000_000);
        else if (/^(ribu|rb|k)$/.test(suffix)) parsedAmount = String(raw * 1_000);
        else parsedAmount = String(raw);
      } else {
        const plainMatch = aiInput.match(/(\d[\d.,]*)/);
        if (plainMatch) parsedAmount = String(parseFloat(plainMatch[1].replace(/[.,]/g, '')));
      }

      const parsed = { type, amount: parsedAmount, category, note: aiInput, date: new Date().toISOString().split('T')[0] };
      console.log('[AI Parse] Parsed single transaction:', parsed);
      setParsedData(parsed);
      form.updateFromParsed(parsed);
    } catch (err) {
      console.error('[AI Parse] Error:', err);
      setMultiError('Terjadi error saat menganalisis transaksi');
    } finally {
      setIsParsingAI(false);
    }
  };

  // ───── Multi-Transaction Parsing ─────
  const handleParseMulti = async () => {
    if (!multiInput.trim()) return;
    setIsParsingMulti(true);
    setMultiError(null);
    try {
      console.log('[Multi Parse] Input:', multiInput);
      const res = await fetch('/api/parse-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: multiInput }),
      });
      console.log('[Multi Parse] Response status:', res.status);
      const data = await res.json();
      console.log('[Multi Parse] Response data:', data);
      if (data.error) {
        setMultiError(data.error);
        return;
      }
      if (!data.transactions || data.transactions.length === 0) {
        setMultiError('Tidak dapat menganalisis transaksi. Coba lagi dengan format yang lebih jelas.');
        return;
      }
      console.log('[Multi Parse] Parsed transactions:', data.transactions);
      setMultiParsedTxs(data.transactions);
    } catch (err) {
      console.error('[Multi Parse Error]', err);
      setMultiError('Terjadi error saat menganalisis transaksi');
    } finally {
      setIsParsingMulti(false);
    }
  };

  const handleSaveMultiTransaction = async (txIndex: number) => {
    if (!user || txIndex < 0 || txIndex >= multiParsedTxs.length) return;
    const tx = multiParsedTxs[txIndex];

    try {
      const payload: any = {
        user_id: user.userId,
        type: tx.type || 'expense',
        amount: Number(tx.amount || 0),
        category: tx.category || 'Other',
        subcategory: tx.subcategory || null,
        note: tx.note || 'Transaksi',
        date: tx.date === 'today' ? new Date().toISOString().split('T')[0] : tx.date,
      };

      const res = await supabase.from('transactions').insert([payload]);
      if (res.error) throw res.error;

      toast.success(`${tx.note} — Rp ${Number(tx.amount || 0).toLocaleString('id-ID')} berhasil dicatat`);

      // Remove from pending list
      setMultiParsedTxs((prev) => prev.filter((_, i) => i !== txIndex));

      if (multiParsedTxs.length === 1) {
        // Last transaction saved
        onSaved?.();
        onClose();
      }
    } catch (err) {
      console.error('[Save Multi Error]', err);
      toast.error('Gagal menyimpan transaksi');
    }
  };

  const handleSaveAllMulti = async () => {
    if (!user || multiParsedTxs.length === 0) return;
    setIsSaving(true);
    let successCount = 0;

    try {
      const payloads = multiParsedTxs.map((tx) => ({
        user_id: user.userId,
        type: tx.type || 'expense',
        amount: Number(tx.amount || 0),
        category: tx.category || 'Other',
        subcategory: tx.subcategory || null,
        note: tx.note || 'Transaksi',
        date: tx.date === 'today' ? new Date().toISOString().split('T')[0] : (tx.date === 'yesterday' ? new Date(Date.now() - 86400000).toISOString().split('T')[0] : tx.date),
      }));

      const res = await supabase.from('transactions').insert(payloads);
      if (res.error) throw res.error;

      successCount = payloads.length;
      toast.success(`✅ ${successCount} transaksi berhasil dicatat`);
      setMultiParsedTxs([]);
      setMultiInput('');
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('[Save All Multi Error]', err);
      toast.error(`Gagal menyimpan transaksi. ${successCount} dari ${multiParsedTxs.length} tersimpan.`);
    } finally {
      setIsSaving(false);
    }
  };

  // ───── Photo Handling ─────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 5MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPhotoPreviewUrl(objectUrl);
    setPhotoMediaType(file.type || 'image/jpeg');
    setPhotoPhase('preview');

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async () => {
    if (!photoBase64) return;
    setPhotoPhase('analyzing');
    setPhotoError(null);

    try {
      const res = await fetch('/api/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoBase64, mediaType: photoMediaType }),
      });
      const data = await res.json();

      if (data.error) {
        setPhotoError(data.error);
        setPhotoPhase('error');
        return;
      }

      setPhotoResult(data as PhotoResult);
      form.updateFromParsed({
        amount: String(data.amount ?? ''),
        category: data.category ?? '',
        note: data.note ?? '',
        type: data.type ?? 'expense',
      });
      setPhotoPhase('confirm');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghubungi server';
      setPhotoError(errorMsg);
      setPhotoPhase('error');
    }
  };

  const resetPhoto = () => {
    setPhotoPhase('idle');
    setPhotoPreviewUrl(null);
    setPhotoBase64(null);
    setPhotoResult(null);
    setPhotoError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ───── Saving ─────
  const handleSave = async () => {
    if (!user) return;

    // For manual entry, populate form first
    if (inputMethod === 'manual' && (transactionType === 'pengeluaran' || transactionType === 'pemasukan')) {
      form.setAmount(manualAmount);
      form.setCategory(manualCategory);
      form.setNote(manualNote);
      form.setDate(manualDate);
      form.setType(transactionType === 'pengeluaran' ? 'expense' : 'income');
    }

    const validation = form.validate();
    if (!validation.valid) {
      validation.errors.forEach((err) => toast.error(err));
      return;
    }

    setIsSaving(true);
    try {
      const insertData = {
        user_id: user.userId,
        type: form.form.type,
        amount: Number(form.form.amount),
        category: form.form.category,
        subcategory: form.form.subcategory || null,
        note: form.form.note || null,
        date: form.form.date,
        wallet_id: form.form.sourceWalletId || null,
        tags: form.form.tags.length > 0 ? form.form.tags : null,
        ...(form.form.type === 'transfer' && {
          wallet_destination_id: form.form.destinationWalletId || null,
        }),
      };

      const { error } = await supabase.from('transactions').insert(insertData);

      if (error) {
        toast.error('Gagal menyimpan: ' + error.message);
        return;
      }

      toast.success(COPY.success.transactionAdded);
      onSaved?.();
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = useCallback(() => {
    setAiInput('');
    setParsedData(null);
    resetPhoto();
    setManualAmount('');
    setManualCategory('Food & Dining');
    setManualNote('');
    setManualDate(new Date().toISOString().split('T')[0]);
    form.reset();
    setTransactionType('pengeluaran');
    setInputMethod('ai');
    onClose();
  }, [onClose, form]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen) {
      loadTagSuggestions();
    }
  }, [isOpen]);

  const confidenceColor = { high: 'text-green-600', medium: 'text-yellow-600', low: 'text-red-500' };
  const confidenceLabel = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

  const shouldShowSaveButton = () => {
    if (transactionType === 'pengeluaran' || transactionType === 'pemasukan') {
      if (inputMethod === 'ai') return !!parsedData || multiParsedTxs.length > 0;
      if (inputMethod === 'foto') return photoPhase === 'confirm';
      if (inputMethod === 'manual') return true;
    }
    return true; // tabung and transfer always show save button
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Tambah Transaksi</DialogTitle>
        </DialogHeader>

        {/* ═══ TRANSACTION TYPE TABS ═══ */}
        <Tabs
          value={transactionType}
          onValueChange={(v) => {
            setTransactionType(v as TransactionType);
            setInputMethod('ai'); // reset input method
            setParsedData(null);
            resetPhoto();
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 gap-1.5 bg-transparent p-0">
            <TabsTrigger value="pengeluaran" className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 sm:py-3 sm:px-2 rounded-lg sm:rounded-xl border-2 border-[var(--color-border-neutral)] w-full aspect-square text-xs font-medium hover:border-[var(--color-border-neutral)] data-[state=active]:border-[var(--color-sentiment-negative)] data-[state=active]:bg-[var(--color-sentiment-negative)]/10 transition-colors">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-sentiment-negative)]" />
              <span className="leading-tight text-[10px] sm:text-xs">Pengeluaran</span>
            </TabsTrigger>
            <TabsTrigger value="pemasukan" className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 sm:py-3 sm:px-2 rounded-lg sm:rounded-xl border-2 border-[var(--color-border-neutral)] w-full aspect-square text-xs font-medium hover:border-[var(--color-border-neutral)] data-[state=active]:border-[var(--color-sentiment-positive)] data-[state=active]:bg-[var(--color-sentiment-positive)]/10 transition-colors">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-sentiment-positive)]" />
              <span className="leading-tight text-[10px] sm:text-xs">Pemasukan</span>
            </TabsTrigger>
            <TabsTrigger value="tabung" className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 sm:py-3 sm:px-2 rounded-lg sm:rounded-xl border-2 border-[var(--color-border-neutral)] w-full aspect-square text-xs font-medium hover:border-[var(--color-border-neutral)] data-[state=active]:border-[var(--color-brand-primary)] data-[state=active]:bg-[var(--color-brand-primary)]/10 transition-colors">
              <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-brand-primary)]" />
              <span className="leading-tight text-[10px] sm:text-xs">Tabung</span>
            </TabsTrigger>
            <TabsTrigger value="transfer" className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 sm:py-3 sm:px-2 rounded-lg sm:rounded-xl border-2 border-[var(--color-border-neutral)] w-full aspect-square text-xs font-medium hover:border-[var(--color-border-neutral)] data-[state=active]:border-[var(--color-sentiment-warning)] data-[state=active]:bg-[var(--color-sentiment-warning)]/10 transition-colors">
              <ArrowLeftRight className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-sentiment-warning)]" />
              <span className="leading-tight text-[10px] sm:text-xs">Transfer</span>
            </TabsTrigger>
          </TabsList>

          {/* ═══ PENGELUARAN ═══ */}
          <TabsContent value="pengeluaran" className="space-y-4 mt-6">
            {/* Sub-tabs for input method */}
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as InputMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai" className="gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">AI</span>
                </TabsTrigger>
                <TabsTrigger value="foto" className="gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Foto</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-1">
                  <PenLine className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Manual</span>
                </TabsTrigger>
              </TabsList>

              {/* AI Sub-tab */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                {multiError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>{multiError}</div>
                  </div>
                )}
                {multiParsedTxs.length === 0 && !parsedData ? (
                  <div className="space-y-3">
                    <Label htmlFor="ai-input-pengeluaran" className="font-body">Ketik bebas (satu atau banyak transaksi), AI akan parsing untuk kamu</Label>
                    <Textarea
                      id="ai-input-pengeluaran"
                      placeholder="Contoh:&#10;beli kopi 25rb tadi pagi&#10;atau:&#10;makan soto 50k 17 mei, isi bensin 100k hari ini, dari Adi 50rb"
                      className="min-h-[120px] resize-none"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      aria-describedby="ai-hint-pengeluaran"
                    />
                    <Button
                      onClick={handleParseAI}
                      disabled={isParsingAI || !aiInput.trim()}
                      className="w-full bg-primary hover:bg-primary-dark"
                    >
                      {isParsingAI ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menganalisis...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" />Analisis Transaksi</>
                      )}
                    </Button>
                  </div>
                ) : multiParsedTxs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-sm font-semibold text-primary mb-3">🗒 {multiParsedTxs.length} transaksi terdeteksi:</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {multiParsedTxs.map((tx, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50 text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{tx.note}</p>
                              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                <span>💰 Rp {(tx.amount || 0).toLocaleString('id-ID')}</span>
                                <span>📂 {tx.category}</span>
                                <span>📅 {tx.date === 'today' ? 'Hari ini' : tx.date}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveAllMulti}
                        disabled={isSaving}
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4" />Simpan Semua</>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setMultiParsedTxs([]);
                          setAiInput('');
                          setMultiError(null);
                        }}
                        variant="outline"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : parsedData ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-2">
                      <p className="text-sm font-semibold text-primary">Hasil Analisis:</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground font-body">Tipe:</span> <span className="font-medium capitalize">{form.form.type}</span></p>
                        <p><span className="text-muted-foreground font-body">Jumlah:</span> <span className="font-mono font-semibold">Rp {Number(form.form.amount).toLocaleString('id-ID')}</span></p>
                        <p><span className="text-muted-foreground font-body">Kategori:</span> <span className="font-medium">{displayCategories.find((c) => c.id === form.form.category)?.emoji} {form.form.category}</span></p>
                      </div>
                    </div>
                    <TransactionForm
                      form={form.form}
                      onAmountChange={form.setAmount}
                      onCategoryChange={form.setCategory}
                      onNoteChange={form.setNote}
                      onTypeChange={form.setType}
                      onDateChange={form.setDate}
                      onSourceWalletChange={form.setSourceWalletId}
                      onAddTag={form.addTag}
                      onRemoveTag={form.removeTag}
                      wallets={wallets}
                      tagSuggestions={allUserTags}
                      showType={false}
                      showDate={true}
                      showWallet={true}
                      expenseCategories={displayCategories}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setParsedData(null);
                        setAiInput('');
                      }}
                    >
                      ← Kembali ke Input
                    </Button>
                  </div>
                ) : null}
              </TabsContent>

              {/* Foto Sub-tab */}
              <TabsContent value="foto" className="space-y-4 mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {photoPhase === 'idle' && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-semibold tracking-tight">Upload foto struk atau bukti bayar</p>
                      <p className="text-sm text-muted-foreground font-body">Struk belanja, screenshot transfer, e-wallet, GoFood, dll.</p>
                    </div>

                    <div className="w-full p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <p className="text-xs font-semibold text-blue-900 mb-2">💡 Tips untuk hasil terbaik:</p>
                      <ul className="text-xs text-blue-800 space-y-1 font-body">
                        <li>• Foto jelas dan tidak blur</li>
                        <li>• Jumlah uang terlihat jelas di struk</li>
                        <li>• Cahaya cukup, hindari silau/bayangan</li>
                      </ul>
                    </div>

                    <div className="flex gap-3 w-full">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 h-11"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.removeAttribute('capture');
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        🖼️ Galeri
                      </Button>
                      <Button
                        className="flex-1 gap-2 h-11 bg-primary hover:bg-primary-dark"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.setAttribute('capture', 'environment');
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        📷 Kamera
                      </Button>
                    </div>
                  </div>
                )}

                {(photoPhase === 'preview' || photoPhase === 'analyzing') && photoPreviewUrl && (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                      <img src={photoPreviewUrl} alt="Preview" className="w-full max-h-48 object-contain" />
                      {photoPhase === 'preview' && (
                        <button
                          onClick={resetPhoto}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                          title="Pilih foto lain"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {photoPhase === 'analyzing' && (
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <div className="text-center">
                            <p className="text-sm font-semibold">Menganalisis foto...</p>
                            <p className="text-xs text-muted-foreground mt-1">Sedang membaca struk</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {photoPhase === 'preview' && (
                      <Button
                        onClick={handleAnalyzePhoto}
                        className="w-full h-11 bg-primary hover:bg-primary-dark gap-2"
                      >
                        <Zap className="w-4 h-4" /> Parsing dengan AI
                      </Button>
                    )}
                  </div>
                )}

                {photoPhase === 'confirm' && photoResult && (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-start gap-3">
                        {photoPreviewUrl && (
                          <img src={photoPreviewUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-primary/30 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <p className="font-semibold text-sm text-primary">Transaksi terdeteksi</p>
                          </div>
                          <p className={`text-xs font-medium ${
                            photoResult.confidence === 'high' ? 'text-green-600' :
                            photoResult.confidence === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            Akurasi {confidenceLabel[photoResult.confidence]}
                          </p>
                        </div>
                      </div>
                    </div>

                    {photoResult.confidence === 'low' && (
                      <div className="flex gap-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-yellow-900 mb-0.5">Akurasi rendah</p>
                          <p className="text-xs text-yellow-700 font-body">Mohon periksa semua data di bawah sebelum menyimpan</p>
                        </div>
                      </div>
                    )}

                    <TransactionForm
                      form={form.form}
                      onAmountChange={form.setAmount}
                      onCategoryChange={form.setCategory}
                      onNoteChange={form.setNote}
                      onTypeChange={form.setType}
                      onDateChange={form.setDate}
                      onSourceWalletChange={form.setSourceWalletId}
                      onAddTag={form.addTag}
                      onRemoveTag={form.removeTag}
                      wallets={wallets}
                      tagSuggestions={allUserTags}
                      showType={true}
                      showDate={false}
                      showWallet={true}
                      expenseCategories={displayCategories}
                    />

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={resetPhoto}
                    >
                      ← Pilih Foto Lain
                    </Button>
                  </div>
                )}

                {photoPhase === 'error' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center border border-red-200">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-semibold text-red-900">Gagal membaca struk</p>
                        <p className="text-xs text-red-700 font-body">{photoError || 'Coba lagi dengan foto yang lebih jelas'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPhotoPhase('preview')}
                        variant="outline"
                        className="flex-1"
                      >
                        ← Kembali
                      </Button>
                      <Button
                        onClick={handleAnalyzePhoto}
                        className="flex-1 gap-2 bg-primary hover:bg-primary-dark"
                      >
                        🔄 Coba Lagi
                      </Button>
                    </div>

                    <Button
                      onClick={() => {
                        resetPhoto();
                        setInputMethod('ai');
                      }}
                      variant="ghost"
                      className="w-full text-muted-foreground"
                    >
                      Masuk manual saja
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Manual Sub-tab */}
              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="manual-amount" className="font-semibold mb-2 block">Jumlah (Rp)</Label>
                    <Input
                      id="manual-amount"
                      type="number"
                      placeholder="0"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="font-mono"
                      aria-label="Jumlah uang transaksi"
                    />
                  </div>

                  <div>
                    <Label htmlFor="manual-category" className="font-semibold mb-2 block">Kategori</Label>
                    <select
                      id="manual-category"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-label="Pilih kategori transaksi"
                    >
                      {displayCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.emoji} {cat.id}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="manual-note" className="font-semibold mb-2 block">Catatan</Label>
                    <Textarea
                      id="manual-note"
                      placeholder="Deskripsi transaksi..."
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      className="resize-none"
                      aria-label="Catatan atau deskripsi transaksi"
                    />
                  </div>

                  <div>
                    <Label htmlFor="manual-date" className="font-semibold mb-2 block">Tanggal</Label>
                    <Input
                      id="manual-date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      aria-label="Tanggal transaksi"
                    />
                  </div>
                </div>
              </TabsContent>

            </Tabs>
          </TabsContent>

          {/* ═══ PEMASUKAN ═══ */}
          <TabsContent value="pemasukan" className="space-y-4 mt-6">
            {/* Sub-tabs for input method */}
            <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as InputMethod)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ai" className="gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">AI</span>
                </TabsTrigger>
                <TabsTrigger value="foto" className="gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Foto</span>
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-1">
                  <PenLine className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Manual</span>
                </TabsTrigger>
              </TabsList>

              {/* AI Sub-tab */}
              <TabsContent value="ai" className="space-y-4 mt-4">
                {multiError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>{multiError}</div>
                  </div>
                )}
                {multiParsedTxs.length === 0 && !parsedData ? (
                  <div className="space-y-3">
                    <Label className="font-body">Ketik bebas (satu atau banyak transaksi), AI akan parsing untuk kamu</Label>
                    <Textarea
                      placeholder="Contoh:&#10;gajian 5 juta bulan ini&#10;atau:&#10;gajian 5jt, freelance 1jt, bonus 500k"
                      className="min-h-[120px] resize-none"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                    />
                    <Button
                      onClick={handleParseAI}
                      disabled={isParsingAI || !aiInput.trim()}
                      className="w-full bg-primary hover:bg-primary-dark"
                    >
                      {isParsingAI ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menganalisis...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" />Analisis Transaksi</>
                      )}
                    </Button>
                  </div>
                ) : multiParsedTxs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <p className="text-sm font-semibold text-primary mb-3">🗒 {multiParsedTxs.length} transaksi terdeteksi:</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {multiParsedTxs.map((tx, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50 text-sm">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{tx.note}</p>
                              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                <span>💰 Rp {(tx.amount || 0).toLocaleString('id-ID')}</span>
                                <span>📂 {tx.category}</span>
                                <span>📅 {tx.date === 'today' ? 'Hari ini' : tx.date}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveAllMulti}
                        disabled={isSaving}
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isSaving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4" />Simpan Semua</>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setMultiParsedTxs([]);
                          setAiInput('');
                          setMultiError(null);
                        }}
                        variant="outline"
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : parsedData ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-2">
                      <p className="text-sm font-semibold text-primary">Hasil Analisis:</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground font-body">Tipe:</span> <span className="font-medium capitalize">Pemasukan</span></p>
                        <p><span className="text-muted-foreground font-body">Jumlah:</span> <span className="font-mono font-semibold">Rp {Number(form.form.amount).toLocaleString('id-ID')}</span></p>
                      </div>
                    </div>
                    <TransactionForm
                      form={form.form}
                      onAmountChange={form.setAmount}
                      onCategoryChange={form.setCategory}
                      onNoteChange={form.setNote}
                      onTypeChange={form.setType}
                      onDateChange={form.setDate}
                      onSourceWalletChange={form.setSourceWalletId}
                      onAddTag={form.addTag}
                      onRemoveTag={form.removeTag}
                      wallets={wallets}
                      tagSuggestions={allUserTags}
                      showType={false}
                      showDate={true}
                      showWallet={true}
                      incomeCategories={displayCategories}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setParsedData(null);
                        setAiInput('');
                      }}
                    >
                      ← Kembali ke Input
                    </Button>
                  </div>
                ) : null}
              </TabsContent>

              {/* Foto Sub-tab - similar to pengeluaran */}
              <TabsContent value="foto" className="space-y-4 mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {photoPhase === 'idle' && (
                  <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-semibold tracking-tight">Upload bukti pemasukan</p>
                      <p className="text-sm text-muted-foreground font-body">Slip gajian, bukti transfer, invoice, dll.</p>
                    </div>

                    <div className="flex gap-3 w-full">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2 h-11"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.removeAttribute('capture');
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        🖼️ Galeri
                      </Button>
                      <Button
                        className="flex-1 gap-2 h-11 bg-primary hover:bg-primary-dark"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.setAttribute('capture', 'environment');
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        📷 Kamera
                      </Button>
                    </div>
                  </div>
                )}

                {(photoPhase === 'preview' || photoPhase === 'analyzing') && photoPreviewUrl && (
                  <div className="space-y-4">
                    <div className="relative rounded-xl overflow-hidden border border-border bg-muted">
                      <img src={photoPreviewUrl} alt="Preview" className="w-full max-h-48 object-contain" />
                      {photoPhase === 'preview' && (
                        <button
                          onClick={resetPhoto}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      {photoPhase === 'analyzing' && (
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm font-semibold">Menganalisis...</p>
                        </div>
                      )}
                    </div>

                    {photoPhase === 'preview' && (
                      <Button
                        onClick={handleAnalyzePhoto}
                        className="w-full h-11 bg-primary hover:bg-primary-dark gap-2"
                      >
                        <Zap className="w-4 h-4" /> Parsing dengan AI
                      </Button>
                    )}
                  </div>
                )}

                {photoPhase === 'confirm' && photoResult && (
                  <div className="space-y-4">
                    <TransactionForm
                      form={form.form}
                      onAmountChange={form.setAmount}
                      onCategoryChange={form.setCategory}
                      onNoteChange={form.setNote}
                      onTypeChange={form.setType}
                      onDateChange={form.setDate}
                      onSourceWalletChange={form.setSourceWalletId}
                      onAddTag={form.addTag}
                      onRemoveTag={form.removeTag}
                      wallets={wallets}
                      tagSuggestions={allUserTags}
                      showType={true}
                      showDate={false}
                      showWallet={true}
                      incomeCategories={displayCategories}
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={resetPhoto}
                    >
                      ← Pilih Foto Lain
                    </Button>
                  </div>
                )}

                {photoPhase === 'error' && (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                      </div>
                      <p className="font-semibold text-red-900">Gagal membaca foto</p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => setPhotoPhase('preview')} variant="outline" className="flex-1">
                        ← Kembali
                      </Button>
                      <Button onClick={handleAnalyzePhoto} className="flex-1 bg-primary hover:bg-primary-dark">
                        🔄 Coba Lagi
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Manual Sub-tab */}
              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="income-amount" className="font-semibold mb-2 block">Jumlah (Rp)</Label>
                    <Input
                      id="income-amount"
                      type="number"
                      placeholder="0"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label htmlFor="income-note" className="font-semibold mb-2 block">Sumber Pemasukan</Label>
                    <Textarea
                      id="income-note"
                      placeholder="e.g. Gajian, Freelance, Bonus, dll."
                      value={manualNote}
                      onChange={(e) => setManualNote(e.target.value)}
                      className="resize-none"
                    />
                  </div>

                  <div>
                    <Label htmlFor="income-date" className="font-semibold mb-2 block">Tanggal</Label>
                    <Input
                      id="income-date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* ═══ TABUNG (Savings) ═══ */}
          <TabsContent value="tabung" className="space-y-6 mt-6">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-body">Catat penambahan tabungan atau investasi kamu di sini.</p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tabung-amount" className="font-semibold mb-2 block">Jumlah (Rp)</Label>
                <Input
                  id="tabung-amount"
                  type="number"
                  placeholder="0"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="tabung-goal" className="font-semibold mb-2 block">Tujuan/Goal</Label>
                <select
                  id="tabung-goal"
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>Pilih goal...</option>
                  <option>Liburan</option>
                  <option>Rumah</option>
                </select>
              </div>

              <div>
                <Label htmlFor="tabung-date" className="font-semibold mb-2 block">Tanggal</Label>
                <Input
                  id="tabung-date"
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* ═══ TRANSFER ═══ */}
          <TabsContent value="transfer" className="space-y-6 mt-6">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm text-blue-700 font-body">Transfer uang antar wallet kamu untuk manajemen yang lebih baik.</p>
            </div>
            <TransactionForm
              form={form.form}
              onAmountChange={form.setAmount}
              onCategoryChange={form.setCategory}
              onNoteChange={form.setNote}
              onTypeChange={form.setType}
              onDateChange={form.setDate}
              onSourceWalletChange={form.setSourceWalletId}
              onDestinationWalletChange={form.setDestinationWalletId}
              onAddTag={form.addTag}
              onRemoveTag={form.removeTag}
              wallets={wallets}
              tagSuggestions={allUserTags}
              showType={false}
              showDate={true}
              showWallet={false}
              sourceWalletLabel="Dari wallet"
              destinationWalletLabel="Ke wallet"
              expenseCategories={displayCategories}
            />
          </TabsContent>
        </Tabs>

        {/* Save button */}
        {shouldShowSaveButton() && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 bg-primary hover:bg-primary-dark mt-6"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
            ) : (
              'Simpan Transaksi'
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
