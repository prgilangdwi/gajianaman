# Gajian Aman — Figma Build Execution Phases 7-10

## PHASES 7-10: REMAINING SCREENS + FINAL IMPLEMENTATION

**Timeline:** Week 4-6 (15 working days)  
**Output:** 10+ additional screens + complete prototypes + final Polish  
**Team:** 2 designers, 1 QA/accessibility specialist

---

## PHASE 7: SETTINGS & ACCOUNT (Week 4)

### Screen 7.1: Settings Page

```
📱 Mobile: Settings (Main Frame)
│   Dimensions: 375 × 812px
│   Background: semantic/bg/default
│   Auto-layout: Vertical
│
├── Header [STICKY]
│   ├── Title: "Pengaturan"
│   ├── Font: typography/heading/2 (36px)
│   └── Border-bottom: 1px semantic/neutral/200
│
├── G1: App Preferences Section
│   ├── Label: "Aplikasi"
│   ├── Font: typography/label (12px, uppercase)
│   ├── Margin: [16, 16, 8, 16]
│   ├── Color: semantic/text/secondary
│   │
│   ├── Setting Row 1: Dark Mode
│   │   ├── Frame: "Setting Row"
│   │   ├── Auto-layout: Horizontal, space-between, center
│   │   ├── Padding: [16, 16]
│   │   ├── Height: 56px
│   │   ├── Border-bottom: 1px semantic/neutral/200
│   │   │
│   │   ├── Label
│   │   │   ├── Text: "Mode Gelap"
│   │   │   ├── Font: typography/body/base (16px)
│   │   │   └── Color: semantic/text/primary
│   │   │
│   │   └── Toggle Switch
│   │       ├── Component: Toggle (custom)
│   │       ├── Dimensions: 52×32px
│   │       ├── State: Off (gray)
│   │       ├── On tap: toggle dark mode
│   │       └── Animation: 200ms ease-in-out
│   │
│   ├── Setting Row 2: Notifications
│   │   ├── Label: "Notifikasi"
│   │   ├── Toggle: On (primary-600)
│   │   └── On tap: toggle notifications
│   │
│   ├── Setting Row 3: Biometric Login
│   │   ├── Label: "Login dengan Biometrik"
│   │   ├── Toggle: Off (gray)
│   │   └── Subtitle: "Gunakan Face ID atau fingerprint" (caption, secondary)
│   │
│   └── Setting Row 4: Language
│       ├── Label: "Bahasa"
│       ├── Dropdown: "Bahasa Indonesia" (current)
│       ├── Icon: chevron-right (right-aligned)
│       └── On tap: open language picker (sheet)
│
├── G2: Account Settings Section
│   ├── Label: "Akun"
│   ├── Margin: [24, 16, 8, 16]
│   │
│   ├── Setting Row 1: Currency
│   │   ├── Label: "Mata Uang"
│   │   ├── Value: "IDR (Rp)" (right-aligned)
│   │   ├── Icon: chevron-right
│   │   └── On tap: open currency selector
│   │
│   ├── Setting Row 2: Timezone
│   │   ├── Label: "Zona Waktu"
│   │   ├── Value: "Asia/Jakarta (UTC+7)"
│   │   ├── Icon: chevron-right
│   │   └── On tap: open timezone picker
│   │
│   ├── Setting Row 3: Email
│   │   ├── Label: "Email"
│   │   ├── Value: "user@example.com" (secondary color, truncated)
│   │   ├── Icon: chevron-right
│   │   └── On tap: open email change modal
│   │
│   └── Setting Row 4: Phone
│       ├── Label: "Nomor Telepon"
│       ├── Value: "+62 812 xxxx xxxx" (masked)
│       ├── Icon: chevron-right
│       └── On tap: open phone change modal
│
├── G3: Linked Accounts Section
│   ├── Label: "Akun Terhubung"
│   ├── Margin: [24, 16, 8, 16]
│   │
│   ├── Account Row 1: Telegram
│   │   ├── Frame: "Account Row"
│   │   ├── Auto-layout: Horizontal, space-between
│   │   ├── Padding: [12, 16]
│   │   ├── Height: 56px
│   │   ├── Background: semantic/bg/secondary (light)
│   │   ├── Radius: 12px
│   │   ├── Margin-bottom: 8px
│   │   │
│   │   ├── Icon + Label [flex: 1]
│   │   │   ├── Icon: telegram (24px, telegram-blue)
│   │   │   ├── Text: "Telegram"
│   │   │   ├── Subtitle: "@username123" (secondary, small)
│   │   │   └── Auto-layout: Horizontal, 12px gap
│   │   │
│   │   └── Status Badge
│   │       ├── Text: "Terhubung"
│   │       ├── Background: success-100
│   │       ├── Color: success-600
│   │       ├── Font: typography/caption (12px)
│   │       ├── Padding: [4, 12]
│   │       └── Radius: full
│   │
│   ├── Account Row 2: Google
│   │   ├── Icon: google (24px, google-colors)
│   │   ├── Text: "Google"
│   │   ├── Subtitle: "user@gmail.com"
│   │   ├── Status: "Terhubung"
│   │   └── Background: semantic/bg/secondary
│   │
│   └── Link More Accounts Button
│       ├── Component: Button/secondary
│       ├── Size: md
│       ├── Text: "+ Tambah Akun"
│       ├── Flex: full width
│       └── On tap: open account linking flow
│
├── G4: Data Management Section
│   ├── Label: "Data & Privasi"
│   ├── Margin: [24, 16, 8, 16]
│   │
│   ├── Action Row 1: Export Data
│   │   ├── Frame: "Action Row"
│   │   ├── Padding: [16, 16]
│   │   ├── Height: 56px
│   │   ├── Border-bottom: 1px semantic/neutral/200
│   │   │
│   │   ├── Icon: download (24px, primary-600)
│   │   ├── Label
│   │   │   ├── Text: "Ekspor Data"
│   │   │   ├── Subtitle: "Unduh semua data transaksi" (caption, secondary)
│   │   │   └── Auto-layout: Vertical, 4px gap
│   │   │
│   │   └── Icon: chevron-right
│   │
│   ├── Action Row 2: Backup
│   │   ├── Icon: shield-check (24px, success-600)
│   │   ├── Label: "Backup Otomatis"
│   │   ├── Subtitle: "Backup setiap hari jam 02:00"
│   │   └── Toggle: On (right-aligned)
│   │
│   └── Action Row 3: Delete Account
│       ├── Icon: trash (24px, danger-600)
│       ├── Label: "Hapus Akun"
│       ├── Font color: danger-600
│       ├── Subtitle: "Permanen, tidak dapat dibatalkan"
│       └── On tap: show confirmation modal (danger-style)
│
├── G5: About Section
│   ├── Label: "Tentang"
│   ├── Margin: [24, 16, 8, 16]
│   │
│   ├── Row 1: Version
│   │   ├── Label: "Versi Aplikasi"
│   │   ├── Value: "2.0.0"
│   │   └── Font: typography/body/sm
│   │
│   ├── Row 2: Build
│   │   ├── Label: "Build Number"
│   │   ├── Value: "2024051" (long press to enable dev menu)
│   │   └── Font: typography/body/sm
│   │
│   ├── Link 1: Terms of Service
│   │   ├── Component: Button/tertiary/text
│   │   ├── Text: "Syarat & Ketentuan"
│   │   ├── Icon: external-link (16px, right)
│   │   └── On tap: open in browser
│   │
│   ├── Link 2: Privacy Policy
│   │   ├── Component: Button/tertiary/text
│   │   ├── Text: "Kebijakan Privasi"
│   │   └── On tap: open in browser
│   │
│   └── Link 3: Contact Support
│       ├── Component: Button/tertiary/text
│       ├── Text: "Hubungi Dukungan"
│       ├── Icon: mail (16px)
│       └── On tap: open email composer (support email)
│
└── G6: Logout Section [DANGER ZONE]
    ├── Button: Logout
    │   ├── Component: Button/danger
    │   ├── Size: md
    │   ├── Text: "Keluar"
    │   ├── Full width
    │   ├── Margin: [24, 16, 56, 16]
    │   └── On tap: show confirmation → logout, navigate to Login
    │
    └── Safe Area Bottom: 34px
```

