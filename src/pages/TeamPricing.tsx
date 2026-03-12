import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Flame, BarChart3, FileCheck, Users, ArrowRight, ArrowLeft,
  Building2, CreditCard, Download, Check, Shield,
  ChevronRight, Quote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { validateInn } from '@/utils/validateInn';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PRICE_PER_SEAT = 990;

const PERIODS = [
  { key: '1', months: 1, label: '1 мес.', discount: 0 },
  { key: '3', months: 3, label: '3 мес.', discount: 0.10 },
  { key: '6', months: 6, label: '6 мес.', discount: 0.15 },
  { key: '12', months: 12, label: '12 мес.', discount: 0.25 },
  { key: '24', months: 24, label: '24 мес.', discount: 0.35 },
  { key: 'forever', months: 120, label: 'Навсегда', discount: 0.50 },
] as const;

type PeriodKey = typeof PERIODS[number]['key'];

const benefits = [
  { icon: Eye, title: 'Прозрачность', desc: 'Реальный прогресс по Story Points.' },
  { icon: Flame, title: 'Мотивация', desc: 'XP и ранги снижают выгорание.' },
  { icon: BarChart3, title: 'Аналитика', desc: 'Burndown-чарты и ретроспективы.' },
  { icon: FileCheck, title: 'Документы', desc: 'Счета и акты в один клик.' },
];

