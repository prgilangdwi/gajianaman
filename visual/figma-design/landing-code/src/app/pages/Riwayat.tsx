import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Search, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

const categories = ['All', 'Food', 'Transport', 'Groceries', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Education'];

const allTransactions = [
  { id: 1, date: '2026-05-14', type: 'expense', category: 'Food', emoji: '🍔', note: 'Makan siang di Cafe', amount: 125000 },
  { id: 2, date: '2026-05-14', type: 'expense', category: 'Transport', emoji: '🚗', note: 'Isi bensin', amount: 200000 },
  { id: 3, date: '2026-05-13', type: 'income', category: 'Income', emoji: '💰', note: 'Gaji bulanan', amount: 15000000 },
  { id: 4, date: '2026-05-13', type: 'expense', category: 'Groceries', emoji: '🛒', note: 'Belanja bulanan', amount: 850000 },
  { id: 5, date: '2026-05-12', type: 'expense', category: 'Entertainment', emoji: '🎬', note: 'Netflix subscription', amount: 186000 },
  { id: 6, date: '2026-05-12', type: 'expense', category: 'Bills', emoji: '📱', note: 'Internet bill', amount: 350000 },
  { id: 7, date: '2026-05-11', type: 'expense', category: 'Shopping', emoji: '🛍️', note: 'Baju baru', amount: 450000 },
  { id: 8, date: '2026-05-11', type: 'expense', category: 'Bills', emoji: '📱', note: 'Pulsa & Data', amount: 150000 },
  { id: 9, date: '2026-05-10', type: 'expense', category: 'Transport', emoji: '🚗', note: 'Grab ke kantor', amount: 35000 },
  { id: 10, date: '2026-05-09', type: 'expense', category: 'Health', emoji: '🏥', note: 'Vitamin & supplement', amount: 250000 },
  { id: 11, date: '2026-05-08', type: 'expense', category: 'Groceries', emoji: '🛒', note: 'Sayuran & buah', amount: 120000 },
  { id: 12, date: '2026-05-06', type: 'expense', category: 'Shopping', emoji: '🛍️', note: 'Sepatu sneakers', amount: 750000 },
  { id: 13, date: '2026-05-05', type: 'expense', category: 'Food', emoji: '🍔', note: 'Breakfast', amount: 45000 },
  { id: 14, date: '2026-05-03', type: 'expense', category: 'Food', emoji: '🍔', note: 'Dinner dengan teman', amount: 250000 },
  { id: 15, date: '2026-05-01', type: 'income', category: 'Income', emoji: '💰', note: 'Freelance project', amount: 5000000 },
];

export default function Riwayat() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [transactionType, setTransactionType] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = allTransactions.filter((tx) => {
    const matchesCategory = selectedCategory === 'All' || tx.category === selectedCategory;
    const matchesType = transactionType === 'all' || tx.type === transactionType;
    const matchesSearch = tx.note.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesType && matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={transactionType === 'all' ? 'default' : 'outline'}
              onClick={() => setTransactionType('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              onClick={() => setTransactionType('income')}
              className="gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              Income
            </Button>
            <Button
              size="sm"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              onClick={() => setTransactionType('expense')}
              className="gap-1"
            >
              <TrendingDown className="w-3 h-3" />
              Expense
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold">{filteredTransactions.length}</span> transactions
            </p>
            <Button variant="ghost" size="sm" onClick={() => {
              setSelectedCategory('All');
              setTransactionType('all');
              setSearchQuery('');
            }}>
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-muted-foreground">Note</th>
                  <th className="text-right py-3 px-2 text-sm font-semibold text-muted-foreground">Amount</th>
                  <th className="text-center py-3 px-2 text-sm font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 text-sm">{formatDate(tx.date)}</td>
                    <td className="py-3 px-2">
                      {tx.type === 'income' ? (
                        <Badge className="bg-success text-success-foreground">Income</Badge>
                      ) : (
                        <Badge variant="outline">Expense</Badge>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tx.emoji}</span>
                        <span className="text-sm font-medium">{tx.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm">{tx.note}</td>
                    <td className="py-3 px-2 text-right">
                      <span
                        className={`font-['DM_Mono'] font-bold text-sm ${
                          tx.type === 'income' ? 'text-success' : 'text-foreground'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="lg:hidden space-y-3">
        {filteredTransactions.map((tx) => (
          <Card key={tx.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                    {tx.emoji}
                  </div>
                  <div>
                    <p className="font-semibold">{tx.note}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-['DM_Mono'] font-bold ${
                      tx.type === 'income' ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tx.type === 'income' ? (
                    <Badge className="bg-success text-success-foreground text-[10px]">Income</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Expense</Badge>
                  )}
                  <Badge variant="outline" className="text-[10px]">{tx.category}</Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-danger">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
