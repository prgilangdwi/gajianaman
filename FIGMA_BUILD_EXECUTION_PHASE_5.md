# Gajian Aman — Figma Build Execution Phase 5

## PHASE 5: CONTROLLED FIGMA EXECUTION — FOUNDATIONS

**Timeline:** Week 1-2 (9 working days)  
**Output:** Token library + 10 core components (variants ready, not screens)  
**Team:** 1 Design Systems Engineer (primary) + 1 Senior Product Designer (review)

---

## PART 1: FIGMA FILE SETUP & TOKEN ARCHITECTURE

### 0.1 Create Master File

**Action: Create new Figma file**
```
File Name: "Gajian Aman Design System v2.0"
Type: Design file
Team: [Your workspace]
Sharing: Edit access to design team + engineer team
```

**Initial Pages** (create these pages in order):
```
├── 📋 README
├── 🎨 Design Tokens
├── 🔧 Component Library
├── 🎬 Screens [EMPTY for now]
├── 🔄 Prototypes [EMPTY for now]
└── 📊 Design Documentation
```

**Delete default "Page 1"** (Figma creates it, not needed)

---

## PART 2: DESIGN TOKENS — COLOR SYSTEM

### 1.1 Semantic Color Palette (Create on "Design Tokens" page)

**Step 1: Create frame for color tokens**
```
Frame Name: "01 Color System"
Dimensions: 1200 × 900px
Background: neutral-100 (#F3F4F6)
```

**Step 2: Create color rows (visual reference)**

For each semantic color family (Primary, Success, Warning, Danger, Neutral), create a 9-tone swatch row:

```
Row 1: Primary (Sky)
├── Color Swatch 50 [#F0F9FF] | Label "50"
├── Color Swatch 100 [#E0F2FE] | Label "100"
├── Color Swatch 500 [#0EA5E9] | Label "500"
├── Color Swatch 600 [#0284C7] | Label "600" [MAIN]
└── Color Swatch 900 [#0C2D57] | Label "900"
```

**Step 3: Create color styles in Figma**

In Figma Assets panel:
1. Click "+" next to Colors
2. Create color style for each tone:

```
Name convention: semantic/[family]/[tone]

Examples:
semantic/primary/50
semantic/primary/100
semantic/primary/500
semantic/primary/600 ← PRIMARY (main semantic)
semantic/primary/900
semantic/success/500
semantic/success/600 ← STATUS (main)
semantic/warning/600 ← STATUS (main)
semantic/danger/600 ← STATUS (main)
semantic/neutral/0 (white)
semantic/neutral/50
semantic/neutral/100
semantic/neutral/200
...
semantic/neutral/900
```

**IMPORTANT: Naming structure**
- Do NOT use: "Blue 600" or "Sky-600"
- DO use: "semantic/primary/600" (enables token export to code)
- Do NOT flatten: "primary-600"
- DO nest: "semantic > primary > 600"

**Step 4: Apply colors to swatches**

For each color swatch rectangle:
1. Select rectangle
2. Open Design panel (right sidebar)
3. Fill → click color → "Color styles" tab
4. Click matching color style (e.g., semantic/primary/600)
5. Name the swatch: "Primary 600" (label text)

**Result:** Visual reference + style library (both synchronized)

---

### 1.2 Semantic Color Tokens (Token reference page)

Create second frame on same page:

```
Frame Name: "02 Semantic Color Usage"
Dimensions: 1200 × 600px
Background: white
Grid: 8px
```

**Create reference cards** (one per semantic color):

```
Card 1: "Primary Colors"
├── Color: primary-600
├── Usage: "Main CTAs, highlights, active states"
├── Contrast: "7:1 on white, 3:1 on light bg"
└── RGB: "(2, 132, 199)"

Card 2: "Success Status"
├── Color: success-600 (#22C55E)
├── Usage: "Positive actions, complete states"
├── Contrast: "4.5:1 minimum"
└── RGB: "(34, 197, 94)"

... [repeat for warning, danger, neutral]
```

**NOTE:** These are reference cards, NOT design tokens. Tokens live in Figma color styles (step 3).

---

## PART 3: TYPOGRAPHY STYLES

### 2.1 Install fonts

**Action: In Figma, add fonts**
1. Assets panel → Fonts → "+" 
2. Search "Inter" → Add
3. Search "DM Mono" → Add
4. Both fonts now available in Figma

**Verify installation:**
- Select any text
- Typography panel → Font dropdown
- Should show "Inter" and "DM Mono" available

---

### 2.2 Create text styles (Typography page)

Create new frame:
```
Frame Name: "Typography Styles"
Dimensions: 1200 × 1400px
Background: white
Grid: 8px
```

**Step 1: Create heading styles**

