# Image Transaction Parsing System

# Objective

Allow users to submit transaction evidence through images inside Telegram.

The system should automatically extract:
- merchant information,
- transaction amount,
- date/time,
- payment method,
- wallet/kantong,
- transaction type,
- category,
- line items (optional).

The extracted transaction must still go through user confirmation before saving.

---

# Supported Image Types

## Initial Scope

Supported:
- e-wallet screenshots
- mobile banking transfer screenshots
- QRIS payment screenshots
- receipt photos
- ATM transfer receipts
- transaction history screenshots

Examples:
- GoPay payment screenshot
- BCA transfer receipt
- ShopeePay transaction screenshot
- restaurant receipt photo

---

# User Flow

## Example Flow

User sends:
- image/photo/screenshot

Bot processes image.

Bot responds:
```text
Saya menemukan transaksi berikut:

Jenis: Pengeluaran
Nominal: Rp18.000
Merchant: Kopi Kenangan
Tanggal: Hari ini
Kantong: GoPay

Apakah data ini benar?