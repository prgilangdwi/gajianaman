# Database Changes — Telegram OAuth Migration

# Objective

Support Telegram OAuth identity linkage and session management.

---

# User Table Changes

## New Columns

| Column | Type |
|---|---|
| telegram_user_id | VARCHAR |
| telegram_username | VARCHAR |
| telegram_name | VARCHAR |
| telegram_photo_url | TEXT |
| telegram_phone_number | VARCHAR |
| auth_provider | VARCHAR |
| telegram_linked_at | TIMESTAMP |

---

# Recommended Constraints

## telegram_user_id
- unique
- indexed
- non-null after migration

---

# Recommended Indexes

Create indexes:
- telegram_user_id
- auth_provider

---

# Session Table

Recommended fields:

| Column | Type |
|---|---|
| session_id | UUID |
| user_id | UUID |
| created_at | TIMESTAMP |
| expired_at | TIMESTAMP |
| ip_address | VARCHAR |
| user_agent | TEXT |

---

# Migration Notes

## Existing Users

Map:
old_manual_telegram_id
→
verified_telegram_user_id

---

# Data Integrity Rules

- One Telegram account per user
- Prevent duplicate Telegram linkage
- Prevent orphaned sessions

---

# Rollback Considerations

Retain old Telegram ID field temporarily during migration window.