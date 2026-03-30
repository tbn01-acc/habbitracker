import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTeam } from '@/hooks/useTeam';
import { BalanceFlower } from '@/components/spheres/BalanceFlower';
import { SphereIndex, Sphere } from '@/types/sphere';
import { DEMO_DATA } from '@/lib/demo/testData';

// Reordered: Left (Internal) 1-4, Right (External) 5-8
export const TEAM_SPHERES = [
  { id: 1, key: 'satisfaction', name_ru: 'Удовлетворённость', name_en: 'Satisfaction', icon: '😊', color: 'hsl(330, 80%, 60%)', group: 'internal' },
  { id: 2, key: 'engagement', name_ru: 'Вовлечённость', name_en: 'Engagement', icon: '🔥', color: 'hsl(0, 84%, 60%)', group: 'internal' },
  { id: 3, key: 'growth', name_ru: 'Рост', name_en: 'Growth', icon: '📈', color: 'hsl(160, 84%, 39%)', group: 'internal' },
  { id: 4, key: 'communication', name_ru: 'Коммуникация', name_en: 'Communication', icon: '💬', color: 'hsl(187, 96%, 42%)', group: 'internal' },
  { id: 5, key: 'goals', name_ru: 'Цели', name_en: 'Goals', icon: '🎯', color: 'hsl(239, 84%, 67%)', group: 'external' },
  { id: 6, key: 'quality', name_ru: 'Качество', name_en: 'Quality', icon: '✅', color: 'hsl(142, 71%, 45%)', group: 'external' },
  { id: 7, key: 'velocity', name_ru: 'Скорость', name_en: 'Velocity', icon: '⚡', color: 'hsl(38, 92%, 50%)', group: 'external' },
  { id: 8, key: 'collaboration', name_ru: 'Сотрудничество', name_en: 'Collaboration', icon: '🤝', color: 'hsl(263, 70%, 50%)', group: 'external' },
];

// Convert TEAM_SPHERES to Sphere type for BalanceFlower
const TEAM_SPHERE_OBJECTS: Sphere[] = TEAM_SPHERES.map(s => ({
  id: s.id,
  key: s.key as any,
  name_ru: s.name_ru,
  name_en: s.name_en,
  name_es: s.name_en,
  group_type: s.group === 'internal' ? 'personal' as const : 'social' as const,
  color: s.color,
  icon: s.icon,
  sort_order: s.id,
}));

// Custom sphere config for BalanceFlower (left=internal, right=external)
const TEAM_FLOWER_SPHERES = [
  { sphere: TEAM_SPHERE_OBJECTS[0], baseAngle: 112.5 },
  { sphere: TEAM_SPHERE_OBJECTS[1], baseAngle: 157.5 },
  { sphere: TEAM_SPHERE_OBJECTS[2], baseAngle: 202.5 },
  { sphere: TEAM_SPHERE_OBJECTS[3], baseAngle: 247.5 },
  { sphere: TEAM_SPHERE_OBJECTS[4], baseAngle: 292.5 },
  { sphere: TEAM_SPHERE_OBJECTS[5], baseAngle: 337.5 },
  { sphere: TEAM_SPHERE_OBJECTS[6], baseAngle: 22.5 },
  { sphere: TEAM_SPHERE_OBJECTS[7], baseAngle: 67.5 },
];

const TEAM_SCALE_LABELS = {
  left: { ru: 'Внутренние', en: 'Internal', es: 'Internal' },
  right: { ru: 'Внешние', en: 'External', es: 'External' },
};

// Stable demo indices
const DEMO_INDICES: Record<string, number> = {
  satisfaction: 73, engagement: 100, growth: 65, communication: 78,
  goals: 71, quality: 85, velocity: 22, collaboration: 42,
};

