export interface FinanceCategory {
  id: string;
  name: string;
  color: string;
}

export interface FinanceTag {
  id: string;
  name: string;
  color: string;
}

export type TransactionRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface FinanceTransaction {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  description?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  customCategoryId?: string;
  tagIds: string[];
  recurrence?: TransactionRecurrence;
  goalId?: string;
  sphereId?: number;
}

export const FINANCE_CATEGORIES = [
  // Income categories
  { id: 'salary', name: 'Зарплата', icon: '💰', type: 'income' as const },
  { id: 'freelance', name: 'Фриланс', icon: '💼', type: 'income' as const },
  { id: 'investment', name: 'Инвестиции', icon: '📈', type: 'income' as const },
  { id: 'gift', name: 'Подарок', icon: '🎁', type: 'income' as const },
  { id: 'other_income', name: 'Другое', icon: '📦', type: 'income' as const },
  // Expense categories
  { id: 'food', name: 'Еда', icon: '🍔', type: 'expense' as const },
  { id: 'transport', name: 'Транспорт', icon: '🚗', type: 'expense' as const },
  { id: 'entertainment', name: 'Развлечения', icon: '🎬', type: 'expense' as const },
  { id: 'bills', name: 'Счета', icon: '📄', type: 'expense' as const },
  { id: 'shopping', name: 'Покупки', icon: '🛒', type: 'expense' as const },
  { id: 'health', name: 'Здоровье', icon: '🏥', type: 'expense' as const },
  { id: 'home', name: 'Дом', icon: '🏠', type: 'expense' as const },
  { id: 'other_expense', name: 'Другое', icon: '📦', type: 'expense' as const },
];

export const FINANCE_COLORS = [
  'hsl(145, 50%, 45%)', // finance green
  'hsl(168, 80%, 40%)', // teal
  'hsl(35, 95%, 55%)',  // orange
  'hsl(200, 80%, 50%)', // blue
  'hsl(262, 80%, 55%)', // purple
  'hsl(340, 80%, 55%)', // pink
  'hsl(45, 90%, 50%)',  // yellow
  'hsl(0, 70%, 55%)',   // red
];

export const getCategoryById = (id: string) => {
  return FINANCE_CATEGORIES.find(c => c.id === id);
};

export const DEFAULT_FINANCE_CATEGORIES: FinanceCategory[] = [
  { id: 'regular', name: 'Регулярные', color: 'hsl(145, 50%, 45%)' },
  { id: 'oneTime', name: 'Разовые', color: 'hsl(35, 95%, 55%)' },
  { id: 'savings', name: 'Накопления', color: 'hsl(200, 80%, 50%)' },
];

export const DEFAULT_FINANCE_TAGS: FinanceTag[] = [
  { id: 'planned', name: 'Запланировано', color: 'hsl(200, 80%, 50%)' },
  { id: 'unexpected', name: 'Внезапно', color: 'hsl(0, 70%, 55%)' },
  { id: 'recurring', name: 'Повторяется', color: 'hsl(262, 80%, 55%)' },
];
