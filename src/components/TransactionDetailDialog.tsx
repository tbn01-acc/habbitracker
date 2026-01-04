import { Calendar, Tag, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { FinanceTransaction, FINANCE_CATEGORIES } from '@/types/finance';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: FinanceTransaction;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick?: (tagId: string) => void;
}

export function TransactionDetailDialog({ open, onOpenChange, transaction, onEdit, onDelete, onTagClick }: TransactionDetailDialogProps) {
  const { t } = useTranslation();
  const { tags: userTags } = useUserTags();
  
  const transactionTags = userTags.filter(tag => transaction.tagIds?.includes(tag.id));
  const category = FINANCE_CATEGORIES.find(c => c.id === transaction.category);
  const isIncome = transaction.type === 'income';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
              isIncome ? "bg-habit/20" : "bg-destructive/20"
            )}>
              {category?.icon || '💰'}
            </div>
            <div>
              <h2 className={cn("text-xl font-semibold", transaction.completed && "line-through text-muted-foreground")}>
                {transaction.name}
              </h2>
              <p className="text-sm text-muted-foreground font-normal">{t('transaction')}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Amount */}
            <div className={cn(
              "flex items-center justify-between p-4 rounded-xl",
              isIncome ? "bg-habit/10" : "bg-destructive/10"
            )}>
              <div className="flex items-center gap-2">
                {isIncome ? (
                  <TrendingUp className="w-6 h-6 text-habit" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-destructive" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isIncome ? t('income') : t('expense')}
                </span>
              </div>
              <span className={cn(
                "text-2xl font-bold",
                isIncome ? "text-habit" : "text-destructive"
              )}>
                {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()} ₽
              </span>
            </div>

            {/* Status & Category */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={transaction.completed ? 'default' : 'outline'}>
                {transaction.completed ? t('completed') : t('planned')}
              </Badge>
              {category && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <span>{category.icon}</span>
                  {category.name}
                </Badge>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('dueDate')}</p>
                <p className="font-medium">{transaction.date}</p>
              </div>
            </div>

            {/* Tags */}
            {transactionTags.length > 0 && (
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('tagsLabel')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {transactionTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => { onTagClick?.(tag.id); onOpenChange(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm">{tag.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="text-xs text-muted-foreground text-center">
              {t('createdAt')}: {new Date(transaction.createdAt).toLocaleDateString()}
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => { onEdit(); onOpenChange(false); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
          <Button variant="destructive" onClick={() => { onDelete(); onOpenChange(false); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
