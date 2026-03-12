import { useState, useEffect, useCallback } from 'react';
import { APP_URL } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Users, Trophy, Wallet, Filter, Info, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ProgressRing } from '@/components/ProgressRing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAffiliateV2 } from '@/hooks/useAffiliateV2';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type FilterType = 'all' | 'individual' | 'team';

interface ReferralRow {
  id: string;
  referredId: string;
  displayName: string;
  isActive: boolean;
  isTeam: boolean;
  teamSize: number;
  units: number;
  plan: string;
  createdAt: string;
}

// Mock team detection — in production, subscription object would carry team_size
function detectTeam(plan: string | null): { isTeam: boolean; teamSize: number } {
  if (!plan) return { isTeam: false, teamSize: 1 };
  const match = plan.match(/team[_-]?(\d+)/i);
  if (match) return { isTeam: true, teamSize: parseInt(match[1], 10) };
  return { isTeam: false, teamSize: 1 };
}

export function NetworkDashboard() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { stats, isPro } = useAffiliateV2();
  const isRussian = language === 'ru';

  const [filter, setFilter] = useState<FilterType>('all');
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamCopied, setTeamCopied] = useState(false);

  const teamInviteLink = profile?.referral_code
    ? `${APP_URL}/team?ref=${profile.referral_code}`
    : '';

  const handleCopyTeamLink = async () => {
    if (!teamInviteLink) return;
    try {
      await navigator.clipboard.writeText(teamInviteLink);
      setTeamCopied(true);
      toast.success(isRussian ? '🔗 Ссылка на командный тариф скопирована!' : '🔗 Team plan link copied!');
      setTimeout(() => setTeamCopied(false), 2000);
    } catch {
      toast.error(isRussian ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  const fetchNetwork = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data: refs } = await supabase
        .from('referrals')
        .select('id, referred_id, is_active, referred_has_paid, created_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (!refs || refs.length === 0) { setReferrals([]); setLoading(false); return; }

      const referredIds = refs.map(r => r.referred_id);
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('user_id, display_name')
        .in('user_id', referredIds);

      // Check subscriptions for team detection
      const { data: subs } = await supabase
        .from('subscriptions')
        .select('user_id, plan')
        .in('user_id', referredIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p.display_name || 'User';
        return acc;
      }, {} as Record<string, string>);

      const subMap = (subs || []).reduce((acc, s) => {
        acc[s.user_id] = s.plan;
        return acc;
      }, {} as Record<string, string>);

      const rows: ReferralRow[] = refs.map(r => {
        const plan = subMap[r.referred_id] || 'free';
        const { isTeam, teamSize } = detectTeam(plan);
        return {
          id: r.id,
          referredId: r.referred_id,
          displayName: profileMap[r.referred_id] || 'User',
          isActive: r.is_active ?? false,
          isTeam,
          teamSize,
          units: isTeam ? teamSize : 1,
          plan,
          createdAt: r.created_at,
        };
      });

      setReferrals(rows);
    } catch (err) {
      console.error('Network fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchNetwork(); }, [fetchNetwork]);

  const filtered = referrals.filter(r => {
    if (filter === 'individual') return !r.isTeam;
    if (filter === 'team') return r.isTeam;
    return true;
  });

  const totalActiveUnits = referrals
    .filter(r => r.isActive)
    .reduce((sum, r) => sum + r.units, 0);

  // Milestone logic
  const milestoneThresholds = totalActiveUnits <= 50
    ? [10, 20, 30, 40, 50]
    : (() => { const t: number[] = []; for (let i = 75; i <= totalActiveUnits + 25; i += 25) t.push(i); return t; })();

  const nextMilestone = milestoneThresholds.find(t => t > totalActiveUnits) || milestoneThresholds[milestoneThresholds.length - 1];
  const remaining = Math.max(0, nextMilestone - totalActiveUnits);
  const milestoneBonus = nextMilestone <= 50 ? (isPro ? 500 : 250) : (isPro ? 1000 : 500);
  const prevMilestone = milestoneThresholds.filter(t => t <= totalActiveUnits).pop() || 0;
  const milestoneProgress = nextMilestone > prevMilestone
    ? ((totalActiveUnits - prevMilestone) / (nextMilestone - prevMilestone)) * 100
    : 100;

  const levelLabel = isPro
    ? (stats?.currentLevel === 2 ? 'Premium 30%' : 'Premium 25%')
    : (stats?.currentLevel === 2 ? 'Pro 20%' : 'Basic 15%');

  const ringProgress = Math.min((totalActiveUnits / (stats?.currentLevel === 2 ? 200 : 51)) * 100, 100);

  if (!user) return null;

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <Card className="border-0 bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/5 backdrop-blur-xl overflow-hidden relative">
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />
        <CardContent className="pt-5 relative">
          <div className="flex items-center gap-5">
            {/* Circular Progress */}
            <ProgressRing
              progress={ringProgress}
              size={88}
              strokeWidth={6}
              color="hsl(217, 91%, 60%)"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{totalActiveUnits}</div>
                <div className="text-[9px] text-muted-foreground leading-none">
                  {isRussian ? 'единиц' : 'units'}
                </div>
              </div>
            </ProgressRing>

            <div className="flex-1 space-y-2">
              {/* Partner Level */}
              <div className="flex items-center gap-2">
                <Badge className={`text-[10px] px-2 py-0.5 ${isPro
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0'
                  : 'bg-muted text-muted-foreground'}`}>
                  {levelLabel}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-xs">
                      {isRussian
                        ? '1 участник командной подписки = 1 Активная Единица для ваших вех.'
                        : '1 member of a Team subscription = 1 Active Unit for your milestones.'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Next Milestone */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {isRussian ? 'До бонуса' : 'Next milestone'}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-500">
                    {remaining > 0
                      ? `${remaining} → +${milestoneBonus}₽`
                      : `+${milestoneBonus}₽ ✓`}
                  </span>
                </div>
                <Progress value={Math.min(milestoneProgress, 100)} className="h-1.5" />
              </div>

              {/* Quick stats */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-green-500" />
                  <span className="text-foreground font-medium">{stats?.totalEarned.toLocaleString() || 0}₽</span>
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  <span className="text-foreground font-medium">
                    {isRussian ? `Ур.${stats?.currentLevel}` : `Lv.${stats?.currentLevel}`}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Team Button */}
      <Button
        onClick={handleCopyTeamLink}
        className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white"
        disabled={!teamInviteLink}
      >
        {teamCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
        {teamCopied
          ? (isRussian ? 'Скопировано!' : 'Copied!')
          : (isRussian ? 'Пригласить команду' : 'Invite Team')}
      </Button>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {([
          { key: 'all' as FilterType, label: isRussian ? 'Все' : 'All' },
          { key: 'individual' as FilterType, label: isRussian ? 'Личные' : 'Individuals' },
          { key: 'team' as FilterType, label: isRussian ? 'Команды' : 'Teams' },
        ]).map(f => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            className={`text-xs h-7 ${filter === f.key ? '' : 'border-border/50'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Team Growth Feed */}
      <Card className="border border-border/50 backdrop-blur-xl bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            {isRussian ? 'Рост сети' : 'Team Growth'}
            <Badge variant="outline" className="text-[10px] ml-auto">
              {filtered.length} {isRussian ? 'чел.' : 'people'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground animate-pulse">
              {isRussian ? 'Загрузка...' : 'Loading...'}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Пока нет рефералов' : 'No referrals yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {filtered.map((ref, idx) => (
                <motion.button
                  key={ref.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/rating?user=${ref.referredId}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors text-left group"
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    ref.isTeam
                      ? 'bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30'
                      : 'bg-blue-500/15 border border-blue-500/20'
                  }`}>
                    {ref.isTeam
                      ? <Users className="w-4 h-4 text-amber-500" />
                      : <User className="w-4 h-4 text-blue-500" />}
                  </div>

                  {/* Name + Plan */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {ref.displayName}
                      </span>
                      {ref.isTeam && (
                        <Badge className="bg-gradient-to-r from-amber-500/80 to-emerald-500/80 text-white text-[9px] px-1.5 py-0 h-4 border-0">
                          Team ×{ref.teamSize}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5 py-0 border-border/40">
                        {ref.plan === 'free' ? 'Free' : ref.plan}
                      </Badge>
                      <span className={`text-[9px] flex items-center gap-0.5 ${ref.isActive ? 'text-green-500' : 'text-muted-foreground'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ref.isActive ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
                        {ref.isActive ? (isRussian ? 'Активен' : 'Active') : (isRussian ? 'Неактивен' : 'Expired')}
                      </span>
                    </div>
                  </div>

                  {/* Units */}
                  <div className={`text-right shrink-0 ${ref.isTeam ? '' : ''}`}>
                    <div className={`text-sm font-bold ${
                      ref.isTeam ? 'text-amber-500' : 'text-blue-500'
                    }`}>
                      +{ref.units}
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      {ref.units === 1
                        ? (isRussian ? 'единица' : 'unit')
                        : (isRussian ? 'единиц' : 'units')}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Units Explanation */}
      <Card className="border border-blue-500/20 bg-blue-500/5 backdrop-blur-xl">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRussian
                ? 'Активные Единицы = сумма индивидуальных активных подписчиков + размер активных команд. Продажа командного тарифа на 10 человек мгновенно добавляет 10 единиц к вашим вехам.'
                : 'Active Units = sum of active individual subscribers + active team sizes. Selling a Team plan for 10 people instantly adds 10 units to your milestones.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
