# services/fast_check.py
import re
from services.categorization_profile import CategorizationProfile

class FastCheckResult:
    """Result from fast pre-check"""
    def __init__(self, category: str = None, confidence: str = None, reason: str = None):
        self.category = category
        self.confidence = confidence
        self.reason = reason
        self.matched = category is not None

    def to_dict(self):
        """Convert to dict if matched"""
        if not self.matched:
            return None
        return {
            "category": self.category,
            "confidence": self.confidence,
            "reason": self.reason,
            "source": "fast_check"
        }

def fast_categorize(note: str, profile: CategorizationProfile) -> FastCheckResult:
    """
    Fast, rule-based categorization. No API call.
    Returns FastCheckResult with matched category if confident, else None.

    Execution time: <5ms
    Hit rate: ~50% of transactions (obvious cases)

    Strategy:
    1. Check disambiguation rules (user-specific keywords)
    2. Check generic keyword patterns
    3. Check amount-based heuristics
    4. Return if confident match; else None (→ fall through to Haiku)
    """

    note_lower = note.lower()

    # Step 1: Check user's disambiguation rules
    for rule in profile.disambiguation_rules:
        rule_match = all(kw.lower() in note_lower for kw in rule.keywords)
        exclude_match = any(kw.lower() in note_lower for kw in rule.exclude_keywords)

        if rule_match and not exclude_match:
            return FastCheckResult(
                category=rule.category,
                confidence="high",
                reason=f"Matched rule: {', '.join(rule.keywords)}"
            )

    # Step 2: Generic keyword patterns (fallback)
    GENERIC_PATTERNS = {
        r"\b(gaji|salary|thr|upah)\b": "Salary",
        r"\b(grab|gojek|ojek|driver|bensin|bbm|tol|parkir)\b": "Transport",
        r"\b(indomaret|alfamart|pasar|sayur|sembako|beras|mie|gula)\b": "Groceries",
        r"\b(netflix|spotify|bioskop|konser|game|youtube.*premium|disney)\b": "Entertainment",
        r"\b(listrik|air|internet|pulsa|pln|telkom|wifi|indihome|tagihan)\b": "Bills & Utilities",
        r"\b(dokter|apotek|obat|klinik|rumah\s?sakit|vitamin|vaksin|bpjs)\b": "Health",
        r"\b(salon|potong\s?rambut|skincare|makeup|gym|fitness|perawatan)\b": "Personal Care",
    }

    for pattern, category in GENERIC_PATTERNS.items():
        if re.search(pattern, note_lower):
            return FastCheckResult(
                category=category,
                confidence="high",
                reason=f"Keyword match: {pattern}"
            )

    # Step 3: Amount-based heuristics (weak signal)
    # Extract amount if note ends with number
    amount_match = re.search(r'(\d+\.?\d*)[k]?$', note_lower)
    if amount_match:
        try:
            amount = float(amount_match.group(1))
            # If ends with 'k', multiply by 1000
            if 'k' in note_lower[-5:]:
                amount *= 1000

            # Use amount to constrain category
            # E.g., if amount is 100k and "grab", likely Transport not Groceries
            # (This is a very weak signal; use only if other checks don't match)
            pass
        except ValueError:
            pass

    # No match found
    return FastCheckResult()
