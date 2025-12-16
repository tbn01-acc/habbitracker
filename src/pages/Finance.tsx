import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Wallet } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import { FinanceTransaction } from '@/types/finance';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionDialog } from '@/components/TransactionDialog';
import { PageHeader } from '@/components/PageHeader';
import { FinanceViewTabs, FinanceViewType } from '@/components/finance/FinanceViewTabs';
import { FinanceCalendarView } from '@/components/finance/FinanceCalendarView';
import { FinanceProgressView } from '@/components/finance/FinanceProgressView';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
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
  const { transactions, isLoading, addTransaction, updateTransaction, deleteTransaction, toggleTransactionCompletion } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [deleteConfirmTransaction, setDeleteConfirmTransaction] = useState<FinanceTransaction | null>(null);
  const [activeView, setActiveView] = useState<FinanceViewType>('transactions');
  const { t } = useTranslation();

  const handleSaveTransaction = (transactionData: Omit<FinanceTransaction, 'id' | 'createdAt' | 'completed'>) => {
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
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

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income' && t.completed).reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense' && t.completed).reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Sort by date
  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

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
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader
          showTitle
          icon={<Wallet className="w-5 h-5 text-finance" />}
          iconBgClass="bg-finance/20"
          title={t('myFinance')}
          subtitle={`${transactions.length} ${t('transactions').toLowerCase()}`}
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
                        {t('startFinance')}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                        {t('createFirstTransaction')}
                      </p>
                      <Button 
                        onClick={() => setDialogOpen(true)}
                        className="bg-finance text-white hover:bg-finance/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('createTransaction')}
                      </Button>
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
                <FinanceCalendarView transactions={transactions} initialPeriod="7" />
              </motion.div>
            )}

            {activeView === 'progress' && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <FinanceProgressView transactions={transactions} initialPeriod="7" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* FAB */}
      {sortedTransactions.length > 0 && activeView === 'transactions' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-6"
        >
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setDialogOpen(true);
            }}
            size="lg"
            className="w-14 h-14 rounded-full bg-finance hover:bg-finance/90 shadow-lg p-0"
          >
            <Plus className="w-6 h-6 text-white" />
          </Button>
        </motion.div>
      )}

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
