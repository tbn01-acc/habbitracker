import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type IdeaActionType = 'goal' | 'task' | 'habit' | 'finance' | 'contact' | 'note';

export interface IdeaAction {
  type: IdeaActionType;
  title: string;
  description?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  amount?: string;
  tx_type?: 'income' | 'expense';
}

export interface IdeaAnalysis {
  realism_score: number; // 0-100
  summary?: string;
  pros?: string[];
  risks?: string[];
  first_step?: string;
  criteria?: string[];
  suggested_actions: IdeaAction[];
  created_at?: string;
}

export interface IdeaReminderSettings {
  reminder_enabled: boolean;
  reminder_interval_days: number;
  reminder_time: string;
  reminder_channel: string;
  reminder_note: string | null;
}

export interface Idea extends IdeaReminderSettings {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  raw_text: string;
  status: string;
  analysis_result: IdeaAnalysis | null;
  analysis_history: IdeaAnalysis[];
  applied_actions: string[];
  approved_at: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

export const IDEA_CRITERIA = [
  'Ресурсы и бюджет',
  'Время и сроки',
  'Навыки и опыт',
  'Рынок и спрос',
  'Риски и зависимости',
  'Мотивация и энергия',
] as const;

function normalize(row: any): Idea {
  return {
    ...row,
    analysis_history: Array.isArray(row.analysis_history) ? row.analysis_history : [],
    applied_actions: Array.isArray(row.applied_actions) ? row.applied_actions : [],
  } as Idea;
}

export function useIdeas() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const fetchIdeas = useCallback(async () => {
    if (!user) {
      setIdeas([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading ideas:', error);
    } else {
      setIdeas((data || []).map(normalize));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const patchLocal = (id: string, patch: Partial<Idea>) =>
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const createIdea = useCallback(
    async (title: string, rawText: string): Promise<Idea | null> => {
      if (!user) {
        toast.error('Войдите, чтобы сохранять идеи');
        return null;
      }
      const { data, error } = await supabase
        .from('ideas')
        .insert({ user_id: user.id, title, raw_text: rawText, description: rawText })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating idea:', error);
        toast.error('Не удалось сохранить идею');
        return null;
      }
      const idea = normalize(data);
      setIdeas((prev) => [idea, ...prev]);
      toast.success('Идея сохранена');
      return idea;
    },
    [user]
  );

  const updateIdea = useCallback(async (id: string, patch: Partial<Idea>) => {
    const { error } = await supabase.from('ideas').update(patch as any).eq('id', id);
    if (error) {
      console.error('Error updating idea:', error);
      toast.error('Не удалось обновить идею');
      return false;
    }
    patchLocal(id, patch);
    return true;
  }, []);

  const editIdea = useCallback(
    async (id: string, title: string, rawText: string, status?: string) => {
      const ok = await updateIdea(id, {
        title,
        raw_text: rawText,
        description: rawText,
        ...(status ? { status } : {}),
      } as Partial<Idea>);
      if (ok) toast.success('Идея обновлена');
      return ok;
    },
    [updateIdea]
  );

  const saveReminderSettings = useCallback(
    async (id: string, settings: IdeaReminderSettings) => {
      const ok = await updateIdea(id, settings as Partial<Idea>);
      if (!ok) return false;
      if (settings.reminder_enabled) {
        const { error } = await supabase.rpc('schedule_idea_followup', {
          p_idea_id: id,
          p_days_from_now: settings.reminder_interval_days,
          p_message: settings.reminder_note || undefined,
        });
        if (error) {
          toast.error('Не удалось запланировать напоминание');
          return false;
        }
        toast.success(`Напомним через ${settings.reminder_interval_days} дн.`);
      } else {
        toast.success('Напоминания выключены');
      }
      return true;
    },
    [updateIdea]
  );

  const deleteIdea = useCallback(async (id: string) => {
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (error) {
      toast.error('Не удалось удалить идею');
      return;
    }
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    toast.success('Идея удалена');
  }, []);

  const analyzeIdea = useCallback(
    async (idea: Idea, criteria?: string[]): Promise<IdeaAnalysis | null> => {
      setAnalyzingId(idea.id);
      try {
        const chosen = criteria?.length ? criteria : [...IDEA_CRITERIA];
        const prompt = `Ты — коуч по продуктивности. Оцени идею пользователя и разложи её на конкретные шаги.
Идея: "${idea.title}"
Описание: "${idea.raw_text}"
Оценивай строго по критериям: ${chosen.join(', ')}. В плюсах и рисках явно указывай, к какому критерию относится пункт (формат "Критерий: пояснение").

Ответь СТРОГО валидным JSON без markdown:
{
  "realism_score": число 0-100 (реалистичность идеи),
  "summary": "краткая оценка на русском, 1-2 предложения",
  "pros": ["Критерий: сильная сторона", "..."],
  "risks": ["Критерий: риск", "..."],
  "first_step": "первый конкретный шаг",
  "suggested_actions": [
    {"type": "goal|task|habit|finance|contact", "title": "название", "description": "детали", "priority": "low|medium|high"}
  ]
}
Сделай 3-6 действий: минимум одна цель, несколько задач и при уместности привычка.`;

        const { data, error } = await supabase.functions.invoke('ai-proxy', {
          body: {
            provider: 'groq',
            model: 'llama-3.3-70b-versatile',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
          },
        });

        if (error) throw error;

        const content: string = data?.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('AI response parse error');
        const analysis = JSON.parse(jsonMatch[0]) as IdeaAnalysis;
        analysis.suggested_actions = (analysis.suggested_actions || []).filter((a) => a?.type && a?.title);
        analysis.criteria = chosen;
        analysis.created_at = new Date().toISOString();

        const history = [...(idea.analysis_history || [])];
        if (idea.analysis_result) history.unshift(idea.analysis_result);

        const { error: updErr } = await supabase
          .from('ideas')
          .update({
            analysis_result: analysis as any,
            analysis_history: history.slice(0, 10) as any,
            status: idea.status === 'approved' ? idea.status : 'analyzed',
          })
          .eq('id', idea.id);
        if (updErr) throw updErr;

        patchLocal(idea.id, {
          analysis_result: analysis,
          analysis_history: history.slice(0, 10),
          status: idea.status === 'approved' ? idea.status : 'analyzed',
        });
        toast.success('Идея проанализирована');
        return analysis;
      } catch (err) {
        console.error('Error analyzing idea:', err);
        toast.error('Не удалось проанализировать идею');
        return null;
      } finally {
        setAnalyzingId(null);
      }
    },
    []
  );

  const restoreAnalysis = useCallback(
    async (idea: Idea, index: number) => {
      const target = idea.analysis_history?.[index];
      if (!target) return false;
      const history = [...idea.analysis_history];
      history.splice(index, 1);
      if (idea.analysis_result) history.unshift(idea.analysis_result);
      const ok = await updateIdea(idea.id, {
        analysis_result: target,
        analysis_history: history,
      } as Partial<Idea>);
      if (ok) toast.success('Вариант оценки восстановлен');
      return ok;
    },
    [updateIdea]
  );

  const applyIdea = useCallback(
    async (ideaId: string, actions: IdeaAction[], keys: string[] = []): Promise<boolean> => {
      if (!actions.length) {
        toast.error('Выберите хотя бы один пункт');
        return false;
      }
      const { error } = await supabase.rpc('apply_idea_flow_custom', {
        p_idea_id: ideaId,
        p_actions: actions as any,
      });
      if (error) {
        console.error('Error applying idea:', error);
        toast.error('Не удалось применить идею');
        return false;
      }

      setIdeas((prev) => {
        const next = prev.map((i) => {
          if (i.id !== ideaId) return i;
          const applied = Array.from(new Set([...(i.applied_actions || []), ...keys]));
          const total = i.analysis_result?.suggested_actions?.length || 0;
          const status = total > 0 && applied.length >= total ? 'completed' : 'in_progress';
          return { ...i, applied_actions: applied, status, applied_at: new Date().toISOString() };
        });
        const updated = next.find((i) => i.id === ideaId);
        if (updated) {
          supabase
            .from('ideas')
            .update({ applied_actions: updated.applied_actions as any, status: updated.status })
            .eq('id', ideaId)
            .then(({ error: e }) => e && console.error(e));
        }
        return next;
      });

      window.dispatchEvent(new Event('habitflow-data-changed'));
      toast.success('Идея превращена в план');
      return true;
    },
    []
  );

  const scheduleFollowup = useCallback(async (ideaId: string, days: number, message?: string) => {
    const { error } = await supabase.rpc('schedule_idea_followup', {
      p_idea_id: ideaId,
      p_days_from_now: days,
      p_message: message,
    });
    if (error) {
      toast.error('Не удалось запланировать напоминание');
      return false;
    }
    toast.success(`Напомним через ${days} дн.`);
    return true;
  }, []);

  return {
    ideas,
    loading,
    analyzingId,
    createIdea,
    editIdea,
    updateIdea,
    deleteIdea,
    analyzeIdea,
    restoreAnalysis,
    applyIdea,
    saveReminderSettings,
    scheduleFollowup,
    refetch: fetchIdeas,
  };
}
