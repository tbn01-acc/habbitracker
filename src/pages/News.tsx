import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Newspaper, Calendar, Sparkles, Zap, Gift, Crown, Bell, Archive, CalendarRange, Trophy, ThumbsUp, Lightbulb, Settings } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCard } from '@/components/news/NewsCard';

interface NewsItem {
  id: string;
  date: string;
  title: { ru: string; en: string };
  content: { ru: string; en: string };
  type: 'update' | 'feature' | 'promo' | 'announcement';
  icon: React.ReactNode;
}

const newsItems: NewsItem[] = [
  {
    id: 'rating-filters',
    date: '2026-01-12',
    title: { 
      ru: 'Новые фильтры рейтинга и лента!', 
      en: 'New rating filters and feed!' 
    },
    content: { 
      ru: 'В ТОП-100 теперь можно переключаться между рейтингами по Звёздам, Лайкам и Активности. Добавлены фильтры по периоду: Сегодня, Неделя, Месяц, Квартал, Год, Всё время. В Ленте появились разделы: Актив, Истории успеха, Идеи!', 
      en: 'TOP-100 now has Stars, Likes, and Activity rankings. Added period filters: Today, Week, Month, Quarter, Year, All time. Feed now has sections: Activity, Success Stories, Ideas!' 
    },
    type: 'feature',
    icon: <Trophy className="w-5 h-5 text-yellow-500" />
  },
  {
    id: 'push-notif',
    date: '2026-01-12',
    title: { 
      ru: 'Push-уведомления о сроках!', 
      en: 'Push notifications for deadlines!' 
    },
    content: { 
      ru: 'Теперь вы получаете уведомления о приближающихся сроках. FREE: привычки в 9:00, задачи накануне в 15:00. PRO-пользователи могут настроить время и включать/выключать уведомления!', 
      en: 'Now you get notifications about upcoming deadlines. FREE: habits at 9:00, tasks at 15:00 day before. PRO users can customize time and toggle notifications!' 
    },
    type: 'feature',
    icon: <Bell className="w-5 h-5 text-blue-500" />
  },
  {
    id: 'postpone',
    date: '2025-01-11',
    title: { 
      ru: 'Перенос сроков привычек и задач!', 
      en: 'Postpone habits and tasks deadlines!' 
    },
    content: { 
      ru: 'Теперь можно перенести срок выполнения привычки или задачи до 2 раз (на день/3 дня/неделю). После 2 переносов — в Архив или удаление!', 
      en: 'Now you can postpone a habit or task deadline up to 2 times (1 day/3 days/week). After 2 postpones — archive or delete!' 
    },
    type: 'feature',
    icon: <CalendarRange className="w-5 h-5 text-amber-500" />
  },
  {
    id: 'gcal',
    date: '2025-01-11',
    title: { 
      ru: 'Синхронизация с Google Calendar и экспорт .ics!', 
      en: 'Google Calendar sync and .ics export!' 
    },
    content: { 
      ru: 'PRO-пользователи могут подключить Google Calendar и экспортировать привычки/задачи в .ics формат для Apple Calendar!', 
      en: 'PRO users can connect Google Calendar and export habits/tasks to .ics format for Apple Calendar!' 
    },
    type: 'feature',
    icon: <CalendarRange className="w-5 h-5 text-blue-500" />
  },
  {
    id: 'archive',
    date: '2025-01-11',
    title: { 
      ru: 'Архив с календарным просмотром!', 
      en: 'Archive with calendar view!' 
    },
    content: { 
      ru: 'Новая страница Архива (PRO): просматривайте историю привычек, задач и финансов в удобном календарном виде по месяцам и кварталам! Добавлен режим "Все" для отображения всех типов данных.', 
      en: 'New Archive page (PRO): view history of habits, tasks, and finance in a convenient calendar view by months and quarters! Added "All" mode to display all data types.' 
    },
    type: 'feature',
    icon: <Archive className="w-5 h-5 text-purple-500" />
  },
  {
    id: 'periods',
    date: '2025-01-11',
    title: { 
      ru: 'Периоды для привычек и задач!', 
      en: 'Periods for habits and tasks!' 
    },
    content: { 
      ru: 'Теперь можно указать период действия привычки (неделя/месяц/квартал/год или свой) — привычка будет активна каждый целевой день периода!', 
      en: 'Now you can specify the active period for habits (week/month/quarter/year or custom) — the habit will be active on each target day!' 
    },
    type: 'feature',
    icon: <Calendar className="w-5 h-5 text-green-500" />
  },
  {
    id: '0',
    date: '2025-01-11',
    title: { 
      ru: 'Система уровней и XP для PRO!', 
      en: 'Level System and XP for PRO!' 
    },
    content: { 
      ru: 'PRO-пользователи теперь могут зарабатывать XP за задачи, привычки и звёзды! Повышайте уровень и получайте уникальные титулы от "Новичок" до "Чемпион"!', 
      en: 'PRO users can now earn XP for tasks, habits, and stars! Level up and unlock unique titles from "Newbie" to "Champion"!' 
    },
    type: 'feature',
    icon: <Zap className="w-5 h-5 text-purple-500" />
  },
  {
    id: '1',
    date: '2025-01-10',
    title: { 
      ru: 'Магазин наград теперь с категориями!', 
      en: 'Rewards shop now with categories!' 
    },
    content: { 
      ru: 'Добавлены разноцветные ярлыки категорий: Иконки, Аватары, Скидки, Темы, Бейджи, Рамки. Теперь найти нужную награду стало ещё проще!', 
      en: 'Added colorful category labels: Icons, Avatars, Discounts, Themes, Badges, Frames. Finding the right reward is now even easier!' 
    },
    type: 'feature',
    icon: <Gift className="w-5 h-5 text-purple-500" />
  },
];

type PageSize = '10' | '25' | '50' | 'all';

export default function News() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isRussian = language === 'ru';

  const [pageSize, setPageSize] = useState<PageSize>('10');
  const [displayedCount, setDisplayedCount] = useState(10);

  const pageSizeNum = pageSize === 'all' ? newsItems.length : parseInt(pageSize);
  
  const displayedNews = useMemo(() => {
    return newsItems.slice(0, displayedCount);
  }, [displayedCount]);

  const handlePageSizeChange = (value: PageSize) => {
    setPageSize(value);
    const num = value === 'all' ? newsItems.length : parseInt(value);
    setDisplayedCount(num);
  };

  const handleShowMore = () => {
    setDisplayedCount(prev => Math.min(prev + pageSizeNum, newsItems.length));
  };

  const hasMore = displayedCount < newsItems.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Newspaper className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Новости Top-Focus' : 'Top-Focus News'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Обновления и новые функции' : 'Updates and new features'}
              </p>
            </div>
          </div>
          
          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isRussian ? 'Показывать по:' : 'Show:'}
            </span>
            <Select value={pageSize} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-20 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="all">{isRussian ? 'Все' : 'All'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* News List */}
        <div className="space-y-3">
          {displayedNews.map((item, index) => (
            <NewsCard key={item.id} item={item} isRussian={isRussian} index={index} />
          ))}
        </div>

        {/* Show More Button */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-center"
          >
            <Button variant="outline" onClick={handleShowMore}>
              {isRussian ? 'Показать ещё' : 'Show more'} ({newsItems.length - displayedCount})
            </Button>
          </motion.div>
        )}

        {/* Subscribe hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                {isRussian 
                  ? 'Включите уведомления, чтобы первыми узнавать о новых функциях!' 
                  : 'Enable notifications to be the first to know about new features!'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