For each heading level, create a text style:

**Heading 1**
```
Frame: "Heading 1"
├── Text: "The quick brown fox jumps over the lazy dog"
├── Font: Inter, Bold (700)
├── Size: 48px
├── Line Height: 1.2 (57.6px)
└── Letter Spacing: 0px

Right panel → Text styles → "+" → "Create text style"
Name: "typography/heading/1"
Description: "Page titles, hero headings"
```

**Heading 2**
```
Name: "typography/heading/2"
Font: Inter, Bold (700)
Size: 36px
Line Height: 1.2 (43.2px)
```

**Heading 3**
```
Name: "typography/heading/3"
Font: Inter, Semibold (600)
Size: 30px
Line Height: 1.2 (36px)
```

**Body-Large**
```
Name: "typography/body/large"
Font: Inter, Regular (400)
Size: 18px
Line Height: 1.5 (27px)
```

**Body-Base** [DEFAULT]
```
Name: "typography/body/base"
Font: Inter, Regular (400)
Size: 16px
Line Height: 1.5 (24px)
```

**Body-Small**
```
Name: "typography/body/small"
Font: Inter, Regular (400)
Size: 14px
Line Height: 1.5 (21px)
```

**Label** (form labels, small headings)
```
Name: "typography/label"
Font: Inter, Semibold (600)
Size: 14px
Line Height: 1.2 (16.8px)
```

**Caption**
```
Name: "typography/caption"
Font: Inter, Regular (400)
Size: 12px
Line Height: 1.2 (14.4px)
```

**Mono-Amount** (financial numbers)
```
Name: "typography/mono/amount"
Font: DM Mono, Semibold (600)
Size: 20px
Line Height: 1.5 (30px)
Letter Spacing: 0px
Description: "All currency amounts, balances, large numbers"
```

**Mono-Small** (code, captions in monospace)
```
Name: "typography/mono/small"
Font: DM Mono, Regular (400)
Size: 12px
Line Height: 1.2 (14.4px)
```

---

### 2.3 Verify text styles are nested

In Assets panel → Typography:
```
✅ Should show hierarchical structure:
┌─ typography
  ├─ heading
  │  ├─ 1
  │  ├─ 2
  │  └─ 3
  ├─ body
  │  ├─ large
  │  ├─ base
  │  └─ small
  ├─ label
  ├─ caption
  └─ mono
     ├─ amount
     └─ small
```

**If flat:** Delete and recreate with "/" separators in names.

---

## PART 4: COLOR STYLES (APPLIED SEMANTICS)

### 3.1 Background colors (semantic)

Create new frame:
```
Frame Name: "03 Applied Colors"
Dimensions: 1200 × 400px
Background: white
```

Create color styles for semantic usage:

**bg-default** [white background]
```
Name: "semantic/bg/default"
Color: #FFFFFF (or use color style semantic/neutral/0)
Description: "Primary background, card backgrounds"
```

**bg-secondary** [light gray]
```
Name: "semantic/bg/secondary"
Color: #F9FAFB (semantic/neutral/50)
Description: "Section backgrounds, alternate rows"
```

**bg-tertiary** [medium gray]
```
Name: "semantic/bg/tertiary"
Color: #F3F4F6 (semantic/neutral/100)
Description: "Disabled backgrounds, secondary containers"
```

**text-primary** [dark text]
```
Name: "semantic/text/primary"
Color: #111827 (semantic/neutral/900)
Description: "Main text, headings"
```

**text-secondary** [medium gray text]
```
Name: "semantic/text/secondary"
Color: #4B5563 (semantic/neutral/600)
Description: "Helper text, labels, secondary information"
```

**text-tertiary** [light gray text]
```
Name: "semantic/text/tertiary"
Color: #6B7280 (semantic/neutral/500)
Description: "Captions, disabled text"
```

**text-inverse** [white text]
```
Name: "semantic/text/inverse"
Color: #FFFFFF
Description: "Text on dark backgrounds"
```

---

## PART 5: ELEVATION SYSTEM (Shadows)

### 4.1 Create shadow styles

Create new frame:
```
Frame Name: "04 Elevation & Shadows"
Dimensions: 1200 × 600px
Background: semantic/bg/secondary
Grid: 8px
```

**For each shadow level, create a card demo + shadow style:**

**Shadow-None**
```
Frame: "shadow-none"
├── Rectangle [200×100, white, no shadow]
└── Label: "No shadow (base layer)"

Shadow Style:
Name: "elevation/shadow/none"
Shadow: None
Description: "Base layer, no elevation"
```

**Shadow-SM**
```
Frame: "shadow-sm"
├── Rectangle [200×100, white]
└── Label: "sm"

Shadow Style:
Name: "elevation/shadow/sm"
Shadow: X:0, Y:1, Blur:2, Spread:0, Color:rgba(0,0,0,0.05)
Description: "Subtle edges, form inputs"
```

