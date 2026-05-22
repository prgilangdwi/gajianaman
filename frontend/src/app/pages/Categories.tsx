import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Plus, Trash2, Merge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { formatRupiah, cn, bgColorVar, textColorVar, borderColorVar } from '@/lib/utils';
import { pageEnter, fadeUp, useReducedMotion } from '@/lib/transitions';

const COLOR_PALETTE = [
  '#FF6B6B', '#FFA07A', '#FFD700', '#90EE90',
  '#87CEEB', '#6495ED', '#DDA0DD', '#F08080',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#52B788', '#C66B6B', '#E6CCFF',
];

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income' | 'saving';
  is_default: boolean;
}

export default function Categories() {
  const { user } = useAuth();
  const prefersReduced = useReducedMotion();
  const [isLoading] = useState(false);

  // Mock categories - in real implementation, fetch from useCategories hook
  const [categories, setCategories] = useState<Category[]>([
    { id: '1', name: 'Food & Dining', icon: '🍽️', color: '#FF6B6B', type: 'expense', is_default: true },
    { id: '2', name: 'Transport', icon: '🚗', color: '#4ECDC4', type: 'expense', is_default: true },
    { id: '3', name: 'Entertainment', icon: '🎬', color: '#95E1D3', type: 'expense', is_default: true },
    { id: '4', name: 'Salary', icon: '💰', color: '#90EE90', type: 'income', is_default: true },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [newCategoryColor, setNewCategoryColor] = useState('#FF6B6B');
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'income' | 'saving'>('expense');

  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [isMerging, setIsMerging] = useState(false);

  const handleAddCategory = async () => {
    if (!user || !newCategoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong');
      return;
    }

    // Mock API call
    const newCategory: Category = {
      id: Date.now().toString(),
      name: newCategoryName,
      icon: newCategoryIcon,
      color: newCategoryColor,
      type: newCategoryType,
      is_default: false,
    };

    setCategories([...categories, newCategory]);
    toast.success(`Kategori "${newCategoryName}" berhasil ditambahkan`);
    setShowAddDialog(false);
    setNewCategoryName('');
    setNewCategoryIcon('📌');
    setNewCategoryColor('#FF6B6B');
    setNewCategoryType('expense');
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    if (category.is_default) {
      toast.error('Tidak bisa menghapus kategori bawaan');
      return;
    }

    setCategories(categories.filter((c) => c.id !== id));
    toast.success(`Kategori "${category.name}" berhasil dihapus`);
  };

  const handleMergeConfirm = async () => {
    if (!mergeSource || !mergeTarget) {
      toast.error('Pilih kategori sumber dan target');
      return;
    }

    if (mergeSource === mergeTarget) {
      toast.error('Pilih kategori yang berbeda');
      return;
    }

    setIsMerging(true);
    try {
      const sourceCategory = categories.find((c) => c.id === mergeSource);
      const targetCategory = categories.find((c) => c.id === mergeTarget);

      if (!sourceCategory || !targetCategory) {
        throw new Error('Kategori tidak ditemukan');
      }

      // Mock merge logic - update all transactions from source to target
      // In real implementation, this would call an API endpoint

      setCategories(categories.filter((c) => c.id !== mergeSource));
      toast.success(`Kategori "${sourceCategory.name}" berhasil digabungkan ke "${targetCategory.name}"`);
      setShowMergeDialog(false);
      setMergeSource(null);
      setMergeTarget(null);
    } catch (error) {
      toast.error('Gagal menggabungkan kategori');
    } finally {
      setIsMerging(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');
  const savingCategories = categories.filter((c) => c.type === 'saving');

  return (
    <motion.div
      initial={prefersReduced ? { opacity: 0 } : pageEnter.initial}
      animate={prefersReduced ? { opacity: 1 } : pageEnter.animate}
      transition={pageEnter.transition}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
        animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
        transition={fadeUp.transition}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className={cn('text-2xl font-bold', textColorVar('content-primary'))}>
            Kelola Kategori
          </h1>
          <p className={cn('text-sm mt-1', textColorVar('content-tertiary'))}>
            Atur dan kelola kategori transaksi Anda
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowMergeDialog(true)}
            variant="outline"
            className="gap-2"
          >
            <Merge className="w-4 h-4" /> Gabungkan
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Tambah Kategori
          </Button>
        </div>
      </motion.div>

      {/* Category Sections */}
      {[
        { title: 'Pengeluaran', categories: expenseCategories },
        { title: 'Pemasukan', categories: incomeCategories },
        { title: 'Simpanan', categories: savingCategories },
      ].map((section) => (
        <motion.div
          key={section.title}
          initial={prefersReduced ? { opacity: 0 } : fadeUp.initial}
          animate={prefersReduced ? { opacity: 1 } : fadeUp.animate}
          transition={fadeUp.transition}
        >
          <Card className={cn(bgColorVar('bg-card'), borderColorVar('border-neutral'))}>
            <CardHeader>
              <CardTitle className={cn('text-lg', textColorVar('content-primary'))}>
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {section.categories.length === 0 ? (
                <p className={cn('text-sm text-center py-8', textColorVar('content-tertiary'))}>
                  Belum ada kategori
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.categories.map((category) => (
                    <motion.div
                      key={category.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        'p-4 rounded-lg border transition-all hover:shadow-md',
                        bgColorVar('bg-screen'),
                        borderColorVar('border-neutral')
                      )}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                            style={{ backgroundColor: `${category.color}20` }}
                          >
                            {category.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className={cn('font-semibold text-sm truncate', textColorVar('content-primary'))}>
                              {category.name}
                            </h3>
                            <p className={cn('text-xs', textColorVar('content-tertiary'))}>
                              {category.is_default ? 'Bawaan' : 'Custom'}
                            </p>
                          </div>
                        </div>
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                          title={category.color}
                        />
                      </div>
                      {!category.is_default && (
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg',
                            'hover:opacity-75 transition-opacity',
                            textColorVar('sentiment-negative')
                          )}
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Add Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Icon Picker */}
            <div className="space-y-2">
              <label className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                Ikon
              </label>
              <input
                type="text"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                maxLength={2}
                className={cn(
                  'w-full px-3 py-2 text-2xl text-center rounded-lg border',
                  bgColorVar('bg-screen'),
                  borderColorVar('border-neutral'),
                  textColorVar('content-primary')
                )}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                Nama Kategori
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="cth. Belanja Online"
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  bgColorVar('bg-screen'),
                  borderColorVar('border-neutral'),
                  textColorVar('content-primary')
                )}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                Tipe
              </label>
              <select
                value={newCategoryType}
                onChange={(e) => setNewCategoryType(e.target.value as 'expense' | 'income' | 'saving')}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  bgColorVar('bg-screen'),
                  borderColorVar('border-neutral'),
                  textColorVar('content-primary')
                )}
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="saving">Simpanan</option>
              </select>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <label className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                Warna
              </label>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewCategoryColor(color)}
                    className={cn(
                      'w-12 h-12 rounded-lg transition-transform hover:scale-110',
                      newCategoryColor === color ? 'ring-2 ring-offset-2' : ''
                    )}
                    style={{
                      backgroundColor: color,
                      ringColor: color,
                    }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: newCategoryColor }}
                />
                <input
                  type="text"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  placeholder="#FF6B6B"
                  className={cn(
                    'flex-1 px-3 py-1 rounded text-xs font-mono',
                    bgColorVar('bg-screen'),
                    borderColorVar('border-neutral'),
                    textColorVar('content-primary')
                  )}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddCategory} disabled={isLoading || !newCategoryName.trim()}>
              {isLoading ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Categories Dialog */}
      <Dialog open={showMergeDialog} onOpenChange={setShowMergeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gabungkan Kategori</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                Kategori Sumber (akan dihapus)
              </label>
              <select
                value={mergeSource || ''}
                onChange={(e) => setMergeSource(e.target.value || null)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  bgColorVar('bg-screen'),
                  borderColorVar('border-neutral'),
                  textColorVar('content-primary')
                )}
              >
                <option value="">Pilih kategori sumber…</option>
                {categories
                  .filter((c) => !c.is_default)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-center">
              <div className={cn('px-3 py-2 rounded-full', bgColorVar('bg-neutral'), textColorVar('content-secondary'))}>
                ↓ Gabung ke ↓
              </div>
            </div>

            <div className="space-y-2">
              <label className={cn('text-sm font-medium', textColorVar('content-primary'))}>
                Kategori Target
              </label>
              <select
                value={mergeTarget || ''}
                onChange={(e) => setMergeTarget(e.target.value || null)}
                className={cn(
                  'w-full px-3 py-2 rounded-lg border text-sm',
                  bgColorVar('bg-screen'),
                  borderColorVar('border-neutral'),
                  textColorVar('content-primary')
                )}
              >
                <option value="">Pilih kategori target…</option>
                {categories
                  .filter((c) => c.id !== mergeSource)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
              </select>
            </div>

            {mergeSource && mergeTarget && (
              <div className={cn('p-3 rounded-lg text-sm', bgColorVar('bg-screen'), borderColorVar('border-neutral'), textColorVar('content-secondary'))}>
                ✓ Semua transaksi di "{categories.find((c) => c.id === mergeSource)?.name}" akan dipindahkan ke "{categories.find((c) => c.id === mergeTarget)?.name}"
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMergeDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleMergeConfirm}
              disabled={isMerging || !mergeSource || !mergeTarget}
              variant="destructive"
            >
              {isMerging ? 'Menggabungkan…' : 'Gabungkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
