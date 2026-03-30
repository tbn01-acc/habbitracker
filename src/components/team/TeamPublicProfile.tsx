import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin, Globe, Users, Briefcase, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface TeamProfile {
  logo_url?: string;
  description?: string;
  team_type?: 'office' | 'remote' | 'hybrid';
  vacancies?: string;
  website?: string;
  location?: string;
}

interface Props {
  teamId: string;
  teamName: string;
  profile?: TeamProfile;
  isOwner: boolean;
  onUpdate: (data: TeamProfile) => void;
}

export function TeamPublicProfile({ teamId, teamName, profile, isOwner, onUpdate }: Props) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<TeamProfile>(profile || {});

  const handleSave = () => {
    onUpdate(form);
    setEditOpen(false);
    toast.success(isRu ? 'Профиль обновлён' : 'Profile updated');
  };

  const typeLabels = {
    office: isRu ? 'Офис' : 'Office',
    remote: isRu ? 'Удалёнка' : 'Remote',
    hybrid: isRu ? 'Гибрид' : 'Hybrid',
  };

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {isRu ? 'Публичный профиль' : 'Public Profile'}
            </CardTitle>
            {isOwner && (
              <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                <Edit3 className="w-4 h-4 mr-1" />
                {isRu ? 'Изменить' : 'Edit'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <Users className="w-7 h-7 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{teamName}</h3>
              {profile?.team_type && (
                <Badge variant="outline" className="text-xs mt-1">
                  {typeLabels[profile.team_type]}
                </Badge>
              )}
            </div>
          </div>

          {profile?.description && (
            <p className="text-sm text-muted-foreground">{profile.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {profile?.location && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="w-3 h-3" /> {profile.location}
              </Badge>
            )}
            {profile?.website && (
              <Badge variant="secondary" className="gap-1">
                <Globe className="w-3 h-3" /> {profile.website}
              </Badge>
            )}
          </div>

          {profile?.vacancies && (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-1 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-500">
                  {isRu ? 'Вакансии' : 'Vacancies'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{profile.vacancies}</p>
            </div>
          )}

          {!profile?.description && !profile?.vacancies && (
            <p className="text-xs text-muted-foreground text-center py-2">
              {isOwner
                ? (isRu ? 'Заполните публичный профиль команды' : 'Fill in the team public profile')
                : (isRu ? 'Профиль ещё не заполнен' : 'Profile not filled yet')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Публичный профиль команды' : 'Team Public Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg">
              ⚠️ {isRu
                ? 'Не размещайте информацию, составляющую коммерческую тайну'
                : 'Do not publish commercially sensitive information'}
            </p>
            <div className="space-y-2">
              <Label>{isRu ? 'Описание' : 'Description'}</Label>
              <Textarea
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={isRu ? 'Краткое описание команды...' : 'Brief team description...'}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Тип команды' : 'Team Type'}</Label>
              <Select value={form.team_type || ''} onValueChange={(v) => setForm({ ...form, team_type: v as any })}>
                <SelectTrigger><SelectValue placeholder={isRu ? 'Выберите...' : 'Select...'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">{isRu ? 'Офис' : 'Office'}</SelectItem>
                  <SelectItem value="remote">{isRu ? 'Удалёнка' : 'Remote'}</SelectItem>
                  <SelectItem value="hybrid">{isRu ? 'Гибрид' : 'Hybrid'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Локация' : 'Location'}</Label>
              <Input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Сайт' : 'Website'}</Label>
              <Input value={form.website || ''} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{isRu ? 'Вакансии' : 'Vacancies'}</Label>
              <Textarea
                value={form.vacancies || ''}
                onChange={(e) => setForm({ ...form, vacancies: e.target.value })}
                rows={2}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
