import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface MindfulnessMetricProps {
  value: number;
}

export function MindfulnessMetric({ value }: MindfulnessMetricProps) {
  const { language } = useLanguage();
  
  const labels = {
    ru: 'Уровень осознанности',
    en: 'Mindfulness Level',
    es: 'Nivel de Consciencia',
  };

  const descriptions = {
    ru: 'Выполнение привычек сферы Дух за 7 дней',
    en: 'Spirit sphere habits completion in 7 days',
    es: 'Completar hábitos del ámbito Espíritu en 7 días',
  };

  const getStatusColor = () => {
    if (value >= 80) return 'text-emerald-500';
    if (value >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStatusText = () => {
    if (value >= 80) {
      return language === 'ru' ? 'Отлично' : language === 'es' ? 'Excelente' : 'Excellent';
    }
    if (value >= 50) {
      return language === 'ru' ? 'Хорошо' : language === 'es' ? 'Bien' : 'Good';
    }
    return language === 'ru' ? 'Нужно внимание' : language === 'es' ? 'Necesita atención' : 'Needs attention';
  };

  return (
    <motion.div
      className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-rose-50 dark:from-purple-950/20 dark:to-rose-950/20 border border-purple-100 dark:border-purple-900/30"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="font-medium">{labels[language]}</h3>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Progress value={value} className="h-2" />
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${getStatusColor()}`}>
            {value}%
          </span>
        </div>
      </div>
      
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          {descriptions[language]}
        </span>
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    </motion.div>
  );
}