export default function TeamPricing() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [seats, setSeats] = useState(5);
  const [periodIndex, setPeriodIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [teamName, setTeamName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [inn, setInn] = useState('');
  const [kpp, setKpp] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [innError, setInnError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedPeriod = PERIODS[periodIndex];
  const discount = selectedPeriod.discount;
  const months = selectedPeriod.months;
  const periodLabel = selectedPeriod.label;
  const pricePerSeat = Math.round(PRICE_PER_SEAT * (1 - discount));
  const totalAmount = pricePerSeat * seats * months;

  const handleInnChange = (value: string) => {
    setInn(value);
    if (value.length >= 10) {
      const result = validateInn(value);
      setInnError(result.isValid ? null : result.error || null);
    } else {
      setInnError(null);
    }
  };

  const canProceedStep1 = teamName.trim() && adminName.trim();
  const canProceedStep2 = inn.trim().length >= 10 && !innError && orgName.trim();
  const canGenerateInvoice = canProceedStep1 && canProceedStep2;

  const handleGenerateInvoice = useCallback(async () => {
    if (!user) {
      toast.error(isRu ? 'Войдите в аккаунт для оформления' : 'Please sign in first');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const invoiceNumber = `TF-TEAM-${Date.now().toString().slice(-6)}`;
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);

      const { error: dbError } = await supabase.from('team_subscriptions' as any).insert({
        user_id: user.id,
        team_name: teamName,
        admin_name: adminName,
        inn,
        kpp: kpp || null,
        org_name: orgName,
        org_address: orgAddress || null,
        seats_count: seats,
        billing_period: selectedPeriod.key,
        price_per_seat: pricePerSeat,
        total_amount: totalAmount,
        end_date: endDate.toISOString(),
        invoice_number: invoiceNumber,
        status: 'pending_payment',
      });

      if (dbError) throw dbError;

      await generateInvoicePDF({
        number: invoiceNumber,
        date: new Date().toISOString(),
        clientName: orgName,
        clientInn: inn,
        clientKpp: kpp || undefined,
        clientAddress: orgAddress || undefined,
        items: [{
          name: `Подписка «Команда» (${seats} мест × ${pricePerSeat} ₽/мес × ${months} мес., период: ${periodLabel}${discount > 0 ? `, скидка ${discount * 100}%` : ''})`,
          quantity: 1,
          price: totalAmount,
        }],
      });

      toast.success(isRu ? 'Счёт сформирован и скачан!' : 'Invoice generated!');
    } catch (err) {
      console.error(err);
      toast.error(isRu ? 'Ошибка при создании счёта' : 'Error generating invoice');
    } finally {
      setLoading(false);
    }
  }, [user, teamName, adminName, inn, kpp, orgName, orgAddress, seats, selectedPeriod, pricePerSeat, totalAmount, months, discount, periodLabel, isRu, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <div className="px-4 pt-4 max-w-lg mx-auto space-y-4">
        {/* Page header */}
        <PageHeader
          showTitle
          icon={<Users className="w-5 h-5 text-primary" />}
          iconBgClass="bg-primary/15"
          title="Команда"
          subtitle="Подписка для бизнеса по счёту"
        />

        {/* Trial badge */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
          <Shield className="w-4 h-4 text-success shrink-0" />
          <span className="text-sm text-foreground">7 дней бесплатно для всей команды</span>
        </div>

        {/* Benefits — compact 2x2 grid */}
        <div className="grid grid-cols-2 gap-2">
          {benefits.map((b) => (
            <Card key={b.title} className="border-border/50 bg-card">
              <CardContent className="p-3 space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <b.icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">{b.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Social proof */}
        <div className="p-3 rounded-xl bg-muted/30 border border-border/30 space-y-2">
          <div className="flex items-start gap-2">
            <Quote className="w-4 h-4 text-primary/50 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80 italic leading-relaxed">
              «ТопФокус заменил нам три разрозненных сервиса и сплотил команду вокруг общей цели.»
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground text-right">— Руководитель IT-отдела</p>
        </div>

        {/* Configurator */}
        <Card className="border-border/50 bg-card overflow-hidden">
          <CardContent className="p-4 space-y-5">
            {/* Seats slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  Участники
                </Label>
                <Badge variant="outline" className="text-base font-bold px-3 py-0.5 text-foreground">{seats}</Badge>
              </div>
              <Slider
                value={[seats]}
                onValueChange={v => setSeats(v[0])}
                min={3}
                max={100}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>3</span><span>25</span><span>50</span><span>100</span>
              </div>
            </div>

            {/* Period slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Период</Label>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 text-foreground">{periodLabel}</Badge>
                  {discount > 0 && (
                    <Badge className="bg-success text-success-foreground text-[10px] px-1.5">
                      -{Math.round(discount * 100)}%
                    </Badge>
                  )}
                </div>
              </div>
              <Slider
                value={[periodIndex]}
                onValueChange={v => setPeriodIndex(v[0])}
                min={0}
                max={PERIODS.length - 1}
                step={1}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                {PERIODS.map(p => (
                  <span key={p.key} className="text-center">{p.label}</span>
                ))}
              </div>
            </div>

            {/* Price summary */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{pricePerSeat.toLocaleString('ru-RU')} ₽ × {seats} мест{selectedPeriod.key !== 'forever' ? ` × ${months} мес.` : ' (навсегда)'}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-success text-xs">
                  <span>Скидка {discount * 100}%</span>
                  <span>-{(PRICE_PER_SEAT * seats * months * discount).toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              <div className="border-t border-border/30 pt-2 mt-1 flex justify-between items-baseline">
                <span className="font-semibold text-foreground text-sm">Итого</span>
                <span className="text-xl font-bold text-primary">
                  {totalAmount.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>

            {/* CTA / Stepper */}
            {step === 0 && (
              <Button
                className="w-full bg-primary text-primary-foreground gap-2 rounded-lg h-11 text-sm hover:bg-primary/90"
                onClick={() => setStep(1)}
              >
                Оформить подписку <ChevronRight className="w-4 h-4" />
              </Button>
            )}

            <AnimatePresence mode="wait">
              {step >= 1 && (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  {/* Step indicators */}
                  <div className="flex items-center gap-2 justify-center">
                    {[1, 2, 3].map(s => (
                      <div key={s} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                          step >= s
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-6 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                      </div>
                    ))}
                  </div>

                  {/* Step 1: Team data */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                        <Users className="w-4 h-4 text-primary" />
                        Данные команды
                      </h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-foreground">Компания / команда *</Label>
                          <Input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder='ООО «Компания»' className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-foreground">Администратор *</Label>
                          <Input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Иванов Иван Иванович" className="h-9 text-sm" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setStep(0)}>Назад</Button>
                        <Button
                          size="sm"
                          disabled={!canProceedStep1}
                          onClick={() => setStep(2)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                        >
                          Далее <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Requisites */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        Реквизиты
                      </h3>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-foreground">ИНН *</Label>
                            <Input
                              value={inn}
                              onChange={e => handleInnChange(e.target.value)}
                              placeholder="9713007100"
                              maxLength={12}
                              className={`h-9 text-sm ${innError ? 'border-destructive' : ''}`}
                            />
                            {innError && <p className="text-[10px] text-destructive">{innError}</p>}
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-foreground">КПП</Label>
                            <Input value={kpp} onChange={e => setKpp(e.target.value)} placeholder="771301001" className="h-9 text-sm" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-foreground">Организация *</Label>
                          <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder='ООО «Название»' className="h-9 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-foreground">Юр. адрес</Label>
                          <Input value={orgAddress} onChange={e => setOrgAddress(e.target.value)} placeholder="г. Москва, ул. ..." className="h-9 text-sm" />
                        </div>
                      </div>
                      <div className="flex justify-between gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="gap-1">
                          <ArrowLeft className="w-3.5 h-3.5" /> Назад
                        </Button>
                        <Button
                          size="sm"
                          disabled={!canProceedStep2}
                          onClick={() => setStep(3)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1"
                        >
                          Далее <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Payment */}
                  {step === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                      <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                        <CreditCard className="w-4 h-4 text-primary" />
                        Оплата
                      </h3>

                      <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                          <FileCheck className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">Счёт для юр. лиц</p>
                          <p className="text-[10px] text-muted-foreground">PDF с реквизитами и печатью</p>
                        </div>
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      </div>

                      {/* Summary */}
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/30 space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-muted-foreground">Команда</span><span className="text-foreground">{teamName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Организация</span><span className="text-foreground truncate ml-2">{orgName}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">ИНН</span><span className="text-foreground">{inn}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Мест × период</span><span className="text-foreground">{seats} × {periodLabel}</span></div>
                        <div className="border-t border-border/30 pt-1.5 flex justify-between font-semibold text-sm">
                          <span className="text-foreground">Итого</span>
                          <span className="text-primary">{totalAmount.toLocaleString('ru-RU')} ₽</span>
                        </div>
                      </div>

                      <div className="flex justify-between gap-2 pt-1">
                        <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="gap-1">
                          <ArrowLeft className="w-3.5 h-3.5" /> Назад
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleGenerateInvoice}
                          disabled={loading || !canGenerateInvoice}
                          className="bg-primary text-primary-foreground gap-1.5 rounded-lg hover:bg-primary/90"
                        >
                          {loading ? (
                            <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          Сформировать счёт
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Footer legal */}
        <div className="text-center space-y-1 text-[10px] text-muted-foreground pt-2 pb-4">
          <p>ООО «АЦМ» · ИНН 9713007100 · ОГРН 1237700876511</p>
          <p>НДС не облагается (УСН, ст. 346.12 НК РФ)</p>
        </div>
      </div>
    </div>
  );
}