**Specifications:**
- Setting rows: 56px height (auto-layout, space-between)
- Labels: typography/label (12px, uppercase, secondary color)
- Values: typography/body/base (right-aligned, secondary color)
- Toggle size: 52×32px (custom component)
- Status badges: semantic background + color (success, warning)
- Icon colors: context-aware (gray, primary, success, danger)
- Padding: 16px sides, 8px between sections (24px spacing)

---

### Screen 7.2: User Profile

```
📱 Mobile: Profile (Main Frame)
│   Dimensions: 375 × 812px
│
├── Header Section [STICKY]
│   ├── Background: primary-600 (sky-600, gradient optional)
│   ├── Padding: [20, 16]
│   ├── Height: 160px
│   ├── Auto-layout: Vertical, center, 12px gap
│   │
│   ├── Avatar
│   │   ├── Circle: 80×80px
│   │   ├── Background: placeholder (or user image)
│   │   ├── Border: 4px white
│   │   └── Icon: camera (24px, bottom-right, on tap to change)
│   │
│   ├── Name
│   │   ├── Text: "Budi Santoso"
│   │   ├── Font: typography/heading/2 (36px, bold)
│   │   ├── Color: white
│   │   └── Centered
│   │
│   └── Subtitle
│       ├── Text: "Member sejak 5 Januari 2023"
│       ├── Font: typography/body/sm (14px)
│       ├── Color: rgba(255, 255, 255, 0.8)
│       └── Centered
│
├── G1: Statistics Section
│   ├── Background: semantic/bg/default (white, below header)
│   ├── Padding: [20, 16]
│   ├── Grid: 2 columns, 12px gap
│   │
│   ├── Stat Card 1: Total Transactions
│   │   ├── Frame: "Stat Card"
│   │   ├── Auto-layout: Vertical, center, 8px gap
│   │   ├── Padding: [16, 12]
│   │   ├── Background: semantic/bg/secondary
│   │   ├── Radius: 12px
│   │   │
│   │   ├── Label
│   │   │   ├── Text: "Transaksi"
│   │   │   ├── Font: typography/body/sm (12px)
│   │   │   └── Color: semantic/text/secondary
│   │   │
│   │   └── Value
│   │       ├── Text: "234"
│   │       ├── Font: typography/mono/amount (24px)
│   │       └── Color: semantic/text/primary
│   │
│   ├── Stat Card 2: Total Spending
│   │   ├── Label: "Total Pengeluaran"
│   │   ├── Value: "Rp 2.3M" (mono-amount)
│   │   └── Color: danger-600
│   │
│   ├── Stat Card 3: Total Savings
│   │   ├── Label: "Total Tabungan"
│   │   ├── Value: "Rp 5.2M"
│   │   └── Color: success-600
│   │
│   └── Stat Card 4: Avg Monthly
│       ├── Label: "Rata-rata/Bulan"
│       ├── Value: "Rp 462k"
│       └── Color: primary-600
│
├── G2: Account Information
│   ├── Label: "Informasi Akun"
│   ├── Margin: [20, 16, 8, 16]
│   ├── Font: typography/label (12px, uppercase)
│   │
│   ├── Info Row 1: Email
│   │   ├── Frame: "Info Row"
│   │   ├── Auto-layout: Vertical, 4px gap
│   │   ├── Padding: [12, 0]
│   │   ├── Border-bottom: 1px semantic/neutral/200
│   │   │
│   │   ├── Label
│   │   │   ├── Text: "Email"
│   │   │   ├── Font: typography/label (12px, secondary)
│   │   │   └── Color: semantic/text/secondary
│   │   │
│   │   └── Value
│   │       ├── Text: "budi.santoso@email.com"
│   │       ├── Font: typography/body/base (16px)
│   │       ├── Color: semantic/text/primary
│   │       └── On tap: edit email
│   │
│   ├── Info Row 2: Phone
│   │   ├── Label: "Nomor Telepon"
│   │   ├── Value: "+62 812 3456 7890"
│   │   └── On tap: edit phone
│   │
│   ├── Info Row 3: Location
│   │   ├── Label: "Lokasi"
│   │   ├── Value: "Jakarta, Indonesia"
│   │   └── On tap: edit location
│   │
│   └── Info Row 4: Timezone
│       ├── Label: "Zona Waktu"
│       ├── Value: "Asia/Jakarta (UTC+7)"
│       └── On tap: edit timezone
│
├── G3: Subscription Status
│   ├── Background: semantic/bg/secondary
│   ├── Radius: 12px
│   ├── Padding: [16, 16]
│   ├── Margin: [20, 16, 0, 16]
│   ├── Border: 1px primary-200 (subtle)
│   ├── Auto-layout: Vertical, 12px gap
│   │
│   ├── Badge
│   │   ├── Text: "Tier: Free"
│   │   ├── Background: primary-50
│   │   ├── Color: primary-600
│   │   ├── Padding: [4, 12]
│   │   ├── Radius: full
│   │   └── Font: typography/label (12px)
│   │
│   ├── Description
│   │   ├── Text: "Akses gratis ke fitur dasar. Upgrade untuk unlimited categories, budgets, dan AI insights."
│   │   ├── Font: typography/body/sm (14px)
│   │   └── Color: semantic/text/secondary
│   │
│   └── CTA Button
│       ├── Component: Button/primary
│       ├── Size: md
│       ├── Text: "Upgrade Sekarang"
│       ├── Full width
│       └── On tap: navigate to pricing screen (future)
│
└── G4: Bottom Navigation [STICKY]
    ├── Component: BottomNavigation
    └── NavItem: Profile (active)
```

