# Gajian Aman — Full Frontend Fix Prompt for Claude Code

Apply all the fixes below to the React frontend (`frontend/src/`). Do not change any backend Python code, DB schema, or environment variables. Only modify frontend files.

---

## FIX 1 — Sidebar Navigation: Grouping, Scrollability, Secondary Items

### 1A. Group sidebar nav into labeled sections

In `frontend/src/app/components/Layout.tsx`, restructure all nav links into the following groups:

**Group: [unlabeled top]**
- Overview

**Group: KEUANGAN**
- Pengeluaran
- Budget
- Goals ← merge Goal Progress into this page (see Fix 7)
- Riwayat

**Group: ANALITIK**
- Laporan ← merge Report Bulanan into this page (see Fix 8)
- Pola Waktu
- Prakiraan
- Tren

**Group: ALAT**
- Kategori
- Gajian
- Dompet
- Kalender
- Asisten ← simplified (see Fix 9)

**Group: LAINNYA** (visually de-emphasized — separated by a divider, smaller muted text)
- Berulang
- Langganan
- Profil

Render group labels as:
```tsx
<p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mt-5 mb-1">
  KEUANGAN
</p>
```

Add `<hr className="border-border my-2 mx-3" />` before the LAINNYA group.

Nav items in the LAINNYA group should use `text-xs text-muted-foreground` and no left-border active accent — only a subtle bg highlight on active state.

### 1B. Make sidebar nav area scrollable, with sticky header and footer

Apply these structural changes to the sidebar:

- Sidebar root: `flex flex-col h-screen overflow-hidden`
- Logo + user info block at top: non-scrolling, `shrink-0`
- Nav list area: `flex-1 overflow-y-auto overflow-x-hidden`
- Custom scrollbar styling (add to `index.css` or inline):
```css
.sidebar-nav::-webkit-scrollbar { width: 4px; }
.sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
```
- Logout button at bottom: `shrink-0 mt-auto border-t border-border pt-3 pb-4`

---

## FIX 2 — FAB (+ Button) Position

Fix the floating action button (green + button):

```tsx
className="fixed bottom-6 z-50 right-6 max-sm:right-auto max-sm:left-1/2 max-sm:-translate-x-1/2"
```

- Desktop: `bottom-6 right-6` (bottom right corner)
- Mobile (below `sm` breakpoint): centered horizontally

---

## FIX 3 — Tambah Transaksi Modal: Restructure into Transaction Types with Sub-tabs

Refactor `frontend/src/app/components/TransactionModal.tsx` completely.

### Top-level tabs: Transaction Type

Replace current tabs with 4 transaction type tabs at the top. Each tab has an icon:

| Tab | Icon | Label |
|---|---|---|
| Pengeluaran | `TrendingDown` (red) | Pengeluaran |
| Pemasukan | `TrendingUp` (green) | Pemasukan |
| Tabung | `PiggyBank` | Tabung |
| Transfer | `ArrowLeftRight` | Transfer |

Use icons from `lucide-react`. Style active tab with a bottom border or filled pill in the matching color.

### Inside Pengeluaran and Pemasukan tabs: Input Method sub-tabs

Show 3 sub-tabs for input method:

| Sub-tab | Icon | Label |
|---|---|---|
| AI | `Sparkles` or `Zap` | AI |
| Foto | `Camera` | Foto |
| Manual | `PenLine` | Manual |

**AI sub-tab:**
- Textarea: placeholder `contoh: beli kopi 25rb tadi pagi`
- Button: "Mengunyah dengan AI" with `Sparkles` icon (keep existing behavior)

**Foto sub-tab:**
- File upload input for receipt/screenshot image
- Preview thumbnail when image selected
- Button: "Parsing dengan AI" — calls `/api/parse-image.js`
- Show parsed result as pre-filled form fields for user to confirm

**Manual sub-tab:**
- Form fields: Amount (Rp), Category (dropdown), Note (text), Date (date picker)
- Submit button: "Simpan Transaksi"

**Tabung tab:**
- Fields: Jumlah (amount), Tujuan/Goal (dropdown from existing goals), Tanggal
- No AI or photo sub-tabs

**Transfer tab:**
- Fields: Dari Dompet (from wallet dropdown), Ke Dompet (to wallet), Jumlah, Tanggal, Catatan
- No AI or photo sub-tabs

---

## FIX 4 — Pengeluaran Page: Fix Blank White Screen (Runtime Error)

