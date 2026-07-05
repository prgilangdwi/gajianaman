# Changelog

## 2026-07-05

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
