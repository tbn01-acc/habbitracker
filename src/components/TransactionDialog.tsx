import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FinanceTransaction, FINANCE_CATEGORIES, FinanceCategory, FinanceTag, TransactionRecurrence } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TagSelector } from '@/components/TagSelector';
import { GoalSelector } from '@/components/goals/GoalSelector';
import { SphereSelector } from '@/components/spheres/SphereSelector';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<FinanceTransaction, 'id' | 'createdAt' | 'completed'>) => void;
  transaction?: FinanceTransaction | null;
  categories: FinanceCategory[];
  tags: FinanceTag[];
}

export function TransactionDialog({ open, onClose, onSave, transaction, categories, tags }: TransactionDialogProps) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(FINANCE_CATEGORIES[4].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customCategoryId, setCustomCategoryId] = useState<string | undefined>();
  const [goalId, setGoalId] = useState<string | null>(null);
  const [sphereId, setSphereId] = useState<number | null>(null);
  const [sphereLockedByGoal, setSphereLockedByGoal] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [commonTagIds, setCommonTagIds] = useState<string[]>([]);
  const [recurrence, setRecurrence] = useState<TransactionRecurrence>('none');
  const { t } = useTranslation();

  useEffect(() => {
    if (transaction) {
      setName(transaction.name);
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setDate(transaction.date);
      setCustomCategoryId(transaction.customCategoryId);
      setGoalId(transaction.goalId || null);
      setSphereId(transaction.sphereId || null);
      setSphereLockedByGoal(!!transaction.goalId);
      setRecurrence(transaction.recurrence || 'none');
      const localTagIdSet = new Set(tags.map(t => t.id));
      setTagIds((transaction.tagIds || []).filter(id => localTagIdSet.has(id)));
      setCommonTagIds((transaction.tagIds || []).filter(id => !localTagIdSet.has(id)));
    } else {
      setName('');
      setType('expense');
      setAmount('');
      setCategory(FINANCE_CATEGORIES[4].id);
      setDate(new Date().toISOString().split('T')[0]);
      setCustomCategoryId(undefined);
      setGoalId(null);
      setSphereId(null);
      setSphereLockedByGoal(false);
      setTagIds([]);
      setCommonTagIds([]);
      setRecurrence('none');
    }
  }, [transaction, open, tags]);

  const handleSave = () => {
    if (!name.trim() || !amount) return;
    // Require sphere for authenticated users
    if (user && !sphereId) return;
    const allTagIds = [...tagIds, ...commonTagIds];
    onSave({ 
      name: name.trim(), 
      type, 
      amount: parseFloat(amount), 
      category, 
      date,
      customCategoryId,
      tagIds: allTagIds,
      goalId: goalId || undefined,
      sphereId: sphereId,
      recurrence,
    });
    onClose();
  };

  const recurrenceOptions: { value: TransactionRecurrence; label: string }[] = [
    { value: 'none', label: isRussian ? 'Нет' : 'None' },
    { value: 'daily', label: isRussian ? 'Ежедневно' : 'Daily' },
    { value: 'weekly', label: isRussian ? 'Еженедельно' : 'Weekly' },
    { value: 'monthly', label: isRussian ? 'Ежемесячно' : 'Monthly' },
  ];

  const handleGoalChange = (newGoalId: string | null, goalSphereId?: number | null) => {
    setGoalId(newGoalId);
    if (newGoalId && goalSphereId !== undefined) {
      setSphereId(goalSphereId);
      setSphereLockedByGoal(true);
    } else {
      setSphereLockedByGoal(false);
    }
  };

  const filteredCategories = FINANCE_CATEGORIES.filter(c => 
    c.type === type || c.type === undefined
  );

  const toggleTag = (tagId: string) => {
    if (tagIds.includes(tagId)) {
      setTagIds(tagIds.filter(id => id !== tagId));
    } else {
      setTagIds([...tagIds, tagId]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[5%] bottom-24 max-w-md mx-auto bg-card rounded-3xl p-6 shadow-lg z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {transaction ? t('edit') : t('createTransaction')}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Тип операции
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setType('income')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                    type === 'income'
                      ? "bg-habit text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('income')}
                </button>
                <button
                  onClick={() => setType('expense')}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                    type === 'expense'
                      ? "bg-destructive text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {t('expense')}
                </button>
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Название
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Зарплата"
                className="bg-background border-border"
              />
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('amount')}
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-background border-border"
              />
            </div>

            {/* Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {isRussian ? 'Дата' : 'Date'}
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            {/* Recurrence */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {isRussian ? 'Повторение' : 'Recurrence'}
              </label>
              <div className="flex flex-wrap gap-2">
                {recurrenceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRecurrence(option.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      recurrence === option.value
                        ? "bg-finance text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category with Icons */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('category')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {filteredCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={cn(
                      "p-2 rounded-xl flex flex-col items-center gap-1 transition-all",
                      category === c.id
                        ? "bg-finance/20 ring-2 ring-finance"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <span className="text-lg">{c.icon}</span>
                    <span className="text-xs text-muted-foreground truncate w-full text-center">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Category */}
            {categories.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('categoriesLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCustomCategoryId(undefined)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      !customCategoryId
                        ? "bg-finance text-white"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {t('uncategorized')}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCustomCategoryId(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                        customCategoryId === cat.id
                          ? "text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      style={customCategoryId === cat.id ? { backgroundColor: cat.color } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('tagsLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5",
                        tagIds.includes(tag.id)
                          ? "text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      style={tagIds.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Goal Selector */}
            {user && (
              <div className="mb-6">
                <GoalSelector
                  value={goalId}
                  onChange={handleGoalChange}
                  isRussian={isRussian}
                />
              </div>
            )}

            {/* Sphere Selector - locked if goal selected */}
            {user && (
              <div className="mb-6">
                <SphereSelector
                  value={sphereId}
                  onChange={setSphereId}
                  disabled={sphereLockedByGoal}
                  label={isRussian ? 'Сфера жизни' : 'Life Sphere'}
                />
              </div>
            )}

            {/* Common Tags (from profile) */}
            {user && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('commonTags')}
                </label>
                <TagSelector 
                  selectedTagIds={commonTagIds} 
                  onChange={setCommonTagIds} 
                />
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={!name.trim() || !amount}
              className="w-full bg-finance hover:bg-finance/90 text-white"
            >
              {t('save')}
            </Button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
