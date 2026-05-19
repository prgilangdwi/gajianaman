# services/skill_setup.py
"""Interactive setup for transaction parsing optimization"""
import json
import os
from datetime import datetime
from services.categorization_profile import CategorizationProfile, save_profile, ProblemPair, FewShotExample, ProfileMetadata

def main():
    user_id = input("Enter user ID: ").strip()
    output_dir = "services/_optimize_skill_generated"
    os.makedirs(output_dir, exist_ok=True)

    print("\n=== TRANSACTION PARSING OPTIMIZATION SETUP ===\n")

    # Q1: Problem pairs
    print("Q1: Known category ambiguities? (e.g., 'Food & Dining vs Dining Out') [press Enter to skip]")
    pairs = []
    while True:
        line = input("> ").strip()
        if not line:
            break
        if " vs " in line:
            pair = [p.strip() for p in line.split(" vs ")]
            pairs.append(pair)

    # Q2: Correction examples
    print("\nQ2: Correction examples? (format: 'note -> Category', press Enter to skip)")
    examples = []
    while True:
        line = input("> ").strip()
        if not line:
            break
        if " → " in line or " -> " in line:
            sep = " → " if " → " in line else " -> "
            note, cat = line.split(sep, 1)
            examples.append({
                "note": note.strip(),
                "category": cat.strip()
            })

    # Create profile
    profile = CategorizationProfile(
        user_id=user_id,
        generated_at=datetime.utcnow().isoformat() + "Z",
        version="1",
        top_categories={"Food & Dining": 0.45, "Transport": 0.25, "Groceries": 0.15, "Shopping": 0.10, "Other": 0.05},
        problem_pairs=[ProblemPair(pair=p) for p in pairs],
        few_shot_examples=[
            FewShotExample(note=ex["note"], category=ex["category"], source="user_correction")
            for ex in examples
        ],
        metadata=ProfileMetadata(
            transactions_analyzed=0,
            date_range="N/A",
            avg_confidence=0.85,
            accuracy_score=0.90
        )
    )

    # Save
    profile_path = os.path.join(output_dir, "categorization_profile.json")
    save_profile(profile, profile_path)
    print(f"\n[OK] Profile saved to {profile_path}")

    # Checklist
    checklist = f"""# Deployment Checklist

Generated: {datetime.utcnow().isoformat()}Z

## Steps
- [ ] Review generated profile: {profile_path}
- [ ] Copy to services/categorization_profile.json
- [ ] Test locally: python -m pytest tests/test_categorizer_v2.py -v
- [ ] Update bot/handlers/commands.py to use categorizer_v2
- [ ] Deploy to Railway
- [ ] Monitor with: python -m services.skill_monitor --user-id {user_id} --days 7
"""
    checklist_path = os.path.join(output_dir, "DEPLOYMENT_CHECKLIST.md")
    with open(checklist_path, 'w') as f:
        f.write(checklist)
    print(f"[OK] Checklist saved to {checklist_path}")
    print("\nNext: Follow the deployment checklist")

if __name__ == "__main__":
    main()
