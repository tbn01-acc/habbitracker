import { useState } from 'react';
import { CalendarClock, Archive, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { addDays, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface PostponeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPostponeCount: number;
  onPostpone: (days: number) => void;
  onArchive: () => void;
  onDelete: () => void;
  itemName: string;
  itemType: 'habit' | 'task';
}

export function PostponeDialog({
  open,
  onOpenChange,
  currentPostponeCount,
  onPostpone,
  onArchive,
  onDelete,
  itemName,
  itemType,
}: PostponeDialogProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const locale = isRussian ? ru : enUS;
  
  const canPostpone = currentPostponeCount < 2;
  const isLastPostpone = currentPostponeCount === 1;

  const postponeOptions = [
    { days: 1, label: isRussian ? 'На 1 день' : '1 day' },
    { days: 3, label: isRussian ? 'На 3 дня' : '3 days' },
    { days: 7, label: isRussian ? 'На неделю' : '1 week' },
  ];

  const getNewDate = (days: number) => {
    return format(addDays(new Date(), days), 'd MMM', { locale });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            {isRussian ? 'Перенос срока' : 'Postpone Deadline'}
          </DialogTitle>
          <DialogDescription>
            {itemName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {canPostpone ? (
            <>
              <div className="text-sm text-muted-foreground">
                {isRussian 
                  ? `Перенос ${currentPostponeCount + 1} из 2`
                  : `Postpone ${currentPostponeCount + 1} of 2`
                }
                {isLastPostpone && (
                  <span className="block mt-1 text-amber-500">
                    {isRussian 
                      ? '⚠️ Последняя возможность переноса!'
                      : '⚠️ Last postpone available!'
                    }
                  </span>
                )}
              </div>

              <div className="grid gap-2">
                {postponeOptions.map((option) => (
                  <Button
                    key={option.days}
                    variant="outline"
                    className="justify-between"
                    onClick={() => {
                      onPostpone(option.days);
                      onOpenChange(false);
                    }}
                  >
                    <span>{option.label}</span>
                    <span className="text-muted-foreground text-sm">
                      → {getNewDate(option.days)}
                    </span>
                  </Button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {isRussian 
                  ? 'Перенос не ухудшает статистику дня' 
                  : 'Postponing doesn\'t affect daily stats'
                }
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {isRussian 
                    ? 'Вы уже перенесли срок 2 раза. Выберите действие:' 
                    : 'You\'ve already postponed 2 times. Choose an action:'
                  }
                </p>
              </div>

              <div className="grid gap-2">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => {
                    onArchive();
                    onOpenChange(false);
                  }}
                >
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  {isRussian 
                    ? 'В Архив (пометка "Не выполнено")' 
                    : 'Archive (mark as "Not completed")'
                  }
                </Button>

                <Button
                  variant="outline"
                  className="justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    onDelete();
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  {isRussian ? 'Удалить' : 'Delete'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
