import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Droplets, 
  Wind, 
  Thermometer, 
  Sun, 
  Umbrella,
  CloudRain,
  CloudSnow,
  Sunrise,
  Sunset,
  MapPin
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/contexts/LanguageContext';
import { getWeatherIcon } from '@/hooks/useWeather';

interface WeatherDetails {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  isDay: boolean;
  uvIndex?: number;
  precipitation?: number;
  hourlyForecast?: Array<{
    time: string;
    temperature: number;
    weatherCode: number;
  }>;
  dailyForecast?: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    weatherCode: number;
  }>;
}

interface WeatherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WeatherModal({ open, onOpenChange }: WeatherModalProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [weatherDetails, setWeatherDetails] = useState<WeatherDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchDetailedWeather();
    }
  }, [open]);

  const fetchDetailedWeather = async () => {
    setLoading(true);
    try {
      // Get cached location or fetch new
      const cachedLocation = localStorage.getItem('user_location_cache');
      let lat = 55.7558;
      let lon = 37.6173;
      
      if (cachedLocation) {
        const parsed = JSON.parse(cachedLocation);
        lat = parsed.lat;
        lon = parsed.lon;
      }

      // Fetch weather data
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day,uv_index&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
      );
      const data = await response.json();

      // Fetch location name
      const geoResponse = await fetch(
        `https://geocode.maps.co/reverse?lat=${lat}&lon=${lon}`
      );
      const geoData = await geoResponse.json();
      setLocation(geoData?.address?.city || geoData?.address?.town || geoData?.address?.state || (isRussian ? 'Текущее местоположение' : 'Current location'));

      // Process hourly forecast (next 24 hours)
      const hourlyForecast = data.hourly?.time?.slice(0, 24).map((time: string, i: number) => ({
        time: new Date(time).getHours().toString().padStart(2, '0') + ':00',
        temperature: Math.round(data.hourly.temperature_2m[i]),
        weatherCode: data.hourly.weather_code[i],
      })) || [];

      // Process daily forecast
      const dailyForecast = data.daily?.time?.map((date: string, i: number) => ({
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        weatherCode: data.daily.weather_code[i],
      })) || [];

      setWeatherDetails({
        temperature: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
        uvIndex: data.current.uv_index,
        precipitation: data.current.precipitation,
        hourlyForecast,
        dailyForecast,
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    const descriptions: Record<number, { ru: string; en: string }> = {
      0: { ru: 'Ясно', en: 'Clear sky' },
      1: { ru: 'Преимущественно ясно', en: 'Mainly clear' },
      2: { ru: 'Переменная облачность', en: 'Partly cloudy' },
      3: { ru: 'Пасмурно', en: 'Overcast' },
      45: { ru: 'Туман', en: 'Fog' },
      48: { ru: 'Изморозь', en: 'Rime fog' },
      51: { ru: 'Лёгкая морось', en: 'Light drizzle' },
      53: { ru: 'Морось', en: 'Moderate drizzle' },
      55: { ru: 'Сильная морось', en: 'Dense drizzle' },
      61: { ru: 'Небольшой дождь', en: 'Light rain' },
      63: { ru: 'Дождь', en: 'Moderate rain' },
      65: { ru: 'Сильный дождь', en: 'Heavy rain' },
      71: { ru: 'Небольшой снег', en: 'Light snow' },
      73: { ru: 'Снег', en: 'Moderate snow' },
      75: { ru: 'Сильный снег', en: 'Heavy snow' },
      80: { ru: 'Ливень', en: 'Rain showers' },
      95: { ru: 'Гроза', en: 'Thunderstorm' },
    };
    return descriptions[code]?.[isRussian ? 'ru' : 'en'] || (isRussian ? 'Переменная облачность' : 'Variable clouds');
  };

  const getRecommendations = (): string[] => {
    if (!weatherDetails) return [];
    const recs: string[] = [];
    
    // Temperature-based recommendations
    if (weatherDetails.temperature < -10) {
      recs.push(isRussian ? '🧥 Наденьте тёплую куртку и шапку' : '🧥 Wear a warm jacket and hat');
      recs.push(isRussian ? '🧤 Не забудьте перчатки' : '🧤 Don\'t forget gloves');
    } else if (weatherDetails.temperature < 0) {
      recs.push(isRussian ? '🧣 Одевайтесь теплее' : '🧣 Dress warmly');
    } else if (weatherDetails.temperature > 30) {
      recs.push(isRussian ? '🥵 Избегайте прямых солнечных лучей' : '🥵 Avoid direct sunlight');
      recs.push(isRussian ? '💧 Пейте много воды' : '💧 Drink plenty of water');
    } else if (weatherDetails.temperature > 25) {
      recs.push(isRussian ? '💧 Пейте больше воды' : '💧 Stay hydrated');
      recs.push(isRussian ? '👕 Оденьтесь легко' : '👕 Wear light clothing');
    }
    
    // UV recommendations
    if (weatherDetails.uvIndex && weatherDetails.uvIndex > 7) {
      recs.push(isRussian ? '☀️ Высокий УФ-индекс! Используйте крем SPF 50+' : '☀️ High UV! Use SPF 50+ sunscreen');
      recs.push(isRussian ? '🕶️ Носите солнцезащитные очки' : '🕶️ Wear sunglasses');
    } else if (weatherDetails.uvIndex && weatherDetails.uvIndex > 5) {
      recs.push(isRussian ? '☀️ Используйте солнцезащитный крем' : '☀️ Use sunscreen');
    }
    
    // Precipitation recommendations
    if (weatherDetails.precipitation && weatherDetails.precipitation > 5) {
      recs.push(isRussian ? '☔ Возьмите зонт, ожидаются осадки' : '☔ Take an umbrella, rain expected');
    } else if (weatherDetails.precipitation && weatherDetails.precipitation > 0) {
      recs.push(isRussian ? '🌧️ Возможен небольшой дождь' : '🌧️ Light rain possible');
    }
    
    // Wind recommendations
    if (weatherDetails.windSpeed > 25) {
      recs.push(isRussian ? '💨 Сильный ветер, будьте осторожны' : '💨 Strong wind, be careful');
    } else if (weatherDetails.windSpeed > 15) {
      recs.push(isRussian ? '💨 Ожидается ветреная погода' : '💨 Windy weather expected');
    }
    
    // Humidity recommendations
    if (weatherDetails.humidity > 85) {
      recs.push(isRussian ? '💦 Очень высокая влажность' : '💦 Very high humidity');
    } else if (weatherDetails.humidity > 70) {
      recs.push(isRussian ? '💦 Повышенная влажность' : '💦 High humidity');
    } else if (weatherDetails.humidity < 30) {
      recs.push(isRussian ? '🏜️ Сухой воздух, увлажняйте кожу' : '🏜️ Dry air, moisturize your skin');
    }
    
    // Activity recommendations based on weather code
    if (weatherDetails.weatherCode === 0 || weatherDetails.weatherCode === 1) {
      if (weatherDetails.temperature > 10 && weatherDetails.temperature < 28) {
        recs.push(isRussian ? '🚶 Отличная погода для прогулки!' : '🚶 Great weather for a walk!');
      }
      if (weatherDetails.temperature > 15 && weatherDetails.temperature < 25) {
        recs.push(isRussian ? '🏃 Идеально для пробежки' : '🏃 Perfect for jogging');
      }
    }
    
    // Default if no specific recommendations
    if (recs.length === 0) {
      recs.push(isRussian ? '✨ Приятного дня!' : '✨ Have a nice day!');
    }
    
    return recs.slice(0, 5); // Limit to 5 recommendations
  };

  const getDayName = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return isRussian ? 'Сегодня' : 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return isRussian ? 'Завтра' : 'Tomorrow';
    }
    return date.toLocaleDateString(isRussian ? 'ru-RU' : 'en-US', { weekday: 'short' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{weatherDetails ? getWeatherIcon(weatherDetails.weatherCode, weatherDetails.isDay) : '🌤️'}</span>
            {isRussian ? 'Прогноз погоды' : 'Weather Forecast'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            {/* Current weather skeleton */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="w-32 h-4" />
            </div>
            <Skeleton className="h-36 w-full rounded-xl" />
            
            {/* Recommendations skeleton */}
            <Skeleton className="h-24 w-full rounded-xl" />
            
            {/* Hourly forecast skeleton */}
            <Skeleton className="h-28 w-full rounded-xl" />
            
            {/* Daily forecast skeleton */}
            <Skeleton className="h-48 w-full rounded-xl" />
            
            <p className="text-xs text-center text-muted-foreground animate-pulse">
              {isRussian ? 'Загрузка прогноза погоды...' : 'Loading weather forecast...'}
            </p>
          </div>
        ) : weatherDetails ? (
          <div className="space-y-4">
            {/* Location */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{location}</span>
            </div>

            {/* Current Weather */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-foreground">
                      {weatherDetails.temperature}°C
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getWeatherDescription(weatherDetails.weatherCode)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {isRussian ? 'Ощущается как' : 'Feels like'} {weatherDetails.feelsLike}°C
                    </div>
                  </div>
                  <div className="text-6xl">
                    {getWeatherIcon(weatherDetails.weatherCode, weatherDetails.isDay)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <Droplets className="w-4 h-4 mx-auto text-blue-500" />
                    <div className="text-sm font-medium mt-1">{weatherDetails.humidity}%</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Влажность' : 'Humidity'}</div>
                  </div>
                  <div className="text-center">
                    <Wind className="w-4 h-4 mx-auto text-cyan-500" />
                    <div className="text-sm font-medium mt-1">{weatherDetails.windSpeed} км/ч</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Ветер' : 'Wind'}</div>
                  </div>
                  <div className="text-center">
                    <Sun className="w-4 h-4 mx-auto text-yellow-500" />
                    <div className="text-sm font-medium mt-1">{weatherDetails.uvIndex || 0}</div>
                    <div className="text-xs text-muted-foreground">UV</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Umbrella className="w-4 h-4 text-purple-500" />
                  {isRussian ? 'Рекомендации' : 'Recommendations'}
                </h4>
                <div className="space-y-1.5">
                  {getRecommendations().map((rec, i) => (
                    <div key={i} className="text-sm text-muted-foreground">
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Hourly Forecast */}
            {weatherDetails.hourlyForecast && weatherDetails.hourlyForecast.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="text-sm font-medium mb-3">
                    {isRussian ? 'Почасовой прогноз' : 'Hourly Forecast'}
                  </h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {weatherDetails.hourlyForecast.slice(0, 12).map((hour, i) => (
                      <div key={i} className="flex flex-col items-center min-w-[50px]">
                        <span className="text-xs text-muted-foreground">{hour.time}</span>
                        <span className="text-lg my-1">{getWeatherIcon(hour.weatherCode, true)}</span>
                        <span className="text-sm font-medium">{hour.temperature}°</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Forecast */}
            {weatherDetails.dailyForecast && weatherDetails.dailyForecast.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <h4 className="text-sm font-medium mb-3">
                    {isRussian ? 'Прогноз на 5 дней' : '5-Day Forecast'}
                  </h4>
                  <div className="space-y-2">
                    {weatherDetails.dailyForecast.map((day, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <span className="text-lg">{getWeatherIcon(day.weatherCode, true)}</span>
                          <span className="text-sm">{getDayName(day.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{day.tempMax}°</span>
                          <span className="text-xs text-muted-foreground">{day.tempMin}°</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {isRussian ? 'Не удалось загрузить погоду' : 'Failed to load weather'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
