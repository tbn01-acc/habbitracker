import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/contexts/LanguageContext';

interface FinanceWidgetProps {
  income: number;
  expense: number;
  onExpand?: () => void;
}

export function FinanceWidget({ income, expense, onExpand }: FinanceWidgetProps) {
  const { t } = useTranslation();
  const balance = income - expense;
  
  const getBalanceColor = () => {
    if (balance > 0) return 'bg-emerald-500';
    if (balance < 0) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ru-RU').format(amount);
  };

  return (
    <motion.button
      onClick={onExpand}
      className="w-full rounded-2xl p-4 shadow-card bg-card border border-border"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Row 1: Expense and Income */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Expense */}
        <div className="rounded-xl p-3 bg-violet-600 text-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium opacity-80">{t('expense')}</span>
          </div>
          <span className="text-lg font-bold">-{formatAmount(expense)}₽</span>
        </div>
        
        {/* Income */}
        <div className="rounded-xl p-3 bg-blue-500 text-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium opacity-80">{t('income')}</span>
          </div>
          <span className="text-lg font-bold">+{formatAmount(income)}₽</span>
        </div>
      </div>
      
      {/* Row 2: Balance */}
      <div className={`rounded-xl p-3 ${getBalanceColor()} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            <span className="text-xs font-medium opacity-80">{t('balance')}</span>
          </div>
          <span className="text-xl font-bold">
            {balance >= 0 ? '+' : ''}{formatAmount(balance)}₽
          </span>
        </div>
      </div>
    </motion.button>
  );
}
