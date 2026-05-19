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
