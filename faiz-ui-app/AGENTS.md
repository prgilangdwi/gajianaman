- Always use skill `shadcn` when building or designing ui & components.
- Always use skill `lobe-icons` when needs a brand or app logo / icon, before create a custom SVG.
- When adding or significantly changing a component/block under `src/components/` (including `ui/`), update the UI kit at `/ui-kit`:
  1. Add entry to `src/components/ui-kit/catalog.ts`
  2. Add a demo in the matching `src/components/ui-kit/sections/*.tsx` file using `UiKitSection`
  3. Import the real component from `@/components/...` — never duplicate component code in UI kit
  4. Follow shadcn composition rules for demos (Dialog needs Title, Avatar needs Fallback, etc.).
- Do not add routes/pages to the UI kit unless they are reusable layout blocks in `src/components/`.
- In app blocks under `src/components/` (excluding `ui/`), prefer semantic typography utilities from `src/styles.css` (`text-display`, `text-title`, `text-subtitle`, `text-lead`, `text-body`, `text-label`, `text-caption`, `text-mono`) over composing raw `text-*`, `font-heading`, and `tracking-*` classes.

