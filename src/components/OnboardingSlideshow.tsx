import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';

import slideWelcome from '@/assets/onboarding/slide-welcome.jpg';
import slideHabits from '@/assets/onboarding/slide-habits.jpg';
import slideTasks from '@/assets/onboarding/slide-tasks.jpg';
import slideFinance from '@/assets/onboarding/slide-finance.jpg';
import slideGoals from '@/assets/onboarding/slide-goals.jpg';
import slideSpheres from '@/assets/onboarding/slide-spheres.jpg';
import slideServices from '@/assets/onboarding/slide-services.jpg';
import slideFocus from '@/assets/onboarding/slide-focus.jpg';
import slideRating from '@/assets/onboarding/slide-rating.jpg';
import slideAnalytics from '@/assets/onboarding/slide-analytics.jpg';
import slideCloud from '@/assets/onboarding/slide-cloud.jpg';
import slideSubscription from '@/assets/onboarding/slide-subscription.jpg';
import slideTeam from '@/assets/onboarding/slide-team.jpg';
import slideSprint from '@/assets/onboarding/slide-sprint.jpg';
import slidePartner from '@/assets/onboarding/slide-partner.jpg';

import slideWelcomeEn from '@/assets/onboarding/en/slide-welcome.jpg';
import slideHabitsEn from '@/assets/onboarding/en/slide-habits.jpg';
import slideTasksEn from '@/assets/onboarding/en/slide-tasks.jpg';
import slideFinanceEn from '@/assets/onboarding/en/slide-finance.jpg';
import slideGoalsEn from '@/assets/onboarding/en/slide-goals.jpg';
import slideSpheresEn from '@/assets/onboarding/en/slide-spheres.jpg';
import slideServicesEn from '@/assets/onboarding/en/slide-services.jpg';
import slideFocusEn from '@/assets/onboarding/en/slide-focus.jpg';
import slideRatingEn from '@/assets/onboarding/en/slide-rating.jpg';
import slideAnalyticsEn from '@/assets/onboarding/en/slide-analytics.jpg';
import slideCloudEn from '@/assets/onboarding/en/slide-cloud.jpg';
import slideSubscriptionEn from '@/assets/onboarding/en/slide-subscription.jpg';
import slideTeamEn from '@/assets/onboarding/en/slide-team.jpg';
import slideSprintEn from '@/assets/onboarding/en/slide-sprint.jpg';
import slidePartnerEn from '@/assets/onboarding/en/slide-partner.jpg';

interface OnboardingSlide {
  id: string;
  image: string;
  imageEn: string;
  titleRu: string;
  titleEn: string;
  titleEs: string;
  descriptionRu: string;
  descriptionEn: string;
  descriptionEs: string;
  badge?: { ru: string; en: string; es: string };
}

