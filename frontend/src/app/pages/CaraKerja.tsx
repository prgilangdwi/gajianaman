import { useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, Smartphone, BarChart3, Zap } from 'lucide-react';
import Footer from '../components/Footer';

export default function CaraKerja() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <h1 className="text-4xl font-bold text-slate-900">Cara Kerja</h1>
          <p className="text-lg text-slate-600 mt-2">
            Panduan lengkap menggunakan Gajian Aman
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <Smartphone className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">1. Daftar via Telegram</h2>
              <p className="text-slate-600 mb-4">
                Buka Telegram dan cari bot @GajianAmanBot, atau gunakan tombol "Mulai" di pesan Telegram kami.
              </p>
              <p className="text-slate-600">
                Ketik <code className="bg-slate-100 px-2 py-1 rounded">/start</code> untuk memulai. Bot akan meminta nama Anda dan mata uang pilihan.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">2. Catat Transaksi</h2>
              <p className="text-slate-600 mb-4">
                Ada 3 cara mencatat transaksi:
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Pesan teks:</strong> Kirim pesan seperti "makan siang 50k" atau "dapat gajian 5jt"</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Foto struk:</strong> Kirim foto struk atau screenshot pembayaran untuk parsing otomatis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Perintah:</strong> Gunakan /add atau /income untuk input terstruktur</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">3. Analisis Dashboard</h2>
              <p className="text-slate-600 mb-4">
                Buka gajianaman.xyz untuk melihat dashboard lengkap Anda:
              </p>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Ringkasan pemasukan vs pengeluaran</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Breakdown pengeluaran per kategori</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Progress anggaran dan tujuan tabungan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>Tren 3 bulan terakhir</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">💡 Tips Penggunaan</h3>
            <ul className="space-y-2 text-slate-700">
              <li>• Gunakan format "kategori + nominal + detail" untuk parsing yang lebih akurat</li>
              <li>• Foto struk bekerja terbaik dengan lighting yang baik dan teks yang jelas</li>
              <li>• Setel anggaran per kategori untuk tracking spending yang lebih baik</li>
              <li>• Buat tujuan tabungan untuk memotivasi diri Anda</li>
              <li>• Cek dashboard setiap minggu untuk tetap on track dengan keuangan Anda</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <section style={{ background: '#ffffff', padding: '48px 24px', borderTop: '1px solid #e2e8f0' }}>
        <Footer />
      </section>
    </div>
  );
}
