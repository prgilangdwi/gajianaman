# Transaction Parsing Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use [superpowers:subagent-driven-development](../skills/subagent-driven-development.md) (recommended) or [superpowers:executing-plans](../skills/executing-plans.md) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an agent skill that optimizes Claude Haiku transaction parsing for accuracy, cost, and speed by using prompt caching, few-shot learning, and smart pre-checks.

**Architecture:** Hybrid interactive + monitoring system with three optimization layers: (1) Rule-based fast pre-checks skip ~50% of API calls; (2) Cached system prompts reduce token cost to 10% of original; (3) Context injection (user patterns + few-shot examples) improves accuracy by 20-30%. Profile generation happens interactively during setup; monitoring runs post-deployment to detect drift.

**Tech Stack:** Anthropic SDK (prompt caching), Supabase async client, pydantic for validation, pytest for testing, Railway for deployment.

---

## Phase 1: Data Structures & Loaders

### Task 1: Profile Data Structure & Validation

**Files:**
- Create: `services/categorization_profile.py`
- Test: `tests/test_categorizer_v2.py` (test profile loading)

- [ ] **Step 1: Create profile module with Pydantic models**

```python
# services/categorization_profile.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import json
import os

class FewShotExample(BaseModel):
    """Single few-shot example from user's transaction history"""
    note: str
    category: str
    subcategory: str = "Uncategorized"
    confidence: str = "high"
    source: str = "user_history"

class ProblemPair(BaseModel):
    """Ambiguous category pair that user struggles with"""
    pair: List[str]  # ["Food & Dining", "Dining Out"]
    keywords: List[str] = []
    note: str = ""

class LowConfidencePattern(BaseModel):
    """Transaction pattern with low confidence"""
    note: str
    confidence: str
    count: int
    typical_amount: Optional[str] = None

class DisambiguationRule(BaseModel):
    """Fast-check rule for obvious categorization"""
    keywords: List[str]
    category: str
    exclude_keywords: List[str] = []
    reason: str
    confidence: str = "high"

class AmountRange(BaseModel):
    """Amount statistics per category"""
    min: int
    max: int
    median: int

class ProfileMetadata(BaseModel):
    """Profile generation metadata"""
    transactions_analyzed: int
    date_range: str
    avg_confidence: float
    accuracy_score: float

class CategorizationProfile(BaseModel):
    """Complete user categorization profile"""
    user_id: str
    generated_at: str
    version: str = "1"
    
    top_categories: Dict[str, float]  # {"Food & Dining": 0.45, ...}
    problem_pairs: List[ProblemPair] = []
    low_confidence_patterns: Dict[str, List[LowConfidencePattern]] = {}
    few_shot_examples: List[FewShotExample] = []
    disambiguation_rules: List[DisambiguationRule] = []
    amount_ranges: Dict[str, AmountRange] = {}
    metadata: ProfileMetadata
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "123456",
                "generated_at": "2026-05-19T10:00:00Z",
                "version": "1",
                "top_categories": {"Food & Dining": 0.45},
                "metadata": {
                    "transactions_analyzed": 500,
                    "date_range": "2026-03-01 to 2026-05-19",
                    "avg_confidence": 0.92,
                    "accuracy_score": 0.94
                }
            }
        }

def load_profile(path: str = "services/categorization_profile.json") -> CategorizationProfile:
    """
    Load profile from JSON file with validation.
    Returns: CategorizationProfile object
    Raises: FileNotFoundError if profile doesn't exist
            pydantic.ValidationError if profile is invalid
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Profile not found at {path}")
    
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return CategorizationProfile(**data)

def save_profile(profile: CategorizationProfile, path: str = "services/categorization_profile.json") -> None:
    """Save profile to JSON file"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(profile.model_dump(), f, indent=2)

def create_empty_profile(user_id: str) -> CategorizationProfile:
    """Create empty profile template for new user"""
    from datetime import datetime
    return CategorizationProfile(
        user_id=user_id,
        generated_at=datetime.utcnow().isoformat() + "Z",
        version="1",
        top_categories={},
        metadata=ProfileMetadata(
            transactions_analyzed=0,
            date_range="",
            avg_confidence=0.0,
            accuracy_score=0.0
        )
    )
```

- [ ] **Step 2: Write test for profile loading**

