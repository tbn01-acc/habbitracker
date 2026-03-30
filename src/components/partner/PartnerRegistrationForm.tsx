import { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Briefcase, Building2, User, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export type PartnerType = 'individual' | 'self_employed' | 'sole_proprietor' | 'legal_entity';

interface Props {
  onRegister: (type: PartnerType) => void;
}

export function PartnerRegistrationForm({ onRegister }: Props) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [partnerType, setPartnerType] = useState<PartnerType | null>(null);
  const [acceptedRules, setAcceptedRules] = useState(false);

  const isReferral = partnerType && partnerType !== 'individual';
  const isLoyalty = partnerType === 'individual';

  const handleSubmit = () => {
    if (!partnerType || !acceptedRules) return;
    onRegister(partnerType);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    toast.success(isRu ? '🎉 Регистрация успешна!' : '🎉 Registration successful!');
  };

  const options = [
    { value: 'individual' as PartnerType, icon: User, label: isRu ? 'Физическое лицо' : 'Individual', desc: isRu ? 'Программа лояльности (кэшбек)' : 'Loyalty Program (cashback)' },
    { value: 'self_employed' as PartnerType, icon: UserCheck, label: isRu ? 'Самозанятый' : 'Self-employed', desc: isRu ? 'Реферальная программа' : 'Referral Program' },
    { value: 'sole_proprietor' as PartnerType, icon: Briefcase, label: isRu ? 'ИП' : 'Sole Proprietor', desc: isRu ? 'Реферальная программа' : 'Referral Program' },
    { value: 'legal_entity' as PartnerType, icon: Building2, label: isRu ? 'Юридическое лицо' : 'Legal Entity', desc: isRu ? 'Реферальная программа' : 'Referral Program' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {isRu ? 'Регистрация в программе' : 'Program Registration'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Выберите ваш статус. Одновременное участие в Реферальной программе и Программе лояльности не допускается.'
              : 'Choose your status. Simultaneous participation in the Referral and Loyalty programs is not allowed.'}
          </p>

          <RadioGroup value={partnerType || ''} onValueChange={(v) => setPartnerType(v as PartnerType)}>
            <div className="grid grid-cols-1 gap-2">
              {options.map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    partnerType === opt.value
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <RadioGroupItem value={opt.value} id={opt.value} />
                  <opt.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                  </div>
                </Label>
              ))}
            </div>
          </RadioGroup>

          {partnerType && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  {isLoyalty
                    ? (isRu ? 'Вы будете зарегистрированы в Программе лояльности с кэшбеком до 10%' : 'You will be registered in the Loyalty Program with up to 10% cashback')
                    : (isRu ? 'Вы будете зарегистрированы в Реферальной программе с комиссией до 30%' : 'You will be registered in the Referral Program with up to 30% commission')}
                </p>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="accept-rules"
                  checked={acceptedRules}
                  onCheckedChange={(v) => setAcceptedRules(!!v)}
                />
                <Label htmlFor="accept-rules" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  {isRu
                    ? `Я ознакомился(лась) и принимаю Правила ${isLoyalty ? 'Программы лояльности' : 'Реферальной программы'}`
                    : `I have read and accept the ${isLoyalty ? 'Loyalty Program' : 'Referral Program'} Rules`}
                </Label>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!acceptedRules}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
              >
                {isRu ? 'Зарегистрироваться' : 'Register'}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
