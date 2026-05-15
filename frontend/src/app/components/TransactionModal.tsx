import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const categories = [
  { id: 'Food & Dining', emoji: '🍔', label: 'Food', color: '#f59e0b' },
  { id: 'Transport', emoji: '🚗', label: 'Transport', color: '#3b82f6' },
  { id: 'Groceries', emoji: '🛒', label: 'Groceries', color: '#10b981' },
  { id: 'Shopping', emoji: '🛍️', label: 'Shopping', color: '#ec4899' },
  { id: 'Bills & Utilities', emoji: '📱', label: 'Bills', color: '#8b5cf6' },
  { id: 'Health', emoji: '🏥', label: 'Health', color: '#ef4444' },
  { id: 'Entertainment', emoji: '🎬', label: 'Entertainment', color: '#f97316' },
  { id: 'Education', emoji: '📚', label: 'Education', color: '#06b6d4' },
];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface ParsedTx {
  type: 'expense' | 'income';
  amount: string;
  category: string;
  note: string;
  date: string;
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

  const handleParseAI = async () => {
    if (!aiInput.trim()) return;
    setIsParsingAI(true);

    try {
      // Simple keyword-based parsing (no API call needed for basic categorization)
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

      // Extract amount with Indonesian shorthand: 23k/23rb/23ribu = 23000, 23jt/23juta/23mio = 23000000
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

  const handleSave = async () => {
    if (!user) return;

    let txData: { type: string; amount: number; category: string; note?: string; date: string };
    if (activeTab === 'ai' && parsedData) {
      txData = { type: parsedData.type, amount: Number(parsedData.amount), category: parsedData.category, note: parsedData.note, date: parsedData.date };
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
    const { error } = await supabase.from('transactions').insert({
      user_id: user.userId,
      ...txData,
    });
    setIsSaving(false);

    if (error) {
      toast.error('Gagal menyimpan: ' + error.message);
      return;
    }

    toast.success('Transaksi berhasil disimpan!');
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Tambah Transaksi</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Input
            </TabsTrigger>
            <TabsTrigger value="manual">Manual Form</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4 mt-6">
            <div className="space-y-3">
              <Label>Ketik bebas, AI akan parsing untuk kamu</Label>
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
                  <><Sparkles className="w-4 h-4 mr-2" />Parse dengan AI</>
                )}
              </Button>
            </div>

            {parsedData && (
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-2">
                <p className="text-sm font-semibold text-primary">Hasil Parsing:</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Tipe:</span> <span className="font-medium capitalize">{parsedData.type}</span></p>
                  <p><span className="text-muted-foreground">Jumlah:</span> <span className="font-mono font-semibold">Rp {Number(parsedData.amount).toLocaleString('id-ID')}</span></p>
                  <p><span className="text-muted-foreground">Kategori:</span> <span className="font-medium">{categories.find((c) => c.id === parsedData.category)?.emoji} {parsedData.category}</span></p>
                  <p><span className="text-muted-foreground">Catatan:</span> <span className="font-medium">{parsedData.note}</span></p>
                </div>
              </div>
            )}
          </TabsContent>

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

        <Button onClick={handleSave} disabled={isSaving} className="w-full h-12 bg-primary hover:bg-primary-dark mt-4">
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Simpan Transaksi'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