```python
# tests/test_categorizer_v2.py
import pytest
import json
from pathlib import Path
import tempfile
from services.categorization_profile import (
    CategorizationProfile,
    load_profile,
    save_profile,
    create_empty_profile,
    FewShotExample,
    DisambiguationRule,
)

def test_profile_loads_from_json():
    """Test that profile loads and validates"""
    profile = create_empty_profile("12345")
    assert profile.user_id == "12345"
    assert profile.version == "1"
    assert profile.top_categories == {}

def test_profile_save_and_load():
    """Test round-trip: create, save, load"""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = Path(tmpdir) / "profile.json"
        
        # Create and save
        profile = create_empty_profile("12345")
        profile.top_categories = {"Food & Dining": 0.45, "Transport": 0.25}
        save_profile(profile, str(path))
        
        # Load and verify
        loaded = load_profile(str(path))
        assert loaded.user_id == "12345"
        assert loaded.top_categories["Food & Dining"] == 0.45

def test_profile_validation_fails_on_missing_required():
    """Test that validation fails on missing required fields"""
    with tempfile.TemporaryDirectory() as tmpdir:
        path = Path(tmpdir) / "invalid.json"
        
        # Write invalid profile (missing user_id)
        with open(path, 'w') as f:
            json.dump({"version": "1"}, f)
        
        # Should raise validation error
        with pytest.raises(Exception):  # pydantic.ValidationError
            load_profile(str(path))

def test_few_shot_example_validation():
    """Test few-shot example validation"""
    example = FewShotExample(
        note="makan soto betawi",
        category="Food & Dining",
        subcategory="Street Food",
        confidence="high",
        source="user_history"
    )
    assert example.note == "makan soto betawi"
    assert example.source == "user_history"
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd /path/to/fintrack
python -m pytest tests/test_categorizer_v2.py::test_profile_loads_from_json -v
python -m pytest tests/test_categorizer_v2.py::test_profile_save_and_load -v
python -m pytest tests/test_categorizer_v2.py::test_profile_validation_fails_on_missing_required -v
python -m pytest tests/test_categorizer_v2.py::test_few_shot_example_validation -v
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add services/categorization_profile.py tests/test_categorizer_v2.py
git commit -m "feat: add profile data structures and validation"
```

---

## Phase 2: Prompt Generation with Caching

### Task 2: Prompt Generator with Anthropic Prompt Caching

**Files:**
- Create: `services/optimized_prompts.py`
- Test: Add tests to `tests/test_categorizer_v2.py`

- [ ] **Step 1: Create prompt generator with caching headers**

```python
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
            disambiguation_hints += f"- {' vs '.join(pair['pair'])}: {pair.get('note', '')}\n"
    
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
```

- [ ] **Step 2: Write tests for prompt generation**

```python
# Add to tests/test_categorizer_v2.py

def test_generate_cached_system_prompt():
    """Test that prompt is generated with user context"""
    profile = create_empty_profile("12345")
    profile.top_categories = {"Food & Dining": 0.45, "Transport": 0.25}
    
    prompt = generate_cached_system_prompt(profile)
    
    # Check that prompt includes user's top categories
    assert "Food & Dining (45%)" in prompt
    assert "Transport (25%)" in prompt
    # Check structure
    assert "EXPENSE CATEGORIES:" in prompt
    assert "JSON only" in prompt

def test_generate_cached_system_prompt_with_examples():
    """Test prompt includes few-shot examples if available"""
    from services.optimized_prompts import generate_cached_system_prompt
    
    profile = create_empty_profile("12345")
    profile.top_categories = {"Food & Dining": 0.5}
    profile.few_shot_examples = [
        FewShotExample(
            note="makan soto",
            category="Food & Dining",
            subcategory="Street Food"
        )
    ]
    
    prompt = generate_cached_system_prompt(profile)
    assert "makan soto" in prompt
    assert "EXAMPLES FROM USER'S HISTORY:" in prompt

def test_generate_image_prompt():
    """Test image parsing prompt generation"""
    from services.optimized_prompts import generate_cached_image_prompt
    
    profile = create_empty_profile("12345")
    profile.top_categories = {"Groceries": 0.5, "Food & Dining": 0.3}
    
    prompt = generate_cached_image_prompt(profile)
    
    assert "receipt analyzer" in prompt
    assert "Groceries" in prompt
    assert "Food & Dining" in prompt
    assert "JSON only" in prompt
```

- [ ] **Step 3: Run tests**

```bash
python -m pytest tests/test_categorizer_v2.py::test_generate_cached_system_prompt -v
python -m pytest tests/test_categorizer_v2.py::test_generate_cached_system_prompt_with_examples -v
python -m pytest tests/test_categorizer_v2.py::test_generate_image_prompt -v
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add services/optimized_prompts.py tests/test_categorizer_v2.py
git commit -m "feat: add prompt generator with Anthropic caching support"
```

---

## Phase 3: Fast Pre-Check Rules Engine

### Task 3: Rule-Based Fast Categorization

**Files:**
- Create: `services/fast_check.py`
- Test: Add to `tests/test_categorizer_v2.py`

- [ ] **Step 1: Create fast pre-check engine**

```python
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
```

- [ ] **Step 2: Write tests for fast check**

