import { createClient } from '@supabase/supabase-js';
import { chatCompletion } from './lib/openrouter.js';

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

  let query = supabase
    .from('transactions')
    .select('date, category, type, amount, note, wallet_id, wallets(name)')
    .eq('user_id', user_id)
    .order('date', { ascending: false });

  if (wallet_id !== 'all') query = query.eq('wallet_id', wallet_id);

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
      (t.note ?? '').replace(/,/g, ';'),
      t.wallets?.name ?? '',
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const filename = `gajian-aman-${monthNames[month-1]}-${year}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send('﻿' + csv);
  }

  if (format === 'pdf') {
    const txs = transactions ?? [];
    const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

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

    const narrative = await chatCompletion({
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
Paragraf 3: satu saran praktis yang actionable.`,
      }],
      max_tokens: 300,
    }) || 'Laporan tidak tersedia.';

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Keuangan — ${monthNames[month-1]} ${year}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      color: #1a1a1a;
      line-height: 1.6;
    }
    @media print {
      body { background: white; }
      .page { box-shadow: none; margin: 0; padding: 0; }
    }
    .page {
      background: white;
      max-width: 800px;
      margin: 20px auto;
      padding: 60px 40px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
    }
    h1 { color: #10b981; font-size: 28px; margin-bottom: 8px; }
    .period { color: #666; font-size: 14px; }
    h2 { font-size: 16px; color: #333; margin: 32px 0 16px 0; font-weight: 600; }
    .stats {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    .stat {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .stat:last-child { border-bottom: none; }
    .stat-label { color: #666; font-size: 14px; }
    .stat-value { font-weight: 700; font-family: 'Courier New', monospace; font-size: 15px; }
    .income { color: #10b981; }
    .expense { color: #ef4444; }
    .neutral { color: #1a1a1a; }
    .narrative {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
      line-height: 1.8;
      white-space: pre-wrap;
      font-size: 14px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    @media print {
      body { padding: 0; margin: 0; }
      .page { margin: 0; box-shadow: none; padding: 0 0 20px 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>📊 Laporan Keuangan</h1>
      <p class="period">${monthNames[month-1]} ${year} — Gajian Aman</p>
    </div>

    <h2>Ringkasan Keuangan</h2>
    <div class="stats">
      <div class="stat">
        <span class="stat-label">💰 Total Pemasukan</span>
        <span class="stat-value income">Rp ${totalIncome.toLocaleString('id-ID')}</span>
      </div>
      <div class="stat">
        <span class="stat-label">💸 Total Pengeluaran</span>
        <span class="stat-value expense">Rp ${totalExpense.toLocaleString('id-ID')}</span>
      </div>
      <div class="stat">
        <span class="stat-label">💵 Saldo Bersih</span>
        <span class="stat-value neutral">Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}</span>
      </div>
      <div class="stat">
        <span class="stat-label">📝 Jumlah Transaksi</span>
        <span class="stat-value neutral">${txs.length}</span>
      </div>
    </div>

    <h2>💡 Analisis & Saran</h2>
    <div class="narrative">${narrative}</div>

    <div class="footer">
      <p>Dibuat oleh Gajian Aman — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="margin-top: 8px;">Cetak atau simpan laporan ini sebagai PDF menggunakan fitur print browser Anda.</p>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="laporan-${monthNames[month-1].toLowerCase()}-${year}.html"`);
    return res.status(200).send(html);
  }

  return res.status(400).json({ error: 'format must be csv or pdf' });
}
