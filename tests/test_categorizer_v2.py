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

def test_generate_cached_system_prompt():
    """Test that prompt is generated with user context"""
    from services.optimized_prompts import generate_cached_system_prompt

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
    """Test that exclude keywords prevent rule from matching but generic patterns still apply"""
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

    # "grab food" should NOT match the specific rule, but "grab" matches generic pattern
    result = fast_categorize("grab food ke rumah", profile)
    assert result.matched  # Matches via generic pattern, not via rule
    assert result.category == "Transport"  # Generic pattern for "grab"
    assert "Keyword match" in result.reason

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
