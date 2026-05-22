/**
 * Design tokens extracted from theme.css
 * All UI values should use these tokens instead of hardcoded values
 * This ensures consistency with the design system
 */

// ───────────────────────────────────────────────────────────────────────────
// COLORS - Brand & Semantic
// ───────────────────────────────────────────────────────────────────────────

export const colors = {
  brand: {
    primary: '#4AE54A',
    primaryDark: '#38C438',
    primaryLight: '#DCFCE7',
    primaryFg: '#0D2818',
  },

  sidebar: {
    bg: '#0D2818',
    activeBg: '#163D24',
    hoverBg: 'rgba(74, 229, 74, 0.08)',
    text: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.55)',
    label: 'rgba(255, 255, 255, 0.35)',
  },

  content: {
    primary: '#1A2B1A',
    secondary: '#454745',
    tertiary: '#6A6C6A',
    link: '#163D24',
  },

  interactive: {
    primary: '#0D2818',
    accent: '#4AE54A',
    secondary: '#868685',
    control: '#0D2818',
  },

  bg: {
    screen: '#F4F6F4',
    card: '#FFFFFF',
    cardHover: '#F9FDF9',
    elevated: '#FFFFFF',
    neutral: 'rgba(22, 51, 0, 0.08)',
    overlay: 'rgba(22, 51, 0, 0.08)',
  },

  border: {
    neutral: 'rgba(14, 15, 12, 0.12)',
    overlay: 'rgba(14, 15, 12, 0.12)',
  },

  sentiment: {
    positive: '#2F5711',
    positiveBg: '#F0FDF4',
    negative: '#A8200D',
    negativeBg: '#FEF2F2',
    warning: '#EDC843',
    warningBg: '#FFFBEB',
  },

  category: {
    food: '#F59E0B',
    transport: '#3B82F6',
    groceries: '#4AE54A',
    shopping: '#EC4899',
    bills: '#8B5CF6',
    health: '#EF4444',
    entertainment: '#F97316',
    education: '#06B6D4',
    income: '#2F5711',
    savings: '#0891B2',
  },
};

// ───────────────────────────────────────────────────────────────────────────
// SPACING (4px baseline, but we use 8px steps)
// ───────────────────────────────────────────────────────────────────────────

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
  '8xl': '64px',
} as const;

// Numeric values for calculations
export const spacingValue = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '8xl': 64,
} as const;

// ───────────────────────────────────────────────────────────────────────────
// BORDER RADIUS
// ───────────────────────────────────────────────────────────────────────────

export const radius = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ───────────────────────────────────────────────────────────────────────────
// SHADOWS
// ───────────────────────────────────────────────────────────────────────────

export const shadows = {
  card: '0 1px 3px rgba(13, 40, 24, 0.06), 0 1px 2px rgba(13, 40, 24, 0.04)',
  cardHover: '0 4px 12px rgba(13, 40, 24, 0.10), 0 2px 4px rgba(13, 40, 24, 0.06)',
  modal: '0 20px 48px rgba(13, 40, 24, 0.16)',
  nav: '0 -1px 0 rgba(14, 15, 12, 0.08)',
} as const;

// ───────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY
// ───────────────────────────────────────────────────────────────────────────

export const typography = {
  display: {
    size: '2rem',
    weight: 700,
    lineHeight: 1.2,
  },
  h1: {
    size: '1.75rem',
    weight: 700,
    lineHeight: 1.2,
  },
  h2: {
    size: '1.375rem',
    weight: 700,
    lineHeight: 1.3,
  },
  h3: {
    size: '1.125rem',
    weight: 600,
    lineHeight: 1.3,
  },
  bodyLg: {
    size: '1rem',
    weight: 400,
    lineHeight: 1.5,
  },
  body: {
    size: '0.875rem',
    weight: 400,
    lineHeight: 1.5,
  },
  bodySm: {
    size: '0.75rem',
    weight: 400,
    lineHeight: 1.5,
  },
  label: {
    size: '0.875rem',
    weight: 600,
    lineHeight: 1.5,
  },
  labelSm: {
    size: '0.75rem',
    weight: 600,
    lineHeight: 1.5,
  },
  mono: {
    family: "'DM Mono', monospace",
    weight: 400,
  },
} as const;

// ───────────────────────────────────────────────────────────────────────────
// Z-INDEX STACK
// ───────────────────────────────────────────────────────────────────────────

export const zIndex = {
  hide: '-1',
  base: '0',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  backdrop: '1040',
  offCanvas: '1050',
  modal: '1060',
  popover: '1070',
  tooltip: '1080',
} as const;

// ───────────────────────────────────────────────────────────────────────────
// ANIMATION/TRANSITION DURATIONS
// ───────────────────────────────────────────────────────────────────────────

export const durations = {
  instant: '0ms',
  fast: '100ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
  slowest: '1000ms',
} as const;

// ───────────────────────────────────────────────────────────────────────────
// EASING FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeQuadInOut: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
} as const;

// ───────────────────────────────────────────────────────────────────────────
// RESPONSIVE BREAKPOINTS (used in media queries)
// ───────────────────────────────────────────────────────────────────────────

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const breakpointsValue = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ───────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ───────────────────────────────────────────────────────────────────────────

/**
 * Get CSS custom property value for a color
 */
export function getColorVar(colorKey: string): string {
  return `var(--color-${colorKey})`;
}

/**
 * Get CSS custom property value for spacing
 */
export function getSpaceVar(spaceKey: string): string {
  return `var(--space-${spaceKey})`;
}

/**
 * Combine multiple spacing values
 */
export function combineSpacing(...values: (keyof typeof spacing)[]): string {
  return values.map((v) => spacing[v]).join(' ');
}

/**
 * Create a transition style string
 */
export function createTransition(
  property: string = 'all',
  duration: keyof typeof durations = 'base',
  easingFunc: keyof typeof easing = 'easeInOut'
): string {
  return `${property} ${durations[duration]} ${easing[easingFunc]}`;
}

// ───────────────────────────────────────────────────────────────────────────
// CATEGORY COLOR MAPPING (for dynamic category colors)
// ───────────────────────────────────────────────────────────────────────────

export const categoryColorMap: Record<string, string> = {
  'Food & Dining': colors.category.food,
  Transport: colors.category.transport,
  Groceries: colors.category.groceries,
  Shopping: colors.category.shopping,
  'Bills & Utilities': colors.category.bills,
  Health: colors.category.health,
  Entertainment: colors.category.entertainment,
  Education: colors.category.education,
  Salary: colors.category.income,
  Freelance: colors.category.income,
  'Investment Return': colors.category.income,
  'Other Income': colors.category.income,
  Savings: colors.category.savings,
};

/**
 * Get color for a category
 */
export function getCategoryColor(category: string): string {
  return categoryColorMap[category] || colors.category.food;
}
