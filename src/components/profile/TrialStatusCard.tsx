import { Clock, Gift, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';

interface TrialStatusCardProps {
  isInTrial: boolean;
  trialDaysLeft: number;
  trialBonusMonths: number;
}

export function TrialStatusCard({ isInTrial, trialDaysLeft, trialBonusMonths }: TrialStatusCardProps) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  if (!isInTrial) return null;

  const getTrialMessage = () => {
    if (language === 'ru') {
      const daysWord = trialDaysLeft === 1 ? 'день' : 
                       trialDaysLeft < 5 ? 'дня' : 'дней';
      return `Осталось ${trialDaysLeft} ${daysWord} пробного периода`;
    }
    if (language === 'es') {
      return `Quedan ${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} de prueba`;
    }
    return `${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in trial`;
  };

  const getBonusMessage = () => {
    if (language === 'ru') {
      const monthWord = trialBonusMonths === 1 ? 'месяц' : 
                        trialBonusMonths < 5 ? 'месяца' : 'месяцев';
      return `+${trialBonusMonths} ${monthWord} бесплатно при покупке PRO (12/24 мес)`;
    }
    if (language === 'es') {
      return `+${trialBonusMonths} mes${trialBonusMonths !== 1 ? 'es' : ''} gratis al comprar PRO (12/24 meses)`;
    }
    return `+${trialBonusMonths} month${trialBonusMonths !== 1 ? 's' : ''} free when purchasing PRO (12/24 mo)`;
  };

  // Determine urgency color based on days left
  const isUrgent = trialDaysLeft <= 2;
  const borderColor = isUrgent ? 'border-destructive/50' : 'border-primary/30';
  const bgGradient = isUrgent 
    ? 'bg-gradient-to-r from-destructive/10 to-orange-500/10' 
    : 'bg-gradient-to-r from-primary/10 to-purple-500/10';

  return (
    <Card className={`${bgGradient} ${borderColor} border-2 overflow-hidden`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isUrgent ? 'bg-destructive/20' : 'bg-primary/20'
          }`}>
            <Clock className={`w-5 h-5 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="font-semibold text-foreground">PRO Trial</span>
            </div>
            
            <p className={`text-sm font-medium ${isUrgent ? 'text-destructive' : 'text-foreground'}`}>
              {getTrialMessage()}
            </p>
            
            {trialBonusMonths > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Gift className="w-3 h-3 text-green-500" />
                <p className="text-xs text-muted-foreground">
                  {getBonusMessage()}
                </p>
              </div>
            )}
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/upgrade')}
          className="w-full mt-3"
          size="sm"
        >
          {language === 'ru' ? 'Оформить PRO' : language === 'es' ? 'Obtener PRO' : 'Get PRO'}
        </Button>
      </CardContent>
    </Card>
  );
}
