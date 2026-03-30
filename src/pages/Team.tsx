import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Zap, LayoutDashboard, Columns3, Trophy, Plus, 
  FolderKanban, Building2, Target, ArrowLeft, Compass, FlaskConical
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

import { useTranslation } from '@/contexts/LanguageContext';
import { useTeam } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { useTeamExperience } from '@/hooks/useTeamExperience';
import { TeamOverview } from '@/components/team/TeamOverview';
import { SprintBurndownChart } from '@/components/team/SprintBurndownChart';
import { SprintKanban } from '@/components/team/SprintKanban';
import { SprintRetrospective } from '@/components/team/SprintRetrospective';
import { TeamMembers } from '@/components/team/TeamMembers';
import { CreateTeamDialog } from '@/components/team/CreateTeamDialog';
import { CreateSprintDialog } from '@/components/team/CreateSprintDialog';
import { DemoModeBanner, EmptyStateDemoBanner } from '@/components/team/DemoModeBanner';
import { DemoTeamOverview } from '@/components/team/DemoTeamOverview';
import { DemoBurndownChart } from '@/components/team/DemoBurndownChart';
import { DemoKanban } from '@/components/team/DemoKanban';
import { RetroPodium } from '@/components/team/RetroPodium';
import { TeamPublicProfile } from '@/components/team/TeamPublicProfile';
import { TeamWorkspaces } from '@/components/team/TeamWorkspaces';

function SkeletonTeam() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-[200px] rounded-xl" />
      </div>
    </div>
  );
}

