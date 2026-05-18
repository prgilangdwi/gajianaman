# Claude Code Project Instructions

# Project

Gajian Aman

---

# Read These Files First

Mandatory:
- `/PRD/AUTH_SYSTEM_OVERVIEW.md`
- `/docs/telegram-auth/TELEGRAM_AUTH_IMPLEMENTATION.md`
- `/docs/telegram-auth/SECURITY_REQUIREMENTS.md`
- `/docs/telegram-auth/DATABASE_CHANGES.md`
- `/docs/telegram-auth/MIGRATION_PLAN.md`

---

# Primary Objective

Migrate the application authentication system from:
- manual Telegram ID authentication

to:
- Telegram OAuth/OpenID Connect authentication.

---

# Development Rules

- Never implement manual Telegram ID login again
- Always validate Telegram tokens server-side
- Use secure OAuth flow
- Use PKCE
- Use HTTPS
- Follow modular architecture
- Keep auth logic separated from UI

---

# Backend Requirements

- JWT validation
- Session management
- Secure cookie handling
- OAuth callback endpoint
- Structured error handling

---

# Frontend Requirements

- Telegram Login SDK
- Popup login flow
- Loading states
- Error states
- Session persistence

---

# Security Requirements

Follow:
`/docs/telegram-auth/SECURITY_REQUIREMENTS.md`

Strictly.

---

# Coding Standards

- Production-grade code only
- Modular architecture
- Strong typing
- Reusable services
- Clear folder structure
- Environment variable usage

---

# Important

Do not create:
- insecure local token validation
- frontend-only auth validation
- hardcoded secrets
- duplicate user mappings