**Key specifications:**
- Header: primary-600 background, 160px height (avatar 80px + text)
- Stats grid: 2 columns, 12px gap, cards have secondary background
- Info rows: 56px height, vertical auto-layout
- Subscription card: bordered, soft background, prominent CTA
- All text fields editable (tap to edit in separate modals)

---

### Screen 7.3: Wallet / Payment Methods

```
📱 Mobile: Wallet (Main Frame)
│   Dimensions: 375 × 812px
│
├── Header [STICKY]
│   ├── Title: "Dompet & Pembayaran"
│   └── Font: typography/heading/2 (36px)
│
├── G1: Saved Cards Section
│   ├── Label: "Kartu Tersimpan"
│   ├── Margin: [16, 16, 12, 16]
│   │
│   ├── Card 1: Primary Card (highlighted)
│   │   ├── Frame: "Card Item"
│   │   ├── Dimensions: 343 × 120px
│   │   ├── Background: primary-600 (gradient optional)
│   │   ├── Radius: 16px
│   │   ├── Padding: [16, 20]
│   │   ├── Auto-layout: Vertical, space-between
│   │   ├── Shadow: elevation/shadow/md
│   │   ├── Position: relative, can be swiped
│   │   │
│   │   ├── Badge [top-right]
│   │   │   ├── Text: "Kartu Utama"
│   │   │   ├── Background: rgba(255, 255, 255, 0.2)
│   │   │   ├── Color: white
│   │   │   ├── Font: typography/caption (11px)
│   │   │   └── Padding: [4, 8]
│   │   │
│   │   ├── Bank Info [top]
│   │   │   ├── Bank name: "BCA"
│   │   │   ├── Font: typography/label (12px, white)
│   │   │   └── Opacity: 0.8
│   │   │
│   │   ├── Card Number [middle]
│   │   │   ├── Text: "**** **** **** 4242"
│   │   │   ├── Font: DM Mono (16px, white)
│   │   │   ├── Letter-spacing: 2px
│   │   │   └── Tracking/readable (monospace)
│   │   │
│   │   └── Card Details [bottom, horizontal layout]
│   │       ├── Holder: "BUDI SANTOSO"
│   │       ├── Expiry: "02/28"
│   │       ├── Font: typography/caption (11px, white)
│   │       ├── Opacity: 0.7
│   │       └── Auto-layout: space-between
│   │
│   ├── Card 2: Secondary Card
│   │   ├── Background: semantic/bg/secondary (light gray)
│   │   ├── Border: 1px semantic/neutral/200
│   │   ├── Text color: semantic/text/primary (dark)
│   │   ├── Not highlighted
│   │   └── On tap: set as primary card
│   │
│   └── Card 3 (if present)
│       └── Same as Card 2
│
├── G2: E-Wallets Section
│   ├── Label: "E-Dompet & Aplikasi"
│   ├── Margin: [16, 16, 12, 16]
│   │
│   ├── Wallet Row 1: GCash
│   │   ├── Frame: "Wallet Row"
│   │   ├── Auto-layout: Horizontal, space-between, center
│   │   ├── Padding: [12, 16]
│   │   ├── Height: 56px
│   │   ├── Radius: 12px
│   │   ├── Background: semantic/bg/secondary
│   │   │
│   │   ├── Icon + Label [flex: 1]
│   │   │   ├── Icon: gcash-logo (24px)
│   │   │   ├── Label: "GCash"
│   │   │   ├── Subtitle: "+63 917 123 4567" (secondary)
│   │   │   └── Auto-layout: Horizontal, 12px gap
│   │   │
│   │   └── Status Badge
│   │       ├── Text: "Aktif"
│   │       ├── Background: success-100
│   │       ├── Color: success-600
│   │       └── Font: typography/caption (11px)
│   │
│   ├── Wallet Row 2: OVO
│   │   ├── Icon: ovo-logo
│   │   ├── Label: "OVO"
│   │   ├── Subtitle: "OVO Balance: Rp 250,000"
│   │   └── Status: "Aktif"
│   │
│   └── Wallet Row 3: Dana
│       ├── Icon: dana-logo
│       ├── Label: "Dana"
│       ├── Subtitle: "Not connected"
│       └── Status: "Tidak Terhubung" (warning-600)
│
├── G3: Bank Accounts Section
│   ├── Label: "Rekening Bank"
│   ├── Margin: [16, 16, 12, 16]
│   │
│   ├── Account Row 1: Primary Account
│   │   ├── Frame: "Account Row"
│   │   ├── Padding: [12, 16]
│   │   ├── Background: semantic/bg/secondary
│   │   ├── Radius: 12px
│   │   │
│   │   ├── Icon: bank (24px, primary-600)
│   │   ├── Label
│   │   │   ├── Text: "BCA"
│   │   │   ├── Subtitle: "1234567890 (Budi Santoso)"
│   │   │   └── Font: typography/body/base + caption
│   │   │
│   │   └── Status
│   │       ├── Text: "Terverifikasi"
│   │       ├── Background: success-100
│   │       └── Color: success-600
│   │
│   └── Account Row 2: Secondary Account
│       ├── Bank: "Mandiri"
│       ├── Account: "0987654321"
│       └── Status: "Terverifikasi"
│
├── G4: Add Payment Method
│   ├── Button: "Tambah Metode Pembayaran"
│   ├── Component: Button/secondary
│   ├── Size: lg
│   ├── Full width
│   ├── Icon: plus (24px)
│   ├── Margin: [16, 16]
│   └── On tap: open payment method picker (sheet)
│
└── G5: Bottom Navigation [STICKY]
    └── NavItem: Wallet
```