// Demo mode view extracted
function DemoView({ experience, isRu }: { experience: any; isRu: boolean }) {
  const navigate = useNavigate();
  const isTest = experience.mode === 'test';
  const d = experience.data;

  const TEAM_TYPE_LABELS: Record<string, string> = {
    office: isRu ? 'Офис' : 'Office',
    remote: isRu ? 'Удалённо' : 'Remote',
    hybrid: isRu ? 'Гибрид' : 'Hybrid',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AnimatePresence>
        <DemoModeBanner
          mode={experience.mode}
          onExit={experience.exitMode}
          onSwitchToTest={experience.switchToTest}
          onReset={experience.resetTest}
        />
      </AnimatePresence>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">{d.teamName}</h1>
            <p className="text-xs text-muted-foreground">{d.sprint.title}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={() => navigate('/team-focus')} className="gap-1">
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Фокус' : 'Focus'}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate(`/team/sprint/${d.sprint.id}`)} className="gap-1">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Спринт' : 'Sprint'}</span>
            </Button>
            <div className="flex items-center gap-1.5 text-xs font-medium ml-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{d.sprint.completedSP}/{d.sprint.totalSP} SP</span>
            </div>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full grid grid-cols-7 h-9">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="text-xs gap-1">
              <FolderKanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Проекты' : 'Projects'}</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs gap-1">
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Канбан' : 'Kanban'}</span>
            </TabsTrigger>
            <TabsTrigger value="retro" className="text-xs gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Ретро' : 'Retro'}</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Состав' : 'Team'}</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Профиль' : 'Profile'}</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs gap-1">
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Тест' : 'Test'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <DemoTeamOverview data={d} />
            <DemoBurndownChart data={d} />
          </TabsContent>

          {/* Projects / Workspaces */}
          <TabsContent value="workspaces">
            <div className="space-y-4">
              {d.workspaces?.map((ws: any, wi: number) => (
                <motion.div key={ws.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.05 }}>
                  <Card className="border-border/50 bg-card/80 backdrop-blur cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/team/workspace/${ws.id}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{ws.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold">{ws.name}</h3>
                          {ws.description && <p className="text-[10px] text-muted-foreground">{ws.description}</p>}
                        </div>
                        <Badge variant="secondary" className="text-[10px]">{ws.projects.length} {isRu ? 'проектов' : 'projects'}</Badge>
                      </div>
                      <div className="space-y-2">
                        {ws.projects.map((proj: any) => (
                          <div key={proj.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30 cursor-pointer hover:bg-muted/50 transition-colors" onClick={(e) => { e.stopPropagation(); navigate(`/team/project/${proj.id}`); }}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium truncate">{proj.name}</span>
                                <Badge variant={proj.status === 'completed' ? 'default' : proj.status === 'paused' ? 'secondary' : 'outline'} className="text-[10px] h-4 px-1.5">
                                  {proj.status === 'active' ? (isRu ? 'Активен' : 'Active') : proj.status === 'completed' ? (isRu ? 'Завершён' : 'Done') : (isRu ? 'Пауза' : 'Paused')}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Progress value={proj.progress} className="h-1.5 flex-1" />
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{proj.completedTasks}/{proj.tasksCount}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Kanban */}
          <TabsContent value="kanban">
            <DemoKanban data={d} onUpdateStatus={experience.updateTaskStatus} isReadOnly={!isTest} />
          </TabsContent>

          {/* Retro */}
          <TabsContent value="retro">
            <RetroPodium members={d.members} onAward={experience.awardMember} isTest={isTest} />
          </TabsContent>

          {/* Members */}
          <TabsContent value="members">
            <div className="space-y-2">
              {d.members.map((m: any, i: number) => (
                <motion.div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => navigate(`/team/member/${m.id}`)}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                    {m.name.split(' ').map((w: string) => w[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{m.name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.role}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] h-5">{m.rank}</Badge>
                  <span className="text-[10px]">{m.status}</span>
                  <span className="text-[10px] text-yellow-500 font-medium">{m.xp.toLocaleString()} XP</span>
                  {isTest && (
                    <button className="text-[10px] text-yellow-500 hover:text-yellow-400" onClick={() => experience.awardMember(m.id)}>⭐</button>
                  )}
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            {d.teamProfile && (
              <div className="space-y-4">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-border/50 bg-card/80 backdrop-blur">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold">{d.teamName}</h2>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px]">
                              {TEAM_TYPE_LABELS[d.teamProfile.team_type] || d.teamProfile.team_type}
                            </Badge>
                            {d.teamProfile.location && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                📍 {d.teamProfile.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{d.teamProfile.description}</p>
                      {d.teamProfile.website && (
                        <div className="flex items-center gap-1.5 text-xs text-primary">
                          🌐 {d.teamProfile.website}
                        </div>
                      )}
                      {d.teamProfile.vacancies && (
                        <div className="p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
                          <p className="text-[10px] font-medium text-green-600 dark:text-green-400 mb-0.5">
                            {isRu ? '🔥 Открытые вакансии' : '🔥 Open positions'}
                          </p>
                          <p className="text-xs">{d.teamProfile.vacancies}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                {d.teamProfile.stats && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: isRu ? 'Спринтов' : 'Sprints', value: d.teamProfile.stats.totalSprints, icon: '🏁' },
                        { label: isRu ? 'Ср. Velocity' : 'Avg Velocity', value: `${d.teamProfile.stats.avgVelocity} SP`, icon: '⚡' },
                        { label: isRu ? 'Общий XP' : 'Total XP', value: d.teamProfile.stats.totalXP.toLocaleString(), icon: '✨' },
                        { label: isRu ? 'Успешность' : 'Success Rate', value: `${d.teamProfile.stats.successRate}%`, icon: '🎯' },
                      ].map((stat, i) => (
                        <Card key={i} className="border-border/50 bg-card/80">
                          <CardContent className="p-3 text-center">
                            <span className="text-lg">{stat.icon}</span>
                            <p className="text-lg font-bold mt-1">{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                )}
                <Button variant="outline" className="w-full" onClick={() => navigate('/team/profile/demo')}>
                  {isRu ? 'Открыть полный профиль' : 'Open Full Profile'}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Test tab — entry point back to demo/test selection */}
          <TabsContent value="test">
            <div className="text-center py-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-sm text-muted-foreground mb-4">
                  {experience.mode === 'demo'
                    ? (isRu ? 'Вы в режиме просмотра. Переключитесь на Тест-драйв для редактирования.' : 'You are in view mode. Switch to Test Drive to edit.')
                    : (isRu ? 'Вы в режиме Песочницы. Все изменения локальные.' : 'You are in Sandbox mode. All changes are local.')}
                </p>
                <div className="flex gap-2 justify-center">
                  {experience.mode === 'demo' && (
                    <Button size="sm" onClick={experience.switchToTest}>
                      {isRu ? '🧪 Тест-драйв' : '🧪 Test Drive'}
                    </Button>
                  )}
                  {experience.mode === 'test' && (
                    <Button size="sm" variant="outline" onClick={experience.resetTest}>
                      {isRu ? '🔄 Сбросить данные' : '🔄 Reset Data'}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={experience.exitMode}>
                    {isRu ? 'Выйти' : 'Exit'}
                  </Button>
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const {
    team, members, sprints, activeSprint, sprintTasks, sprintParticipants,
    dailyStats, feedback, loading,
    createTeam, createSprint, addSprintTask, updateTaskStatus,
    finishSprint, submitFeedback, joinTeam, inviteMember,
  } = useTeam();

  const experience = useTeamExperience();

  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [createSprintOpen, setCreateSprintOpen] = useState(false);

  if (loading || experience.switching) return <SkeletonTeam />;

  if (experience.mode !== 'real' && experience.data) {
    return <DemoView experience={experience} isRu={isRu} />;
  }

  // No team — show full interface with limited content and Test tab as default
  if (!team) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold">{isRu ? 'Командная работа' : 'Teamwork'}</h1>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/team-focus')} className="gap-1">
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Фокус' : 'Focus'}</span>
            </Button>
          </div>

          {/* Main Tabs — default to test */}
          <Tabs defaultValue="test" className="space-y-4">
            <TabsList className="w-full grid grid-cols-7 h-9">
              <TabsTrigger value="overview" className="text-xs gap-1" disabled>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
              </TabsTrigger>
              <TabsTrigger value="workspaces" className="text-xs gap-1" disabled>
                <FolderKanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Проекты' : 'Projects'}</span>
              </TabsTrigger>
              <TabsTrigger value="kanban" className="text-xs gap-1" disabled>
                <Columns3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Канбан' : 'Kanban'}</span>
              </TabsTrigger>
              <TabsTrigger value="retro" className="text-xs gap-1" disabled>
                <Trophy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Ретро' : 'Retro'}</span>
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs gap-1" disabled>
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Состав' : 'Team'}</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs gap-1" disabled>
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Профиль' : 'Profile'}</span>
              </TabsTrigger>
              <TabsTrigger value="test" className="text-xs gap-1">
                <FlaskConical className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Тест' : 'Test'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="test">
              <div className="text-center py-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Users className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">{isRu ? 'Командная работа' : 'Teamwork'}</h2>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {isRu
                      ? 'Создайте команду или присоединитесь по коду приглашения, чтобы запускать спринты, отслеживать прогресс и зарабатывать XP вместе.'
                      : 'Create a team or join by invite code to launch sprints, track progress and earn XP together.'}
                  </p>
                  <Button onClick={() => setCreateTeamOpen(true)} size="lg" className="w-full max-w-md mb-4">
                    <Users className="w-5 h-5 mr-2" />
                    {isRu ? 'Начать' : 'Get Started'}
                  </Button>
                  <div className="bg-card border border-border rounded-xl p-4 max-w-md mx-auto">
                    <h3 className="text-sm font-semibold mb-2">
                      {isRu ? 'Посмотрите, что сможет ВАША команда!' : 'See what YOUR team can do!'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {isRu
                        ? 'Загляните внутрь готовой команды из 12 специалистов. Канбан-доска, Burndown-чарт, пьедестал почёта и 24 задачи — всё работает.'
                        : 'Take a look inside a ready-made team of 12 specialists. Kanban board, Burndown chart, Hall of Fame and 24 tasks — everything works.'}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={experience.startDemo}>
                        {isRu ? '👀 Демо' : '👀 Demo'}
                      </Button>
                      <Button size="sm" onClick={experience.startTest}>
                        {isRu ? '🧪 Тест' : '🧪 Test'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>

          <CreateTeamDialog open={createTeamOpen} onOpenChange={setCreateTeamOpen} onCreateTeam={createTeam} onJoinTeam={joinTeam} />
        </div>
      </div>
    );
  }

  // Real team view
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const isOwner = user?.id === team.owner_id;
  const totalSP = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
  const completedSP = sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points || 0), 0);
  const sprintProgress = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0;
  const activeTasks = sprintTasks.filter(t => t.status !== 'done').length;
  const doneTasks = sprintTasks.filter(t => t.status === 'done').length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{team.name}</h1>
            {team.description && (
              <p className="text-xs text-muted-foreground truncate">{team.description}</p>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => navigate('/team-focus')} className="gap-1">
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Фокус' : 'Focus'}</span>
            </Button>
            {isOwner && !activeSprint && (
              <Button size="sm" onClick={() => setCreateSprintOpen(true)}>
                <Zap className="w-4 h-4 mr-1" />
                {isRu ? 'Спринт' : 'Sprint'}
              </Button>
            )}
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold">{members.length}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Участники' : 'Members'}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold">{sprints.length}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Спринты' : 'Sprints'}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-green-500">{doneTasks}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Готово' : 'Done'}</div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-amber-500">{activeTasks}</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'В работе' : 'Active'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sprint Progress Banner */}
        {activeSprint && (
          <Card className="mb-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold">{activeSprint.title}</span>
                </div>
                <Badge variant="outline" className="text-xs">{completedSP}/{totalSP} SP</Badge>
              </div>
              <Progress value={sprintProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full grid grid-cols-7 h-9">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="text-xs gap-1">
              <FolderKanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Проекты' : 'Projects'}</span>
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs gap-1">
              <Columns3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Канбан' : 'Kanban'}</span>
            </TabsTrigger>
            <TabsTrigger value="retro" className="text-xs gap-1">
              <Trophy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Ретро' : 'Retro'}</span>
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs gap-1">
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Состав' : 'Team'}</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Профиль' : 'Profile'}</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs gap-1">
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Тест' : 'Test'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <TeamOverview members={members} activeSprint={activeSprint} sprintTasks={sprintTasks} />
            <SprintBurndownChart sprint={activeSprint} dailyStats={dailyStats} />
          </TabsContent>

          <TabsContent value="workspaces">
            <TeamWorkspaces teamId={team.id} isOwner={isOwner} />
          </TabsContent>

          <TabsContent value="kanban">
            {activeSprint ? (
              <SprintKanban
                tasks={sprintTasks}
                members={members}
                onUpdateStatus={updateTaskStatus}
                onAddTask={addSprintTask}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Columns3 className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  {isRu ? 'Запустите спринт, чтобы использовать Канбан-доску' : 'Start a sprint to use the Kanban board'}
                </p>
                {isOwner && (
                  <Button size="sm" onClick={() => setCreateSprintOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRu ? 'Создать спринт' : 'Create Sprint'}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="retro">
            <SprintRetrospective
              sprint={activeSprint}
              completedSprints={completedSprints}
              participants={sprintParticipants}
              tasks={sprintTasks}
              feedback={feedback}
              onFinishSprint={finishSprint}
              onSubmitFeedback={submitFeedback}
            />
          </TabsContent>

          <TabsContent value="members">
            <TeamMembers team={team} members={members} onInviteMember={inviteMember} />
          </TabsContent>

          <TabsContent value="profile">
            <TeamPublicProfile
              teamId={team.id}
              teamName={team.name}
              isOwner={isOwner}
              onUpdate={() => {}}
            />
          </TabsContent>

          <TabsContent value="test">
            <div className="text-center py-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Users className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">{isRu ? 'Командная работа' : 'Teamwork'}</h2>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  {isRu
                    ? 'Создайте команду или присоединитесь по коду приглашения, чтобы запускать спринты, отслеживать прогресс и зарабатывать XP вместе.'
                    : 'Create a team or join by invite code to launch sprints, track progress and earn XP together.'}
                </p>
                <div className="bg-card border border-border rounded-xl p-4 max-w-md mx-auto">
                  <h3 className="text-sm font-semibold mb-2">
                    {isRu ? 'Посмотрите, что сможет ВАША команда!' : 'See what YOUR team can do!'}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {isRu
                      ? 'Загляните внутрь готовой команды из 12 специалистов. Канбан-доска, Burndown-чарт, пьедестал почёта и 24 задачи — всё работает.'
                      : 'Take a look inside a ready-made team of 12 specialists. Kanban board, Burndown chart, Hall of Fame and 24 tasks — everything works.'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={experience.startDemo}>
                      {isRu ? '👀 Демо' : '👀 Demo'}
                    </Button>
                    <Button size="sm" onClick={experience.startTest}>
                      {isRu ? '🧪 Тест' : '🧪 Test'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </TabsContent>
        </Tabs>

        <CreateSprintDialog
          open={createSprintOpen}
          onOpenChange={setCreateSprintOpen}
          members={members}
          onCreateSprint={createSprint}
        />
      </div>
    </div>
  );
}
