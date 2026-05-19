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
