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
  'Food & Dining': { emoji: '🍔', color: '#f59e0b' },
  Food: { emoji: '🍔', color: '#f59e0b' },
  Transport: { emoji: '🚗', color: '#3b82f6' },
  Groceries: { emoji: '🛒', color: '#10b981' },
  Shopping: { emoji: '🛍️', color: '#ec4899' },
  'Bills & Utilities': { emoji: '📱', color: '#8b5cf6' },
  Bills: { emoji: '📱', color: '#8b5cf6' },
  Health: { emoji: '🏥', color: '#ef4444' },
  Entertainment: { emoji: '🎬', color: '#f97316' },
  Education: { emoji: '📚', color: '#06b6d4' },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category] ?? { emoji: '💰', color: '#94a3b8' };
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_META).filter(
  (k) => !['Food', 'Bills'].includes(k)
);
