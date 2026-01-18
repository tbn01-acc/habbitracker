import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface EnergyGaugeProps {
  value: number;
  type: 'personal' | 'social';
  label?: string;
}

export function EnergyGauge({ value, type, label }: EnergyGaugeProps) {
  const { language } = useLanguage();
  
  const defaultLabels = {
    personal: {
      ru: 'Личное',
      en: 'Personal',
      es: 'Personal',
    },
    social: {
      ru: 'Социальное',
      en: 'Social',
      es: 'Social',
    },
  };

  const displayLabel = label || defaultLabels[type][language];
  
  // More contrasting colors
  const colors = type === 'personal' 
    ? {
        fill: 'hsl(280, 70%, 55%)', // Purple
        bg: 'hsl(280, 30%, 20%)',
      }
    : {
        fill: 'hsl(160, 70%, 45%)', // Teal
        bg: 'hsl(160, 30%, 20%)',
      };

  const height = 160;
  const width = 12; // Half the previous width
  const fillHeight = (value / 100) * (height - 8);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-medium text-muted-foreground text-center max-w-14 leading-tight">
        {displayLabel}
      </span>
      
      <div 
        className="relative rounded-full overflow-hidden"
        style={{ 
          height, 
          width,
          backgroundColor: colors.bg,
        }}
      >
        {/* Fill */}
        <motion.div
          className="absolute bottom-1 left-1 right-1 rounded-full"
          style={{ backgroundColor: colors.fill }}
          initial={{ height: 0 }}
          animate={{ height: fillHeight }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        
        {/* Glow effect */}
        <motion.div
          className="absolute bottom-1 left-1 right-1 rounded-full opacity-50 blur-sm"
          style={{ backgroundColor: colors.fill }}
          initial={{ height: 0 }}
          animate={{ height: fillHeight }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      
      <motion.span 
        className="text-sm font-bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {Math.round(value)}%
      </motion.span>
    </div>
  );
}