import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Star, Zap, Crown, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { Sprint, SprintParticipant, SprintTask, SprintFeedback } from '@/hooks/useTeam';
import confetti from 'canvas-confetti';

interface SprintRetrospectiveProps {
  sprint: Sprint | null;
  completedSprints: Sprint[];
  participants: SprintParticipant[];
  tasks: SprintTask[];
  feedback: SprintFeedback[];
  onFinishSprint: (sprintId: string) => Promise<any>;
  onSubmitFeedback: (sprintId: string, fb: { went_well: string; to_improve: string; action_items: string }) => void;
}

export function SprintRetrospective({
  sprint,
  completedSprints,
  participants,
  tasks,
  feedback,
  onFinishSprint,
  onSubmitFeedback,
}: SprintRetrospectiveProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [feedbackForm, setFeedbackForm] = useState({ went_well: '', to_improve: '', action_items: '' });
  const [finishResult, setFinishResult] = useState<any>(null);

  // Find sprint to show retro for (latest completed or active)
  const retroSprint = completedSprints[0] || sprint;
  const successRate = retroSprint
    ? retroSprint.total_sp_planned > 0
      ? Math.round((retroSprint.total_sp_completed / retroSprint.total_sp_planned) * 100)
      : 0
    : 0;

  // Sort participants by contribution
  const sortedParticipants = [...participants].sort((a, b) => b.sp_contributed - a.sp_contributed);
  const podium = sortedParticipants.slice(0, 3);

  // Find special nominations
  const tasksByAssignee = tasks.reduce((acc, t) => {
    if (t.assignee_id && t.status === 'done') {
      acc[t.assignee_id] = (acc[t.assignee_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const maxTasksUser = Object.entries(tasksByAssignee).sort(([, a], [, b]) => b - a)[0];
  const heaviestTask = tasks.filter(t => t.status === 'done').sort((a, b) => b.story_points - a.story_points)[0];

  useEffect(() => {
    if (finishResult?.success && finishResult.success_rate >= 90) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [finishResult]);

  const handleFinish = async () => {
    if (!retroSprint) return;
    const result = await onFinishSprint(retroSprint.id);
    setFinishResult(result);
  };

  const handleSubmitFeedback = () => {
    if (!retroSprint) return;
    onSubmitFeedback(retroSprint.id, feedbackForm);
    setFeedbackForm({ went_well: '', to_improve: '', action_items: '' });
  };

  if (!retroSprint) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Нет завершённых спринтов для ретроспективы' : 'No completed sprints for retrospective'}
        </p>
      </div>
    );
  }

  const podiumColors = [
    'from-yellow-400/20 to-yellow-600/40',
    'from-slate-300/20 to-slate-500/40',
    'from-orange-400/20 to-orange-700/40',
  ];
  const podiumHeights = ['h-28', 'h-20', 'h-16'];
  const podiumIcons = [Crown, Medal, Medal];
  const podiumOrder = [1, 0, 2]; // display order: silver, gold, bronze

  return (
    <div className="space-y-4">
      {/* Hero: Result */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
          <CardContent className="pt-6 pb-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
            >
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-3xl font-bold">{successRate}%</span>
              </div>
            </motion.div>
            <h2 className="text-lg font-bold mb-1">
              {successRate >= 90
                ? (isRu ? '🎉 ЦЕЛЬ ДОСТИГНУТА!' : '🎉 GOAL ACHIEVED!')
                : successRate >= 70
                ? (isRu ? '💪 Хороший результат!' : '💪 Good result!')
                : (isRu ? '📊 Рывок завершён' : '📊 Sprint completed')}
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              {retroSprint.title} — {retroSprint.total_sp_completed}/{retroSprint.total_sp_planned} SP
            </p>
            <Progress value={successRate} className="h-2 mb-2" />

            {sprint?.status === 'active' && (
              <Button onClick={handleFinish} className="mt-3" variant="default">
                <Trophy className="w-4 h-4 mr-2" />
                {isRu ? 'Завершить спринт' : 'Finish Sprint'}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Podium */}
      {podium.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              {isRu ? 'Звёзды спринта' : 'Sprint Stars'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex items-end justify-center gap-3 mt-4">
              {podiumOrder.map((idx) => {
                const participant = podium[idx];
                if (!participant) return null;
                const Icon = podiumIcons[idx];
                return (
                  <motion.div
                    key={participant.id}
                    className="flex flex-col items-center"
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + idx * 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <div className="relative mb-2">
                      <Avatar className={idx === 0 ? 'w-14 h-14 ring-2 ring-yellow-500' : 'w-10 h-10'}>
                        <AvatarImage src={participant.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(participant.profile?.display_name || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1">
                        <Icon className={`w-4 h-4 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-orange-500'}`} />
                      </div>
                    </div>
                    <div className={`w-16 ${podiumHeights[idx]} rounded-t-lg bg-gradient-to-b ${podiumColors[idx]} backdrop-blur flex flex-col items-center justify-start pt-2`}>
                      <span className="text-lg font-bold">{participant.sp_contributed}</span>
                      <span className="text-[9px] text-muted-foreground">SP</span>
                    </div>
                    <span className="text-[10px] mt-1 text-center max-w-[70px] truncate">
                      {participant.profile?.display_name || 'User'}
                    </span>
                    <Badge variant="outline" className="text-[8px] mt-0.5">+{participant.xp_earned} XP</Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nominations */}
      <div className="grid grid-cols-2 gap-3">
        {maxTasksUser && (
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="pt-3 pb-3 text-center">
              <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">{isRu ? 'Марафонец' : 'Marathon Runner'}</p>
              <p className="text-xs font-medium">{maxTasksUser[1]} {isRu ? 'задач' : 'tasks'}</p>
            </CardContent>
          </Card>
        )}
        {heaviestTask && (
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardContent className="pt-3 pb-3 text-center">
              <Zap className="w-5 h-5 text-purple-500 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">{isRu ? 'Архитектор' : 'Architect'}</p>
              <p className="text-xs font-medium">{heaviestTask.story_points} SP</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Participants Table */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isRu ? 'Вклад участников' : 'Participant Contributions'}</CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {sortedParticipants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={p.profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">{(p.profile?.display_name || '?')[0]}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{p.profile?.display_name || 'User'}</span>
                <span className="text-yellow-500 font-medium">{p.sp_contributed} SP</span>
                <Badge variant="secondary" className="text-[9px]">+{p.xp_earned} XP</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Form */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {isRu ? 'Обратная связь' : 'Feedback'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 space-y-3">
          <div>
            <label className="text-xs text-green-500 font-medium block mb-1">
              {isRu ? '✅ Что было хорошо?' : '✅ What went well?'}
            </label>
            <Textarea
              value={feedbackForm.went_well}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, went_well: e.target.value })}
              rows={2}
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-orange-500 font-medium block mb-1">
              {isRu ? '⚠️ Что можно улучшить?' : '⚠️ What can be improved?'}
            </label>
            <Textarea
              value={feedbackForm.to_improve}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, to_improve: e.target.value })}
              rows={2}
              className="text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-blue-500 font-medium block mb-1">
              {isRu ? '🎯 План действий' : '🎯 Action Items'}
            </label>
            <Textarea
              value={feedbackForm.action_items}
              onChange={(e) => setFeedbackForm({ ...feedbackForm, action_items: e.target.value })}
              rows={2}
              className="text-xs"
            />
          </div>
          <Button onClick={handleSubmitFeedback} size="sm" className="w-full">
            {isRu ? 'Отправить' : 'Submit'}
          </Button>

          {/* Existing Feedback */}
          {feedback.length > 0 && (
            <div className="mt-3 space-y-2 pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-muted-foreground">{isRu ? 'Ответы команды' : 'Team Responses'}</p>
              {feedback.map((fb) => (
                <Card key={fb.id} className="bg-muted/30">
                  <CardContent className="p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={fb.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-[6px]">{(fb.profile?.display_name || '?')[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{fb.profile?.display_name || 'User'}</span>
                    </div>
                    {fb.went_well && <p className="text-green-500/80">✅ {fb.went_well}</p>}
                    {fb.to_improve && <p className="text-orange-500/80">⚠️ {fb.to_improve}</p>}
                    {fb.action_items && <p className="text-blue-500/80">🎯 {fb.action_items}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
