export type TaskStatus = 'not_started' | 'in_progress' | 'done';
export type TaskRecurrence = 'none' | 'daily' | 'weekly' | 'monthly';

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
}

export interface TaskTag {
  id: string;
  name: string;
  color: string;
}

export interface TaskReminder {
  enabled: boolean;
  time?: string; // HH:mm format
  notifiedAt?: string; // ISO date when last notified
}

export interface SubTask {
  id: string;
  name: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  type: 'file' | 'note';
  content: string; // For notes: text content, for files: base64 or URL
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  icon: string;
  color: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  status: TaskStatus;
  categoryId?: string;
  tagIds: string[];
  recurrence: TaskRecurrence;
  reminder?: TaskReminder;
  subtasks: SubTask[];
  attachments: TaskAttachment[];
  notes?: string;
  // Postpone feature
  postponeCount?: number;
  postponedUntil?: string;
  archivedAt?: string;
  // Goal and sphere linking
  goalId?: string;
  sphereId?: number;
}

export const TASK_ICONS = [
  '📝', '✅', '📋', '🎯', '💼', '📞', '✉️', '🛒',
  '🏠', '🚗', '💰', '📅', '🔔', '⭐', '🔧', '📦'
];

export const TASK_COLORS = [
  'hsl(200, 80%, 50%)', // blue (primary for tasks)
  'hsl(168, 80%, 40%)', // teal
  'hsl(35, 95%, 55%)',  // orange
  'hsl(262, 80%, 55%)', // purple
  'hsl(340, 80%, 55%)', // pink
  'hsl(145, 70%, 45%)', // green
  'hsl(45, 90%, 50%)',  // yellow
  'hsl(0, 70%, 55%)',   // red
];

export const DEFAULT_CATEGORIES: TaskCategory[] = [
  { id: 'work', name: 'Работа', color: 'hsl(200, 80%, 50%)' },
  { id: 'personal', name: 'Личное', color: 'hsl(262, 80%, 55%)' },
  { id: 'home', name: 'Дом', color: 'hsl(35, 95%, 55%)' },
  { id: 'health', name: 'Здоровье', color: 'hsl(145, 70%, 45%)' },
];

export const DEFAULT_TAGS: TaskTag[] = [
  { id: 'urgent', name: 'Срочно', color: 'hsl(0, 70%, 55%)' },
  { id: 'important', name: 'Важно', color: 'hsl(45, 90%, 50%)' },
  { id: 'later', name: 'Потом', color: 'hsl(200, 30%, 60%)' },
];
