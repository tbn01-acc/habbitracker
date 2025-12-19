import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrencyRates } from '@/hooks/useCurrencyRates';
import { useTranslation } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function CurrencyRates() {
  const { t } = useTranslation();
  const { rates, isLoading, error, lastUpdated, refresh } = useCurrencyRates();

  const getTrendIcon = (change?: number) => {
    if (!change || change === 0) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-success" />;
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  const getTrendColor = (change?: number) => {
    if (!change || change === 0) return 'text-muted-foreground';
    if (change > 0) return 'text-success';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {t('currencyRates') || 'Курсы валют'}
          </h3>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              {t('updated') || 'Обновлено'}: {format(lastUpdated, 'HH:mm', { locale: ru })}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={refresh}
          disabled={isLoading}
          className={cn(isLoading && "animate-spin")}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Rates grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="wait">
          {isLoading && rates.length === 0 ? (
            // Loading skeletons
            [...Array(4)].map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-muted animate-pulse rounded-xl h-24"
              />
            ))
          ) : (
            rates.map((rate, index) => (
              <motion.div
                key={rate.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl p-4 shadow-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl font-bold">{rate.symbol}</span>
                  {getTrendIcon(rate.change)}
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">
                    {rate.rate.toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">₽</span>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">{rate.code}</span>
                  {rate.change !== undefined && rate.change !== 0 && (
                    <span className={cn("text-xs font-medium", getTrendColor(rate.change))}>
                      {rate.change > 0 ? '+' : ''}{rate.change.toFixed(2)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        {t('currencyInfo') || 'Данные обновляются при открытии раздела'}
      </p>
    </div>
  );
}
