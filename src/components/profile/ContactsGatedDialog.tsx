import { ExternalLink, Mail, MessageCircle, Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionContext as useSubscription } from '@/contexts/SubscriptionContext';
import { toast } from 'sonner';

interface ContactsGatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  telegramUsername: string | null;
  email?: string | null;
  displayName: string | null;
}

export function ContactsGatedDialog({
  open,
  onOpenChange,
  telegramUsername,
  email,
  displayName
}: ContactsGatedDialogProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProActive } = useSubscription();

  const handleGetContacts = () => {
    if (!user) {
      toast.error('Войдите в аккаунт', {
        description: 'Авторизуйтесь, чтобы получить контакты',
        action: {
          label: 'Войти',
          onClick: () => navigate('/auth')
        }
      });
      onOpenChange(false);
      return;
    }

    if (!isProActive) {
      toast.error('Требуется PRO подписка', {
        description: 'Повысьте тариф для доступа к контактам пользователей',
        action: {
          label: 'Получить PRO',
          onClick: () => navigate('/upgrade')
        },
        duration: 5000
      });
      onOpenChange(false);
      return;
    }
  };

  // Show contacts if PRO user
  if (user && isProActive) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Контакты {displayName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {telegramUsername && (
              <a
                href={`https://t.me/${telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-[#0088cc]/10 flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-[#0088cc]" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Telegram</p>
                      <p className="text-sm text-muted-foreground">@{telegramUsername}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </a>
            )}

            {email && (
              <a
                href={`mailto:${email}`}
                className="block"
              >
                <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{email}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </a>
            )}

            {!telegramUsername && !email && (
              <p className="text-center text-muted-foreground py-4">
                Пользователь не указал контакты
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show upgrade prompt for non-PRO or non-authenticated users
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            Контакты недоступны
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mx-auto flex items-center justify-center">
            <Crown className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Только для PRO</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {!user 
                ? 'Войдите и оформите PRO подписку для доступа к контактам пользователей'
                : 'Оформите PRO подписку для доступа к контактам пользователей'}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {!user ? (
              <>
                <Button onClick={() => { onOpenChange(false); navigate('/auth'); }}>
                  Войти в аккаунт
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Закрыть
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => { onOpenChange(false); navigate('/upgrade'); }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Получить PRO
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Позже
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}