import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Star, Zap, Target, Trophy, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from '@/contexts/LanguageContext';
import { DEMO_DATA } from '@/lib/demo/testData';

export default function TeamMember() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';

  const member = DEMO_DATA.members.find(m => m.id === memberId);
  const memberTasks = DEMO_DATA.tasks.filter(t => t.user === member?.name);

  if (!member) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{isRu ? 'Участник не найден' : 'Member not found'}</p>
          <Button onClick={() => navigate('/team')} className="mt-4">{isRu ? 'Назад' : 'Back'}</Button>
        </div>
      </div>
    );
  }

  const completedTasks = memberTasks.filter(t => t.status === 'done').length;
  const totalSP = memberTasks.reduce((s, t) => s + t.sp, 0);
  const completedSP = memberTasks.filter(t => t.status === 'done').reduce((s, t) => s + t.sp, 0);

  const RANK_COLORS: Record<string, string> = {
    Guru: 'text-amber-500',
    Master: 'text-purple-500',
    Expert: 'text-blue-500',
    Specialist: 'text-green-500',
  };

  const initials = member.name.split(' ').map(w => w[0]).join('');

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">{isRu ? 'Профиль участника' : 'Member Profile'}</h1>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-primary/5 font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg font-bold">{member.name}</h2>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-xs ${RANK_COLORS[member.rank] || ''}`}>
                      <Trophy className="w-3 h-3 mr-1" /> {member.rank}
                    </Badge>
                    <span className="text-xs">{member.status}</span>
                  </div>
                </div>
              </div>

              {/* XP Progress */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500" /> XP
                  </span>
                  <span className="text-sm font-bold text-amber-500">{member.xp.toLocaleString()}</span>
                </div>
                <Progress value={Math.min(100, (member.xp / 20000) * 100)} className="h-1.5" />
              </div>

              {/* Team */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>🏢 {DEMO_DATA.teamName}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'SP', value: member.sp, icon: <Zap className="w-4 h-4 text-amber-500" /> },
              { label: isRu ? 'Задач' : 'Tasks', value: memberTasks.length, icon: <Target className="w-4 h-4 text-blue-500" /> },
              { label: isRu ? 'Готово' : 'Done', value: completedTasks, icon: <CheckCircle2 className="w-4 h-4 text-green-500" /> },
              { label: isRu ? 'SP готово' : 'SP Done', value: completedSP, icon: <Star className="w-4 h-4 text-purple-500" /> },
            ].map((stat, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-2.5 text-center">
                  <div className="flex justify-center mb-1">{stat.icon}</div>
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Tasks */}
        {memberTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {isRu ? 'Задачи в спринте' : 'Sprint Tasks'}
              </h2>
              {memberTasks.map((task, i) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{task.title}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{task.sp} SP</Badge>
                  <Badge
                    variant={task.status === 'done' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}
                    className="text-[10px]"
                  >
                    {task.status === 'done' ? (isRu ? 'Готово' : 'Done') :
                     task.status === 'in_progress' ? (isRu ? 'В работе' : 'In Progress') :
                     task.status === 'review' ? (isRu ? 'Ревью' : 'Review') :
                     (isRu ? 'Бэклог' : 'Backlog')}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
