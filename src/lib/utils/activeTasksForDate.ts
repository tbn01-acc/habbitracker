/**
 * Returns tasks active on a given date (YYYY-MM-DD).
 * Includes tasks whose dueDate matches the date, OR any recurring task
 * whose recurrence pattern (daily / weekly / monthly) hits the date —
 * even when its base dueDate is in the future or in the past.
 *
 * A task is "active" if it is not completed and not archived.
 */
export interface MaybeRecurringTask {
  id: string;
  name: string;
  icon?: string;
  dueDate: string;
  completed?: boolean;
  archivedAt?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  isMain?: boolean;
}

function diffDays(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00Z').getTime();
  const b = new Date(bIso + 'T00:00:00Z').getTime();
  return Math.round((a - b) / 86_400_000);
}

export function recurrenceHits(task: MaybeRecurringTask, dateIso: string): boolean {
  if (!task.recurrence || task.recurrence === 'none') {
    return task.dueDate === dateIso;
  }
  if (task.dueDate === dateIso) return true;
  const delta = diffDays(dateIso, task.dueDate);
  if (delta === 0) return true;
  switch (task.recurrence) {
    case 'daily':
      return true; // every day is part of the series
    case 'weekly':
      return delta % 7 === 0;
    case 'monthly': {
      const base = new Date(task.dueDate + 'T00:00:00Z');
      const target = new Date(dateIso + 'T00:00:00Z');
      return base.getUTCDate() === target.getUTCDate();
    }
    default:
      return false;
  }
}

export function getActiveTasksForDate<T extends MaybeRecurringTask>(
  tasks: T[],
  dateIso: string,
): T[] {
  return tasks.filter(
    (t) => !t.completed && !t.archivedAt && recurrenceHits(t, dateIso),
  );
}

/** Returns the existing main-task(s) on a given date, excluding `excludeId`. */
export function getOtherMainTasksForDate<T extends MaybeRecurringTask>(
  tasks: T[],
  dateIso: string,
  excludeId?: string,
): T[] {
  return getActiveTasksForDate(tasks, dateIso).filter(
    (t) => t.isMain && t.id !== excludeId,
  );
}