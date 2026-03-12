import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTranslation } from '@/contexts/LanguageContext';
import { TeamMember } from '@/hooks/useTeam';
import { addWeeks, format } from 'date-fns';

interface CreateSprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TeamMember[];
  onCreateSprint: (data: {
    title: string;
    goal?: string;
    start_date: string;
    end_date: string;
    participant_ids: string[];
  }) => void;
}

export function CreateSprintDialog({ open, onOpenChange, members, onCreateSprint }: CreateSprintDialogProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [weeks, setWeeks] = useState('2');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.user_id));

  const startDate = new Date();
  const endDate = addWeeks(startDate, Number(weeks));

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreateSprint({
      title: title.trim(),
      goal: goal.trim() || undefined,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      participant_ids: selectedMembers,
    });
    onOpenChange(false);
    setTitle('');
    setGoal('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            {isRu ? 'Новый спринт' : 'New Sprint'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            placeholder={isRu ? 'Название спринта (напр. «Рывок к MVP»)' : 'Sprint title (e.g. "MVP Sprint")'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder={isRu ? 'Цель спринта (Sprint Goal)' : 'Sprint Goal'}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={2}
          />

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{isRu ? 'Длительность' : 'Duration'}</label>
            <Select value={weeks} onValueChange={setWeeks}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 {isRu ? 'неделя' : 'week'}</SelectItem>
                <SelectItem value="2">2 {isRu ? 'недели' : 'weeks'} ★</SelectItem>
                <SelectItem value="3">3 {isRu ? 'недели' : 'weeks'}</SelectItem>
                <SelectItem value="4">4 {isRu ? 'недели' : 'weeks'}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1">
              {format(startDate, 'dd.MM')} — {format(endDate, 'dd.MM.yyyy')}
            </p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">{isRu ? 'Участники' : 'Participants'}</label>
            <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.user_id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer"
                  onClick={() => toggleMember(m.user_id)}
                >
                  <Checkbox checked={selectedMembers.includes(m.user_id)} />
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={m.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">{(m.profile?.display_name || '?')[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs">{m.profile?.display_name || 'User'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={!title.trim()} className="w-full">
            <Zap className="w-4 h-4 mr-2" />
            {isRu ? 'Запустить спринт' : 'Start Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
