import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, LayoutDashboard, Columns3, Trophy, Plus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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

export default function TeamPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
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

  // Skeleton on loading or mode switching
  if (loading || experience.switching) {
    return <SkeletonTeam />;
  }

  // DEMO/TEST MODE ACTIVE
  if (experience.mode !== 'real' && experience.data) {
    const isTest = experience.mode === 'test';
    const d = experience.data;

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
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{d.sprint.completedSP}/{d.sprint.totalSP} SP</span>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full grid grid-cols-4 h-9">
              <TabsTrigger value="overview" className="text-xs gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
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
                <span className="hidden sm:inline">{isRu ? 'Состав' : 'Members'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <DemoTeamOverview data={d} />
              <DemoBurndownChart data={d} />
            </TabsContent>

            <TabsContent value="kanban">
              <DemoKanban
                data={d}
                onUpdateStatus={experience.updateTaskStatus}
                isReadOnly={!isTest}
              />
            </TabsContent>

            <TabsContent value="retro">
              <RetroPodium
                members={d.members}
                onAward={experience.awardMember}
                isTest={isTest}
              />
            </TabsContent>

            <TabsContent value="members">
              <div className="space-y-2">
                {d.members.map((m, i) => (
                  <motion.div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card/80 border border-border/50"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                      {m.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.role}</p>
                    </div>
                    <span className="text-[10px]">{m.status}</span>
                    <span className="text-[10px] text-yellow-500 font-medium">{m.xp.toLocaleString()} XP</span>
                    {isTest && (
                      <button
                        className="text-[10px] text-yellow-500 hover:text-yellow-400"
                        onClick={() => experience.awardMember(m.id)}
                      >
                        ⭐
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // No team — empty state
  if (!team) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-4 py-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-xl font-bold mb-2">
              {isRu ? 'Командная работа' : 'Teamwork'}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              {isRu
                ? 'Создайте команду или присоединитесь по коду приглашения, чтобы запускать спринты, отслеживать прогресс и зарабатывать XP вместе.'
                : 'Create a team or join by invite code to launch sprints, track progress and earn XP together.'}
            </p>
            <Button onClick={() => setCreateTeamOpen(true)} size="lg" className="w-full">
              <Users className="w-5 h-5 mr-2" />
              {isRu ? 'Начать' : 'Get Started'}
            </Button>
          </motion.div>

          <EmptyStateDemoBanner
            onStartDemo={experience.startDemo}
            onStartTest={experience.startTest}
          />

          <CreateTeamDialog
            open={createTeamOpen}
            onOpenChange={setCreateTeamOpen}
            onCreateTeam={createTeam}
            onJoinTeam={joinTeam}
          />
        </div>
      </div>
    );
  }

  // Real team view (unchanged logic)
  const completedSprints = sprints.filter(s => s.status === 'completed');
  const isOwner = user?.id === team.owner_id;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">{team.name}</h1>
            {team.description && (
              <p className="text-xs text-muted-foreground">{team.description}</p>
            )}
          </div>
          {isOwner && !activeSprint && (
            <Button size="sm" onClick={() => setCreateSprintOpen(true)}>
              <Zap className="w-4 h-4 mr-1" />
              {isRu ? 'Новый спринт' : 'New Sprint'}
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
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
              <span className="hidden sm:inline">{isRu ? 'Состав' : 'Members'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <TeamOverview members={members} activeSprint={activeSprint} sprintTasks={sprintTasks} />
            <SprintBurndownChart sprint={activeSprint} dailyStats={dailyStats} />
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
