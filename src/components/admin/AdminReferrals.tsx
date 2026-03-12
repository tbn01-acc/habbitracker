import { useState, useEffect } from 'react';
import { Users, DollarSign, Clock, Check, X, Search, TrendingUp, Wallet, Calendar, Award, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { exportReferralsToCSV, exportWithdrawalsToCSV } from '@/utils/exportReferralData';

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

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_rub: number;
  status: string;
  withdrawal_type: string;
  created_at: string;
  processed_at: string | null;
  user_name?: string;
}

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  paidReferrals: number;
  totalEarnings: number;
  pendingWithdrawals: number;
}

export function AdminReferrals() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';

  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    activeReferrals: 0,
    paidReferrals: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [withdrawalAction, setWithdrawalAction] = useState<'approve' | 'reject'>('approve');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch referrals with user names
      const { data: referralsData, error: referralsError } = await supabase
        .from('referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Fetch profiles for names
      const { data: profiles } = await supabase.from('public_profiles').select('user_id, display_name');
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      const enrichedReferrals = (referralsData || []).map(r => ({
        ...r,
        referrer_name: profileMap.get(r.referrer_id) || 'Unknown',
        referred_name: profileMap.get(r.referred_id) || 'Unknown',
      }));

      setReferrals(enrichedReferrals);

      // Fetch withdrawals
      const { data: withdrawalsData, error: withdrawalsError } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      const enrichedWithdrawals = (withdrawalsData || []).map(w => ({
        ...w,
        user_name: profileMap.get(w.user_id) || 'Unknown',
      }));

      setWithdrawals(enrichedWithdrawals);

      // Calculate stats
      const totalEarnings = await supabase
        .from('referral_earnings')
        .select('amount_rub');

      const pendingWithdrawals = (withdrawalsData || [])
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount_rub, 0);

      setStats({
        totalReferrals: referralsData?.length || 0,
        activeReferrals: referralsData?.filter(r => r.is_active).length || 0,
        paidReferrals: referralsData?.filter(r => r.referred_has_paid).length || 0,
        totalEarnings: totalEarnings.data?.reduce((sum, e) => sum + (e.amount_rub || 0), 0) || 0,
        pendingWithdrawals,
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(isRussian ? 'Ошибка загрузки данных' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async () => {
    if (!selectedWithdrawal) return;

    try {
      // Use server-side function for atomic withdrawal processing
      const { error } = await supabase.rpc('process_withdrawal', {
        p_withdrawal_id: selectedWithdrawal.id,
        p_action: withdrawalAction === 'approve' ? 'approve' : 'reject',
      });

      if (error) throw error;

      // Update local state
      setWithdrawals(withdrawals.map(w =>
        w.id === selectedWithdrawal.id
          ? { ...w, status: withdrawalAction === 'approve' ? 'completed' : 'rejected', processed_at: new Date().toISOString() }
          : w
      ));

      toast.success(
        withdrawalAction === 'approve'
          ? (isRussian ? 'Выплата одобрена' : 'Withdrawal approved')
          : (isRussian ? 'Выплата отклонена' : 'Withdrawal rejected')
      );

      fetchData(); // Refresh stats
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error(isRussian ? 'Ошибка обработки' : 'Processing error');
    }

    setConfirmDialogOpen(false);
    setSelectedWithdrawal(null);
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = 
      r.referrer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.referred_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && r.is_active;
    if (statusFilter === 'pending') return matchesSearch && !r.is_active;
    if (statusFilter === 'paid') return matchesSearch && r.referred_has_paid;
    return matchesSearch;
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = w.user_name?.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && w.status === statusFilter;
  });

  const getStatusBadge = (referral: ReferralData) => {
    if (referral.referred_has_paid) {
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">💰 {isRussian ? 'Оплатил' : 'Paid'}</Badge>;
    }
    if (referral.is_active) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">✅ {isRussian ? 'Активен' : 'Active'}</Badge>;
    }
    return <Badge className="bg-muted text-muted-foreground">{isRussian ? 'Ожидает' : 'Pending'}</Badge>;
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/30">{isRussian ? 'Выплачено' : 'Paid'}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">{isRussian ? 'Отклонено' : 'Rejected'}</Badge>;
      default:
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">{isRussian ? 'Ожидает' : 'Pending'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">{isRussian ? 'Всего рефералов' : 'Total Referrals'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Check className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.activeReferrals}</div>
            <div className="text-xs text-muted-foreground">{isRussian ? 'Активных' : 'Active'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <DollarSign className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalEarnings.toLocaleString()} ₽</div>
            <div className="text-xs text-muted-foreground">{isRussian ? 'Начислено' : 'Earned'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <Wallet className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.pendingWithdrawals.toLocaleString()} ₽</div>
            <div className="text-xs text-muted-foreground">{isRussian ? 'К выплате' : 'Pending'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="referrals">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="referrals" className="gap-2">
            <Users className="w-4 h-4" />
            {isRussian ? 'Рефералы' : 'Referrals'}
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="gap-2">
            <Wallet className="w-4 h-4" />
            {isRussian ? 'Выплаты' : 'Withdrawals'}
          </TabsTrigger>
        </TabsList>

        {/* Referrals Tab */}
        <TabsContent value="referrals" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={isRussian ? 'Поиск...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRussian ? 'Все' : 'All'}</SelectItem>
                    <SelectItem value="active">{isRussian ? 'Активные' : 'Active'}</SelectItem>
                    <SelectItem value="pending">{isRussian ? 'Ожидают' : 'Pending'}</SelectItem>
                    <SelectItem value="paid">{isRussian ? 'Оплатившие' : 'Paid'}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => exportReferralsToCSV(filteredReferrals, isRussian)}
                  title={isRussian ? 'Экспорт в CSV' : 'Export to CSV'}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredReferrals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {isRussian ? 'Рефералы не найдены' : 'No referrals found'}
                    </div>
                  ) : (
                    filteredReferrals.map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {referral.referred_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isRussian ? 'от' : 'by'} {referral.referrer_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{referral.active_days || 0} {isRussian ? 'дней' : 'days'}</div>
                            <div>{Math.round((referral.total_time_minutes || 0) / 60)} {isRussian ? 'ч' : 'h'}</div>
                          </div>
                          {getStatusBadge(referral)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Withdrawals Tab */}
        <TabsContent value="withdrawals" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={isRussian ? 'Поиск...' : 'Search...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRussian ? 'Все' : 'All'}</SelectItem>
                    <SelectItem value="pending">{isRussian ? 'Ожидают' : 'Pending'}</SelectItem>
                    <SelectItem value="completed">{isRussian ? 'Выплачено' : 'Completed'}</SelectItem>
                    <SelectItem value="rejected">{isRussian ? 'Отклонено' : 'Rejected'}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => exportWithdrawalsToCSV(filteredWithdrawals, isRussian)}
                  title={isRussian ? 'Экспорт в CSV' : 'Export to CSV'}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredWithdrawals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {isRussian ? 'Запросы не найдены' : 'No requests found'}
                    </div>
                  ) : (
                    filteredWithdrawals.map((withdrawal) => (
                      <div
                        key={withdrawal.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {withdrawal.user_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(withdrawal.created_at), 'dd.MM.yyyy HH:mm')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-amber-500">
                              {withdrawal.amount_rub.toLocaleString()} ₽
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {withdrawal.withdrawal_type}
                            </div>
                          </div>
                          {getWithdrawalStatusBadge(withdrawal.status)}
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setWithdrawalAction('approve');
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setWithdrawalAction('reject');
                                  setConfirmDialogOpen(true);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {withdrawalAction === 'approve'
                ? (isRussian ? 'Одобрить выплату?' : 'Approve withdrawal?')
                : (isRussian ? 'Отклонить выплату?' : 'Reject withdrawal?')
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedWithdrawal && (
                <>
                  {isRussian ? 'Сумма:' : 'Amount:'} <strong>{selectedWithdrawal.amount_rub.toLocaleString()} ₽</strong>
                  <br />
                  {isRussian ? 'Пользователь:' : 'User:'} <strong>{selectedWithdrawal.user_name}</strong>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRussian ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleWithdrawalAction}
              className={withdrawalAction === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {withdrawalAction === 'approve'
                ? (isRussian ? 'Одобрить' : 'Approve')
                : (isRussian ? 'Отклонить' : 'Reject')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}