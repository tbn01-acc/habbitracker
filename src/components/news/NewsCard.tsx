import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface NewsItem {
  id: string;
  date: string;
  title: { ru: string; en: string };
  content: { ru: string; en: string };
  type: 'update' | 'feature' | 'promo' | 'announcement';
  icon: React.ReactNode;
}

interface NewsCardProps {
  item: NewsItem;
  isRussian: boolean;
  index: number;
}

export function NewsCard({ item, isRussian, index }: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const locale = isRussian ? ru : enUS;

  const getTypeBadge = (type: NewsItem['type']) => {
    switch (type) {
      case 'update':
        return <Badge variant="outline" className="border-blue-500/50 text-blue-500 text-[10px] py-0">Обновление</Badge>;
      case 'feature':
        return <Badge variant="outline" className="border-green-500/50 text-green-500 text-[10px] py-0">{isRussian ? 'Функция' : 'Feature'}</Badge>;
      case 'promo':
        return <Badge variant="outline" className="border-purple-500/50 text-purple-500 text-[10px] py-0">{isRussian ? 'Акция' : 'Promo'}</Badge>;
      case 'announcement':
        return <Badge variant="outline" className="border-amber-500/50 text-amber-500 text-[10px] py-0">{isRussian ? 'Анонс' : 'Announcement'}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className="cursor-pointer transition-all hover:shadow-md"
        onClick={() => setExpanded(!expanded)}
      >
        <CardHeader className="py-2.5 px-4">
          <div className="flex flex-col gap-1">
            {/* Row 1: Tag/Badge */}
            <div className="flex items-center justify-between">
              {getTypeBadge(item.type)}
              <button className="p-1 shrink-0">
                {expanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {/* Row 2: Title */}
            <CardTitle className="text-sm font-medium line-clamp-1">
              {isRussian ? item.title.ru : item.title.en}
            </CardTitle>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 pb-3 px-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    {item.icon}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(item.date), 'd MMMM yyyy', { locale })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isRussian ? item.content.ru : item.content.en}
                </p>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
