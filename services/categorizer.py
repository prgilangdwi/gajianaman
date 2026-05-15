# services/categorizer.py
# Uses Claude Haiku for fast, cheap transaction categorization

import anthropic
import json
import os
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

SYSTEM_PROMPT = """You are a personal finance categorization assistant for Indonesian users.

Given a transaction note (in Indonesian or English), classify it into one of these categories:

EXPENSE categories:
- Food & Dining       → makan, minum, warung, resto, cafe, bakso, nasi, kopi, jajan, beli makan
- Groceries           → supermarket, indomaret, alfamart, belanja, sayur, bahan masak, sembako
- Transport           → grab, gojek, bensin, parkir, tol, ojek, busway, kereta, taksi, bbm
- Shopping            → baju, sepatu, shopee, tokopedia, mall, belanja online, elektronik
- Health              → apotek, dokter, obat, klinik, rumah sakit, vitamin, bpjs
- Entertainment       → bioskop, netflix, spotify, game, konser, youtube premium, disney
- Bills & Utilities   → listrik, air, internet, pulsa, pln, telkom, wifi, indihome
- Education           → kursus, buku, seminar, pelatihan, sekolah, les, udemy
- Personal Care       → salon, potong rambut, skincare, makeup, gym, perawatan
- Dining Out          → restoran, makan di luar, delivery, gofood, grabfood, shopeefood

INCOME categories:
- Salary              → gaji, salary, thr
- Freelance           → freelance, project, fee, honor
- Investment Return   → dividen, return, bunga, profit
- Other Income        → transfer masuk, cashback, refund

SAVING categories:
- Savings             → nabung, saving, deposit, tabungan
- Investment          → investasi, reksa dana, saham, crypto, emas

Rules:
- Return ONLY valid JSON. No text outside JSON.
- Always pick the best matching category even if uncertain.
- Use context of Indonesian daily life.

Return this exact format:
{
  "category": "Food & Dining",
  "subcategory": "Street Food / Snacks",
  "type": "expense",
  "confidence": "high",
  "reason": "Kata 'jajan di warung' menunjukkan pembelian makanan di warung kecil."
}"""


IMAGE_PARSE_PROMPT = """Analyze this image and extract financial transaction information.

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
{"error": "Tidak dapat membaca informasi transaksi dari gambar ini"}"""


def parse_image_transaction(image_b64: str, media_type: str = "image/jpeg") -> dict:
    """
    Extract transaction info from a receipt/payment screenshot image.
    Uses Claude Haiku vision — cheapest vision model.

    Args:
        image_b64: Base64-encoded image bytes
        media_type: MIME type, e.g. "image/jpeg" or "image/png"

    Returns:
        dict with amount, type, category, subcategory, note, confidence, raw_text
        OR {"error": "..."} if image unreadable
    """
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {"type": "text", "text": IMAGE_PARSE_PROMPT},
                ],
            }],
        )

        raw = response.content[0].text.strip()

        if "```" in raw:
            for part in raw.split("```"):
                part = part.strip().lstrip("json").strip()
                if part.startswith("{"):
                    raw = part
                    break

        result = json.loads(raw)

        if "error" in result:
            return result

        result.setdefault("amount", 0)
        result.setdefault("type", "expense")
        result.setdefault("category", "Other")
        result.setdefault("subcategory", "Uncategorized")
        result.setdefault("note", "Transaksi dari foto")
        result.setdefault("confidence", "low")
        result.setdefault("raw_text", "")

        return result

    except json.JSONDecodeError:
        return {"error": "Tidak dapat membaca informasi transaksi dari gambar ini"}
    except Exception as e:
        print(f"[Image Parser Error] {e}")
        return {"error": "Terjadi error saat menganalisis gambar"}


def categorize_transaction(note: str) -> dict:
    """
    Categorize a transaction note using Claude Haiku.
    Synchronous — call from bot handlers directly.
    
    Args:
        note: Raw transaction description, e.g. "beli jajan di warung"
    
    Returns:
        dict with keys: category, subcategory, type, confidence, reason
    """
    try:
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": f"Transaction note: {note}"}
            ]
        )

        raw = response.content[0].text.strip()

        # Strip markdown fences if model wraps in ```json
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    raw = part
                    break

        result = json.loads(raw.strip())

        # Validate required fields
        required = ["category", "subcategory", "type", "confidence", "reason"]
        for field in required:
            if field not in result:
                result[field] = "Unknown" if field != "type" else "expense"

        return result

    except json.JSONDecodeError:
        return {
            "category": "Other",
            "subcategory": "Uncategorized",
            "type": "expense",
            "confidence": "low",
            "reason": "Tidak dapat mengklasifikasikan otomatis."
        }
    except Exception as e:
        print(f"[Categorizer Error] {e}")
        return {
            "category": "Other",
            "subcategory": "Uncategorized",
            "type": "expense",
            "confidence": "low",
            "reason": "Terjadi error saat kategorisasi."
        }