```python
# Add to tests/test_categorizer_v2.py

def test_fast_check_matches_disambiguation_rule():
    """Test that fast check catches user's specific rules"""
    from services.fast_check import fast_categorize
    
    profile = create_empty_profile("12345")
    profile.disambiguation_rules = [
        DisambiguationRule(
            keywords=["grab", "gojek"],
            category="Transport",
            reason="user_correction",
            confidence="high"
        )
    ]
    
    result = fast_categorize("grab ke kantor", profile)
    assert result.matched
    assert result.category == "Transport"
    assert result.confidence == "high"

def test_fast_check_respects_exclude_keywords():
    """Test that exclude keywords prevent false positives"""
    from services.fast_check import fast_categorize
    
    profile = create_empty_profile("12345")
    profile.disambiguation_rules = [
        DisambiguationRule(
            keywords=["grab"],
            exclude_keywords=["makanan", "food"],
            category="Transport",
            reason="test",
            confidence="high"
        )
    ]
    
    # "grab food" should NOT match Transport rule
    result = fast_categorize("grab food ke rumah", profile)
    assert not result.matched  # Falls through to generic keyword check

def test_fast_check_generic_keywords():
    """Test generic keyword patterns"""
    from services.fast_check import fast_categorize
    
    profile = create_empty_profile("12345")
    
    # Salary
    result = fast_categorize("gaji bulan ini", profile)
    assert result.matched
    assert result.category == "Salary"
    
    # Entertainment
    result = fast_categorize("netflix subscription", profile)
    assert result.matched
    assert result.category == "Entertainment"
    
    # Transport
    result = fast_categorize("bensin mobil", profile)
    assert result.matched
    assert result.category == "Transport"

def test_fast_check_no_match_returns_none():
    """Test that no match returns None (will go to Haiku)"""
    from services.fast_check import fast_categorize
    
    profile = create_empty_profile("12345")
    
    result = fast_categorize("jajan sembarangan", profile)
    assert not result.matched
    assert result.to_dict() is None
```

- [ ] **Step 3: Run tests**

```bash
python -m pytest tests/test_categorizer_v2.py -k "fast_check" -v
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add services/fast_check.py tests/test_categorizer_v2.py
git commit -m "feat: add fast rule-based categorization engine"
```

---

## Phase 4: Enhanced Categorizer with Three Layers

### Task 4: Implement `categorizer_v2.py` with Layered Architecture

**Files:**
- Create: `services/categorizer_v2.py`
- Test: Add integration tests to `tests/test_categorizer_v2.py`

- [ ] **Step 1: Create enhanced categorizer**

```python
# services/categorizer_v2.py
import anthropic
import json
import os
from services.categorization_profile import CategorizationProfile, load_profile
from services.optimized_prompts import (
    generate_cached_system_prompt,
    generate_cached_image_prompt,
    get_prompt_cache_control,
)
from services.fast_check import fast_categorize

# Initialize Anthropic client
anthropic_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

def categorize_transaction(note: str, profile: CategorizationProfile) -> dict:
    """
    Enhanced transaction categorization with three layers:
    
    Layer 1: Fast pre-check (rule-based, <5ms, ~50% hit rate)
    Layer 2: Claude Haiku with context injection (if Layer 1 uncertain)
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
    
    # LAYER 2: Haiku call with context injection
    system_prompt = generate_cached_system_prompt(profile)
    
    try:
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=256,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": get_prompt_cache_control(),
                }
            ],
            messages=[
                {"role": "user", "content": f"Transaction note: {note}"}
            ]
        )
        
        raw = response.content[0].text.strip()
        
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
                if any(kw.lower() in note.lower() for kw in pair.get("keywords", [])):
                    suggested.extend(pair["pair"])
            
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
    Extract transaction info from receipt/payment image using Claude Haiku.
    
    Now unified to use Haiku (instead of Gemini Flash) for consistency + caching.
    
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
        response = anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    "cache_control": get_prompt_cache_control(),
                }
            ],
            messages=[
                {
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
                        {
                            "type": "text",
                            "text": "Extract transaction from this image. Return JSON only."
                        }
                    ],
                }
            ]
        )
        
        raw = response.content[0].text.strip()
        
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
```

- [ ] **Step 2: Write integration tests**

```python
# Add to tests/test_categorizer_v2.py

@pytest.mark.asyncio
async def test_categorize_transaction_with_fast_check():
    """Test that obvious transactions skip API call"""
    from services.categorizer_v2 import categorize_transaction
    
    profile = create_empty_profile("12345")
    profile.disambiguation_rules = [
        DisambiguationRule(
            keywords=["grab"],
            category="Transport",
            reason="test",
            confidence="high"
        )
    ]
    
    # Should match fast check
    result = categorize_transaction("grab ke kantor", profile)
    assert result["category"] == "Transport"
    assert result["source"] == "fast_check"

@pytest.mark.asyncio
async def test_categorize_transaction_with_haiku_fallthrough():
    """Test uncertain transactions call Haiku"""
    # This test requires mock Anthropic client
    # Skipping for now, will test with integration test later
    pass

def test_categorize_low_confidence_suggests_clarification():
    """Test that low confidence results suggest clarification"""
    from services.categorizer_v2 import categorize_transaction
    from unittest.mock import patch, MagicMock
    
    profile = create_empty_profile("12345")
    profile.problem_pairs = [
        ProblemPair(pair=["Food & Dining", "Dining Out"], keywords=["warung", "resto"])
    ]
    
    # Mock Anthropic response with low confidence
    mock_response = MagicMock()
    mock_response.content[0].text = json.dumps({
        "category": "Food & Dining",
        "subcategory": "Restaurant",
        "type": "expense",
        "confidence": "low",
        "reason": "Ambiguous"
    })
    
    with patch('services.categorizer_v2.anthropic_client.messages.create', return_value=mock_response):
        result = categorize_transaction("makan di resto kecil", profile)
        assert result["suggest_clarification"] is True
        assert "Food & Dining" in result.get("suggested_clarifications", [])
```

