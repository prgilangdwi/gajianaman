# Changelog

## 2026-07-05

### Added: Today's Transactions Dashboard

- Summary cards showing Pemasukan (income), Pengeluaran (expense), and Net
- Transaction list with category icons, notes, amounts, and timestamps
- Color-coded: green for income, red for expense

#### Files Changed
- `src/routes/dashboard/+page.server.ts` — Fetches today's transactions with category join, calculates totals
- `src/routes/dashboard/+page.svelte` — Renders summary cards and transaction list

### Added: Supabase Type Generation

- Auto-generate TypeScript types from database schema
- Run `bun run db:types` after migrations to sync types

#### Files Changed
- `src/lib/database.types.ts` — Generated types
- `src/lib/supabase.ts` — Re-exports Row/Insert/Update types
- `package.json` — Added `db:types` script

### Added: Cloudflare Pages Deployment

- Switched from Vercel to Cloudflare Pages adapter
- PWA disabled in dev mode to prevent caching issues
- Added `useSecureCookies` toggle for HTTP localhost dev

#### Files Changed
- `svelte.config.js` — Cloudflare adapter
- `wrangler.toml` — Cloudflare config
- `src/auth.ts` — Dynamic secure cookies based on protocol
- `src/app.d.ts` — Platform env types for Cloudflare
- `vite.config.ts` — PWA dev mode disabled

### Fixed: Currency Display

- Database stores amounts in smallest unit (sen), display divides by 100

---

## 2026-07-05 (earlier)

### Fixed: Hydration Mismatch Errors

**Problem:** Console showed `hydration_mismatch` errors. Forms appeared briefly then disappeared.

**Root Cause:** Using `$effect()` for auth redirects runs only on the client *after* hydration. The server rendered one state (e.g., form visible), but the client tried to redirect before mounting, causing a mismatch.

**Solution:** Moved auth checks to server-side using SvelteKit's `redirect()` function.

#### Files Changed

1. **`src/routes/link-telegram/+page.server.ts`** (created)
   - Added server-side redirect for unauthenticated users
   ```ts
   if (!session) {
     redirect(302, '/login');
   }
   ```

2. **`src/routes/link-telegram/+page.svelte`** (updated)
   - Removed `$effect` client-side redirect
   - Removed unused imports (`page`, `untrack`, `data` prop)

3. **`src/routes/login/+page.server.ts`** (created)
   - Added server-side redirect for authenticated users
   ```ts
   if (session) {
     redirect(302, '/dashboard');
   }
   ```

4. **`src/routes/login/+page.svelte`** (updated)
   - Removed `{#if session}` conditional block
   - Logged-in users now redirect before page renders

### Key Lesson

In SvelteKit, always handle auth redirects in `+page.server.ts` or `+layout.server.ts` using `redirect()`, not in `$effect()` hooks. Server-side redirects prevent hydration mismatches because the redirect happens before any HTML is sent.
