# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SvelteKit 2 web dashboard for Gajian Aman (personal finance tracker). This is a frontend-only app that reads from the same Supabase database the Telegram bot writes to. Deployed to Cloudflare Pages.

## Commands

```bash
bun run dev          # Start dev server (port 5173)
bun run build        # Production build
bun run preview      # Preview production build locally
bun run preview:cf   # Preview with Cloudflare Workers runtime
bun run deploy       # Build and deploy to Cloudflare Pages
bun run check        # Type checking with svelte-check
bun run db:types     # Regenerate Supabase types from local DB (run after migrations)
```

## Tech Stack

- **SvelteKit 2** with Svelte 5 (runes syntax)
- **TypeScript 6** 
- **Auth.js** (`@auth/sveltekit`) with Google OAuth
- **Supabase** for database (client-side anon key + server-side service role)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **PWA** via `@vite-pwa/sveltekit`
- **Cloudflare Pages** with Workers runtime

## Architecture

### Auth Flow
1. `src/auth.ts` — Auth.js config with Google provider, uses `platform.env` for secrets
2. `src/hooks.server.ts` — Intercepts requests, runs auth handler
3. JWT callbacks in auth.ts enrich token with `dbUserId`, `telegramId`, `currency` from Supabase `users` table
4. `src/lib/supabase.server.ts` — `createAdminClient(serviceKey)` for user management

### Supabase Clients
- **Client-side** (`src/lib/supabase.ts`): Uses anon key, exports typed enums and re-exports generated types
- **Server-side** (`src/lib/supabase.server.ts`): `createAdminClient()` takes service key as param (for Cloudflare runtime env)

### Type Generation
- `src/lib/database.types.ts` — Auto-generated from Supabase schema via `bun run db:types`
- `src/lib/supabase.ts` — Re-exports Row/Insert/Update types for each table
- Run `bun run db:types` after Go migrations to sync types

### Routes
- `/` — Landing/home
- `/login` — Google OAuth login
- `/dashboard` — Main dashboard (protected)
- `/link-telegram` — Links Google account to Telegram user ID
- `/api/link-telegram` — API endpoint for linking

### Cloudflare Environment Variables
Set via Cloudflare dashboard or `wrangler secret put <NAME>`:
- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Auth.js
- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — Supabase (public, can be in wrangler.toml vars)
- `SUPABASE_SERVICE_KEY` — Server-side only (must be a secret)

Access in server code via `platform.env.VAR_NAME` (typed in `src/app.d.ts`).

## Conventions

- DB types are generated in `src/lib/database.types.ts` — regenerate with `bun run db:types` after migrations
- Server-side secrets accessed via `platform.env` (Cloudflare runtime), not `$env/static/private`
- Session user extended with `telegramId` and `currency` via `src/app.d.ts`
- The `$lib` alias resolves to `src/lib/`