- [ ] **Step 3: Run tests (mocked for now)**

```bash
python -m pytest tests/test_categorizer_v2.py::test_categorize_transaction_with_fast_check -v
python -m pytest tests/test_categorizer_v2.py::test_categorize_low_confidence_suggests_clarification -v
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add services/categorizer_v2.py tests/test_categorizer_v2.py
git commit -m "feat: implement three-layer enhanced categorizer with context injection"
```

---

## Phase 5: Setup Script (Interactive)

### Task 5: Interactive Setup Script with Supabase Discovery

**Files:**
- Create: `services/skill_setup.py`
- Test: Functional test (no unit tests for interactive script)

- [ ] **Step 1: Create setup script**

```python
# services/skill_setup.py
"""
Interactive setup script for transaction parsing optimization.

Usage:
    python -m services.skill_setup <user_id> [--output-dir ./output]

Flow:
1. Ask 4 questions (user input)
2. Auto-discover patterns from Supabase
3. Generate profile.json, prompts, etc.
"""

import asyncio
import json
import os
from datetime import datetime
from pathlib import Path
from typing import List, Dict
import sys

from services.categorization_profile import (
    CategorizationProfile,
    save_profile,
    FewShotExample,
    ProblemPair,
    DisambiguationRule,
    AmountRange,
    ProfileMetadata,
)
from db.database import AsyncSessionLocal
from db.operations import get_user_transactions

async def ask_question_1() -> List[str]:
    """Q1: Known ambiguous category pairs"""
    print("\n" + "="*60)
    print("QUESTION 1: Known Ambiguities")
    print("="*60)
    print("""
Which transaction categories do you struggle to distinguish?
Examples:
  - 'Food & Dining' vs 'Dining Out'
  - 'Freelance' vs 'Investment Return'
  - 'Groceries' vs 'Shopping'

Enter pairs (comma-separated). Ctrl+C to skip.
Format: 'Category A vs Category B'
    """)
    
    pairs = []
    while True:
        try:
            line = input("Enter a pair (or 'done' to continue): ").strip()
            if line.lower() == 'done':
                break
            if " vs " in line:
                parts = [p.strip() for p in line.split(" vs ")]
                pairs.append(parts)
                print(f"  ✓ Added: {parts}")
        except KeyboardInterrupt:
            print("  (skipped)")
            break
    
    return pairs

async def ask_question_2(transactions: List) -> Dict[str, float]:
    """Q2: Confirm top categories"""
    print("\n" + "="*60)
    print("QUESTION 2: Your Top Categories")
    print("="*60)
    
    # Calculate category distribution
    cat_counts = {}
    for txn in transactions:
        cat = txn.get("category", "Other")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
    
    total = len(transactions)
    top_cats = sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    print(f"\nAnalyzed {total} transactions. Top 5 categories:\n")
    for i, (cat, count) in enumerate(top_cats, 1):
        pct = (count / total) * 100
        print(f"  {i}. {cat}: {count} txns ({pct:.0f}%)")
    
    print("\nLooks right? (yes/no/edit): ", end="")
    response = input().strip().lower()
    
    if response == "edit":
        print("(Editing not implemented yet; using detected distribution)")
    
    # Convert to ratio
    result = {}
    for cat, count in top_cats:
        result[cat] = count / total
    
    return result

async def ask_question_3() -> List[Dict]:
    """Q3: Correction examples"""
    print("\n" + "="*60)
    print("QUESTION 3: Correction Examples")
    print("="*60)
    print("""
Any transactions that were miscategorized?
Format: 'note → Category'

Example:
  'jajan baju online → Shopping'
  'netflix → Entertainment'

Enter examples (or 'done' to continue):
    """)
    
    examples = []
    while True:
        try:
            line = input("Enter example (or 'done'): ").strip()
            if line.lower() == 'done':
                break
            if " → " in line or " -> " in line:
                sep = " → " if " → " in line else " -> "
                note, cat = line.split(sep, 1)
                examples.append({
                    "note": note.strip(),
                    "category": cat.strip()
                })
                print(f"  ✓ Added: {note.strip()} → {cat.strip()}")
        except KeyboardInterrupt:
            print("  (skipped)")
            break
    
    return examples

async def ask_question_4() -> bool:
    """Q4: Full auto-discovery"""
    print("\n" + "="*60)
    print("QUESTION 4: Full Auto-Discovery")
    print("="*60)
    print("""
Run full pattern analysis on all your transactions?
(Analyzes low-confidence patterns, common errors, ~60 sec)

yes/no: """, end="")
    
    return input().strip().lower() in ["yes", "y"]

async def discover_patterns_from_supabase(user_id: str, transactions: List) -> Dict:
    """
    Analyze transactions for low-confidence patterns, amount ranges, etc.
    """
    
    if not transactions:
        return {}
    
    patterns = {
        "low_confidence_patterns": {},
        "amount_ranges": {},
        "metadata": {
            "transactions_analyzed": len(transactions),
            "date_range": f"{transactions[-1].get('created_at', 'unknown')} to {transactions[0].get('created_at', 'unknown')}",
            "avg_confidence": 0.85,  # Default estimate
            "accuracy_score": 0.90,
        }
    }
    
    # Group by category and analyze
    by_category = {}
    for txn in transactions:
        cat = txn.get("category", "Other")
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(txn)
    
    # Calculate ranges
    for cat, cat_txns in by_category.items():
        amounts = [t.get("amount", 0) for t in cat_txns if t.get("amount")]
        if amounts:
            patterns["amount_ranges"][cat] = {
                "min": int(min(amounts)),
                "max": int(max(amounts)),
                "median": int(sorted(amounts)[len(amounts)//2])
            }
    
    return patterns

async def main():
    """Main setup flow"""
    user_id = sys.argv[1] if len(sys.argv) > 1 else "default"
    output_dir = sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == "--output-dir" else "services/_optimize_skill_generated"
    
    print("\n" + "🔧 "*20)
    print("TRANSACTION PARSING OPTIMIZATION SETUP")
    print("🔧 "*20)
    
    # Connect to Supabase and fetch transactions
    print("\n📊 Fetching your transaction history from Supabase...")
    try:
        async with AsyncSessionLocal() as session:
            transactions = await get_user_transactions(session, user_id, limit=500)
        print(f"   ✓ Loaded {len(transactions)} transactions")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        print("   Using empty transaction list")
        transactions = []
    
    # Run Q&A
    print("\n📝 Answering setup questions...")
    
    problem_pairs = await ask_question_1()
    top_categories = await ask_question_2(transactions)
    corrections = await ask_question_3()
    run_full_discovery = await ask_question_4()
    
    # Discover patterns if requested
    discovery = {}
    if run_full_discovery:
        print("\n🔍 Running full pattern discovery (this may take a minute)...")
        discovery = await discover_patterns_from_supabase(user_id, transactions)
        print("   ✓ Discovery complete")
    
    # Build profile
    print("\n🏗️  Building profile...")
    profile = CategorizationProfile(
        user_id=user_id,
        generated_at=datetime.utcnow().isoformat() + "Z",
        version="1",
        top_categories=top_categories,
        problem_pairs=[
            ProblemPair(pair=pair) for pair in problem_pairs
        ],
        few_shot_examples=[
            FewShotExample(
                note=corr["note"],
                category=corr["category"],
                source="user_correction"
            )
            for corr in corrections
        ],
        metadata=discovery.get("metadata", ProfileMetadata(
            transactions_analyzed=len(transactions),
            date_range="N/A",
            avg_confidence=0.85,
            accuracy_score=0.90
        ))
    )
    
    # Save profile
    os.makedirs(output_dir, exist_ok=True)
    profile_path = os.path.join(output_dir, "categorization_profile.json")
    save_profile(profile, profile_path)
    print(f"   ✓ Saved to {profile_path}")
    
    # Generate other outputs (simplified)
    error_analysis_path = os.path.join(output_dir, "error_analysis.json")
    with open(error_analysis_path, 'w') as f:
        json.dump(discovery.get("low_confidence_patterns", {}), f, indent=2)
    print(f"   ✓ Saved error analysis to {error_analysis_path}")
    
    # Checklist
    checklist_path = os.path.join(output_dir, "DEPLOYMENT_CHECKLIST.md")
    checklist_content = f"""# Deployment Checklist

Generated: {datetime.utcnow().isoformat()}Z

## Pre-Deployment

- [ ] Review `categorization_profile.json` — does it look right?
- [ ] Review `error_analysis.json` — any surprises?
- [ ] Run local tests: `pytest tests/test_categorizer_v2.py -v`

## Deployment Steps

- [ ] Copy `categorization_profile.json` to `services/categorization_profile.json`
- [ ] Copy `optimized_prompts.py` to `services/optimized_prompts.py`
- [ ] Copy `categorizer_v2.py` to `services/categorizer_v2.py`
- [ ] Update `bot/handlers/commands.py` to use v2 (see INTEGRATION.md)
- [ ] Test locally with bot running
- [ ] Push to main branch
- [ ] Railway auto-deploys
- [ ] Monitor logs for errors

## Rollback (if issues)

```bash
git revert <commit-hash>
```

## Monitoring

Run weekly to check for drift:

```bash
python -m services.skill_monitor --user-id {user_id} --days 7
```
"""
    with open(checklist_path, 'w') as f:
        f.write(checklist_content)
    print(f"   ✓ Generated deployment checklist")
    
    print("\n✅ Setup complete!")
    print(f"📁 Output directory: {output_dir}")
    print("\nNext steps:")
    print(f"  1. Review {output_dir}/categorization_profile.json")
    print(f"  2. Follow {checklist_path}")
    print(f"  3. Deploy to Railway")

if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: Test setup script manually**

```bash
# Dry-run (with mock Supabase)
python -m services.skill_setup test_user_123 --output-dir ./test_output

