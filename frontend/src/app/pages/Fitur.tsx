import { useNavigate } from 'react-router';
import { ArrowLeft, MessageSquare, Image, BarChart3, Target, Bell, Smartphone } from 'lucide-react';
import Footer from '../components/Footer';

export default function Fitur() {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: 'Pencatatan Chat',
      description: 'Catat transaksi langsung via Telegram dengan bahasa natural. Bot kami menggunakan AI untuk memahami input Anda.'
    },
    {
      icon: Image,
      title: 'Parsing Foto Struk',
      description: 'Kirim foto struk atau screenshot pembayaran, dan AI akan otomatis mengekstrak jumlah, kategori, dan tanggal transaksi.'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Analytics',
      description: 'Dashboard web lengkap dengan visualisasi pendapatan, pengeluaran, tren 3 bulan, dan breakdown per kategori.'
    },
    {
      icon: Target,
      title: 'Manajemen Anggaran',
      description: 'Atur anggaran bulanan per kategori dan track progress Anda dengan visualisasi progress bar real-time.'
    },
    {
      icon: Bell,
      title: 'Tujuan Tabungan',
      description: 'Buat tujuan keuangan dan monitor progres menabung Anda. Dapatkan motivasi dengan deadline yang jelas.'
    },
    {
      icon: Smartphone,
      title: 'Multi-Platform',
      description: 'Gunakan di Telegram untuk input mobile atau di web dashboard untuk analisis mendalam. Sinkronisasi sempurna.'
    }
  ];

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
          <h1 className="text-4xl font-bold text-slate-900">Fitur</h1>
          <p className="text-lg text-slate-600 mt-2">
            Semua yang Anda butuhkan untuk mengelola keuangan pribadi
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                      <Icon className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Integration */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-t border-emerald-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Powered by AI</h2>
            <p className="text-slate-700 max-w-2xl mx-auto">
              Gajian Aman menggunakan Claude Haiku untuk natural language processing dan computer vision yang akurat dalam mengategorisasi transaksi dan parsing struk otomatis.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-bold text-slate-900 mb-2">Natural Language Processing</h3>
              <p className="text-slate-600 text-sm">
                Ketik dalam bahasa Indonesia natural, AI kami memahami konteks dan mengategorisasi transaksi dengan akurat hingga 95%.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-bold text-slate-900 mb-2">Computer Vision</h3>
              <p className="text-slate-600 text-sm">
                Upload foto struk atau screenshot pembayaran, AI ekstrak otomatis jumlah, merchant, dan waktu dengan presisi tinggi.
              </p>
            </div>
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
