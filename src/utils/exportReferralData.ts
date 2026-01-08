interface ReferralData {
  id: string;
  referrer_id: string;
  referred_id: string;
  is_active: boolean;
  referred_has_paid: boolean;
  created_at: string;
  active_days: number | null;
  total_time_minutes: number | null;
  referrer_name?: string;
  referred_name?: string;
}

interface WithdrawalData {
  id: string;
  user_id: string;
  amount_rub: number;
  status: string;
  withdrawal_type: string;
  created_at: string;
  processed_at: string | null;
  user_name?: string;
}

export function exportReferralsToCSV(referrals: ReferralData[], isRussian: boolean): void {
  const headers = isRussian 
    ? ['ID', 'Реферер', 'Реферал', 'Активен', 'Оплатил', 'Дней активности', 'Минут в приложении', 'Дата регистрации']
    : ['ID', 'Referrer', 'Referred', 'Active', 'Paid', 'Active Days', 'Time (minutes)', 'Registration Date'];

  const rows = referrals.map(r => [
    r.id,
    r.referrer_name || r.referrer_id,
    r.referred_name || r.referred_id,
    r.is_active ? (isRussian ? 'Да' : 'Yes') : (isRussian ? 'Нет' : 'No'),
    r.referred_has_paid ? (isRussian ? 'Да' : 'Yes') : (isRussian ? 'Нет' : 'No'),
    r.active_days || 0,
    r.total_time_minutes || 0,
    new Date(r.created_at).toLocaleDateString(),
  ]);

  downloadCSV(headers, rows, `referrals_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportWithdrawalsToCSV(withdrawals: WithdrawalData[], isRussian: boolean): void {
  const headers = isRussian 
    ? ['ID', 'Пользователь', 'Сумма (₽)', 'Тип', 'Статус', 'Дата запроса', 'Дата обработки']
    : ['ID', 'User', 'Amount (₽)', 'Type', 'Status', 'Request Date', 'Processed Date'];

  const statusLabels: Record<string, Record<string, string>> = {
    pending: { ru: 'Ожидает', en: 'Pending' },
    completed: { ru: 'Выплачено', en: 'Completed' },
    rejected: { ru: 'Отклонено', en: 'Rejected' },
  };

  const typeLabels: Record<string, Record<string, string>> = {
    cash: { ru: 'На карту', en: 'Bank card' },
    subscription: { ru: 'Подписка', en: 'Subscription' },
    gift: { ru: 'Сертификат', en: 'Gift certificate' },
  };

  const lang = isRussian ? 'ru' : 'en';

  const rows = withdrawals.map(w => [
    w.id,
    w.user_name || w.user_id,
    w.amount_rub,
    typeLabels[w.withdrawal_type]?.[lang] || w.withdrawal_type,
    statusLabels[w.status]?.[lang] || w.status,
    new Date(w.created_at).toLocaleDateString(),
    w.processed_at ? new Date(w.processed_at).toLocaleDateString() : '-',
  ]);

  downloadCSV(headers, rows, `withdrawals_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(headers: string[], rows: (string | number)[][], filename: string): void {
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