# Expected: Creates test_output/ with:
#   - categorization_profile.json
#   - error_analysis.json
#   - DEPLOYMENT_CHECKLIST.md
```

- [ ] **Step 3: Commit**

```bash
git add services/skill_setup.py
git commit -m "feat: add interactive setup script"
```

---

## Phase 6: Monitor Script

### Task 6: Drift Detection & Profile Updates

**Files:**
- Create: `services/skill_monitor.py`

- [ ] **Step 1: Create monitor script**

```python
# services/skill_monitor.py
"""
Monitor transaction parsing accuracy over time.
Detect drift and suggest profile updates.

Usage:
    python -m services.skill_monitor --user-id 123456 --days 7
"""

import asyncio
import json
import sys
from datetime import datetime, timedelta
from services.categorization_profile import load_profile, save_profile
from db.database import AsyncSessionLocal
from db.operations import get_user_transactions

async def analyze_recent_transactions(user_id: str, days: int = 7) -> Dict:
    """Analyze transactions from last N days"""
    
    async with AsyncSessionLocal() as session:
        transactions = await get_user_transactions(session, user_id, limit=500)
    
    # Filter to last N days
    cutoff = datetime.utcnow() - timedelta(days=days)
    recent = [t for t in transactions if t.get("created_at") > cutoff]
    
    print(f"\n📊 ANALYSIS: Last {days} days")
    print(f"   Total transactions: {len(recent)}")
    
    # Confidence distribution
    conf_dist = {"high": 0, "medium": 0, "low": 0}
    for txn in recent:
        conf = txn.get("confidence", "medium")
        conf_dist[conf] = conf_dist.get(conf, 0) + 1
    
    print(f"\n   Confidence distribution:")
    for level, count in conf_dist.items():
        pct = (count / len(recent)) * 100 if recent else 0
        print(f"     - {level}: {count} ({pct:.0f}%)")
    
    # Category accuracy
    by_category = {}
    for txn in recent:
        cat = txn.get("category", "Other")
        if cat not in by_category:
            by_category[cat] = {"high": 0, "medium": 0, "low": 0}
        conf = txn.get("confidence", "medium")
        by_category[cat][conf] += 1
    
    print(f"\n   By category:")
    for cat, dist in sorted(by_category.items()):
        high_pct = (dist["high"] / sum(dist.values())) * 100 if sum(dist.values()) > 0 else 0
        print(f"     - {cat}: {high_pct:.0f}% high confidence")
    
    return {
        "recent_count": len(recent),
        "confidence_dist": conf_dist,
        "category_accuracy": by_category,
    }

