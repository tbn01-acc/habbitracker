import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItem {
  id: string;
  name: string;
  icon?: string;
  completed: boolean;
}

interface TodoSectionProps {
  title: string;
  items: TodoItem[];
  color: string;
  icon: React.ReactNode;
  onToggle: (id: string) => void;
  emptyMessage?: string;
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}


export function TodoSection({ 
  title, 
  items, 
  color, 
  icon, 
  onToggle, 
  emptyMessage,
  isExpanded = false,
  onExpand,
  onCollapse,
  onSwipeLeft,
  onSwipeRight,
  hasNext = false,
  hasPrev = false
}: TodoSectionProps) {
  const incompleteItems = items.filter(i => !i.completed);
  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;

  const handleRingClick = () => {
    if (onExpand) onExpand();
  };

  const handleHeaderClick = () => {
    if (onCollapse) onCollapse();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    }
  };

  // Collapsed view - square tile with indicator
  if (!isExpanded) {
    return (
      <motion.button
        onClick={handleRingClick}
        className="w-full aspect-square rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-card"
        style={{ backgroundColor: color }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        layoutId={`tile-${title}`}
      >
        <motion.div 
          className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20"
          layoutId={`ring-${title}`}
        >
          <span className="text-xl font-bold text-white">
            {incompleteItems.length}
          </span>
        </motion.div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/20">
            <div className="text-white">{icon}</div>
          </div>
          <span className="text-sm font-medium text-white">{title}</span>
        </div>
      </motion.button>
    );
  }

  // Expanded view - full list with swipe support
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="col-span-2 lg:col-span-4 w-full rounded-2xl p-4 shadow-card touch-pan-y"
      style={{ backgroundColor: color }}
      layoutId={`tile-${title}`}
    >
      <button 
        onClick={handleHeaderClick}
        className="w-full flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
      >
        {hasPrev && (
          <ChevronLeft className="w-5 h-5 text-white/60" />
        )}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20"
        >
          <div className="text-white">{icon}</div>
        </div>
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
          {incompleteItems.length}
        </span>
        {hasNext && (
          <ChevronRight className="w-5 h-5 text-white/60" />
        )}
      </button>

      <motion.div 
        className="space-y-2 max-h-48 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
      >
        {incompleteItems.length === 0 ? (
          <p className="text-xs text-white/80 py-2 text-center">
            {emptyMessage || '✓'}
          </p>
        ) : (
          incompleteItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => onToggle(item.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              className={cn(
                "w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left",
                "bg-white/20 hover:bg-white/30"
              )}
            >
              <div
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors border-white/50"
              >
                {item.completed && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              
              {item.icon && (
                <span className="text-sm flex-shrink-0">{item.icon}</span>
              )}
              
              <span className="text-sm truncate text-white">
                {item.name}
              </span>
            </motion.button>
          ))
        )}
      </motion.div>

      {/* Swipe hint */}
      <div className="flex justify-center gap-1 mt-3 pt-2 border-t border-white/10">
        {(hasPrev || hasNext) && (
          <p className="text-xs text-white/50">← свайп →</p>
        )}
      </div>
    </motion.div>
  );
}
