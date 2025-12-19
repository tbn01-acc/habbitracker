import { useTranslation } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ShareButtons } from '@/components/ShareButtons';
import { useAuth } from '@/hooks/useAuth';

interface PageHeaderProps {
  showTitle?: boolean;
  icon?: React.ReactNode;
  iconBgClass?: string;
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export function PageHeader({ showTitle = false, icon, iconBgClass, title, subtitle, rightAction }: PageHeaderProps) {
  const { t } = useTranslation();
  const { profile, user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t('goodNight');
    if (hour < 12) return t('goodMorning');
    if (hour < 18) return t('goodAfternoon');
    return t('goodEvening');
  };

  const userName = profile?.display_name || user?.email?.split('@')[0] || t('guest');

  return (
    <div className="mb-6">
      {/* Controls Row - Top */}
      <div className="flex items-center justify-between mb-3">
        <ShareButtons />
        <div className="flex items-center gap-1">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>

      {/* Greeting without avatar */}
      <div className="mb-4">
        <p className="text-lg font-medium text-foreground">
          {getGreeting()}, {userName}!
        </p>
      </div>

      {/* Optional Page Title with Icon */}
      {showTitle && icon && title && (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgClass || ''}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {rightAction}
        </div>
      )}
    </div>
  );
}