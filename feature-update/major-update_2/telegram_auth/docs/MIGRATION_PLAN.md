# Migration Plan — Manual Telegram ID → OAuth

# Migration Objective

Deprecate manual Telegram ID authentication and transition all users to Telegram OAuth.

---

# Migration Phases

## Phase 1 — Infrastructure Preparation

Tasks:
- Configure Telegram Bot
- Register Allowed URLs
- Build OAuth endpoints
- Implement JWT validation
- Deploy auth infrastructure

---

## Phase 2 — Parallel Authentication

Temporary support:
- old login
- new OAuth login

Goal:
- gradual migration

---

## Phase 3 — User Migration

Prompt users:
"Reconnect your Telegram account securely"

Flow:
1. User logs in
2. User authenticates via Telegram OAuth
3. System maps old Telegram ID
4. Account linked securely

---

## Phase 4 — Deprecation

Remove:
- manual Telegram ID field
- old validation logic
- legacy auth endpoints

---

# Risks

| Risk | Mitigation |
|---|---|
| User confusion | onboarding guide |
| Failed linkage | fallback recovery |
| Invalid mapping | verification checks |
| Token issues | retry handling |

---

# Rollback Strategy

If migration fails:
- temporarily re-enable legacy auth
- preserve legacy Telegram ID field
- preserve session backups

---

# Success Metrics

| KPI | Target |
|---|---|
| Successful migrations | >90% |
| Login failure rate | <5% |
| Support tickets | minimal |
| Duplicate accounts | near zero |