**Key specifications:**
- Primary card: Prominent (primary-600 background, shadow), 343×120px
- Secondary cards: Muted (light gray background), smaller visual weight
- E-wallets: Status badges (Aktif, Tidak Terhubung)
- Bank accounts: Verification status (Terverifikasi, Pending)
- Card numbers: Always masked (**** **** **** XXXX)
- Last 4 digits visible for verification only
- Swipe interactions: Swipe card to reveal delete/edit options

---

## PHASE 8: AI ASSISTANT & ONBOARDING (Week 4-5)

### Screen 8.1: AI Chat Interface (MAJOR)

```
📱 Mobile: AI Assistant (Main Frame)
│   Dimensions: 375 × 812px
│   Background: semantic/bg/default
│   Auto-layout: Vertical
│
├── Header [STICKY]
│   ├── Background: primary-600 (sky-600, branded)
│   ├── Height: 56px
│   ├── Padding: [16, 16]
│   ├── Auto-layout: Horizontal, space-between
│   │
│   ├── Title
│   │   ├── Text: "Asisten AI"
│   │   ├── Font: typography/heading/2 (36px)
│   │   ├── Color: white
│   │   └── Flex: 1
│   │
│   └── Info Button
│       ├── Component: Button/icon/only
│       ├── Icon: info (24px, white)
│       ├── Background: rgba(255, 255, 255, 0.2)
│       └── On tap: show AI capabilities modal
│
├── G1: Chat History [SCROLLABLE, main content]
│   ├── Dimensions: 375 × 620px (from header to input)
│   ├── Auto-layout: Vertical, 8px gap
│   ├── Padding: [16, 16, 16, 16] (content area padding)
│   ├── Scroll: Vertical, always scroll to bottom
│   │
│   ├── Message Group 1: Initial State (if no history)
│   │   ├── Center vertically: 200px from top
│   │   ├── Frame: "Empty State"
│   │   ├── Auto-layout: Vertical, center, 16px gap
│   │   │
│   │   ├── Avatar
│   │   │   ├── Circle: 80×80px
│   │   │   ├── Background: primary-50
│   │   │   ├── Icon: brain (48px, primary-600)
│   │   │   └── Centered
│   │   │
│   │   ├── Greeting
│   │   │   ├── Text: "Halo! Saya Asisten AI Anda"
│   │   │   ├── Font: typography/heading/3 (30px)
│   │   │   ├── Color: semantic/text/primary
│   │   │   └── Centered
│   │   │
│   │   └── Subtitle
│   │       ├── Text: "Tanya tentang keuangan Anda, analisis pengeluaran, atau dapatkan saran anggaran"
│   │       ├── Font: typography/body/sm (14px)
│   │       ├── Color: semantic/text/secondary
│   │       └── Centered, max-width 300px
│   │
│   ├── Suggested Questions (if empty history)
│   │   ├── Frame: "Suggestions"
│   │   ├── Auto-layout: Vertical, 8px gap
│   │   ├── Margin: [16, 0, 0, 0]
│   │   │
│   │   ├── Question Card 1
│   │   │   ├── Frame: "Question"
│   │   │   ├── Dimensions: 343 × 56px
│   │   │   ├── Padding: [12, 16]
│   │   │   ├── Background: semantic/bg/secondary
│   │   │   ├── Radius: 12px
│   │   │   ├── Auto-layout: Horizontal, 12px gap
│   │   │   │
│   │   │   ├── Icon: sparkles (20px, primary-600)
│   │   │   ├── Label
│   │   │   │   ├── Text: "Berapa rata-rata pengeluaran saya?"
│   │   │   │   ├── Font: typography/body/sm (14px)
│   │   │   │   └── Color: semantic/text/primary
│   │   │   │
│   │   │   └── On tap: populate input + auto-send
│   │   │
│   │   ├── Question Card 2
│   │   │   ├── Text: "Apa kategori dengan pengeluaran terbesar?"
│   │   │   └── Same structure
│   │   │
│   │   ├── Question Card 3
│   │   │   ├── Text: "Bagaimana cara hemat lebih banyak?"
│   │   │   └── Same structure
│   │   │
│   │   └── Question Card 4
│   │       ├── Text: "Analisis tren pengeluaran saya"
│   │       └── Same structure
│   │
│   ├── Chat Bubble 1: User Message
│   │   ├── Frame: "Chat Bubble"
│   │   ├── Max-width: 85% (right-aligned)
│   │   ├── Auto-layout: Vertical, 4px gap
│   │   │
│   │   ├── Message Content
│   │   │   ├── Background: primary-600 (sky-600)
│   │   │   ├── Padding: [12, 16]
│   │   │   ├── Radius: [12, 12, 4, 12] (rounded except bottom-left)
│   │   │   ├── Text: "Berapa rata-rata pengeluaran saya bulan ini?"
│   │   │   ├── Font: typography/body/base (16px)
│   │   │   ├── Color: white
│   │   │   ├── Word-wrap: enabled
│   │   │   └── Line-height: 1.5 (readable)
│   │   │
│   │   └── Timestamp [optional]
│   │       ├── Text: "10:30"
│   │       ├── Font: typography/caption (11px)
│   │       ├── Color: semantic/text/tertiary
│   │       └── Right-aligned, below message
│   │
│   ├── Chat Bubble 2: Assistant Message
│   │   ├── Max-width: 85% (left-aligned)
│   │   ├── Auto-layout: Vertical, 8px gap
│   │   │
│   │   ├── Message Header [optional]
│   │   │   ├── Avatar [optional]
│   │   │   │   ├── Circle: 32×32px
│   │   │   │   ├── Background: primary-50
│   │   │   │   ├── Icon: brain (20px, primary-600)
│   │   │   │   └── Left-aligned
│   │   │
│   │   ├── Message Content
│   │   │   ├── Background: neutral-100 (light gray)
│   │   │   ├── Padding: [12, 16]
│   │   │   ├── Radius: [12, 12, 12, 4]
│   │   │   ├── Text: "Berdasarkan data Anda, rata-rata pengeluaran bulan ini adalah Rp 2.55 juta. Ini 12% lebih tinggi dari bulan lalu..."
│   │   │   ├── Font: typography/body/base (16px)
│   │   │   ├── Color: semantic/text/primary
│   │   │   ├── Max-width: 300px
│   │   │   └── Word-wrap: enabled
│   │   │
│   │   ├── Quick Action Buttons [optional, below message]
│   │   │   ├── Frame: "Actions"
│   │   │   ├── Auto-layout: Horizontal, 8px gap
│   │   │   ├── Padding: [8, 0]
│   │   │   │
│   │   │   ├── Button 1: Copy
│   │   │   │   ├── Component: Button/icon/small
│   │   │   │   ├── Icon: copy (16px)
│   │   │   │   ├── Tooltip: "Salin"
│   │   │   │   └── On tap: copy message to clipboard
│   │   │   │
│   │   │   ├── Button 2: Thumbs Up
│   │   │   │   ├── Icon: thumbs-up (16px)
│   │   │   │   └── On tap: provide feedback (positive)
│   │   │   │
│   │   │   └── Button 3: Thumbs Down
│   │   │       ├── Icon: thumbs-down (16px)
│   │   │       └── On tap: provide feedback (negative)
│   │   │
│   │   └── Timestamp [optional]
│   │       ├── Text: "10:31"
│   │       └── Font: typography/caption (11px)
│   │
│   ├── Chat Bubble 3: Generating (Assistant typing)
│   │   ├── Background: neutral-100
│   │   ├── Padding: [12, 16]
│   │   ├── Radius: [12, 12, 12, 4]
│   │   │
│   │   ├── Animated Dots
│   │   │   ├── "Sedang menyiapkan jawaban..."
│   │   │   ├── Three dots: ● ● ●
│   │   │   ├── Animation: pulse / fade (1s cycle, infinite)
│   │   │   ├── Font: typography/body/base (16px)
│   │   │   └── Color: semantic/text/secondary
│   │   │
│   │   └── No timestamp until complete
│   │
│   └── Scroll Indicator (if more messages above)
│       ├── Centered, 8px top margin
│       ├── Text: "↑ Scroll untuk lihat lebih banyak"
│       ├── Font: typography/caption (11px)
│       └── Color: semantic/text/tertiary
│
├── G2: Input Area [STICKY, bottom-safe-area aware]
│   ├── Dimensions: 375 × auto (min 60px)
│   ├── Padding: [12, 16, 8+safearea, 16]
│   ├── Background: semantic/bg/default
│   ├── Border-top: 1px semantic/neutral/200
│   ├── Auto-layout: Vertical, 8px gap
│   │
│   ├── Input Row
│   │   ├── Frame: "Input Container"
│   │   ├── Auto-layout: Horizontal, 8px gap
│   │   ├── Padding: 0
│   │   │
│   │   ├── Text Input [flex: 1]
│   │   │   ├── Component: Input/text (custom, large)
│   │   │   ├── Height: 44px
│   │   │   ├── Placeholder: "Tanya tentang keuangan Anda..."
│   │   │   ├── Font: typography/body/base (16px)
│   │   │   ├── Padding: [12, 16]
│   │   │   ├── Radius: 22px (fully rounded, like iMessage)
│   │   │   ├── Background: semantic/bg/secondary
│   │   │   ├── Border: 1px semantic/neutral/200 (on focus: primary-600)
│   │   │   ├── Max-height: 100px (expandable)
│   │   │   ├── Resize: vertical (grows with text)
│   │   │   └── On focus: keyboard appears, input floats above keyboard
│   │   │
│   │   └── Send Button
│   │       ├── Component: Button/icon/only
│   │       ├── Size: md
│   │       ├── Dimensions: 44×44px
│   │       ├── Icon: send (24px)
│   │       ├── Background: primary-600 (if text present)
│   │       ├── Background: neutral-300 (if empty, disabled)
│   │       ├── Radius: full (circular)
│   │       ├── On tap: submit message (if not empty)
│   │       └── Animation: scale(0.95) on press
│   │
│   └── Suggested Actions [optional, if message empty]
│       ├── Frame: "Suggestions"
│       ├── Auto-layout: Horizontal, 8px gap, wrap
│       ├── Scroll: Horizontal (scrollable)
│       ├── Padding: [0, 0, 8, 0]
│       │
│       ├── Chip 1: "Analisis pengeluaran"
│       │   ├── Component: Chip (small)
│       │   ├── Background: primary-50
│       │   ├── Text color: primary-600
│       │   ├── Font: typography/label (12px)
│       │   └── On tap: populate input with this suggestion
│       │
│       ├── Chip 2: "Saran hemat"
│       ├── Chip 3: "Tren 3 bulan"
│       ├── Chip 4: "Projeksi tabungan"
│       └── ... more chips
│
├── G3: Keyboard Safe Area
│   ├── When keyboard opens:
│   │   ├── Input area: moves above keyboard
│   │   ├── Chat history: scrolls to bottom
│   │   ├── Scroll enabled to see prior messages
│   │   └── Send button always visible
│   │
│   └── When keyboard closes:
│       ├── Input returns to bottom
│       ├── Layout resets
│       └── Last message visible

└── G4: Bottom Navigation [STICKY, Z-index: 500]
    ├── Component: BottomNavigation
    └── NavItem: AI (active)
```

