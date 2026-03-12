import { useState } from 'react';
import { Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/contexts/LanguageContext';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTeam: (name: string, description?: string) => void;
  onJoinTeam: (inviteCode: string) => void;
}

export function CreateTeamDialog({ open, onOpenChange, onCreateTeam, onJoinTeam }: CreateTeamDialogProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleSubmit = () => {
    if (mode === 'create' && name.trim()) {
      onCreateTeam(name.trim(), description.trim() || undefined);
      onOpenChange(false);
      setName('');
      setDescription('');
    } else if (mode === 'join' && inviteCode.trim()) {
      onJoinTeam(inviteCode.trim());
      onOpenChange(false);
      setInviteCode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {isRu ? 'Начать работу в команде' : 'Start Team Work'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('create')}
            className="flex-1"
          >
            {isRu ? 'Создать команду' : 'Create Team'}
          </Button>
          <Button
            variant={mode === 'join' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('join')}
            className="flex-1"
          >
            {isRu ? 'Присоединиться' : 'Join Team'}
          </Button>
        </div>

        {mode === 'create' ? (
          <div className="space-y-3">
            <Input
              placeholder={isRu ? 'Название команды' : 'Team name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder={isRu ? 'Описание (необязательно)' : 'Description (optional)'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder={isRu ? 'Код приглашения' : 'Invite code'}
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono text-center text-lg tracking-wider"
              maxLength={8}
            />
            <p className="text-xs text-muted-foreground text-center">
              {isRu ? 'Получите код у владельца команды' : 'Get the code from the team owner'}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={mode === 'create' ? !name.trim() : !inviteCode.trim()}
            className="w-full"
          >
            {mode === 'create'
              ? (isRu ? 'Создать' : 'Create')
              : (isRu ? 'Присоединиться' : 'Join')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
