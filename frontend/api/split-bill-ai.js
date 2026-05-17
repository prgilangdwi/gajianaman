import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image_base64, items_text, participants = [] } = req.body;

  if (!image_base64 && !items_text) {
    return res.status(400).json({ error: 'image_base64 or items_text required' });
  }

  try {
    const participantList = participants.join(', ') || 'tidak ada peserta';

    let messages;

    if (image_base64) {
      messages = [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image_base64,
            },
          },
          {
            type: 'text',
            text: `Extract semua item dan harga dari struk ini. Peserta: ${participantList}.
Return ONLY JSON:
{
  "items": [{"name": "...", "price": 12000}],
  "suggestions": [{"person": "...", "items": ["item1"], "subtotal": 12000}]
}
Jika struk tidak jelas, buat estimasi terbaik. No markdown.`,
          },
        ],
      }];
    } else {
      messages = [{
        role: 'user',
        content: `Items dari struk: ${items_text}
Peserta: ${participantList}

Bagi item-item ini ke peserta secara adil. Return ONLY JSON:
{
  "items": [{"name": "...", "price": 12000}],
  "suggestions": [{"person": "...", "items": ["item1"], "subtotal": 12000}]
}
No markdown.`,
      }];
    }

    const { content } = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages,
    });

    const raw = content[0]?.text ?? '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI returned invalid format' });
    }

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Split bill AI error:', err);
    return res.status(500).json({ error: 'AI service error. Coba lagi ya.' });
  }
}
