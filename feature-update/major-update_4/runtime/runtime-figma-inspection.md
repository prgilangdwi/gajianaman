# FIGMA MCP OPERATING SYSTEM
> DESIGN SYSTEM EXTRACTION & VALIDATION RULES

## 1. DESIGN EXTRACTION PROMPTS
When utilizing Figma MCP, use the following standardized prompts for deterministic extraction:

**Spacing Extraction:**
"Extract all layout padding, margins, and gaps from Frame [ID]. Output as Tailwind utility classes mapping to an 8px grid."

**Typography Extraction:**
"Extract font family, font weight, font size, and line height from Text Node [ID]. Map to CSS variables defined in Phase 02."

**Interaction Extraction:**
"Identify all interaction states (Hover, Active, Disabled) for Component [ID]. Detail the exact shadow, opacity, and background color shifts."

**Motion/Animation Extraction:**
"Identify the transition curve and duration applied to Frame [ID]'s prototype connections."

## 2. NAVIGATION & COMPONENT INSPECTION
- When building `BottomNavigation` (Phase 03), extract the exact active/inactive icon states and touch target dimensions.
- When building Primitives (Phase 02), inspect the Figma Component Variants to ensure all props (size, state, intent) are accounted for.

## 3. RESPONSIVE INSPECTION
- Always inspect the desktop (1440px), tablet (768px), and mobile (375px) frames.
- Note how padding scales down and how grid columns collapse.

## 4. DESIGN DRIFT DETECTION
- Before committing UI code, cross-reference the implemented DOM structure (via mental model) against the Figma layers.
- Ensure no arbitrary margins (e.g., `mt-7`) are used. Stick to `mt-8` or `mt-6` (8px scale).
