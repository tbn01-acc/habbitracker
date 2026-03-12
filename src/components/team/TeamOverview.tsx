import { motion } from 'framer-motion';
import { Users, Zap, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { TeamMember, Sprint, SprintTask } from '@/hooks/useTeam';

interface TeamOverviewProps {
  members: TeamMember[];
  activeSprint: Sprint | null;
  sprintTasks: SprintTask[];
}

export function TeamOverview({ members, activeSprint, sprintTasks }: TeamOverviewProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';

  const presenceColors: Record<string, string> = {
    focus: 'bg-green-500',
    online: 'bg-green-400',
    away: 'bg-yellow-500',
    offline: 'bg-muted-foreground/40',
  };

  const presenceLabels: Record<string, string> = {
    focus: isRu ? 'В фокусе' : 'Focused',
    online: isRu ? 'Онлайн' : 'Online',
    away: isRu ? 'Отошёл' : 'Away',
    offline: isRu ? 'Оффлайн' : 'Offline',
  };

  const weekProgress = activeSprint
    ? activeSprint.total_sp_planned > 0
      ? Math.round((activeSprint.total_sp_completed / activeSprint.total_sp_planned) * 100)
      : 0
    : 0;

  const doneCount = sprintTasks.filter(t => t.status === 'done').length;
  const totalCount = sprintTasks.length;

  const getTimeRemaining = () => {
    if (!activeSprint) return isRu ? 'Нет активного спринта' : 'No active sprint';
    const end = new Date(activeSprint.end_date);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return isRu ? 'Спринт завершён' : 'Sprint ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}${isRu ? 'д' : 'd'} ${hours}${isRu ? 'ч' : 'h'}`;
  };

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{isRu ? 'Участники' : 'Members'}</span>
              </div>
              <p className="text-2xl font-bold">{members.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">{isRu ? 'Осталось' : 'Remaining'}</span>
              </div>
              <p className="text-lg font-bold">{getTimeRemaining()}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">SP</span>
              </div>
              <p className="text-2xl font-bold">
                {activeSprint?.total_sp_completed || 0}
                <span className="text-sm text-muted-foreground font-normal">/{activeSprint?.total_sp_planned || 0}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">{isRu ? 'Задачи' : 'Tasks'}</span>
              </div>
              <p className="text-2xl font-bold">
                {doneCount}<span className="text-sm text-muted-foreground font-normal">/{totalCount}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Sprint progress */}
      {activeSprint && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>{activeSprint.title}</span>
                <Badge variant="outline" className="text-xs">{weekProgress}%</Badge>
              </CardTitle>
              {activeSprint.goal && (
                <p className="text-xs text-muted-foreground">{isRu ? 'Цель' : 'Goal'}: {activeSprint.goal}</p>
              )}
            </CardHeader>
            <CardContent className="pb-3">
              <Progress value={weekProgress} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Presence Widget */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isRu ? 'Статус присутствия' : 'Presence Status'}</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="flex flex-wrap gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(member.profile?.display_name || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${presenceColors[member.presence_status]}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground max-w-[60px] truncate text-center">
                    {member.profile?.display_name || 'User'}
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
