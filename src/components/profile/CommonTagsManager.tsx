import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserTags, UserTag } from '@/hooks/useUserTags';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const TAG_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6b7280', // gray
];

interface TagItemProps {
  tag: UserTag;
  onUpdate: (id: string, name: string, color: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

function TagItem({ tag, onUpdate, onDelete }: TagItemProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(tag.name);
  const [editColor, setEditColor] = useState(tag.color);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const success = await onUpdate(tag.id, editName, editColor);
    if (success) setIsEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete(tag.id);
    setSaving(false);
  };

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder={t('tagNamePlaceholder')}
          className="h-8"
        />
        <div className="flex flex-wrap gap-1.5">
          {TAG_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setEditColor(color)}
              className={cn(
                "w-6 h-6 rounded-full transition-all",
                editColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsEditing(false);
              setEditName(tag.name);
              setEditColor(tag.color);
            }}
            disabled={saving}
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !editName.trim()}
          >
            <Check className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 group">
      <div 
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: tag.color }}
      />
      <span className="flex-1 text-sm text-foreground truncate">{tag.name}</span>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={saving}
          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function CommonTagsManager() {
  const { t } = useTranslation();
  const { tags, loading, addTag, updateTag, deleteTag } = useUserTags();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newTagName.trim()) return;
    setSaving(true);
    const result = await addTag(newTagName, newTagColor);
    if (result) {
      setNewTagName('');
      setNewTagColor(TAG_COLORS[0]);
      setIsAdding(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <p className="text-sm text-muted-foreground mb-4">{t('commonTagsDescription')}</p>
      
      {/* Tags List */}
      <div className="space-y-1 mb-4">
        {tags.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground/70 py-2">{t('noTagsYet')}</p>
        )}
        {tags.map(tag => (
          <TagItem 
            key={tag.id} 
            tag={tag} 
            onUpdate={updateTag}
            onDelete={deleteTag}
          />
        ))}
      </div>

      {/* Add New Tag */}
      {isAdding ? (
        <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-3">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder={t('tagNamePlaceholder')}
            className="h-8"
            autoFocus
          />
          <div className="flex flex-wrap gap-1.5">
            {TAG_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTagColor(color)}
                className={cn(
                  "w-6 h-6 rounded-full transition-all",
                  newTagColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewTagName('');
                setNewTagColor(TAG_COLORS[0]);
              }}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-1" />
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={saving || !newTagName.trim()}
            >
              <Check className="w-4 h-4 mr-1" />
              {t('save')}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('addTag')}
        </Button>
      )}
    </div>
  );
}