const slides: OnboardingSlide[] = [
  {
    id: 'welcome',
    image: slideWelcome,
    imageEn: slideWelcomeEn,
    titleRu: 'Добро пожаловать в ТопФокус',
    titleEn: 'Welcome to TopFocus',
    titleEs: 'Bienvenido a TopFocus',
    descriptionRu: 'Ваш персональный центр управления жизнью. Дашборд объединяет привычки, задачи, финансы и цели в единую экосистему продуктивности.',
    descriptionEn: 'Your personal life management hub. The dashboard unites habits, tasks, finances, and goals into a single productivity ecosystem.',
    descriptionEs: 'Tu centro personal de gestión de vida. El panel une hábitos, tareas, finanzas y metas en un ecosistema de productividad.',
  },
  {
    id: 'habits',
    image: slideHabits,
    imageEn: slideHabitsEn,
    titleRu: 'Трекер привычек',
    titleEn: 'Habit Tracker',
    titleEs: 'Rastreador de hábitos',
    descriptionRu: 'Формируйте полезные привычки с серией выполнений, календарём прогресса и умными напоминаниями. Отслеживайте ежедневный прогресс и стройте устойчивые рутины.',
    descriptionEn: 'Build healthy habits with streaks, progress calendar, and smart reminders. Track daily progress and build sustainable routines.',
    descriptionEs: 'Desarrolla hábitos saludables con rachas, calendario de progreso y recordatorios inteligentes.',
  },
  {
    id: 'tasks',
    image: slideTasks,
    imageEn: slideTasksEn,
    titleRu: 'Управление задачами',
    titleEn: 'Task Management',
    titleEs: 'Gestión de tareas',
    descriptionRu: 'Организуйте задачи с приоритетами, дедлайнами, подзадачами и тегами. Фильтрация по статусу, календарный вид и привязка к целям помогут не упустить ничего важного.',
    descriptionEn: 'Organize tasks with priorities, deadlines, subtasks, and tags. Filter by status, calendar view, and link tasks to goals.',
    descriptionEs: 'Organiza tareas con prioridades, fechas límite, subtareas y etiquetas.',
  },
  {
    id: 'finance',
    image: slideFinance,
    imageEn: slideFinanceEn,
    titleRu: 'Учёт финансов',
    titleEn: 'Finance Tracker',
    titleEs: 'Control de finanzas',
    descriptionRu: 'Контролируйте доходы и расходы с наглядной аналитикой. Категоризация, графики трендов и месячные отчёты помогут управлять бюджетом эффективно.',
    descriptionEn: 'Track income and expenses with visual analytics. Categorization, trend charts, and monthly reports for effective budgeting.',
    descriptionEs: 'Controla ingresos y gastos con análisis visual. Categorización y gráficos de tendencias.',
  },
  {
    id: 'goals',
    image: slideGoals,
    imageEn: slideGoalsEn,
    titleRu: 'Система целей',
    titleEn: 'Goal System',
    titleEs: 'Sistema de metas',
    descriptionRu: 'Цели — ядро ТопФокус. Привязывайте к целям привычки, задачи, финансы и контакты. Отслеживайте прогресс в процентах и по временным вехам.',
    descriptionEn: 'Goals are the core of TopFocus. Link habits, tasks, finances, and contacts to goals. Track progress by percentage and milestones.',
    descriptionEs: 'Las metas son el núcleo de TopFocus. Vincula hábitos, tareas, finanzas y contactos.',
  },
  {
    id: 'spheres',
    image: slideSpheres,
    imageEn: slideSpheresEn,
    titleRu: 'Цветок сфер жизни',
    titleEn: 'Life Spheres Flower',
    titleEs: 'Flor de esferas de vida',
    descriptionRu: 'Уникальный «Цветок сфер» визуализирует баланс 8 сфер вашей жизни. Индикаторы энергии, осознанности и внешнего успеха покажут точки роста и гармонию.',
    descriptionEn: 'The unique "Sphere Flower" visualizes the balance of 8 life areas. Energy, mindfulness, and success indicators reveal growth areas.',
    descriptionEs: 'La "Flor de esferas" visualiza el equilibrio de 8 áreas de vida.',
  },
  {
    id: 'services',
    image: slideServices,
    imageEn: slideServicesEn,
    titleRu: '10 встроенных сервисов',
    titleEn: '10 Built-in Services',
    titleEs: '10 servicios integrados',
    descriptionRu: 'Помодоро-таймер, трекер времени, заметки, чек-листы, конвертер валют, калькулятор дат, мировое время, счётчики, генератор решений и конвертер величин — всё в одном месте.',
    descriptionEn: 'Pomodoro timer, time tracker, notes, checklists, currency converter, date calculator, world clock, counters, decision maker, and unit converter.',
    descriptionEs: 'Temporizador Pomodoro, notas, listas, conversor de monedas, reloj mundial y más.',
  },
  {
    id: 'focus',
    image: slideFocus,
    imageEn: slideFocusEn,
    titleRu: 'Фокус — соцсеть продуктивных',
    titleEn: 'Focus — Social Network',
    titleEs: 'Focus — Red social productiva',
    descriptionRu: 'Публикуйте достижения с верифицированными фото, подписывайтесь на интересных людей, участвуйте в челленджах. Обращайтесь к аудитории, отобранной по интересам и параметрам.',
    descriptionEn: 'Share verified achievements, follow inspiring people, join challenges. Reach audiences filtered by interests and parameters.',
    descriptionEs: 'Comparte logros verificados, sigue a personas inspiradoras, participa en desafíos.',
    badge: { ru: 'Социальная сеть', en: 'Social', es: 'Red social' },
  },
  {
    id: 'rating',
    image: slideRating,
    imageEn: slideRatingEn,
    titleRu: 'Рейтинги и награды',
    titleEn: 'Ratings & Rewards',
    titleEs: 'Clasificaciones y premios',
    descriptionRu: 'Соревнуйтесь в лидербордах по звёздам, серии и продуктивности. Зарабатывайте звёзды, прокачивайте уровень, покупайте аватары, рамки и бейджи в магазине наград.',
    descriptionEn: 'Compete in leaderboards by stars, streaks, and productivity. Earn stars, level up, buy avatars, frames, and badges in the rewards shop.',
    descriptionEs: 'Compite en clasificaciones. Gana estrellas, sube de nivel, compra recompensas.',
    badge: { ru: 'Геймификация', en: 'Gamification', es: 'Gamificación' },
  },
  {
    id: 'analytics',
    image: slideAnalytics,
    imageEn: slideAnalyticsEn,
    titleRu: 'Аналитика и статистика',
    titleEn: 'Analytics & Statistics',
    titleEs: 'Análisis y estadísticas',
    descriptionRu: 'Детальная статистика продуктивности, аналитика по тегам, планирование и итоги дня. AI-аналитика генерирует персональные инсайты и рекомендации.',
    descriptionEn: 'Detailed productivity stats, tag analytics, day planning and summaries. AI analytics generates personal insights and recommendations.',
    descriptionEs: 'Estadísticas detalladas, análisis por etiquetas, planificación diaria e IA.',
    badge: { ru: 'Премиум', en: 'Premium', es: 'Premium' },
  },
  {
    id: 'cloud',
    image: slideCloud,
    imageEn: slideCloudEn,
    titleRu: 'Облако и синхронизация',
    titleEn: 'Cloud & Sync',
    titleEs: 'Nube y sincronización',
    descriptionRu: 'Автоматическое резервное копирование в облако, синхронизация между устройствами, экспорт данных в различных форматах. Ваши данные всегда в безопасности.',
    descriptionEn: 'Automatic cloud backup, multi-device sync, data export in various formats. Your data is always safe.',
    descriptionEs: 'Copia de seguridad automática, sincronización entre dispositivos, exportación de datos.',
    badge: { ru: 'Премиум', en: 'Premium', es: 'Premium' },
  },
  {
    id: 'subscription',
    image: slideSubscription,
    imageEn: slideSubscriptionEn,
    titleRu: 'Премиум-подписка',
    titleEn: 'Premium Subscription',
    titleEs: 'Suscripción Premium',
    descriptionRu: 'Безлимитные привычки, задачи и операции, AI-аналитика, облачная синхронизация. Скидки до 30% при оплате за длительный период. Инвестиция в вашу продуктивность.',
    descriptionEn: 'Unlimited habits, tasks, and operations, AI analytics, cloud sync. Up to 30% discount for longer periods. An investment in your productivity.',
    descriptionEs: 'Hábitos, tareas y operaciones ilimitados, IA, sincronización. Descuentos hasta 30%.',
    badge: { ru: 'Скидка до 30%', en: 'Up to 30% off', es: 'Hasta 30% dto.' },
  },
  {
    id: 'team',
    image: slideTeam,
    imageEn: slideTeamEn,
    titleRu: 'Командный тариф',
    titleEn: 'Team Plan',
    titleEs: 'Plan de equipo',
    descriptionRu: 'Общие цели, задачи и привычки для команды. Единый биллинг — каждый участник = 1 Активная единица. Централизованная аналитика и управление для руководителей.',
    descriptionEn: 'Shared goals, tasks, and habits for teams. Unified billing — each member = 1 Active Unit. Centralized analytics and management.',
    descriptionEs: 'Metas, tareas y hábitos compartidos. Facturación unificada por miembro.',
    badge: { ru: 'Для команд', en: 'For teams', es: 'Para equipos' },
  },
  {
    id: 'sprint',
    image: slideSprint,
    imageEn: slideSprintEn,
    titleRu: 'Спринт-модуль — командные рывки к цели',
    titleEn: 'Sprint Module — Team Sprints to Your Goals',
    titleEs: 'Módulo Sprint — Sprints de equipo',
    descriptionRu: 'Ставьте командные цели на 1–4 недели. Отслеживайте прогресс каждого участника в реальном времени. Ретроспектива по итогам спринта покажет точки роста и лидеров команды. Идеально для OKR, квартальных целей и хакатонов.',
    descriptionEn: 'Set team goals for 1–4 weeks. Track each member\'s progress in real-time. Sprint retrospective reveals growth areas and team leaders. Perfect for OKRs, quarterly goals, and hackathons.',
    descriptionEs: 'Establece metas de equipo por 1-4 semanas. Retrospectiva al final del sprint.',
    badge: { ru: 'Киллер-фича', en: 'Killer feature', es: 'Función clave' },
  },
  {
    id: 'partner',
    image: slidePartner,
    imageEn: slidePartnerEn,
    titleRu: 'Партнёрская программа 2.0',
    titleEn: 'Partner Program 2.0',
    titleEs: 'Programa de socios 2.0',
    descriptionRu: '2-уровневая реферальная система с комиссией от каждого привлечённого. Всего 4 реферала — и сервис окупается. Команды ускоряют рост: 1 команда = несколько Активных единиц.',
    descriptionEn: '2-level referral system with commissions per referral. Just 4 referrals and the service pays for itself. Teams accelerate growth.',
    descriptionEs: 'Sistema de referidos de 2 niveles. Solo 4 referidos y el servicio se paga solo.',
    badge: { ru: 'Заработок', en: 'Earnings', es: 'Ingresos' },
  },
];

