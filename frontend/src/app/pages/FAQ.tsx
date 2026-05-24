import { useNavigate } from 'react-router';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Footer from '../components/Footer';

export default function FAQ() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apakah Gajian Aman gratis?',
      a: 'Ya! Gajian Aman gratis untuk semua fitur dasar. Kami juga menawarkan plan premium untuk fitur tambahan di masa depan.'
    },
    {
      q: 'Bagaimana cara memulai?',
      a: 'Buka Telegram, cari @GajianAmanBot, dan ketik /start. Bot akan memandu Anda through setup. Atau login di web dengan Telegram ID atau Google account Anda.'
    },
    {
      q: 'Data saya aman?',
      a: 'Ya, sangat aman. Kami menggunakan enkripsi TLS 1.3, Supabase PostgreSQL dengan backup harian, dan tidak membagikan data Anda ke pihak ketiga.'
    },
    {
      q: 'Berapa akurat AI parsing untuk foto struk?',
      a: 'AI kami memiliki akurasi ~95% untuk foto struk dengan lighting baik dan teks yang jelas. Selalu review hasil parsing sebelum confirm.'
    },
    {
      q: 'Bisa pakai di berapa perangkat?',
      a: 'Bisa! Gunakan Telegram di semua perangkat Anda, dan dashboard web di desktop atau mobile. Data sync realtime.'
    },
    {
      q: 'Apakah ada limit transaksi?',
      a: 'Tidak ada limit. Catat sebanyak transaksi yang Anda mau.'
    },
    {
      q: 'Bisa backup data saya?',
      a: 'Tentu. Kami automatically backup setiap hari. Anda juga bisa export data dalam format CSV.'
    },
    {
      q: 'Apakah bisa offline?',
      a: 'Tidak, Gajian Aman membutuhkan internet. Telegram dan web dashboard keduanya memerlukan koneksi online.'
    },
    {
      q: 'Bagaimana kalau ada bug atau issue?',
      a: 'Silakan laporkan ke @GajianAmanBot dengan /feedback atau email support@gajianaman.xyz. Tim kami akan respons ASAP.'
    },
    {
      q: 'Apakah ada dokumentasi API?',
      a: 'API documentation sedang dalam development. Untuk saat ini, gunakan Telegram bot atau web dashboard.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
          >
 <ArrowLeft className="size-4 " />
            Kembali
          </button>
          <h1 className="text-4xl font-semibold text-slate-900">FAQ</h1>
          <p className="text-lg text-slate-600 mt-2">
            Pertanyaan yang sering diajukan
          </p>
        </div>
      </div>

      {/* FAQ List */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-slate-200 rounded-lg">
              <button
                type="button"
                onClick={() => setExpanded(expanded === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition"
              >
                <h3 className="text-lg font-semibold text-slate-900 text-left">{faq.q}</h3>
                <ChevronDown
 className={`size-5 text-slate-600 flex-shrink-0 transition-transform ${
                    expanded === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expanded === idx && (
                <div className="px-6 pb-6 border-t border-slate-200 text-slate-600">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-emerald-50 border-t border-emerald-200">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">Pertanyaan lain?</h2>
          <p className="text-slate-600 mb-6">
            Hubungi kami di support@gajianaman.xyz atau /feedback di Telegram
          </p>
        </div>
      </div>

      {/* Footer */}
      <section style={{ background: '#ffffff', padding: '48px 24px', borderTop: '1px solid #e2e8f0' }}>
        <Footer />
      </section>
    </div>
  );
}
