import React from 'react';
import { motion } from 'framer-motion';
import { SpreadLevel } from '@/hooks/useBalanceSpread';
import { Zap, AlertTriangle, Target, Award, Crown, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BalanceStatusBadgeProps {
  level: SpreadLevel;
  language: 'ru' | 'en' | 'es';
  onClick?: () => void;
  disabled?: boolean;
}

const tooltipMessages = {
  ru: 'Уведомления активируются когда все сферы заполнены минимум на 25%',
  en: 'Notifications activate when all spheres are filled at least 25%',
  es: 'Las notificaciones se activan cuando todas las esferas están llenas al menos al 25%',
};

const statusLabels: Record<SpreadLevel, Record<'ru' | 'en' | 'es', string>> = {
  topFocus: { ru: 'Топ Фокус', en: 'Top Focus', es: 'Foco Máximo' },
  stability: { ru: 'Устойчивость', en: 'Stability', es: 'Estabilidad' },
  balance: { ru: 'Равновесие', en: 'Balance', es: 'Equilibrio' },
  tilt: { ru: 'Крен', en: 'Tilt', es: 'Inclinación' },
  chaos: { ru: 'Хаос', en: 'Chaos', es: 'Caos' },
};

const levelConfigs: Record<SpreadLevel, {
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  glowClass: string;
  animate?: boolean;
}> = {
  topFocus: {
    icon: <Crown className="w-4 h-4" />,
    bgClass: 'bg-gradient-to-r from-amber-400 to-yellow-300',
    textClass: 'text-amber-900',
    glowClass: 'shadow-[0_0_20px_rgba(251,191,36,0.6)]',
  },
  stability: {
    icon: <Award className="w-4 h-4" />,
    bgClass: 'bg-gradient-to-r from-emerald-400 to-green-300',
    textClass: 'text-emerald-900',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
  },
  balance: {
    icon: <Target className="w-4 h-4" />,
    bgClass: 'bg-gradient-to-r from-sky-400 to-blue-300',
    textClass: 'text-sky-900',
    glowClass: 'shadow-[0_0_10px_rgba(14,165,233,0.4)]',
  },
  tilt: {
    icon: <AlertTriangle className="w-4 h-4" />,
    bgClass: 'bg-gradient-to-r from-orange-400 to-amber-300',
    textClass: 'text-orange-900',
    glowClass: '',
    animate: true,
  },
  chaos: {
    icon: <Zap className="w-4 h-4" />,
    bgClass: 'bg-gradient-to-r from-red-500 to-rose-400',
    textClass: 'text-white',
    glowClass: '',
    animate: true,
  },
};

export function BalanceStatusBadge({ level, language, onClick, disabled }: BalanceStatusBadgeProps) {
  const config = levelConfigs[level];
  const label = statusLabels[level][language];

  const badge = (
    <motion.button
      type="button"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: 1, 
        opacity: 1,
        ...(config.animate && !disabled && {
          y: [0, -2, 0],
        }),
      }}
      transition={{
        scale: { duration: 0.3 },
        y: config.animate && !disabled ? {
          repeat: Infinity,
          duration: 0.5,
          repeatDelay: 0.5,
        } : undefined,
      }}
      whileHover={!disabled ? { scale: 1.05 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full 
        ${config.bgClass} ${config.textClass} ${config.glowClass}
        font-semibold text-sm 
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:brightness-110'}
        transition-all
      `}
    >
      {config.icon}
      <span>{label}</span>
      {disabled && <Info className="w-3.5 h-3.5 ml-0.5" />}
    </motion.button>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="max-w-[250px] text-center bg-popover border-border shadow-lg"
          >
            <p className="text-sm">{tooltipMessages[language]}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}
