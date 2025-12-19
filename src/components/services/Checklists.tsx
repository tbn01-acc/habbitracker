import { useState, useEffect } from 'react';
import { CheckCircle, Plus, X, RotateCcw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

const CHECKLISTS_KEY = 'habitflow_checklists';

export function Checklists() {
  const { t } = useTranslation();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);

  // Load checklists
  useEffect(() => {
    const saved = localStorage.getItem(CHECKLISTS_KEY);
    if (saved) {
      try {
        setChecklists(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse checklists:', e);
      }
    }
  }, []);

  // Save checklists
  useEffect(() => {
    localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(checklists));
  }, [checklists]);

  const createChecklist = () => {
    if (!newChecklistName.trim()) return;

    const newChecklist: Checklist = {
      id: crypto.randomUUID(),
      name: newChecklistName,
      items: [],
    };

    setChecklists([...checklists, newChecklist]);
    setNewChecklistName('');
    setDialogOpen(false);
  };

  const deleteChecklist = (id: string) => {
    setChecklists(checklists.filter(c => c.id !== id));
  };

  const toggleItem = (checklistId: string, itemId: string) => {
    setChecklists(checklists.map(checklist => {
      if (checklist.id !== checklistId) return checklist;
      return {
        ...checklist,
        items: checklist.items.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      };
    }));
  };

  const addItem = (checklistId: string, text: string) => {
    if (!text.trim()) return;
    
    setChecklists(checklists.map(checklist => {
      if (checklist.id !== checklistId) return checklist;
      return {
        ...checklist,
        items: [
          ...checklist.items,
          { id: crypto.randomUUID(), text, checked: false },
        ],
      };
    }));
    setNewItemText('');
  };

  const removeItem = (checklistId: string, itemId: string) => {
    setChecklists(checklists.map(checklist => {
      if (checklist.id !== checklistId) return checklist;
      return {
        ...checklist,
        items: checklist.items.filter(item => item.id !== itemId),
      };
    }));
  };

  const resetChecklist = (checklistId: string) => {
    setChecklists(checklists.map(checklist => {
      if (checklist.id !== checklistId) return checklist;
      return {
        ...checklist,
        items: checklist.items.map(item => ({ ...item, checked: false })),
      };
    }));
  };

  return (
    <div className="space-y-4">
      {checklists.length === 0 ? (
        <Card className="border-service/20">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-service/40" />
            <p className="text-muted-foreground mb-4">{t('noChecklistsYet')}</p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-service hover:bg-service/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('createChecklist')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {checklists.map((checklist) => {
            const completedCount = checklist.items.filter(i => i.checked).length;
            const totalCount = checklist.items.length;
            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

            return (
              <Card key={checklist.id} className="border-service/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-service" />
                      {checklist.name}
                      <span className="text-xs text-muted-foreground">
                        ({completedCount}/{totalCount})
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => resetChecklist(checklist.id)}
                        className="h-8 w-8"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteChecklist(checklist.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 bg-muted rounded-full overflow-hidden mt-2">
                    <div 
                      className="h-full bg-service transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {checklist.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(checklist.id, item.id)}
                      />
                      <span className={item.checked ? 'line-through text-muted-foreground' : ''}>
                        {item.text}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(checklist.id, item.id)}
                        className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}

                  {/* Add Item */}
                  <div className="flex items-center gap-2 pt-2">
                    <Input
                      value={editingChecklist?.id === checklist.id ? newItemText : ''}
                      onChange={(e) => {
                        setEditingChecklist(checklist);
                        setNewItemText(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addItem(checklist.id, newItemText);
                        }
                      }}
                      placeholder={t('addItem')}
                      className="flex-1 h-9"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => addItem(checklist.id, newItemText)}
                      className="h-9 w-9"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Add New Checklist Button */}
          <Button
            variant="outline"
            onClick={() => setDialogOpen(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('createChecklist')}
          </Button>
        </>
      )}

      {/* Create Checklist Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('createChecklist')}</DialogTitle>
          </DialogHeader>
          <Input
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            placeholder={t('checklistName')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                createChecklist();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={createChecklist} className="bg-service hover:bg-service/90 text-white">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
