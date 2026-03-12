import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Copy, Shield, Eye, Crown, Trash2, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTranslation } from '@/contexts/LanguageContext';
import { Team, TeamMember } from '@/hooks/useTeam';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface TeamMembersProps {
  team: Team;
  members: TeamMember[];
  onInviteMember: (userId: string) => void;
}

const ROLE_BADGES: Record<string, { icon: any; color: string; label: { ru: string; en: string } }> = {
  owner: { icon: Crown, color: 'bg-yellow-500/20 text-yellow-500', label: { ru: 'Владелец', en: 'Owner' } },
  admin: { icon: Shield, color: 'bg-blue-500/20 text-blue-500', label: { ru: 'Админ', en: 'Admin' } },
  member: { icon: Users, color: 'bg-green-500/20 text-green-500', label: { ru: 'Участник', en: 'Member' } },
  observer: { icon: Eye, color: 'bg-muted-foreground/20 text-muted-foreground', label: { ru: 'Наблюдатель', en: 'Observer' } },
};

export function TeamMembers({ team, members, onInviteMember }: TeamMembersProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const isOwner = user?.id === team.owner_id;

  const copyInviteCode = () => {
    if (team.invite_code) {
      navigator.clipboard.writeText(team.invite_code);
      toast({ title: isRu ? 'Код скопирован!' : 'Code copied!' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Invite Section */}
      {isOwner && (
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              {isRu ? 'Пригласить участников' : 'Invite Members'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-mono">{team.invite_code}</span>
              </div>
              <Button size="sm" variant="outline" onClick={copyInviteCode}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isRu
                ? `${members.length}/${team.max_members} мест занято`
                : `${members.length}/${team.max_members} seats taken`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {isRu ? 'Состав команды' : 'Team Roster'}
            </span>
            <Badge variant="secondary" className="text-xs">{members.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="space-y-2">
            {members.map((member, i) => {
              const roleInfo = ROLE_BADGES[member.role] || ROLE_BADGES.member;
              const RoleIcon = roleInfo.icon;
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={member.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(member.profile?.display_name || '?')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                      member.presence_status === 'focus' ? 'bg-green-500' :
                      member.presence_status === 'online' ? 'bg-green-400' :
                      member.presence_status === 'away' ? 'bg-yellow-500' : 'bg-muted-foreground/40'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.profile?.display_name || 'User'}</p>
                    <p className="text-[10px] text-muted-foreground">{member.profile?.email || ''}</p>
                  </div>
                  <Badge className={`text-[9px] h-5 gap-0.5 ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {isRu ? roleInfo.label.ru : roleInfo.label.en}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