**Key specifications:**
- Chat bubbles: Right-aligned (user, primary-600), left-aligned (assistant, neutral-100)
- Radius: [12, 12, 4, 12] for user, [12, 12, 12, 4] for assistant (asymmetric corners)
- Input: Rounded pill-shaped (border-radius: 22px), expandable
- Suggested questions: Cards (56px height), centered, tappable
- Typing indicator: Animated dots (pulse animation)
- Scroll: Always scroll to bottom when new message arrives
- Keyboard: Input floats above keyboard, send button always accessible

---

### Screen 8.2: Onboarding Flow (4 screens)

**Screen 8.2a: Welcome Screen**
```
📱 Mobile: Onboarding Step 1 (Main Frame)
│   Dimensions: 375 × 812px
│   Background: primary-600 gradient (light to sky-600)
│
├── Spacer: 60px (top)
│
├── Illustration
│   ├── Frame: "Illustration"
│   ├── Dimensions: 240×240px
│   ├── Centered
│   ├── Image: Wallet illustration (animated optional)
│   └── Centered vertically
│
├── Heading
│   ├── Text: "Kelola Keuangan Anda dengan Mudah"
│   ├── Font: typography/heading/2 (36px, bold)
│   ├── Color: white
│   ├── Centered
│   ├── Margin: [24, 32]
│   └── Max-width: 311px
│
├── Description
│   ├── Text: "Catat setiap transaksi, analisis pengeluaran, dan raih target tabungan Anda dengan AI assistant kami yang cerdas."
│   ├── Font: typography/body/base (16px)
│   ├── Color: rgba(255, 255, 255, 0.9)
│   ├── Centered
│   ├── Margin: [0, 32]
│   ├── Max-width: 311px
│   └── Line-height: 1.6
│
├── Spacer: Flexible
│
├── Progress Indicator
│   ├── Frame: "Progress"
│   ├── Auto-layout: Horizontal, center
│   ├── Margin: [0, 0, 24, 0]
│   │
│   ├── Dot 1 [active]
│   │   ├── Circle: 8×8px
│   │   ├── Background: white
│   │   └── Opacity: 100%
│   │
│   ├── Dot 2 [inactive]
│   │   ├── Circle: 8×8px
│   │   ├── Background: white
│   │   └── Opacity: 30%
│   │
│   ├── Dot 3 [inactive]
│   ├── Dot 4 [inactive]
│   └── Gap: 8px between dots
│
├── Actions
│   ├── Frame: "Actions"
│   ├── Auto-layout: Vertical, 12px gap
│   ├── Padding: [0, 16, 24, 16]
│   │
│   ├── CTA Button: "Mulai Sekarang"
│   │   ├── Component: Button/primary (white variant)
│   │   ├── Size: lg
│   │   ├── Text color: primary-600
│   │   ├── Background: white
│   │   ├── Full width
│   │   ├── Height: 52px
│   │   └── On tap: next screen (step 2)
│   │
│   └── Secondary Button: "Pelajari Lebih Lanjut"
│       ├── Component: Button/tertiary
│       ├── Text color: white
│       ├── Background: transparent
│       ├── Border: 2px white
│       ├── Full width
│       └── On tap: open help center (or skip)
│
└── Safe Area Bottom: 34px
```