Open `frontend/src/app/pages/Pengeluaran.tsx`. Likely causes of blank screen:

1. Check all imported hooks — if any hook (e.g. `useTransactions`) throws an error or returns undefined, the component crashes silently. Wrap data access with safe defaults:
```tsx
const { transactions = [], loading, error } = useTransactions();
```

2. Check any `.map()` call — ensure the array is defined before mapping:
```tsx
{(transactions ?? []).map(...)}
```

3. Add a top-level error boundary or try/catch in the component. At minimum, add this guard at the top of the component:
```tsx
if (error) return <div className="p-6 text-destructive">Gagal memuat data: {error.message}</div>;
if (loading) return <div className="p-6 text-muted-foreground">Memuat...</div>;
```

4. Check if any Recharts chart component receives `undefined` or `null` data — wrap with:
```tsx
{data && data.length > 0 ? <YourChart data={data} /> : <EmptyState />}
```

5. If `Pengeluaran.tsx` imports from a file that doesn't exist yet (e.g. a new hook or component), create a stub or remove the import.

Fix all crash points found. Do not change the page's visual design — just make it not crash.

---

## FIX 5 — Prakiraan Page: Clearer Table + Working Chart

Redesign `frontend/src/app/pages/Prakiraan.tsx` (or create it if missing).

### Current problems:
- Table shows "Rp0" for Prakiraan — unhelpful
- "Tren" column shows a broken chart icon with no data
- Information hierarchy is unclear

### Required fixes:

**A. Table redesign — clearer columns:**

Replace the current table layout with a card-per-category design:

```
┌─────────────────────────────────────────────────────────┐
│ 🍽 Food & Dining                          Low ▼ Tren: ↘ │
│                                                          │
│  Bulan Lalu        Rata-rata 3 Bln       Prakiraan Bln Ini│
│  Rp685.000         Rp612.000             Rp650.000        │
│                                                          │
│  [━━━━━━━━━━━━━━━━━━━░░░░░░░] 78% dari budget            │
└─────────────────────────────────────────────────────────┘
```

Each category card shows:
- Category name + icon (top left)
- Volatility badge: Low / Medium / High (top right) — derived from std deviation of last 3 months
- Trend direction arrow: ↑ ↓ → with color
- Three data points: Bulan Lalu | Rata-rata 3 Bulan | Prakiraan Bulan Ini
- A mini progress bar showing % of budget used (if budget exists for that category)

**B. Prakiraan calculation logic:**

If there is no existing forecast calculation, use this simple formula:
```ts
// Weighted average: last month 50%, 2 months ago 30%, 3 months ago 20%
const forecast = (lastMonth * 0.5) + (twoMonthsAgo * 0.3) + (threeMonthsAgo * 0.2);
```

Show `Rp0` only if there is literally zero transaction history. Otherwise always show a calculated forecast.

**C. Summary bar at top of page:**

Add a summary section above the cards:
```
Total Prakiraan Bulan Ini    Bulan Lalu    Selisih
Rp3.250.000                  Rp4.223.616   -23%  ↓
```

**D. Fix Tren mini chart:**

Replace broken chart icon with a real inline sparkline using Recharts `<LineChart>` or `<SparkLineChart>` — pass last 3 months of values as data. If Recharts doesn't have SparkLine, use a small `<LineChart width={80} height={30}>` with no axes, no tooltip, just the line.

---

## FIX 6 — Information Hierarchy per Page

Apply this reading-order principle to all pages: **most important info top-left → least important bottom-right.**

For each page, ensure:

**Overview:** Total balance (top-left hero) → Income vs Expense → Daily bar chart → Category breakdown (bottom)

**Pengeluaran:** Total this month (hero) → Category breakdown (ranked by spend) → Transaction list (bottom)

**Budget:** Budget health summary (hero: X of Y categories on track) → Per-category progress bars (sorted by % used, highest first) → Budget tips toggle (see Fix 9)

**Prakiraan:** Summary bar (hero) → Category cards sorted by forecast amount desc → Trend insights (bottom)

**Goals:** Active goals summary (hero: total saved / total target) → Goal cards sorted by deadline → Completed goals (collapsed section at bottom)

**Riwayat:** Filter bar (top) → Transaction list → Pagination (bottom)

**Laporan:** Month summary (hero) → Charts → Exportable breakdown table (bottom)

Do not redesign from scratch — adjust the ordering/prominence of existing components. Use `order-*` classes or reorder JSX if needed.

