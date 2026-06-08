import { chatCompletion } from './lib/openrouter.js';

const CATEGORIES = [
  'Food & Dining', 'Transport', 'Groceries', 'Bills & Utilities',
  'Health', 'Entertainment', 'Shopping', 'Savings',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { risk_profile, monthly_income, answers } = req.body;

  if (!risk_profile || !monthly_income) {
    return res.status(400).json({ error: 'risk_profile and monthly_income required' });
  }

  const profileType = risk_profile?.type ?? 'moderat';
  const dependents = risk_profile?.dependents ?? 0;
  const incomeFormatted = Number(monthly_income).toLocaleString('id-ID');

  try {
    const raw = await chatCompletion({
      system: 'Kamu financial advisor Indonesia. Return ONLY valid JSON array, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Buat rekomendasi alokasi budget bulanan untuk:
- Income: Rp ${incomeFormatted}/bulan
- Profil risiko: ${profileType}
- Tanggungan: ${dependents} orang

Return JSON array dengan TEPAT 8 item (kategori: ${CATEGORIES.join(', ')}):
[{"category": "Food & Dining", "percentage": 25, "amount": 1250000, "tip": "satu kalimat tips singkat"}]

Jumlah percentage harus = 100. Amount = income × percentage / 100.`,
      }],
      max_tokens: 500,
    });

    const jsonMatch = (raw ?? '[]').match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    const categories = JSON.parse(jsonMatch[0]);

    const validated = categories.slice(0, 8).map((c) => ({
      category: c.category,
      percentage: Math.round(c.percentage),
      amount: Math.round(Number(monthly_income) * c.percentage / 100),
      tip: c.tip ?? '',
    }));

    return res.status(200).json({ categories: validated, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('Budget recommendation error:', err);
    return res.status(500).json({ error: 'AI service error. Coba lagi ya.' });
  }
}