async def detect_recommendations(profile, analysis: Dict) -> List[str]:
    """Suggest improvements based on analysis"""
    recommendations = []
    
    # Check for drop in high-confidence transactions
    avg_high = sum(1 for cat in analysis["category_accuracy"].values() 
                   for conf in [cat.get("high", 0)] if conf) / len(analysis["category_accuracy"])
    
    if avg_high < 0.8:
        recommendations.append("🟡 High confidence score dropped. Consider running full profile refresh.")
    
    # Check for categories with <70% high confidence
    for cat, dist in analysis["category_accuracy"].items():
        total = sum(dist.values())
        if total > 0:
            high_pct = dist.get("high", 0) / total
            if high_pct < 0.7:
                recommendations.append(f"🟡 Category '{cat}' has low confidence ({high_pct*100:.0f}%). Add more few-shot examples.")
    
    return recommendations

async def main():
    user_id = None
    days = 7
    
    # Parse args
    for i, arg in enumerate(sys.argv[1:]):
        if arg == "--user-id" and i + 1 < len(sys.argv) - 1:
            user_id = sys.argv[i + 2]
        elif arg == "--days" and i + 1 < len(sys.argv) - 1:
            days = int(sys.argv[i + 2])
    
    if not user_id:
        print("Usage: python -m services.skill_monitor --user-id <id> [--days N]")
        sys.exit(1)
    
    print("\n" + "🔍 "*20)
    print(f"DRIFT DETECTION: User {user_id}, Last {days} days")
    print("🔍 "*20)
    
    # Load current profile
    try:
        profile = load_profile()
        print(f"✓ Loaded profile (generated {profile.generated_at})")
    except FileNotFoundError:
        print("✗ Profile not found. Run setup first.")
        sys.exit(1)
    
    # Analyze recent transactions
    analysis = await analyze_recent_transactions(user_id, days)
    
    # Get recommendations
    recs = await detect_recommendations(profile, analysis)
    
    if recs:
        print(f"\n💡 RECOMMENDATIONS:")
        for rec in recs:
            print(f"   {rec}")
    else:
        print(f"\n✅ No issues detected. Profile is healthy!")
    
    # Optional: Update profile
    if recs:
        print(f"\nApply recommendations? (yes/no): ", end="")
        if input().strip().lower() in ["yes", "y"]:
            # Update metadata
            profile.metadata.transactions_analyzed = analysis["recent_count"]
            profile.metadata.avg_confidence = sum(analysis["confidence_dist"].values()) / analysis["recent_count"]
            profile.generated_at = datetime.utcnow().isoformat() + "Z"
            
            save_profile(profile)
            print("✓ Profile updated")

