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
