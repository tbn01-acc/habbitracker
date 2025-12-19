import { useState, useEffect, useCallback } from 'react';
import { CurrencyRate, CURRENCIES } from '@/types/service';

const CACHE_KEY = 'habitflow_currency_rates';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface CachedRates {
  rates: CurrencyRate[];
  timestamp: number;
}

// Using free API for demonstration - in production use a proper API
const API_URL = 'https://open.er-api.com/v6/latest/RUB';

export function useCurrencyRates() {
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadFromCache = useCallback(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { rates, timestamp }: CachedRates = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < CACHE_DURATION) {
          setRates(rates);
          setLastUpdated(new Date(timestamp));
          return true;
        }
      } catch (e) {
        console.error('Failed to parse cached rates:', e);
      }
    }
    return false;
  }, []);

  const fetchRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }
      
      const data = await response.json();
      
      if (data.result === 'success' && data.rates) {
        const newRates: CurrencyRate[] = CURRENCIES.map(currency => {
          // API returns rate as RUB to currency, we need inverse
          const rate = data.rates[currency.code];
          const rateToRub = rate ? 1 / rate : 0;
          
          return {
            code: currency.code,
            name: currency.name,
            rate: Math.round(rateToRub * 100) / 100,
            symbol: currency.symbol,
          };
        });
        
        // Calculate changes compared to cached rates
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { rates: oldRates }: CachedRates = JSON.parse(cached);
            newRates.forEach(rate => {
              const old = oldRates.find(r => r.code === rate.code);
              if (old) {
                rate.change = Math.round((rate.rate - old.rate) * 100) / 100;
              }
            });
          } catch (e) {}
        }
        
        setRates(newRates);
        setLastUpdated(new Date());
        
        // Cache the results
        const cacheData: CachedRates = {
          rates: newRates,
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      } else {
        throw new Error('Invalid API response');
      }
    } catch (e) {
      console.error('Failed to fetch currency rates:', e);
      setError('Не удалось загрузить курсы валют');
      // Try to load from cache on error
      loadFromCache();
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache]);

  const refresh = useCallback(() => {
    fetchRates();
  }, [fetchRates]);

  // Load on mount - from cache first, then fetch
  useEffect(() => {
    const fromCache = loadFromCache();
    if (fromCache) {
      setIsLoading(false);
      // Still fetch fresh data in background
      fetchRates();
    } else {
      fetchRates();
    }
  }, [loadFromCache, fetchRates]);

  return {
    rates,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}
