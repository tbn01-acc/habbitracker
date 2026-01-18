import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Tag, Tags, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { ProductivityStats } from '@/components/ProductivityStats';
import { TagStatistics } from '@/components/TagStatistics';
import { CommonTagsTab } from '@/components/statistics/CommonTagsTab';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Statistics() {
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('stats');
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('statistics')}</h1>
            <p className="text-sm text-muted-foreground">{t('productivityStats')}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stats" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {isRussian ? 'Статистика' : 'Stats'}
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2">
              <Tag className="w-4 h-4" />
              {isRussian ? 'Теги' : 'Tags'}
            </TabsTrigger>
            <TabsTrigger value="common" className="gap-2">
              <Tags className="w-4 h-4" />
              {isRussian ? 'Общие' : 'Common'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <ProductivityStats />
          </TabsContent>

          <TabsContent value="tags">
            <TagStatistics />
          </TabsContent>

          <TabsContent value="common">
            <CommonTagsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
