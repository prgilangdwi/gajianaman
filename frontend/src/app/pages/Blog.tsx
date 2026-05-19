import { useNavigate } from 'react-router';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import Footer from '../components/Footer';

export default function Blog() {
  const navigate = useNavigate();

  const posts = [
    {
      title: '5 Tips Hemat Uang yang Effective',
      excerpt: 'Pelajari strategi sederhana untuk mengurangi pengeluaran dan meningkatkan tabungan Anda setiap bulan.',
      date: '2026-05-15',
      author: 'Tim Gajian Aman',
      slug: 'tips-hemat-uang'
    },
    {
      title: 'Bagaimana AI Membantu Categorisasi Transaksi',
      excerpt: 'Deep dive ke dalam teknologi di balik automatic transaction categorization menggunakan Claude Haiku.',
      date: '2026-05-10',
      author: 'Budi Hartono',
      slug: 'ai-categorization'
    },
    {
      title: 'Panduan Membuat Budget yang Realistis',
      excerpt: 'Teknik proven untuk membuat dan maintain budget yang sustainable dan achievable.',
      date: '2026-05-05',
      author: 'Siti Nurhaliza',
      slug: 'budget-guide'
    }
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
          <h1 className="text-4xl font-bold text-slate-900">Blog</h1>
          <p className="text-lg text-slate-600 mt-2">
            Tips, trik, dan insights tentang personal finance
          </p>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {posts.map((post, idx) => (
            <article
              key={idx}
              className="pb-8 border-b border-slate-200 last:border-b-0 hover:shadow-sm transition cursor-pointer"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{post.title}</h2>
              <div className="flex gap-4 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(post.date)}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.author}
                </div>
              </div>
              <p className="text-slate-700 mb-4">{post.excerpt}</p>
              <a
                href={`/blog/${post.slug}`}
                className="inline-block text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Baca selengkapnya →
              </a>
            </article>
          ))}
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="bg-emerald-50 border-t border-emerald-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Jangan lewatkan artikel baru</h2>
            <p className="text-slate-600 mb-6">
              Subscribe ke newsletter kami untuk tips finance terbaru setiap minggu
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Email Anda"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                Subscribe
              </button>
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
