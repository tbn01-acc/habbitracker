import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Copy, UserPlus, CheckCircle, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';
import { Workout } from '@/types/fitness';

interface ShareWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  workout: Workout | null;
  exerciseLogs?: { date: string; sets: number; totalWeight: number }[];
}

export function ShareWorkoutDialog({ open, onClose, workout, exerciseLogs = [] }: ShareWorkoutDialogProps) {
  const { t } = useTranslation();
  const [shareType, setShareType] = useState<'workout' | 'results'>('workout');
  const [copied, setCopied] = useState(false);

  if (!workout) return null;

  const appUrl = window.location.origin;
  const inviteMessage = t('shareWorkoutInvite');

  const workoutSummary = `
${workout.icon} ${workout.name}
━━━━━━━━━━━━━━
${t('exercises')}: ${workout.exercises.length}
${workout.exercises.map(e => `• ${e.name} (${e.targetSets}×${e.targetReps})`).join('\n')}
━━━━━━━━━━━━━━
${inviteMessage}
${appUrl}
  `.trim();

  const resultsSummary = `
${workout.icon} ${workout.name} - ${t('myResults')}
━━━━━━━━━━━━━━
${exerciseLogs.slice(0, 5).map(log => 
  `📅 ${new Date(log.date).toLocaleDateString()} - ${log.sets} ${t('setsCount')}, ${log.totalWeight} kg`
).join('\n')}
━━━━━━━━━━━━━━
${inviteMessage}
${appUrl}
  `.trim();

  const shareContent = shareType === 'workout' ? workoutSummary : resultsSummary;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareContent);
      setCopied(true);
      toast.success(t('linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${workout.name} - HabitFlow`,
          text: shareContent,
          url: appUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleInviteFriend = () => {
    const text = `${t('shareWorkoutInvite')} ${appUrl}`;
    if (navigator.share) {
      navigator.share({ title: t('shareTitle'), text, url: appUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success(t('linkCopied'));
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-[20%] max-w-md mx-auto bg-card rounded-3xl p-6 shadow-lg z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: `${workout.color}20` }}
                >
                  {workout.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{t('shareWorkout')}</h2>
                  <p className="text-sm text-muted-foreground">{workout.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Share Type Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setShareType('workout')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  shareType === 'workout'
                    ? 'bg-fitness text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Dumbbell className="w-4 h-4 inline-block mr-1.5" />
                {t('workout')}
              </button>
              <button
                onClick={() => setShareType('results')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  shareType === 'results'
                    ? 'bg-fitness text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <CheckCircle className="w-4 h-4 inline-block mr-1.5" />
                {t('myResults')}
              </button>
            </div>

            {/* Preview */}
            <div className="bg-muted rounded-xl p-4 mb-6 max-h-48 overflow-y-auto">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
                {shareContent}
              </pre>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleShare}
                className="w-full bg-fitness hover:bg-fitness/90 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('share')}
              </Button>

              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                    {t('copied')}
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    {t('copyToClipboard')}
                  </>
                )}
              </Button>

              <Button
                onClick={handleInviteFriend}
                variant="ghost"
                className="w-full text-fitness hover:text-fitness/90 hover:bg-fitness/10"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t('inviteFriendToApp')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
