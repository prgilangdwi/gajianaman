# services/categorizer.py
# Uses OpenRouter (Gemini Flash Lite) for text + image categorization

import json
from services.openrouter_client import chat_completion, chat_completion_with_image

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

This could be: a store receipt (struk), bank transfer screenshot, e-wallet payment (GoPay, OVO, DANA, ShopeePay), food delivery order, invoice, ATM receipt, or any payment confirmation.

Return ONLY valid JSON (no markdown, no explanation):
{
  "amount": <number in IDR — the TOTAL/GRAND TOTAL amount paid>,
  "type": "expense|income|transfer",
  "category": "<one category from list>",
  "subcategory": "<specific subcategory>",
  "note": "<brief merchant/description in Indonesian, max 40 chars>",
  "confidence": "<high|medium|low>",
  "raw_text": "<key text — merchant name or transaction description, max 60 chars>",
  "wallet": "<detected e-wallet or bank, e.g. GoPay, BCA, OVO, DANA, BNI, etc. or null if cash>"
}

Valid categories: Food & Dining, Groceries, Transport, Shopping, Health, Entertainment, Bills & Utilities, Education, Personal Care, Dining Out, Salary, Freelance, Investment Return, Other Income, Savings, Investment

Rules:
- "type": expense for payments made, income for received payments/transfers, transfer for inter-bank/wallet transfers
- "wallet": extract if visible (GoPay, OVO, DANA, ShopeePay, BCA, BNI, Mandiri, BRI, Cash, etc.)
- For bank transfers, check if it's a transfer (to another account) vs payment (to merchant)
- For food delivery screenshots (GrabFood, GojekFood, etc.), extract merchant name in "note"

If no amount can be determined or image is unclear:
{"error": "Tidak dapat membaca informasi transaksi dari gambar ini"}"""


def parse_image_transaction(image_b64: str, media_type: str = "image/jpeg") -> dict:
    """
    Extract transaction info from a receipt/payment screenshot image.
    Uses Gemini Flash vision — fast, cheap vision model.

    Args:
        image_b64: Base64-encoded image bytes
        media_type: MIME type, e.g. "image/jpeg" or "image/png"

    Returns:
        dict with amount, type, category, subcategory, note, confidence, raw_text
        OR {"error": "..."} if image unreadable
    """
    try:
        raw = chat_completion_with_image(
            system=IMAGE_PARSE_PROMPT,
            user="Extract transaction from this image. Return JSON only.",
            image_b64=image_b64,
            media_type=media_type,
            max_tokens=512,
        ).strip()

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
        result.setdefault("wallet", None)

        return result

    except json.JSONDecodeError:
        return {"error": "Tidak dapat membaca informasi transaksi dari gambar ini"}
    except Exception as e:
        print(f"[Image Parser Error] {e}")
        return {"error": "Terjadi error saat menganalisis gambar"}


def categorize_transaction(note: str) -> dict:
    """
    Categorize a transaction note using OpenRouter (Gemini Flash Lite 2.0).
    Synchronous — call from bot handlers directly.

    Args:
        note: Raw transaction description, e.g. "beli jajan di warung"

    Returns:
        dict with keys: category, subcategory, type, confidence, reason
    """
    try:
        raw = chat_completion(
            system=SYSTEM_PROMPT,
            user=f"Transaction note: {note}",
            max_tokens=256,
        ).strip()

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


BATCH_PARSE_PROMPT = """You are a personal finance transaction parser for Indonesian users.
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
"""


def parse_batch_transactions(text: str) -> list:
    """
    Parse multiple transactions from a single natural-language input.
    Uses OpenRouter (Gemini Flash Lite 2.0) to extract structure AND categorize in one call.

    Args:
        text: Multi-transaction natural language text (e.g. "makan 50k, bensin 100k, dari Adi 50rb")

    Returns:
        list[dict] with keys: amount, type, note, date, category, subcategory, confidence
        OR [] if parsing fails or input is empty
    """
    try:
        raw = chat_completion(
            system=BATCH_PARSE_PROMPT,
            user=f"Parse these transactions:\n\n{text}",
            max_tokens=1024,
        ).strip()
        print(f"[Batch Parser] Raw response (first 200 chars): {raw[:200]}")

        # Strip markdown fences if present
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                part = part.strip()
                # Remove "json" prefix if present
                if part.startswith("json"):
                    part = part[4:].strip()
                # Check if this part is a valid JSON array
                if part.startswith("["):
                    raw = part
                    break

        # Extra: try to find JSON array even without markdown fences
        if not raw.startswith("["):
            # Look for [ anywhere in the response
            bracket_idx = raw.find("[")
            if bracket_idx != -1:
                raw = raw[bracket_idx:]
                # Find matching closing bracket
                bracket_count = 0
                for i, c in enumerate(raw):
                    if c == "[":
                        bracket_count += 1
                    elif c == "]":
                        bracket_count -= 1
                        if bracket_count == 0:
                            raw = raw[:i+1]
                            break

        result = json.loads(raw)

        # Validate result is a list
        if not isinstance(result, list):
            return []

        # Cap at 10 transactions
        if len(result) > 10:
            result = result[:10]

        # Ensure required fields
        for tx in result:
            required = ["amount", "type", "note", "date", "category"]
            for field in required:
                if field not in tx:
                    if field == "amount":
                        tx[field] = 0
                    elif field == "type":
                        tx[field] = "expense"
                    elif field == "category":
                        tx[field] = "Other"
                    else:
                        tx[field] = ""

            tx.setdefault("subcategory", "Uncategorized")
            tx.setdefault("confidence", "medium")

        return result

    except json.JSONDecodeError as e:
        print(f"[Batch Parser JSON Error] {e}")
        print(f"[Batch Parser] Raw response was: {raw}")
        return []
    except Exception as e:
        print(f"[Batch Parser Error] {e}")
        print(f"[Batch Parser] Error details: {type(e).__name__}")
        return []


def summarize_batch_transactions(txs: list) -> str:
    """Generate AI summary of batch transactions for preview.

    Args:
        txs: List of parsed transaction dicts (from parse_batch_transactions)

    Returns:
        str: Natural language summary in Indonesian or empty string if error
    """
    if not txs:
        return ""

    try:
        # Build transaction list for Claude
        tx_lines = []
        for tx in txs:
            amount = tx.get("amount", 0)
            note = tx.get("note", "Transaksi")
            category = tx.get("category", "Other")
            tx_type = tx.get("type", "expense")
            tx_lines.append(f"- {amount} {tx_type} ({category}): {note}")

        tx_text = "\n".join(tx_lines)

        prompt = f"""Buatkan ringkasan singkat (1-2 baris) untuk batch transaksi ini dalam bahasa Indonesia:

{tx_text}

Format ringkasan:
- Total: [total amount dalam Rp]
- Breakdown: [kategori utama dengan jumlah transaksi]
- Catatan: [observasi unik jika ada]

Contoh: "Total Rp 250.000 • 2 Food & Dining, 1 Transport, 1 Shopping • Mostly weekday expenses"
"""

        summary = chat_completion(user=prompt, max_tokens=150).strip()
        return summary

    except Exception as e:
        print(f"[Batch Summary Error] {e}")
        return ""