**Screen 8.2b: Features Overview (same structure, different content)**
```
Heading: "Fitur-Fitur Unggulan"

Feature Cards (3):
├── Card 1: "📊 Analitik Real-time"
│   ├── Icon: bar-chart (48px)
│   ├── Title: "Analitik Real-time"
│   └── Description: "Lihat pengeluaran Anda dalam visualisasi yang mudah dipahami"
│
├── Card 2: "🤖 AI Assistant"
│   ├── Icon: brain (48px)
│   ├── Title: "AI Assistant"
│   └── Description: "Dapatkan saran anggaran otomatis dan wawasan keuangan"
│
└── Card 3: "🎯 Target & Goals"
    ├── Icon: target (48px)
    ├── Title: "Target & Goals"
    └── Description: "Atur target tabungan dan pantau progres Anda"

Structure: 3 cards, 56px height each, full-width, auto-layout vertical
```

**Screen 8.2c: Permissions Request**
```
Heading: "Akses yang Diperlukan"
Description: "Izinkan akses ke kamera dan notifikasi untuk pengalaman terbaik"

Permissions:
├── Permission 1: Camera
│   ├── Icon: camera (24px, primary-600)
│   ├── Title: "Kamera"
│   ├── Description: "Ambil foto struk pembayaran secara otomatis"
│   ├── Toggle: Off
│   └── On tap: request camera permission
│
├── Permission 2: Notifications
│   ├── Icon: bell (24px, warning-600)
│   ├── Title: "Notifikasi"
│   ├── Description: "Dapatkan pengingat untuk pencatatan dan insights"
│   ├── Toggle: Off
│   └── On tap: request notification permission
│
└── Permission 3: Calendar (optional)
    ├── Icon: calendar (24px)
    ├── Title: "Kalender"
    ├── Description: "Sinkronkan dengan kalender Anda untuk konteks acara"
    ├── Toggle: Off
    └── On tap: request calendar permission

Actions:
├── "Selanjutnya" button (primary)
└── "Lewati" button (tertiary)
```

**Screen 8.2d: Setup Currency & Timezone**
```
Heading: "Pengaturan Awal"

Setup Fields:
├── Field 1: Currency
│   ├── Label: "Mata Uang"
│   ├── Dropdown: "IDR - Indonesian Rupiah" (selected)
│   ├── Icon: globe (24px)
│   └── On tap: open currency selector
│
└── Field 2: Timezone
    ├── Label: "Zona Waktu"
    ├── Dropdown: "Asia/Jakarta (UTC+7)" (auto-detected)
    ├── Icon: clock (24px)
    └── On tap: open timezone selector

Actions:
├── "Selesai" button (primary, full-width)
├── On tap: complete onboarding, navigate to Home
└── Progress: 4/4 (final step)
```

---

## PHASE 9: PLANNING TOOLS & ANALYTICS (Week 5)

### Screen 9.1: Goals Progress

