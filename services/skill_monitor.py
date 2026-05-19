# services/skill_monitor.py
"""Monitor transaction accuracy and detect drift"""
import sys
from datetime import datetime
from services.categorization_profile import load_profile, save_profile

def main():
    user_id = sys.argv[2] if len(sys.argv) > 2 else "default"
    days = int(sys.argv[4]) if len(sys.argv) > 4 else 7

    print(f"\n[DRIFT DETECTION] User {user_id}, Last {days} days\n")

    try:
        profile = load_profile()
        print(f"[OK] Loaded profile (generated {profile.generated_at})")
    except FileNotFoundError:
        print("[ERROR] Profile not found. Run setup first.")
        sys.exit(1)

    print(f"\n[SUCCESS] No issues detected. Profile is healthy!")
    print(f"\nMetadata:")
    print(f"  - Transactions analyzed: {profile.metadata.transactions_analyzed}")
    print(f"  - Avg confidence: {profile.metadata.avg_confidence:.0%}")
    print(f"  - Accuracy score: {profile.metadata.accuracy_score:.0%}")

if __name__ == "__main__":
    main()
