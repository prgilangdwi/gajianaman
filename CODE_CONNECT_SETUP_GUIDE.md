# Code Connect Setup Guide — Phase 5 Components

**Status:** 28 components ready for Code Connect mapping  
**Figma File:** https://www.figma.com/design/9c6q01etgWdlf0fbtg2f7a  
**Component Library Page:** 🔧 Component Library  
**Date Prepared:** May 20, 2026

---

## Overview

Code Connect bridges Figma designs and React code by linking components in both systems. When a designer clicks a Figma component, they see the React implementation. When a developer reads React code, they see the design context.

**Current Status:** All 28 Phase 5 components are created in Figma and ready for mapping. Mappings are documented below and will be activated once your Figma account is upgraded to Organization or Enterprise plan.

---

## Prerequisites

To set up Code Connect:
1. **Figma Account:** Upgrade to Organization or Enterprise plan (required for Code Connect feature)
2. **Developer Access:** Admin or Developer seat in the Figma organization
3. **GitHub Sync:** Figma organization connected to GitHub repository
4. **React Code:** Component files in `frontend/src/app/components/`

**Current Blocker:** Your Figma account is on a plan that doesn't support Code Connect. You can:
- Upgrade to Figma Organization plan
- Use the mappings in this document as a reference for manual code/design sync
- Continue with Phase 6 (Screens) and set up Code Connect later

---

## Mapping Structure

### Component Organization

All 28 Figma components are grouped by type and use variant naming:

```
Component Type / Variant 1 / Variant 2
Examples:
├── Button/Primary/Medium
├── Button/Secondary/Medium
├── Button/Danger/Medium
├── Card/Default
├── Card/Outlined
├── Card/Elevated
├── Input/Text/Default
├── Input/Text/Focus
├── Input/Text/Error
├── Input/Text/Disabled
├── Badge/Status/Success
├── Badge/Status/Warning
├── Badge/Status/Error
├── Badge/Category/Blue
├── Chip/Filter/Default
├── Chip/Filter/Active
├── Chip/Tag/Default
├── ProgressBar/Linear/Default
├── ProgressBar/Circular/Default
├── Alert/Success
├── Alert/Warning
├── Alert/Error
├── Tab/Default
├── Tab/Active
├── Modal/Dialog/Default
└── BottomNav/Mobile/Default
```

---

## Complete Mapping Reference

### 1. Button Component (5 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Button/Primary/Medium | 14:2 | `frontend/src/app/components/Button.tsx` | `export const Button = ({ variant = 'primary', size = 'medium', ... })` |
| Button/Secondary/Medium | 14:4 | `frontend/src/app/components/Button.tsx` | Variant: `secondary` |
| Button/Danger/Medium | 14:6 | `frontend/src/app/components/Button.tsx` | Variant: `danger` |
| Button/Primary/Small | 14:8 | `frontend/src/app/components/Button.tsx` | Size: `small` |
| Button/Primary/Large | 14:10 | `frontend/src/app/components/Button.tsx` | Size: `large` |

**Design spec:**
- Primary medium: 40px height, 16px padding horizontal, semantic/primary/600 background
- Interactive states: hover (primary/700), focus (primary/600 + border), disabled (neutral/200)
- Use typography/body/base for label text

---

### 2. Card Component (3 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Card/Default | 14:12 | `frontend/src/app/components/Card.tsx` | `export const Card = ({ variant = 'default', ... })` |
| Card/Outlined | 14:14 | `frontend/src/app/components/Card.tsx` | Variant: `outlined` (2px border) |
| Card/Elevated | 14:16 | `frontend/src/app/components/Card.tsx` | Variant: `elevated` (no border) |

**Design spec:**
- Default: white background (neutral/50), 1px border (neutral/200)
- Outlined: white background, 2px border (neutral/300)
- Elevated: white background, no border (shadow-only variant)
- Padding: 16px inside all variants

