import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { TaskCategory, TaskTag, TaskStatus } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TaskFiltersProps {
  categories: TaskCategory[];
  tags: TaskTag[];
  selectedCategories: string[];
  selectedTags: string[];
  selectedStatuses: TaskStatus[];
  onCategoriesChange: (ids: string[]) => void;
  onTagsChange: (ids: string[]) => void;
  onStatusesChange: (statuses: TaskStatus[]) => void;
}

export function TaskFilters({
  categories,
  tags,
  selectedCategories,
  selectedTags,
  selectedStatuses,
  onCategoriesChange,
  onTagsChange,
  onStatusesChange,
}: TaskFiltersProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const statuses: { value: TaskStatus; label: string }[] = [
    { value: 'not_started', label: t('statusNotStarted') },
    { value: 'in_progress', label: t('statusInProgress') },
    { value: 'done', label: t('statusDone') },
  ];

  const hasFilters = selectedCategories.length > 0 || selectedTags.length > 0 || selectedStatuses.length > 0;

  const toggleCategory = (id: string) => {
    onCategoriesChange(
      selectedCategories.includes(id)
        ? selectedCategories.filter(c => c !== id)
        : [...selectedCategories, id]
    );
  };

  const toggleTag = (id: string) => {
    onTagsChange(
      selectedTags.includes(id)
        ? selectedTags.filter(t => t !== id)
        : [...selectedTags, id]
    );
  };

  const toggleStatus = (status: TaskStatus) => {
    onStatusesChange(
      selectedStatuses.includes(status)
        ? selectedStatuses.filter(s => s !== status)
        : [...selectedStatuses, status]
    );
  };

  const clearFilters = () => {
    onCategoriesChange([]);
    onTagsChange([]);
    onStatusesChange([]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "gap-2",
            hasFilters && "border-task text-task"
          )}
        >
          <Filter className="w-4 h-4" />
          {t('filters')}
          {hasFilters && (
            <span className="bg-task text-white text-xs px-1.5 rounded-full">
              {selectedCategories.length + selectedTags.length + selectedStatuses.length}
            </span>
          )}
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            {t('clearFilters')}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card rounded-2xl p-4 border border-border space-y-4">
              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">{t('category')}</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => {
                    const isSelected = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                          isSelected
                            ? "bg-transparent border-2 font-bold"
                            : "bg-muted/50 border border-transparent text-muted-foreground hover:bg-muted"
                        )}
                        style={{ 
                          borderColor: isSelected ? category.color : 'transparent',
                          color: category.color
                        }}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">{t('tagsLabel')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => {
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                            isSelected
                              ? "bg-transparent border-2 font-bold"
                              : "bg-muted/50 border border-transparent text-muted-foreground hover:bg-muted"
                          )}
                          style={{ 
                            borderColor: isSelected ? tag.color : 'transparent',
                            color: tag.color
                          }}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">{t('status')}</h4>
                <div className="flex flex-wrap gap-2">
                  {statuses.map(status => (
                    <button
                      key={status.value}
                      onClick={() => toggleStatus(status.value)}
                      className={cn(
                        "px-3 py-1 rounded-full text-sm transition-all",
                        selectedStatuses.includes(status.value)
                          ? "bg-task text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
