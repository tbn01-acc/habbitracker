import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Plus, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserTags } from '@/hooks/useUserTags';
import { useSubscriptionContext as useSubscription } from '@/contexts/SubscriptionContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export function TagShortcuts() {
  const navigate = useNavigate();
  const { tags, loading } = useUserTags();
  const { currentPlan } = useSubscription();
  const { t } = useTranslation();

  // Limit based on subscription
  const maxTags = currentPlan === 'pro' ? 3 : 1;
  const displayedTags = useMemo(() => tags.slice(0, maxTags), [tags, maxTags]);
  const lockedCount = Math.max(0, maxTags - displayedTags.length);
  const hasMoreTags = tags.length > displayedTags.length;

  if (loading || tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground">{t('commonTags')}</h2>
        {hasMoreTags && currentPlan === 'free' && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs h-6 px-2"
            onClick={() => navigate('/upgrade')}
          >
            <Lock className="w-3 h-3 mr-1" />
            PRO
          </Button>
        )}
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {displayedTags.map((tag, index) => (
          <motion.button
            key={tag.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => navigate(`/tag/${tag.id}`)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/50 transition-all shrink-0 shadow-sm"
            style={{ 
              borderLeftWidth: '3px',
              borderLeftColor: tag.color 
            }}
          >
            <Tag className="w-4 h-4" style={{ color: tag.color }} />
            <span className="font-medium text-sm text-foreground whitespace-nowrap">
              {tag.name}
            </span>
          </motion.button>
        ))}

        {/* Locked slots for free users */}
        {currentPlan === 'free' && lockedCount > 0 && Array.from({ length: Math.min(lockedCount, 2) }).map((_, i) => (
          <motion.button
            key={`locked-${i}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (displayedTags.length + i) * 0.1 }}
            onClick={() => navigate('/upgrade')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 border border-dashed border-border hover:border-primary/50 transition-all shrink-0"
          >
            <Lock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              PRO
            </span>
          </motion.button>
        ))}

        {/* Add tag button if user has less than max */}
        {tags.length < maxTags && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: displayedTags.length * 0.1 }}
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 border border-dashed border-border hover:border-primary/50 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t('addTag')}
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}
