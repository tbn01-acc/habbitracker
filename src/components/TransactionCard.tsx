import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { FinanceTransaction, FINANCE_CATEGORIES } from '@/types/finance';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { useGoals } from '@/hooks/useGoals';
import { useSpheres } from '@/hooks/useSpheres';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TransactionDetailDialog } from './TransactionDetailDialog';
import { triggerCompletionCelebration } from '@/utils/celebrations';

interface TransactionCardProps {
  transaction: FinanceTransaction;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick?: (tagId: string) => void;
}

export function TransactionCard({ transaction, index, onToggle, onEdit, onDelete, onTagClick }: TransactionCardProps) {
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';
  const { tags: userTags } = useUserTags();
  const { goals } = useGoals();
  const { spheres } = useSpheres();
  const [expanded, setExpanded] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);

  const category = FINANCE_CATEGORIES.find(c => c.id === transaction.category);
  const isIncome = transaction.type === 'income';
  const transactionTags = userTags.filter(tag => transaction.tagIds?.includes(tag.id));
  const transactionGoal = goals.find(g => g.id === (transaction as any).goalId);
  const transactionSphere = spheres.find(s => s.id === (transaction as any).sphereId);

  // Check if name needs marquee
  useEffect(() => {
    if (nameRef.current) {
      setNeedsMarquee(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
  }, [transaction.name]);

  const accentColor = isIncome ? 'hsl(var(--habit))' : 'hsl(var(--destructive))';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "bg-card shadow-card border border-border transition-all overflow-hidden",
          transaction.completed && "opacity-60"
        )}
        style={{ 
          borderRadius: 'var(--radius-card)', 
          borderLeftColor: accentColor, 
          borderLeftWidth: 4 
        }}
      >
        {/* Row 1: Checkbox, Icon, Name, Amount, Chevron */}
        <div 
          className="flex items-center gap-2 p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {/* Checkbox */}
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (!transaction.completed) {
                triggerCompletionCelebration();
              }
              onToggle(); 
            }}
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all",
              transaction.completed
                ? "border-transparent bg-finance"
                : "border-finance/50 hover:border-finance"
            )}
          >
            {transaction.completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-white"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </button>

          {/* Icon */}
          <span className="text-lg flex-shrink-0">{category?.icon || '💰'}</span>

          {/* Name with marquee if needed */}
          <div 
            ref={nameRef}
            className={cn(
              "flex-1 min-w-0 font-medium text-foreground overflow-hidden whitespace-nowrap",
              transaction.completed && "line-through text-muted-foreground",
              needsMarquee && !expanded && "animate-marquee"
            )}
          >
            {transaction.name}
          </div>

          {/* Amount */}
          <span 
            className={cn(
              "font-semibold text-sm flex-shrink-0",
              isIncome ? "text-habit" : "text-destructive"
            )}
          >
            {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()} ₽
          </span>

          {/* Chevron */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
          >
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              {/* Row 2: Type, Category, Date, Menu */}
              <div className="flex items-center gap-2 px-3 pb-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full flex items-center gap-1",
                  isIncome ? "bg-habit/20 text-habit" : "bg-destructive/20 text-destructive"
                )}>
                  {isIncome ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isIncome ? t('income') : t('expense')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {category?.icon} {category?.name || transaction.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {transaction.date}
                </span>
                
                {/* Menu */}
                <div className="ml-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={onEdit}>
                        <Pencil className="w-4 h-4 mr-2" />
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onDelete} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Row 3: Sphere, Goal, Tags */}
              {(transactionSphere || transactionGoal || transactionTags.length > 0) && (
                <div className="flex items-center gap-1.5 px-3 pb-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
                  {transactionSphere && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: transactionSphere.color + '20', color: transactionSphere.color }}
                    >
                      {transactionSphere.icon} {isRussian ? transactionSphere.name_ru : transactionSphere.name_en}
                    </span>
                  )}
                  {transactionGoal && (
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: transactionGoal.color + '20', color: transactionGoal.color }}
                    >
                      {transactionGoal.icon} {transactionGoal.name}
                    </span>
                  )}
                  {transactionTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => onTagClick?.(tag.id)}
                      className="text-xs px-2 py-0.5 rounded-full transition-colors"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <TransactionDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        transaction={transaction}
        onEdit={onEdit}
        onDelete={onDelete}
        onTagClick={onTagClick}
      />
    </>
  );
}
