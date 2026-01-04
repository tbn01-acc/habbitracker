import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MoreVertical, Pencil, Trash2, TrendingUp, TrendingDown, Tag } from 'lucide-react';
import { FinanceTransaction, FINANCE_CATEGORIES } from '@/types/finance';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TransactionDetailDialog } from './TransactionDetailDialog';

interface TransactionCardProps {
  transaction: FinanceTransaction;
  index: number;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick?: (tagId: string) => void;
}

export function TransactionCard({ transaction, index, onToggle, onEdit, onDelete, onTagClick }: TransactionCardProps) {
  const { t } = useTranslation();
  const { tags: userTags } = useUserTags();
  const [detailOpen, setDetailOpen] = useState(false);

  const category = FINANCE_CATEGORIES.find(c => c.id === transaction.category);
  const isIncome = transaction.type === 'income';
  const transactionTags = userTags.filter(tag => transaction.tagIds?.includes(tag.id));

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "bg-card rounded-2xl p-4 shadow-card border border-border transition-all cursor-pointer hover:shadow-md",
          transaction.completed && "opacity-60"
        )}
        onClick={() => setDetailOpen(true)}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={cn(
              "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5",
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

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{category?.icon || '💰'}</span>
                <h3 
                  className={cn(
                    "font-medium text-foreground",
                    transaction.completed && "line-through text-muted-foreground"
                  )}
                >
                  {transaction.name}
                </h3>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Pencil className="w-4 h-4 mr-2" />
                    {t('edit')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(); }} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Meta info */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                {isIncome ? (
                  <TrendingUp className="w-4 h-4 text-habit" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">
                  {transaction.date}
                </span>
              </div>
              <span 
                className={cn(
                  "font-semibold",
                  isIncome ? "text-habit" : "text-destructive"
                )}
              >
                {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()} ₽
              </span>
            </div>

            {/* Tags */}
            {transactionTags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                {transactionTags.slice(0, 2).map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => onTagClick?.(tag.id)}
                    className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-muted-foreground">{tag.name}</span>
                  </button>
                ))}
                {transactionTags.length > 2 && (
                  <span className="text-xs text-muted-foreground">+{transactionTags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
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
