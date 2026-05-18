import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, transactions, month, year } = req.body;

  if (!question || !Array.isArray(transactions)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Aggregate transaction data for context
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

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: contextStr,
        },
      ],
    });

    const answer = response.content[0]?.text || 'Maaf, tidak ada jawaban yang tersedia.';

    return res.status(200).json({ response: answer });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
