import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { FinanceTransaction } from '@/types/finance';
import { useTranslation } from '@/contexts/LanguageContext';
import { PeriodSelector } from '@/components/PeriodSelector';

interface FinanceProgressViewProps {
  transactions: FinanceTransaction[];
  initialPeriod?: string;
}

export function FinanceProgressView({ transactions, initialPeriod = '7' }: FinanceProgressViewProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState(initialPeriod);
  
  const days = parseInt(period);

  const chartData = useMemo(() => {
    const data: { date: string; label: string; income: number; expense: number; balance: number }[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        date: dateStr,
        label: date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        income,
        expense,
        balance: income - expense,
      });
    }
    
    return data;
  }, [transactions, days]);

  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const totalExpense = chartData.reduce((sum, d) => sum + d.expense, 0);
  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-4">
      <PeriodSelector value={period as '7' | '14' | '30'} onValueChange={(v) => setPeriod(v)} />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">{t('income')}</span>
          </div>
          <p className="text-lg font-bold text-green-500">
            +{totalIncome.toLocaleString()} ₽
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">{t('expense')}</span>
          </div>
          <p className="text-lg font-bold text-destructive">
            -{totalExpense.toLocaleString()} ₽
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 shadow-card border border-border"
        >
          <span className="text-xs text-muted-foreground">{t('financeBalance')}</span>
          <p className={`text-lg font-bold ${totalBalance >= 0 ? 'text-green-500' : 'text-destructive'}`}>
            {totalBalance >= 0 ? '+' : ''}{totalBalance.toLocaleString()} ₽
          </p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border"
      >
        <h3 className="text-sm font-medium text-foreground mb-4">Динамика баланса</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(145, 70%, 45%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(145, 70%, 45%)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 70%, 55%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(0, 70%, 55%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} ₽`,
                  name === 'income' ? t('income') : t('expense')
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                stroke="hsl(145, 70%, 45%)" 
                fill="url(#incomeGradient)"
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="expense" 
                stroke="hsl(0, 70%, 55%)" 
                fill="url(#expenseGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-4 shadow-card border border-border"
      >
        <h3 className="text-sm font-medium text-foreground mb-4">Расходы по категориям</h3>
        <CategoryBreakdown transactions={transactions} days={days} />
      </motion.div>
    </div>
  );
}

function CategoryBreakdown({ transactions, days }: { transactions: FinanceTransaction[]; days: number }) {
  const { t } = useTranslation();
  
  const categoryData = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days);
    
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && t.type === 'expense';
    });
    
    const categoryMap: Record<string, { amount: number; icon: string }> = {};
    
    filteredTransactions.forEach(t => {
      if (!categoryMap[t.category]) {
        const cat = getCategoryById(t.category);
        categoryMap[t.category] = { amount: 0, icon: cat?.icon || '📦' };
      }
      categoryMap[t.category].amount += t.amount;
    });
    
    return Object.entries(categoryMap)
      .map(([category, data]) => ({
        category,
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, days]);

  const totalExpense = categoryData.reduce((sum, c) => sum + c.amount, 0);

  if (categoryData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Нет расходов за период
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {categoryData.map((item) => {
        const percentage = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0;
        return (
          <div key={item.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span className="text-foreground">{getCategoryLabel(item.category, t)}</span>
              </span>
              <span className="text-muted-foreground">{item.amount.toLocaleString()} ₽</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-finance rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getCategoryById(id: string) {
  const categoryMap: Record<string, { icon: string }> = {
    food: { icon: '🍔' },
    transport: { icon: '🚗' },
    entertainment: { icon: '🎬' },
    bills: { icon: '📄' },
    shopping: { icon: '🛒' },
    health: { icon: '💊' },
    home: { icon: '🏠' },
    salary: { icon: '💰' },
    freelance: { icon: '💻' },
    investment: { icon: '📈' },
    gift: { icon: '🎁' },
    other_income: { icon: '💵' },
    other_expense: { icon: '📦' },
  };
  return categoryMap[id] || { icon: '📦' };
}

function getCategoryLabel(category: string, t: (key: string) => string) {
  const categoryMap: Record<string, string> = {
    food: 'Еда',
    transport: 'Транспорт',
    entertainment: 'Развлечения',
    bills: 'Счета',
    shopping: 'Покупки',
    health: 'Здоровье',
    home: 'Дом',
    salary: 'Зарплата',
    freelance: 'Фриланс',
    investment: 'Инвестиции',
    gift: 'Подарок',
    other_income: 'Другое',
    other_expense: 'Другое',
  };
  return categoryMap[category] || category;
}