**Shadow-Base** [DEFAULT]
```
Frame: "shadow-base"
├── Rectangle [200×100, white]
└── Label: "base"

Shadow Style:
Name: "elevation/shadow/base"
Shadows (multiple):
  1. X:0, Y:1, Blur:3, Spread:0, Color:rgba(0,0,0,0.1)
  2. X:0, Y:1, Blur:2, Spread:0, Color:rgba(0,0,0,0.06)
Description: "Default card elevation"
```

**Shadow-MD**
```
Name: "elevation/shadow/md"
Shadows (multiple):
  1. X:0, Y:4, Blur:6, Spread:-1, Color:rgba(0,0,0,0.1)
  2. X:0, Y:2, Blur:4, Spread:-1, Color:rgba(0,0,0,0.06)
Description: "Elevated cards, popovers"
```

**Shadow-LG**
```
Name: "elevation/shadow/lg"
Shadows (multiple):
  1. X:0, Y:10, Blur:15, Spread:-3, Color:rgba(0,0,0,0.1)
  2. X:0, Y:4, Blur:6, Spread:-2, Color:rgba(0,0,0,0.05)
Description: "Dropdowns, modals"
```

**Shadow-XL**
```
Name: "elevation/shadow/xl"
Shadows (multiple):
  1. X:0, Y:20, Blur:25, Spread:-5, Color:rgba(0,0,0,0.1)
  2. X:0, Y:10, Blur:10, Spread:-5, Color:rgba(0,0,0,0.04)
Description: "Floating actions, high emphasis"
```

**Shadow-2XL**
```
Name: "elevation/shadow/2xl"
Shadows (multiple):
  1. X:0, Y:25, Blur:50, Spread:-12, Color:rgba(0,0,0,0.25)
Description: "Maximum emphasis, overlay modals"
```

**Result:** 7 shadow styles in Assets → Shadow styles

---

## PART 6: RADIUS SYSTEM

### 5.1 Create radius reference (no styles needed, tokens only)

Create new frame:
```
Frame Name: "05 Border Radius"
Dimensions: 1200 × 400px
Background: white
```

**Create 5 radius reference cards:**

```
Card 1: radius-none
├── Rectangle [80×80, primary-600, radius:0]
└── Label: "0px (none)" + usage

Card 2: radius-sm
├── Rectangle [80×80, primary-600, radius:4]
└── Label: "4px (sm)" + usage

Card 3: radius-base [MOST COMMON]
├── Rectangle [80×80, primary-600, radius:8]
└── Label: "8px (base - DEFAULT)" + usage

Card 4: radius-md
├── Rectangle [80×80, primary-600, radius:12]
└── Label: "12px (md - cards)" + usage

Card 5: radius-lg
├── Rectangle [80×80, primary-600, radius:16]
└── Label: "16px (lg - modals)" + usage

Card 6: radius-full
├── Circle [80×80, primary-600, radius:9999]
└── Label: "9999px (full - avatars)" + usage
```

**NOTE:** Figma doesn't have "radius styles" like color/text styles. Radius is applied per shape. Will be automated in Tailwind config.

---

## PART 7: SPACING SYSTEM (Reference only)

Create new frame:
```
Frame Name: "06 Spacing System"
Dimensions: 1200 × 600px
Background: white
```

**Create visual spacing reference:**

```
Row 1: "2xs = 4px"
├── Square [4×4, primary-600]
└── Usage: "Micro adjustments"

Row 2: "xs = 8px"
├── Square [8×8, primary-600]
└── Usage: "BASELINE - internal component padding"

Row 3: "sm = 12px"
├── Square [12×12, primary-600]
└── Usage: "Internal spacing, tight sections"

Row 4: "md = 16px"
├── Square [16×16, primary-600]
└── Usage: "DEFAULT - standard padding"

Row 5: "lg = 24px"
├── Square [24×24, primary-600]
└── Usage: "Section spacing, breathing"

Row 6: "xl = 32px"
├── Square [32×32, primary-600]
└── Usage: "Major section spacing"

Row 7: "2xl = 40px"
├── Square [40×40, primary-600]
└── Usage: "Full page sections"

Row 8: "3xl = 56px"
├── Square [56×56, primary-600]
└── Usage: "Hero section spacing (rare)"

Row 9: "4xl = 80px"
├── Square [80×80, primary-600]
└── Usage: "Full-screen sections (very rare)"
```

**NOTE:** These are reference visuals only. Spacing is implemented via auto-layout in components.

---

## PART 8: MOTION TOKENS (Reference)

