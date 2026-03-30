import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, MapPin, Globe, Briefcase, Users, Zap, Target, Trophy, Copy, Check, ExternalLink, Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTeam } from '@/hooks/useTeam';
import { DEMO_DATA } from '@/lib/demo/testData';
import { toast } from 'sonner';
import { APP_URL } from '@/lib/constants';

export default function TeamPublicProfilePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const { team, members } = useTeam();
  const [copied, setCopied] = useState(false);

  // Use real team data or demo
  const isReal = team && team.id === teamId;
  const teamName = isReal ? team.name : DEMO_DATA.teamName;
  const profile = DEMO_DATA.teamProfile;
  const teamMembers = isReal ? members : DEMO_DATA.members;
  const profileUrl = `${APP_URL}/team/profile/${teamId || 'demo'}`;

  const TEAM_TYPE_LABELS: Record<string, string> = {
    office: isRu ? 'Офис' : 'Office',
    remote: isRu ? 'Удалённо' : 'Remote',
    hybrid: isRu ? 'Гибрид' : 'Hybrid',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success(isRu ? 'Ссылка скопирована!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error(isRu ? 'Ошибка' : 'Error'); }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/team')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">
                {isRu ? 'Публичный профиль команды' : 'Team Public Profile'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Так видят вашу команду другие' : 'How others see your team'}
              </p>
            </div>
          </div>
        </div>

        {/* Link Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">{isRu ? 'Ссылка на профиль' : 'Profile link'}</p>
                  <p className="text-xs text-muted-foreground truncate">{profileUrl}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? (isRu ? 'Скопировано' : 'Copied') : (isRu ? 'Копировать' : 'Copy')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden">
            <CardContent className="p-6 space-y-5">
              {/* Team Identity */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{teamName}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {TEAM_TYPE_LABELS[profile.team_type] || profile.team_type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Users className="w-3 h-3" /> {teamMembers.length}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>

              {/* Info Badges */}
              <div className="flex flex-wrap gap-2">
                {profile.location && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" /> {profile.location}
                  </Badge>
                )}
                {profile.website && (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" /> {profile.website}
                  </Badge>
                )}
              </div>

              {/* Vacancies */}
              {profile.vacancies && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-500">
                      {isRu ? 'Открытые вакансии' : 'Open Positions'}
                    </span>
                  </div>
                  <p className="text-sm">{profile.vacancies}</p>
                </div>
              )}

              {/* Members Preview */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">{isRu ? 'Команда' : 'Team'}</h3>
                <div className="flex -space-x-2">
                  {teamMembers.slice(0, 8).map((m: any) => (
                    <Avatar key={m.id} className="w-8 h-8 border-2 border-background cursor-pointer"
                      onClick={() => navigate(`/team/member/${m.id}`)}
                    >
                      <AvatarFallback className="text-[10px] bg-muted">
                        {m.name.split(' ').map((w: string) => w[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {teamMembers.length > 8 && (
                    <Avatar className="w-8 h-8 border-2 border-background">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">+{teamMembers.length - 8}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        {profile.stats && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: isRu ? 'Спринтов завершено' : 'Sprints Completed', value: profile.stats.totalSprints, icon: '🏁' },
                { label: isRu ? 'Средняя скорость' : 'Avg Velocity', value: `${profile.stats.avgVelocity} SP`, icon: '⚡' },
                { label: isRu ? 'Общий XP' : 'Total XP', value: profile.stats.totalXP.toLocaleString(), icon: '✨' },
                { label: isRu ? 'Успешность' : 'Success Rate', value: `${profile.stats.successRate}%`, icon: '🎯' },
              ].map((stat, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-3 text-center">
                    <span className="text-lg">{stat.icon}</span>
                    <p className="text-lg font-bold mt-1">{stat.value}</p>
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Edit Button */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Button variant="outline" className="w-full" onClick={() => navigate('/team')}>
            {isRu ? 'Редактировать профиль' : 'Edit Profile'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
