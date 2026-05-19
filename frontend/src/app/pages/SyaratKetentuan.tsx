import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

export default function SyaratKetentuan() {
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
          <h1 className="text-4xl font-bold text-slate-900">Syarat & Ketentuan</h1>
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
              <h2 className="text-2xl font-bold text-slate-900 mb-3">1. Penerimaan Syarat</h2>
              <p>
                Dengan menggunakan Gajian Aman ("Layanan"), Anda menerima dan setuju untuk terikat oleh syarat dan ketentuan ini. Jika Anda tidak setuju dengan bagian manapun dari syarat ini, silakan jangan gunakan Layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">2. Lisensi Penggunaan</h2>
              <p>
                Kami memberikan Anda lisensi terbatas, non-eksklusif, dan non-transferable untuk menggunakan Gajian Aman untuk tujuan personal dan non-komersial. Anda tidak boleh:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Menggunakan Layanan untuk tujuan komersial</li>
                <li>Mereproduksi, mengubah, atau mendistribusikan kode atau desain</li>
                <li>Melakukan reverse engineering atau decompiling</li>
                <li>Menggunakan bot atau automated tools untuk scraping data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">3. Akun Pengguna</h2>
              <p>
                Anda bertanggung jawab untuk menjaga keamanan akun Anda. Anda setuju untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Tidak membagikan credentials Anda kepada siapapun</li>
                <li>Memberitahu kami segera jika ada aktivitas mencurigakan</li>
                <li>Memberikan informasi yang akurat dan lengkap</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">4. Data Anda</h2>
              <p>
                Anda mempertahankan kepemilikan data Anda. Dengan menggunakan Layanan, Anda memberikan kami izin untuk:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Menyimpan dan memproses data transaksi Anda</li>
                <li>Menggunakan AI untuk kategorisasi dan analisis</li>
                <li>Menampilkan data dalam dashboard dan reports</li>
              </ul>
              <p className="mt-3">
                Kami tidak akan membagikan data pribadi Anda dengan pihak ketiga tanpa persetujuan eksplisit Anda.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">5. Pembatasan Tanggung Jawab</h2>
              <p>
                GAJIAN AMAN DIBERIKAN "SEBAGAIMANA ADANYA" TANPA GARANSI APAPUN. KAMI TIDAK BERTANGGUNG JAWAB ATAS:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 ml-4">
                <li>Kerugian finansial akibat penggunaan Layanan</li>
                <li>Kehilangan atau korupsi data</li>
                <li>Downtime atau gangguan layanan</li>
                <li>Kesalahan dalam AI categorization atau parsing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">6. Pembayaran</h2>
              <p>
                Gajian Aman saat ini gratis untuk semua fitur dasar. Fitur premium mungkin akan ditawarkan di masa depan dengan terms terpisah. Anda akan diberitahu sebelum charge apapun dilakukan.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">7. Terminasi</h2>
              <p>
                Kami berhak untuk menghentikan akses Anda jika Anda melanggar syarat ini atau menjalankan aktivitas mencurigakan. Anda dapat menghapus akun Anda kapan saja.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">8. Perubahan Layanan</h2>
              <p>
                Kami berhak untuk mengubah atau menghentikan Layanan kapan saja. Kami akan memberitahu Anda tentang perubahan material sebelumnya.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">9. Hukum yang Berlaku</h2>
              <p>
                Syarat ini diatur oleh hukum Indonesia. Setiap sengketa akan diselesaikan di pengadilan yang berwenang.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">10. Hubungi Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan tentang Syarat & Ketentuan ini, silakan hubungi kami di support@gajianaman.xyz
              </p>
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
