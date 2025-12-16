import { useState } from 'react';
import { Plus, Check, X, Trash2 } from 'lucide-react';
import { SubTask } from '@/types/task';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface SubtaskListProps {
  subtasks: SubTask[];
  onChange: (subtasks: SubTask[]) => void;
}

export function SubtaskList({ subtasks, onChange }: SubtaskListProps) {
  const { t } = useTranslation();
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addSubtask = () => {
    if (!newSubtaskName.trim()) return;
    const newSubtask: SubTask = {
      id: crypto.randomUUID(),
      name: newSubtaskName.trim(),
      completed: false,
    };
    onChange([...subtasks, newSubtask]);
    setNewSubtaskName('');
    setIsAdding(false);
  };

  const toggleSubtask = (id: string) => {
    onChange(subtasks.map(st => 
      st.id === id ? { ...st, completed: !st.completed } : st
    ));
  };

  const deleteSubtask = (id: string) => {
    onChange(subtasks.filter(st => st.id !== id));
  };

  return (
    <div className="space-y-2">
      {subtasks.map((subtask) => (
        <div 
          key={subtask.id} 
          className="flex items-center gap-2 bg-muted/50 rounded-lg p-2"
        >
          <button
            type="button"
            onClick={() => toggleSubtask(subtask.id)}
            className={cn(
              "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
              subtask.completed
                ? "bg-task border-task"
                : "border-muted-foreground hover:border-task"
            )}
          >
            {subtask.completed && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className={cn(
            "flex-1 text-sm",
            subtask.completed && "line-through text-muted-foreground"
          )}>
            {subtask.name}
          </span>
          <button
            type="button"
            onClick={() => deleteSubtask(subtask.id)}
            className="p-1 hover:bg-destructive/10 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      ))}

      {isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            placeholder={t('subtaskPlaceholder')}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
            autoFocus
          />
          <Button size="sm" onClick={addSubtask} className="h-8 px-2">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8 px-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('addSubtask')}
        </Button>
      )}
    </div>
  );
}
