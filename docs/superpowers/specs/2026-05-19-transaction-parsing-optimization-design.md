# Design Spec: Transaction Parsing Optimization Agent Skill

**Date:** 2026-05-19  
**Project:** Fintrack / Gajian Aman  
**Scope:** Agent skill for optimizing Claude Haiku transaction parsing (accuracy, cost, speed)  
**Target Metrics:** 30-50% cost reduction, 2-3x speed improvement, +20-30% accuracy gain

---

## Executive Summary

This spec describes a **hybrid agent skill** that optimizes how Claude Haiku categorizes financial transactions in Fintrack. The skill operates in two modes:

1. **Setup Mode (Interactive)** — User answers 4 targeted questions; skill auto-discovers patterns from Supabase transaction history; generates optimized configuration files
2. **Monitor Mode (Ongoing)** — Periodically detects accuracy drift and suggests profile updates

**Key optimization strategies:**
- **Prompt Caching:** Reuse system prompts across calls (10% token cost of original)
- **Few-Shot Learning:** Inject user-specific examples based on historical accuracy
- **Smart Pre-Checks:** Rule-based fast path for obvious cases (~50% of transactions)
- **Unified Model:** Switch image parsing from Gemini Flash → Claude Haiku (consistency + caching benefits)
- **Context Injection:** Include user's top categories + disambiguation rules in every prompt

**Expected outcomes:**
- Cost: 30-50% reduction (prompt caching + pre-checks skip half the API calls)
- Speed: 2-3x faster median latency (fast pre-checks, cached prompts)
- Accuracy: +20-30% (context + few-shot examples eliminate ambiguity)

---

## Current State Analysis

### Existing Implementation (`services/categorizer.py`)

**What works well:**
- Three clean functions: `categorize_transaction()`, `parse_image_transaction()`, `parse_batch_transactions()`
- Proper error handling with fallbacks
- Structured JSON output with field validation
- Indonesian-specific category labels and keywords

**Inefficiencies identified:**
- **Accuracy:** No user context or historical patterns; single-pass categorization; low-confidence cases not escalated
- **Cost:** Verbose system prompt (category list repeated across prompts); no prompt caching; image parsing uses Gemini instead of Haiku (prevents caching benefits)
- **Speed:** Every transaction triggers full API call; no fast-path for obvious cases; sequential image + text processing

**Known pain points (from user):**
- Problem categories where Haiku misparsies: "jajan" vs "makan", food delivery ambiguity, shopping vs groceries
- Low confidence on certain merchant keywords
- Redundant API calls and retries inflating costs

---

## Architecture Design

### High-Level Flow

```
User invokes skill via Claude Code
         ↓
┌────────────────────────────────────────────┐
│     Agent Skill: parse-optimizer           │
├────────────────────────────────────────────┤
│                                            │
│  MODE SELECTOR                             │
│  ├─ First run? → SETUP MODE               │
│  └─ Subsequent? → MONITOR MODE            │
│                                            │
│  SETUP MODE                                │
│  ├─ Ask 4 questions (interactive)          │
│  ├─ Query Supabase (auto-discovery)        │
│  └─ Output 5 files + checklist             │
│                                            │
│  MONITOR MODE                              │
│  ├─ Check drift (last N days)              │
│  ├─ Suggest updates                        │
│  └─ Auto-update profile.json               │
│                                            │
└────────────────────────────────────────────┘
         ↓
    Generated files copied to services/
         ↓
    Bot handlers updated to use v2
         ↓
    Deploy to Railway
         ↓
    Cost/accuracy/speed improvements validated
```

### Components

#### **1. `services/categorization_profile.json` (NEW)**

Persistent user categorization profile. Created by skill, loaded at bot startup.