Create new frame:
```
Frame Name: "07 Motion & Timing"
Dimensions: 1200 × 300px
Background: white
```

**Create reference cards:**

```
Card 1: Easing - ease-out
├── Label: "cubic-bezier(0, 0, 0.2, 1)"
└── Usage: "Standard exits, default transitions"

Card 2: Easing - ease-in-out
├── Label: "cubic-bezier(0.4, 0, 0.2, 1)"
└── Usage: "General UI transitions"

Card 3: Duration - fast
├── Label: "150ms"
└── Usage: "Hovers, focus states"

Card 4: Duration - base
├── Label: "250ms"
└── Usage: "DEFAULT - standard transitions"

Card 5: Duration - slow
├── Label: "350ms"
└── Usage: "Modal entrances, major reveals"

Card 6: Duration - slowest
├── Label: "500ms"
└── Usage: "Page transitions, celebrations"
```

**NOTE:** Motion is implemented in code (CSS transitions, Framer Motion). Figma prototypes reference these timings.

---

## PART 9: BUTTON COMPONENT SYSTEM

### 8.1 Create Button master component

Create new page:
```
Page Name: "🔧 Component Library"

Then create frame:
Frame Name: "01 Button - Primary"
Dimensions: 800 × 600px
Background: white
Grid: 8px
```

**Step 1: Create default button size (md)**

```
Frame Name: "Button / Primary / md / default"
Dimensions: 176 × 44px
Background: primary-600 (use color style)
Radius: 8px (type manually, no style)
Shadow: elevation/shadow/base (use shadow style)
Padding: [12px vertical, 20px horizontal] - set in auto-layout

Auto-Layout Settings:
├── Direction: Horizontal
├── Spacing: 8px (gap between icon + label)
├── Alignment: Center (horizontal) + Center (vertical)
├── Padding: 12, 20, 12, 20 (top, right, bottom, left)
├── Fill: 100%
└── Resize: Hug contents (width), Fixed (height)
```

**Step 2: Add label text (child)**

```
Text Element: "Label"
├── Text: "Save" (default label)
├── Font: typography/body/base [16px, 400]
├── Color: semantic/text/inverse (white)
├── Overflow: Truncate
└── Auto-layout: Not applied (text element)
```

**Step 3: Add optional icon (child)**

```
Rectangle Element: "Icon"
├── Dimensions: 24 × 24px
├── Fill: semantic/text/inverse (white)
├── Radius: 0 (no radius for icons)
└── Auto-layout child: Yes (respects gap)
```

**Step 4: Make it a component**

```
Right-click frame → "Create component"
Component name: "Button"

Asset panel should show:
┌─ Button
  └─ [component icon] ← This is the master component
```

---

### 8.2 Create button variants (size matrix)

**Create size variants:**

Duplicate the primary/md/default frame 4 times:

```
Variant 1: Primary / xs / default
├── Dimensions: 152 × 32px
├── Padding: [4px, 12px]
├── Font size: 12px (caption)
├── Icon: 16px

Variant 2: Primary / sm / default
├── Dimensions: 160 × 36px
├── Padding: [8px, 16px]
├── Font size: 14px (body-sm)
├── Icon: 20px

Variant 3: Primary / md / default [MASTER - already done]
├── Dimensions: 176 × 44px
├── Padding: [12px, 20px]
├── Font size: 16px (body-base)
├── Icon: 24px

Variant 4: Primary / lg / default
├── Dimensions: 200 × 52px
├── Padding: [16px, 24px]
├── Font size: 16px (body-base)
├── Icon: 32px

Variant 5: Primary / xl / default
├── Dimensions: 224 × 56px
├── Padding: [20px, 32px]
├── Font size: 18px (body-lg)
├── Icon: 32px
```

**Step 1: Right-click master component (Button)**
```
"Create component set"
```

**Step 2: In component set, add size variant axis**
```
Button component set opens

Left panel → "+" → Add property "size"
Values: xs, sm, md (default), lg, xl
```

**Step 3: Assign frames to variants**

For each size frame:
```
Right-click frame → Edit in component set
Main component should show variant assignment:

Name: Button / sm
├── size: sm
├── state: default
└── icon: with
```

---

### 8.3 Create state variants (hover, active, disabled)

**Duplicate size=md across states:**

```
Variant: Primary / md / hover
├── Background: primary-700 (slightly darker)
├── Shadow: elevation/shadow/md (elevated)

Variant: Primary / md / active
├── Background: primary-800 (darkest)
├── Shadow: elevation/shadow/sm (reduced)
├── Scale: 0.98 (pressed effect) [in prototype, not design]

Variant: Primary / md / disabled
├── Background: primary-600 (same as default)
├── Opacity: 50%
├── Cursor: not-allowed (note in docs)

Variant: Primary / md / focus
├── Background: primary-600
├── Outline: 2px primary-600
├── Outline offset: 2px
```

