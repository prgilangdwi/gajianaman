import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, Receipt } from 'lucide-react';

const kpiData = [
  { title: 'Total Expenses', value: 'Rp 8.750.000', description: 'This month' },
  { title: 'Top Category', value: 'Food', description: 'Rp 2.500.000' },
  { title: 'Average/Day', value: 'Rp 291.667', description: 'Based on 30 days' },
];

const categoryData = [
  {
    id: 'food',
    name: 'Food',
    emoji: '🍔',
    spent: 2500000,
    budget: 3000000,
    color: '#f59e0b',
    transactions: [
      { id: 1, date: '2026-05-14', description: 'Makan siang di Cafe', amount: 125000 },
      { id: 2, date: '2026-05-13', description: 'Breakfast', amount: 45000 },
      { id: 3, date: '2026-05-12', description: 'Dinner dengan teman', amount: 250000 },
    ],
  },
  {
    id: 'transport',
    name: 'Transport',
    emoji: '🚗',
    spent: 1200000,
    budget: 1500000,
    color: '#3b82f6',
    transactions: [
      { id: 1, date: '2026-05-14', description: 'Isi bensin', amount: 200000 },
      { id: 2, date: '2026-05-10', description: 'Grab ke kantor', amount: 35000 },
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries',
    emoji: '🛒',
    spent: 1800000,
    budget: 2000000,
    color: '#10b981',
    transactions: [
      { id: 1, date: '2026-05-13', description: 'Belanja bulanan', amount: 850000 },
      { id: 2, date: '2026-05-08', description: 'Sayuran & buah', amount: 120000 },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    emoji: '🛍️',
    spent: 1500000,
    budget: 1200000,
    color: '#ec4899',
    transactions: [
      { id: 1, date: '2026-05-11', description: 'Baju baru', amount: 450000 },
      { id: 2, date: '2026-05-06', description: 'Sepatu sneakers', amount: 750000 },
    ],
  },
  {
    id: 'bills',
    name: 'Bills',
    emoji: '📱',
    spent: 800000,
    budget: 1000000,
    color: '#8b5cf6',
    transactions: [
      { id: 1, date: '2026-05-12', description: 'Internet bill', amount: 350000 },
      { id: 2, date: '2026-05-11', description: 'Pulsa & Data', amount: 150000 },
    ],
  },
  {
    id: 'health',
    name: 'Health',
    emoji: '🏥',
    spent: 450000,
    budget: 500000,
    color: '#ef4444',
    transactions: [
      { id: 1, date: '2026-05-09', description: 'Vitamin & supplement', amount: 250000 },
    ],
  },
];

export default function Pengeluaran() {
  const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.spent, 0);
  const donutData = categoryData.map((cat) => ({ name: cat.name, value: cat.spent, color: cat.color }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">{kpi.title}</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-['DM_Mono'] font-bold text-2xl">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-2">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-['DM_Mono'] font-bold text-xl">
                    Rp {(totalExpenses / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((category) => {
                const percentage = (category.spent / category.budget) * 100;
                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.emoji}</span>
                        <span className="text-sm font-semibold">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-['DM_Mono'] font-bold">
                          Rp {(category.spent / 1000).toFixed(0)}K
                        </p>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-2"
                      style={{ '--progress-background': category.color } as any}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {categoryData.map((category) => (
              <AccordionItem key={category.id} value={category.id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.emoji}</span>
                      <div>
                        <p className="font-semibold">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{category.transactions.length} transactions</p>
                      </div>
                    </div>
                    <p className="font-['DM_Mono'] font-bold" style={{ color: category.color }}>
                      Rp {category.spent.toLocaleString('id-ID')}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {category.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Receipt className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">{tx.date}</p>
                          </div>
                        </div>
                        <p className="font-['DM_Mono'] font-semibold text-sm">
                          Rp {tx.amount.toLocaleString('id-ID')}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {categoryData.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <TrendingDown className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2">Belum ada pengeluaran</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Mulai catat pengeluaran kamu dengan klik tombol + di pojok kanan bawah
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