export default function TeamFocus() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const { team, members, sprintTasks } = useTeam();

  const isDemo = !team;

  const sphereIndices = useMemo((): SphereIndex[] => {
    if (isDemo) {
      return TEAM_SPHERES.map(s => ({
        sphereId: s.id,
        sphereKey: s.key as any,
        goalsProgress: DEMO_INDICES[s.key],
        habitsProgress: 0,
        activityScore: 100,
        index: DEMO_INDICES[s.key],
      }));
    }

    const totalTasks = sprintTasks.length;
    const completedTasks = sprintTasks.filter(t => t.status === 'done').length;
    const totalSP = sprintTasks.reduce((s, t) => s + (t.story_points || 0), 0);
    const completedSP = sprintTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.story_points || 0), 0);
    const totalMembers = members.length;

    return TEAM_SPHERES.map(sphere => {
      let index = 0;
      switch (sphere.key) {
        case 'goals': index = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0; break;
        case 'velocity': index = totalSP > 0 ? Math.round((completedSP / totalSP) * 100) : 0; break;
        case 'quality': index = completedTasks > 0 ? Math.min(100, Math.round((completedTasks / Math.max(totalTasks, 1)) * 100)) : 0; break;
        case 'engagement': index = totalMembers > 0 ? 100 : 0; break;
        case 'collaboration': {
          const cross = sprintTasks.filter(t => t.assignee_id && t.assignee_id !== t.creator_id).length;
          index = totalTasks > 0 ? Math.round((cross / totalTasks) * 100) : 0; break;
        }
        case 'communication': index = 72; break;
        case 'growth': index = 58; break;
        case 'satisfaction': index = 67; break;
      }
      return { sphereId: sphere.id, sphereKey: sphere.key as any, goalsProgress: index, habitsProgress: 0, activityScore: index > 0 ? 100 : 0, index: Math.round(index) };
    });
  }, [isDemo, sprintTasks, members]);

  const teamIndex = sphereIndices.length > 0
    ? Math.round(sphereIndices.reduce((s, si) => s + si.index, 0) / sphereIndices.length)
    : 0;

  const teamName = isDemo ? DEMO_DATA.teamName : team!.name;

  const internalSpheres = TEAM_SPHERES.filter(s => s.group === 'internal');
  const externalSpheres = TEAM_SPHERES.filter(s => s.group === 'external');

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{isRu ? 'Фокус команды' : 'Team Focus'}</h1>
              <p className="text-sm text-muted-foreground">{teamName}</p>
            </div>
          </div>
        </div>

        {isDemo && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {isRu ? '📊 Демо-данные команды «Цифровой Прорыв»' : '📊 Demo data for "Digital Breakthrough" team'}
            </p>
          </div>
        )}

        <Card className="p-4">
          <p className="text-sm text-muted-foreground text-center mb-2">
            {isRu ? 'Баланс 8 корпоративных сфер' : 'Balance of 8 corporate spheres'}
          </p>
          <BalanceFlower 
            sphereIndices={sphereIndices} 
            lifeIndex={teamIndex}
            customSpheres={TEAM_FLOWER_SPHERES}
            scaleLabels={TEAM_SCALE_LABELS}
            navigatePrefix="/team/sphere"
          />
        </Card>

        {/* Internal spheres */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {isRu ? '🔒 Внутренние' : '🔒 Internal'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {internalSpheres.map((sphere, i) => {
              const si = sphereIndices.find(s => s.sphereId === sphere.id);
              const indexValue = si?.index || 0;
              return (
                <motion.div key={sphere.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/team/sphere/${sphere.key}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${sphere.color}20` }}>
                        {sphere.icon}
                      </div>
                      <p className="font-medium text-sm truncate flex-1">{isRu ? sphere.name_ru : sphere.name_en}</p>
                      <span className="text-sm font-bold">{Math.round(indexValue / 10)}/10</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: sphere.color }} initial={{ width: 0 }} animate={{ width: `${indexValue}%` }} transition={{ duration: 0.5, delay: i * 0.05 }} />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* External spheres */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            {isRu ? '🌐 Внешние' : '🌐 External'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {externalSpheres.map((sphere, i) => {
              const si = sphereIndices.find(s => s.sphereId === sphere.id);
              const indexValue = si?.index || 0;
              return (
                <motion.div key={sphere.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (i + 4) * 0.05 }}>
                  <Card
                    className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/team/sphere/${sphere.key}`)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{ backgroundColor: `${sphere.color}20` }}>
                        {sphere.icon}
                      </div>
                      <p className="font-medium text-sm truncate flex-1">{isRu ? sphere.name_ru : sphere.name_en}</p>
                      <span className="text-sm font-bold">{Math.round(indexValue / 10)}/10</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: sphere.color }} initial={{ width: 0 }} animate={{ width: `${indexValue}%` }} transition={{ duration: 0.5, delay: (i + 4) * 0.05 }} />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
