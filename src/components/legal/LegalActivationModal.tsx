import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LegalDocumentDialog } from '@/components/profile/LegalDocumentDialog';
import type { LegalDocumentType } from '@/hooks/useLegalDocuments';

interface LegalActivationModalProps {
  open: boolean;
  userId: string;
  onAccepted: () => void;
}

interface ConsentItem {
  id: string;
  label: string;
  links?: { text: string; docType: LegalDocumentType }[];
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: 'offer',
    label: 'Я принимаю ',
    links: [
      { text: 'Публичную оферту', docType: 'public_offer' },
      { text: 'Условия использования', docType: 'terms' },
    ],
  },
  {
    id: 'personal_data',
    label: 'Я даю Согласие на обработку моих персональных данных (ФЗ-152). Ознакомиться: ',
    links: [{ text: 'Политика обработки ПД', docType: 'data_processing' }],
  },
  {
    id: 'privacy_policy',
    label: 'Я подтверждаю, что ознакомлен с ',
    links: [{ text: 'Политикой конфиденциальности', docType: 'privacy' }],
  },
  {
    id: 'marketing',
    label: 'Я даю Согласие на получение рассылок и просмотр рекламы (модель Free/Lite). Ознакомиться: ',
    links: [{ text: 'Согласие на рассылки и рекламу', docType: 'marketing_consent' }],
  },
  {
    id: 'cookies',
    label: 'Я согласен на использование Cookies и сбор анонимной статистики. Ознакомиться: ',
    links: [{ text: 'Cookies и статистика', docType: 'cookies_consent' }],
  },
  {
    id: 'geolocation',
    label: 'Я подтверждаю согласие на определение геопозиции для соблюдения ФЗ-152. Ознакомиться: ',
    links: [{ text: 'Согласие на геопозицию', docType: 'geolocation_consent' }],
  },
  {
    id: 'age',
    label: 'Я подтверждаю, что мне исполнилось 18 лет. Ознакомиться: ',
    links: [{ text: 'Подтверждение возраста', docType: 'age_confirmation' }],
  },
];

export function LegalActivationModal({ open, userId, onAccepted }: LegalActivationModalProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>(
    Object.fromEntries(CONSENT_ITEMS.map(c => [c.id, false]))
  );
  const [saving, setSaving] = useState(false);
  const [legalDialogOpen, setLegalDialogOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocumentType>('terms');

  const allAccepted = CONSENT_ITEMS.every(c => consents[c.id]);

  const toggleConsent = (id: string) => {
    setConsents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openDoc = (docType: LegalDocumentType) => {
    setLegalDocType(docType);
    setLegalDialogOpen(true);
  };

  const handleAccept = async () => {
    if (!allAccepted) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ legal_consents_accepted: true })
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('Согласия приняты');
      onAccepted();
    } catch (err) {
      console.error('Error saving consents:', err);
      toast.error('Ошибка сохранения согласий');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent className="max-w-md" onPointerDownOutside={e => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Правовые согласия
            </DialogTitle>
            <DialogDescription>
              Для использования ТопФокус необходимо принять все согласия.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[50vh] pr-3">
            <div className="space-y-4 py-2">
              {CONSENT_ITEMS.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <Checkbox
                    id={item.id}
                    checked={consents[item.id]}
                    onCheckedChange={() => toggleConsent(item.id)}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={item.id}
                    className="text-sm leading-relaxed cursor-pointer text-foreground"
                  >
                    {item.links && item.links.length > 0 ? (
                      <>
                        {item.label}
                        {item.links.map((link, linkIdx) => (
                          <span key={link.docType}>
                            {linkIdx > 0 && ' и '}
                            <button
                              type="button"
                              className="text-primary underline hover:text-primary/80 inline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openDoc(link.docType);
                              }}
                            >
                              {link.text}
                            </button>
                          </span>
                        ))}
                        .
                      </>
                    ) : (
                      item.label
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={!allAccepted || saving}
              onClick={handleAccept}
            >
              {saving ? 'Сохранение...' : 'Принять и продолжить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LegalDocumentDialog
        open={legalDialogOpen}
        onOpenChange={setLegalDialogOpen}
        documentType={legalDocType}
      />
    </>
  );
}

// ─── Consent Revoke Modal ───

interface ConsentRevokeModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onRevoked: () => void;
}

export function ConsentRevokeModal({ open, onClose, userId, onRevoked }: ConsentRevokeModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [processing, setProcessing] = useState(false);

  const handleConfirm = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('handle_consent_revoke', {
        p_id: userId,
      });

      if (error) throw error;

      const result = data as string;
      if (result === 'DELETED') {
        toast.error('Ваш аккаунт удалён в связи с повторным отзывом согласий.');
        await supabase.auth.signOut();
      } else {
        toast.warning('Согласия отозваны. Доступ к приложению ограничен.');
      }
      onRevoked();
    } catch (err) {
      console.error('Error revoking consent:', err);
      toast.error('Ошибка отзыва согласий');
    } finally {
      setProcessing(false);
      setStep(1);
    }
  };

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Отзыв согласий
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {step === 1 && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Я понимаю, что в случае отзыва любого из необходимых моих согласий/разрешений,
              я не смогу использовать программу ТопФокус и все мои данные могут быть
              безвозвратно удалены/утеряны.
            </p>
          )}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-destructive">
                Вы уверены? Это действие необратимо.
              </p>
              <p className="text-xs text-muted-foreground">
                При повторном отзыве ваш аккаунт будет полностью удалён.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            variant="destructive"
            disabled={processing}
            onClick={handleConfirm}
          >
            {processing
              ? 'Обработка...'
              : step === 1
                ? 'Подтвердить отзыв'
                : 'Подтвердить окончательно'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