---

## FIX 7 — Merge Goal Progress into Goals Page

1. Delete the `Goal Progress` nav item from the sidebar entirely.
2. In `frontend/src/app/pages/Goals.tsx`, add a "Progress" section below the goal cards.
3. This section shows the same content as the former `GoalProgress.tsx` page — a chart or timeline view of savings progress per goal over time.
4. Make it a toggleable section with a chevron/accordion: `<button>Lihat Progres Detail ▼</button>` that expands inline.
5. Update the router in `App.tsx` — redirect `/goal-progress` to `/goals`.

---

## FIX 8 — Merge Laporan + Report Bulanan into One Page

1. Delete `Report Bulanan` nav item from sidebar.
2. In `frontend/src/app/pages/Laporan.tsx`, add a "Laporan Bulanan" section that includes what was previously in `ReportBulanan.tsx`.
3. Structure the merged page:
   - **Section 1:** Monthly summary (income, expense, net, savings rate)
   - **Section 2:** Category breakdown table + pie chart
   - **Section 3:** Weekly pattern heatmap (if it existed in Report Bulanan)
   - **Section 4:** Export button (PDF/CSV download)
4. Update `App.tsx` — redirect `/report-bulanan` to `/laporan`.

---

## FIX 9 — Simplify Asisten Page + Move Budget Tips to Budget Page

### Asisten Page Simplification

`frontend/src/app/pages/Asisten.tsx` — make it clearly useful:

Structure the page as:
1. **Hero:** "Tanya Asisten AI" — a text input where user can ask free-form questions about their finances (e.g. "kenapa pengeluaranku naik bulan ini?")
2. **Quick prompts:** 3–4 suggested question chips below the input (e.g. "Ringkasan bulan ini", "Kategori terboros", "Tips hemat bulan depan")
3. **Response area:** Chat-style response display below

This uses the existing Anthropic API integration. Keep the same API call logic — just make the UI clearer.

Remove generic placeholder text. If there's no message history, show: *"Tanyakan apa saja tentang keuanganmu."*

### Budget Page: Add AI Budget Tips Toggle

In `frontend/src/app/pages/Budget.tsx`, add a toggle button at the top right of the page:

```tsx
<button onClick={() => setShowTips(!showTips)}>
  <Sparkles size={14} /> Saran AI
</button>
```

When toggled on, show a collapsible panel below the budget summary with 3–5 AI-generated budget recommendations based on the user's current spending vs budget data. Call the Anthropic API with the budget data as context — prompt: *"Berikan 3-5 saran konkret dalam Bahasa Indonesia untuk membantu user mengoptimalkan anggaran mereka berdasarkan data ini: [budget_data]"*

---

## FIX 10 — Secondary Pages in Sidebar (Berulang, Langganan, Profil)

These pages remain accessible but are visually separated in the nav (handled in Fix 1). No page content changes needed for this fix — the grouping in the sidebar is sufficient.

However, ensure `Berulang.tsx` does not crash when there are 0 recurring transactions. The empty state message `"Perlu minimal 2 transaksi..."` is fine — just make sure it renders cleanly without errors.

---

## Summary of File Changes Expected

| File | Action |
|---|---|
| `components/Layout.tsx` | Sidebar grouping, scrollability, LAINNYA section |
| `components/TransactionModal.tsx` | Full restructure: type tabs + method sub-tabs |
| `pages/Pengeluaran.tsx` | Fix crash / blank screen |
| `pages/Prakiraan.tsx` | Redesign cards, fix Rp0, fix sparkline |
| `pages/Goals.tsx` | Merge Goal Progress section |
| `pages/Laporan.tsx` | Merge Report Bulanan content |
| `pages/Budget.tsx` | Add AI tips toggle |
| `pages/Asisten.tsx` | Simplify UI, clear structure |
| `pages/Berulang.tsx` | Ensure empty state doesn't crash |
| `App.tsx` | Remove Goal Progress + Report Bulanan routes, add redirects |

---

## Constraints

- Do not change any backend Python files
- Do not change `db/schema.sql` or `db/operations.py`
- Do not edit files inside `src/app/components/ui/` (shadcn — extend by wrapping only)
- All new types go in `lib/supabase.ts`
- All new data fetching goes in `hooks/` — never fetch Supabase directly in page components
- Currency always formatted via existing formatter — never format Rp inline
- All UI labels in Bahasa Indonesia (category names in DB stay English)