```
📱 Mobile: Goals (Main Frame)
│   Dimensions: 375 × 812px
│
├── Header [STICKY]
│   ├── Title: "Target Tabungan"
│   ├── Font: typography/heading/2 (36px)
│   └── Border-bottom: 1px semantic/neutral/200
│
├── G1: Summary Card
│   ├── Background: primary-50 (light blue)
│   ├── Radius: 16px
│   ├── Padding: [20, 24]
│   ├── Margin: [16, 16]
│   ├── Auto-layout: Vertical, 12px gap
│   │
│   ├── Label
│   │   ├── Text: "Total Target"
│   │   ├── Font: typography/label (14px)
│   │   └── Color: primary-600
│   │
│   ├── Amount
│   │   ├── Text: "Rp 50,000,000"
│   │   ├── Font: typography/mono/amount (28px)
│   │   └── Color: primary-900
│   │
│   └── Progress
│       ├── Text: "Rp 18,500,000 terkumpul (37%)"
│       ├── Font: typography/body/sm (14px)
│       └── Color: semantic/text/secondary
│
├── G2: Goals List
│   ├── Auto-layout: Vertical, 12px gap
│   ├── Margin: [16, 16]
│   │
│   ├── Goal Card 1: Liburan Bali
│   │   ├── Component: Card/md
│   │   ├── Padding: [16, 16]
│   │   ├── Auto-layout: Vertical, 12px gap
│   │   │
│   │   ├── Header [horizontal]
│   │   │   ├── Title: "Liburan Bali"
│   │   │   ├── Icon: plane (24px, warning-600)
│   │   │   └── Auto-layout: horizontal, space-between
│   │   │
│   │   ├── Target Amount
│   │   │   ├── Text: "Target: Rp 20,000,000"
│   │   │   ├── Font: typography/body/base (16px, mono-amount style)
│   │   │   └── Color: semantic/text/primary
│   │   │
│   │   ├── Progress Ring
│   │   │   ├── Component: ProgressRing (custom)
│   │   │   ├── Dimensions: 80×80px
│   │   │   ├── Progress: 55% (11 juta / 20 juta)
│   │   │   ├── Center text: "55%"
│   │   │   ├── Font: mono-amount (20px)
│   │   │   ├── Color: success-600 (on progress)
│   │   │   └── Stroke: 6px
│   │   │
│   │   ├── Saved Amount
│   │   │   ├── Text: "Rp 11,000,000 terkumpul"
│   │   │   ├── Font: typography/body/sm (14px)
│   │   │   └── Color: semantic/text/secondary
│   │   │
│   │   ├── Timeline
│   │   │   ├── Text: "Target: 30 Desember 2026 (7 bulan lagi)"
│   │   │   ├── Font: typography/caption (12px)
│   │   │   └── Color: semantic/text/tertiary
│   │   │
│   │   └── Actions [horizontal, 12px gap]
│   │       ├── Button: "Tambah Dana"
│   │       │   ├── Component: Button/primary
│   │       │   ├── Size: sm
│   │       │   ├── Flex: 1
│   │       │   └── On tap: open fund goal modal
│   │       │
│   │       └── Button: "Edit"
│   │           ├── Component: Button/secondary
│   │           ├── Size: sm
│   │           ├── Flex: 1
│   │           └── On tap: open goal editor
│   │
│   ├── Goal Card 2: Beli Mobil
│   │   ├── Progress: 32% (6.4 juta / 20 juta)
│   │   ├── Target: December 2027
│   │   └── Similar structure
│   │
│   └── Goal Card 3: Emergency Fund
│       ├── Progress: 85% (8.5 juta / 10 juta)
│       ├── Target: December 2026
│       └── Similar structure
│
├── G3: Add Goal Button
│   ├── Component: Button/primary
│   ├── Size: lg
│   ├── Text: "+ Tambah Target Baru"
│   ├── Full width
│   ├── Margin: [16, 16]
│   └── On tap: open goal creation modal
│
└── G4: Bottom Navigation [STICKY]
    └── NavItem: Planning (active context)
```

---

### Screen 9.2: Budget Setup Wizard (Modal Flow)

```
📱 Mobile: Budget Setup Modal (Bottom Sheet)
│   Dimensions: 375 × 70% (540px)
│   Background: white
│   Radius: [16, 16, 0, 0]
│
├── Step 1: Category Selection
│   ├── Title: "Buat Anggaran"
│   ├── Subtitle: "Pilih kategori yang ingin Anda anggaran" (step 1 of 3)
│   │
│   ├── Category Grid [2 columns]
│   │   ├── Category Chip 1: Food & Dining
│   │   │   ├── Frame: "Category Chip"
│   │   │   ├── Dimensions: 152×80px
│   │   │   ├── Icon: utensil-cross (32px, centered)
│   │   │   ├── Label: "Food & Dining" (below icon)
│   │   │   ├── Background: semantic/bg/secondary (unselected)
│   │   │   ├── On tap: select category (highlight with border primary-600)
│   │   │   └── Selected state: border 2px primary-600, background primary-50
│   │   │
│   │   ├── Category Chip 2: Transport
│   │   ├── Category Chip 3: Shopping
│   │   ├── Category Chip 4: Health
│   │   ├── Category Chip 5: Entertainment
│   │   ├── Category Chip 6: Bills
│   │   ├── Category Chip 7: Education
│   │   ├── Category Chip 8: Personal Care
│   │   └── ... more categories
│   │
│   └── Actions
│       ├── Cancel (tertiary)
│       └── Next (primary, enabled if category selected)
│
├── Step 2: Budget Amount
│   ├── Title: "Berapa anggaran untuk Food & Dining?"
│   ├── Subtitle: "Per bulan"
│   │
│   ├── Amount Input
│   │   ├── Component: Input/amount (lg)
│   │   ├── Size: lg (52px height, large for focus)
│   │   ├── Placeholder: "0"
│   │   ├── Currency prefix: "Rp "
│   │   ├── Font: typography/mono/amount (24px)
│   │   ├── Alignment: right
│   │   ├── Keyboard: number-pad
│   │   └── Validation: amount > 0
│   │
│   ├── Suggestions [optional]
│   │   ├── Text: "Saran berdasarkan data Anda:"
│   │   ├── Font: typography/caption (12px, secondary)
│   │   │
│   │   ├── Suggestion 1: "Rp 800,000 (rata-rata Anda)"
│   │   ├── Suggestion 2: "Rp 600,000 (lebih ketat)"
│   │   └── On tap: populate with suggestion
│   │
│   └── Actions
│       ├── Back (tertiary)
│       └── Next (primary, enabled if amount > 0)
│
└── Step 3: Period & Confirm
    ├── Title: "Konfirmasi Anggaran"
    │
    ├── Period Selector
    │   ├── Label: "Periode Anggaran"
    │   ├── Dropdown: "Bulanan" (selected)
    │   ├── Options: Bulanan, Mingguan, Tahunan
    │   └── Font: typography/body/base
    │
    ├── Notes Input [optional]
    │   ├── Label: "Catatan (Opsional)"
    │   ├── Placeholder: "Contoh: Termasuk snack dan lunch di kantor"
    │   ├── Type: Textarea
    │   └── Max: 200 chars
    │
    ├── Summary
    │   ├── Frame: "Summary"
    │   ├── Background: semantic/bg/secondary
    │   ├── Padding: [16, 16]
    │   ├── Radius: 12px
    │   │
    │   ├── Category: "Food & Dining"
    │   │   ├── Font: typography/body/base
    │   │   └── Color: semantic/text/primary
    │   │
    │   ├── Amount: "Rp 800,000"
    │   │   ├── Font: typography/mono/amount (24px)
    │   │   └── Color: semantic/text/primary
    │   │
    │   └── Period: "Per Bulan"
    │       ├── Font: typography/caption (12px)
    │       └── Color: semantic/text/secondary
    │
    └── Actions
        ├── Cancel (tertiary)
        └── Create Budget (primary)
            └── On tap: save budget, close modal, show confirmation toast
```

