import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { budgetData, totalBudget, totalUsed, month, year } = req.body;

  if (!budgetData) {
    return res.status(400).json({ error: 'Missing budget data' });
  }

  try {
    const prompt = `
Berdasarkan data anggaran pengguna berikut untuk bulan ${month}/${year}:

Budget per Kategori:
${budgetData}

Total Anggaran: Rp${totalBudget.toLocaleString('id-ID')}
Total Terpakai: Rp${totalUsed.toLocaleString('id-ID')}
Sisa: Rp${Math.max(0, totalBudget - totalUsed).toLocaleString('id-ID')}

Berikan 3-5 saran konkret dalam Bahasa Indonesia untuk membantu pengguna mengoptimalkan anggaran mereka.
Format setiap saran sebagai satu baris (tanpa bullet atau numbering, hanya teks).
Saran harus spesifik, actionable, dan berdasarkan data yang diberikan.
    `;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content[0]?.text || '';
    const tips = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return res.status(200).json({ tips });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
