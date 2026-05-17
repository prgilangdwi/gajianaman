import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/lib/utils';

interface SplitBillData {
  session_name: string;
  total_amount: number;
  participants: Array<{ name: string; amount: number; paid: boolean }>;
  created_at: string;
}

export default function SplitBillShare() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<SplitBillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    supabase
      .from('split_bills')
      .select('session_name, total_amount, participants, created_at')
      .eq('share_token', token)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!row) setNotFound(true);
        else setData(row as SplitBillData);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-4xl">🤔</p>
        <p className="text-xl font-bold">Split bill tidak ditemukan</p>
        <p className="text-sm text-muted-foreground text-center">Link mungkin salah atau sudah kedaluwarsa.</p>
        <Link to="/">
          <Button>Kembali ke Beranda</Button>
        </Link>
      </div>
    );
  }

  const totalParticipants = data!.participants.length;
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(data!.created_at));

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/light-logo.png" alt="Gajian Aman" className="w-10 h-10 mx-auto" />
          <p className="text-xs text-muted-foreground">Split Bill via Gajian Aman</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-3">
            <div className="text-3xl mb-2">🍽️</div>
            <CardTitle className="text-xl">{data!.session_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{dateStr} · {totalParticipants} orang</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Total */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Tagihan</p>
              <p className="text-3xl font-extrabold text-primary">{formatRupiah(data!.total_amount)}</p>
            </div>

            {/* Per person */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">Pembagian:</p>
              {data!.participants.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 px-4 rounded-xl border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <span className="font-mono font-bold text-lg">{formatRupiah(p.amount)}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="border-t pt-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Mau lacak keuanganmu juga?
              </p>
              <Link to="/login">
                <Button className="w-full">Coba Gajian Aman Gratis</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Dibuat dengan Gajian Aman · Personal Finance untuk Indonesia
        </p>
      </div>
    </div>
  );
}
