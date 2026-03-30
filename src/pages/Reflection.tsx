import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, BarChart3, Calendar, Users, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/contexts/LanguageContext';
import { DailyReflection } from '@/components/reflection/DailyReflection';
import { WeeklyReflection } from '@/components/reflection/WeeklyReflection';
import { MonthlyReflection } from '@/components/reflection/MonthlyReflection';
import { TeamReflection } from '@/components/reflection/TeamReflection';
import { AnnualWrap } from '@/components/reflection/AnnualWrap';

const Reflection = () => {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [tab, setTab] = useState('daily');

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isRu ? 'Рефлексия' : 'Reflection'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Измеримое самопознание' : 'Measurable self-awareness'}
            </p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 mb-4">
            <TabsTrigger value="daily" className="text-xs gap-1">
              <Sun className="h-3 w-3" />
              {isRu ? 'День' : 'Day'}
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs gap-1">
              <Calendar className="h-3 w-3" />
              {isRu ? 'Неделя' : 'Week'}
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs gap-1">
              <BarChart3 className="h-3 w-3" />
              {isRu ? 'Месяц' : 'Month'}
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs gap-1">
              <Users className="h-3 w-3" />
              {isRu ? 'Команда' : 'Team'}
            </TabsTrigger>
            <TabsTrigger value="annual" className="text-xs gap-1">
              <Sparkles className="h-3 w-3" />
              {isRu ? 'Год' : 'Year'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <DailyReflection />
          </TabsContent>
          <TabsContent value="weekly">
            <WeeklyReflection />
          </TabsContent>
          <TabsContent value="monthly">
            <MonthlyReflection />
          </TabsContent>
          <TabsContent value="team">
            <TeamReflection />
          </TabsContent>
          <TabsContent value="annual">
            <AnnualWrap />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reflection;
