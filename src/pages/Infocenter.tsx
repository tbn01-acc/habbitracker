import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Info, Calendar, Sparkles, Zap, Gift, Bell, Archive, CalendarRange,
  Trophy, ClipboardList, BarChart3, BookOpen, Library, Newspaper, HelpCircle,
  Shield, Users, Aperture, MessageSquare, Star, Lock,
} from 'lucide-react';

import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCard } from '@/components/news/NewsCard';
import Help from '@/pages/Help';

interface NewsItem {
  id: string;
  date: string;
  title: { ru: string; en: string };
  content: { ru: string; en: string };
  type: 'update' | 'feature' | 'promo' | 'announcement';
  icon: React.ReactNode;
}

const newsItems: NewsItem[] = [
  // ===== NEW (after 2026-01-22) =====
  {
    id: 'security-hardening-2026-05',
    date: '2026-05-15',
    title: {
      ru: 'Большое обновление безопасности',
      en: 'Major security update',
    },
    content: {
      ru: 'Закрыли пять критичных уязвимостей: защитили колонки профиля от подмены, скрыли invite-коды команд и групповых чатов, перевели уведомления и квоты ИИ-прокси на атомарные SECURITY DEFINER RPC. Прямая запись клиента в чувствительные таблицы запрещена.',
      en: 'Five critical vulnerabilities fixed: profile columns protected, team and chat invite codes hidden, notifications and AI quotas moved to atomic SECURITY DEFINER RPCs.',
    },
    type: 'update',
    icon: <Shield className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: 'infocenter',
    date: '2026-05-16',
    title: {
      ru: 'Инфоцентр: Помощь, Библиотека и Новости в одном месте',
      en: 'Infocenter: Help, Library and News in one place',
    },
    content: {
      ru: 'Объединили справку, новости и будущую Библиотеку деловой литературы в один раздел «Инфоцентр». Доступ — по иконке (i) в шапке. Из «Помощи» теперь работают глубокие ссылки на конкретные статьи через хэш URL.',
      en: 'Help, News and the upcoming Library are now unified in a single Infocenter. Available via the (i) icon in the header. Deep links to specific Help articles work via URL hash.',
    },
    type: 'announcement',
    icon: <Info className="w-5 h-5 text-primary" />,
  },
  {
    id: 'smart-wizard',
    date: '2026-04-10',
    title: {
      ru: 'Мастер SMART-целей: 7 шагов и +50 XP',
      en: 'SMART Goal Wizard: 7 steps and +50 XP',
    },
    content: {
      ru: 'Новый пошаговый мастер помогает декомпозировать цель методом Backwards Planning: от формулировки SMART до контрольных точек и связанных задач. За завершение мастера начисляется 50 XP.',
      en: 'A new step-by-step wizard breaks down a goal via Backwards Planning: from a SMART statement to milestones and linked tasks. Completing the wizard awards 50 XP.',
    },
    type: 'feature',
    icon: <Sparkles className="w-5 h-5 text-purple-500" />,
  },
  {
    id: 'team-simulator',
    date: '2026-03-22',
    title: {
      ru: 'Симулятор команды и публичные профили',
      en: 'Team simulator and public profiles',
    },
    content: {
      ru: 'Запустили Демо/Песочницу командного опыта для пользователей без команды и публичные профили команд с защитой внутренних данных. Идеально, чтобы оценить B2B-возможности перед оплатой.',
      en: 'Launched a Team demo/sandbox for users without a team and public team profiles that keep internal data protected. Perfect for evaluating B2B features before paying.',
    },
    type: 'feature',
    icon: <Users className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'reflection-loop',
    date: '2026-03-05',
    title: {
      ru: 'Обязательная ежедневная рефлексия',
      en: 'Mandatory daily reflection',
    },
    content: {
      ru: 'После 18:00 дашборд блокируется до прохождения короткой рефлексии: оценка дня, ключевые победы и био-метрики. Все ответы попадают в «Дневник успеха» и доступны для публикации за звёзды.',
      en: 'After 18:00 the dashboard is blocked until a short reflection is completed: day rating, key wins and bio-metrics. All answers go to the Success Diary and can be published for stars.',
    },
    type: 'feature',
    icon: <MessageSquare className="w-5 h-5 text-pink-500" />,
  },
  {
    id: 'main-task-pin',
    date: '2026-02-18',
    title: {
      ru: 'Главная задача дня — закреплена сверху',
      en: 'Main Task of the day pinned to the top',
    },
    content: {
      ru: 'Главная задача (isMain) теперь жёстко закрепляется в верхней части Плана дня и Итогов дня, подсвечивается неоновым свечением и сопровождается оранжево-красным баннером Фокуса на дашборде.',
      en: 'The Main Task (isMain) is now pinned to the top of Day Plan and Day Summary, highlighted with a neon glow and accompanied by the orange-red Focus banner on the dashboard.',
    },
    type: 'update',
    icon: <Aperture className="w-5 h-5 text-orange-500" />,
  },
  {
    id: 'pin-faceid',
    date: '2026-02-05',
    title: {
      ru: 'PIN-код и Face ID для входа',
      en: 'PIN code and Face ID lock',
    },
    content: {
      ru: 'Локальный слой безопасности: 4-значный PIN или биометрия для разблокировки приложения. После 24 часов бездействия требуется обычный вход.',
      en: 'Local security layer: 4-digit PIN or biometrics to unlock the app. After 24 hours of inactivity, regular sign-in is required.',
    },
    type: 'feature',
    icon: <Lock className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: 'telegram-queue',
    date: '2026-01-28',
    title: {
      ru: 'Telegram-уведомления через очередь',
      en: 'Telegram notifications via queue',
    },
    content: {
      ru: 'Уведомления о дедлайнах, помодоро и партнёрских событиях теперь идут через таблицу telegram_queue и обрабатываются ботом по расписанию pg_cron — без потерь и дублей.',
      en: 'Deadline, Pomodoro and partner notifications now flow through telegram_queue and are processed by the bot on a pg_cron schedule — no losses or duplicates.',
    },
    type: 'update',
    icon: <Bell className="w-5 h-5 text-blue-500" />,
  },
  // ===== Existing news (<= 2026-01-22) =====
  {
    id: 'day-plan',
    date: '2026-01-21',
    title: { ru: 'План на день — новая PRO-функция!', en: 'Day Plan — new PRO feature!' },
    content: {
      ru: 'Теперь PRO-пользователи могут видеть структурированный план на день со всеми привычками, задачами и операциями! Группировка по типу, сфере или тегам. Экспорт в PDF и возможность поделиться.',
      en: 'Now PRO users can see a structured day plan with all habits, tasks and operations! Group by type, sphere or tags. Export to PDF and share functionality.',
    },
    type: 'feature',
    icon: <ClipboardList className="w-5 h-5 text-blue-500" />,
  },
  {
    id: 'day-summary',
    date: '2026-01-21',
    title: { ru: 'Итоги дня с метрикой продуктивности!', en: 'Day Summary with productivity metric!' },
    content: {
      ru: 'Новая страница «Итоги дня» для PRO: детальная статистика выполненных, невыполненных и отложенных задач. Интегральная метрика «Моя продуктивность» от 0 до 100. Экспорт в PDF!',
      en: 'New "Day Summary" page for PRO: detailed stats of completed, incomplete and postponed tasks. Integral "My Productivity" metric from 0 to 100. Export to PDF!',
    },
    type: 'feature',
    icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
  },
  {
    id: 'rating-filters',
    date: '2026-01-12',
    title: { ru: 'Новые фильтры рейтинга и лента!', en: 'New rating filters and feed!' },
    content: {
      ru: 'В ТОП-100 теперь можно переключаться между рейтингами по Звёздам, Лайкам и Активности. Добавлены фильтры по периоду: Сегодня, Неделя, Месяц, Квартал, Год, Всё время. В Ленте появились разделы: Актив, Истории успеха, Идеи!',
      en: 'TOP-100 now has Stars, Likes, and Activity rankings. Added period filters: Today, Week, Month, Quarter, Year, All time. Feed now has sections: Activity, Success Stories, Ideas!',
    },
    type: 'feature',
    icon: <Trophy className="w-5 h-5 text-yellow-500" />,
  },
  {
    id: 'push-notif',
    date: '2026-01-12',
    title: { ru: 'Push-уведомления о сроках!', en: 'Push notifications for deadlines!' },
    content: {
      ru: 'Теперь вы получаете уведомления о приближающихся сроках. FREE: привычки в 9:00, задачи накануне в 15:00. PRO-пользователи могут настроить время и включать/выключать уведомления!',
      en: 'Now you get notifications about upcoming deadlines. FREE: habits at 9:00, tasks at 15:00 day before. PRO users can customize time and toggle notifications!',
    },
    type: 'feature',
    icon: <Bell className="w-5 h-5 text-blue-500" />,
  },
  {
    id: 'postpone',
    date: '2025-01-11',
    title: { ru: 'Перенос сроков привычек и задач!', en: 'Postpone habits and tasks deadlines!' },
    content: {
      ru: 'Теперь можно перенести срок выполнения привычки или задачи до 2 раз (на день/3 дня/неделю). После 2 переносов — в Архив или удаление!',
      en: 'Now you can postpone a habit or task deadline up to 2 times (1 day/3 days/week). After 2 postpones — archive or delete!',
    },
    type: 'feature',
    icon: <CalendarRange className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'gcal',
    date: '2025-01-11',
    title: { ru: 'Синхронизация с Google Calendar и экспорт .ics!', en: 'Google Calendar sync and .ics export!' },
    content: {
      ru: 'PRO-пользователи могут подключить Google Calendar и экспортировать привычки/задачи в .ics формат для Apple Calendar!',
      en: 'PRO users can connect Google Calendar and export habits/tasks to .ics format for Apple Calendar!',
    },
    type: 'feature',
    icon: <CalendarRange className="w-5 h-5 text-blue-500" />,
  },
  {
    id: 'archive',
    date: '2025-01-11',
    title: { ru: 'Архив с календарным просмотром!', en: 'Archive with calendar view!' },
    content: {
      ru: 'Новая страница Архива (PRO): просматривайте историю привычек, задач и финансов в удобном календарном виде по месяцам и кварталам! Добавлен режим "Все" для отображения всех типов данных.',
      en: 'New Archive page (PRO): view history of habits, tasks, and finance in a convenient calendar view by months and quarters! Added "All" mode to display all data types.',
    },
    type: 'feature',
    icon: <Archive className="w-5 h-5 text-purple-500" />,
  },
  {
    id: 'periods',
    date: '2025-01-11',
    title: { ru: 'Периоды для привычек и задач!', en: 'Periods for habits and tasks!' },
    content: {
      ru: 'Теперь можно указать период действия привычки (неделя/месяц/квартал/год или свой) — привычка будет активна каждый целевой день периода!',
      en: 'Now you can specify the active period for habits (week/month/quarter/year or custom) — the habit will be active on each target day!',
    },
    type: 'feature',
    icon: <Calendar className="w-5 h-5 text-green-500" />,
  },
  {
    id: '0',
    date: '2025-01-11',
    title: { ru: 'Система уровней и XP для PRO!', en: 'Level System and XP for PRO!' },
    content: {
      ru: 'PRO-пользователи теперь могут зарабатывать XP за задачи, привычки и звёзды! Повышайте уровень и получайте уникальные титулы от "Новичок" до "Чемпион"!',
      en: 'PRO users can now earn XP for tasks, habits, and stars! Level up and unlock unique titles from "Newbie" to "Champion"!',
    },
    type: 'feature',
    icon: <Zap className="w-5 h-5 text-purple-500" />,
  },
  {
    id: '1',
    date: '2025-01-10',
    title: { ru: 'Магазин наград теперь с категориями!', en: 'Rewards shop now with categories!' },
    content: {
      ru: 'Добавлены разноцветные ярлыки категорий: Иконки, Аватары, Скидки, Темы, Бейджи, Рамки. Теперь найти нужную награду стало ещё проще!',
      en: 'Added colorful category labels: Icons, Avatars, Discounts, Themes, Badges, Frames. Finding the right reward is now even easier!',
    },
    type: 'feature',
    icon: <Gift className="w-5 h-5 text-purple-500" />,
  },
];

