import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Info, FileText, Shield, Lock, ScrollText, HelpCircle, Settings, ChevronRight, Newspaper } from 'lucide-react';
import { LegalDocumentDialog } from '@/components/profile/LegalDocumentDialog';
import { UserPermissionsDialog } from '@/components/profile/UserPermissionsDialog';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { LegalDocumentType } from '@/hooks/useLegalDocuments';

export default function AboutApp() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const isRussian = language === 'ru';

  const [legalDialogOpen, setLegalDialogOpen] = useState(false);
  const [legalDocType, setLegalDocType] = useState<LegalDocumentType>('terms');
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);

  const openLegalDoc = (type: LegalDocumentType) => {
    setLegalDocType(type);
    setLegalDialogOpen(true);
  };

  const legalItems = [
    { type: 'terms' as LegalDocumentType, icon: FileText, label: t('termsOfService') },
    { type: 'public_offer' as LegalDocumentType, icon: ScrollText, label: isRussian ? 'Публичная оферта' : 'Public Offer' },
    { type: 'privacy' as LegalDocumentType, icon: Shield, label: t('privacyPolicy') },
    { type: 'data_processing' as LegalDocumentType, icon: Lock, label: t('dataProcessingPolicy') },
    { type: 'help_support' as LegalDocumentType, icon: HelpCircle, label: t('helpAndSupport') },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Info className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'О приложении' : 'About App'}
              </h1>
            </div>
          </div>
        </div>

        {/* Legal Documents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardContent className="p-0">
              {/* News Link */}
              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto rounded-none border-b border-border"
                onClick={() => navigate('/news')}
              >
                <div className="flex items-center gap-3">
                  <Newspaper className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">
                    {isRussian ? 'Новости Top-Focus' : 'Top-Focus News'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>

              {legalItems.map((item, idx) => (
                <Button
                  key={item.type}
                  variant="ghost"
                  className={`w-full justify-between p-4 h-auto rounded-none ${
                    idx < legalItems.length - 1 ? 'border-b border-border' : ''
                  }`}
                  onClick={() => openLegalDoc(item.type)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              ))}

              <Button
                variant="ghost"
                className="w-full justify-between p-4 h-auto rounded-none"
                onClick={() => setPermissionsDialogOpen(true)}
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('userPermissions')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* App Version */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Top-Focus v1.0.0
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            © 2024-2025 Top-Focus. {isRussian ? 'Все права защищены.' : 'All rights reserved.'}
          </p>
        </motion.div>
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