**Structure:**
```json
{
  "user_id": "123456",
  "generated_at": "2026-05-19T10:00:00Z",
  "version": "1",
  
  "top_categories": {
    "Food & Dining": 0.45,
    "Transport": 0.25,
    "Groceries": 0.15,
    "Shopping": 0.10,
    "Other": 0.05
  },
  
  "problem_pairs": [
    {
      "pair": ["Food & Dining", "Dining Out"],
      "keywords": ["warung", "restoran", "cafe"],
      "note": "User clarification needed for formal vs informal dining"
    }
  ],
  
  "low_confidence_patterns": {
    "Food & Dining": [
      { "note": "jajan", "confidence": "medium", "count": 12, "typical_amount": "50000-100000" },
      { "note": "beli makan", "confidence": "low", "count": 5 }
    ],
    "Transport": [
      { "note": "ojek", "confidence": "medium", "count": 8 }
    ]
  },
  
  "few_shot_examples": [
    {
      "note": "makan soto betawi di warung",
      "category": "Food & Dining",
      "subcategory": "Street Food",
      "confidence": "high",
      "source": "user_history"
    },
    {
      "note": "grab driver ojek ke kantor",
      "category": "Transport",
      "subcategory": "Ride-sharing",
      "confidence": "high",
      "source": "user_history"
    }
  ],
  
  "disambiguation_rules": [
    {
      "keywords": ["grab", "gojek", "ojek", "bensin", "tol"],
      "category": "Transport",
      "exclude_keywords": [],
      "reason": "user_correction",
      "confidence": "high"
    },
    {
      "keywords": ["indomaret", "alfamart", "sayur", "sembako"],
      "category": "Groceries",
      "exclude_keywords": ["grab"],
      "reason": "keyword_pattern",
      "confidence": "high"
    }
  ],
  
  "amount_ranges": {
    "Food & Dining": { "min": 10000, "max": 500000, "median": 50000 },
    "Transport": { "min": 5000, "max": 300000, "median": 30000 },
    "Groceries": { "min": 50000, "max": 1000000, "median": 200000 }
  },
  
  "metadata": {
    "transactions_analyzed": 500,
    "date_range": "2026-03-01 to 2026-05-19",
    "avg_confidence": 0.92,
    "accuracy_score": 0.94
  }
}
```

**Loaded at bot startup:**
```python
# In bot/main.py
from services.categorization_profile import load_profile
profile = load_profile()  # Loads from services/categorization_profile.json
```

---

#### **2. `services/optimized_prompts.py` (NEW)**

Dynamically generates system prompts with prompt caching headers + context injection.

**Key function:**
```python
def generate_cached_system_prompt(profile: dict) -> str:
    """
    Generate system prompt with:
    - Anthropic prompt caching header (cache_control: {"type": "ephemeral"})
    - User's top categories (primes the model)
    - Disambiguation rules
    - Brief examples
    
    Returns: system prompt string ready for API call
    """
    # Implementation generates cached prompt at ~500 tokens
    # Cached across calls → 10% cost of non-cached version
```

**Caching benefits:**
- System prompt cached after first call (~500 tokens cached)
- Subsequent calls reuse cached prompt: `500 tokens * 0.1 = 50 tokens cost`
- Original non-cached: `500 + 150 = 650 tokens per call`
- **Savings: 92% of system prompt tokens**

---

#### **3. `services/categorizer_v2.py` (NEW)**

Enhanced categorization with three layers:

**Layer 1: Fast Pre-Check (Rule-Based)**
```python
def _fast_categorize(note: str, profile: dict) -> dict | None:
    """
    ~5ms, no API call
    Returns dict if confident (high confidence), None if uncertain
    """
    # Check disambiguation rules
    # Check keyword patterns
    # Check amount heuristics
    # Return if match; else None
```

**Expected hit rate:** ~50% of transactions match pre-checks (obvious cases)

**Layer 2: Haiku Call with Context**
```python
def categorize_transaction_v2(note: str, profile: dict) -> dict:
    """
    For uncertain cases, call Haiku with:
    - Cached system prompt
    - User's top categories
    - Few-shot examples
    - Disambiguation rules
    """
```

**Layer 3: Smart Fallback**
```python
if result["confidence"] == "low":
    result["suggest_clarification"] = True
    result["suggested_clarifications"] = [
        cat for cat, pair in profile["problem_pairs"]
        if matches(note, pair)
    ]
```

---

#### **4. Image Parsing Unified to Haiku**

