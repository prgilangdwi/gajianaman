import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Zap, Camera, Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { COPY } from '@/lib/copy';

const categories = [
  { id: 'Food & Dining', emoji: '🍔', label: 'Food', color: '#f59e0b' },
  { id: 'Transport', emoji: '🚗', label: 'Transport', color: '#3b82f6' },
  { id: 'Groceries', emoji: '🛒', label: 'Groceries', color: '#4AE54A' },
  { id: 'Shopping', emoji: '🛍️', label: 'Shopping', color: '#ec4899' },
  { id: 'Bills & Utilities', emoji: '📱', label: 'Bills', color: '#8b5cf6' },
  { id: 'Health', emoji: '🏥', label: 'Health', color: '#ef4444' },
  { id: 'Entertainment', emoji: '🎬', label: 'Entertain', color: '#f97316' },
  { id: 'Education', emoji: '📚', label: 'Education', color: '#06b6d4' },
];

type PhotoPhase = 'idle' | 'preview' | 'analyzing' | 'confirm';

interface ParsedTx {
  type: 'expense' | 'income';
  amount: string;
  category: string;
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
  const [activeTab, setActiveTab] = useState('ai');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTx | null>(null);

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Photo tab state
  const [photoPhase, setPhotoPhase] = useState<PhotoPhase>('idle');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMediaType, setPhotoMediaType] = useState<string>('image/jpeg');
  const [photoResult, setPhotoResult] = useState<PhotoResult | null>(null);
  const [photoAmount, setPhotoAmount] = useState('');
  const [photoCategory, setPhotoCategory] = useState('');
  const [photoNote, setPhotoNote] = useState('');
  const [photoType, setPhotoType] = useState<'expense' | 'income'>('expense');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParseAI = async () => {
    if (!aiInput.trim()) return;
    setIsParsingAI(true);
    try {
      const lower = aiInput.toLowerCase();
      let category = 'Shopping';
      let type: 'expense' | 'income' = 'expense';

      if (/makan|minum|kopi|resto|warung|cafe|nasi|soto|bakso|pizza|burger/.test(lower)) category = 'Food & Dining';
      else if (/bensin|parkir|gojek|grab|ojek|bus|krl|transjakarta|taxi/.test(lower)) category = 'Transport';
      else if (/indomaret|alfamart|supermarket|belanja|sayur|buah/.test(lower)) category = 'Groceries';
      else if (/listrik|air|pdam|wifi|internet|pulsa|data|gas/.test(lower)) category = 'Bills & Utilities';
      else if (/dokter|obat|apotek|rs|rumah sakit|klinik/.test(lower)) category = 'Health';
      else if (/netflix|spotify|bioskop|film|game|hiburan/.test(lower)) category = 'Entertainment';
      else if (/sekolah|kuliah|kursus|buku|les/.test(lower)) category = 'Education';
      if (/gaji|salary|income|pemasukan|transfer masuk|dapat/.test(lower)) type = 'income';

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

      setParsedData({ type, amount: parsedAmount, category, note: aiInput, date: new Date().toISOString().split('T')[0] });
    } finally {
      setIsParsingAI(false);
    }
  };

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
      // Strip "data:image/...;base64," prefix
      setPhotoBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzePhoto = async () => {
    if (!photoBase64) return;
    setPhotoPhase('analyzing');

    try {
      const res = await fetch('/api/parse-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoBase64, mediaType: photoMediaType }),
      });
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        setPhotoPhase('preview');
        return;
      }

      setPhotoResult(data as PhotoResult);
      setPhotoAmount(String(data.amount ?? ''));
      setPhotoCategory(data.category ?? '');
      setPhotoNote(data.note ?? '');
      setPhotoType(data.type ?? 'expense');
      setPhotoPhase('confirm');
    } catch {
      toast.error('Gagal menghubungi server. Coba lagi.');
      setPhotoPhase('preview');
    }
  };

  const resetPhoto = () => {
    setPhotoPhase('idle');
    setPhotoPreviewUrl(null);
    setPhotoBase64(null);
    setPhotoResult(null);
    setPhotoAmount('');
    setPhotoCategory('');
    setPhotoNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!user) return;

    let txData: { type: string; amount: number; category: string; note?: string; date: string };

    if (activeTab === 'ai' && parsedData) {
      txData = { type: parsedData.type, amount: Number(parsedData.amount), category: parsedData.category, note: parsedData.note, date: parsedData.date };
    } else if (activeTab === 'foto' && photoPhase === 'confirm') {
      if (!photoAmount || !photoCategory) {
        toast.error('Mohon lengkapi jumlah dan kategori');
        return;
      }
      txData = { type: photoType, amount: Number(photoAmount), category: photoCategory, note: photoNote || undefined, date: new Date().toISOString().split('T')[0] };
    } else {
      if (!amount || !selectedCategory) {
        toast.error('Mohon lengkapi jumlah dan kategori');
        return;
      }
      txData = { type: transactionType, amount: Number(amount), category: selectedCategory, note: note || undefined, date };
    }

    if (txData.amount <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('transactions').insert({ user_id: user.userId, ...txData });
    setIsSaving(false);

    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
      return;
    }

    toast.success(COPY.success.transactionAdded);
    onSaved?.();
    handleClose();
  };

  const handleClose = () => {
    setAiInput('');
    setParsedData(null);
    setAmount('');
    setSelectedCategory('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    resetPhoto();
    setActiveTab('ai');
    onClose();
  };

  const confidenceColor = { high: 'text-green-600', medium: 'text-yellow-600', low: 'text-red-500' };
  const confidenceLabel = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">Tambah Transaksi</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); }} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              AI Input
            </TabsTrigger>
            <TabsTrigger value="foto" className="gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Foto
            </TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>

          {/* ── AI Tab ── */}
          <TabsContent value="ai" className="space-y-4 mt-6">
            <div className="space-y-3">
              <Label className="font-body">Ketik bebas, AI akan parsing untuk kamu</Label>
              <Textarea
                placeholder="contoh: beli kopi 25rb tadi pagi"
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
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" />Parse dengan AI</>
                )}
              </Button>
            </div>

            {parsedData && (
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-2">
                <p className="text-sm font-semibold text-primary">Hasil Parsing:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground font-body">Tipe:</span> <span className="font-medium capitalize">{parsedData.type}</span></p>
                  <p><span className="text-muted-foreground font-body">Jumlah:</span> <span className="font-mono font-semibold">Rp {Number(parsedData.amount).toLocaleString('id-ID')}</span></p>
                  <p><span className="text-muted-foreground font-body">Kategori:</span> <span className="font-medium">{categories.find((c) => c.id === parsedData.category)?.emoji} {parsedData.category}</span></p>
                  <p><span className="text-muted-foreground font-body">Catatan:</span> <span className="font-medium">{parsedData.note}</span></p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Foto Tab ── */}
          <TabsContent value="foto" className="space-y-4 mt-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* IDLE — pick photo */}
            {photoPhase === 'idle' && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="font-semibold tracking-tight">Upload foto struk atau bukti bayar</p>
                  <p className="text-sm text-muted-foreground font-body">Struk belanja, screenshot transfer, e-wallet, GoFood, dll.</p>
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

            {/* PREVIEW — show image, ask to analyze */}
            {(photoPhase === 'preview' || photoPhase === 'analyzing') && photoPreviewUrl && (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={photoPreviewUrl} alt="Preview" className="w-full max-h-48 object-contain bg-muted" />
                  {photoPhase === 'preview' && (
                    <button
                      onClick={resetPhoto}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {photoPhase === 'analyzing' && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm font-semibold">Menganalisis foto...</p>
                    </div>
                  )}
                </div>

                {photoPhase === 'preview' && (
                  <Button
                    onClick={handleAnalyzePhoto}
                    className="w-full h-11 bg-primary hover:bg-primary-dark"
                  >
                    🔍 Analisis Foto
                  </Button>
                )}
              </div>
            )}

            {/* CONFIRM — show extracted data, allow editing */}
            {photoPhase === 'confirm' && photoResult && (
              <div className="space-y-4">
                {/* Thumbnail + confidence badge */}
                <div className="flex items-center gap-3">
                  {photoPreviewUrl && (
                    <img src={photoPreviewUrl} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-border flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <p className="font-semibold text-sm truncate">{photoResult.raw_text || 'Transaksi terdeteksi'}</p>
                    </div>
                    <p className={`text-xs mt-0.5 ${confidenceColor[photoResult.confidence]}`}>
                      Akurasi {confidenceLabel[photoResult.confidence]}
                      {photoResult.confidence === 'low' && ' — periksa data di bawah'}
                    </p>
                  </div>
                  <button onClick={resetPhoto} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {photoResult.confidence === 'low' && (
                  <div className="flex gap-2 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                    <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 font-body leading-relaxed">Akurasi rendah — mohon periksa dan edit data sebelum menyimpan.</p>
                  </div>
                )}

                {/* Editable fields */}
                <div className="space-y-1">
                  <Label>Tipe</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={photoType === 'expense' ? 'default' : 'outline'} className="flex-1 h-9" onClick={() => setPhotoType('expense')}>Pengeluaran</Button>
                    <Button type="button" variant={photoType === 'income' ? 'default' : 'outline'} className="flex-1 h-9" onClick={() => setPhotoType('income')}>Pemasukan</Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Jumlah</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-mono font-semibold text-muted-foreground">Rp</span>
                    <Input
                      type="text"
                      className="pl-14 text-2xl font-mono font-bold h-14"
                      value={Number(photoAmount).toLocaleString('id-ID')}
                      onChange={(e) => setPhotoAmount(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Kategori</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setPhotoCategory(cat.id)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                          photoCategory === cat.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-xl">{cat.emoji}</span>
                        <span className="text-[9px] font-medium text-center leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Catatan</Label>
                  <Input
                    placeholder="Catatan transaksi..."
                    value={photoNote}
                    onChange={(e) => setPhotoNote(e.target.value)}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Manual Tab ── */}
          <TabsContent value="manual" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Button type="button" variant={transactionType === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => setTransactionType('expense')}>
                Pengeluaran
              </Button>
              <Button type="button" variant={transactionType === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => setTransactionType('income')}>
                Pemasukan
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Jumlah</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono font-semibold text-muted-foreground">Rp</span>
                <Input
                  type="text"
                  placeholder="0"
                  className="pl-16 text-3xl font-mono font-bold h-16"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      selectedCategory === category.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-[10px] font-medium text-center leading-tight">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Input placeholder="Makan siang di cafe..." value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </TabsContent>
        </Tabs>

        {/* Save button — hidden when photo is in idle/preview/analyzing */}
        {!(activeTab === 'foto' && (photoPhase === 'idle' || photoPhase === 'preview' || photoPhase === 'analyzing')) && (
          <Button
            onClick={handleSave}
            disabled={isSaving || (activeTab === 'foto' && photoPhase !== 'confirm')}
            className="w-full h-12 bg-primary hover:bg-primary-dark mt-4"
          >
            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan Transaksi'}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