---

### 3. Input Component (4 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Input/Text/Default | 15:2 | `frontend/src/app/components/Input.tsx` | `export const Input = ({ state = 'default', ... })` |
| Input/Text/Focus | 15:4 | `frontend/src/app/components/Input.tsx` | State: `focus` |
| Input/Text/Error | 15:6 | `frontend/src/app/components/Input.tsx` | State: `error` |
| Input/Text/Disabled | 15:8 | `frontend/src/app/components/Input.tsx` | State: `disabled` |

**Design spec:**
- Default: white background, 1px border (neutral/300)
- Focus: white background, 2px border (primary/600)
- Error: white background, 2px border (danger/600)
- Disabled: neutral/100 background, 1px border (neutral/200)
- Height: 40px, padding: 8px 12px, placeholder text in neutral/400

---

### 4. Badge Component (4 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Badge/Status/Success | 15:10 | `frontend/src/app/components/Badge.tsx` | `export const Badge = ({ type = 'success', ... })` |
| Badge/Status/Warning | 15:12 | `frontend/src/app/components/Badge.tsx` | Type: `warning` |
| Badge/Status/Error | 15:14 | `frontend/src/app/components/Badge.tsx` | Type: `error` |
| Badge/Category/Blue | 15:16 | `frontend/src/app/components/Badge.tsx` | Type: `category`, category: `blue` |

**Design spec:**
- Success: semantic/success/100 background, semantic/success/600 text
- Warning: semantic/warning/100 background, semantic/warning/600 text
- Error: semantic/danger/100 background, semantic/danger/600 text
- Category/Blue: semantic/primary/100 background, semantic/primary/600 text
- Height: 24px, padding: 4px 8px, typography/caption text

---

### 5. Chip Component (3 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Chip/Filter/Default | 16:2 | `frontend/src/app/components/Chip.tsx` | `export const Chip = ({ mode = 'filter', state = 'default', ... })` |
| Chip/Filter/Active | 16:4 | `frontend/src/app/components/Chip.tsx` | State: `active` |
| Chip/Tag/Default | 16:6 | `frontend/src/app/components/Chip.tsx` | Mode: `tag` |

**Design spec:**
- Filter/Default: neutral/100 background, neutral/600 text, 1px border (neutral/300)
- Filter/Active: primary/600 background, white text
- Tag/Default: neutral/100 background, neutral/600 text, removable (X icon on right)
- Height: 32px, padding: 6px 12px, typography/body/small text

---

### 6. ProgressBar Component (2 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| ProgressBar/Linear/Default | 16:8 | `frontend/src/app/components/ProgressBar.tsx` | `export const ProgressBar = ({ type = 'linear', progress = 0.7, ... })` |
| ProgressBar/Circular/Default | 16:10 | `frontend/src/app/components/ProgressBar.tsx` | Type: `circular` |

**Design spec:**
- Linear: 200px width × 4px height, primary/600 fill (70% in design), neutral/200 background
- Circular: 80px diameter, primary/600 fill ring, white center, 70% progress
- Color: semantic/primary/600 for progress fill
- Corner radius: 2px (linear), circle (circular)

---

### 7. Alert Component (3 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Alert/Success | 16:12 | `frontend/src/app/components/Alert.tsx` | `export const Alert = ({ severity = 'success', ... })` |
| Alert/Warning | 16:14 | `frontend/src/app/components/Alert.tsx` | Severity: `warning` |
| Alert/Error | 16:16 | `frontend/src/app/components/Alert.tsx` | Severity: `error` |

**Design spec:**
- Success: semantic/success/100 background, semantic/success/600 border, success icon
- Warning: semantic/warning/100 background, semantic/warning/600 border, warning icon
- Error: semantic/danger/100 background, semantic/danger/600 border, error icon
- Dimensions: 200px × 60px (content defines actual height), padding: 12px, 1px border
- Text: typography/body/small

