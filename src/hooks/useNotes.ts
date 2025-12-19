import { useState, useEffect, useCallback } from 'react';
import { Note, NOTE_COLORS } from '@/types/note';

const STORAGE_KEY = 'habitflow_notes';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse notes:', e);
      }
    }
    setIsLoading(false);
  }, []);

  const saveNotes = useCallback((newNotes: Note[]) => {
    setNotes(newNotes);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotes));
  }, []);

  const addNote = useCallback((note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    saveNotes([newNote, ...notes]);
    return newNote;
  }, [notes, saveNotes]);

  const updateNote = useCallback((id: string, updates: Partial<Note>) => {
    const newNotes = notes.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    saveNotes(newNotes);
  }, [notes, saveNotes]);

  const deleteNote = useCallback((id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  }, [notes, saveNotes]);

  const togglePin = useCallback((id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      updateNote(id, { isPinned: !note.isPinned });
    }
  }, [notes, updateNote]);

  const getNotesForTask = useCallback((taskId: string) => {
    return notes.filter(n => n.taskId === taskId);
  }, [notes]);

  const sortedNotes = notes.sort((a, b) => {
    // Pinned first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by update date
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return {
    notes: sortedNotes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    getNotesForTask,
  };
}
