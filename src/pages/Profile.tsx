import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Settings, Trophy, Users, Crown, Info, Lock, LogIn, ChevronRight } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
          <div className="p-6 h-full flex flex-col justify-between min-h-[140px]">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{title}</h3>
              <p className="text-white/70 text-sm">{subtitle}</p>
            </div>
            {locked && (
              <div className="absolute top-3 right-3">
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
  const { user, loading } = useAuth();
  const isRussian = language === 'ru';

  const handleTileClick = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !user) {
      navigate('/auth');
    } else {
      navigate(path);
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Guest Banner */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/10 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {isRussian ? 'Вы не авторизованы' : 'Not signed in'}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isRussian ? 'Войдите для доступа ко всем функциям' : 'Sign in for full access'}
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => navigate('/auth')} className="gap-2">
                    <LogIn className="w-4 h-4" />
                    {isRussian ? 'Войти' : 'Sign In'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 2x2 Tile Grid */}
        <div className="grid grid-cols-2 gap-4" style={{ minHeight: 'calc(100vh - 300px)' }}>
          <ProfileTile
            icon={<Settings className="w-6 h-6 text-white" />}
            title={isRussian ? 'Профиль и Настройки' : 'Profile & Settings'}
            subtitle={isRussian ? 'Аккаунт, синхронизация' : 'Account, sync'}
            gradient="from-blue-500 to-cyan-500"
            onClick={() => handleTileClick('/profile/settings', true)}
            locked={!user}
            delay={0}
          />

          <ProfileTile
            icon={<Trophy className="w-6 h-6 text-white" />}
            title={isRussian ? 'Награды' : 'Rewards'}
            subtitle={isRussian ? 'Достижения и бейджи' : 'Achievements & badges'}
            gradient="from-amber-500 to-yellow-500"
            onClick={() => handleTileClick('/achievements', true)}
            locked={!user}
            delay={0.1}
          />

          <ProfileTile
            icon={<Users className="w-6 h-6 text-white" />}
            title={isRussian ? 'Партнёрская программа' : 'Partner Program'}
            subtitle={isRussian ? 'Приглашай и зарабатывай' : 'Invite & earn'}
            gradient="from-purple-500 to-pink-500"
            onClick={() => navigate('/partner-program')}
            delay={0.2}
          />

          <ProfileTile
            icon={<Crown className="w-6 h-6 text-white" />}
            title={isRussian ? 'Тарифы' : 'Pricing'}
            subtitle={isRussian ? 'PRO подписка' : 'PRO subscription'}
            gradient="from-amber-600 to-orange-500"
            onClick={() => navigate('/upgrade')}
            delay={0.3}
          />
        </div>

        {/* About App Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Link to="/about">
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Info className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">
                  {isRussian ? 'О приложении' : 'About App'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
