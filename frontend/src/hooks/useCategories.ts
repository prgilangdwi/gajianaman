import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type { CategoryGroup, Category } from '@/lib/supabase';

export interface CategoryHierarchy {
  groups: CategoryGroup[];
  categories: Category[];
}

export function useCategories(type?: 'expense' | 'income' | 'transfer') {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch category groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('category_groups')
          .select('*')
          .or(`user_id.eq.${user.user_id},user_id.is.null`)
          .order('is_default', { ascending: false })
          .order('name');

        if (groupsError) throw groupsError;

        // Fetch categories
        let query = supabase
          .from('categories')
          .select('*')
          .or(`user_id.eq.${user.user_id},user_id.is.null`);

        if (type) {
          query = query.eq('type', type);
        }

        const { data: categoriesData, error: categoriesError } = await query
          .order('is_default', { ascending: false })
          .order('name');

        if (categoriesError) throw categoriesError;

        setGroups((groupsData as CategoryGroup[]) || []);
        setCategories((categoriesData as Category[]) || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [user, type]);

  // Organize categories by group
  const categoriesByGroup = groups.map((group) => ({
    group,
    categories: categories.filter((cat) => cat.parent_group_id === group.id),
  }));

  // Categories without a group
  const ungroupedCategories = categories.filter((cat) => !cat.parent_group_id);

  return {
    groups,
    categories,
    categoriesByGroup,
    ungroupedCategories,
    isLoading,
    error,
  };
}
