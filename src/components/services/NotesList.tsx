import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pin, PinOff, Trash2, Edit3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNotes } from '@/hooks/useNotes';
import { Note, NOTE_COLORS } from '@/types/note';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface NotesListProps {
  taskId?: string; // If provided, only show notes for this task
  showHeader?: boolean;
}

export function NotesList({ taskId, showHeader = true }: NotesListProps) {
  const { t } = useTranslation();
  const { notes, addNote, updateNote, deleteNote, togglePin, getNotesForTask } = useNotes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(NOTE_COLORS[0]);

  const displayNotes = taskId ? getNotesForTask(taskId) : notes;

  const handleSave = () => {
    if (!content.trim()) return;
    
    if (editingNote) {
      updateNote(editingNote.id, { title, content, color: selectedColor });
    } else {
      addNote({
        title,
        content,
        color: selectedColor,
        isPinned: false,
        taskId,
      });
    }
    
    resetForm();
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setSelectedColor(NOTE_COLORS[0]);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setSelectedColor(note.color);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            {t('notes') || 'Заметки'} ({displayNotes.length})
          </h3>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('addNote') || 'Добавить'}
          </Button>
        </div>
      )}

      {displayNotes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t('noNotesYet') || 'Заметок пока нет'}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="mt-2 gap-1"
          >
            <Plus className="w-4 h-4" />
            {t('createNote') || 'Создать заметку'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {displayNotes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="rounded-xl p-4 shadow-card relative group"
                style={{ backgroundColor: `${note.color}15`, borderLeft: `4px solid ${note.color}` }}
              >
                {note.isPinned && (
                  <div 
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: note.color }}
                  >
                    <Pin className="w-3 h-3 text-white" />
                  </div>
                )}
                
                {note.title && (
                  <h4 className="font-semibold text-foreground mb-1 pr-6">{note.title}</h4>
                )}
                
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {note.content}
                </p>
                
                <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => togglePin(note.id)}
                  >
                    {note.isPinned ? (
                      <PinOff className="w-3.5 h-3.5" />
                    ) : (
                      <Pin className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleEdit(note)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? (t('editNote') || 'Редактировать заметку') : (t('newNote') || 'Новая заметка')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder={t('noteTitle') || 'Заголовок (необязательно)'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            
            <Textarea
              placeholder={t('noteContent') || 'Содержание заметки...'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
            
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                {t('color') || 'Цвет'}
              </label>
              <div className="flex flex-wrap gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full transition-transform",
                      selectedColor === color && "ring-2 ring-offset-2 ring-foreground scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                {t('cancel') || 'Отмена'}
              </Button>
              <Button onClick={handleSave} disabled={!content.trim()}>
                {t('save') || 'Сохранить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
