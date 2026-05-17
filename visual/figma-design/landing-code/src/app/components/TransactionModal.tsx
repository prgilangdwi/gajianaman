import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = [
  { id: 'food', emoji: '🍔', label: 'Food', color: '#f59e0b' },
  { id: 'transport', emoji: '🚗', label: 'Transport', color: '#3b82f6' },
  { id: 'groceries', emoji: '🛒', label: 'Groceries', color: '#10b981' },
  { id: 'shopping', emoji: '🛍️', label: 'Shopping', color: '#ec4899' },
  { id: 'bills', emoji: '📱', label: 'Bills', color: '#8b5cf6' },
  { id: 'health', emoji: '🏥', label: 'Health', color: '#ef4444' },
  { id: 'entertainment', emoji: '🎬', label: 'Entertainment', color: '#f97316' },
  { id: 'education', emoji: '📚', label: 'Education', color: '#06b6d4' },
];

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransactionModal({ isOpen, onClose }: TransactionModalProps) {
  const [activeTab, setActiveTab] = useState('ai');
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleParseAI = () => {
    if (!aiInput.trim()) return;

    setIsParsingAI(true);
    setTimeout(() => {
      const parsed = {
        type: 'expense' as const,
        amount: '25000',
        category: 'food',
        note: aiInput,
        date: new Date().toISOString().split('T')[0],
      };
      setParsedData(parsed);
      setIsParsingAI(false);
    }, 1500);
  };

  const handleSaveTransaction = () => {
    let data;
    if (activeTab === 'ai' && parsedData) {
      data = parsedData;
    } else {
      if (!amount || !selectedCategory) {
        toast.error('Mohon lengkapi semua field');
        return;
      }
      data = {
        type: transactionType,
        amount,
        category: selectedCategory,
        note,
        date,
      };
    }

    toast.success('Transaksi berhasil disimpan!');
    onClose();
    setAiInput('');
    setParsedData(null);
    setAmount('');
    setSelectedCategory('');
    setNote('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Parse dengan AI
                  </>
                )}
              </Button>
            </div>

            {parsedData && (
              <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 space-y-2">
                <p className="text-sm font-semibold text-primary">Hasil Parsing:</p>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Tipe:</span>{' '}
                    <span className="font-medium capitalize">{parsedData.type}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Jumlah:</span>{' '}
                    <span className="font-mono font-semibold">Rp {parseInt(parsedData.amount).toLocaleString('id-ID')}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Kategori:</span>{' '}
                    <span className="font-medium">
                      {categories.find((c) => c.id === parsedData.category)?.emoji}{' '}
                      {categories.find((c) => c.id === parsedData.category)?.label}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Catatan:</span>{' '}
                    <span className="font-medium">{parsedData.note}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Tanggal:</span>{' '}
                    <span className="font-medium">{parsedData.date}</span>
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-6 mt-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={transactionType === 'expense' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTransactionType('expense')}
              >
                Pengeluaran
              </Button>
              <Button
                type="button"
                variant={transactionType === 'income' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setTransactionType('income')}
              >
                Pemasukan
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Jumlah</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="text"
                  placeholder="0"
                  className="pl-16 text-3xl font-mono font-bold h-16"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAmount(val);
                  }}
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
                      selectedCategory === category.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">{category.emoji}</span>
                    <span className="text-[10px] font-medium text-center leading-tight">
                      {category.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catatan (opsional)</Label>
              <Input
                placeholder="Makan siang di cafe..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={handleSaveTransaction} className="w-full h-12 bg-primary hover:bg-primary-dark mt-4">
          Simpan Transaksi
        </Button>
      </DialogContent>
    </Dialog>
  );
}
