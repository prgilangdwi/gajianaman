import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, month, year, wallet_id = 'all', format = 'csv' } = req.body;

  if (!user_id || !month || !year) {
    return res.status(400).json({ error: 'user_id, month, year required' });
  }

  // Query transactions
  let query = supabase
    .from('transactions')
    .select('date, category, type, amount, note, wallet_id, wallets(name)')
    .eq('user_id', user_id)
    .order('date', { ascending: false });

  if (wallet_id !== 'all') query = query.eq('wallet_id', wallet_id);

  // Filter by month/year using date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  query = query.gte('date', startDate).lte('date', endDate);

  const { data: transactions, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  if (format === 'csv') {
    const headers = ['Tanggal', 'Kategori', 'Tipe', 'Jumlah', 'Catatan', 'Wallet'];
    const rows = (transactions ?? []).map((t) => [
      t.date?.split('T')[0] ?? '',
      t.category ?? '',
      t.type === 'expense' ? 'Pengeluaran' : 'Pemasukan',
      t.amount ?? 0,
      (t.note ?? '').replace(/,/g, ';'), // escape commas in notes
      t.wallets?.name ?? '',
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const filename = `gajian-aman-${monthNames[month-1]}-${year}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send('﻿' + csv); // BOM for Excel compatibility
  }

  if (format === 'pdf') {
    const txs = transactions ?? [];
    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

    // Aggregate top 3 categories
    const catMap = {};
    txs.filter((t) => t.type === 'expense').forEach((t) => {
      catMap[t.category] = (catMap[t.category] ?? 0) + Number(t.amount);
    });
    const top3 = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: Rp ${Number(amt).toLocaleString('id-ID')}`)
      .join(', ');

    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    // One Claude Haiku call with aggregated data only
    const { content } = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Buat ringkasan keuangan 3 paragraf singkat dalam bahasa Indonesia casual (gaya Gojek/Grab) berdasarkan data berikut:
Bulan: ${monthNames[month-1]} ${year}
Total Pemasukan: Rp ${totalIncome.toLocaleString('id-ID')}
Total Pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
Saldo Bersih: Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}
Top 3 Kategori: ${top3 || 'Tidak ada data'}
Jumlah Transaksi: ${txs.length}

Paragraf 1: ringkasan kondisi keuangan bulan ini.
Paragraf 2: analisis singkat pengeluaran terbesar.
Paragraf 3: satu saran praktis yang actionable.`
      }]
    });

    const narrative = content[0]?.text ?? 'Laporan tidak tersedia.';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Keuangan — ${monthNames[month-1]} ${year}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; }
    h1 { color: #10b981; font-size: 24px; }
    h2 { font-size: 16px; color: #555; margin-top: 24px; }
    .stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .stat .label { color: #666; }
    .stat .value { font-weight: 700; font-family: monospace; }
    .income { color: #10b981; }
    .expense { color: #ef4444; }
    .narrative { background: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin-top: 24px; border-radius: 4px; line-height: 1.6; white-space: pre-wrap; }
    .footer { margin-top: 40px; font-size: 12px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <h1>📊 Laporan Keuangan</h1>
  <p style="color:#666">${monthNames[month-1]} ${year} — Gajian Aman</p>
  <h2>Ringkasan</h2>
  <div class="stat"><span class="label">Total Pemasukan</span><span class="value income">Rp ${totalIncome.toLocaleString('id-ID')}</span></div>
  <div class="stat"><span class="label">Total Pengeluaran</span><span class="value expense">Rp ${totalExpense.toLocaleString('id-ID')}</span></div>
  <div class="stat"><span class="label">Saldo Bersih</span><span class="value">Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}</span></div>
  <div class="stat"><span class="label">Jumlah Transaksi</span><span class="value">${txs.length}</span></div>
  <h2>Analisis AI</h2>
  <div class="narrative">${narrative}</div>
  <div class="footer">Dibuat oleh Gajian Aman · ${new Date().toLocaleDateString('id-ID')}</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="laporan-${monthNames[month-1]}-${year}.html"`);
    return res.status(200).send(html);
  }

  return res.status(400).json({ error: 'format must be csv or pdf' });
}
