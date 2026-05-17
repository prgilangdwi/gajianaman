# Security Requirements — Telegram OAuth

# Core Security Principles

- Never trust frontend identity data
- Validate everything server-side
- Use HTTPS only
- Store secrets securely
- Use short-lived sessions

---

# Mandatory Validations

## JWT Signature Validation

Validate using Telegram JWKS endpoint.

Required:
- signature verification
- issuer verification
- audience verification
- expiration verification

---

# Required Claim Checks

| Claim | Validation |
|---|---|
| iss | Must match Telegram issuer |
| aud | Must match Telegram Client ID |
| exp | Must not be expired |
| iat | Must be recent |
| nonce | Must match session |

---

# PKCE Requirements

Must implement:
- code verifier
- code challenge
- S256 challenge method

---

# State Validation

Use anti-CSRF state validation.

Requirements:
- cryptographically random
- one-time usage
- short expiration

---

# Secret Management

Never expose:
- client secret
- JWT validation secrets
- internal API keys

Store in:
- environment variables
- secret manager

---

# Browser Security

Avoid:
`Cross-Origin-Opener-Policy: same-origin`

Use:
`same-origin-allow-popups`

Required for Telegram popup communication.

---

# Session Security

Requirements:
- HTTP-only cookies
- Secure cookies
- SameSite protection
- Session expiration handling

---

# Logging

Never log:
- access tokens
- id tokens
- secrets
- user phone numbers

Allowed:
- anonymized auth events
- error events
- session lifecycle logs