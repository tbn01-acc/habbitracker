import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { generateActPDF } from '@/utils/pdfGenerator';
import { toast } from 'sonner';

export interface TeamSubscription {
  id: string;
  user_id: string;
  team_name: string;
  admin_name: string | null;
  inn: string;
  kpp: string | null;
  org_name: string | null;
  org_address: string | null;
  plan_type: string;
  seats_count: number;
  billing_period: string;
  price_per_seat: number;
  total_amount: number;
  start_date: string;
  end_date: string | null;
  status: string;
  invoice_number: string | null;
  created_at: string;
}

const PERIOD_LABELS: Record<string, string> = { month: 'Месяц', quarter: 'Квартал', year: 'Год' };

export function useTeamSubscriptions() {
  const { user } = useAuth();

  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ['team-subscriptions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('team_subscriptions' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as TeamSubscription[];
    },
    enabled: !!user,
  });

  const generateAct = async (sub: TeamSubscription) => {
    try {
      const actNumber = `TF-TEAM-A-${sub.invoice_number?.split('-').pop() || Date.now().toString().slice(-6)}`;
      const periodLabel = PERIOD_LABELS[sub.billing_period] || sub.billing_period;

      await generateActPDF({
        number: actNumber,
        date: new Date().toISOString(),
        periodStart: sub.start_date,
        periodEnd: sub.end_date || new Date().toISOString(),
        clientName: sub.org_name || sub.team_name,
        clientInn: sub.inn,
        clientRepresentative: sub.admin_name || undefined,
        serviceName: `Предоставление доступа к сервису «ТопФокус» по тарифу «Команда» (${sub.seats_count} мест, период: ${periodLabel})`,
        totalAmount: sub.total_amount,
      });

      toast.success('Акт выполненных работ сформирован!');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка генерации акта');
    }
  };

  return { subscriptions: subscriptions || [], isLoading, refetch, generateAct };
}
