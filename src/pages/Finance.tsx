import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Wallet, Settings } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { FinanceTransaction, FINANCE_COLORS, FINANCE_CATEGORIES } from '@/types/finance';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionDialog } from '@/components/TransactionDialog';
import { PageHeader } from '@/components/PageHeader';
import { FinanceViewTabs, FinanceViewType } from '@/components/finance/FinanceViewTabs';
import { FinanceMonthCalendar } from '@/components/finance/FinanceMonthCalendar';
import { FinanceProgressView } from '@/components/finance/FinanceProgressView';
import { GenericSettingsDialog } from '@/components/GenericSettingsDialog';
import { ExportButtons } from '@/components/ExportButtons';
import { LimitWarning, LimitBadge } from '@/components/LimitWarning';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { exportFinanceToCSV, exportFinanceToPDF } from '@/utils/exportData';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FinanceProps {
  openDialog?: boolean;
  onDialogClose?: () => void;
}

export default function Finance({ openDialog, onDialogClose }: FinanceProps) {
  const { 
    transactions, categories, tags, isLoading, 
    addTransaction, updateTransaction, deleteTransaction, toggleTransactionCompletion,
    addCategory, updateCategory, deleteCategory,
    addTag, updateTag, deleteTag
  } = useFinance();
  const { getTransactionsLimit } = useUsageLimits();
  const transactionsLimit = getTransactionsLimit(transactions.length);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<FinanceTransaction | null>(null);
  const [activeView, setActiveView] = useState<FinanceViewType>('transactions');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';

  const handleSaveTransaction = (transactionData: Omit<FinanceTransaction, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
      // Check limit before adding
      if (!transactionsLimit.canAdd) {
        toast.error(isRussian ? 'Достигнут лимит операций. Перейдите на PRO!' : 'Transaction limit reached. Upgrade to PRO!');
        return;
      }
      addTransaction(transactionData);
    }
    setEditingTransaction(null);
    setDialogOpen(false);
    onDialogClose?.();
  };

  const handleEditTransaction = (transaction: FinanceTransaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleDeleteTransaction = (transaction: FinanceTransaction) => {
    setDeleteConfirmTransaction(transaction);
  };

  const confirmDelete = () => {
    if (deleteConfirmTransaction) {
      deleteTransaction(deleteConfirmTransaction.id);
      setDeleteConfirmTransaction(null);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterCategory && t.customCategoryId !== filterCategory) return false;
    if (filterTag && !t.tagIds?.includes(filterTag)) return false;
    return true;
  });

  const hasFilters = filterCategory || filterTag;

  // Calculate totals
  const totalIncome = filteredTransactions.filter(t => t.type === 'income' && t.completed).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense' && t.completed).reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Get today's date string
  const today = format(new Date(), 'yyyy-MM-dd');

  // Separate completed today transactions and other transactions
  const completedTodayTransactions = useMemo(() => {
    return filteredTransactions.filter(t => t.completed && t.date === today);
  }, [filteredTransactions, today]);

  const otherTransactions = useMemo(() => {
    return filteredTransactions.filter(t => !(t.completed && t.date === today));
  }, [filteredTransactions, today]);

  // Sort other transactions by date (newest first)
  const sortedOtherTransactions = useMemo(() => {
    return [...otherTransactions].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [otherTransactions]);

  // Combined list: completed today first, then others
  const sortedTransactions = useMemo(() => {
    return [...completedTodayTransactions, ...sortedOtherTransactions];
  }, [completedTodayTransactions, sortedOtherTransactions]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-finance" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader
          showTitle
          icon={<Wallet className="w-5 h-5 text-finance" />}
          iconBgClass="bg-finance/20"
          title={t('myFinance')}
          subtitle={
            <span className="flex items-center gap-2">
              {`${transactions.length} ${t('transactions').toLowerCase()}`}
              <LimitBadge current={transactions.length} max={transactionsLimit.max} />
            </span>
          }
          rightAction={
            <div className="flex items-center gap-1">
              <ExportButtons
                onExportCSV={() => {
                  exportFinanceToCSV(transactions, t as unknown as Record<string, string>);
                  toast.success(t('exportSuccess'));
                }}
                onExportPDF={() => {
                  exportFinanceToPDF(transactions, t as unknown as Record<string, string>);
                }}
                accentColor="hsl(var(--finance))"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="w-9 h-9"
              >
                <Settings className="w-5 h-5 text-finance" />
              </Button>
              {/* Add button in header */}
              <Button
                onClick={() => {
                  setEditingTransaction(null);
                  setDialogOpen(true);
                }}
                size="icon"
                className="w-9 h-9 rounded-[0.35rem] bg-finance hover:bg-finance/90 p-0"
              >
                <Plus className="w-5 h-5 text-white" />
              </Button>
            </div>
          }
        />

        {/* Balance Card */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border mb-6">
          <p className="text-sm text-muted-foreground mb-1">{t('financeBalance')}</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-habit' : 'text-destructive'}`}>
            {balance >= 0 ? '+' : ''}{balance.toLocaleString()} ₽
          </p>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="text-habit">+{totalIncome.toLocaleString()} ₽</span>
            <span className="text-destructive">-{totalExpense.toLocaleString()} ₽</span>
          </div>
        </div>

        {/* Category Filter with Icons */}
        <div className="mb-4">
          <p className="text-sm font-medium text-foreground mb-2">{t('category')}</p>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setFilterCategory(null)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all min-w-[55px]",
                  !filterCategory ? "bg-finance/20 ring-2 ring-finance" : "bg-muted hover:bg-muted/80"
                )}
              >
                <span className="text-base">📋</span>
                <span className="text-[9px] text-muted-foreground leading-tight">{t('uncategorized')}</span>
              </button>
              {FINANCE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-all min-w-[55px]",
                    filterCategory === cat.id ? "bg-finance/20 ring-2 ring-finance" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-[9px] text-muted-foreground truncate max-w-[50px] leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Categories and Tags Filters */}
        {(categories.length > 0 || tags.length > 0) && (
          <div className="mb-4 space-y-2">
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1",
                      filterCategory === cat.id ? "text-white" : "bg-muted text-muted-foreground"
                    )}
                    style={filterCategory === cat.id ? { backgroundColor: cat.color } : undefined}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => setFilterTag(filterTag === tag.id ? null : tag.id)}
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium transition-all flex items-center gap-1",
                      filterTag === tag.id ? "text-white" : "bg-muted/50 text-muted-foreground"
                    )}
                    style={filterTag === tag.id ? { backgroundColor: tag.color } : undefined}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            )}
            {hasFilters && (
              <button
                onClick={() => { setFilterCategory(null); setFilterTag(null); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        )}

        {/* View Tabs */}
        <div className="mt-6">
          <FinanceViewTabs value={activeView} onValueChange={setActiveView} />
        </div>

        {/* Content based on active view */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {activeView === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <AnimatePresence mode="popLayout">
                  {sortedTransactions.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-finance/20 to-finance/10 flex items-center justify-center">
                        <Wallet className="w-10 h-10 text-finance" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {hasFilters ? t('noTransactionsForDay') : t('startFinance')}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                        {hasFilters ? t('clearFilters') : t('createFirstTransaction')}
                      </p>
                      {!hasFilters && (
                        <Button 
                          onClick={() => setDialogOpen(true)}
                          className="bg-finance text-white hover:bg-finance/90"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {t('createTransaction')}
                        </Button>
                      )}
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      {sortedTransactions.map((transaction, index) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          index={index}
                          onToggle={() => toggleTransactionCompletion(transaction.id)}
                          onEdit={() => handleEditTransaction(transaction)}
                          onDelete={() => handleDeleteTransaction(transaction)}
                        />
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeView === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <FinanceMonthCalendar 
                  transactions={filteredTransactions}
                  onToggle={toggleTransactionCompletion}
                />
              </motion.div>
            )}

            {activeView === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <FinanceProgressView transactions={filteredTransactions} initialPeriod="7" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dialogs */}
      <TransactionDialog
        open={dialogOpen || !!openDialog}
        onClose={() => {
          setDialogOpen(false);
          setEditingTransaction(null);
          onDialogClose?.();
        }}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        categories={categories}
        tags={tags}
      />

      <GenericSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        categories={categories}
        tags={tags}
        onAddCategory={addCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        onAddTag={addTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
        colors={FINANCE_COLORS}
        accentColor="hsl(145, 50%, 45%)"
        title={t('financeSettings')}
      />

      <AlertDialog open={!!deleteConfirmTransaction} onOpenChange={() => setDeleteConfirmTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')} {t('transaction').toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteTaskDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
