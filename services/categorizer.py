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
