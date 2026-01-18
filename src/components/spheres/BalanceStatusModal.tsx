import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SpreadLevel, shouldAwardStars, markStarsAwarded, getStarsForLevel } from '@/hooks/useBalanceSpread';
import { useBalanceStatusHistory } from '@/hooks/useBalanceStatusHistory';
import confetti from 'canvas-confetti';
import { playSuccessSound } from '@/utils/celebrations';
import { X, Zap, AlertTriangle, Target, Award, Crown, Share, Star, Camera } from 'lucide-react';
import { useStars } from '@/hooks/useStars';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AchievementPublishDialog } from '@/components/AchievementPublishDialog';
import { toPng } from 'html-to-image';

interface BalanceStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: SpreadLevel;
  spread: number;
  minValue: number;
  maxValue: number;
  minSphereId: number | null;
  maxSphereId: number | null;
  allSpheresAboveMinimum: boolean;
  language: 'ru' | 'en' | 'es';
  isNewLevel?: boolean;
}

const statusMessages = {
  topFocus: {
    ru: {
      title: 'Мастер фокуса',
      message: 'Полная синхронизация всех сфер жизни. Продолжайте в том же духе.',
    },
    en: {
      title: 'Master of Focus',
      message: 'Full synchronization of all life areas. Keep it up.',
    },
    es: {
      title: 'Maestro del Foco',
      message: 'Sincronización total de todas las áreas. Sigue así.',
    },
  },
  stability: {
    ru: {
      title: 'Устойчивость',
      message: 'Отличный баланс. Ваша жизнь гармонична, а ресурсы распределены верно.',
    },
    en: {
      title: 'Stability',
      message: 'Great balance. Your life is harmonious, and resources are allocated correctly.',
    },
    es: {
      title: 'Estabilidad',
      message: 'Excelente equilibrio. Tu vida es armoniosa y los recursos están bien asignados.',
    },
  },
  balance: {
    ru: {
      title: 'Равновесие',
      message: 'Ритм сбивается. Обратите внимание на отстающие сферы, чтобы сохранить темп.',
    },
    en: {
      title: 'Balance',
      message: 'Rhythm is off. Pay attention to lagging areas to keep the momentum.',
    },
    es: {
      title: 'Equilibrio',
      message: 'El ritmo falla. Presta atención a las áreas rezagadas para mantener el impulso.',
    },
  },
  tilt: {
    ru: {
      title: 'Крен',
      message: 'Сильный наклон. Вы на грани выгорания в одних делах и застоя в других.',
    },
    en: {
      title: 'Tilt',
      message: 'Significant tilt. You are on the edge of burnout in some areas and stagnation in others.',
    },
    es: {
      title: 'Inclinación',
      message: 'Inclinación fuerte. Estás al borde del agotamiento en unas áreas y del estancamiento en otras.',
    },
  },
  chaos: {
    ru: {
      title: 'Хаос',
      message: 'Фокус потерян. Одна сфера забирает всё, пока остальные пустуют. Пора замедлиться.',
    },
    en: {
      title: 'Chaos',
      message: 'Focus lost. One area consumes everything while others are empty. Time to slow down.',
    },
    es: {
      title: 'Caos',
      message: 'Foco perdido. Una esfera lo consume todo mientras otras están vacías. Es hora de frenar.',
    },
  },
};

const levelIcons: Record<SpreadLevel, React.ReactNode> = {
  topFocus: <Crown className="w-10 h-10 text-amber-400" />,
  stability: <Award className="w-10 h-10 text-emerald-400" />,
  balance: <Target className="w-10 h-10 text-sky-400" />,
  tilt: <AlertTriangle className="w-10 h-10 text-orange-400" />,
  chaos: <Zap className="w-10 h-10 text-red-400" />,
};

const levelColors: Record<SpreadLevel, string> = {
  topFocus: 'from-amber-500/20 to-yellow-500/20 border-amber-400/50',
  stability: 'from-emerald-500/20 to-green-500/20 border-emerald-400/50',
  balance: 'from-sky-500/20 to-blue-500/20 border-sky-400/50',
  tilt: 'from-orange-500/20 to-amber-500/20 border-orange-400/50',
  chaos: 'from-red-500/20 to-rose-500/20 border-red-400/50',
};

const shareButtonLabels = {
  ru: 'Отправить в Фокус',
  en: 'Send to Focus',
  es: 'Enviar a Foco',
};

