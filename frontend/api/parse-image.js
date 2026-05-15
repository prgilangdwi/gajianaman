import Anthropic from '@anthropic-ai/sdk';

const IMAGE_PARSE_PROMPT = `Analyze this image and extract financial transaction information.

This could be: a store receipt (struk), bank transfer screenshot, e-wallet payment (GoPay, OVO, DANA, ShopeePay), food delivery order, invoice, or any payment confirmation.

Return ONLY valid JSON (no markdown, no explanation):
{
  "amount": <number in IDR — the TOTAL/GRAND TOTAL amount paid>,
  "type": "expense",
  "category": "<one category from list>",
  "subcategory": "<specific subcategory>",
  "note": "<brief description in Indonesian, max 40 chars>",
  "confidence": "<high|medium|low>",
  "raw_text": "<key text — merchant name or transaction description, max 60 chars>"
}

Valid categories: Food & Dining, Groceries, Transport, Shopping, Health, Entertainment, Bills & Utilities, Education, Personal Care, Dining Out, Salary, Freelance, Investment Return, Other Income, Savings, Investment

Use "income" for type only if this is clearly a received payment/transfer to the user.

If no amount can be determined or image is unclear:
{"error": "Tidak dapat membaca informasi transaksi dari gambar ini"}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mediaType } = req.body ?? {};
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType ?? 'image/jpeg',
              data: imageBase64,
            },
          },
          { type: 'text', text: IMAGE_PARSE_PROMPT },
        ],
      }],
    });

    let raw = response.content[0].text.trim();

    // Strip markdown fences if model wraps in ```json
    if (raw.includes('```')) {
      for (const part of raw.split('```')) {
        const cleaned = part.replace(/^json\n?/, '').trim();
        if (cleaned.startsWith('{')) { raw = cleaned; break; }
      }
    }

    const result = JSON.parse(raw);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(200).json({ error: 'Tidak dapat membaca informasi transaksi dari gambar ini' });
    }
    console.error('[parse-image]', err);
    return res.status(500).json({ error: 'Terjadi error saat menganalisis gambar' });
  }
}
