# services/categorizer_v2.py
import json
from services.categorization_profile import CategorizationProfile
from services.optimized_prompts import (
    generate_cached_system_prompt,
    generate_cached_image_prompt,
)
from services.fast_check import fast_categorize
from services.openrouter_client import chat_completion, chat_completion_with_image

def categorize_transaction(note: str, profile: CategorizationProfile) -> dict:
    """
    Enhanced transaction categorization with three layers:

    Layer 1: Fast pre-check (rule-based, <5ms, ~50% hit rate)
    Layer 2: Gemini Flash Lite via OpenRouter (if Layer 1 uncertain)
    Layer 3: Confidence-based fallback (suggest clarification if low confidence)

    Args:
        note: Transaction description (e.g., "makan soto betawi")
        profile: User's categorization profile

    Returns:
        dict with keys: category, subcategory, type, confidence, reason, suggest_clarification (optional)
    """

    # LAYER 1: Fast pre-check
    fast_result = fast_categorize(note, profile)
    if fast_result.matched:
        return fast_result.to_dict()

    # LAYER 2: OpenRouter call with context injection
    system_prompt = generate_cached_system_prompt(profile)

    try:
        raw = chat_completion(
            system=system_prompt,
            user=f"Transaction note: {note}",
            max_tokens=256,
        ).strip()

        # Strip markdown if present
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    raw = part
                    break

        result = json.loads(raw)

        # Validate required fields
        required = ["category", "subcategory", "type", "confidence", "reason"]
        for field in required:
            if field not in result:
                result[field] = "Unknown" if field != "type" else "expense"

        # LAYER 3: Smart fallback for low confidence
        if result.get("confidence") == "low":
            # Suggest clarification based on problem pairs
            suggested = []
            for pair in profile.problem_pairs:
                if any(kw.lower() in note.lower() for kw in pair.keywords):
                    suggested.extend(pair.pair)

            result["suggest_clarification"] = True
            result["suggested_clarifications"] = list(set(suggested))

        return result

    except json.JSONDecodeError:
        return {
            "category": "Other",
            "subcategory": "Uncategorized",
            "type": "expense",
            "confidence": "low",
            "reason": "Failed to parse response",
            "source": "categorizer_v2"
        }
    except Exception as e:
        print(f"[Categorizer V2 Error] {e}")
        return {
            "category": "Other",
            "subcategory": "Uncategorized",
            "type": "expense",
            "confidence": "low",
            "reason": f"Error: {str(e)}",
            "source": "categorizer_v2"
        }

def parse_image_transaction(image_b64: str, profile: CategorizationProfile, media_type: str = "image/jpeg") -> dict:
    """
    Extract transaction info from receipt/payment image using OpenRouter (Gemini Flash Lite 2.0).

    Args:
        image_b64: Base64-encoded image bytes
        profile: User's categorization profile
        media_type: MIME type (image/jpeg or image/png)

    Returns:
        dict with amount, type, category, subcategory, note, confidence, wallet
        OR {"error": "..."} if image unreadable
    """

    system_prompt = generate_cached_image_prompt(profile)

    try:
        raw = chat_completion_with_image(
            system=system_prompt,
            user="Extract transaction from this image. Return JSON only.",
            image_b64=image_b64,
            media_type=media_type,
            max_tokens=512,
        ).strip()

        # Strip markdown if present
        if "```" in raw:
            parts = raw.split("```")
            for part in parts:
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    raw = part
                    break

        result = json.loads(raw)

        if "error" in result:
            return result

        # Set defaults for missing fields
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
        print(f"[Image Parser V2 Error] {e}")
        return {"error": "Terjadi error saat menganalisis gambar"}
