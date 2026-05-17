import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const kpiData = [
  {
    title: 'Total Income',
    value: 'Rp 15.000.000',
    change: '+12.5%',
    trend: 'up' as const,
    icon: TrendingUp,
  },
  {
    title: 'Total Expenses',
    value: 'Rp 8.750.000',
    change: '-3.2%',
    trend: 'down' as const,
    icon: TrendingDown,
  },
  {
    title: 'Net Balance',
    value: 'Rp 6.250.000',
    change: '+18.4%',
    trend: 'up' as const,
    icon: TrendingUp,
  },
  {
    title: 'Transactions',
    value: '142',
    change: '+8.1%',
    trend: 'up' as const,
    icon: ArrowUpRight,
  },
];

const categoryData = [
  { name: 'Food', emoji: '🍔', spent: 2500000, budget: 3000000, color: '#f59e0b' },
  { name: 'Transport', emoji: '🚗', spent: 1200000, budget: 1500000, color: '#3b82f6' },
  { name: 'Groceries', emoji: '🛒', spent: 1800000, budget: 2000000, color: '#10b981' },
  { name: 'Shopping', emoji: '🛍️', spent: 1500000, budget: 1200000, color: '#ec4899' },
  { name: 'Bills', emoji: '📱', spent: 800000, budget: 1000000, color: '#8b5cf6' },
  { name: 'Health', emoji: '🏥', spent: 450000, budget: 500000, color: '#ef4444' },
];

const weeklyData = [
  { day: 'Sen', amount: 250000 },
  { day: 'Sel', amount: 420000 },
  { day: 'Rab', amount: 180000 },
  { day: 'Kam', amount: 580000 },
  { day: 'Jum', amount: 320000 },
  { day: 'Sab', amount: 750000 },
  { day: 'Min', amount: 450000 },
];

const recentTransactions = [
  { id: 1, emoji: '🍔', description: 'Makan siang di Cafe', amount: -125000, time: '2 jam lalu', category: 'Food' },
  { id: 2, emoji: '🚗', description: 'Isi bensin', amount: -200000, time: '5 jam lalu', category: 'Transport' },
  { id: 3, emoji: '💰', description: 'Gaji bulanan', amount: 15000000, time: '1 hari lalu', category: 'Income' },
  { id: 4, emoji: '🛒', description: 'Belanja bulanan', amount: -850000, time: '1 hari lalu', category: 'Groceries' },
  { id: 5, emoji: '🎬', description: 'Netflix subscription', amount: -186000, time: '2 hari lalu', category: 'Entertainment' },
  { id: 6, emoji: '📱', description: 'Pulsa & Data', amount: -150000, time: '3 hari lalu', category: 'Bills' },
];

const savingsGoals = [
  { name: 'Liburan Bali', saved: 7500000, target: 10000000, color: '#10b981' },
  { name: 'Dana Darurat', saved: 15000000, target: 30000000, color: '#3b82f6' },
  { name: 'Laptop Baru', saved: 8000000, target: 15000000, color: '#f59e0b' },
];

const donutData = categoryData.map((cat) => ({ name: cat.name, value: cat.spent, color: cat.color }));

export default function Overview() {
  const totalExpenses = categoryData.reduce((sum, cat) => sum + cat.spent, 0);
  const savings = 4500000;
  const investment = 1500000;
  const totalIncome = 15000000;
  const remaining = totalIncome - totalExpenses - savings - investment;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => {
          const Icon = kpi.icon;
          const TrendIcon = kpi.trend === 'up' ? ArrowUpRight : ArrowDownRight;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-['DM_Mono'] font-bold text-2xl">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon
                    className={`h-3 w-3 ${kpi.trend === 'up' ? 'text-success' : 'text-danger'}`}
                  />
                  <span
                    className={`text-xs font-semibold ${
                      kpi.trend === 'up' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {kpi.change}
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Category Progress & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Category Spending</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.map((category) => {
              const percentage = (category.spent / category.budget) * 100;
              const isOverBudget = percentage > 100;
              return (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.emoji}</span>
                      <span className="text-sm font-semibold">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-['DM_Mono'] font-bold">
                        Rp {(category.spent / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-muted-foreground">
                        / Rp {(category.budget / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress value={Math.min(percentage, 100)} className="h-2" style={{ '--progress-background': category.color } as any} />
                    {isOverBudget && (
                      <div className="absolute -top-1 right-0">
                        <Badge variant="destructive" className="text-[10px] h-5">Lewat</Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
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
                  <Tooltip
                    formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`}
                  />
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
      </div>

      {/* 7-Day Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val / 1000}K`} />
              <Tooltip
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Spent']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget Alert */}
      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h4 className="font-semibold text-warning-foreground">Budget Alert</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Shopping category melebihi budget sebesar Rp 300.000. Pertimbangkan untuk mengurangi pengeluaran bulan ini.
          </p>
        </div>
      </div>

      {/* Recent Transactions & Savings Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl">
                      {transaction.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{transaction.time}</p>
                    </div>
                  </div>
                  <p
                    className={`font-['DM_Mono'] font-bold text-sm ${
                      transaction.amount > 0 ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {transaction.amount > 0 ? '+' : ''}
                    Rp {Math.abs(transaction.amount).toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Savings Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {savingsGoals.map((goal) => {
                const percentage = (goal.saved / goal.target) * 100;
                return (
                  <div key={goal.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{goal.name}</h4>
                      <p className="text-sm font-semibold" style={{ color: goal.color }}>
                        {percentage.toFixed(0)}%
                      </p>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full transition-all"
                        style={{ width: `${percentage}%`, backgroundColor: goal.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-['DM_Mono'] text-muted-foreground">
                        Rp {(goal.saved / 1000000).toFixed(1)}M
                      </p>
                      <p className="text-xs font-['DM_Mono'] text-muted-foreground">
                        Rp {(goal.target / 1000000).toFixed(0)}M
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Allocation */}
      <Card>
        <CardHeader>
          <CardTitle>Income Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-1 h-8 rounded-full overflow-hidden">
              <div
                className="flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${(totalExpenses / totalIncome) * 100}%`, backgroundColor: '#ef4444' }}
              >
                {((totalExpenses / totalIncome) * 100).toFixed(0)}%
              </div>
              <div
                className="flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${(savings / totalIncome) * 100}%`, backgroundColor: '#10b981' }}
              >
                30%
              </div>
              <div
                className="flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${(investment / totalIncome) * 100}%`, backgroundColor: '#3b82f6' }}
              >
                10%
              </div>
              <div
                className="flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${(remaining / totalIncome) * 100}%`, backgroundColor: '#94a3b8' }}
              >
                {((remaining / totalIncome) * 100).toFixed(0)}%
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <span className="text-xs text-muted-foreground">Expenses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <span className="text-xs text-muted-foreground">Savings (30%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                <span className="text-xs text-muted-foreground">Investment (10%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#94a3b8]" />
                <span className="text-xs text-muted-foreground">Remaining</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