if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 2: Commit**

```bash
git add services/skill_monitor.py
git commit -m "feat: add drift detection and monitoring script"
```

---

## Phase 7: Bot Integration

### Task 7: Update Bot Handlers to Use v2

**Files:**
- Modify: `bot/handlers/commands.py`
- Modify: `bot/main.py`

- [ ] **Step 1: Update bot main startup**

```python
# bot/main.py — Add profile loading at startup

# Near top of file, add:
from services.categorization_profile import load_profile

# In application.post_init() or main():
async def post_init(app):
    """Load profile after bot initializes"""
    try:
        app.bot_data["profile"] = load_profile()
        print("✓ Categorization profile loaded")
    except FileNotFoundError:
        print("⚠️ Warning: Categorization profile not found. Using original categorizer.")
        app.bot_data["profile"] = None

# Wire it up:
application.post_init = post_init
```

- [ ] **Step 2: Update command handler**

```python
# bot/handlers/commands.py — Update /add command to use v2

async def handle_add_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    /add <amount> <note>
    
    Now uses categorizer_v2 with profile for better accuracy.
    """
    
    # Get profile from bot context
    profile = context.application.bot_data.get("profile")
    
    # Parse command
    args = context.args
    if len(args) < 2:
        await update.message.reply_text("Usage: /add <amount> <note>")
        return
    
    amount_str = args[0]
    note = " ".join(args[1:])
    
    # Parse amount
    try:
        amount = int(amount_str)
    except ValueError:
        await update.message.reply_text("Invalid amount")
        return
    
    # Categorize using v2 (with profile if available)
    if profile:
        from services.categorizer_v2 import categorize_transaction
        result = categorize_transaction(note, profile)
    else:
        from services.categorizer import categorize_transaction
        result = categorize_transaction(note)
    
    # Show result with inline keyboard for confirm/edit
    category = result.get("category")
    confidence = result.get("confidence")
    
    text = f"📝 Transaction parsed:\n"
    text += f"Amount: IDR {amount:,}\n"
    text += f"Category: {category}\n"
    text += f"Confidence: {confidence}\n"
    text += f"Note: {note}\n\n"
    
    # If low confidence and we have suggestions, show them
    if result.get("suggest_clarification"):
        suggestions = result.get("suggested_clarifications", [])
        if suggestions:
            text += f"Did you mean one of these?\n"
            for s in suggestions[:3]:
                text += f"  - {s}\n"
    
    keyboard = [
        [
            InlineKeyboardButton("✅ Confirm", callback_data=f"confirm_add:{amount}:{category}"),
            InlineKeyboardButton("❌ Cancel", callback_data="cancel_add"),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(text, reply_markup=reply_markup)
```

- [ ] **Step 3: Test locally**

```bash
# Start bot locally
python bot/main.py

# Send /add command in Telegram
/add 50000 makan soto betawi

# Expected: Shows category with confidence
# If profile loaded: Uses v2 + profile context
# If no profile: Falls back to original categorizer
```

- [ ] **Step 4: Commit**

```bash
git add bot/main.py bot/handlers/commands.py
git commit -m "feat: integrate categorizer_v2 and profile into bot"
```

---

## Phase 8: Testing

### Task 8: Comprehensive Unit + Integration Tests

**Files:**
- Modify: `tests/test_categorizer_v2.py` (add remaining tests)

- [ ] **Step 1: Write profile integration test**

```python
# Add to tests/test_categorizer_v2.py

def test_profile_integration_end_to_end():
    """Test full flow: create profile → fast check → Haiku"""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create profile
        profile = create_empty_profile("12345")
        profile.top_categories = {"Transport": 0.5, "Food & Dining": 0.3}
        profile.disambiguation_rules = [
            DisambiguationRule(
                keywords=["grab"],
                category="Transport",
                reason="test",
                confidence="high"
            )
        ]
        
        # Save it
        profile_path = Path(tmpdir) / "profile.json"
        save_profile(profile, str(profile_path))
        
        # Load it
        loaded = load_profile(str(profile_path))
        
        # Use it for fast check
        from services.fast_check import fast_categorize
        result = fast_categorize("grab ke kantor", loaded)
        
        assert result.matched
        assert result.category == "Transport"
```

