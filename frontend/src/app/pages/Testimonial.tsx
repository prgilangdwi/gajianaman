import { useNavigate } from 'react-router';
import { ArrowLeft, Star } from 'lucide-react';
import Footer from '../components/Footer';

export default function Testimonial() {
  const navigate = useNavigate();

  const testimonials = [
    {
      name: 'Budi Hartono',
      role: 'Software Engineer',
      text: 'Gajian Aman membuat tracking keuangan jadi super mudah. Cukup kirim pesan ke Telegram, dan semua tercatat otomatis. Dashboardnya juga bagus untuk analisis bulanan!',
      rating: 5
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Freelance Designer',
      text: 'Sebagai freelancer dengan income variabel, app ini membantu saya track cashflow dengan lebih terstruktur. AI parsing fotonya akurat banget!',
      rating: 5
    },
    {
      name: 'Ahmad Wijaya',
      role: 'Sales Manager',
      text: 'Dashboard analytics-nya membantu saya understand spending pattern. Sekarang lebih aware dengan budget harian dan bisa hemat lebih banyak.',
      rating: 5
    },
    {
      name: 'Lisa Gunawan',
      role: 'Content Creator',
      text: 'Yang paling suka adalah fitur goal setting. Punya target tabungan jadi lebih motivated. Plus, bisa dipakai sambil jalan via Telegram, super convenient!',
      rating: 5
    },
    {
      name: 'Riyanto Setiawan',
      role: 'Accountant',
      text: 'Dari perspektif keuangan, app ini bagus untuk personal finance management. Kategorisasi otomatis via AI menghemat waktu entry data.',
      rating: 5
    },
    {
      name: 'Maya Putri',
      role: 'Student',
      text: 'Sebagai mahasiswa, app ini membantu saya track allowance dan spending. Cukup screenshot struk dan langsung tercatat. Simpel dan efektif!',
      rating: 5
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
          <h1 className="text-4xl font-bold text-slate-900">Testimoni</h1>
          <p className="text-lg text-slate-600 mt-2">
            Apa kata pengguna Gajian Aman
          </p>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="p-6 border border-slate-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-slate-700 mb-4">"{testimonial.text}"</p>
              <div>
                <p className="font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-sm text-slate-600">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-emerald-50 border-t border-emerald-200">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Bergabunglah dengan ribuan pengguna</h2>
          <p className="text-slate-600 mb-6">
            Mulai track keuangan Anda hari ini dan rasakan perbedaannya
          </p>
          <a
            href="https://t.me/GajianAmanBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Coba Sekarang di Telegram
          </a>
        </div>
      </div>

      {/* Footer */}
      <section style={{ background: '#ffffff', padding: '48px 24px', borderTop: '1px solid #e2e8f0' }}>
        <Footer />
      </section>
    </div>
  );
}
