import { motion } from 'framer-motion';
import { Users, Zap, TrendingUp, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { DemoData } from '@/lib/demo/testData';

interface DemoTeamOverviewProps {
  data: DemoData;
}

export function DemoTeamOverview({ data }: DemoTeamOverviewProps) {
  const { sprint, members, tasks } = data;
  const weekProgress = sprint.totalSP > 0 ? Math.round((sprint.completedSP / sprint.totalSP) * 100) : 0;
  const doneCount = tasks.filter(t => t.status === 'done').length;

  const end = new Date(sprint.endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

  const statusCounts = members.reduce((acc, m) => {
    const key = m.status.includes('🟢') ? 'online' : m.status.includes('🧘') ? 'focus' : m.status.includes('🟡') ? 'away' : 'busy';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Users, color: 'text-primary', label: 'Участники', value: members.length, sub: `${statusCounts.online || 0} онлайн` },
          { icon: Clock, color: 'text-amber-500', label: 'Осталось', value: `${daysLeft}д`, sub: sprint.endDate },
          { icon: Zap, color: 'text-yellow-500', label: 'SP', value: `${sprint.completedSP}/${sprint.totalSP}`, sub: `${weekProgress}%` },
          { icon: TrendingUp, color: 'text-green-500', label: 'Задачи', value: `${doneCount}/${tasks.length}`, sub: `${Math.round((doneCount / tasks.length) * 100)}% done` },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50 bg-card/80 backdrop-blur">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-2xl font-bold">{item.value}</p>
                <span className="text-[10px] text-muted-foreground">{item.sub}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Sprint progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {sprint.title}
              </div>
              <Badge variant="outline" className="text-xs">{weekProgress}%</Badge>
            </CardTitle>
            <p className="text-xs text-muted-foreground">{sprint.goal}</p>
          </CardHeader>
          <CardContent className="pb-3">
            <Progress value={weekProgress} className="h-2" />
          </CardContent>
        </Card>
      </motion.div>

      {/* Team presence */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Статус команды</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-wrap gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {member.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                      member.status.includes('🟢') ? 'bg-green-500' :
                      member.status.includes('🧘') ? 'bg-blue-500' :
                      member.status.includes('🟡') ? 'bg-yellow-500' : 'bg-purple-500'
                    }`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground max-w-[60px] truncate text-center">
                    {member.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
