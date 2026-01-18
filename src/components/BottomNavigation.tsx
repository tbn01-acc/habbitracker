import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Target, CheckSquare, Wallet, Plus, Wrench, Aperture, Flag } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { GoalDialog } from '@/components/goals/GoalDialog';
import { AchievementPublishDialog } from '@/components/AchievementPublishDialog';
import { useGoals } from '@/hooks/useGoals';

interface BottomNavigationProps {
  onAddHabit: () => void;
  onAddTask: () => void;
  onAddTransaction: () => void;
}

export function BottomNavigation({ 
  onAddHabit, 
  onAddTask, 
  onAddTransaction 
}: BottomNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const { addGoal } = useGoals();

  const isRussian = language === 'ru';

  const navItems = [
    { path: '/', icon: Home, label: t('home'), color: 'hsl(var(--primary))' },
    { path: '/habits', icon: Target, label: t('habits'), color: 'hsl(var(--habit))' },
    { path: '/tasks', icon: CheckSquare, label: t('tasks'), color: 'hsl(var(--task))' },
    // Plus button goes here (index 3)
    { path: '/finance', icon: Wallet, label: t('finance'), color: 'hsl(var(--finance))' },
    { path: '/goals', icon: Flag, label: isRussian ? 'Мои цели' : 'My Goals', color: 'hsl(45, 90%, 50%)' },
    { path: '/services', icon: Wrench, label: t('services'), color: 'hsl(var(--service))' },
  ];

  const quickAddItems = [
    { label: isRussian ? 'Цель' : 'Goal', icon: Target, color: 'hsl(262, 80%, 55%)', action: () => setGoalDialogOpen(true), path: '/goals' },
    { label: t('habit'), icon: Target, color: 'hsl(var(--habit))', action: onAddHabit, path: '/habits' },
    { label: t('task'), icon: CheckSquare, color: 'hsl(var(--task))', action: onAddTask, path: '/tasks' },
    { label: t('transaction'), icon: Wallet, color: 'hsl(var(--finance))', action: onAddTransaction, path: '/finance' },
    { label: isRussian ? 'Пост' : 'Post', icon: Aperture, color: 'hsl(var(--primary))', action: () => setPostDialogOpen(true), path: '/focus' },
  ];

  const handleQuickAdd = (item: typeof quickAddItems[0]) => {
    setIsMenuOpen(false);
    // For goal and post dialogs, don't navigate first
    if (item.label === (isRussian ? 'Цель' : 'Goal') || item.label === (isRussian ? 'Пост' : 'Post')) {
      item.action();
    } else {
      navigate(item.path);
      setTimeout(() => {
        item.action();
      }, 100);
    }
  };

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  const handleAddGoal = async (data: any) => {
    await addGoal(data);
    setGoalDialogOpen(false);
    navigate('/goals');
  };

  const leftItems = navItems.slice(0, 3); // Home, Habits, Tasks
  const rightItems = navItems.slice(3); // Finance, Services, Goals

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Add Menu - Above bottom navigation, arc centered on + button */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed bottom-28 inset-x-0 z-50 flex justify-center">
            <div className="relative w-0 h-0">
              {quickAddItems.map((item, index) => {
                const totalItems = quickAddItems.length;
                const angleSpread = 120; // Increased spread
                const startAngle = -180 + (180 - angleSpread) / 2;
                const angleStep = angleSpread / (totalItems - 1);
                const angle = startAngle + (index * angleStep);
                const radius = 120; // Increased radius
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;

                return (
                  <motion.button
                    key={item.label}
                    initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                    animate={{ scale: 1, x, y, opacity: 1 }}
                    exit={{ scale: 0, x: 0, y: 0, opacity: 0 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
                    onClick={() => handleQuickAdd(item)}
                    className="absolute flex flex-col items-center justify-center gap-1"
                    style={{ transform: `translate(-50%, -50%)` }}
                  >
                    <div 
                      className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: item.color }}
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-1">
          {/* Left side items: Home, Habits, Tasks */}
          {leftItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1.5 rounded-lg transition-colors min-w-[40px]",
                location.pathname === item.path
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={location.pathname === item.path ? { color: item.color } : undefined}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 hidden sm:block">{item.label}</span>
            </button>
          ))}

          {/* Center Add Button */}
          <div className="relative">
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center shadow-glow -mt-6"
              whileTap={{ scale: 0.95 }}
              animate={{ rotate: isMenuOpen ? 45 : 0 }}
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </motion.button>
          </div>

          {/* Right side items: Finance, Services, Statistics */}
          {rightItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavClick(item.path)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1.5 rounded-lg transition-colors min-w-[40px]",
                location.pathname === item.path
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={location.pathname === item.path ? { color: item.color } : undefined}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] mt-0.5 hidden sm:block">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Goal Dialog */}
      <GoalDialog
        open={goalDialogOpen}
        onOpenChange={setGoalDialogOpen}
        onSave={handleAddGoal}
      />

      {/* Post Dialog */}
      <AchievementPublishDialog
        open={postDialogOpen}
        onOpenChange={setPostDialogOpen}
      />
    </>
  );
}
