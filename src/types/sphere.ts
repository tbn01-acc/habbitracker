// Life Focus Module: Sphere Types and Constants

export type SphereKey = 
  | 'body' 
  | 'mind' 
  | 'spirit' 
  | 'rest'
  | 'work' 
  | 'money' 
  | 'family' 
  | 'social';

export type SphereGroup = 'personal' | 'social' | 'system';

export interface Sphere {
  id: number;
  key: SphereKey;
  name_ru: string;
  name_en: string;
  name_es: string;
  group_type: SphereGroup;
  color: string;
  icon: string;
  sort_order: number;
}

export interface SphereIndex {
  sphereId: number;
  sphereKey: SphereKey;
  goalsProgress: number;  // G component (0-100)
  habitsProgress: number; // H component (0-100)
  activityScore: number;  // A component (0 or 100)
  index: number;          // Final index (0-100)
  // Extended stats for display
  totalGoals?: number;
  totalTasks?: number;
  completedTasks?: number;
  totalHabits?: number;
  totalTimeMinutes?: number;
  totalContacts?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
}

export interface LifeIndexData {
  lifeIndex: number;              // Overall life index (0-100)
  personalEnergy: number;         // Average of personal spheres
  externalSuccess: number;        // Average of social spheres
  mindfulnessLevel: number;       // Spirit habits completion %
  sphereIndices: SphereIndex[];   // Individual sphere indices
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  description?: string | null;
  photo_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSphere {
  id: string;
  contact_id: string;
  sphere_id: number;
  user_id: string;
  created_at: string;
}

export interface ContactGoal {
  id: string;
  contact_id: string;
  goal_id: string;
  user_id: string;
  notes?: string | null;
  created_at: string;
}

// Static sphere data (matches database)
export const SPHERES: Sphere[] = [
  {
    id: 1,
    key: 'body',
    name_ru: 'Тело',
    name_en: 'Body',
    name_es: 'Cuerpo',
    group_type: 'personal',
    color: 'hsl(15, 75%, 65%)',
    icon: '💪',
    sort_order: 1,
  },
  {
    id: 2,
    key: 'mind',
    name_ru: 'Разум',
    name_en: 'Mind',
    name_es: 'Mente',
    group_type: 'personal',
    color: 'hsl(35, 85%, 60%)',
    icon: '🧠',
    sort_order: 2,
  },
  {
    id: 3,
    key: 'spirit',
    name_ru: 'Дух',
    name_en: 'Spirit',
    name_es: 'Espíritu',
    group_type: 'personal',
    color: 'hsl(350, 70%, 75%)',
    icon: '🧘',
    sort_order: 3,
  },
  {
    id: 4,
    key: 'rest',
    name_ru: 'Отдых',
    name_en: 'Rest',
    name_es: 'Descanso',
    group_type: 'personal',
    color: 'hsl(270, 60%, 70%)',
    icon: '😴',
    sort_order: 4,
  },
  {
    id: 5,
    key: 'work',
    name_ru: 'Дело',
    name_en: 'Work',
    name_es: 'Trabajo',
    group_type: 'social',
    color: 'hsl(220, 70%, 50%)',
    icon: '💼',
    sort_order: 5,
  },
  {
    id: 6,
    key: 'money',
    name_ru: 'Деньги',
    name_en: 'Money',
    name_es: 'Dinero',
    group_type: 'social',
    color: 'hsl(200, 20%, 55%)',
    icon: '💰',
    sort_order: 6,
  },
  {
    id: 7,
    key: 'family',
    name_ru: 'Семья',
    name_en: 'Family',
    name_es: 'Familia',
    group_type: 'social',
    color: 'hsl(145, 60%, 45%)',
    icon: '👨‍👩‍👧',
    sort_order: 7,
  },
  {
    id: 8,
    key: 'social',
    name_ru: 'Связи',
    name_en: 'Social',
    name_es: 'Social',
    group_type: 'social',
    color: 'hsl(175, 60%, 45%)',
    icon: '🤝',
    sort_order: 8,
  },
];

// Helper functions
export const getSphereById = (id: number): Sphere | undefined => 
  SPHERES.find(s => s.id === id);

export const getSphereByKey = (key: SphereKey): Sphere | undefined => 
  SPHERES.find(s => s.key === key);

export const getPersonalSpheres = (): Sphere[] => 
  SPHERES.filter(s => s.group_type === 'personal');

export const getSocialSpheres = (): Sphere[] => 
  SPHERES.filter(s => s.group_type === 'social');

export const getActiveSpheres = (): Sphere[] => 
  SPHERES.filter(s => s.group_type !== 'system');

export const getSphereName = (sphere: Sphere, language: 'ru' | 'en' | 'es'): string => {
  switch (language) {
    case 'ru': return sphere.name_ru;
    case 'es': return sphere.name_es;
    default: return sphere.name_en;
  }
};

// Formula weights for index calculation
export const INDEX_WEIGHTS = {
  goals: 0.6,
  habits: 0.3,
  activity: 0.1,
};