**In component set, add state property:**
```
"+" → Add property "state"
Values: default, hover, active, disabled, focus
```

---

### 8.4 Create style variants (secondary, tertiary, danger)

**For Secondary style:**

```
Variant: Secondary / md / default
├── Background: semantic/bg/secondary (light gray #F3F4F6)
├── Border: 1px semantic/neutral/200
├── Text color: semantic/text/primary (dark)
├── Shadow: elevation/shadow/sm

Variant: Secondary / md / hover
├── Background: semantic/neutral/100
├── Border: 1px semantic/neutral/300
├── Shadow: elevation/shadow/base

Variant: Secondary / md / disabled
├── Background: semantic/bg/secondary
├── Opacity: 50%
```

**For Tertiary style (outline only):**

```
Variant: Tertiary / md / default
├── Background: transparent
├── Border: 1px primary-600
├── Text color: primary-600
├── Shadow: none

Variant: Tertiary / md / hover
├── Background: primary-50 (very light blue)
├── Border: 1px primary-700
├── Text color: primary-700
```

**For Danger style (destructive):**

```
Variant: Danger / md / default
├── Background: danger-600 (red)
├── Text color: semantic/text/inverse (white)
├── Shadow: elevation/shadow/base

Variant: Danger / md / hover
├── Background: danger-700
├── Shadow: elevation/shadow/md
```

**In component set, add style property:**
```
"+" → Add property "style"
Values: primary (default), secondary, tertiary, danger
```

---

### 8.5 Create icon variant (with/without)

**Icon-only button:**

```
Variant: Primary / md / default / icon=only
├── Dimensions: 44 × 44px
├── Padding: 10px (symmetric)
├── Label: hidden/deleted
├── Icon: 24px
├── Removed text element
└── Shape remains square
```

**Icon with label (already created):**

```
Variant: Primary / md / default / icon=with [DEFAULT]
├── Dimensions: 176 × 44px
├── Padding: [12px, 20px, 12px, 20px]
├── Contains: Icon + Label
```

**In component set, add icon property:**
```
"+" → Add property "icon"
Values: with (default), only
```

---

### 8.6 Complete Button component set

Final component set should have:
```
Button
├── size: xs, sm, md (default), lg, xl
├── style: primary (default), secondary, tertiary, danger
├── state: default (default), hover, active, disabled, focus
└── icon: with (default), only

Total variants: 5 sizes × 4 styles × 5 states × 2 icons = 200 variants
(Many won't be used, but matrix is complete)
```

**Testing:** In component set, use "Swap" to verify all combinations work.

---

### 8.7 CRITICAL: Never detach Button instances

```
❌ NEVER:
- Right-click instance → "Detach instance"
- Edit instance directly instead of master
- Duplicate variant and modify

✅ ALWAYS:
- Use "Swap component" to change variant
- Edit master component for changes
- Create new variant in component set if needed
```

---

## PART 10: INPUT COMPONENT SYSTEM

### 9.1 Create text input master component

Create frame:
```
Frame Name: "02 Input - Text"
Dimensions: 400 × 80px
Background: white
Grid: 8px
```

**Step 1: Create input field with label (md size)**

```
Group: "Form Input Pair"
├── Auto-layout: Vertical, 8px gap, padding 0

  Child 1: Label
  ├── Text: "Email"
  ├── Font: typography/label [14px, 600]
  ├── Color: semantic/text/primary
  └── Margin bottom: 4px

  Child 2: Input Container
  ├── Dimensions: auto width, 44px height
  ├── Background: semantic/bg/default (white)
  ├── Border: 1px semantic/neutral/200
  ├── Radius: 8px
  ├── Padding: [12px, 16px]
  ├── Shadow: elevation/shadow/sm
  ├── Auto-layout: Horizontal, 8px gap
  │
  │   Grandchild 1: Input Text
  │   ├── Type: Text
  │   ├── Placeholder: "you@example.com"
  │   ├── Font: typography/body/base [16px, 400]
  │   ├── Color: semantic/text/primary
  │   ├── Flex: 1 (fill width)
  │   └── Overflow: Hidden
  │
  │   Grandchild 2: Icon (optional, e.g., error)
  │   ├── Dimensions: 20×20
  │   ├── Fill: transparent (hidden by default)
  │   └── Shown in error variant
  └
  
  Child 3: Helper Text (optional)
  ├── Text: "Enter valid email"
  ├── Font: typography/caption [12px, 400]
  ├── Color: semantic/text/secondary
  └── Margin top: 4px
```

**Step 2: Make component**

```
Right-click group → "Create component"
Component name: "Input"
```

---

