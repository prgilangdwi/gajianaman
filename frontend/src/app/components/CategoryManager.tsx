import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryManager } from '@/hooks/useCategoryManager';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import type { CategoryGroup, Category } from '@/lib/supabase';

interface ExpandedGroups {
  [key: string]: boolean;
}

export default function CategoryManager() {
  const { groups, categories, categoriesByGroup, isLoading } = useCategories();
  const { addCategoryGroup, updateCategoryGroup, deleteCategoryGroup, addCategory, updateCategory, deleteCategory, isLoading: isManaging } = useCategoryManager();
  const [expandedGroups, setExpandedGroups] = useState<ExpandedGroups>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: 'group' | 'category'; id: string } | null>(null);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [selectedGroupForCategory, setSelectedGroupForCategory] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const filteredGroups = categoriesByGroup.filter(
    ({ group, categories: cats }) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cats.some((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const filteredUngrouped = categories
    .filter((cat) => !cat.parent_group_id)
    .filter((cat) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoading) {
    return <div className="text-center py-8">Loading categories…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Add Buttons */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
 <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddGroupDialog} onOpenChange={setShowAddGroupDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
 <Plus className="size-4 " />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Category Group</DialogTitle>
              </DialogHeader>
              <AddGroupForm
                onSuccess={() => setShowAddGroupDialog(false)}
                onAdd={addCategoryGroup}
              />
            </DialogContent>
          </Dialog>

          {selectedGroupForCategory && (
            <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
 <Plus className="size-4 " />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Category</DialogTitle>
                </DialogHeader>
                <AddCategoryForm
                  parentGroupId={selectedGroupForCategory}
                  onSuccess={() => {
                    setShowAddCategoryDialog(false);
                    setSelectedGroupForCategory(null);
                  }}
                  onAdd={addCategory}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Category Groups Tree */}
      <div className="space-y-2">
        {filteredGroups.map(({ group, categories: groupCategories }) => (
          <Card key={group.id}>
            <CardContent className="pt-6">
              {/* Group Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center gap-2 flex-1 text-left hover:bg-accent p-2 rounded-md"
                >
                  {expandedGroups[group.id] ? (
 <ChevronDown className="size-4 " />
                  ) : (
 <ChevronRight className="size-4 " />
                  )}
                  <span className={`font-semibold ${group.is_default ? 'text-muted-foreground' : ''}`}>
                    {group.icon} {group.name}
                  </span>
                </button>

                {!group.is_default && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingItem({ type: 'group', id: group.id })}
                    >
 <Edit2 className="size-4 " />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCategoryGroup(group.id)}
                      disabled={isManaging}
                    >
 <Trash2 className="size-4 " />
                    </Button>
                  </div>
                )}
              </div>

              {/* Expanded Categories */}
              {expandedGroups[group.id] && (
                <div className="ml-6 space-y-2 border-l pl-4">
                  {groupCategories.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2">No categories</div>
                  ) : (
                    groupCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                        <span className={cat.is_default ? 'text-muted-foreground' : ''}>
                          {cat.icon} {cat.name}
                        </span>
                        {!cat.is_default && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingItem({ type: 'category', id: cat.id })}
                            >
 <Edit2 className="size-4 " />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteCategory(cat.id)}
                              disabled={isManaging}
                            >
 <Trash2 className="size-4 " />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {!group.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1 mt-2"
                      onClick={() => {
                        setSelectedGroupForCategory(group.id);
                        setShowAddCategoryDialog(true);
                      }}
                    >
 <Plus className="size-3 " />
                      Add Category
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Ungrouped Categories */}
        {filteredUngrouped.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {filteredUngrouped.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-md">
                    <span className={cat.is_default ? 'text-muted-foreground' : ''}>
                      {cat.icon} {cat.name}
                    </span>
                    {!cat.is_default && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingItem({ type: 'category', id: cat.id })}
                        >
 <Edit2 className="size-4 " />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCategory(cat.id)}
                          disabled={isManaging}
                        >
 <Trash2 className="size-4 " />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AddGroupForm({ onSuccess, onAdd }: { onSuccess: () => void; onAdd: (data: any) => Promise<any> }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    const result = await onAdd({ name, icon: icon || undefined });
    setIsSubmitting(false);
    if (result) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Group name (e.g., Kebutuhan)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Icon (emoji)"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        maxLength={2}
      />
      <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()} className="w-full">
        {isSubmitting ? 'Adding...' : 'Add Group'}
      </Button>
    </div>
  );
}

function AddCategoryForm({
  parentGroupId,
  onSuccess,
  onAdd,
}: {
  parentGroupId: string;
  onSuccess: () => void;
  onAdd: (data: any) => Promise<any>;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [icon, setIcon] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    const result = await onAdd({
      name,
      type,
      parentGroupId,
      icon: icon || undefined,
    });
    setIsSubmitting(false);
    if (result) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Category name (e.g., Spotify)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as 'expense' | 'income' | 'transfer')}
        className="w-full px-3 py-2 border rounded-md text-sm"
      >
        <option value="expense">Expense</option>
        <option value="income">Income</option>
        <option value="transfer">Transfer</option>
      </select>
      <Input
        placeholder="Icon (emoji)"
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        maxLength={2}
      />
      <Button onClick={handleSubmit} disabled={isSubmitting || !name.trim()} className="w-full">
        {isSubmitting ? 'Adding...' : 'Add Category'}
      </Button>
    </div>
  );
}
