import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Edit2, Save, X } from 'lucide-react';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { LegalDocumentType } from '@/hooks/useLegalDocuments';

interface LegalDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: LegalDocumentType;
}

export function LegalDocumentDialog({ open, onOpenChange, documentType }: LegalDocumentDialogProps) {
  const { t } = useTranslation();
  const { getDocument, updateDocument, isAdmin, loading } = useLegalDocuments();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const document = getDocument(documentType);

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
    }
  }, [document]);

  const handleSave = async () => {
    const success = await updateDocument(documentType, title, content);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (document) {
      setTitle(document.title);
      setContent(document.content);
    }
    setIsEditing(false);
  };

  const titles: Record<LegalDocumentType, string> = {
    terms: t('termsOfService'),
    privacy: t('privacyPolicy'),
    data_processing: t('dataProcessingPolicy'),
    public_offer: t('publicOffer'),
    help_support: t('helpAndSupport'),
  };

  // Simple markdown to HTML renderer with sanitization
  const renderMarkdown = (text: string) => {
    const rawHtml = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\s*-\s+(.*)$/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br/>');
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'ul', 'li', 'br', 'div'],
      ALLOWED_ATTR: ['class'],
    });
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? title : (document?.title || titles[documentType])}</span>
            {isAdmin && !isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" />
                {t('edit')}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isEditing ? (
            <div className="space-y-4 pr-4">
              <div>
                <label className="text-sm font-medium">{t('title')}</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">{t('content')} (Markdown)</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 min-h-[300px] font-mono text-sm"
                />
              </div>
            </div>
          ) : (
            <div 
              className="prose prose-sm dark:prose-invert max-w-none pr-4"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(document?.content || '') }}
            />
          )}
        </ScrollArea>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              {t('cancel')}
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {t('save')}
            </Button>
          </div>
        )}

        {document && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            {t('version')}: {document.version} | {t('updated')}: {new Date(document.updated_at).toLocaleDateString()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
