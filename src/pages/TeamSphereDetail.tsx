import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Users, ListTodo, Target, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/contexts/LanguageContext';
import { TEAM_SPHERES } from '@/pages/TeamFocus';
import { DEMO_DATA } from '@/lib/demo/testData';

// Demo data per sphere
const SPHERE_DEMO: Record<string, {
  index: number;
  description_ru: string;
  description_en: string;
  metrics: { label_ru: string; label_en: string; value: string }[];
  tasks: { title: string; status: string; assignee: string; sp: number }[];
  insights_ru: string[];
  insights_en: string[];
}> = {
  satisfaction: {
    index: 73,
    description_ru: 'Уровень удовлетворённости участников команды рабочими условиями, процессами и культурой.',
    description_en: 'Team satisfaction with working conditions, processes, and culture.',
    metrics: [
      { label_ru: 'eNPS', label_en: 'eNPS', value: '+42' },
      { label_ru: 'Опросы', label_en: 'Surveys', value: '3/мес' },
      { label_ru: 'Отток', label_en: 'Turnover', value: '4%' },
    ],
    tasks: [
      { title: 'Провести пульс-опрос', status: 'done', assignee: 'Мария К.', sp: 2 },
      { title: 'Обновить политику отпусков', status: 'in_progress', assignee: 'Алексей В.', sp: 3 },
      { title: 'Организовать тимбилдинг Q2', status: 'todo', assignee: 'Дмитрий С.', sp: 5 },
    ],
    insights_ru: ['eNPS вырос на 15 пунктов за квартал', '92% участников довольны графиком', 'Низкий показатель: компенсация (5.2/10)'],
    insights_en: ['eNPS grew 15 points this quarter', '92% satisfied with schedule', 'Low score: compensation (5.2/10)'],
  },
  engagement: {
    index: 100,
    description_ru: 'Степень вовлечённости и активного участия каждого члена команды в рабочих процессах.',
    description_en: 'Level of active participation of each team member in work processes.',
    metrics: [
      { label_ru: 'Активность', label_en: 'Activity', value: '100%' },
      { label_ru: 'Участие в ретро', label_en: 'Retro attendance', value: '11/12' },
      { label_ru: 'Инициативы', label_en: 'Initiatives', value: '7' },
    ],
    tasks: [
      { title: 'Внедрить систему kudos', status: 'done', assignee: 'Екатерина Л.', sp: 3 },
      { title: 'Геймификация спринтов', status: 'in_progress', assignee: 'Иван П.', sp: 5 },
      { title: 'Менторская программа', status: 'todo', assignee: 'Ольга Н.', sp: 8 },
    ],
    insights_ru: ['Все 12 участников активны', '7 добровольных инициатив за месяц', 'Лучший показатель в компании'],
    insights_en: ['All 12 members active', '7 voluntary initiatives this month', 'Best score in company'],
  },
  growth: {
    index: 65,
    description_ru: 'Профессиональный и карьерный рост участников команды, развитие компетенций.',
    description_en: 'Professional growth of team members and skill development.',
    metrics: [
      { label_ru: 'Обучение', label_en: 'Training', value: '24ч/мес' },
      { label_ru: 'Сертификаты', label_en: 'Certs', value: '3' },
      { label_ru: 'Повышения', label_en: 'Promotions', value: '2' },
    ],
    tasks: [
      { title: 'Составить план развития', status: 'done', assignee: 'Алексей В.', sp: 3 },
      { title: 'Курс по System Design', status: 'in_progress', assignee: 'Дмитрий С.', sp: 5 },
      { title: 'Хакатон внутренний', status: 'todo', assignee: 'Мария К.', sp: 8 },
    ],
    insights_ru: ['Среднее обучение 24ч/мес на человека', '3 новых сертификата AWS', 'Нужно: план карьерных треков'],
    insights_en: ['Average 24h/month training per person', '3 new AWS certifications', 'Needed: career track planning'],
  },
  communication: {
    index: 78,
    description_ru: 'Эффективность внутренних коммуникаций, прозрачность и обмен информацией.',
    description_en: 'Effectiveness of internal communications, transparency, and information sharing.',
    metrics: [
      { label_ru: 'Дейлики', label_en: 'Dailies', value: '95%' },
      { label_ru: 'Документация', label_en: 'Docs', value: '78%' },
      { label_ru: 'Ответ (ч)', label_en: 'Response (h)', value: '1.2' },
    ],
    tasks: [
      { title: 'Шаблоны для Confluence', status: 'done', assignee: 'Ольга Н.', sp: 3 },
      { title: 'Автоматизация уведомлений', status: 'in_progress', assignee: 'Иван П.', sp: 5 },
      { title: 'Внедрить async standup', status: 'todo', assignee: 'Екатерина Л.', sp: 3 },
    ],
    insights_ru: ['Среднее время ответа 1.2 часа', '95% посещаемость дейликов', 'Нужно: улучшить документацию API'],
    insights_en: ['Avg response time 1.2h', '95% daily attendance', 'Needed: improve API documentation'],
  },
  goals: {
    index: 71,
    description_ru: 'Прогресс достижения командных целей и OKR на текущий период.',
    description_en: 'Progress on team goals and OKRs for the current period.',
    metrics: [
      { label_ru: 'OKR выполнено', label_en: 'OKR done', value: '71%' },
      { label_ru: 'Ключ. результаты', label_en: 'Key Results', value: '8/12' },
      { label_ru: 'На треке', label_en: 'On track', value: '5/7' },
    ],
    tasks: [
      { title: 'Запустить MVP v2', status: 'done', assignee: 'Алексей В.', sp: 13 },
      { title: 'Интеграция с CRM', status: 'in_progress', assignee: 'Дмитрий С.', sp: 8 },
      { title: 'Миграция на k8s', status: 'todo', assignee: 'Иван П.', sp: 13 },
    ],
    insights_ru: ['5 из 7 целей на треке', 'Рискует: миграция инфраструктуры', 'Лучший результат: запуск MVP v2'],
    insights_en: ['5 of 7 goals on track', 'At risk: infrastructure migration', 'Best result: MVP v2 launch'],
  },
  quality: {
    index: 85,
    description_ru: 'Качество выпускаемого продукта: покрытие тестами, количество багов, технический долг.',
    description_en: 'Product quality: test coverage, bug count, technical debt.',
    metrics: [
      { label_ru: 'Покрытие', label_en: 'Coverage', value: '85%' },
      { label_ru: 'Баги (крит.)', label_en: 'Bugs (crit)', value: '0' },
      { label_ru: 'Тех. долг', label_en: 'Tech debt', value: '12%' },
    ],
    tasks: [
      { title: 'Поднять покрытие до 90%', status: 'in_progress', assignee: 'Мария К.', sp: 5 },
      { title: 'Ревью архитектуры', status: 'done', assignee: 'Алексей В.', sp: 5 },
      { title: 'Автотесты для API', status: 'todo', assignee: 'Дмитрий С.', sp: 8 },
    ],
    insights_ru: ['0 критических багов в продакшене', 'Покрытие тестами 85% (+12%)', 'Тех. долг снижен до 12%'],
    insights_en: ['0 critical bugs in production', 'Test coverage 85% (+12%)', 'Tech debt reduced to 12%'],
  },
  velocity: {
    index: 22,
    description_ru: 'Скорость работы команды: выполненные Story Points за спринт, пропускная способность.',
    description_en: 'Team velocity: completed Story Points per sprint, throughput.',
    metrics: [
      { label_ru: 'SP/спринт', label_en: 'SP/sprint', value: '22/100' },
      { label_ru: 'Ср. velocity', label_en: 'Avg velocity', value: '38' },
      { label_ru: 'Тренд', label_en: 'Trend', value: '↓' },
    ],
    tasks: [
      { title: 'Оптимизация CI/CD', status: 'in_progress', assignee: 'Иван П.', sp: 5 },
      { title: 'Уменьшить WIP лимит', status: 'todo', assignee: 'Екатерина Л.', sp: 2 },
      { title: 'Автоматизация деплоя', status: 'todo', assignee: 'Дмитрий С.', sp: 8 },
    ],
    insights_ru: ['Velocity упала: блокеры от смежных команд', 'Среднее за 3 спринта: 38 SP', 'Рекомендация: снизить WIP до 3'],
    insights_en: ['Velocity dropped: blockers from adjacent teams', '3-sprint average: 38 SP', 'Recommendation: reduce WIP to 3'],
  },
  collaboration: {
    index: 42,
    description_ru: 'Уровень кросс-функционального сотрудничества и командной работы.',
    description_en: 'Level of cross-functional collaboration and teamwork.',
    metrics: [
      { label_ru: 'Кросс-задачи', label_en: 'Cross tasks', value: '42%' },
      { label_ru: 'Парное ревью', label_en: 'Pair review', value: '60%' },
      { label_ru: 'Общие модули', label_en: 'Shared modules', value: '5' },
    ],
    tasks: [
      { title: 'Практика Mob Programming', status: 'todo', assignee: 'Мария К.', sp: 3 },
      { title: 'Шеринг знаний (TechTalk)', status: 'done', assignee: 'Алексей В.', sp: 2 },
      { title: 'Code Review Guidelines', status: 'in_progress', assignee: 'Ольга Н.', sp: 3 },
    ],
    insights_ru: ['42% задач — кросс-функциональные', '60% PR проходят парное ревью', 'Нужно: больше совместных сессий'],
    insights_en: ['42% tasks are cross-functional', '60% PRs have pair review', 'Needed: more collaborative sessions'],
  },
};

