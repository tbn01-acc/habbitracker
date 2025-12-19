import { useState, useEffect } from 'react';
import { Globe, Plus, X, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTranslation } from '@/contexts/LanguageContext';

const TIMEZONES = [
  { id: 'Europe/Moscow', label: 'Москва', offset: '+3' },
  { id: 'Europe/London', label: 'Лондон', offset: '+0' },
  { id: 'Europe/Paris', label: 'Париж', offset: '+1' },
  { id: 'Europe/Berlin', label: 'Берлин', offset: '+1' },
  { id: 'America/New_York', label: 'Нью-Йорк', offset: '-5' },
  { id: 'America/Los_Angeles', label: 'Лос-Анджелес', offset: '-8' },
  { id: 'America/Chicago', label: 'Чикаго', offset: '-6' },
  { id: 'Asia/Tokyo', label: 'Токио', offset: '+9' },
  { id: 'Asia/Shanghai', label: 'Шанхай', offset: '+8' },
  { id: 'Asia/Dubai', label: 'Дубай', offset: '+4' },
  { id: 'Asia/Singapore', label: 'Сингапур', offset: '+8' },
  { id: 'Asia/Hong_Kong', label: 'Гонконг', offset: '+8' },
  { id: 'Australia/Sydney', label: 'Сидней', offset: '+11' },
  { id: 'Pacific/Auckland', label: 'Окленд', offset: '+13' },
];

const WORLD_TIME_KEY = 'habitflow_world_time_zones';

export function WorldTime() {
  const { t } = useTranslation();
  const [selectedZones, setSelectedZones] = useState<string[]>(['Europe/Moscow', 'America/New_York']);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddZone, setShowAddZone] = useState(false);

  // Load saved zones
  useEffect(() => {
    const saved = localStorage.getItem(WORLD_TIME_KEY);
    if (saved) {
      try {
        setSelectedZones(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse world time zones:', e);
      }
    }
  }, []);

  // Save zones
  useEffect(() => {
    localStorage.setItem(WORLD_TIME_KEY, JSON.stringify(selectedZones));
  }, [selectedZones]);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addZone = (zoneId: string) => {
    if (!selectedZones.includes(zoneId)) {
      setSelectedZones([...selectedZones, zoneId]);
    }
    setShowAddZone(false);
  };

  const removeZone = (zoneId: string) => {
    if (selectedZones.length > 1) {
      setSelectedZones(selectedZones.filter(z => z !== zoneId));
    }
  };

  const getTimeForZone = (zoneId: string) => {
    try {
      return currentTime.toLocaleTimeString('ru-RU', {
        timeZone: zoneId,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return '--:--:--';
    }
  };

  const getDateForZone = (zoneId: string) => {
    try {
      return currentTime.toLocaleDateString('ru-RU', {
        timeZone: zoneId,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch (e) {
      return '';
    }
  };

  const availableZones = TIMEZONES.filter(z => !selectedZones.includes(z.id));

  return (
    <div className="space-y-4">
      <Card className="border-service/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Globe className="w-4 h-4 text-service" />
              {t('worldTime')}
            </CardTitle>
            {availableZones.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddZone(!showAddZone)}
                className="h-8 px-2"
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Zone Selector */}
          {showAddZone && (
            <Select onValueChange={addZone}>
              <SelectTrigger>
                <SelectValue placeholder={t('selectTimezone')} />
              </SelectTrigger>
              <SelectContent>
                {availableZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.label} (UTC{zone.offset})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Time Zones Grid */}
          <div className="grid gap-3">
            {selectedZones.map((zoneId) => {
              const zone = TIMEZONES.find(z => z.id === zoneId);
              if (!zone) return null;

              return (
                <div
                  key={zoneId}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-service/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-service" />
                    </div>
                    <div>
                      <p className="font-medium">{zone.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {getDateForZone(zoneId)} • UTC{zone.offset}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-bold text-service">
                      {getTimeForZone(zoneId)}
                    </span>
                    {selectedZones.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeZone(zoneId)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
