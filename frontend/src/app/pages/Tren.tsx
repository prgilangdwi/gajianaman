import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { createCompactAxisFormatter } from '@/lib/chartFormatters';
import { useMonthFilter } from '@/hooks/useMonthFilter';
import { useTransactions } from '@/hooks/useTransactions';
import { useLaporanData } from '@/hooks/data/useLaporanData';

export default function Tren() {
  const { month, year } = useMonthFilter();
  const { transactions, isLoading } = useTransactions(month, year);
  const laporanData = useLaporanData();

  // Build 3-month trend data
  const trendData = useMemo(() => {
    if (!transactions || !laporanData) return null;

    // Group transactions by month (simplified: use current + 2 prior months)
    const months = [
      { month: month - 2, year: year },
      { month: month - 1, year: year },
      { month: month, year: year },
    ].map((d) => {
      const m = d.month < 1 ? 12 + d.month : d.month;
      const y = d.month < 1 ? d.year - 1 : d.year;
      return { month: m, year: y };
    });

    // In production, fetch transactions for all 3 months
    // For now, use sample data structure
    return {
      incomeVsExpense: [
        { month: 'Bulan -2', income: 15000000, expense: 8500000 },
        { month: 'Bulan -1', income: 15000000, expense: 9200000 },
        { month: 'Bulan Ini', income: 15000000, expense: 8800000 },
      ],
      categoryTrend: [
        {
          category: 'Food & Dining',
          m1: 2500000,
          m2: 2800000,
          m3: 2600000,
        },
        {
          category: 'Transport',
          m1: 1200000,
          m2: 1400000,
          m3: 1300000,
        },
        {
          category: 'Shopping',
          m1: 1800000,
          m2: 1600000,
          m3: 1900000,
        },
        {
          category: 'Bills & Utilities',
          m1: 900000,
          m2: 900000,
          m3: 900000,
        },
        {
          category: 'Entertainment',
          m1: 700000,
          m2: 650000,
          m3: 750000,
        },
      ],
      savingsGrowth: [
        { month: 'Bulan -2', savings: 5000000, cumulative: 25000000 },
        { month: 'Bulan -1', savings: 4300000, cumulative: 29300000 },
        { month: 'Bulan Ini', savings: 5200000, cumulative: 34500000 },
      ],
      walletFlow: [
        {
          wallet: 'Cash',
          inflow: 8000000,
          outflow: 7200000,
          balance: 800000,
        },
        {
          wallet: 'GoPay',
          inflow: 4000000,
          outflow: 2500000,
          balance: 1500000,
        },
        {
          wallet: 'Bank Account',
          inflow: 3000000,
          outflow: 1100000,
          balance: 1900000,
        },
      ],
    };
  }, [transactions, laporanData, month, year]);

  if (isLoading || !trendData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Analisis Tren
        </h1>
        <p className="text-gray-600 mt-1">Lihat pola keuangan Anda dalam 3 bulan terakhir</p>
      </div>

      {/* Income vs Expense Trend */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Pemasukan vs Pengeluaran</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData.incomeVsExpense}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={createCompactAxisFormatter()} />
            <Tooltip formatter={(value) => formatRupiah(value)} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#4AE54A" strokeWidth={2} name="Pemasukan" />
            <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} name="Pengeluaran" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Trend */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Tren Kategori (3 Bulan)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={trendData.categoryTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis tickFormatter={createCompactAxisFormatter()} />
            <Tooltip formatter={(value) => formatRupiah(value)} />
            <Legend />
            <Area type="monotone" dataKey="m1" stackId="1" stroke="#4AE54A" fill="#4AE54A" name="Bulan -2" opacity={0.7} />
            <Area type="monotone" dataKey="m2" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Bulan -1" opacity={0.7} />
            <Area type="monotone" dataKey="m3" stackId="1" stroke="#F59E0B" fill="#F59E0B" name="Bulan Ini" opacity={0.7} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Growth Trend */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Pertumbuhan Tabungan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={trendData.savingsGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={createCompactAxisFormatter()} />
            <Tooltip formatter={(value) => formatRupiah(value)} />
            <Legend />
            <Bar dataKey="savings" fill="#4AE54A" name="Tabungan Bulan Ini" />
            <Bar dataKey="cumulative" fill="#3B82F6" name="Tabungan Kumulatif" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Wallet Flow */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Arus Kas per Dompet</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendData.walletFlow.map((wallet) => (
            <div key={wallet.wallet} className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-600">{wallet.wallet}</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" />
                    Masuk
                  </span>
                  <span className="font-semibold text-green-700">{formatRupiah(wallet.inflow)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <ArrowDown className="w-3 h-3" />
                    Keluar
                  </span>
                  <span className="font-semibold text-red-700">{formatRupiah(wallet.outflow)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-600 font-medium">Saldo</span>
                  <span className="font-bold text-slate-900">{formatRupiah(wallet.balance)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-900">Insight Tren</p>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Pengeluaran Anda relatif stabil di sekitar Rp 8–9 juta per bulan</li>
              <li>Food & Dining adalah kategori terbesar, cenderung stabil</li>
              <li>Tabungan Anda meningkat 38% dalam 3 bulan terakhir</li>
              <li>Shopping menunjukkan volatilitas tinggi — pertimbangkan budgeting ketat</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