// Sort descending by date (newest first)
const sortedNews = [...newsItems].sort((a, b) => b.date.localeCompare(a.date));

type PageSize = '10' | '25' | '50' | 'all';

export default function Infocenter() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const isRu = language === 'ru';

  const tabFromUrl = params.get('tab') || 'help';
  const [tab, setTab] = useState<string>(tabFromUrl);

  const handleTabChange = (v: string) => {
    setTab(v);
    const next = new URLSearchParams(params);
    next.set('tab', v);
    setParams(next, { replace: true });
  };

  // News pagination
  const [pageSize, setPageSize] = useState<PageSize>('10');
  const [displayedCount, setDisplayedCount] = useState(10);
  const pageSizeNum = pageSize === 'all' ? sortedNews.length : parseInt(pageSize);
  const displayedNews = useMemo(() => sortedNews.slice(0, displayedCount), [displayedCount]);
  const handlePageSizeChange = (value: PageSize) => {
    setPageSize(value);
    const num = value === 'all' ? sortedNews.length : parseInt(value);
    setDisplayedCount(num);
  };
  const hasMore = displayedCount < sortedNews.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Info className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRu ? 'Инфоцентр' : 'Infocenter'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? 'Помощь, Библиотека и Новости Top-Focus'
                  : 'Help, Library and Top-Focus News'}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-xl">
            <TabsTrigger value="help" className="gap-1.5">
              <HelpCircle className="w-4 h-4" />
              {isRu ? 'Помощь' : 'Help'}
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5">
              <Library className="w-4 h-4" />
              {isRu ? 'Библиотека' : 'Library'}
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-1.5">
              <Newspaper className="w-4 h-4" />
              {isRu ? 'Новости' : 'News'}
            </TabsTrigger>
          </TabsList>

          {/* HELP */}
          <TabsContent value="help" className="mt-4">
            <Help embedded />
          </TabsContent>

          {/* LIBRARY */}
          <TabsContent value="library" className="mt-6">
            <Card className="border-dashed">
              <CardContent className="p-10 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-md bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">
                  {isRu ? 'Деловая библиотека' : 'Business library'}
                </h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {isRu
                    ? 'Здесь появится подборка ключевых книг и статей о продуктивности, целеполагании и управлении. Контент добавляется постепенно — следите за обновлениями.'
                    : 'A curated selection of key books and articles on productivity, goal-setting and management will appear here. Content is added gradually — stay tuned.'}
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-2">
                  <span className="text-xs px-2.5 py-1 rounded-sm border border-border bg-card text-muted-foreground">
                    {isRu ? 'Продуктивность' : 'Productivity'}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-sm border border-border bg-card text-muted-foreground">
                    {isRu ? 'Целеполагание' : 'Goal setting'}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-sm border border-border bg-card text-muted-foreground">
                    {isRu ? 'Финансы' : 'Finance'}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-sm border border-border bg-card text-muted-foreground">
                    {isRu ? 'Лидерство' : 'Leadership'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NEWS */}
          <TabsContent value="news" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Обновления и новые функции' : 'Updates and new features'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {isRu ? 'Показывать по:' : 'Show:'}
                </span>
                <Select value={pageSize} onValueChange={(v) => handlePageSizeChange(v as PageSize)}>
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="all">{isRu ? 'Все' : 'All'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              {displayedNews.map((item, index) => (
                <NewsCard key={item.id} item={item} isRussian={isRu} index={index} />
              ))}
            </div>

            {hasMore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <Button
                  variant="outline"
                  onClick={() => setDisplayedCount((p) => Math.min(p + pageSizeNum, sortedNews.length))}
                >
                  {isRu ? 'Показать ещё' : 'Show more'} ({sortedNews.length - displayedCount})
                </Button>
              </motion.div>
            )}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {isRu
                    ? 'Включите уведомления, чтобы первыми узнавать о новых функциях!'
                    : 'Enable notifications to be the first to know about new features!'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}