const STORAGE_KEY = 'topfocus_onboarding_seen';

interface OnboardingSlideshowProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingSlideshow({ open, onClose }: OnboardingSlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const { language } = useTranslation();
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    if (open) setCurrentSlide(0);
  }, [open]);

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  }, [onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, goNext, goPrev, handleClose]);

  if (!open) return null;

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;

  const getTitle = (s: OnboardingSlide) =>
    language === 'ru' ? s.titleRu : language === 'es' ? s.titleEs : s.titleEn;
  const getDesc = (s: OnboardingSlide) =>
    language === 'ru' ? s.descriptionRu : language === 'es' ? s.descriptionEs : s.descriptionEn;
  const getBadge = (s: OnboardingSlide) =>
    s.badge ? (language === 'ru' ? s.badge.ru : language === 'es' ? s.badge.es : s.badge.en) : null;
  const getImage = (s: OnboardingSlide) =>
    language === 'ru' ? s.image : s.imageEn;

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] flex flex-col bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/60 hover:bg-background/90 transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Slide counter */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-background/60 text-xs font-medium text-muted-foreground">
          {currentSlide + 1} / {slides.length}
        </div>

        {/* Slide content */}
        <div
          className="flex-1 overflow-hidden"
          onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStart === null) return;
            const diff = touchStart - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
              if (diff > 0) goNext();
              else goPrev();
            }
            setTouchStart(null);
          }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.3 }}
              className="flex flex-col"
            >
              {/* Image */}
              <div className="relative w-full aspect-square overflow-hidden">
                <img
                  src={getImage(slide)}
                  alt={getTitle(slide)}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                {/* Gradient overlay at bottom of image */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card/95 to-transparent" />
                
                {/* Badge */}
                {getBadge(slide) && (
                  <div className="absolute top-14 right-3 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-semibold">
                    {getBadge(slide)}
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="px-6 pb-4 pt-2 space-y-2">
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {getTitle(slide)}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {getDesc(slide)}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="px-6 pb-5 pt-2 space-y-4">
          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > currentSlide ? 1 : -1);
                  setCurrentSlide(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide
                    ? 'w-6 bg-primary'
                    : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            {currentSlide > 0 && (
              <Button variant="outline" size="sm" onClick={goPrev} className="gap-1">
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex-1" />
            {!isLast ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground">
                  {language === 'ru' ? 'Пропустить' : language === 'es' ? 'Omitir' : 'Skip'}
                </Button>
                <Button size="sm" onClick={goNext} className="gap-1">
                  {language === 'ru' ? 'Далее' : language === 'es' ? 'Siguiente' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleClose} className="bg-gradient-to-r from-primary to-primary/80 gap-1 px-6">
                {language === 'ru' ? 'Начать!' : language === 'es' ? '¡Empezar!' : 'Get Started!'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Returns true if user hasn't seen onboarding yet */
export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(STORAGE_KEY);
}
