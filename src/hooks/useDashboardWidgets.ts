import { useState, useEffect, useCallback } from 'react';

export type WidgetType = 
  | 'pomodoro' 
  | 'time_stats' 
  | 'quick_services' 
  | 'habit_counters'
  | 'quick_notes';

export interface Widget {
  id: string;
  type: WidgetType;
  enabled: boolean;
  order: number;
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: 'pomodoro', type: 'pomodoro', enabled: true, order: 0 },
  { id: 'time_stats', type: 'time_stats', enabled: true, order: 1 },
  { id: 'quick_services', type: 'quick_services', enabled: true, order: 2 },
  { id: 'habit_counters', type: 'habit_counters', enabled: false, order: 3 },
  { id: 'quick_notes', type: 'quick_notes', enabled: false, order: 4 },
];

const STORAGE_KEY = 'habitflow_dashboard_widgets';

export function useDashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with defaults to include any new widget types
        const merged = DEFAULT_WIDGETS.map(def => {
          const saved = parsed.find((w: Widget) => w.type === def.type);
          return saved ? { ...def, ...saved } : def;
        });
        setWidgets(merged);
      } catch (e) {
        console.error('Failed to parse widgets:', e);
      }
    }
  }, []);

  const saveWidgets = useCallback((newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
  }, []);

  const toggleWidget = useCallback((type: WidgetType) => {
    const newWidgets = widgets.map(w => 
      w.type === type ? { ...w, enabled: !w.enabled } : w
    );
    saveWidgets(newWidgets);
  }, [widgets, saveWidgets]);

  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    const enabled = widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order);
    const [moved] = enabled.splice(fromIndex, 1);
    enabled.splice(toIndex, 0, moved);
    
    const newWidgets = widgets.map(w => {
      const idx = enabled.findIndex(e => e.type === w.type);
      return idx >= 0 ? { ...w, order: idx } : w;
    });
    saveWidgets(newWidgets);
  }, [widgets, saveWidgets]);

  const getEnabledWidgets = useCallback(() => {
    return widgets
      .filter(w => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  const getAllWidgets = useCallback(() => {
    return widgets.sort((a, b) => a.order - b.order);
  }, [widgets]);

  return {
    widgets,
    toggleWidget,
    reorderWidgets,
    getEnabledWidgets,
    getAllWidgets,
  };
}
