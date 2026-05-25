export interface CategoryMeta {
  emoji: string;
  color: string;
}

export const CATEGORIES = {
  FOOD_DINING: 'Food & Dining',
  FOOD: 'Food',
  TRANSPORT: 'Transport',
  GROCERIES: 'Groceries',
  SHOPPING: 'Shopping',
  BILLS_UTILITIES: 'Bills & Utilities',
  BILLS: 'Bills',
  HEALTH: 'Health',
  ENTERTAINMENT: 'Entertainment',
  EDUCATION: 'Education',
} as const;

export type CategoryKey = (typeof CATEGORIES)[keyof typeof CATEGORIES];

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  'Food & Dining': { emoji: '🍔', color: '#b86f0d' },
  Food: { emoji: '🍔', color: '#b86f0d' },
  Transport: { emoji: '🚗', color: '#1d4ed8' },
  Groceries: { emoji: '🛒', color: '#0d7a57' },
  Shopping: { emoji: '🛍️', color: '#be185d' },
  'Bills & Utilities': { emoji: '📱', color: '#6d28d9' },
  Bills: { emoji: '📱', color: '#6d28d9' },
  Health: { emoji: '🏥', color: '#b91c1c' },
  Entertainment: { emoji: '🎬', color: '#c2410c' },
  Education: { emoji: '📚', color: '#0369a1' },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? { emoji: '💰', color: '#94a3b8' };
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_META).filter(
  (k) => !['Food', 'Bills'].includes(k)
);