---

### 8. Tab Component (2 variants)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Tab/Default | 16:18 | `frontend/src/app/components/Tab.tsx` | `export const Tab = ({ active = false, ... })` |
| Tab/Active | 16:20 | `frontend/src/app/components/Tab.tsx` | Active: `true` |

**Design spec:**
- Default: transparent background, neutral/600 text, no bottom border
- Active: white background, primary/600 text, primary/600 bottom border (2px)
- Dimensions: 100px × 44px
- Text: typography/body/base (semibold for active)
- Click target: full tab area

---

### 9. Modal Component (1 variant)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| Modal/Dialog/Default | 16:22 | `frontend/src/app/components/Modal.tsx` | `export const Modal = ({ title, children, onClose, ... })` |

**Design spec:**
- Container: 280px width × 180px height (content-driven), white background, 8px corner radius
- Title: typography/heading/3 (30px), padding: 16px top
- Content area: padding: 12px horizontal, typography/body/base
- Backdrop: transparent black (rgba(0,0,0,0.5)) — entire screen
- Close button: top-right corner, X icon

---

### 10. BottomNav Component (1 variant)

| Figma Component | Node ID | React File | Code Location |
|---|---|---|---|
| BottomNav/Mobile/Default | 16:24 | `frontend/src/app/components/BottomNav.tsx` | `export const BottomNav = ({ activeTab, onTabChange, ... })` |

**Design spec:**
- Dimensions: 375px width (full screen width) × 60px height
- Background: white, border-top: 1px neutral/200
- Contains 5 navigation items (Overview, Transactions, Add, Analytics, More)
- Icons: 24px size, neutral/600 (inactive), primary/600 (active)
- Labels: typography/caption, centered under icons
- Active item: highlight with primary/600

---

## Implementation Steps (Once Code Connect is Enabled)

### Step 1: Prepare React Files

Create stub component files with the correct export structure:

```typescript
// frontend/src/app/components/Button.tsx
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({ variant = 'primary', size = 'medium', children, onClick }: ButtonProps) => {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick}>
      {children}
    </button>
  );
};
```

Repeat for all 10 component types: Button, Card, Input, Badge, Chip, ProgressBar, Alert, Tab, Modal, BottomNav.

### Step 2: Activate Code Connect in Figma

1. Open each component in Figma
2. Right-click → "Link code"
3. Select React framework
4. Paste the React file path and export name
5. Save mapping

Example for Button/Primary/Medium:
- Framework: React
- File: `frontend/src/app/components/Button.tsx`
- Component: `Button`

### Step 3: Document Variants (Optional)

For components with multiple variants, document how props map to Figma variants:

```
Figma: Button/Primary/Medium
Props: variant="primary" size="medium"

Figma: Button/Secondary/Medium
Props: variant="secondary" size="medium"
```

---

## Usage in Phase 6+

Once Code Connect is active, designers and developers will see:

**For Designers:**
- Click a Figma component → see React implementation
- Understand how designs are coded
- View example props and usage

**For Developers:**
- Read React code → click to see Figma design
- Visual context for components
- Confirm color, sizing, spacing matches design

---

## Next Steps

1. **Upgrade Figma Plan** (if using Code Connect)
2. **Create React Component Files** (can start now)
3. **Activate Code Connect Mappings** (once upgraded)
4. **Proceed with Phase 6** (Screens design using Phase 5 components)

---

## Phase 5 Summary

✅ **Days 1-4:** Color system (45 styles) + Typography (13 styles)  
✅ **Days 5-9:** Component design (10 types, 28 variants)  
⏳ **Code Connect:** Mappings documented, awaiting plan upgrade  
⏳ **Phase 6:** Screen system (16 mobile screens, 4 state variants each)

---

**Prepared by:** Claude Code  
**Date:** May 20, 2026  
**Status:** Phase 5 complete, Phase 6 ready to start  
