# 01 · AI Scanner — Upgrade ke Gemini 2.5 Flash + Claude Haiku Fallback

## Ringkasan Perubahan

| | Sebelum | Sesudah |
|---|---|---|
| **Primary model** | Claude Haiku 4.5 | Gemini 2.5 Flash |
| **Fallback model** | — | Claude Haiku 4.5 |
| **Trigger fallback** | — | confidence < 0.80 atau Gemini error |
| **Estimasi cost saving** | baseline | ~65–70% lebih hemat |

Logika routing:
```
Gambar masuk
    ↓
Gemini 2.5 Flash  →  confidence >= 0.80?  →  YES → return hasil
                                           →  NO  → Claude Haiku 4.5
                                                         ↓
                                                    return hasil final
```

---

## 1. Environment Variables

### Python Backend — `.env`
```env
# Sudah ada — tetap dipakai sebagai fallback scanner + AI Advisor
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# BARU — tambahkan baris ini
GEMINI_API_KEY=<your-gemini-api-key>
```

### React Frontend — `frontend/.env`
```env
# Sudah ada
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...

# BARU — untuk Vercel serverless (parse-image.js)
ANTHROPIC_API_KEY=<your-anthropic-api-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

> **Vercel Dashboard:** Settings → Environment Variables → tambahkan `GEMINI_API_KEY`
> **Railway Dashboard:** Variables → tambahkan `GEMINI_API_KEY`

---

## 2. Install Dependencies

### Python Backend
```bash
pip install google-generativeai>=0.8.0
```

Tambahkan ke `requirements.txt`:
```
google-generativeai>=0.8.0
```

### Node.js — Vercel Serverless
```bash
cd frontend
npm install @google/generative-ai
```

---

## 3. File yang Diubah

```
services/
└── categorizer.py        ← REPLACE seluruh file

frontend/api/
└── parse-image.js        ← REPLACE seluruh file
```

Fungsi `categorize_transaction()` untuk teks **tidak berubah** — hanya bagian
image parsing yang di-upgrade ke dual-model.

---

## 4. `services/categorizer.py` — Full File

```python
# services/categorizer.py
# ─────────────────────────────────────────────────────────────────────────────
# AI Scanner  : Gemini 2.5 Flash (primary) → Claude Haiku 4.5 (fallback)
# Text categ. : Claude Haiku 4.5 (tidak berubah)
# ─────────────────────────────────────────────────────────────────────────────

import anthropic
import google.generativeai as genai
import base64
import json
import os
from typing import Optional

# ── Clients ───────────────────────────────────────────────────────────────────
anthropic_client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# ── Config ────────────────────────────────────────────────────────────────────
CONFIDENCE_THRESHOLD = 0.80   # turunkan ke 0.75 jika Claude terlalu sering dipanggil
GEMINI_MODEL         = "gemini-2.5-flash"
CLAUDE_MODEL         = "claude-haiku-4-5-20251001"

# ── Shared image parse prompt ─────────────────────────────────────────────────
# Dipakai oleh kedua model supaya output JSON konsisten
IMAGE_PARSE_PROMPT = """Kamu adalah asisten keuangan pribadi yang membantu menganalisis \
gambar struk belanja, screenshot pembayaran, atau konfirmasi transaksi e-wallet \
(GoPay, OVO, Dana, ShopeePay, dll).

Analisis gambar ini dan ekstrak informasi transaksi.
Kembalikan HANYA JSON berikut, tanpa penjelasan atau markdown apapun:

{
  "amount": <angka bulat tanpa titik/koma, contoh: 50000>,
  "type": "expense" atau "income",
  "category": "<kategori dari daftar di bawah>",
  "subcategory": "<opsional, lebih spesifik>",
  "note": "<deskripsi singkat dalam Bahasa Indonesia, maks 60 karakter>",
  "confidence": <angka 0.0 sampai 1.0>,
  "raw_text": "<teks penting yang terbaca dari gambar>"
}

Kategori EXPENSE:
- Food & Dining     (restoran, kafe)
- Groceries         (supermarket, warung, pasar)
- Transport         (ojek, taksi, parkir, bensin, tol, KRL)
- Shopping          (belanja online/offline non-groceries)
- Health            (obat, dokter, apotek, klinik)
- Entertainment     (hiburan, streaming, game, bioskop)
- Bills & Utilities (listrik, air, internet, pulsa, BPJS)
- Education         (kursus, buku, alat tulis, SPP)
- Personal Care     (salon, gym, skincare, barbershop)
- Dining Out        (fast food, warteg, kantin, foodcourt)

Kategori INCOME:
- Salary | Freelance | Investment Return | Other Income

Aturan:
- Gambar buram / bukan bukti transaksi → confidence < 0.50
- amount wajib angka positif
- E-wallet: cari nominal transfer/pembayaran, BUKAN saldo"""