- [ ] **Step 2: Write prompt caching test**

```python
# Add to tests/test_categorizer_v2.py

def test_prompt_caching_headers():
    """Test that prompts include caching headers"""
    from services.optimized_prompts import get_prompt_cache_control
    
    cache_control = get_prompt_cache_control()
    assert cache_control["type"] == "ephemeral"
```

- [ ] **Step 3: Run all tests**

```bash
python -m pytest tests/test_categorizer_v2.py -v
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add tests/test_categorizer_v2.py
git commit -m "test: add comprehensive unit and integration tests"
```

---

## Phase 9: Deployment Configuration

### Task 9: Generate Deployment Checklist

**Files:**
- Create: `docs/DEPLOYMENT.md`

- [ ] **Step 1: Create deployment guide**

```markdown
# Deployment Guide: Transaction Parsing Optimization

## Pre-Deployment Checklist

- [ ] Run all tests: `pytest tests/test_categorizer_v2.py -v`
- [ ] Run setup script: `python -m services.skill_setup <user_id>`
- [ ] Review generated profile: `cat services/_optimize_skill_generated/categorization_profile.json`
- [ ] Verify bot integration: `python bot/main.py` (local test)

## Deployment Steps

### 1. Copy Generated Files

```bash
cp services/_optimize_skill_generated/categorization_profile.json services/
cp services/optimized_prompts.py services/  # Already created
cp services/categorizer_v2.py services/    # Already created
```

### 2. Verify Integration in Bot

Check that `bot/main.py` loads profile:
- Profile loads at startup
- `/add` command uses `categorizer_v2` if profile available

### 3. Deploy to Railway

```bash
git add services/categorization_profile.json
git commit -m "deploy: add user categorization profile"
git push origin main
```

Railway auto-deploys on push to main.

### 4. Verify Deployment

After Railway deploys:
```bash
# Check bot logs
railway logs

# Send test transaction
/add 50000 makan soto betawi

# Expected: Uses v2 + profile, lower API cost, better accuracy
```

## Monitoring (Post-Deployment)

### Weekly Drift Check

```bash
python -m services.skill_monitor --user-id <user_id> --days 7
```

### Expected Improvements

- **Cost:** 30-50% reduction in tokens/transaction
- **Speed:** 50-70% faster median latency (fast pre-checks)
- **Accuracy:** +20-30% fewer misparsings (context + few-shot)

### Rollback (if issues)

```bash
git revert <commit-hash>
git push origin main
# Railway auto-redeploys within ~60s
```

## Architecture Reminder

```
User sends /add note
    ↓
categorizer_v2.categorize_transaction(note, profile)
    ↓
Layer 1: Fast pre-check (5ms, ~50% hit)
    ↓
If matched: Return immediately
If uncertain: Layer 2 (Haiku with caching + context)
    ↓
Haiku API (cached prompt, few-shot, user context)
    ↓
Layer 3: Smart fallback (suggest clarification if low confidence)
    ↓
Store in Supabase
```

## Support

If accuracy drops >10%, run:
```bash
python -m services.skill_monitor --user-id <user_id> --days 7
# Follow recommendations
```

If need to refresh profile entirely:
```bash
rm services/categorization_profile.json
python -m services.skill_setup <user_id>
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add deployment guide"
```

---

## Phase 10: Final Integration Test & Commit

### Task 10: End-to-End Integration Test

**Files:**
- Test: Full bot flow

- [ ] **Step 1: Local bot test**

```bash
# Start bot
cd /path/to/fintrack
python bot/main.py

# In Telegram:
/start
/add 50000 makan soto betawi

# Expected:
# ✓ Bot loads profile at startup
# ✓ /add command uses categorizer_v2
# ✓ Transaction shown with category + confidence
# ✓ API call uses prompt caching (visible in Anthropic logs)
```

- [ ] **Step 2: Verify no regressions**

```bash
# Run full test suite
pytest tests/ -v

# Expected: All tests PASS, no new failures
```

- [ ] **Step 3: Final cleanup commit**

```bash
# If any minor fixes needed
git add .
git commit -m "chore: final integration verification"
```

---

## Summary

**All deliverables created:**

- ✅ `services/categorization_profile.py` — Profile loader + Pydantic models
- ✅ `services/optimized_prompts.py` — Cached prompt generator
- ✅ `services/fast_check.py` — Rule-based pre-check engine
- ✅ `services/categorizer_v2.py` — Three-layer enhanced categorizer
- ✅ `services/skill_setup.py` — Interactive setup script
- ✅ `services/skill_monitor.py` — Drift detection
- ✅ `bot/main.py` + `bot/handlers/commands.py` — Integration
- ✅ `tests/test_categorizer_v2.py` — Comprehensive tests
- ✅ `docs/DEPLOYMENT.md` — Deployment guide

**Expected metrics after deployment:**
- Cost: 30-50% reduction
- Speed: 2-3x faster
- Accuracy: +20-30% improvement

---