### 9.2 Create input variants (state)

**Duplicate input for each state:**

```
Variant: Input / default
├── Border: 1px semantic/neutral/200
├── Background: semantic/bg/default
├── Label color: semantic/text/primary
├── Cursor: text

Variant: Input / focus
├── Border: 2px primary-600 (thicker, primary color)
├── Background: semantic/bg/default
├── Shadow: 0 0 0 3px rgba(2, 132, 199, 0.1) [primary with opacity]
├── Label color: primary-600

Variant: Input / error
├── Border: 2px danger-600 (red border)
├── Background: rgba(239, 68, 68, 0.05) [light red tint]
├── Icon: visible, danger-600 (error icon)
├── Helper text: "Email format invalid"
├── Helper text color: danger-600

Variant: Input / disabled
├── Border: 1px semantic/neutral/200
├── Background: semantic/bg/secondary (disabled tint)
├── Label color: semantic/text/tertiary
├── Input color: semantic/text/tertiary
├── Opacity: 50%
├── Cursor: not-allowed
```

**Add state property to component set:**
```
"+" → Add property "state"
Values: default, focus, error, disabled
```

---

### 9.3 Create input size variants

```
Variant: Input / sm
├── Height: 36px (vs 44px default)
├── Padding: [8px, 12px]
├── Font: typography/body/sm [14px]

Variant: Input / md [DEFAULT]
├── Height: 44px
├── Padding: [12px, 16px]
├── Font: typography/body/base [16px]

Variant: Input / lg
├── Height: 52px
├── Padding: [16px, 20px]
├── Font: typography/body/lg [18px]
```

**Add size property:**
```
"+" → Add property "size"
Values: sm, md (default), lg
```

---

### 9.4 Create input type variants

```
Variant: Input / text [DEFAULT]
├── Placeholder: "Enter text..."
├── No icon by default

Variant: Input / email
├── Placeholder: "you@example.com"
├── Optional: email validation icon

Variant: Input / number
├── Placeholder: "0"
├── Alignment: right (for numbers)
├── Optional: +/- spinner (depends on design)

Variant: Input / amount
├── Prefix: "Rp " (currency symbol)
├── Placeholder: "0"
├── Font: DM Mono (mono-font for numbers)
├── Alignment: right
├── Helper: "Indonesian Rupiah"
```

**Add type property:**
```
"+" → Add property "type"
Values: text (default), email, number, amount
```

---

### 9.5 Complete Input component set

```
Input
├── size: sm, md (default), lg
├── state: default (default), focus, error, disabled
└── type: text (default), email, number, amount

Total variants: 3 sizes × 4 states × 4 types = 48 variants
```

---

## PART 11: CARD COMPONENT SYSTEM

### 10.1 Create card master component

Create frame:
```
Frame Name: "03 Card"
Dimensions: 400 × 300px
Background: white
Grid: 8px
```

**Step 1: Create basic card (md size)**

```
Frame: "Card / md / default"
Dimensions: 400 × 300px
Background: semantic/bg/default (white)
Border: none
Radius: 12px
Shadow: elevation/shadow/base
Padding: 16px (all sides)
Auto-layout: Vertical, 16px gap, padding [16, 16, 16, 16]

Children:
├── Header (optional)
│   ├── Frame "Card Header"
│   ├── Auto-layout: Horizontal, space-between
│   ├── Padding: 0 (inside card padding)
│   │
│   ├── Title
│   │   ├── Text: "Card Title"
│   │   ├── Font: typography/heading/3 [30px]
│   │   ├── Color: semantic/text/primary
│   │   └── Flex: 1
│   │
│   └── Action (optional)
│       ├── Button: secondary, icon-only

├── Content (flexible)
│   ├── Frame "Card Content"
│   ├── Auto-layout: Vertical
│   └── Flexible height, fills space

└── Footer (optional)
    ├── Frame "Card Footer"
    ├── Auto-layout: Horizontal, space-between
    ├── Padding: 0
    │
    ├── Secondary CTA
    │   └── Button: tertiary
    │
    └── Primary CTA
        └── Button: primary
```

**Step 2: Make component**

```
Right-click card frame → "Create component"
Component name: "Card"
```

---

### 10.2 Create card size variants

```
Variant: Card / sm
├── Dimensions: 300 × 180px
├── Padding: 12px
├── Radius: 8px (smaller radius for smaller card)
├── Title: heading-2 (smaller text)
└── Usage: Stacked cards, sidebars

Variant: Card / md [DEFAULT]
├── Dimensions: 400 × 300px
├── Padding: 16px
├── Radius: 12px
├── Title: heading-3
└── Usage: Dashboard cards, standard

Variant: Card / lg
├── Dimensions: 600 × 400px
├── Padding: 24px
├── Radius: 16px
├── Title: heading-2 (larger text)
└── Usage: Featured cards, hero
```

