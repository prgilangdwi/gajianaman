import { chatCompletion, chatCompletionWithImage } from './lib/openrouter.js';

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

    let raw;
    if (image_base64) {
      raw = await chatCompletionWithImage({
        userText: `Extract semua item dan harga dari struk ini. Peserta: ${participantList}.
Return ONLY JSON:
{
  "items": [{"name": "...", "price": 12000}],
  "suggestions": [{"person": "...", "items": ["item1"], "subtotal": 12000}]
}
Jika struk tidak jelas, buat estimasi terbaik. No markdown.`,
        imageBase64: image_base64,
        mediaType: 'image/jpeg',
        max_tokens: 400,
      });
    } else {
      raw = await chatCompletion({
        messages: [{
          role: 'user',
          content: `Items dari struk: ${items_text}
Peserta: ${participantList}

Bagi item-item ini ke peserta secara adil. Return ONLY JSON:
{
  "items": [{"name": "...", "price": 12000}],
  "suggestions": [{"person": "...", "items": ["item1"], "subtotal": 12000}]
}
No markdown.`,
        }],
        max_tokens: 400,
      });
    }

    const jsonMatch = (raw ?? '{}').match(/\{[\s\S]*\}/);
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
