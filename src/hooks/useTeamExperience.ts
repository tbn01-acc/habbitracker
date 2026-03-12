import { useState, useCallback } from 'react';
import { DEMO_DATA, type DemoData } from '@/lib/demo/testData';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export type TeamExperienceMode = 'real' | 'demo' | 'test';

export const useTeamExperience = () => {
  const [mode, setMode] = useState<TeamExperienceMode>('real');
  const [data, setData] = useState<DemoData | null>(null);
  const [switching, setSwitching] = useState(false);

  const transitionTo = useCallback((newMode: TeamExperienceMode, newData: DemoData | null) => {
    setSwitching(true);
    setTimeout(() => {
      setData(newData);
      setMode(newMode);
      setSwitching(false);
    }, 800);
  }, []);

  const startDemo = useCallback(() => {
    transitionTo('demo', JSON.parse(JSON.stringify(DEMO_DATA)));
    toast.success("Демо-режим активен: Посмотрите, как работает идеальная команда!");
  }, [transitionTo]);

  const startTest = useCallback(() => {
    transitionTo('test', JSON.parse(JSON.stringify(DEMO_DATA)));
    toast.success("Песочница готова: Можете редактировать всё!");
  }, [transitionTo]);

  const exitMode = useCallback(() => {
    transitionTo('real', null);
    toast("Вы вернулись в свой рабочий профиль");
  }, [transitionTo]);

  const switchToTest = useCallback(() => {
    if (mode === 'demo' && data) {
      transitionTo('test', JSON.parse(JSON.stringify(data)));
      toast.success("Теперь можете редактировать!");
    }
  }, [mode, data, transitionTo]);

  const resetTest = useCallback(() => {
    if (mode === 'test') {
      transitionTo('test', JSON.parse(JSON.stringify(DEMO_DATA)));
      toast.success("Данные сброшены!");
    }
  }, [mode, transitionTo]);

  const updateTaskStatus = useCallback((taskId: string, newStatus: string) => {
    if (mode === 'demo') {
      toast.info("В Демо-режиме редактирование отключено. Попробуйте Тест-драйв!");
      return;
    }
    if (mode === 'test') {
      setData(prev => {
        if (!prev) return prev;
        const updatedTasks = prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
        const completedSP = updatedTasks.filter(t => t.status === 'done').reduce((acc, t) => acc + t.sp, 0);

        if (newStatus === 'done') {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }

        return { ...prev, tasks: updatedTasks, sprint: { ...prev.sprint, completedSP } };
      });
      toast.success("Задача обновлена локально");
    }
  }, [mode]);

  const awardMember = useCallback((memberId: string) => {
    if (mode !== 'test') return;
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        members: prev.members.map(m => m.id === memberId ? { ...m, xp: m.xp + 100 } : m)
      };
    });
    confetti({ particleCount: 50, colors: ['#FFD700', '#FFA500'] });
    toast.success("Звезда вручена сотруднику!");
  }, [mode]);

  return {
    mode,
    data,
    switching,
    startDemo,
    startTest,
    exitMode,
    switchToTest,
    resetTest,
    updateTaskStatus,
    awardMember,
  };
};