**Add size property:**
```
"+" → Add property "size"
Values: sm, md (default), lg
```

---

### 10.3 Create card state variants

```
Variant: Card / default
├── Shadow: elevation/shadow/base
├── Border: none
├── Opacity: 100%
├── Cursor: pointer (if clickable)

Variant: Card / hover
├── Shadow: elevation/shadow/md (elevated)
├── Scale: 1.01 (slight lift) [note in docs, implement in code]
├── Cursor: pointer

Variant: Card / selected/active
├── Border: 2px primary-600
├── Shadow: elevation/shadow/md
├── Background tint: primary-50

Variant: Card / disabled
├── Opacity: 50%
├── Cursor: not-allowed
└── Shadow: none
```

**Add state property:**
```
"+" → Add property "state"
Values: default, hover, selected, disabled
```

---

### 10.4 Create card content type variants

```
Variant: Card / Content Type: Empty
├── Only header visible
├── Content: empty/hidden
├── Footer: empty/hidden

Variant: Card / Content Type: Simple
├── Title + content only
├── No header actions
├── No footer actions

Variant: Card / Content Type: Full
├── Header + title + action
├── Content area
├── Footer with actions [DEFAULT]

Variant: Card / Content Type: Compact
├── Title + content
├── No header/footer
├── Best for data display
```

**Add content type property:**
```
"+" → Add property "contentType"
Values: full (default), simple, compact, empty
```

---

### 10.5 Complete Card component set

```
Card
├── size: sm, md (default), lg
├── state: default (default), hover, selected, disabled
└── contentType: full (default), simple, compact, empty

Total variants: 3 sizes × 4 states × 4 types = 48 variants
```

---

## PART 12: BOTTOM NAVIGATION COMPONENT

### 11.1 Create bottom nav master component

Create frame:
```
Frame Name: "04 Bottom Navigation"
Dimensions: 375 × 64px
Background: semantic/bg/default (white)
Border top: 1px semantic/neutral/200
Grid: 8px
```

**Step 1: Create nav bar structure**

```
Frame: "BottomNavigation"
Dimensions: 375 × 64px
Auto-layout: Horizontal, space-evenly
Padding: [8, 0, 8, 0] (top/right/bottom/left)
Background: semantic/bg/default
Border top: 1px semantic/neutral/200

Children (5 nav items):
├── NavItem 1
│   ├── Frame "NavItem"
│   ├── Dimensions: auto (evenly distributed)
│   ├── Auto-layout: Vertical, center, 4px gap
│   ├── Padding: 8px (all)
│   │
│   ├── Icon
│   │   ├── Dimensions: 24 × 24px
│   │   ├── Fill: neutral-500 (inactive by default)
│   │   └── Centered
│   │
│   └── Label
│       ├── Text: "Home"
│       ├── Font: typography/caption [12px, 400]
│       ├── Color: neutral-500
│       └── Centered

├── NavItem 2 [ACTIVE variant below]
├── NavItem 3
├── NavItem 4
└── NavItem 5
```

**Step 2: Create active variant**

For active nav item (e.g., "Home"):
```
NavItem [active]
├── Icon: primary-600 (color changes)
├── Label: primary-600 (color changes)
├── Background: primary-50 (optional light tint)
└── Other items: neutral-500 (inactive)
```

**Step 3: Make component**

```
Right-click BottomNavigation frame → "Create component"
Component name: "BottomNavigation"
```

---

### 11.2 Create nav item variants (active/inactive)

```
Variant: NavItem / inactive
├── Icon color: semantic/text/tertiary (neutral-500)
├── Label color: semantic/text/tertiary
├── Background: transparent
├── State: tap → temporary background tint

Variant: NavItem / active
├── Icon color: primary-600
├── Label color: primary-600
├── Background: optional primary-50
└── Underline: optional 2px primary-600 above item
```

**Create NavItem as sub-component:**

```
1. Right-click NavItem frame → "Create component"
   Component name: "NavItem"

2. Add property "state"
   Values: inactive (default), active

3. In inactive variant:
   ├── Icon: neutral-500
   └── Label: neutral-500

4. In active variant:
   ├── Icon: primary-600
   └── Label: primary-600
```

---

### 11.3 Create bottom nav tab count variants

```
Variant: BottomNavigation / 3-tabs
├── NavItem width: 375 / 3 = 125px
├── Evenly distributed
└── Usage: Minimal navigation

Variant: BottomNavigation / 4-tabs
├── NavItem width: 375 / 4 ≈ 94px
└── Usage: Standard navigation

Variant: BottomNavigation / 5-tabs [DEFAULT]
├── NavItem width: 375 / 5 = 75px
└── Usage: Full navigation (current design)

Variant: BottomNavigation / 6-tabs
├── NavItem width: 375 / 6 ≈ 63px
├── Warning: Touch targets become 44px (acceptable minimum)
└── Usage: Extended navigation (not recommended)
```

