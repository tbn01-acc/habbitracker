import { Zap, Target, CheckSquare, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface OverdueWidgetProps {
  overdueHabits: number;
  overdueTasks: number;
  overdueTransactions: number;
}

export function OverdueWidget({ overdueHabits, overdueTasks, overdueTransactions }: OverdueWidgetProps) {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isRussian = language === 'ru';
  
  const total = overdueHabits + overdueTasks + overdueTransactions;
  
  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {isRussian ? 'Просрочено' : 'Overdue'}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {total}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  {overdueHabits > 0 && (
                    <button 
                      onClick={() => navigate('/habits')}
                      className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                    >
                      <Target className="w-3 h-3" />
                      <span>{overdueHabits}</span>
                    </button>
                  )}
                  {overdueTasks > 0 && (
                    <button 
                      onClick={() => navigate('/tasks')}
                      className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>{overdueTasks}</span>
                    </button>
                  )}
                  {overdueTransactions > 0 && (
                    <button 
                      onClick={() => navigate('/finance')}
                      className="flex items-center gap-1 hover:text-amber-500 transition-colors"
                    >
                      <Wallet className="w-3 h-3" />
                      <span>{overdueTransactions}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
