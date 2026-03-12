import { motion } from 'framer-motion';
import { Crown, Medal, Star, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DemoMember } from '@/lib/demo/testData';

interface RetroPodiumProps {
  members: DemoMember[];
  onAward?: (memberId: string) => void;
  isTest?: boolean;
}

const RANK_COLORS: Record<string, string> = {
  Guru: 'text-yellow-400',
  Master: 'text-purple-400',
  Expert: 'text-blue-400',
  Specialist: 'text-emerald-400',
};

export function RetroPodium({ members, onAward, isTest }: RetroPodiumProps) {
  const sorted = [...members].sort((a, b) => b.xp - a.xp);
  const top3 = sorted.slice(0, 3);
  // Display order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumHeights = [140, 180, 110];
  const podiumColors = [
    'from-slate-400/30 to-slate-500/60',
    'from-yellow-400/30 to-yellow-600/60',
    'from-orange-400/30 to-orange-600/60',
  ];

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Звёзды команды — Топ по XP
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="flex items-end justify-center gap-3 pt-4" style={{ minHeight: 260 }}>
          {podiumOrder.map((member, displayIdx) => {
            if (!member) return null;
            const realIdx = displayIdx === 1 ? 0 : displayIdx === 0 ? 1 : 2;
            const Icon = realIdx === 0 ? Crown : Medal;
            const iconColor = realIdx === 0 ? 'text-yellow-500' : realIdx === 1 ? 'text-slate-400' : 'text-orange-500';
            const height = podiumHeights[displayIdx];

            return (
              <motion.div
                key={member.id}
                className="flex flex-col items-center"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + realIdx * 0.25, type: 'spring', stiffness: 120, damping: 14 }}
              >
                {/* Avatar circle */}
                <motion.div
                  className={`relative mb-2 w-${realIdx === 0 ? '16' : '12'} h-${realIdx === 0 ? '16' : '12'} rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center ${realIdx === 0 ? 'ring-2 ring-yellow-500/60' : ''}`}
                  style={{ width: realIdx === 0 ? 64 : 48, height: realIdx === 0 ? 64 : 48 }}
                  whileHover={isTest ? { scale: 1.1 } : undefined}
                  onClick={() => isTest && onAward?.(member.id)}
                >
                  <span className={`text-${realIdx === 0 ? 'lg' : 'sm'} font-bold`}>
                    {member.name.split(' ').map(w => w[0]).join('')}
                  </span>
                  <div className="absolute -top-1 -right-1">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                </motion.div>

                {/* Name & role */}
                <span className="text-xs font-medium text-center mb-0.5 max-w-[80px] truncate">{member.name}</span>
                <span className="text-[10px] text-muted-foreground mb-1">{member.role}</span>
                <Badge variant="outline" className={`text-[9px] mb-2 ${RANK_COLORS[member.rank] || ''}`}>
                  {member.rank}
                </Badge>

                {/* Podium column - grows from bottom */}
                <motion.div
                  className={`w-20 rounded-t-xl bg-gradient-to-b ${podiumColors[displayIdx]} backdrop-blur flex flex-col items-center justify-start pt-3`}
                  initial={{ height: 0 }}
                  animate={{ height }}
                  transition={{ delay: 0.5 + realIdx * 0.2, type: 'spring', stiffness: 80, damping: 12 }}
                  style={{ overflow: 'hidden' }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 + realIdx * 0.2 }}
                    className="text-center"
                  >
                    <div className="flex items-center gap-0.5 text-yellow-500 mb-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{member.xp.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">XP</span>
                    <div className="mt-1.5 text-xs font-semibold">{member.sp} SP</div>
                  </motion.div>
                </motion.div>

                {/* Place number */}
                <motion.div
                  className="mt-1 text-xs font-bold text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  #{realIdx + 1}
                </motion.div>

                {isTest && (
                  <motion.button
                    className="mt-1 text-[10px] text-yellow-500 hover:text-yellow-400 transition-colors"
                    onClick={() => onAward?.(member.id)}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.4 }}
                  >
                    ⭐ Наградить
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Full leaderboard */}
        <div className="mt-6 space-y-1.5">
          {sorted.slice(3).map((member, i) => (
            <motion.div
              key={member.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30 text-xs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.05 }}
            >
              <span className="w-5 text-center font-bold text-muted-foreground">#{i + 4}</span>
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                {member.name.split(' ').map(w => w[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">{member.name}</span>
                <span className="text-[10px] text-muted-foreground">{member.role}</span>
              </div>
              <Badge variant="outline" className={`text-[8px] ${RANK_COLORS[member.rank] || ''}`}>
                {member.rank}
              </Badge>
              <span className="text-yellow-500 font-medium">{member.xp.toLocaleString()} XP</span>
              {isTest && (
                <button
                  className="text-[10px] text-yellow-500 hover:text-yellow-400"
                  onClick={() => onAward?.(member.id)}
                >
                  ⭐
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
