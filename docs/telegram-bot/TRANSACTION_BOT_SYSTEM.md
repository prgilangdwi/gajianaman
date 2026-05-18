# Telegram Transaction Bot System

# Objective

Develop a Telegram Bot interface that allows users to record financial transactions using natural language conversation.

The bot should:
- parse transaction intents,
- classify transaction types,
- identify wallets/kantong,
- request confirmation,
- save validated transactions into the system.

The bot acts as a conversational finance input layer for Gajian Aman.

---

# Core Capabilities

## Supported Transaction Types

### Expense
Examples:
- "beli kopi 15k 17 mei"
- "makan ayam geprek 25 ribu"
- "bayar parkir 5k"

---

### Income
Examples:
- "uang masuk 200k hari ini"
- "gaji masuk 5 juta"
- "dapat transfer 1 juta"

---

### Transfer
Examples:
- "transfer uang 100k dari bca ke bni rekening pribadi"
- "pindah saldo 500k ke ewallet"
- "transfer 1 juta ke tabungan"

---

# Natural Language Processing

The bot must extract:

| Field | Description |
|---|---|
| transaction_type | expense / income / transfer |
| amount | numeric amount |
| description | transaction label |
| date | transaction date |
| source_wallet | source wallet/kantong |
| destination_wallet | destination wallet/kantong |
| category | spending category |
| confidence_score | parsing confidence |

---

# Wallet / Kantong System

## Objective

Every transaction must belong to one or more financial containers ("kantong").

Examples:
- BCA
- BNI
- Cash
- GoPay
- OVO
- Dana
- Rekening Pribadi
- Tabungan
- Emergency Fund

---

# Wallet Logic

## Expense
Deduct from:
- selected wallet

Example:
"beli kopi 15k pakai gopay"

Result:
- expense = 15000
- wallet = GoPay

---

## Income
Add into:
- selected wallet

Example:
"uang masuk 2 juta ke bca"

Result:
- income = 2000000
- wallet = BCA

---

## Transfer
Move balance:
- from source wallet
- to destination wallet

Example:
"transfer uang 100k dari bca ke bni"

Result:
- transfer_out = BCA
- transfer_in = BNI

---

# Confirmation System

## Mandatory Confirmation

The bot MUST confirm parsed transactions before saving.

No transaction should be auto-saved without confirmation.

---

# Confirmation Flow

## Example 1 — Expense

User:
`beli kopi 15k 17 mei`

Bot:
```text
Konfirmasi transaksi:

Jenis: Pengeluaran
Nominal: Rp15.000
Kategori: Food & Beverage
Deskripsi: Beli kopi
Tanggal: 17 Mei
Kantong: Cash

Apakah data ini benar?