import { Habit } from '@/types/habit';
import { Task } from '@/types/task';
import { FinanceTransaction, getCategoryById } from '@/types/finance';
import { format } from 'date-fns';

// CSV Export utilities
export function exportToCSV(data: string[][], filename: string) {
  const csvContent = data.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

// Habits Export
export function exportHabitsToCSV(habits: Habit[], translations: Record<string, string>) {
  const headers = [
    translations.habitName || 'Название',
    translations.icon || 'Иконка',
    translations.streak || 'Серия',
    translations.targetDays || 'Целевые дни',
    translations.totalCompleted || 'Всего выполнено',
    translations.createdAt || 'Создано'
  ];
  
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  const rows = habits.map(habit => [
    habit.name,
    habit.icon,
    habit.streak.toString(),
    habit.targetDays.map(d => days[d]).join(', '),
    habit.completedDates.length.toString(),
    format(new Date(habit.createdAt), 'dd.MM.yyyy')
  ]);
  
  exportToCSV([headers, ...rows], `habits_${format(new Date(), 'yyyy-MM-dd')}`);
}

// Tasks Export
export function exportTasksToCSV(tasks: Task[], translations: Record<string, string>) {
  const headers = [
    translations.taskName || 'Название',
    translations.icon || 'Иконка',
    translations.priority || 'Приоритет',
    translations.status || 'Статус',
    translations.dueDate || 'Срок',
    translations.completed || 'Выполнено',
    translations.subtasks || 'Подзадачи',
    translations.createdAt || 'Создано'
  ];
  
  const priorityMap: Record<string, string> = {
    low: translations.priorityLow || 'Низкий',
    medium: translations.priorityMedium || 'Средний',
    high: translations.priorityHigh || 'Высокий'
  };
  
  const statusMap: Record<string, string> = {
    not_started: translations.statusNotStarted || 'Не начато',
    in_progress: translations.statusInProgress || 'В процессе',
    done: translations.statusDone || 'Готово'
  };
  
  const rows = tasks.map(task => [
    task.name,
    task.icon,
    priorityMap[task.priority] || task.priority,
    statusMap[task.status] || task.status,
    format(new Date(task.dueDate), 'dd.MM.yyyy'),
    task.completed ? '✓' : '',
    `${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}`,
    format(new Date(task.createdAt), 'dd.MM.yyyy')
  ]);
  
  exportToCSV([headers, ...rows], `tasks_${format(new Date(), 'yyyy-MM-dd')}`);
}

// Finance Export
export function exportFinanceToCSV(transactions: FinanceTransaction[], translations: Record<string, string>) {
  const headers = [
    translations.date || 'Дата',
    translations.type || 'Тип',
    translations.category || 'Категория',
    translations.amount || 'Сумма',
    translations.description || 'Описание',
    translations.completed || 'Подтверждено'
  ];
  
  const rows = transactions.map(t => {
    const category = getCategoryById(t.category);
    return [
      format(new Date(t.date), 'dd.MM.yyyy'),
      t.type === 'income' ? (translations.income || 'Доход') : (translations.expense || 'Расход'),
      category?.name || t.category,
      t.amount.toString(),
      t.description || '',
      t.completed ? '✓' : ''
    ];
  });
  
  exportToCSV([headers, ...rows], `finance_${format(new Date(), 'yyyy-MM-dd')}`);
}

// PDF Export utilities
export function generatePDFContent(title: string, data: string[][], summary?: Record<string, string | number>) {
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #168080; border-bottom: 2px solid #168080; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #168080; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .summary { background: #f0f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary-item { display: inline-block; margin-right: 30px; }
        .summary-label { color: #666; font-size: 12px; }
        .summary-value { font-size: 24px; font-weight: bold; color: #168080; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
  `;
  
  if (summary) {
    html += '<div class="summary">';
    Object.entries(summary).forEach(([label, value]) => {
      html += `
        <div class="summary-item">
          <div class="summary-label">${label}</div>
          <div class="summary-value">${value}</div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  if (data.length > 0) {
    html += '<table><thead><tr>';
    data[0].forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    data.slice(1).forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
  }
  
  html += `
      <div class="footer">
        HabitFlow • Экспортировано ${format(new Date(), 'dd.MM.yyyy HH:mm')}
      </div>
    </body>
    </html>
  `;
  
  return html;
}

export function exportToPDF(title: string, data: string[][], summary?: Record<string, string | number>) {
  const html = generatePDFContent(title, data, summary);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

export function exportHabitsToPDF(habits: Habit[], translations: Record<string, string>) {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  
  const headers = [
    translations.habitName || 'Название',
    translations.streak || 'Серия',
    translations.targetDays || 'Дни',
    translations.totalCompleted || 'Выполнено'
  ];
  
  const rows = habits.map(habit => [
    `${habit.icon} ${habit.name}`,
    `${habit.streak} дн.`,
    habit.targetDays.map(d => days[d]).join(', '),
    habit.completedDates.length.toString()
  ]);
  
  const totalCompleted = habits.reduce((sum, h) => sum + h.completedDates.length, 0);
  const avgStreak = habits.length > 0 
    ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length) 
    : 0;
  
  exportToPDF(
    translations.myHabits || 'Мои привычки',
    [headers, ...rows],
    {
      [translations.totalHabits || 'Всего привычек']: habits.length,
      [translations.totalCompleted || 'Выполнений']: totalCompleted,
      [translations.averageStreak || 'Средняя серия']: `${avgStreak} дн.`
    }
  );
}

export function exportTasksToPDF(tasks: Task[], translations: Record<string, string>) {
  const headers = [
    translations.taskName || 'Название',
    translations.priority || 'Приоритет',
    translations.status || 'Статус',
    translations.dueDate || 'Срок'
  ];
  
  const priorityMap: Record<string, string> = {
    low: translations.priorityLow || 'Низкий',
    medium: translations.priorityMedium || 'Средний',
    high: translations.priorityHigh || 'Высокий'
  };
  
  const statusMap: Record<string, string> = {
    not_started: translations.statusNotStarted || 'Не начато',
    in_progress: translations.statusInProgress || 'В процессе',
    done: translations.statusDone || 'Готово'
  };
  
  const rows = tasks.map(task => [
    `${task.icon} ${task.name}`,
    priorityMap[task.priority] || task.priority,
    statusMap[task.status] || task.status,
    format(new Date(task.dueDate), 'dd.MM.yyyy')
  ]);
  
  const completed = tasks.filter(t => t.completed).length;
  const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
  
  exportToPDF(
    translations.myTasks || 'Мои задачи',
    [headers, ...rows],
    {
      [translations.totalTasks || 'Всего задач']: tasks.length,
      [translations.completed || 'Выполнено']: completed,
      [translations.priorityHigh || 'Высокий приоритет']: highPriority
    }
  );
}

export function exportFinanceToPDF(transactions: FinanceTransaction[], translations: Record<string, string>) {
  const headers = [
    translations.date || 'Дата',
    translations.category || 'Категория',
    translations.type || 'Тип',
    translations.amount || 'Сумма'
  ];
  
  const rows = transactions.map(t => {
    const category = getCategoryById(t.category);
    return [
      format(new Date(t.date), 'dd.MM.yyyy'),
      `${category?.icon || ''} ${category?.name || t.category}`,
      t.type === 'income' ? (translations.income || 'Доход') : (translations.expense || 'Расход'),
      `${t.type === 'expense' ? '-' : '+'}${t.amount.toLocaleString()} ₽`
    ];
  });
  
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  
  exportToPDF(
    translations.myFinance || 'Мои финансы',
    [headers, ...rows],
    {
      [translations.income || 'Доходы']: `${income.toLocaleString()} ₽`,
      [translations.expense || 'Расходы']: `${expense.toLocaleString()} ₽`,
      [translations.balance || 'Баланс']: `${(income - expense).toLocaleString()} ₽`
    }
  );
}
