import { useNavigate } from 'react-router';
import { ArrowLeft, Heart, Code, Globe } from 'lucide-react';
import Footer from '../components/Footer';

export default function TentangKami() {
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
          <h1 className="text-4xl font-bold text-slate-900">Tentang Kami</h1>
          <p className="text-lg text-slate-600 mt-2">
            Misi kami adalah membuat personal finance management mudah untuk semua orang
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Our Story */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Cerita Kami</h2>
            <p className="text-slate-700 mb-4">
              Gajian Aman dimulai dari frustasi sederhana: tracking keuangan pribadi itu ribet. Setiap bulan, jutaan orang Indonesia struggle untuk understand cashflow mereka, dan kebanyakan tools finance yang ada complicated atau mahal.
            </p>
            <p className="text-slate-700">
              Kami percaya bahwa semua orang, regardless of background mereka, deserve access ke powerful financial tools. Dengan AI dan design yang thoughtful, kami build Gajian Aman — aplikasi yang bikin tracking keuangan jadi natural dan frictionless.
            </p>
          </section>

          {/* Our Values */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Nilai Kami</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 mb-4">
                  <Heart className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">User-First</h3>
                <p className="text-slate-600">
                  Setiap keputusan design dimulai dari user needs, bukan technical complexity.
                </p>
              </div>
              <div className="p-6 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 mb-4">
                  <Code className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Transparency</h3>
                <p className="text-slate-600">
                  Kami transparent tentang bagaimana AI kami work dan apa yang kami lakukan dengan data Anda.
                </p>
              </div>
              <div className="p-6 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100 mb-4">
                  <Globe className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">Accessibility</h3>
                <p className="text-slate-600">
                  Financial tools seharusnya accessible untuk semua, affordable, dan easy to use.
                </p>
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Teknologi</h2>
            <p className="text-slate-700 mb-6">
              Gajian Aman dibangun dengan:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Backend</h3>
                <ul className="space-y-2 text-slate-600">
                  <li>• Python Telegram Bot untuk bot command processing</li>
                  <li>• Supabase PostgreSQL untuk data persistence</li>
                  <li>• Claude Haiku untuk AI categorization dan image parsing</li>
                  <li>• Railway untuk deployment</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-3">Frontend</h3>
                <ul className="space-y-2 text-slate-600">
                  <li>• React 18 + TypeScript untuk UI</li>
                  <li>• Tailwind CSS untuk styling</li>
                  <li>• React Router v7 untuk navigation</li>
                  <li>• Vercel untuk hosting</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Hubungi Kami</h2>
            <p className="text-slate-700 mb-4">
              Ada pertanyaan, saran, atau bug report? Kami senang dengar dari Anda!
            </p>
            <div className="space-y-2 text-slate-700">
              <p>📧 Email: support@gajianaman.xyz</p>
              <p>💬 Telegram: @GajianAmanBot (gunakan /feedback)</p>
              <p>🐙 GitHub: github.com/gajianaman</p>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <section style={{ background: '#ffffff', padding: '48px 24px', borderTop: '1px solid #e2e8f0' }}>
        <Footer />
      </section>
    </div>
  );
}
