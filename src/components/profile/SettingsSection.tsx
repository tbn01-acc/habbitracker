import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Bell, Globe, Info, FileText, Shield, Lock, ChevronRight, HelpCircle, ScrollText, Crown } from 'lucide-react';
import { NotificationSettings } from '@/components/NotificationSettings';
import { LanguageSelector } from '@/components/LanguageSelector';
import { LegalDocumentDialog } from './LegalDocumentDialog';
import { UserPermissionsDialog } from './UserPermissionsDialog';
import { useTranslation } from '@/contexts/LanguageContext';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { LegalDocumentType } from '@/hooks/useLegalDocuments';

export function SettingsSection() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin } = useLegalDocuments();
  const [legalDialogOpen, setLegalDialogOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocumentType>('terms');
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const isRussian = language === 'ru';

  const openLegalDoc = (type: LegalDocumentType) => {
    setLegalDocType(type);
    setLegalDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t('settings')}</h2>
      </div>

      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <Card>
          <CardContent className="p-0">
            {/* Language Selector */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('language')}</span>
              </div>
              <LanguageSelector />
            </div>

            {/* Notification Settings */}
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('notificationSettings')}</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${settingsOpen ? 'rotate-90' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="p-4 border-b border-border bg-muted/30">
                <NotificationSettings />
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      {/* About App Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t('aboutApp')}</h2>
        </div>

        <Card>
          <CardContent className="p-0">
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
              onClick={() => openLegalDoc('terms')}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('termsOfService')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
              onClick={() => openLegalDoc('privacy')}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('privacyPolicy')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
              onClick={() => openLegalDoc('data_processing')}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('dataProcessingPolicy')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
              onClick={() => openLegalDoc('public_offer')}
            >
              <div className="flex items-center gap-3">
                <ScrollText className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('publicOffer')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
              onClick={() => openLegalDoc('help_support')}
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('helpAndSupport')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
              onClick={() => setPermissionsDialogOpen(true)}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium">{t('userPermissions')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>

            {/* Admin Panel Link - Only for admins */}
            {isAdmin && (
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto rounded-none"
                onClick={() => navigate('/admin')}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium">
                    {isRussian ? 'Панель администратора' : 'Admin Panel'}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-500">
                    Admin
                  </Badge>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <LegalDocumentDialog
        open={legalDialogOpen}
        onOpenChange={setLegalDialogOpen}
        documentType={legalDocType}
      />

      <UserPermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
      />
    </div>
  );
}
