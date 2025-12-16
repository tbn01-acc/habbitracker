import { useState } from 'react';
import { Plus, FileText, Trash2, StickyNote, X } from 'lucide-react';
import { TaskAttachment } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TaskAttachmentsProps {
  attachments: TaskAttachment[];
  notes?: string;
  onChange: (attachments: TaskAttachment[], notes?: string) => void;
}

export function TaskAttachments({ attachments, notes, onChange }: TaskAttachmentsProps) {
  const { t } = useTranslation();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [viewingAttachment, setViewingAttachment] = useState<TaskAttachment | null>(null);
  const [taskNotes, setTaskNotes] = useState(notes || '');

  const addNote = () => {
    if (!newNoteName.trim() || !newNoteContent.trim()) return;
    const newAttachment: TaskAttachment = {
      id: crypto.randomUUID(),
      name: newNoteName.trim(),
      type: 'note',
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString(),
    };
    onChange([...attachments, newAttachment], taskNotes);
    setNewNoteName('');
    setNewNoteContent('');
    setIsAddingNote(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const newAttachment: TaskAttachment = {
        id: crypto.randomUUID(),
        name: file.name,
        type: 'file',
        content: e.target?.result as string,
        createdAt: new Date().toISOString(),
      };
      onChange([...attachments, newAttachment], taskNotes);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const deleteAttachment = (id: string) => {
    onChange(attachments.filter(a => a.id !== id), taskNotes);
  };

  const updateTaskNotes = (newNotes: string) => {
    setTaskNotes(newNotes);
    onChange(attachments, newNotes);
  };

  return (
    <div className="space-y-3">
      {/* Quick notes */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          <StickyNote className="w-4 h-4 inline mr-1" />
          {t('taskNotes')}
        </label>
        <Textarea
          value={taskNotes}
          onChange={(e) => updateTaskNotes(e.target.value)}
          placeholder={t('notesPlaceholder')}
          className="min-h-[60px] text-sm bg-background border-border"
        />
      </div>

      {/* Attachments list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            {t('attachments')}
          </label>
          {attachments.map((attachment) => (
            <div 
              key={attachment.id}
              className="flex items-center gap-2 bg-muted/50 rounded-lg p-2"
            >
              {attachment.type === 'note' ? (
                <StickyNote className="w-4 h-4 text-amber-500" />
              ) : (
                <FileText className="w-4 h-4 text-task" />
              )}
              <button
                type="button"
                onClick={() => setViewingAttachment(attachment)}
                className="flex-1 text-sm text-left hover:text-primary transition-colors truncate"
              >
                {attachment.name}
              </button>
              <button
                type="button"
                onClick={() => deleteAttachment(attachment.id)}
                className="p-1 hover:bg-destructive/10 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNote(true)}
          className="flex-1"
        >
          <StickyNote className="w-4 h-4 mr-1" />
          {t('addNote')}
        </Button>
        <label className="flex-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <span>
              <FileText className="w-4 h-4 mr-1" />
              {t('addFile')}
            </span>
          </Button>
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
        </label>
      </div>

      {/* Add note dialog */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('addNote')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newNoteName}
              onChange={(e) => setNewNoteName(e.target.value)}
              placeholder={t('noteTitle')}
            />
            <Textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder={t('noteContent')}
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button onClick={addNote} className="flex-1">
                {t('save')}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                {t('cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View attachment dialog */}
      <Dialog open={!!viewingAttachment} onOpenChange={() => setViewingAttachment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingAttachment?.type === 'note' ? (
                <StickyNote className="w-5 h-5 text-amber-500" />
              ) : (
                <FileText className="w-5 h-5 text-task" />
              )}
              {viewingAttachment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {viewingAttachment?.type === 'note' ? (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {viewingAttachment.content}
              </p>
            ) : viewingAttachment?.content.startsWith('data:image') ? (
              <img 
                src={viewingAttachment.content} 
                alt={viewingAttachment.name}
                className="max-w-full rounded-lg"
              />
            ) : (
              <div className="text-center py-4">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <a 
                  href={viewingAttachment?.content}
                  download={viewingAttachment?.name}
                  className="text-primary hover:underline"
                >
                  {t('downloadFile')}
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
