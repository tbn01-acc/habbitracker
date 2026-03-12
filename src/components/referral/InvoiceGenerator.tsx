import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { generateInvoicePDF, generateActPDF } from '@/utils/pdfGenerator';
import { validateInn } from '@/utils/validateInn';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function InvoiceGenerator() {
  const { language } = useTranslation();
  const { profile } = useAuth();
  const { wallet } = useReferralProgram();
  const isRu = language === 'ru';

  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientInn, setClientInn] = useState('');
  const [clientKpp, setClientKpp] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientRepresentative, setClientRepresentative] = useState('');
  const [innError, setInnError] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const balance = wallet?.balance_rub || 0;

  const handleInnChange = (value: string) => {
    setClientInn(value);
    if (value.length >= 10) {
      const result = validateInn(value);
      setInnError(result.isValid ? null : result.error || null);
    } else {
      setInnError(null);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!clientName || !clientInn) {
      toast.error(isRu ? 'Заполните наименование и ИНН' : 'Fill in company name and INN');
      return;
    }
    const validation = validateInn(clientInn);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    setLoading(true);
    try {
      const invoiceNumber = `TF-${Date.now().toString().slice(-6)}`;
      await generateInvoicePDF({
        number: invoiceNumber,
        date: new Date().toISOString(),
        clientName,
        clientInn,
        clientKpp: clientKpp || undefined,
        clientAddress: clientAddress || undefined,
        items: [{
          name: isRu
            ? `Вознаграждение за услуги по привлечению клиентов по ПП 2.0 за период ${format(new Date(periodStart), 'dd.MM.yyyy')} - ${format(new Date(periodEnd), 'dd.MM.yyyy')}`
            : `Affiliate commission for period ${periodStart} - ${periodEnd}`,
          quantity: 1,
          price: balance,
        }],
      });
      toast.success(isRu ? 'Счёт сформирован!' : 'Invoice generated!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error(isRu ? 'Ошибка генерации PDF' : 'PDF generation error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAct = async () => {
    if (!clientName || !clientInn) {
      toast.error(isRu ? 'Заполните наименование и ИНН' : 'Fill in company name and INN');
      return;
    }

    setLoading(true);
    try {
      const actNumber = `TF-A-${Date.now().toString().slice(-6)}`;
      await generateActPDF({
        number: actNumber,
        date: new Date().toISOString(),
        periodStart,
        periodEnd,
        clientName,
        clientInn,
        clientRepresentative: clientRepresentative || undefined,
        serviceName: 'Рекламно-информационные услуги по привлечению новых пользователей сервиса ТопФокус',
        totalAmount: balance,
      });
      toast.success(isRu ? 'Акт сформирован!' : 'Act generated!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error(isRu ? 'Ошибка генерации PDF' : 'PDF generation error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            {isRu ? 'Генерация документов для ЮЛ/ИП' : 'Document generation for legal entities'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* NDFL Warning for individuals */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {isRu
                ? 'Согласно п. 4.2 Правил, для физлиц ООО «АЦМ» удерживает НДФЛ 13/15%, так как выступает налоговым агентом.'
                : 'According to section 4.2 of the Rules, for individuals LLC "ACM" withholds personal income tax (13/15%) as tax agent.'}
            </p>
          </div>

          {/* Client info form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Наименование организации' : 'Company name'} *</Label>
              <Input
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder={isRu ? 'ООО "Название"' : 'LLC "Name"'}
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ИНН *</Label>
              <Input
                value={clientInn}
                onChange={e => handleInnChange(e.target.value)}
                placeholder="9713007100"
                maxLength={12}
                className={`text-sm ${innError ? 'border-destructive' : ''}`}
              />
              {innError && <p className="text-xs text-destructive">{innError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">КПП</Label>
              <Input value={clientKpp} onChange={e => setClientKpp(e.target.value)} placeholder="771301001" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Представитель' : 'Representative'}</Label>
              <Input value={clientRepresentative} onChange={e => setClientRepresentative(e.target.value)} placeholder={isRu ? 'Иванов И.И.' : 'Name'} className="text-sm" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs">{isRu ? 'Адрес' : 'Address'}</Label>
              <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="text-sm" />
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Период с' : 'Period from'}</Label>
              <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Период по' : 'Period to'}</Label>
              <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="text-sm" />
            </div>
          </div>

          {/* Amount */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{isRu ? 'Сумма к выводу' : 'Amount'}</span>
              <span className="text-lg font-bold text-foreground">{balance.toLocaleString()} ₽</span>
            </div>
          </div>

          {/* Generate buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleGenerateInvoice}
              disabled={loading || !clientName || !clientInn}
              variant="outline"
              className="gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {isRu ? 'Скачать счёт' : 'Download invoice'}
            </Button>
            <Button
              onClick={handleGenerateAct}
              disabled={loading || !clientName || !clientInn}
              variant="outline"
              className="gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {isRu ? 'Скачать акт' : 'Download act'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
