import { chatCompletion } from './lib/openrouter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, transactions, month, year, conversationHistory } = req.body;

  if (!question || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const historyMessages = Array.isArray(conversationHistory)
    ? conversationHistory
        .slice(-10)
        .map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content }))
    : [];

  try {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const categoryBreakdown = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + (t.amount || 0);
      });

    const contextStr = `
Pengguna Anda memiliki data keuangan bulan ${month}/${year} sebagai berikut:
- Total Pemasukan: Rp${totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran: Rp${totalExpense.toLocaleString('id-ID')}
- Keseimbangan: Rp${(totalIncome - totalExpense).toLocaleString('id-ID')}
- Kategori Pengeluaran:
${Object.entries(categoryBreakdown)
  .sort(([, a], [, b]) => b - a)
  .map(([cat, amt]) => `  - ${cat}: Rp${amt.toLocaleString('id-ID')}`)
  .join('\n')}

Pertanyaan pengguna: ${question}

Berikan jawaban yang singkat, praktis, dan dalam Bahasa Indonesia. Fokus pada insight dan actionable advice.
    `;

    const answer = await chatCompletion({
      system: 'Kamu adalah asisten keuangan pribadi untuk pengguna Indonesia. Berikan saran yang singkat, praktis, dan actionable.',
      messages: [...historyMessages, { role: 'user', content: contextStr }],
      max_tokens: 500,
    });

    return res.status(200).json({ response: answer || 'Maaf, tidak ada jawaban yang tersedia.' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
