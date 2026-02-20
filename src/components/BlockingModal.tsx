import { ShieldAlert } from 'lucide-react';

/**
 * Полноэкранная блокировка — показывается, когда пользователь
 * не дал разрешение на отправку сообщений в Telegram Mini App.
 * Крестика нет — это обязательное условие.
 */
export function BlockingModal() {
  const handleRequestAccess = () => {
    const tg = window.Telegram?.WebApp;
    if (tg && typeof tg.requestWriteAccess === 'function') {
      tg.requestWriteAccess((allowed: boolean) => {
        if (allowed) {
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/95 backdrop-blur-sm p-6">
      <div className="max-w-sm w-full bg-card rounded-2xl shadow-2xl border p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Требуется разрешение
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Для работы приложения необходимо разрешить отправку сообщений. 
            Это нужно для синхронизации данных и уведомлений.
          </p>
        </div>

        <button
          onClick={handleRequestAccess}
          className="w-full py-3 px-6 rounded-xl font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
        >
          Разрешить отправку сообщений
        </button>
      </div>
    </div>
  );
}