# ── Text categorizer prompt ───────────────────────────────────────────────────
TEXT_CATEGORIZE_PROMPT = """Kamu adalah sistem kategorisasi transaksi keuangan \
untuk pengguna Indonesia. Kategorikan teks transaksi berikut.

Kembalikan HANYA JSON, tanpa penjelasan:
{
  "category": "<kategori>",
  "subcategory": "<subkategori opsional>",
  "type": "expense" atau "income",
  "confidence": <0.0 sampai 1.0>,
  "reason": "<alasan singkat 1 kalimat>"
}

Kategori expense  : Food & Dining, Groceries, Transport, Shopping, Health,
                    Entertainment, Bills & Utilities, Education, Personal Care, Dining Out
Kategori income   : Salary, Freelance, Investment Return, Other Income
Kategori saving   : Savings, Investment"""


# ─────────────────────────────────────────────────────────────────────────────
# TEXT CATEGORIZER — tidak berubah
# ─────────────────────────────────────────────────────────────────────────────

def categorize_transaction(note: str) -> dict:
    """
    Kategorisasi teks transaksi menggunakan Claude Haiku 4.5.
    Dipanggil oleh bot handlers untuk /add dan /income command.
    """
    try:
        response = anthropic_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": f"{TEXT_CATEGORIZE_PROMPT}\n\nTeks transaksi: \"{note}\""
            }]
        )
        raw = response.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(raw)

    except (json.JSONDecodeError, Exception) as e:
        print(f"[Categorizer] Error: {type(e).__name__}: {e}")
        return {
            "category": "Other",
            "subcategory": None,
            "type": "expense",
            "confidence": 0.0,
            "reason": "Gagal kategorisasi otomatis"
        }


# ─────────────────────────────────────────────────────────────────────────────
# IMAGE SCANNER — DUAL MODEL
# ─────────────────────────────────────────────────────────────────────────────

def _parse_with_gemini(image_base64: str, media_type: str) -> Optional[dict]:
    """Primary: Gemini 2.5 Flash. Returns dict atau None jika gagal."""
    try:
        model        = genai.GenerativeModel(GEMINI_MODEL)
        image_bytes  = base64.b64decode(image_base64)

        response = model.generate_content([
            IMAGE_PARSE_PROMPT,
            {"mime_type": media_type, "data": image_bytes}
        ])

        raw = response.text.strip()
        if raw.startswith("```"):
            # strip markdown code fence jika model menambahkannya
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:].strip()

        result = json.loads(raw)
        result["_parsed_by"] = "gemini-2.5-flash"
        return result

    except (json.JSONDecodeError, Exception) as e:
        print(f"[Scanner/Gemini] {type(e).__name__}: {e}")
        return None


def _parse_with_claude(image_base64: str, media_type: str) -> Optional[dict]:
    """Fallback: Claude Haiku 4.5. Dipanggil jika Gemini gagal/low confidence."""
    try:
        response = anthropic_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=400,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_base64,
                        }
                    },
                    {"type": "text", "text": IMAGE_PARSE_PROMPT}
                ]
            }]
        )
        raw = response.content[0].text.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(raw)
        result["_parsed_by"] = "claude-haiku-4-5"
        return result

    except (json.JSONDecodeError, Exception) as e:
        print(f"[Scanner/Claude] {type(e).__name__}: {e}")
        return None


def parse_image_transaction(image_base64: str, media_type: str = "image/jpeg") -> dict:
    """
    Main entry point untuk image parsing — dual-model router.

    Urutan:
      1. Gemini 2.5 Flash  → jika confidence >= CONFIDENCE_THRESHOLD: return
      2. Claude Haiku 4.5  → jika Gemini gagal/low confidence: return
      3. Error dict        → jika kedua model gagal, user input manual

    Args:
        image_base64 : Base64 encoded image string
        media_type   : MIME type, default "image/jpeg"

    Returns:
        dict: amount, type, category, subcategory, note,
              confidence, raw_text, _parsed_by
    """
    # ── Step 1: Gemini primary ────────────────────────────────────────────────
    gemini_result = _parse_with_gemini(image_base64, media_type)

    if gemini_result:
        confidence = float(gemini_result.get("confidence", 0))
        if confidence >= CONFIDENCE_THRESHOLD:
            print(f"[Scanner] Gemini OK ✓ (conf={confidence:.2f})")
            return gemini_result
        print(f"[Scanner] Gemini low confidence ({confidence:.2f}) → fallback Claude")
    else:
        print("[Scanner] Gemini error → fallback Claude")

    # ── Step 2: Claude Haiku fallback ─────────────────────────────────────────
    claude_result = _parse_with_claude(image_base64, media_type)
    if claude_result:
        print(f"[Scanner] Claude fallback OK ✓ (conf={claude_result.get('confidence', 0):.2f})")
        return claude_result

    # ── Step 3: Both failed ───────────────────────────────────────────────────
    print("[Scanner] Kedua model gagal → error dict")
    return {
        "amount":      0,
        "type":        "expense",
        "category":    "Other",
        "subcategory": None,
        "note":        "Gagal membaca gambar. Silakan input manual.",
        "confidence":  0.0,
        "raw_text":    "",
        "_parsed_by":  "none",
        "_error":      True,
    }