**NOTE:** Don't create as variants in Figma. Instead, document in specs that nav adjusts based on item count.

---

### 11.4 Complete Bottom Navigation component

```
BottomNavigation
├── Fixed: 5 NavItem children
├── Each NavItem
│   └── state: inactive (default), active

NavItem (sub-component)
├── state: inactive (default), active
```

---

## PART 13: BUILD CHECKLIST & VERIFICATION

### 13.1 Token architecture complete

- [ ] **Color Styles Created**
  - [ ] Primary (50, 100, 500, 600, 900)
  - [ ] Success (500, 600, 900)
  - [ ] Warning (500, 600, 900)
  - [ ] Danger (500, 600, 900)
  - [ ] Neutral (0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900)
  - [ ] Semantic bg styles (default, secondary, tertiary)
  - [ ] Semantic text styles (primary, secondary, tertiary, inverse)

- [ ] **Typography Styles Created**
  - [ ] heading/1, heading/2, heading/3
  - [ ] body/large, body/base, body/small
  - [ ] label
  - [ ] caption
  - [ ] mono/amount, mono/small

- [ ] **Shadow Styles Created**
  - [ ] shadow/none
  - [ ] shadow/sm
  - [ ] shadow/base
  - [ ] shadow/md
  - [ ] shadow/lg
  - [ ] shadow/xl
  - [ ] shadow/2xl

- [ ] **Reference Frames Created**
  - [ ] Color system visual (9-tone swatches)
  - [ ] Semantic color usage cards
  - [ ] Typography scale display
  - [ ] Elevation/shadow examples
  - [ ] Border radius examples
  - [ ] Spacing reference visual
  - [ ] Motion timing reference

### 13.2 Components complete

- [ ] **Button Component**
  - [ ] 5 sizes (xs, sm, md, lg, xl)
  - [ ] 4 styles (primary, secondary, tertiary, danger)
  - [ ] 5 states (default, hover, active, disabled, focus)
  - [ ] 2 icons (with, only)
  - [ ] Component set created with all properties
  - [ ] Naming: "Button"

- [ ] **Input Component**
  - [ ] 3 sizes (sm, md, lg)
  - [ ] 4 states (default, focus, error, disabled)
  - [ ] 4 types (text, email, number, amount)
  - [ ] Label + helper text included
  - [ ] Component set created with all properties
  - [ ] Naming: "Input"

- [ ] **Card Component**
  - [ ] 3 sizes (sm, md, lg)
  - [ ] 4 states (default, hover, selected, disabled)
  - [ ] 4 content types (full, simple, compact, empty)
  - [ ] Header/content/footer sections
  - [ ] Component set created with all properties
  - [ ] Naming: "Card"

- [ ] **Bottom Navigation Component**
  - [ ] 5 NavItem children
  - [ ] NavItem sub-component with active/inactive states
  - [ ] Proper spacing (375px / 5 = 75px per item)
  - [ ] 64px total height (56px nav + 8px safe area)
  - [ ] Component created
  - [ ] Naming: "BottomNavigation"

### 13.3 Naming verification

All components follow strict naming:
```
✅ CORRECT:
- semantic/primary/600
- typography/heading/2
- elevation/shadow/base
- Button (master component)
- Button/primary/md/default
- Input/email/lg/focus
- Card/lg/selected
- BottomNavigation

❌ WRONG:
- Primary 600 (no nesting)
- heading 2 (no slash)
- shadow-base (no slash, wrong naming)
- button (lowercase)
- Button Primary (spaces, not variants)
- Input Email (wrong hierarchy)
```

---

## PART 14: WHAT'S NOT BUILT YET (Next phases)

**Phase 5 EXCLUDES:**
- ❌ Dashboard screens
- ❌ Transaction screens
- ❌ Analytics screens
- ❌ AI chat screens
- ❌ All page designs

**These are built in Phases 6-10** (screens, prototypes, full flows)

---

## HANDOFF TO ENGINEERING

Once Phase 5 complete:
1. Share Figma link with engineering
2. Engineering extracts tokens from color/text styles
3. Engineering maps to Tailwind config
4. Engineering implements React components
5. Engineering uses component set as design spec

**Key:** Never edit tokens/styles after engineer starts implementation. Coordinate changes.

---

**END OF PHASE 5 BUILD EXECUTION**

**Status:** Ready to execute. All Figma settings documented. No guessing required.

**Time estimate:** 8-10 working hours (one designer, focused work)