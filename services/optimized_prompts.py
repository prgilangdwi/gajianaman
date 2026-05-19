# services/optimized_prompts.py
from services.categorization_profile import CategorizationProfile
import json

def generate_cached_system_prompt(profile: CategorizationProfile) -> str:
    """
    Generate system prompt with Anthropic prompt caching headers.

    Caching strategy:
    - System prompt is expensive (~500 tokens) and reused across calls
    - Set cache_control to ephemeral so it caches after first call
    - Subsequent calls in same session reuse cached prompt (10% cost)

    Args:
        profile: User's categorization profile

    Returns:
        System prompt string ready for API call
    """

    # Build category list from profile's top categories
    top_cats = profile.top_categories
    top_cat_str = ", ".join([f"{cat} ({pct*100:.0f}%)"
                             for cat, pct in list(top_cats.items())[:5]])

    # Build disambiguation hints
    disambiguation_hints = ""
    if profile.problem_pairs:
        disambiguation_hints = "\n\nKNOWN AMBIGUITIES FOR THIS USER:\n"
        for pair in profile.problem_pairs[:3]:  # Limit to 3
            disambiguation_hints += f"- {' vs '.join(pair.pair)}: {pair.note}\n"

    # Build few-shot examples
    few_shot_str = ""
    if profile.few_shot_examples:
        few_shot_str = "\n\nEXAMPLES FROM USER'S HISTORY:\n"
        for ex in profile.few_shot_examples[:5]:  # Limit to 5
            few_shot_str += f"- '{ex.note}' → {ex.category} ({ex.confidence})\n"

    prompt = f"""You are a personal finance categorization assistant for Indonesian users.
Your job: Given a transaction note, classify it into ONE category.

USER PROFILE:
- Most common categories: {top_cat_str}
- User's currency: IDR
- Context: Indonesian daily life transactions{disambiguation_hints}{few_shot_str}

EXPENSE CATEGORIES:
- Food & Dining       → makan, minum, warung, resto, cafe, bakso, nasi, kopi, jajan
- Groceries           → supermarket, indomaret, alfamart, belanja, sayur, sembako
- Transport           → grab, gojek, bensin, parkir, tol, ojek, busway, kereta
- Shopping            → baju, sepatu, shopee, tokopedia, mall, elektronik
- Health              → apotek, dokter, obat, klinik, vitamin, bpjs
- Entertainment       → bioskop, netflix, spotify, game, konser, youtube premium
- Bills & Utilities   → listrik, air, internet, pulsa, pln, telkom, indihome
- Education           → kursus, buku, seminar, pelatihan, les, udemy
- Personal Care       → salon, potong rambut, skincare, gym, perawatan
- Dining Out          → restoran, makan di luar, delivery, gofood, grabfood

INCOME CATEGORIES:
- Salary              → gaji, salary, thr
- Freelance           → freelance, project, fee, honor
- Investment Return   → dividen, return, bunga, profit
- Other Income        → transfer masuk, cashback, refund

SAVING CATEGORIES:
- Savings             → nabung, saving, deposit, tabungan
- Investment          → investasi, reksa dana, saham, crypto, emas

RESPONSE FORMAT (JSON only, no markdown):
{{
  "category": "Category Name",
  "subcategory": "Specific type",
  "type": "expense|income|savings",
  "confidence": "high|medium|low",
  "reason": "Brief explanation in Indonesian"
}}

Rules:
1. Return ONLY valid JSON. No text outside JSON.
2. Match to user's top categories when possible.
3. Use context of Indonesian daily life.
4. If truly ambiguous, pick best match and note in reason."""

    return prompt

def generate_cached_image_prompt(profile: CategorizationProfile) -> str:
    """
    Generate system prompt for image parsing with caching.

    Args:
        profile: User's categorization profile

    Returns:
        System prompt for image analysis
    """

    top_cats = ", ".join(list(profile.top_categories.keys())[:5])

    prompt = f"""You are a financial receipt analyzer for Indonesian users.
Your job: Extract transaction information from an image (receipt, bank transfer, e-wallet payment).

USER PROFILE:
- Common categories: {top_cats}
- Currency: IDR

Valid categories:
Food & Dining, Groceries, Transport, Shopping, Health, Entertainment, Bills & Utilities,
Education, Personal Care, Dining Out, Salary, Freelance, Investment Return, Other Income,
Savings, Investment

RESPONSE FORMAT (JSON only):
{{
  "amount": <number in IDR — the TOTAL amount>,
  "type": "expense|income|transfer",
  "category": "<category>",
  "subcategory": "<specific type>",
  "note": "<merchant name, max 40 chars>",
  "confidence": "high|medium|low",
  "raw_text": "<key text from image, max 60 chars>",
  "wallet": "<payment method or null if cash>"
}}

Rules:
1. Extract the GRAND TOTAL / final amount paid.
2. "type": "expense" for payments, "income" for received, "transfer" for inter-account.
3. Parse Indonesian text accurately.
4. If image is unclear, return: {{"error": "Tidak dapat membaca gambar"}}"""

    return prompt

def get_prompt_cache_control() -> dict:
    """
    Return cache control header for prompts.
    Anthropic prompt caching: ephemeral cache lasts 5 minutes.
    """
    return {
        "type": "ephemeral"
    }
