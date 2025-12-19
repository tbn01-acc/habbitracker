import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Plus, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/LanguageContext';

export function RandomDecision() {
  const { t } = useTranslation();
  const [options, setOptions] = useState<string[]>(['', '']);
  const [result, setResult] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const decide = () => {
    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) return;

    setIsSpinning(true);
    setResult(null);

    // Animate through options
    let count = 0;
    const maxCount = 15;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * validOptions.length);
      setResult(validOptions[randomIndex]);
      count++;
      
      if (count >= maxCount) {
        clearInterval(interval);
        setIsSpinning(false);
        const finalIndex = Math.floor(Math.random() * validOptions.length);
        setResult(validOptions[finalIndex]);
      }
    }, 100);
  };

  const validOptionsCount = options.filter(o => o.trim()).length;

  return (
    <div className="space-y-4">
      <Card className="border-service/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-service" />
            {t('randomDecision')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Options List */}
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`${t('optionPlaceholder')} ${index + 1}`}
                  className="flex-1"
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="h-10 w-10 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Option */}
          <Button
            variant="outline"
            onClick={addOption}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('addOption')}
          </Button>

          {/* Decide Button */}
          <Button
            onClick={decide}
            disabled={validOptionsCount < 2 || isSpinning}
            className="w-full bg-service hover:bg-service/90 text-white"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {t('decide')}
          </Button>

          {/* Result */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`p-6 rounded-xl text-center ${
                  isSpinning 
                    ? 'bg-muted' 
                    : 'bg-gradient-to-br from-service/20 to-service/10'
                }`}
              >
                <p className="text-sm text-muted-foreground mb-2">{t('result')}:</p>
                <motion.p
                  key={result}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-2xl font-bold ${
                    isSpinning ? 'text-muted-foreground' : 'text-service'
                  }`}
                >
                  {result}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {validOptionsCount < 2 && (
            <p className="text-sm text-center text-muted-foreground">
              {t('noOptions')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
