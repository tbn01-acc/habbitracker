import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, AtSign, Shield, CreditCard, Users, Bell, Send, Monitor, Loader2, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { isAdmin, adminLoading } = useLegalDocuments();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [refsL1, setRefsL1] = useState<any[]>([]);
  const [refsL2, setRefsL2] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [notifSettings, setNotifSettings] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [activityCount, setActivityCount] = useState(0);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  // Plan editor
  const [newPlan, setNewPlan] = useState<'free' | 'pro'>('free');
  const [planDuration, setPlanDuration] = useState<'week' | 'month' | 'quarter' | 'year' | 'lifetime'>('month');

  // Message
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) navigate('/');
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [p, s, pay, r1, earn, ns, dv, act] = await Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('referrals').select('*').eq('referrer_id', userId),
          supabase.from('referral_earnings').select('*').eq('referrer_id', userId),
          supabase.from('notification_settings').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('device_fingerprints').select('*').eq('user_id', userId),
          supabase.from('user_daily_activity' as any).select('activity_date', { count: 'exact', head: true }).eq('user_id', userId),
        ]);
        if (cancelled) return;
        setProfile(p.data);
        setSubscription(s.data);
        setPayments(pay.data || []);
        setRefsL1(r1.data || []);
        setEarnings(earn.data || []);
        setNotifSettings(ns.data);
        setDevices(dv.data || []);
        setActivityCount(act.count || 0);
        if (s.data?.plan) setNewPlan(s.data.plan);

        // 2nd-level referrals
        const l1Ids = (r1.data || []).map((r: any) => r.referred_id).filter(Boolean);
        if (l1Ids.length > 0) {
          const { data: r2 } = await supabase.from('referrals').select('*').in('referrer_id', l1Ids);
          if (!cancelled) setRefsL2(r2 || []);
        }
      } catch (e: any) {
        toast.error(e.message || 'Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, isAdmin]);

  const ltv = useMemo(() => payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0), [payments]);
  const refsL1Paid = useMemo(() => refsL1.filter((r: any) => r.referred_has_paid).length, [refsL1]);
  const refsL1Active = useMemo(() => refsL1.filter((r: any) => r.is_active).length, [refsL1]);
  const refsL2Active = useMemo(() => refsL2.filter((r: any) => r.is_active).length, [refsL2]);
  const earningsL1 = useMemo(() => earnings.filter(e => refsL1.some((r: any) => r.referred_id === e.referred_id)).reduce((s, e) => s + Number(e.amount_rub || 0), 0), [earnings, refsL1]);
  const earningsL2 = useMemo(() => earnings.filter(e => refsL2.some((r: any) => r.referred_id === e.referred_id)).reduce((s, e) => s + Number(e.amount_rub || 0), 0), [earnings, refsL2]);
  const earningsTotal = earningsL1 + earningsL2;

  const memberSinceDays = useMemo(() => profile?.created_at ? Math.max(1, differenceInDays(new Date(), new Date(profile.created_at))) : 1, [profile]);
  const visitsPerDay = (activityCount / memberSinceDays).toFixed(2);
  const visitsPerWeek = ((activityCount / memberSinceDays) * 7).toFixed(2);
  const visitsPerMonth = ((activityCount / memberSinceDays) * 30).toFixed(2);

  const monthsActive = Math.max(1, memberSinceDays / 30);
  const totalRevenueAttributed = ltv + earningsL1; // payments from user + L1 referral payments contribute via earnings to user
  const avgMonthly = (totalRevenueAttributed / monthsActive).toFixed(2);
  const avgYearly = (totalRevenueAttributed / Math.max(1, memberSinceDays / 365)).toFixed(2);

  const handleUpdatePlan = async () => {
    if (!userId) return;
    try {
      let expires_at: string | null = null;
      if (newPlan === 'pro' && planDuration !== 'lifetime') {
        const now = new Date();
        const map: Record<string, number> = { week: 7, month: 30, quarter: 90, year: 365 };
        now.setDate(now.getDate() + map[planDuration]);
        expires_at = now.toISOString();
      }
      const { error } = await supabase.rpc('admin_set_subscription' as any, {
        p_user_id: userId,
        p_plan: newPlan,
        p_expires_at: expires_at,
      });
      if (error) throw error;
      toast.success('Тариф обновлён');
      const { data } = await supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle();
      setSubscription(data);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSendMessage = async () => {
    if (!userId || !msgTitle.trim() || !msgBody.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('user_notifications').insert({
        user_id: userId,
        type: 'admin_message',
        title: msgTitle.trim(),
        message: msgBody.trim(),
        actor_id: currentUser?.id,
      });
      if (error) throw error;
      toast.success('Сообщение отправлено');
      setMsgTitle(''); setMsgBody('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  if (adminLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Пользователь не найден</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}><ArrowLeft className="w-5 h-5" /></Button>
          <Shield className="w-5 h-5 text-red-500" />
          <h1 className="text-xl font-bold">Карточка пользователя</h1>
        </div>

        {/* Identity & contacts */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Контактные данные</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><b>Имя:</b> {profile.display_name || '—'}</div>
            <div><b>Полное имя:</b> {profile.full_name || '—'}</div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" /> {profile.email || profile.public_email || '—'}</div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> {profile.phone || '—'}</div>
            <div className="flex items-center gap-2"><AtSign className="w-4 h-4 text-muted-foreground" /> {profile.telegram_username ? `@${profile.telegram_username}` : '—'} {profile.telegram_id ? `(ID ${profile.telegram_id})` : ''}</div>
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> {profile.dob || '—'}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" /> {profile.location || '—'}</div>
            <div><b>User ID:</b> <code className="text-xs">{userId}</code></div>
          </CardContent>
        </Card>

        {/* Registration & activity */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" />Регистрация и активность</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><b>Дата регистрации:</b> {profile.created_at ? format(new Date(profile.created_at), 'dd.MM.yyyy HH:mm') : '—'}</div>
            <div><b>В системе:</b> {memberSinceDays} дн.</div>
            <div><b>Активных дней:</b> {activityCount}</div>
            <div><b>Средняя частота посещений:</b> {visitsPerDay}/день, {visitsPerWeek}/нед, {visitsPerMonth}/мес</div>
            <div className="text-xs text-muted-foreground">Длительность сессий доступна через analytics-логи.</div>
          </CardContent>
        </Card>

        {/* Subscription & payments */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><CreditCard className="w-4 h-4" />Подписка и платежи</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{subscription?.plan || 'free'}</Badge>
              {subscription?.expires_at && <span className="text-xs text-muted-foreground">до {format(new Date(subscription.expires_at), 'dd.MM.yyyy')}</span>}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Тариф</Label>
                <Select value={newPlan} onValueChange={(v: any) => setNewPlan(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">PRO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Период</Label>
                <Select value={planDuration} onValueChange={(v: any) => setPlanDuration(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Неделя</SelectItem>
                    <SelectItem value="month">Месяц</SelectItem>
                    <SelectItem value="quarter">3 месяца</SelectItem>
                    <SelectItem value="year">Год</SelectItem>
                    <SelectItem value="lifetime">Бессрочно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdatePlan} size="sm">Применить</Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <Stat label="LTV (₽)" value={ltv.toFixed(2)} />
              <Stat label="Платежей" value={String(payments.filter(p => p.status === 'paid').length)} />
              <Stat label="Средн./мес (₽)" value={avgMonthly} />
              <Stat label="Средн./год (₽)" value={avgYearly} />
            </div>
            {payments.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold mb-1">Последние платежи:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {payments.slice(0, 10).map(p => (
                    <div key={p.id} className="text-xs flex justify-between border-b border-border/30 py-1">
                      <span>{format(new Date(p.created_at), 'dd.MM.yy')} · {p.subscription_period || '—'}</span>
                      <span>{p.amount} {p.currency} · <Badge variant="outline" className="text-[10px]">{p.status}</Badge></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral activity */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Реферальная активность</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <Stat label="Рефералы L1" value={String(refsL1.length)} />
            <Stat label="Активные L1" value={String(refsL1Active)} />
            <Stat label="Платящие L1" value={String(refsL1Paid)} />
            <Stat label="Вознагр. L1 (₽)" value={earningsL1.toFixed(2)} />
            <Stat label="Рефералы L2" value={String(refsL2.length)} />
            <Stat label="Активные L2" value={String(refsL2Active)} />
            <Stat label="Вознагр. L2 (₽)" value={earningsL2.toFixed(2)} />
            <Stat label="Всего вознагр. (₽)" value={earningsTotal.toFixed(2)} />
          </CardContent>
        </Card>

        {/* Notification preferences (read-only from user) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" />Уведомления и рассылки</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">Настройки пользователя (только просмотр):</p>
            <Toggle label="Уведомления о привычках" checked={!!notifSettings?.habit_notification_enabled} />
            <Toggle label="Уведомления о задачах" checked={!!notifSettings?.task_notification_enabled} />
            <Toggle label="Просроченные" checked={!!notifSettings?.overdue_notification_enabled} />
            <Toggle label="Погода" checked={!!notifSettings?.weather_notification_enabled} />
            <Toggle label="Лайки" checked={!!notifSettings?.likes_notifications_enabled} />
            <Toggle label="Комментарии" checked={!!notifSettings?.comments_notifications_enabled} />
            <Toggle label="Подписки" checked={!!notifSettings?.subscriptions_notifications_enabled} />
          </CardContent>
        </Card>

        {/* Direct message */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Send className="w-4 h-4" />Отправить сообщение</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Заголовок" value={msgTitle} onChange={e => setMsgTitle(e.target.value)} />
            <Textarea placeholder="Текст сообщения" value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4} />
            <Button onClick={handleSendMessage} disabled={sending || !msgTitle.trim() || !msgBody.trim()} size="sm">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Отправить в Уведомления'}
            </Button>
          </CardContent>
        </Card>

        {/* Devices */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Monitor className="w-4 h-4" />Устройства</CardTitle></CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет данных</p>
            ) : (
              <div className="space-y-2">
                {devices.map((d: any) => (
                  <div key={d.id} className="text-xs border border-border/40 rounded p-2 space-y-0.5">
                    <div><b>Платформа:</b> {d.platform || '—'}</div>
                    <div><b>Разрешение:</b> {d.screen_resolution || '—'}</div>
                    <div><b>Язык/TZ:</b> {d.language || '—'} / {d.timezone || '—'}</div>
                    <div className="truncate"><b>UA:</b> {d.user_agent || '—'}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other useful info */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Прочее</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div><b>Реф. код:</b> {profile.referral_code || '—'}</div>
            <div><b>Приглашён:</b> {profile.referred_by || '—'}</div>
            <div><b>Бан:</b> {profile.is_banned ? 'да' : 'нет'} {profile.ban_until ? `(до ${format(new Date(profile.ban_until), 'dd.MM.yyyy')})` : ''}</div>
            <div><b>Read-only до:</b> {profile.read_only_until ? format(new Date(profile.read_only_until), 'dd.MM.yyyy') : '—'}</div>
            <div><b>Согласия:</b> {profile.legal_consents_accepted ? 'приняты' : 'нет'} (отзывов: {profile.consent_revokes_count || 0})</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function Toggle({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox checked={checked} disabled />
      <span>{label}</span>
    </div>
  );
}