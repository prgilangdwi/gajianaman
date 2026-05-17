import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { ChevronDown, Edit, Trash2 } from 'lucide-react';

const budgetData = [
  { id: 'food', emoji: '🍔', name: 'Food', budget: 3000000, actual: 2500000, status: 'safe' },
  { id: 'transport', emoji: '🚗', name: 'Transport', budget: 1500000, actual: 1200000, status: 'safe' },
  { id: 'groceries', emoji: '🛒', name: 'Groceries', budget: 2000000, actual: 1800000, status: 'safe' },
  { id: 'shopping', emoji: '🛍️', name: 'Shopping', budget: 1200000, actual: 1500000, status: 'over' },
  { id: 'bills', emoji: '📱', name: 'Bills', budget: 1000000, actual: 800000, status: 'safe' },
  { id: 'health', emoji: '🏥', name: 'Health', budget: 500000, actual: 450000, status: 'safe' },
  { id: 'entertainment', emoji: '🎬', name: 'Entertainment', budget: 800000, actual: 720000, status: 'warning' },
  { id: 'education', emoji: '📚', name: 'Education', budget: 1000000, actual: 350000, status: 'safe' },
];

export default function Budget() {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const totalBudget = budgetData.reduce((sum, cat) => sum + cat.budget, 0);
  const totalActual = budgetData.reduce((sum, cat) => sum + cat.actual, 0);
  const totalRemaining = totalBudget - totalActual;

  const safeCount = budgetData.filter((b) => b.status === 'safe').length;
  const warningCount = budgetData.filter((b) => b.status === 'warning').length;
  const overCount = budgetData.filter((b) => b.status === 'over').length;

  const getStatusBadge = (status: string, percentage: number) => {
    if (status === 'over') {
      return <Badge variant="destructive">Lewat</Badge>;
    } else if (status === 'warning' || percentage >= 90) {
      return <Badge className="bg-warning text-warning-foreground">Hampir</Badge>;
    } else {
      return <Badge className="bg-success text-success-foreground">Aman</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-2xl">
              Rp {(totalBudget / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-2">For this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-2xl">
              Rp {(totalActual / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {((totalActual / totalBudget) * 100).toFixed(0)}% of budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-2xl">
              Rp {(totalRemaining / 1000000).toFixed(1)}M
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-success text-success-foreground text-[10px]">{safeCount} Aman</Badge>
              {warningCount > 0 && (
                <Badge className="bg-warning text-warning-foreground text-[10px]">{warningCount} Hampir</Badge>
              )}
              {overCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">{overCount} Lewat</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetData.map((item) => {
              const percentage = (item.actual / item.budget) * 100;
              const remaining = item.budget - item.actual;
              const isOver = percentage > 100;

              return (
                <Collapsible key={item.id}>
                  <div className="space-y-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{item.emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{item.name}</h4>
                            {getStatusBadge(item.status, percentage)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-['DM_Mono']">
                              Rp {item.actual.toLocaleString('id-ID')}
                            </span>{' '}
                            dari{' '}
                            <span className="font-['DM_Mono']">Rp {item.budget.toLocaleString('id-ID')}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p
                            className={`font-['DM_Mono'] font-bold ${
                              isOver ? 'text-danger' : 'text-success'
                            }`}
                          >
                            {isOver ? '+' : ''}Rp {Math.abs(remaining).toLocaleString('id-ID')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isOver ? 'Over budget' : 'Remaining'}
                          </p>
                        </div>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>

                    <Progress
                      value={Math.min(percentage, 100)}
                      className="h-3"
                      style={
                        {
                          '--progress-background': isOver
                            ? '#ef4444'
                            : percentage >= 90
                            ? '#f59e0b'
                            : '#10b981',
                        } as any
                      }
                    />

                    <CollapsibleContent className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Budget</label>
                          <Input
                            type="text"
                            value={`Rp ${item.budget.toLocaleString('id-ID')}`}
                            readOnly
                            className="font-['DM_Mono']"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Actual</label>
                          <Input
                            type="text"
                            value={`Rp ${item.actual.toLocaleString('id-ID')}`}
                            readOnly
                            className="font-['DM_Mono']"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-3 h-3 mr-2" />
                          Edit Budget
                        </Button>
                        <Button size="sm" variant="outline" className="text-danger hover:text-danger">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Collapsible open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full border-dashed border-2 h-16">
            + Add New Budget Category
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Add New Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Name</label>
                  <Input placeholder="e.g., Travel" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Budget Amount</label>
                  <Input placeholder="e.g., 2000000" type="number" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1">Save Budget</Button>
                <Button variant="outline" onClick={() => setIsAddFormOpen(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