```

---

## 5. `frontend/api/parse-image.js` — Full File

```javascript
// frontend/api/parse-image.js
// ─────────────────────────────────────────────────────────────────────────────
// Vercel Serverless Function
// Primary  : Gemini 2.5 Flash
// Fallback : Claude Haiku 4.5
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic              from "@anthropic-ai/sdk";

const genai     = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CONFIDENCE_THRESHOLD = 0.80;

const IMAGE_PARSE_PROMPT = `Kamu adalah asisten keuangan pribadi yang membantu \
menganalisis gambar struk belanja, screenshot pembayaran, atau konfirmasi \
transaksi e-wallet (GoPay, OVO, Dana, ShopeePay, dll).

Analisis gambar ini dan ekstrak informasi transaksi.
Kembalikan HANYA JSON berikut, tanpa penjelasan atau markdown apapun:

{
  "amount": <angka bulat tanpa titik/koma, contoh: 50000>,
  "type": "expense" atau "income",
  "category": "<kategori dari daftar di bawah>",
  "subcategory": "<opsional, lebih spesifik>",
  "note": "<deskripsi singkat dalam Bahasa Indonesia, maks 60 karakter>",
  "confidence": <angka 0.0 sampai 1.0>,
  "raw_text": "<teks penting yang terbaca dari gambar>"
}

Kategori EXPENSE:
Food & Dining, Groceries, Transport, Shopping, Health,
Entertainment, Bills & Utilities, Education, Personal Care, Dining Out

Kategori INCOME:
Salary, Freelance, Investment Return, Other Income

Aturan:
- Gambar buram / bukan bukti transaksi → confidence < 0.50
- amount wajib angka positif
- E-wallet: cari nominal transfer/pembayaran, BUKAN saldo`;


async function parseWithGemini(base64Image, mimeType) {
  try {
    const model  = genai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      IMAGE_PARSE_PROMPT,
      { inlineData: { data: base64Image, mimeType } },
    ]);
    let text = result.response.text().trim();
    text     = text.replace(/```json|```/g, "").trim();
    const parsed      = JSON.parse(text);
    parsed._parsed_by = "gemini-2.5-flash";
    return parsed;
  } catch (e) {
    console.error("[Scanner/Gemini]", e.message);
    return null;
  }
}

async function parseWithClaude(base64Image, mimeType) {
  try {
    const response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Image } },
          { type: "text",  text: IMAGE_PARSE_PROMPT },
        ],
      }],
    });
    let text = response.content[0].text.trim();
    text     = text.replace(/```json|```/g, "").trim();
    const parsed      = JSON.parse(text);
    parsed._parsed_by = "claude-haiku-4-5";
    return parsed;
  } catch (e) {
    console.error("[Scanner/Claude]", e.message);
    return null;
  }
}


export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { image, mimeType = "image/jpeg" } = req.body;
  if (!image) return res.status(400).json({ error: "No image provided" });

  // Step 1 — Gemini primary
  const geminiResult = await parseWithGemini(image, mimeType);
  if (geminiResult && parseFloat(geminiResult.confidence) >= CONFIDENCE_THRESHOLD) {
    console.log(`[Scanner] Gemini OK ✓ (conf=${geminiResult.confidence})`);
    return res.status(200).json(geminiResult);
  }
  console.log("[Scanner] Gemini low/fail → fallback Claude");

  // Step 2 — Claude fallback
  const claudeResult = await parseWithClaude(image, mimeType);
  if (claudeResult) {
    console.log("[Scanner] Claude fallback OK ✓");
    return res.status(200).json(claudeResult);
  }

  // Step 3 — Both failed
  return res.status(200).json({
    amount:     0,
    type:       "expense",
    category:   "Other",
    note:       "Gagal membaca gambar. Silakan input manual.",
    confidence: 0.0,
    raw_text:   "",
    _parsed_by: "none",
    _error:     true,
  });
}
```

---

## 6. Deployment Checklist

```
Python Backend (Railway)
□ pip install google-generativeai>=0.8.0
□ Tambah google-generativeai>=0.8.0 ke requirements.txt
□ Tambah GEMINI_API_KEY ke Railway Variables
□ Replace services/categorizer.py dengan file baru di atas
□ Redeploy Railway

React Frontend (Vercel)
□ cd frontend && npm install @google/generative-ai
□ Tambah GEMINI_API_KEY ke Vercel Environment Variables
□ Replace frontend/api/parse-image.js dengan file baru di atas
□ Redeploy Vercel

Testing
□ Upload foto struk jelas → cek log "[Scanner] Gemini OK ✓"
□ Upload foto buram → cek log fallback ke Claude
□ Cek field _parsed_by di response JSON
□ Adjust CONFIDENCE_THRESHOLD jika routing tidak sesuai ekspektasi
```
