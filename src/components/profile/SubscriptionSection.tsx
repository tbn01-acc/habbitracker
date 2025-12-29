import { Crown, Check, X, Zap } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface SubscriptionSectionProps {
  currentPlan: 'free' | 'pro';
  expiresAt?: string | null;
  bonusDays?: number;
}

export function SubscriptionSection({ currentPlan, expiresAt, bonusDays = 0 }: SubscriptionSectionProps) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const isRussian = language === 'ru';

  const freeFeatures = [
    { text: isRussian ? '3 привычки, 3 задачи, 15 фин. операций' : '3 habits, 3 tasks, 15 transactions', included: true },
    { text: isRussian ? 'Синхронизация' : 'Cloud sync', included: false },
    { text: isRussian ? 'Экспорт/импорт данных' : 'Export/import data', included: false },
    { text: isRussian ? 'Бэкап данных' : 'Data backup', included: false },
    { text: isRussian ? '1 устройство' : '1 device', included: true },
    { text: isRussian ? '3 мини-приложения' : '3 mini-apps', included: true },
  ];

  const proFeatures = [
    { text: isRussian ? 'Неограниченно привычек, задач, операций' : 'Unlimited habits, tasks, transactions', included: true },
    { text: isRussian ? 'Облачная синхронизация' : 'Cloud sync', included: true },
    { text: isRussian ? 'Экспорт в PDF/CSV' : 'Export to PDF/CSV', included: true },
    { text: isRussian ? 'Бэкап на 7 дней' : '7-day backup', included: true },
    { text: isRussian ? '3 устройства' : '3 devices', included: true },
    { text: isRussian ? '10 мини-приложений' : '10 mini-apps', included: true },
  ];

  const pricingPlans = [
    { period: isRussian ? '1 месяц' : '1 month', priceRub: '399 ₽', priceUsd: '$3.99', monthly: isRussian ? '399 ₽/мес' : '$3.99/mo' },
    { period: isRussian ? '3 месяца' : '3 months', priceRub: '1 047 ₽', priceUsd: '$10.47', monthly: isRussian ? '349 ₽/мес' : '$3.49/mo' },
    { period: isRussian ? '6 месяцев' : '6 months', priceRub: '1 794 ₽', priceUsd: '$17.94', monthly: isRussian ? '299 ₽/мес' : '$2.99/mo' },
    { period: isRussian ? '12 месяцев' : '12 months', priceRub: '2 988 ₽', priceUsd: '$29.88', monthly: isRussian ? '249 ₽/мес' : '$2.49/mo' },
    { period: isRussian ? '24 месяца' : '24 months', priceRub: '4 776 ₽', priceUsd: '$47.76', monthly: isRussian ? '199 ₽/мес' : '$1.99/mo' },
    { period: 'Lifetime', priceRub: '5 990 ₽', priceUsd: '$59.90', monthly: isRussian ? 'навсегда' : 'forever' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(isRussian ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Crown className="w-4 h-4 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {isRussian ? 'Премиум подписка' : 'Premium Subscription'}
        </h2>
      </div>

      {/* Current Plan Status */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant={currentPlan === 'pro' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                {currentPlan === 'pro' ? 'PRO' : 'FREE'}
              </Badge>
              {currentPlan === 'pro' && expiresAt && (
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'до' : 'until'} {formatDate(expiresAt)}
                </span>
              )}
            </div>
            {bonusDays > 0 && (
              <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                +{bonusDays} {isRussian ? 'бонусных дней' : 'bonus days'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* FREE Plan */}
        <Card className={currentPlan === 'free' ? 'border-primary/50 ring-2 ring-primary/20' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              FREE
              {currentPlan === 'free' && (
                <Badge variant="outline" className="text-xs">
                  {isRussian ? 'Текущий' : 'Current'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {freeFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                {feature.included ? (
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                )}
                <span className={feature.included ? 'text-foreground' : 'text-muted-foreground/60 line-through'}>
                  {feature.text}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* PRO Plan */}
        <Card className={`${currentPlan === 'pro' ? 'border-amber-500/50 ring-2 ring-amber-500/20' : 'border-amber-500/30'} bg-gradient-to-br from-amber-500/5 to-transparent`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-amber-500" />
              PRO
              {currentPlan === 'pro' && (
                <Badge className="text-xs bg-amber-500 text-black">
                  {isRussian ? 'Активен' : 'Active'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-foreground">{feature.text}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Pricing */}
      {currentPlan === 'free' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              {isRussian ? 'Тарифы PRO' : 'PRO Pricing'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {pricingPlans.map((plan, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg bg-muted/50 text-center hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className="text-xs text-muted-foreground mb-1">{plan.period}</div>
                  <div className="font-semibold text-foreground">
                    {isRussian ? plan.priceRub : plan.priceUsd}
                  </div>
                  <div className="text-xs text-primary">{plan.monthly}</div>
                </div>
              ))}
            </div>
            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold"
              onClick={() => navigate('/upgrade')}
            >
              <Crown className="w-4 h-4 mr-2" />
              {isRussian ? 'КУПИТЬ PRO-версию' : 'GET PRO VERSION'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
