import { useState } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { Calendar, Plus, Minus, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useTranslation, useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function DateCalculator() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const locale = language === 'ru' ? ru : language === 'es' ? es : enUS;
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [daysToAdd, setDaysToAdd] = useState<number>(0);
  const [baseDate, setBaseDate] = useState<Date>(new Date());

  const daysDiff = differenceInDays(endDate, startDate);
  const resultDate = addDays(baseDate, daysToAdd);

  return (
    <div className="space-y-4">
      {/* Days Between Dates */}
      <Card className="border-service/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-service" />
            {t('daysBetween')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(startDate, 'dd.MM.yyyy', { locale })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('endDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(endDate, 'dd.MM.yyyy', { locale })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex items-center justify-center p-4 bg-service/10 rounded-xl">
            <span className="text-3xl font-bold text-service">{Math.abs(daysDiff)}</span>
            <span className="ml-2 text-muted-foreground">{t('days7').replace('7 ', '')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Add/Subtract Days */}
      <Card className="border-service/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Plus className="w-4 h-4 text-service" />
            {t('addDays')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('startDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(baseDate, 'dd.MM.yyyy', { locale })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={baseDate}
                    onSelect={(date) => date && setBaseDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('days7').replace('7 ', '')}</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDaysToAdd(d => d - 1)}
                  className="h-10 w-10"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setDaysToAdd(d => d + 1)}
                  className="h-10 w-10"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 p-4 bg-service/10 rounded-xl">
            <span className="text-muted-foreground">{t('resultDate')}:</span>
            <ArrowRight className="w-4 h-4 text-service" />
            <span className="text-xl font-bold text-service">
              {format(resultDate, 'dd.MM.yyyy', { locale })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
