import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, Timer, Clock, FileText, DollarSign, 
  Calculator, Droplets, Shuffle, Globe, CheckCircle, Scale 
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { PomodoroTimer } from '@/components/services/PomodoroTimer';
import { TimeTracker } from '@/components/services/TimeTracker';
import { NotesList } from '@/components/services/NotesList';
import { CurrencyRates } from '@/components/services/CurrencyRates';
import { DateCalculator } from '@/components/services/DateCalculator';
import { HabitCounters } from '@/components/services/HabitCounters';
import { RandomDecision } from '@/components/services/RandomDecision';
import { WorldTime } from '@/components/services/WorldTime';
import { Checklists } from '@/components/services/Checklists';
import { UnitConverter } from '@/components/services/UnitConverter';
import { cn } from '@/lib/utils';

type ServiceType = 
  | 'pomodoro' 
  | 'timeTracker' 
  | 'notes' 
  | 'currency' 
  | 'dateCalc' 
  | 'counters' 
  | 'random' 
  | 'worldTime' 
  | 'checklists' 
  | 'converter';

const services: { id: ServiceType; icon: typeof Timer; labelKey: string }[] = [
  { id: 'pomodoro', icon: Timer, labelKey: 'pomodoroTimer' },
  { id: 'timeTracker', icon: Clock, labelKey: 'timeTracker' },
  { id: 'notes', icon: FileText, labelKey: 'notes' },
  { id: 'currency', icon: DollarSign, labelKey: 'currencyRates' },
  { id: 'dateCalc', icon: Calculator, labelKey: 'dateCalculator' },
  { id: 'counters', icon: Droplets, labelKey: 'habitCounters' },
  { id: 'random', icon: Shuffle, labelKey: 'randomDecision' },
  { id: 'worldTime', icon: Globe, labelKey: 'worldTime' },
  { id: 'checklists', icon: CheckCircle, labelKey: 'checklists' },
  { id: 'converter', icon: Scale, labelKey: 'unitConverter' },
];

export default function Services() {
  const [activeService, setActiveService] = useState<ServiceType>('pomodoro');
  const { t } = useTranslation();

  const renderService = () => {
    switch (activeService) {
      case 'pomodoro':
        return <PomodoroTimer />;
      case 'timeTracker':
        return <TimeTracker />;
      case 'notes':
        return <NotesList />;
      case 'currency':
        return <CurrencyRates />;
      case 'dateCalc':
        return <DateCalculator />;
      case 'counters':
        return <HabitCounters />;
      case 'random':
        return <RandomDecision />;
      case 'worldTime':
        return <WorldTime />;
      case 'checklists':
        return <Checklists />;
      case 'converter':
        return <UnitConverter />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-lg mx-auto px-4 py-6">
        <PageHeader
          showTitle
          icon={<Wrench className="w-5 h-5 text-service" />}
          iconBgClass="bg-service/20"
          title={t('myServices')}
          subtitle={t('services')}
        />

        {/* Service Grid */}
        <div className="mt-6 grid grid-cols-5 gap-2">
          {services.map((service) => {
            const Icon = service.icon;
            const isActive = activeService === service.id;
            return (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all",
                  isActive 
                    ? "bg-service text-white" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] mt-1 text-center leading-tight">
                  {t(service.labelKey as any)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Service Content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeService}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderService()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
