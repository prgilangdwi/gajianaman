import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { ChevronDown, Edit, Trash2, Target } from 'lucide-react';

const goalsData = [
  {
    id: 1,
    name: 'Liburan Bali',
    saved: 7500000,
    target: 10000000,
    deadline: '2026-12-31',
    color: '#10b981',
  },
  {
    id: 2,
    name: 'Dana Darurat',
    saved: 15000000,
    target: 30000000,
    deadline: '2027-06-30',
    color: '#3b82f6',
  },
  {
    id: 3,
    name: 'Laptop Baru',
    saved: 8000000,
    target: 15000000,
    deadline: '2026-08-31',
    color: '#f59e0b',
  },
  {
    id: 4,
    name: 'Renovasi Rumah',
    saved: 25000000,
    target: 50000000,
    deadline: '2027-12-31',
    color: '#8b5cf6',
  },
];

export default function Goals() {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const totalSaved = goalsData.reduce((sum, goal) => sum + goal.saved, 0);
  const totalTarget = goalsData.reduce((sum, goal) => sum + goal.target, 0);
  const achievedGoals = goalsData.filter((g) => g.saved >= g.target).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date('2026-05-14');
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-2xl">
              Rp {(totalSaved / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across all goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-['DM_Mono'] font-bold text-2xl">
              Rp {(totalTarget / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {((totalSaved / totalTarget) * 100).toFixed(0)}% achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Active Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{goalsData.length}</div>
            <p className="text-xs text-muted-foreground mt-2">{achievedGoals} completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goalsData.map((goal) => {
          const percentage = (goal.saved / goal.target) * 100;
          const remaining = goal.target - goal.saved;
          const daysRemaining = getDaysRemaining(goal.deadline);

          return (
            <Collapsible key={goal.id}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {daysRemaining > 0 ? `${daysRemaining} hari lagi` : 'Deadline terlewat'}
                      </Badge>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative h-32 w-32 mx-auto">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={goal.color}
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(percentage / 100) * 352} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="font-bold text-2xl" style={{ color: goal.color }}>
                          {percentage.toFixed(0)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Complete</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Saved</span>
                      <span className="font-['DM_Mono'] font-bold">
                        Rp {(goal.saved / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-['DM_Mono'] font-bold">
                        Rp {(goal.target / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-['DM_Mono'] font-bold" style={{ color: goal.color }}>
                        Rp {(remaining / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-semibold">{formatDate(goal.deadline)}</span>
                    </div>
                  </div>

                  <CollapsibleContent className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Goal Name</label>
                        <Input value={goal.name} readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Target</label>
                        <Input
                          value={`Rp ${goal.target.toLocaleString('id-ID')}`}
                          readOnly
                          className="font-['DM_Mono']"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Saved</label>
                        <Input
                          value={`Rp ${goal.saved.toLocaleString('id-ID')}`}
                          readOnly
                          className="font-['DM_Mono']"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-muted-foreground">Deadline</label>
                        <Input type="date" value={goal.deadline} readOnly />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-3 h-3 mr-2" />
                        Edit Goal
                      </Button>
                      <Button size="sm" variant="outline" className="text-danger hover:text-danger">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          );
        })}

        <Collapsible open={isAddFormOpen} onOpenChange={setIsAddFormOpen}>
          <CollapsibleTrigger asChild>
            <Card className="border-dashed border-2 hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div
                  className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4"
                >
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Add New Goal</h3>
                <p className="text-sm text-muted-foreground text-center">
                  Set a new savings goal to track your progress
                </p>
              </CardContent>
            </Card>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Create New Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Goal Name</label>
                    <Input placeholder="e.g., Dream Vacation" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Amount</label>
                    <Input placeholder="e.g., 20000000" type="number" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currently Saved</label>
                    <Input placeholder="e.g., 5000000" type="number" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium">Deadline</label>
                    <Input type="date" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">Create Goal</Button>
                  <Button variant="outline" onClick={() => setIsAddFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