Switch `parse_image_transaction()` from Gemini Flash → Claude Haiku:

**Why:**
- Haiku now supports vision (image input)
- Enables prompt caching (Gemini doesn't benefit from caching)
- Single model → simpler prompts, consistent behavior
- Cost: Haiku vision ~$0.80 per 1M input tokens vs Gemini Flash ~$1.50 — 45% cheaper

**Function signature (same, new implementation):**
```python
def parse_image_transaction_v2(image_b64: str, profile: dict) -> dict:
    """Same interface as original, but uses Haiku + profile context"""
```

---

## Interactive Setup Flow

### **Question 1: Known Ambiguities**

```
❓ "Which transaction categories do you struggle to distinguish?
    Examples:
    - 'Food & Dining' vs 'Dining Out'
    - 'Freelance' vs 'Investment Return'
    - 'Groceries' vs 'Shopping'
    
    List your problem pairs (comma-separated, or 'none'):"

User input: "Food & Dining vs Dining Out, Freelance vs Other Income"

→ Stored in profile["problem_pairs"]
```

### **Question 2: Category Frequency Confirmation**

```
❓ "Analyzing your transaction history...

    Your top 5 categories (last 500 transactions):
    1. Food & Dining       45% (225 txns)
    2. Transport           25% (125 txns)
    3. Groceries           15% (75 txns)
    4. Shopping            10% (50 txns)
    5. Other                5% (25 txns)
    
    Looks right? (yes/no/edit)"

User: "yes"

→ Stored in profile["top_categories"]
```

### **Question 3: Correction Examples**

```
❓ "Any transactions that were miscategorized?
    Example: 'jajan' might be labeled Food & Dining but you meant Shopping
    
    Provide ~5 examples (one per line, format: 'note → correct_category'):
    "
    
User input:
jajan baju online → Shopping
netflix → Entertainment
gaji bonus → Salary

→ Stored in profile["few_shot_examples"] + disambiguation_rules
```

### **Question 4: Full Auto-Discovery**

```
❓ "Run full auto-discovery on your transaction history?
    (Analyzes all ~500+ transactions, finds error patterns, takes ~60 sec)
    (yes/no)"

User: "yes"

[Skill queries Supabase for ALL transactions]
→ Calculates low-confidence patterns
→ Detects common misclassifications
→ Stores in profile["low_confidence_patterns"]
```

---

## Skill Outputs

After setup, skill generates in `services/_optimize_skill_generated/`:

1. **`categorization_profile.json`** — Copy to `services/categorization_profile.json`
2. **`optimized_prompts.py`** — Copy to `services/optimized_prompts.py`
3. **`categorizer_v2.py`** — Copy to `services/categorizer_v2.py` (or `categorizer.py` after testing)
4. **`error_analysis.json`** — Reference for understanding problem categories
5. **`DEPLOYMENT_CHECKLIST.md`** — Step-by-step integration guide

---

## Deployment Integration

### **Bot Handler Update**

**Before:**
```python
# bot/handlers/commands.py
from services.categorizer import categorize_transaction

async def handle_add_command(update, context):
    note = context.args[0]
    result = categorize_transaction(note)  # No profile
    # ...
```

**After:**
```python
# bot/handlers/commands.py
from services.categorizer_v2 import categorize_transaction
from services.categorization_profile import load_profile

# Load once at bot startup
profile = load_profile()

async def handle_add_command(update, context):
    note = context.args[0]
    result = categorize_transaction(note, profile)  # ← Profile passed
    # ...
```

### **Backward Compatibility**

- Original `categorizer.py` unchanged
- v2 uses same JSON response format
- All existing handlers work with minimal changes
- Easy rollback: revert handler imports

### **Railway Deployment**

No special steps:
1. Copy files to `services/`
2. Update handler imports
3. Push to main branch
4. Railway auto-redeploys

---

## Monitoring & Drift Detection

### **Monitor Mode (Post-Deployment)**

Skill can be re-invoked weekly to detect accuracy drift:

```
invoke parse-optimizer --monitor --days=7
```

**Checks:**
- Transaction volume last 7 days
- Confidence distribution (any categories dropped below baseline?)
- New misclassification patterns
- Suggestions to update profile

**Auto-update on approval:**
```
Apply recommendations? (yes/no)
→ Updates categorization_profile.json
→ Commits: "optimize: update profile based on 7-day drift analysis"
```

---

## Error Handling & Rollback

### **Rollback Scenarios**

| Scenario | Action |
|----------|--------|
| Accuracy drops >10% | `git revert <commit>` to restore original `categorizer.py` |
| Pre-checks too aggressive | Set `SKIP_FAST_CHECK=true` env var (use Haiku for all) |
| Profile is stale | `invoke parse-optimizer --refresh-profile` |
| Haiku model changes behavior | Re-run monitor mode to update few-shot examples |

### **Health Checks**

Recommend adding to bot startup:
```python
# bot/main.py
async def startup_checks():
    profile = load_profile()
    assert profile["version"] == "1"
    assert "top_categories" in profile
    assert len(profile["few_shot_examples"]) > 0
    print("✅ Profile loaded and validated")
```

---

## Metrics & Success Criteria

### **Baseline (Current Implementation)**

- **Cost:** ~650 tokens per transaction (system prompt + query + response)
- **Speed:** ~1.5s avg latency (full Haiku call)
- **Accuracy:** ~85% (estimated from misclassification complaints)

### **Target (Post-Optimization)**

| Metric | Baseline | Target | Method |
|--------|----------|--------|--------|
| **Cost per txn** | 650 tokens | 350 tokens | Caching (50% reduction) + pre-checks (50% skip) = 75% reduction |
| **Latency** | 1.5s | 0.5s | Fast pre-checks (~5ms for 50% of txns) |
| **Accuracy** | 85% | 95-100% | Context injection + few-shot examples |

### **Measurement Method**

Post-deployment, run for 7 days and compare:
```
# In bot logs
cost_per_txn = total_tokens_used / total_transactions
accuracy = 1.0 - (manual_corrections / total_transactions)
latency_p95 = log stats from Anthropic API
```

---

## Data Flow

```
User sends transaction note via Telegram
         ↓
Bot loads categorization_profile.json
         ↓
categorizer_v2.categorize_transaction(note, profile)
         ↓
┌─────────────────────────────────┐
│ _fast_categorize()              │ ~5ms, ~50% hit rate
│ (rule-based pre-check)          │
├─────────────────────────────────┤
│ If certain → Return immediately │
│ Else → Continue to Haiku        │
└─────────────────────────────────┘
         ↓
Haiku API call
  - System: cached_prompt (benefits from prompt caching)
  - Message: note + user context (few-shot + categories)
         ↓
Parse JSON response
         ↓
Check confidence
  - If low → Add "suggest_clarification" flag
         ↓
Return result to handler
         ↓
Handler stores in Supabase
         ↓
Monitor mode detects patterns (weekly)
         ↓
Profile updated automatically
```

---

## Open Questions & Assumptions

### **Assumptions**
1. **Supabase connection available:** Skill queries Supabase directly during setup
2. **User has ≥100 historical transactions:** Fewer transactions = less accurate profiles
3. **Haiku model behavior stable:** If Anthropic changes model significantly, few-shot examples may need refresh
4. **Pre-check rules don't over-match:** Keyword rules validated during setup to avoid false positives

### **Known Constraints**
1. **Prompt caching TTL:** Cached prompts expire after 5 minutes of last use; new session = new cache
2. **Profile freshness:** Profile should be regenerated monthly or after 100+ new transactions
3. **Multi-user:** Current design assumes single user per Supabase; would need extension for multi-tenant

---

## Implementation Phase (Next Step)

Once this spec is approved, invoke **writing-plans** skill to create detailed implementation plan covering:
- File structure and dependencies
- Sequence of changes (which files first)
- Testing strategy (unit tests, integration tests, bot testing)
- Deployment checklist
- Monitoring & rollback procedures

---

## Sign-Off

- **Design approved by:** [User]
- **Date approved:** [TBD]
- **Ready for implementation:** [TBD]