export function BalanceStatusModal({ 
  isOpen, 
  onClose, 
  level, 
  spread, 
  minValue,
  maxValue,
  minSphereId,
  maxSphereId,
  allSpheresAboveMinimum,
  language, 
  isNewLevel 
}: BalanceStatusModalProps) {
  const [showLightning, setShowLightning] = useState(false);
  const [showRedPulse, setShowRedPulse] = useState(false);
  const [showBluePulse, setShowBluePulse] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [starsAwarded, setStarsAwarded] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [historySaved, setHistorySaved] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const { addStars } = useStars();
  const { profile } = useAuth();
  const { saveStatusChange } = useBalanceStatusHistory();
  
  const userName = profile?.display_name || '';

  useEffect(() => {
    if (!isOpen) return;

    // Trigger effects based on level
    if (level === 'topFocus') {
      // Multiple fireworks
      playSuccessSound();
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#eab308', '#fcd34d'],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#fbbf24', '#f59e0b', '#eab308', '#fcd34d'],
        });
        confetti({
          particleCount: 3,
          angle: 90,
          spread: 45,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#fbbf24', '#f59e0b', '#eab308'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else if (level === 'stability') {
      // Confetti
      playSuccessSound();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#22c55e', '#4ade80', '#34d399'],
      });
    } else if (level === 'balance') {
      // Blue pulse
      setShowBluePulse(true);
      setTimeout(() => setShowBluePulse(false), 1500);
    } else if (level === 'tilt') {
      // Red pulse
      setShowRedPulse(true);
      setTimeout(() => setShowRedPulse(false), 1500);
    } else if (level === 'chaos') {
      // Lightning effect
      setShowLightning(true);
      setTimeout(() => setShowLightning(false), 300);
      setTimeout(() => {
        setShowLightning(true);
        setTimeout(() => setShowLightning(false), 200);
      }, 400);
    }

    // Award stars for stability/topFocus if first time and is a new level change
    if (isNewLevel && shouldAwardStars(level) && !starsAwarded) {
      const stars = getStarsForLevel(level);
      if (stars > 0) {
        addStars(
          stars,
          'balance_achievement',
          level === 'topFocus' 
            ? 'Достижение: Мастер фокуса (Spread ≤ 5)' 
            : 'Достижение: Устойчивость (Spread ≤ 10)'
        ).then((success) => {
          if (success) {
            markStarsAwarded(level);
            setStarsAwarded(true);
            toast.success(`+${stars} ⭐`, { 
              description: level === 'topFocus' 
                ? (language === 'ru' ? 'За идеальный баланс!' : 'For perfect balance!') 
                : (language === 'ru' ? 'За отличный баланс!' : 'For great balance!')
            });
          }
        });
      }
    }

    // Save to history when new level is achieved
    if (isNewLevel && !historySaved) {
      const starsForHistory = shouldAwardStars(level) ? getStarsForLevel(level) : 0;
      saveStatusChange({
        level,
        spread,
        minValue,
        maxValue,
        minSphereId,
        maxSphereId,
        allSpheresAboveMinimum,
        starsAwarded: starsForHistory,
      }).then(() => {
        setHistorySaved(true);
      });
    }
  }, [isOpen, level, isNewLevel, starsAwarded, addStars, language, historySaved, saveStatusChange, spread, minValue, maxValue, minSphereId, maxSphereId, allSpheresAboveMinimum]);

  const content = statusMessages[level]?.[language] || statusMessages[level]?.en;
  const Icon = levelIcons[level];
  const colorClass = levelColors[level];
  
  // Build personalized message
  const personalizedMessage = userName 
    ? `${userName}, ${content?.message.charAt(0).toLowerCase()}${content?.message.slice(1)}`
    : content?.message;

  const canShare = level === 'stability' || level === 'topFocus';

  const handleShare = async () => {
    if (!modalRef.current) return;
    
    setIsCapturing(true);
    try {
      // Capture screenshot of the modal content
      const dataUrl = await toPng(modalRef.current, {
        backgroundColor: 'transparent',
        pixelRatio: 2,
        quality: 0.95,
      });
      setScreenshotUrl(dataUrl);
      setShowPublishDialog(true);
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      toast.error(language === 'ru' ? 'Ошибка создания снимка' : 'Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <>
      {/* Lightning overlay */}
      <AnimatePresence>
        {showLightning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 z-[100] bg-white/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Red pulse overlay */}
      <AnimatePresence>
        {showRedPulse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 0.3, 0] }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.4, 0.6, 1] }}
            className="fixed inset-0 z-[100] bg-red-500/30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Blue pulse overlay */}
      <AnimatePresence>
        {showBluePulse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0, 0.3, 0] }}
            transition={{ duration: 1.5, times: [0, 0.2, 0.4, 0.6, 1] }}
            className="fixed inset-0 z-[100] bg-sky-500/30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={`max-w-sm bg-gradient-to-br ${colorClass} backdrop-blur-xl border-2 relative`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-black/10 transition-colors z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-foreground/70" />
          </button>
          
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="flex flex-col items-center text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="mb-4"
            >
              {Icon}
            </motion.div>
            
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-bold">
                {content?.title}
              </DialogTitle>
              <DialogDescription className="text-base text-foreground/80">
                {personalizedMessage}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 text-sm text-muted-foreground">
              Spread: {Math.round(spread)}%
            </div>

            {/* Share button for stability and topFocus */}
            {canShare && (
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                {shareButtonLabels[language]}
              </Button>
            )}

            <Button
              onClick={onClose}
              className="mt-4 w-full"
              variant="secondary"
            >
              {language === 'ru' ? 'Понятно' : language === 'es' ? 'Entendido' : 'Got it'}
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog for sharing */}
      <AchievementPublishDialog
        open={showPublishDialog}
        onOpenChange={(open) => {
          setShowPublishDialog(open);
          if (!open) setScreenshotUrl(null);
        }}
        itemName={`${content?.title}: ${personalizedMessage}`}
        preloadedImageUrl={screenshotUrl}
      />
    </>
  );
}
