import { chatCompletion } from './lib/openrouter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { salaryAmount, salaryDate, fixedExpenses, riskProfile } = req.body;

  if (!salaryAmount || !salaryDate || !Array.isArray(fixedExpenses) || !riskProfile) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const totalFixed = fixedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const discretionary = salaryAmount - totalFixed;

  const systemPrompt =
    'Kamu adalah financial advisor Indonesia. Return ONLY valid JSON, no markdown, no explanation outside JSON.';

  const userPrompt = `Buat rekomendasi anggaran bulanan untuk pengguna Indonesia.

Data pengguna:
- Penghasilan bulanan: Rp ${salaryAmount}
- Tanggal gajian: ${salaryDate}
- Pengeluaran tetap: ${JSON.stringify(fixedExpenses)}
- Total pengeluaran tetap: Rp ${totalFixed}
- Dana bebas (setelah tetap): Rp ${discretionary}
- Profil risiko: ${riskProfile}

Alokasikan dana bebas ke kategori-kategori berikut (gunakan HANYA nama persis ini):
"Food & Dining", "Groceries", "Transport", "Shopping", "Health",
"Entertainment", "Bills & Utilities", "Education", "Personal Care", "Savings"

Aturan:
- totalRecommended HARUS = ${discretionary}
- Untuk profil konservatif: tabungan minimal 30%
- Untuk profil moderat: tabungan 15-25%
- Untuk profil agresif: tabungan 10-15%, lebih banyak ke investment/shopping
- Confidence: 0.9 jika kategori sesuai profil, 0.7 jika estimasi

Return ONLY this JSON (no other text):
{"budgetItems":[{"category":"Food & Dining","amount":800000,"confidence":0.9}],"totalRecommended":${discretionary},"savingsRate":0.2,"explanation":"Berdasarkan penghasilan Anda sebesar Rp ${salaryAmount}..."}`;

  try {
    const raw = await chatCompletion({
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 1000,
    });

    const jsonMatch = (raw ?? '{}').match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    return res.status(200).json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error('[generate-budget] Error:', err.message);

    const fallback = {
      budgetItems: [
        { category: 'Food & Dining',    amount: Math.round(discretionary * 0.30), confidence: 0.5 },
        { category: 'Transport',         amount: Math.round(discretionary * 0.15), confidence: 0.5 },
        { category: 'Groceries',         amount: Math.round(discretionary * 0.10), confidence: 0.5 },
        { category: 'Entertainment',     amount: Math.round(discretionary * 0.05), confidence: 0.5 },
        { category: 'Savings',           amount: Math.round(discretionary * 0.20), confidence: 0.5 },
        { category: 'Bills & Utilities', amount: Math.round(discretionary * 0.10), confidence: 0.5 },
        { category: 'Health',            amount: Math.round(discretionary * 0.10), confidence: 0.5 },
      ],
      totalRecommended: discretionary,
      savingsRate: 0.20,
      explanation: 'Budget default karena AI tidak tersedia. Sesuaikan dengan kondisi keuangan Anda.',
    };

    return res.status(200).json(fallback);
  }
}
