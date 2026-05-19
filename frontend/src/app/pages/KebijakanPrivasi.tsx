import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function KebijakanPrivasi() {
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
          <h1 className="text-4xl font-bold text-slate-900">Kebijakan Privasi</h1>
          <p className="text-lg text-slate-600 mt-2">
            Terakhir diupdate: 19 Mei 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <div className="space-y-8 text-slate-700">
            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Pendahuluan</h2>
              <p>
                Gajian Aman ("kami" atau "Kami") menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana Kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Informasi Apa yang Kami Kumpulkan</h2>
              <p>Kami mengumpulkan:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li><strong>Akun:</strong> Telegram ID, nama, email (jika Google login)</li>
                <li><strong>Transaksi:</strong> Jumlah, kategori, tanggal, note, foto struk</li>
                <li><strong>Preferensi:</strong> Mata uang, timezone, anggaran, tujuan tabungan</li>
                <li><strong>Usage:</strong> IP address, browser type, pages visited (via analytics)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Bagaimana Kami Menggunakan Data Anda</h2>
              <p>Data Anda digunakan untuk:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Memberikan dan meningkatkan Layanan</li>
                <li>Proses AI untuk kategorisasi dan parsing transaksi</li>
                <li>Menampilkan dashboard dan analytics</li>
                <li>Mengirim notifikasi dan update (jika Anda opt-in)</li>
                <li>Detect fraud atau aktivitas mencurigakan</li>
                <li>Comply dengan hukum yang berlaku</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">3. Berbagi Data dengan Pihak Ketiga</h2>
              <p>
                Kami tidak membagikan data pribadi Anda dengan pihak ketiga kecuali:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Dengan izin eksplisit Anda</li>
                <li>Untuk service providers (Supabase, Vercel, Anthropic) yang terikat NDA</li>
                <li>Ketika diperlukan oleh hukum atau law enforcement</li>
                <li>Untuk melindungi keamanan atau hak-hak Anda</li>
              </ul>
              <p className="mt-3">
                <strong>Anthropic API:</strong> Data transaksi dikirim ke Anthropic API untuk categorization. Anthropic memiliki no data retention policy — data tidak disimpan setelah processing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Keamanan Data</h2>
              <p>
                Kami menggunakan measures untuk melindungi data Anda:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Enkripsi TLS 1.3 untuk data in transit</li>
                <li>Encryption at rest di Supabase PostgreSQL</li>
                <li>Regular security audits dan backups</li>
                <li>Access control dan authentication</li>
              </ul>
              <p className="mt-3">
                Namun, tidak ada sistem yang 100% aman. Kami tidak bisa menjamin keamanan absolut.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">5. Retensi Data</h2>
              <p>
                Kami menyimpan data Anda selama Anda memiliki akun aktif. Jika Anda menghapus akun, data akan dihapus dalam 30 hari, kecuali kami perlu retain untuk compliance atau legal reasons.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">6. Cookies</h2>
              <p>
                Kami menggunakan cookies untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Session management (login state)</li>
                <li>Analytics (Google Analytics)</li>
                <li>User preferences</li>
              </ul>
              <p className="mt-3">
                Anda dapat disable cookies di browser settings, tapi ini mungkin affect functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">7. Hak Anda</h2>
              <p>
                Anda memiliki hak untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Access data pribadi Anda</li>
                <li>Request correction atau deletion</li>
                <li>Opt-out dari marketing communications</li>
                <li>Export data Anda</li>
              </ul>
              <p className="mt-3">
                Untuk exercise hak ini, hubungi kami di support@gajianaman.xyz
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">8. Children Privacy</h2>
              <p>
                Layanan kami tidak ditujukan untuk anak-anak di bawah 13 tahun. Kami tidak secara sadar mengumpulkan data dari anak-anak.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">9. Perubahan Kebijakan</h2>
              <p>
                Kami dapat update Kebijakan Privasi ini kapan saja. Perubahan material akan diumumkan melalui email atau notifikasi di aplikasi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">10. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan tentang privasi:
              </p>
              <div className="mt-3 space-y-1">
                <p>📧 Email: support@gajianaman.xyz</p>
                <p>💬 Telegram: @GajianAmanBot</p>
              </div>
            </section>
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
