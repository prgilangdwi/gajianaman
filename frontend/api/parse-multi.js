import Anthropic from '@anthropic-ai/sdk';

const BATCH_PARSE_PROMPT = `You are a personal finance transaction parser for Indonesian users.
Your ONLY job: parse multiple transactions from text and return ONLY a JSON array. NO OTHER TEXT.

IMPORTANT: Return ONLY valid JSON. If you return any text outside the JSON array, the parsing will fail.

INSTRUCTION: For the input text, identify each separate transaction. For each transaction:
1. amount: Extract the amount in IDR (parse "50k"→50000, "1jt"→1000000, "100rb"→100000, "4000"→4000)
2. type: "expense" (makan, beli, bayar), "income" (dapat, masuk, gaji, dari), "savings" (nabung, tabung, investasi)
3. note: Brief description in Indonesian (max 30 chars)
4. date: "today"/"yesterday"/"tomorrow" OR "YYYY-MM-DD" format (if "17 mei"→"2026-05-17", if explicit year like "17 mei 2026"→"2026-05-17")
5. category: Exact match one: Food & Dining, Groceries, Transport, Shopping, Health, Entertainment, Bills & Utilities, Education, Personal Care, Dining Out, Salary, Freelance, Investment Return, Other Income, Savings, Investment
6. subcategory: Optional detail (e.g., "Street Food / Snacks")
7. confidence: "high" (clear), "medium" (some ambiguity), "low" (unclear)

RETURN FORMAT — a valid JSON array with this structure:
[
  {
    "amount": 50000,
    "type": "expense",
    "note": "Soto betawi",
    "date": "2026-05-17",
    "category": "Food & Dining",
    "subcategory": "Street Food",
    "confidence": "high"
  },
  {
    "amount": 100000,
    "type": "expense",
    "note": "Bensin mobil",
    "date": "today",
    "category": "Transport",
    "subcategory": "Fuel",
    "confidence": "high"
  }
]

CRITICAL RULES:
- Return ONLY the JSON array. Zero other text.
- If text has NO transactions or is unclear, return empty array: []
- Max 10 transactions. If more, keep first 10 only.
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body ?? {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text is required and must be non-empty' });
  }

  const apiKey = process.env.VITE_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: BATCH_PARSE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Parse these transactions:\n\n${text}`,
        },
      ],
    });

    let raw = response.content[0].text.trim();

    // Strip markdown fences if present
    if (raw.includes('```')) {
      for (const part of raw.split('```')) {
        const cleaned = part.replace(/^json\n?/, '').trim();
        if (cleaned.startsWith('[')) {
          raw = cleaned;
          break;
        }
      }
    }

    // Extra: try to find JSON array even without markdown fences
    if (!raw.startsWith('[')) {
      const bracketIdx = raw.indexOf('[');
      if (bracketIdx !== -1) {
        raw = raw.substring(bracketIdx);
        let bracketCount = 0;
        for (let i = 0; i < raw.length; i++) {
          if (raw[i] === '[') {
            bracketCount++;
          } else if (raw[i] === ']') {
            bracketCount--;
            if (bracketCount === 0) {
              raw = raw.substring(0, i + 1);
              break;
            }
          }
        }
      }
    }

    const result = JSON.parse(raw);

    // Validate result is a list
    if (!Array.isArray(result)) {
      return res.status(200).json({ transactions: [] });
    }

    // Cap at 10 transactions
    const transactions = result.slice(0, 10);

    // Ensure required fields
    for (const tx of transactions) {
      if (!tx.amount || typeof tx.amount !== 'number') tx.amount = 0;
      if (!tx.type) tx.type = 'expense';
      if (!tx.note) tx.note = 'Transaksi';
      if (!tx.date) tx.date = 'today';
      if (!tx.category) tx.category = 'Other';
      if (!tx.subcategory) tx.subcategory = 'Uncategorized';
      if (!tx.confidence) tx.confidence = 'medium';
    }

    return res.status(200).json({ transactions });
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('[parse-multi] JSON Parse error:', err);
      return res.status(200).json({ transactions: [] });
    }
    console.error('[parse-multi]', err);
    return res.status(500).json({ error: 'Terjadi error saat menganalisis transaksi' });
  }
}
