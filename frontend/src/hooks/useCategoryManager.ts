import { useState } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/lib/supabase';
import type { CategoryGroup, Category } from '@/lib/supabase';

export function useCategoryManager() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCategoryGroup = async (data: {
    name: string;
    icon?: string;
    color?: string;
  }): Promise<CategoryGroup | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: result, error: err } = await supabase
        .from('category_groups')
        .insert({
          user_id: user.user_id,
          name: data.name,
          icon: data.icon || null,
          color: data.color || null,
          is_default: false,
        })
        .select()
        .single();

      if (err) throw err;
      return (result as CategoryGroup) || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add category group';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategoryGroup = async (
    groupId: string,
    data: Partial<{ name: string; icon: string | null; color: string | null }>,
  ): Promise<CategoryGroup | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: result, error: err } = await supabase
        .from('category_groups')
        .update(data)
        .eq('id', groupId)
        .eq('user_id', user.user_id)
        .select()
        .single();

      if (err) throw err;
      return (result as CategoryGroup) || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category group';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategoryGroup = async (groupId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from('category_groups')
        .delete()
        .eq('id', groupId)
        .eq('user_id', user.user_id);

      if (err) throw err;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category group';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addCategory = async (data: {
    name: string;
    type: 'expense' | 'income' | 'transfer';
    parentGroupId?: string;
    icon?: string;
    color?: string;
  }): Promise<Category | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: result, error: err } = await supabase
        .from('categories')
        .insert({
          user_id: user.user_id,
          name: data.name,
          type: data.type,
          parent_group_id: data.parentGroupId || null,
          icon: data.icon || null,
          color: data.color || null,
          is_default: false,
        })
        .select()
        .single();

      if (err) throw err;
      return (result as Category) || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add category';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCategory = async (
    categoryId: string,
    data: Partial<{
      name: string;
      parentGroupId: string | null;
      icon: string | null;
      color: string | null;
    }>,
  ): Promise<Category | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updateData = {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentGroupId !== undefined && { parent_group_id: data.parentGroupId }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      };

      const { data: result, error: err } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)
        .eq('user_id', user.user_id)
        .select()
        .single();

      if (err) throw err;
      return (result as Category) || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update category';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { error: err } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.user_id);

      if (err) throw err;
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete category';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    addCategoryGroup,
    updateCategoryGroup,
    deleteCategoryGroup,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
