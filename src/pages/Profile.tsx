import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Settings, Trophy, Users, Crown, Lock, 
  LogIn, Archive, BarChart3, Mail, Send, CheckCircle2 
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TileProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradient: string;
  onClick: () => void;
  locked?: boolean;
  delay?: number;
}

function ProfileTile({ icon, title, subtitle, gradient, onClick, locked, delay = 0 }: TileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="relative"
    >
      <Card 
        className={`h-full cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
          locked ? 'opacity-60' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className={`p-0 h-full rounded-xl bg-gradient-to-br ${gradient}`}>
          <div className="p-4 h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {icon}
            </div>
            <div className="mt-2">
              <h3 className="font-semibold text-white text-base leading-tight">{title}</h3>
              <p className="text-white/70 text-xs mt-0.5">{subtitle}</p>
            </div>
            {locked && (
              <div className="absolute top-2 right-2">
                <Lock className="w-4 h-4 text-white/50" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Profile() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, loading, refetchProfile } = useAuth();
  const { isProActive } = useSubscription();
  const { toast } = useToast();
  
  const [emailInput, setEmailInput] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  
  const isRussian = language === 'ru';

  const handleTileClick = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      navigate('/auth');
    } else {
      navigate(path);
    }
  };

  const handleLinkEmail = async () => {
    if (!emailInput.includes('@')) {
      toast({
        title: isRussian ? "Ошибка" : "Error",
        description: isRussian ? "Введите корректный email" : "Enter a valid email",
        variant: "destructive"
      });
      return;
    }

    setIsLinking(true);
    try {
      // 1. Обновляем email в таблице public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ public_email: emailInput })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // 2. Обновляем email в метаданных пользователя Auth
      const { error: authError } = await supabase.auth.updateUser({ email: emailInput });
      if (authError) throw authError;

      toast({
        title: isRussian ? "Успешно" : "Success",
        description: isRussian ? "Email успешно привязан" : "Email linked successfully",
      });
      
      await refetchProfile();
      setEmailInput('');
    } catch (error: any) {
      toast({
        title: isRussian ? "Ошибка" : "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  const showArchive = user && isProActive;

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-4">
        
        {/* Guest Banner */}
        {!user && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-4 border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground text-sm">
                        {isRussian ? 'Вы не авторизованы' : 'Not signed in'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {isRussian ? 'Войдите для доступа ко всем функциям' : 'Sign in for full access'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => navigate('/auth')} className="gap-1.5">
                    <LogIn className="w-3.5 h-3.5" />
                    {isRussian ? 'Войти' : 'Sign In'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Universal Access / Email Linking Block (Visible if logged in) */}
        {user && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-semibold uppercase tracking-wider">
                    {isRussian ? 'Универсальный доступ' : 'Universal Access'}
                  </span>
                </div>

                {profile?.public_email && !profile.public_email.includes('@top-focus.ru') ? (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100">
                    <span className="text-sm font-medium">{profile.public_email}</span>
                    <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      {isRussian ? 'ПРИВЯЗАН' : 'LINKED'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isRussian 
                        ? 'Привяжите почту, чтобы входить в аккаунт через браузер и сохранять прогресс вне Telegram.' 
                        : 'Link your email to access your account via browser and save progress outside of Telegram.'}
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        type="email"
                        placeholder="example@mail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="h-9 bg-white dark:bg-slate-900"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleLinkEmail} 
                        disabled={isLinking}
                        className="bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                      >
                        {isLinking ? '...' : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 2x3 Tile Grid */}
        <div 
          className="grid grid-cols-2 gap-3"
          style={{ 
            height: user ? 'calc(100vh - 320px)' : 'calc(100vh - 260px)',
            minHeight: '400px',
            gridTemplateRows: 'repeat(3, 1fr)'
          }}
        >
          <ProfileTile
            icon={<Settings className="w-5 h-5 text-white" />}
            title={isRussian ? 'Профиль и Настройки' : 'Profile & Settings'}
            subtitle={isRussian ? 'Аккаунт, синхронизация' : 'Account, sync'}
            gradient="from-blue-500 to-cyan-500"
            onClick={() => handleTileClick('/profile/settings', true)}
            locked={!user}
            delay={0}
          />

          <ProfileTile
            icon={<Trophy className="w-5 h-5 text-white" />}
            title={isRussian ? 'Награды' : 'Rewards'}
            subtitle={isRussian ? 'Достижения и бейджи' : 'Achievements & badges'}
            gradient="from-amber-500 to-yellow-500"
            onClick={() => handleTileClick('/achievements', true)}
            locked={!user}
            delay={0.05}
          />

          <ProfileTile
            icon={<Users className="w-5 h-5 text-white" />}
            title={isRussian ? 'Партнёрская программа' : 'Partner Program'}
            subtitle={isRussian ? 'Приглашай и зарабатывай' : 'Invite & earn'}
            gradient="from-purple-500 to-pink-500"
            onClick={() => navigate('/partner-program')}
            delay={0.1}
          />

          <ProfileTile
            icon={<Crown className="w-5 h-5 text-white" />}
            title={isRussian ? 'Тарифы' : 'Pricing'}
            subtitle={isRussian ? 'PRO подписка' : 'PRO subscription'}
            gradient="from-amber-600 to-orange-500"
            onClick={() => navigate('/upgrade')}
            delay={0.15}
          />

          <ProfileTile
            icon={<BarChart3 className="w-5 h-5 text-white" />}
            title={isRussian ? 'Статистика' : 'Statistics'}
            subtitle={isRussian ? 'Аналитика и прогресс' : 'Analytics & progress'}
            gradient="from-indigo-500 to-violet-500"
            onClick={() => navigate('/statistics')}
            delay={0.2}
          />

          <ProfileTile
            icon={<Archive className="w-5 h-5 text-white" />}
            title={isRussian ? 'Архив' : 'Archive'}
            subtitle={isRussian ? 'История привычек и задач' : 'Habits & tasks history'}
            gradient="from-slate-600 to-slate-500"
            onClick={() => showArchive ? navigate('/archive') : navigate('/upgrade')}
            locked={!showArchive}
            delay={0.25}
          />
        </div>
      </div>
    </div>
  );
}
