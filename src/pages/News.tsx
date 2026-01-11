import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Newspaper, Calendar, Sparkles, Zap, Gift, Crown, Bell, Archive, CalendarRange } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

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
      ru: 'Новая страница Архива (PRO): просматривайте историю привычек, задач и финансов в удобном календарном виде по неделям, месяцам и кварталам!', 
      en: 'New Archive page (PRO): view history of habits, tasks, and finance in a convenient calendar view by weeks, months, and quarters!' 
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

export default function News() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isRussian = language === 'ru';
  const locale = isRussian ? ru : enUS;

  const getTypeBadge = (type: NewsItem['type']) => {
    switch (type) {
      case 'update':
        return <Badge variant="outline" className="border-blue-500/50 text-blue-500">Обновление</Badge>;
      case 'feature':
        return <Badge variant="outline" className="border-green-500/50 text-green-500">{isRussian ? 'Новая функция' : 'New Feature'}</Badge>;
      case 'promo':
        return <Badge variant="outline" className="border-purple-500/50 text-purple-500">{isRussian ? 'Акция' : 'Promo'}</Badge>;
      case 'announcement':
        return <Badge variant="outline" className="border-amber-500/50 text-amber-500">{isRussian ? 'Объявление' : 'Announcement'}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Новости Top-Focus' : 'Top-Focus News'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Обновления и новые функции' : 'Updates and new features'}
              </p>
            </div>
          </div>
        </div>

        {/* News List */}
        <div className="space-y-4">
          {newsItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        {item.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {isRussian ? item.title.ru : item.title.en}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(item.date), 'd MMMM yyyy', { locale })}
                          </span>
                          {getTypeBadge(item.type)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {isRussian ? item.content.ru : item.content.en}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Subscribe hint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
