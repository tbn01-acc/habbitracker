import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowDownCircle, CreditCard, Gift, AlertCircle, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface WithdrawalHistoryItem {
  id: string;
  amount_rub: number;
  status: string;
  withdrawal_type: string;
  created_at: string;
  processed_at: string | null;
}

export function WithdrawalForm() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { wallet, refetch } = useReferralProgram();
  const isRussian = language === 'ru';

  const [amount, setAmount] = useState('');
  const [withdrawalType, setWithdrawalType] = useState<'cash' | 'subscription' | 'gift'>('cash');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<WithdrawalHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const minWithdrawal = 500;
  const balance = wallet?.balance_rub || 0;

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching withdrawal history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !wallet) return;

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < minWithdrawal) {
      toast.error(isRussian ? `Минимальная сумма: ${minWithdrawal} ₽` : `Minimum amount: ${minWithdrawal} ₽`);
      return;
    }

    if (withdrawAmount > balance) {
      toast.error(isRussian ? 'Недостаточно средств' : 'Insufficient funds');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user.id,
          amount_rub: withdrawAmount,
          withdrawal_type: withdrawalType,
          status: 'pending',
        });

      if (error) throw error;

      toast.success(isRussian ? 'Запрос отправлен!' : 'Request submitted!');
      setAmount('');
      refetch();
      fetchHistory();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error(isRussian ? 'Ошибка отправки' : 'Submission error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
            <Check className="w-3 h-3 mr-1" />
            {isRussian ? 'Выплачено' : 'Paid'}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />
            {isRussian ? 'Отклонено' : 'Rejected'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <Clock className="w-3 h-3 mr-1" />
            {isRussian ? 'Ожидает' : 'Pending'}
          </Badge>
        );
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cash':
        return isRussian ? 'На карту' : 'To card';
      case 'subscription':
        return isRussian ? 'На подписку' : 'To subscription';
      case 'gift':
        return isRussian ? 'Сертификат' : 'Gift certificate';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                {isRussian ? 'Доступно к выводу' : 'Available balance'}
              </div>
              <div className="text-3xl font-bold text-foreground">
                {balance.toLocaleString()} ₽
              </div>
            </div>
            <Wallet className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="withdraw" onValueChange={(v) => v === 'history' && fetchHistory()}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="withdraw">
            <ArrowDownCircle className="w-4 h-4 mr-2" />
            {isRussian ? 'Вывести' : 'Withdraw'}
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="w-4 h-4 mr-2" />
            {isRussian ? 'История' : 'History'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="space-y-4 mt-4">
          {balance < minWithdrawal ? (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3 text-amber-500">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">
                    {isRussian 
                      ? `Минимальная сумма для вывода: ${minWithdrawal} ₽`
                      : `Minimum withdrawal amount: ${minWithdrawal} ₽`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Withdrawal Type */}
              <div className="space-y-3">
                <Label>{isRussian ? 'Способ получения' : 'Withdrawal type'}</Label>
                <RadioGroup 
                  value={withdrawalType} 
                  onValueChange={(v) => setWithdrawalType(v as any)}
                  className="grid grid-cols-1 gap-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium">{isRussian ? 'На карту' : 'Bank card'}</p>
                        <p className="text-xs text-muted-foreground">
                          {isRussian ? 'Перевод в течение 3 рабочих дней' : 'Transfer within 3 business days'}
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="subscription" id="subscription" />
                    <Label htmlFor="subscription" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Wallet className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="font-medium">{isRussian ? 'Оплата подписки' : 'Pay for subscription'}</p>
                        <p className="text-xs text-muted-foreground">
                          {isRussian ? 'Мгновенное начисление' : 'Instant activation'}
                        </p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="gift" id="gift" />
                    <Label htmlFor="gift" className="flex items-center gap-2 cursor-pointer flex-1">
                      <Gift className="w-4 h-4 text-pink-500" />
                      <div>
                        <p className="font-medium">{isRussian ? 'Подарочный сертификат' : 'Gift certificate'}</p>
                        <p className="text-xs text-muted-foreground">
                          {isRussian ? 'Код для друга или близких' : 'Code for friend or family'}
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label>{isRussian ? 'Сумма' : 'Amount'}</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`${minWithdrawal}`}
                    min={minWithdrawal}
                    max={balance}
                  />
                  <Button
                    variant="outline"
                    onClick={() => setAmount(balance.toString())}
                  >
                    {isRussian ? 'Всё' : 'All'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRussian ? `Минимум: ${minWithdrawal} ₽` : `Minimum: ${minWithdrawal} ₽`}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={loading || !amount || parseFloat(amount) < minWithdrawal}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                {loading 
                  ? (isRussian ? 'Отправка...' : 'Submitting...') 
                  : (isRussian ? 'Отправить запрос' : 'Submit request')}
              </Button>
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-4">
              {historyLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Загрузка...' : 'Loading...'}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {isRussian ? 'Нет запросов на вывод' : 'No withdrawal requests'}
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {history.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div>
                          <div className="font-medium">{item.amount_rub.toLocaleString()} ₽</div>
                          <div className="text-xs text-muted-foreground">
                            {getTypeLabel(item.withdrawal_type)} • {format(new Date(item.created_at), 'dd.MM.yyyy')}
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
