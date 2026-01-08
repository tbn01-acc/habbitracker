import { BarChart3, Tag } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ProductivityStats } from '@/components/ProductivityStats';
import { TagStatistics } from '@/components/TagStatistics';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';

export default function Statistics() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader 
          showTitle
          icon={<BarChart3 className="w-5 h-5 text-muted-foreground" />}
          iconBgClass="bg-muted"
          title={t('statistics')}
          subtitle={t('productivityStats')}
        />

        {/* Tag Statistics */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('tagStatistics')}</h2>
          </div>
          <TagStatistics />
        </div>

        {/* Productivity Statistics */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('productivityStats')}</h2>
          </div>
          <ProductivityStats />
        </div>
      </div>
    </div>
  );
}