export default function TeamSphereDetail() {
  const { sphereKey } = useParams<{ sphereKey: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';

  const sphere = useMemo(() => TEAM_SPHERES.find(s => s.key === sphereKey), [sphereKey]);
  const demo = sphereKey ? SPHERE_DEMO[sphereKey] : null;

  if (!sphere || !demo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Sphere not found</p>
      </div>
    );
  }

  const statusColor = (status: string) => {
    if (status === 'done') return 'text-emerald-500';
    if (status === 'in_progress') return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const statusLabel = (status: string) => {
    if (status === 'done') return isRu ? '✓ Готово' : '✓ Done';
    if (status === 'in_progress') return isRu ? '⏳ В работе' : '⏳ In progress';
    return isRu ? '📋 К выполнению' : '📋 To do';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/team-focus')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{isRu ? sphere.name_ru : sphere.name_en}</h1>
            <p className="text-sm text-muted-foreground">
              {sphere.group === 'internal'
                ? (isRu ? 'Внутренняя сфера' : 'Internal sphere')
                : (isRu ? 'Внешняя сфера' : 'External sphere')
              }
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${sphere.color}20` }}
          >
            {sphere.icon}
          </div>
        </div>

        {/* Index Card */}
        <Card
          className="p-6"
          style={{
            background: `linear-gradient(135deg, ${sphere.color}15, ${sphere.color}05)`,
            borderColor: `${sphere.color}30`,
          }}
        >
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{isRu ? 'Индекс' : 'Index'}</span>
              <span className="font-bold" style={{ color: sphere.color }}>
                {demo.index}%
              </span>
            </div>
            <Progress value={demo.index} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground">
            {isRu ? demo.description_ru : demo.description_en}
          </p>

          {/* Quick metrics */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            {demo.metrics.map((m, i) => (
              <div key={i} className="text-center">
                <p className="text-lg font-bold">{m.value}</p>
                <p className="text-xs text-muted-foreground">{isRu ? m.label_ru : m.label_en}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks" className="text-xs">
              <ListTodo className="w-4 h-4 mr-1" />
              {isRu ? 'Задачи' : 'Tasks'}
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              <TrendingUp className="w-4 h-4 mr-1" />
              {isRu ? 'Инсайты' : 'Insights'}
            </TabsTrigger>
            <TabsTrigger value="members" className="text-xs">
              <Users className="w-4 h-4 mr-1" />
              {isRu ? 'Команда' : 'Team'}
            </TabsTrigger>
          </TabsList>

          {/* Tasks tab */}
          <TabsContent value="tasks" className="mt-4 space-y-3">
            {demo.tasks.map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${task.status === 'done' ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground'}`}>
                      {task.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{task.assignee}</span>
                        <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{task.sp} SP</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${statusColor(task.status)}`}>
                      {statusLabel(task.status)}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          {/* Insights tab */}
          <TabsContent value="insights" className="mt-4 space-y-3">
            {(isRu ? demo.insights_ru : demo.insights_en).map((insight, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm">{insight}</p>
                  </div>
                </Card>
              </motion.div>
            ))}

            {/* Mini trend */}
            <Card className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                {isRu ? 'Динамика за 4 спринта' : 'Trend over 4 sprints'}
              </p>
              <div className="flex items-end gap-2 h-16">
                {[demo.index - 15, demo.index - 8, demo.index - 3, demo.index].map((v, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{ backgroundColor: sphere.color, height: `${Math.max(v, 5)}%` }}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(v, 5)}%` }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {['S-3', 'S-2', 'S-1', isRu ? 'Сейчас' : 'Now'].map((label, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground flex-1 text-center">{label}</span>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Members tab */}
          <TabsContent value="members" className="mt-4 space-y-3">
            {DEMO_DATA.members.slice(0, 6).map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/team/member/${member.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">{member.xp} XP</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
