import { useNavigate } from 'react-router';
import { ArrowLeft, Lock, Shield, Eye, Server, Zap } from 'lucide-react';
import Footer from '../components/Footer';

export default function Keamanan() {
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
          <h1 className="text-4xl font-bold text-slate-900">Keamanan</h1>
          <p className="text-lg text-slate-600 mt-2">
            Kami mengambil privasi dan keamanan data Anda dengan serius
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-12">
          {/* Encryption */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <Lock className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Enkripsi End-to-End</h2>
              <p className="text-slate-600">
                Semua komunikasi antara aplikasi Anda dan server kami menggunakan enkripsi TLS 1.3. Data Anda terenkripsi saat transit dan at rest.
              </p>
            </div>
          </div>

          {/* Database Security */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <Server className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Database yang Aman</h2>
              <p className="text-slate-600">
                Data Anda disimpan di Supabase PostgreSQL dengan backup harian dan redundancy geografis. Hanya authenticated requests yang dapat mengakses data Anda.
              </p>
            </div>
          </div>

          {/* Authentication */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Autentikasi Aman</h2>
              <p className="text-slate-600">
                Kami menggunakan OAuth 2.0 untuk Google login dan JWT tokens untuk session management. Password tidak disimpan di server kami.
              </p>
            </div>
          </div>

          {/* Privacy */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <Eye className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Privasi Data</h2>
              <p className="text-slate-600">
                Kami tidak membagikan data Anda kepada pihak ketiga. AI processing dilakukan melalui Anthropic API dengan no data retention policy.
              </p>
            </div>
          </div>

          {/* Compliance */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-100">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Compliance & Standards</h2>
              <p className="text-slate-600">
                Gajian Aman mematuhi standar keamanan internasional termasuk best practices untuk financial data protection.
              </p>
            </div>
          </div>

          {/* Security Best Practices */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Rekomendasi Keamanan</h3>
            <ul className="space-y-2 text-slate-700">
              <li>✓ Gunakan password yang kuat untuk akun Telegram dan Google Anda</li>
              <li>✓ Aktifkan two-factor authentication (2FA) jika tersedia</li>
              <li>✓ Jangan bagikan Telegram ID atau credentials Anda kepada orang lain</li>
              <li>✓ Log out dari browser jika menggunakan komputer publik</li>
              <li>✓ Laporkan aktivitas mencurigakan ke support@gajianaman.xyz</li>
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
