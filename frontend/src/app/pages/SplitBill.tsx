import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Trash2, Loader2, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah } from '@/lib/utils';
import { COPY } from '@/lib/copy';

type SplitMode = 'equal' | 'custom' | 'percentage';

interface Participant {
  name: string;
  amount: number;
}

interface ParsedResult {
  shareToken: string;
  shareUrl: string;
  participants: Participant[];
  sessionName: string;
  totalAmount: number;
}

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin;

export default function SplitBill() {
  const { user } = useAuth();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [sessionName, setSessionName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Step 2
  const [participants, setParticipants] = useState<string[]>(['', '']);

  // Step 3
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Step 4 result
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recordingTx, setRecordingTx] = useState(false);

  const totalNum = parseInt(totalAmount.replace(/\D/g, ''), 10) || 0;
  const validParticipants = participants.filter((p) => p.trim());

  // Computed split amounts
  const splitAmounts = (): Participant[] => {
    if (splitMode === 'equal') {
      const share = validParticipants.length > 0 ? Math.ceil(totalNum / validParticipants.length) : 0;
      return validParticipants.map((name) => ({ name, amount: share }));
    }
    if (splitMode === 'custom') {
      return validParticipants.map((name) => ({
        name,
        amount: parseInt((customAmounts[name] ?? '0').replace(/\D/g, ''), 10) || 0,
      }));
    }
    // percentage - default equal until user edits
    const share = validParticipants.length > 0 ? Math.ceil(totalNum / validParticipants.length) : 0;
    return validParticipants.map((name) => ({ name, amount: share }));
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      try {
        const res = await fetch('/api/parse-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        });
        const data = await res.json();
        if (data.amount) setTotalAmount(String(data.amount));
        toast.success('Total berhasil dianalisis dari struk!');
      } catch {
        toast.error('Gagal menganalisis struk. Silakan input manual.');
      } finally {
        setUploadingReceipt(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSplit = async () => {
    if (!user) return;
    const finalParticipants = splitAmounts();

    // Validation
    if (!sessionName.trim()) {
      toast.error('Nama sesi tidak boleh kosong');
      return;
    }
    if (totalNum === 0) {
      toast.error('Masukkan jumlah total');
      return;
    }
    if (finalParticipants.length === 0) {
      toast.error('Tambahkan minimal 1 peserta');
      return;
    }
    if (finalParticipants.some((p) => p.amount === 0)) {
      toast.error('Setiap peserta harus memiliki nominal');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.from('split_bills').insert({
        user_id: user.userId,
        session_name: sessionName,
        total_amount: totalNum,
        participants: finalParticipants,
      }).select('share_token').single();

      if (error || !data) {
        console.error('Split bill error:', error);
        toast.error('Gagal menyimpan split bill. Coba lagi ya.');
        return;
      }

      setResult({
        shareToken: data.share_token,
        shareUrl: `${APP_URL}/split/${data.share_token}`,
        participants: finalParticipants,
        sessionName,
        totalAmount: totalNum,
      });
      setStep(4);
      toast.success(COPY.success.splitBillCreated);
    } catch (err) {
      console.error('Split bill exception:', err);
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link disalin!');
  };

  const handleShareWhatsApp = () => {
    if (!result) return;
    const text = encodeURIComponent(
      `Split bill "${result.sessionName}" 🍽️\nTotal: ${formatRupiah(result.totalAmount)}\nLihat detail: ${result.shareUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleRecordMyShare = async () => {
    if (!user || !result) return;
    const myShare = result.participants.find(() => true); // first participant = user
    if (!myShare) return;
    setRecordingTx(true);
    await supabase.from('transactions').insert({
      user_id: user.userId,
      amount: myShare.amount,
      type: 'expense',
      category: 'Food & Dining',
      note: `Split bill: ${result.sessionName}`,
      date: new Date().toISOString().split('T')[0],
    });
    setRecordingTx(false);
    toast.success(COPY.success.transactionAdded);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Split Bill</h1>
        <p className="text-sm text-muted-foreground">Bagi tagihan bareng teman, share linknya langsung</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>

      {/* Step 1: Tagihan */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>📋 Info Tagihan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Nama Sesi</Label>
              <Input
                placeholder="Makan Malam Tim, Arisan, dll..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>Total Tagihan</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span>
                <Input
                  className="pl-10"
                  placeholder="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="text-center text-sm text-muted-foreground">atau</div>

            <label className="cursor-pointer">
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                {uploadingReceipt ? (
                  <><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /><p className="text-sm">Sedang dianalisis...</p></>
                ) : (
                  <><p className="text-2xl mb-1">📸</p><p className="text-sm font-medium">Upload struk / bukti bayar</p><p className="text-xs text-muted-foreground">AI akan membaca total otomatis</p></>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
            </label>

            <Button
              className="w-full"
              disabled={!sessionName || !totalNum}
              onClick={() => setStep(2)}
            >
              Lanjut — Tambah Peserta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Participants */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>👥 Siapa Saja?</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {participants.map((p, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder={`Peserta ${idx + 1}`}
                  value={p}
                  onChange={(e) => {
                    const next = [...participants];
                    next[idx] = e.target.value;
                    setParticipants(next);
                  }}
                />
                {participants.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setParticipants(participants.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setParticipants([...participants, ''])}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Peserta
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Kembali</Button>
              <Button
                className="flex-1"
                disabled={validParticipants.length < 2}
                onClick={() => setStep(3)}
              >
                Lanjut
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Split mode */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>⚖️ Cara Bagi</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {(['equal', 'custom'] as SplitMode[]).map((m) => (
                <Button
                  key={m}
                  variant={splitMode === m ? 'default' : 'outline'}
                  onClick={() => setSplitMode(m)}
                  className="flex-1"
                >
                  {m === 'equal' ? 'Rata' : 'Custom'}
                </Button>
              ))}
            </div>

            {splitMode === 'custom' && (
              <div className="space-y-2">
                {validParticipants.map((name) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24 truncate">{name}</span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Rp</span>
                      <Input
                        className="pl-8"
                        placeholder="0"
                        value={customAmounts[name] ?? ''}
                        onChange={(e) => setCustomAmounts({ ...customAmounts, [name]: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Preview */}
            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Preview Pembagian:</p>
              {splitAmounts().map((p) => (
                <div key={p.name} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-mono font-semibold">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Kembali</Button>
              <Button
                className="flex-1"
                disabled={saving}
                onClick={handleSaveSplit}
              >
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</> : 'Buat Split Bill'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Result + Share */}
      {step === 4 && result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ Split Bill Siap!
              <Badge className="bg-green-100 text-green-700">Tersimpan</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary */}
            <div className="space-y-2">
              <p className="font-semibold">{result.sessionName}</p>
              <p className="text-sm text-muted-foreground">Total: {formatRupiah(result.totalAmount)}</p>
              {result.participants.map((p) => (
                <div key={p.name} className="flex justify-between text-sm py-1 border-b last:border-0">
                  <span>{p.name}</span>
                  <span className="font-mono font-semibold">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>

            {/* QR */}
            <div className="flex flex-col items-center gap-3 py-4">
              <QRCodeSVG value={result.shareUrl} size={140} />
              <p className="text-xs text-muted-foreground break-all text-center">{result.shareUrl}</p>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleCopyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Salin Link
              </Button>
              <Button onClick={handleShareWhatsApp} className="gap-2 bg-green-600 hover:bg-green-700">
                <Share2 className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleRecordMyShare}
              disabled={recordingTx}
            >
              {recordingTx ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              📋 Catat ke Transaksi Saya
            </Button>

            <Button variant="ghost" className="w-full" onClick={() => {
              setStep(1); setResult(null); setSessionName(''); setTotalAmount('');
              setParticipants(['', '']); setCustomAmounts({});
            }}>
              Buat Split Bill Baru
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
