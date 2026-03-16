import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, PlayCircle } from 'lucide-react';
import { PomodoroWidgetCompact } from './PomodoroWidgetCompact';
import { TimeStatsWidgetCompact } from './TimeStatsWidgetCompact';
import { useTranslation } from '@/contexts/LanguageContext';

export function TopWidgetsSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useTranslation();
  const isRu = language === 'ru';

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-card border border-border hover:bg-muted/50 transition-colors"
      >
        {!isExpanded && (
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {isRu ? 'Приступить к выполнению' : 'Start working'}
            </span>
          </div>
        )}
        {isExpanded && <span />}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 items-start pt-3">
              <PomodoroWidgetCompact />
              <TimeStatsWidgetCompact />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
