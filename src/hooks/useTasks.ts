import { useState, useEffect, useCallback } from 'react';
import { Task, TaskCategory, TaskTag, TaskStatus, TaskRecurrence, SubTask, TaskAttachment, DEFAULT_CATEGORIES, DEFAULT_TAGS } from '@/types/task';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { triggerCompletionCelebration } from '@/utils/celebrations';

const STORAGE_KEY = 'habitflow_tasks';
const CATEGORIES_KEY = 'habitflow_task_categories';
const TAGS_KEY = 'habitflow_task_tags';

function getNextDueDate(currentDate: string, recurrence: TaskRecurrence): string {
  const date = new Date(currentDate);
  let nextDate: Date;
  
  switch (recurrence) {
    case 'daily':
      nextDate = addDays(date, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(date, 1);
      break;
    case 'monthly':
      nextDate = addMonths(date, 1);
      break;
    default:
      return currentDate;
  }
  
  return nextDate.toISOString().split('T')[0];
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>(DEFAULT_CATEGORIES);
  const [tags, setTags] = useState<TaskTag[]>(DEFAULT_TAGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    const storedCategories = localStorage.getItem(CATEGORIES_KEY);
    const storedTags = localStorage.getItem(TAGS_KEY);
    
    if (storedTasks) {
      try {
        const parsed = JSON.parse(storedTasks);
        // Migrate old tasks without status/tagIds/recurrence/subtasks/attachments
        const migrated = parsed.map((t: Task) => ({
          ...t,
          status: t.status || (t.completed ? 'done' : 'not_started'),
          tagIds: t.tagIds || [],
          recurrence: t.recurrence || 'none',
          subtasks: t.subtasks || [],
          attachments: t.attachments || [],
        }));
        setTasks(migrated);
      } catch (e) {
        console.error('Failed to parse tasks:', e);
      }
    }
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch (e) {
        console.error('Failed to parse categories:', e);
      }
    }
    if (storedTags) {
      try {
        setTags(JSON.parse(storedTags));
      } catch (e) {
        console.error('Failed to parse tags:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newTasks));
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
  }, []);

  const saveCategories = useCallback((newCategories: TaskCategory[]) => {
    setCategories(newCategories);
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(newCategories));
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
  }, []);

  const saveTags = useCallback((newTags: TaskTag[]) => {
    setTags(newTags);
    localStorage.setItem(TAGS_KEY, JSON.stringify(newTags));
    window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
  }, []);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: task.status === 'done',
    };
    saveTasks([...tasks, newTask]);
    return newTask;
  }, [tasks, saveTasks]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    const newTasks = tasks.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      // Sync completed with status
      if (updates.status) {
        updated.completed = updates.status === 'done';
        updated.completedAt = updates.status === 'done' ? new Date().toISOString() : undefined;
      }
      return updated;
    });
    saveTasks(newTasks);
  }, [tasks, saveTasks]);

  const deleteTask = useCallback((id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
  }, [tasks, saveTasks]);

  const toggleTaskCompletion = useCallback((id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newCompleted = !task.completed;
    
    // Trigger celebration when completing
    if (newCompleted) {
      triggerCompletionCelebration();
    }
    
    if (newCompleted && task.recurrence !== 'none') {
      // For recurring tasks, create a new instance with next due date
      const newDueDate = getNextDueDate(task.dueDate, task.recurrence);
      const newTask: Task = {
        ...task,
        id: crypto.randomUUID(),
        dueDate: newDueDate,
        completed: false,
        status: 'not_started',
        completedAt: undefined,
        reminder: task.reminder ? { ...task.reminder, notifiedAt: undefined } : undefined,
      };
      // Mark current as done and add new recurring instance
      const updatedTasks = tasks.map(t => 
        t.id === id 
          ? { ...t, completed: true, status: 'done' as TaskStatus, completedAt: new Date().toISOString() }
          : t
      );
      saveTasks([...updatedTasks, newTask]);
    } else {
      // Allow both completing and uncompleting tasks
      updateTask(id, { 
        completed: newCompleted,
        status: newCompleted ? 'done' : 'not_started',
        completedAt: newCompleted ? new Date().toISOString() : undefined
      });
    }
  }, [tasks, updateTask, saveTasks]);

  // Toggle subtask completion
  const toggleSubtaskCompletion = useCallback((taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    // Check if all subtasks are now completed
    const allCompleted = updatedSubtasks.every(st => st.completed);
    const wasCompleted = task.completed;
    
    // Trigger celebration when completing last subtask
    if (allCompleted && !wasCompleted) {
      triggerCompletionCelebration();
    }
    
    updateTask(taskId, { 
      subtasks: updatedSubtasks,
      // Auto-update task status based on subtasks
      completed: allCompleted,
      status: allCompleted ? 'done' : (updatedSubtasks.some(st => st.completed) ? 'in_progress' : 'not_started'),
      completedAt: allCompleted ? new Date().toISOString() : undefined
    });
  }, [tasks, updateTask]);

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    updateTask(id, { status });
  }, [updateTask]);

  // Category CRUD
  const addCategory = useCallback((category: Omit<TaskCategory, 'id'>) => {
    const newCategory: TaskCategory = { ...category, id: crypto.randomUUID() };
    saveCategories([...categories, newCategory]);
    return newCategory;
  }, [categories, saveCategories]);

  const updateCategory = useCallback((id: string, updates: Partial<TaskCategory>) => {
    saveCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  }, [categories, saveCategories]);

  const deleteCategory = useCallback((id: string) => {
    saveCategories(categories.filter(c => c.id !== id));
    // Remove category from tasks
    saveTasks(tasks.map(t => t.categoryId === id ? { ...t, categoryId: undefined } : t));
  }, [categories, saveCategories, tasks, saveTasks]);

  // Tag CRUD
  const addTag = useCallback((tag: Omit<TaskTag, 'id'>) => {
    const newTag: TaskTag = { ...tag, id: crypto.randomUUID() };
    saveTags([...tags, newTag]);
    return newTag;
  }, [tags, saveTags]);

  const updateTag = useCallback((id: string, updates: Partial<TaskTag>) => {
    saveTags(tags.map(t => t.id === id ? { ...t, ...updates } : t));
  }, [tags, saveTags]);

  const deleteTag = useCallback((id: string) => {
    saveTags(tags.filter(t => t.id !== id));
    // Remove tag from tasks
    saveTasks(tasks.map(t => ({ ...t, tagIds: t.tagIds.filter(tid => tid !== id) })));
  }, [tags, saveTags, tasks, saveTasks]);

  const getTodayTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate === today);
  }, [tasks]);

  const getTasksForPeriod = useCallback((days: number) => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - days);
    return tasks.filter(t => {
      const taskDate = new Date(t.dueDate);
      return taskDate >= start && taskDate <= now;
    });
  }, [tasks]);

  return {
    tasks,
    categories,
    tags,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    toggleSubtaskCompletion,
    updateTaskStatus,
    getTodayTasks,
    getTasksForPeriod,
    addCategory,
    updateCategory,
    deleteCategory,
    addTag,
    updateTag,
    deleteTag,
  };
}

export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}
