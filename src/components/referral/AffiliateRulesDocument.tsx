import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AffiliateRulesDocumentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AffiliateRulesDocument({ open, onOpenChange }: AffiliateRulesDocumentProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Правила Партнерской программы «ТопФокус» (Редакция 2.0)
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh] px-6 pb-6">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-sm leading-relaxed">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="text-xs">Дата публикации: 08 марта 2026 г.</Badge>
              <Badge variant="outline" className="text-xs">Редакция 2.0</Badge>
            </div>

            <p className="text-muted-foreground text-xs">
              Место публикации: <a href="https://top-focus.ru" className="text-primary underline" target="_blank" rel="noopener noreferrer">https://top-focus.ru</a><br />
              Организатор: ООО "Агентство Цифрового Маркетинга" (ООО "АЦМ")
            </p>

            <p>
              Настоящий документ является публичной офертой в соответствии со ст. 437 Гражданского кодекса РФ.
              Акцептом (принятием) настоящих Правил является регистрация Пользователя в качестве Партнера в интерфейсе Сервиса «ТопФокус».
            </p>

            <h2 className="text-base font-bold mt-6">1. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ</h2>
            <p><strong>1.1.</strong> Организатор — ООО "Агентство Цифрового Маркетинга" (ООО "АЦМ"), ИНН 9713007100, ОГРН 1237700876511, являющееся правообладателем Сервиса.</p>
            <p><strong>1.2.</strong> Партнер — дееспособное физическое лицо (в т.ч. самозанятый), индивидуальный предприниматель или юридическое лицо (организация), принявшее условия настоящих Правил.</p>
            <p><strong>1.3.</strong> Активный реферал — Пользователь, перешедший по уникальной ссылке Партнера и имеющий оплаченную подписку на любой платный Тариф Сервиса.</p>
            <p><strong>1.4.</strong> Активная единица — единица учета: 1 индивидуальный Активный реферал = 1 единица; 1 участник тарифа «Команда» = количество оплаченных мест в данной команде.</p>
            <p><strong>1.5.</strong> Личный кабинет (ЛК) — программный интерфейс для мониторинга статистики и баланса Партнера.</p>

            <h2 className="text-base font-bold mt-6">2. ПРЕДМЕТ СОГЛАШЕНИЯ</h2>
            <p><strong>2.1.</strong> Партнер осуществляет действия по привлечению новых Пользователей, а Организатор выплачивает вознаграждение на условиях настоящих Правил.</p>
            <p><strong>2.2.</strong> Настоящее соглашение не является трудовым договором. Партнер действует как независимый контрагент.</p>

            <h2 className="text-base font-bold mt-6">3. ПОРЯДОК НАЧИСЛЕНИЯ ВОЗНАГРАЖДЕНИЯ</h2>
            <p><strong>3.1.</strong> Размер вознаграждения определяется Тарифом Партнера (Фокус, Профи, Премиум, Команда) и Уровнем (1 или 2).</p>
            <p><strong>3.2.</strong> Вознаграждение начисляется только за Активных рефералов.</p>
            <p><strong>3.3.</strong> Период Холда: Проверка на фрод и возвраты составляет 14 календарных дней.</p>
            <p><strong>3.4.</strong> Бонусы за «Вехи» начисляются единоразово при достижении порогового значения Активных единиц.</p>

            <h2 className="text-base font-bold mt-6">4. МЕХАНИЗМ ВЫПЛАТ И НАЛОГООБЛОЖЕНИЕ</h2>
            <p><strong>4.1.</strong> Выплата осуществляется по запросу при достижении порога в 1 000 рублей.</p>
            <p><strong>4.2.</strong> Налоговая оговорка:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Для Юридических лиц и ИП:</strong> Партнер самостоятельно исчисляет и уплачивает налоги. Выплата производится на основании счета и акта (в т.ч. через ЭДО).</li>
              <li><strong>Для Самозанятых:</strong> Партнер обязан предоставить чек из приложения «Мой налог».</li>
              <li><strong>Для Физлиц:</strong> Организатор выступает налоговым агентом и удерживает НДФЛ (13/15%) перед выплатой.</li>
            </ul>
            <p><strong>4.3.</strong> Организатор не несет ответственности за неисполнение Партнером налоговых обязательств.</p>
            <p><strong>4.4.</strong> Комиссии платежных систем вычитаются из суммы выплаты.</p>

            <h2 className="text-base font-bold mt-6">5. ОГРАНИЧЕНИЯ И ЗАПРЕТЫ</h2>
            <p><strong>5.1.</strong> Запрещено: использование контекстной рекламы на бренд «ТопФокус», спам-рассылки, создание фейковых аккаунтов (Self-referral).</p>
            <p><strong>5.2.</strong> При нарушениях Организатор вправе аннулировать баланс и заблокировать доступ к ПП.</p>

            <h2 className="text-base font-bold mt-6">6. ОГРАНИЧЕНИЕ ОТВЕТСТВЕННОСТИ</h2>
            <p><strong>6.1.</strong> Программа предоставляется на условиях «как есть».</p>
            <p><strong>6.2.</strong> Организатор не несет ответственности за технические сбои вне его контроля.</p>
            <p><strong>6.3.</strong> Организатор вправе в одностороннем порядке изменять условия Правил.</p>

            <h2 className="text-base font-bold mt-6">7. СРОК ДЕЙСТВИЯ И РАСТОРЖЕНИЕ</h2>
            <p><strong>7.1.</strong> Соглашение действует бессрочно.</p>
            <p><strong>7.2.</strong> Организатор вправе прекратить ПП, уведомив Партнеров за 7 дней.</p>

            <div className="mt-8 p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="text-sm font-bold mb-2">Реквизиты Организатора</h3>
              <div className="text-xs text-muted-foreground space-y-0.5 font-mono">
                <p>ООО "Агентство Цифрового Маркетинга" (ООО "АЦМ")</p>
                <p>ИНН: 9713007100 | ОГРН: 1237700876511</p>
                <p>Р/с: 40702810200100153818</p>
                <p>Банк: ООО "Бланк банк"</p>
                <p>БИК: 044525801 | К/с: 30101810645250000801</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
