# Authentication System Overview

## Current State
The existing authentication mechanism uses manual Telegram ID input.

This approach introduces:
- onboarding friction,
- invalid Telegram ID risk,
- weak identity verification,
- poor scalability for future Telegram integrations.

---

# Target State

Gajian Aman will migrate to Telegram OAuth / OpenID Connect (OIDC) authentication.

Users will:
1. Click "Continue with Telegram"
2. Authenticate via Telegram OAuth
3. Grant access permissions
4. Automatically create/login account securely

---

# Goals

- Improve onboarding conversion
- Remove manual Telegram ID entry
- Enable verified Telegram identity linkage
- Enable secure bot communication
- Reduce authentication fraud risk
- Prepare for Telegram Mini App ecosystem

---

# High-Level Architecture

Frontend
→ Telegram Login SDK
→ OAuth Authorization Flow

Backend
→ OAuth Callback Handler
→ Token Validation Layer
→ Session Management
→ User Identity Mapping

Database
→ Telegram-linked user profile storage

---

# Linked Documents

Technical implementation:
- `/docs/telegram-auth/TELEGRAM_AUTH_IMPLEMENTATION.md`

Security requirements:
- `/docs/telegram-auth/SECURITY_REQUIREMENTS.md`

Database migration:
- `/docs/telegram-auth/DATABASE_CHANGES.md`

Migration strategy:
- `/docs/telegram-auth/MIGRATION_PLAN.md`