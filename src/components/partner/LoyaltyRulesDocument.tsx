import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LoyaltyRulesDocument({ open, onOpenChange }: Props) {
  const { language } = useTranslation();
  const isRu = language === 'ru';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {isRu ? 'Правила Программы лояльности' : 'Loyalty Program Rules'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="prose prose-sm dark:prose-invert space-y-4">
            <h3>{isRu ? '1. Общие положения' : '1. General Provisions'}</h3>
            <p>{isRu
              ? 'Программа лояльности ТопФокус (далее — Программа) предназначена для физических лиц, не имеющих статуса «Самозанятый», ИП или юридического лица. Участие в Программе и Партнёрской (реферальной) программе одновременно не допускается.'
              : 'The TopFocus Loyalty Program (hereinafter — the Program) is designed for individuals without self-employed, sole proprietor, or legal entity status. Simultaneous participation in the Program and the Affiliate (referral) program is not allowed.'}
            </p>

            <h3>{isRu ? '2. Участие' : '2. Participation'}</h3>
            <p>{isRu
              ? 'Для участия необходимо зарегистрироваться в Программе лояльности через соответствующую форму в разделе «Партнёрская программа». При регистрации участник принимает настоящие Правила.'
              : 'To participate, you must register in the Loyalty Program through the corresponding form in the "Partner Program" section. Upon registration, the participant accepts these Rules.'}
            </p>

            <h3>{isRu ? '3. Кэшбек' : '3. Cashback'}</h3>
            <p>{isRu
              ? 'Кэшбек начисляется в виде бонусных баллов на внутренний счёт участника за каждую оплату подписки. Размер кэшбека зависит от уровня участника:'
              : 'Cashback is credited as bonus points to the participant\'s internal account for each subscription payment. The cashback rate depends on the participant\'s level:'}
            </p>
            <ul>
              <li>{isRu ? 'Бронза (0–4999₽ накоплений): 3%' : 'Bronze (0–4999₽ spent): 3%'}</li>
              <li>{isRu ? 'Серебро (5000–14999₽): 5%' : 'Silver (5000–14999₽): 5%'}</li>
              <li>{isRu ? 'Золото (15000–49999₽): 7%' : 'Gold (15000–49999₽): 7%'}</li>
              <li>{isRu ? 'Платина (50000₽+): 10%' : 'Platinum (50000₽+): 10%'}</li>
            </ul>

            <h3>{isRu ? '4. Использование баллов' : '4. Using Points'}</h3>
            <p>{isRu
              ? 'Бонусные баллы могут быть использованы для частичной или полной оплаты подписки ТопФокус. 1 балл = 1 рубль. Баллы не подлежат выводу в денежном эквиваленте.'
              : 'Bonus points can be used for partial or full payment of the TopFocus subscription. 1 point = 1 ruble. Points cannot be withdrawn as cash.'}
            </p>

            <h3>{isRu ? '5. Ограничения' : '5. Limitations'}</h3>
            <p>{isRu
              ? 'Участник не может одновременно участвовать в Партнёрской (реферальной) программе и Программе лояльности. При переходе в Партнёрскую программу накопленные баллы сохраняются, но новые начисления прекращаются.'
              : 'A participant cannot simultaneously participate in the Affiliate (referral) program and the Loyalty Program. When switching to the Affiliate Program, accumulated points are preserved, but new accruals stop.'}
            </p>

            <h3>{isRu ? '6. Изменение Правил' : '6. Changes to Rules'}</h3>
            <p>{isRu
              ? 'Организатор оставляет за собой право изменять условия Программы с уведомлением участников не менее чем за 14 дней.'
              : 'The organizer reserves the right to change the Program terms by notifying participants at least 14 days in advance.'}
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
