import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useWeather, getWeatherIcon } from '@/hooks/useWeather';
import { useTranslation } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ReferralModal } from '@/components/ReferralModal';

export function AppHeader() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { weather, loading: weatherLoading } = useWeather();
  const { t } = useTranslation();
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  const userName = profile?.display_name || user?.email?.split('@')[0] || t('guest');
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Avatar */}
            <button 
              onClick={() => navigate('/profile')} 
              className="shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
            >
              <Avatar className="w-10 h-10 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* Center: Weather */}
            {!weatherLoading && weather && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="text-base">{getWeatherIcon(weather.weatherCode, weather.isDay)}</span>
                <span className="font-medium">{weather.temperature}°C</span>
              </div>
            )}

            {/* Right: Theme + Invite */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setReferralModalOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25 gap-2 px-4"
                  size="sm"
                >
                  <Gift className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('inviteFriend')}</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      <ReferralModal 
        open={referralModalOpen} 
        onOpenChange={setReferralModalOpen} 
      />
    </>
  );
}
