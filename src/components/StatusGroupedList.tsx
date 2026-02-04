import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface StatusGroupedListProps<T> {
  items: {
    completed: T[];
    inProgress: T[];
    today: T[];
    future: T[];
  };
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T) => string;
  emptyState?: React.ReactNode;
  showInProgress?: boolean;
  accentColor?: string;
}

export function StatusGroupedList<T>({
  items,
  renderItem,
  getItemKey,
  emptyState,
  showInProgress = true,
  accentColor = 'hsl(var(--primary))'
}: StatusGroupedListProps<T>) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  
  const [todayExpanded, setTodayExpanded] = useState(true);
  const [futureExpanded, setFutureExpanded] = useState(false);
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [inProgressExpanded, setInProgressExpanded] = useState(true);

  const hasItems = items.completed.length > 0 || items.inProgress.length > 0 || items.today.length > 0 || items.future.length > 0;

  if (!hasItems) {
    return <>{emptyState}</>;
  }

  const GroupHeader = ({ 
    title, 
    count, 
    expanded, 
    onToggle, 
    badge,
    className 
  }: { 
    title: string; 
    count: number; 
    expanded: boolean; 
    onToggle: () => void;
    badge?: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-2 py-2 px-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
    >
      {expanded ? (
        <ChevronDown className="w-4 h-4" />
      ) : (
        <ChevronRight className="w-4 h-4" />
      )}
      <span>{title}</span>
      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
        {count}
      </span>
      {badge}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Completed Today */}
      {items.completed.length > 0 && (
        <div>
          <GroupHeader
            title={isRussian ? 'Выполнено' : 'Completed'}
            count={items.completed.length}
            expanded={completedExpanded}
            onToggle={() => setCompletedExpanded(!completedExpanded)}
            className="text-habit"
          />
          <AnimatePresence>
            {completedExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {items.completed.map((item, index) => (
                  <div key={getItemKey(item)}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* In Progress */}
      {showInProgress && items.inProgress.length > 0 && (
        <div>
          <GroupHeader
            title={isRussian ? 'Выполняется' : 'In Progress'}
            count={items.inProgress.length}
            expanded={inProgressExpanded}
            onToggle={() => setInProgressExpanded(!inProgressExpanded)}
            className="text-accent"
          />
          <AnimatePresence>
            {inProgressExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {items.inProgress.map((item, index) => (
                  <div key={getItemKey(item)}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Today */}
      {items.today.length > 0 && (
        <div>
          <GroupHeader
            title={isRussian ? 'Сегодня' : 'Today'}
            count={items.today.length}
            expanded={todayExpanded}
            onToggle={() => setTodayExpanded(!todayExpanded)}
          />
          <AnimatePresence>
            {todayExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {items.today.map((item, index) => (
                  <div key={getItemKey(item)}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Future */}
      {items.future.length > 0 && (
        <div>
          <GroupHeader
            title={isRussian ? 'Будущие' : 'Future'}
            count={items.future.length}
            expanded={futureExpanded}
            onToggle={() => setFutureExpanded(!futureExpanded)}
          />
          <AnimatePresence>
            {futureExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden"
              >
                {items.future.map((item, index) => (
                  <div key={getItemKey(item)}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
