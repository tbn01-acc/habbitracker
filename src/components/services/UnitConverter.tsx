import { useState } from 'react';
import { Scale, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useTranslation } from '@/contexts/LanguageContext';

type UnitCategory = 'length' | 'mass' | 'temperature';

interface UnitDefinition {
  id: string;
  label: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

const lengthUnits: UnitDefinition[] = [
  { id: 'mm', label: 'мм', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { id: 'cm', label: 'см', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
  { id: 'm', label: 'м', toBase: (v) => v, fromBase: (v) => v },
  { id: 'km', label: 'км', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { id: 'in', label: 'дюйм', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  { id: 'ft', label: 'фут', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  { id: 'yd', label: 'ярд', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  { id: 'mi', label: 'миля', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
];

const massUnits: UnitDefinition[] = [
  { id: 'mg', label: 'мг', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
  { id: 'g', label: 'г', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
  { id: 'kg', label: 'кг', toBase: (v) => v, fromBase: (v) => v },
  { id: 't', label: 'т', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  { id: 'oz', label: 'унция', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  { id: 'lb', label: 'фунт', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
];

const tempUnits: UnitDefinition[] = [
  { id: 'c', label: '°C', toBase: (v) => v, fromBase: (v) => v },
  { id: 'f', label: '°F', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
  { id: 'k', label: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
];

const unitsByCategory: Record<UnitCategory, UnitDefinition[]> = {
  length: lengthUnits,
  mass: massUnits,
  temperature: tempUnits,
};

export function UnitConverter() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('cm');
  const [fromValue, setFromValue] = useState<string>('1');

  const units = unitsByCategory[category];

  const convert = (): string => {
    const value = parseFloat(fromValue);
    if (isNaN(value)) return '0';

    const from = units.find(u => u.id === fromUnit);
    const to = units.find(u => u.id === toUnit);
    
    if (!from || !to) return '0';

    const baseValue = from.toBase(value);
    const result = to.fromBase(baseValue);

    // Format result
    if (Math.abs(result) < 0.0001 || Math.abs(result) > 1000000) {
      return result.toExponential(4);
    }
    return parseFloat(result.toFixed(6)).toString();
  };

  const handleCategoryChange = (newCategory: UnitCategory) => {
    setCategory(newCategory);
    const newUnits = unitsByCategory[newCategory];
    setFromUnit(newUnits[0].id);
    setToUnit(newUnits[1].id);
  };

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  return (
    <div className="space-y-4">
      <Card className="border-service/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Scale className="w-4 h-4 text-service" />
            {t('unitConverter')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Tabs */}
          <Tabs value={category} onValueChange={(v) => handleCategoryChange(v as UnitCategory)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="length">{t('length')}</TabsTrigger>
              <TabsTrigger value="mass">{t('mass')}</TabsTrigger>
              <TabsTrigger value="temperature">{t('temperature')}</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* From */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('from')}</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={fromValue}
                onChange={(e) => setFromValue(e.target.value)}
                className="flex-1"
              />
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={swapUnits}
              className="p-2 rounded-full bg-service/10 hover:bg-service/20 transition-colors"
            >
              <ArrowRightLeft className="w-5 h-5 text-service" />
            </button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{t('to')}</Label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-service/10 rounded-lg font-mono text-lg text-center text-service">
                {convert()}
              </div>
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