---

## PHASE 10: FINAL POLISH & PROTOTYPES (Week 6)

### Prototype Architecture

**Core User Flows** (create in Figma prototypes):

1. **Authentication Flow** (3 screens)
   - Login → Verification → Home
   - All transitions: 250ms fade

2. **Add Transaction Flow** (2 variants)
   - Home → Add Modal (manual or photo)
   - Modal transitions: 350ms slide-up
   - Confirmation: success toast

3. **Navigation Flow** (5 screens)
   - Home ↔ History ↔ Analytics ↔ Planning ↔ AI
   - All nav: 250ms fade + slide

4. **Detailed View Flow**
   - List → Detail Modal → Edit/Delete
   - Modal transitions: 250ms fade

5. **AI Chat Flow**
   - Suggested question → Message sent → Response streams
   - Message entrance: 200ms fade-in

### Quality Assurance Checklist

**Visual Consistency**
- [ ] All text uses defined text styles (no custom)
- [ ] All colors from semantic palette (no hex)
- [ ] All shadows from elevation styles (no custom)
- [ ] All spacing multiples of 4px (8px baseline)
- [ ] All radius from defined system (8px, 12px, 16px, full)
- [ ] All icons consistent size (24px primary, 32px secondary)

**Component Quality**
- [ ] All buttons are Button component (size, state variants)
- [ ] All inputs are Input component (size, state variants)
- [ ] All cards are Card component (size, state variants)
- [ ] All modals use BottomSheet component
- [ ] All lists use standard row component
- [ ] Zero detached instances (all component-based)

**Interaction Quality**
- [ ] All tappable elements have hover/active states
- [ ] All modals have backdrop (correct Z-index)
- [ ] All transitions 250-350ms (correct easing)
- [ ] All focus indicators visible (2px outline)
- [ ] All micro-interactions smooth (no jumps)
- [ ] All loading states animated (shimmer effect)

**Mobile Quality**
- [ ] All touch targets ≥44×44px
- [ ] All safe areas respected (top 44px, bottom 34px)
- [ ] All content scrollable without cutoff
- [ ] All modals dismiss-able (swipe, button, backdrop)
- [ ] All inputs keyboard-safe (float above keyboard)
- [ ] All gestures work (swipe, long-press, pull-refresh)

**Accessibility Quality**
- [ ] Color contrast ≥4.5:1 (WCAG AA)
- [ ] No color-alone information (icon + text + color)
- [ ] All form errors labeled (description + color)
- [ ] All focus order logical (left→right, top→bottom)
- [ ] All interactive elements keyboard-accessible
- [ ] All text readable (≥14px for body, ≥12px for caption)

**Fintech Quality**
- [ ] All amounts displayed with currency (Rp)
- [ ] All amounts use DM Mono font
- [ ] All sensitive data masked (card numbers, phone)
- [ ] All transactions reversible (with confirmation)
- [ ] All critical actions protected (delete, logout)
- [ ] All errors explain reason (not generic "error")

---

## DELIVERABLES SUMMARY

**Total Screens:** 18+ screens  
**Total Components:** 50+ component variants  
**Total Frames:** 150+ design frames  
**Total Prototype Flows:** 5 core user flows  

**Complete Coverage:**
✅ Authentication (3 screens)  
✅ Dashboard (1 screen)  
✅ Transactions (3 screens: history, add, detail)  
✅ Analytics (2 screens: spending, trends)  
✅ Settings (3 screens: settings, profile, wallet)  
✅ AI Assistant (1 screen + chat flow)  
✅ Onboarding (4 screens)  
✅ Planning (2 screens: goals, budgets)  
✅ Empty/loading/error states (all screens)  

**Ready for:**
- Immediate Figma implementation
- Engineering handoff (complete specifications)
- User testing (prototype flows)
- Developer translation (token/component mapping)

---

## IMPLEMENTATION TIMELINE

**Phase 5 (Week 1-2):** Tokens + Components (20 hours)  
**Phase 6 (Week 2-3):** Dashboard + Transaction Screens (24 hours)  
**Phase 7 (Week 4):** Settings + Account (16 hours)  
**Phase 8 (Week 4-5):** AI + Onboarding (20 hours)  
**Phase 9 (Week 5):** Planning Tools (12 hours)  
**Phase 10 (Week 6):** Polish + Prototypes (16 hours)  

**Total:** ~110-120 hours (2 designers, 6 weeks)

---

**ALL PHASES 7-10 SPECIFICATIONS COMPLETE**

Ready for Phase 5 Figma build immediately. All 18+ screens fully architected.