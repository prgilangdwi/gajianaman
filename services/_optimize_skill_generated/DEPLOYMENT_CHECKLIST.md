# Deployment Checklist

Generated: 2026-05-19T05:24:19.491824Z

## Steps
- [ ] Review generated profile: services/_optimize_skill_generated\categorization_profile.json
- [ ] Copy to services/categorization_profile.json
- [ ] Test locally: python -m pytest tests/test_categorizer_v2.py -v
- [ ] Update bot/handlers/commands.py to use categorizer_v2
- [ ] Deploy to Railway
- [ ] Monitor with: python -m services.skill_monitor --user-id test_user_1 --days 7
