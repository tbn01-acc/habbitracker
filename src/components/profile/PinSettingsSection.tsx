import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Fingerprint, Trash2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { toast } from 'sonner';

type Step = 'idle' | 'set_new' | 'confirm_new' | 'verify_old' | 'change_new' | 'change_confirm';

export function PinSettingsSection() {
  const {
    hasPinSet,
    biometricEnabled,
    biometricAvailable,
    setPin,
    verifyPin,
    removePin,
    toggleBiometric,
  } = useLocalAuth();

  const [step, setStep] = useState<Step>('idle');
  const [tempPin, setTempPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setStep('idle');
    setTempPin('');
    setCurrentPin('');
    setError('');
  };

  const handleSetNew = (value: string) => {
    setTempPin(value);
    if (value.length === 4) {
      setStep('confirm_new');
    }
  };

  const handleConfirmNew = async (value: string) => {
    if (value.length === 4) {
      if (value === tempPin) {
        await setPin(value);
        toast.success('ПИН-код установлен');
        reset();
      } else {
        setError('ПИН-коды не совпадают');
        setCurrentPin('');
      }
    } else {
      setCurrentPin(value);
    }
  };

  const handleVerifyOld = async (value: string) => {
    if (value.length === 4) {
      const ok = await verifyPin(value);
      if (ok) {
        setStep('change_new');
        setCurrentPin('');
        setTempPin('');
        setError('');
      } else {
        setError('Неверный ПИН-код');
        setCurrentPin('');
      }
    } else {
      setCurrentPin(value);
    }
  };

  const handleChangeNew = (value: string) => {
    setTempPin(value);
    if (value.length === 4) {
      setStep('change_confirm');
      setCurrentPin('');
    }
  };

  const handleChangeConfirm = async (value: string) => {
    if (value.length === 4) {
      if (value === tempPin) {
        await setPin(value);
        toast.success('ПИН-код изменён');
        reset();
      } else {
        setError('ПИН-коды не совпадают');
        setCurrentPin('');
      }
    } else {
      setCurrentPin(value);
    }
  };

  const handleRemovePin = async () => {
    // Require current PIN verification before removal
    setStep('verify_old');
    setError('');
    setCurrentPin('');
  };

  const confirmRemove = async (value: string) => {
    if (value.length === 4) {
      const ok = await verifyPin(value);
      if (ok) {
        removePin();
        toast.success('ПИН-код удалён');
        reset();
      } else {
        setError('Неверный ПИН-код');
        setCurrentPin('');
      }
    } else {
      setCurrentPin(value);
    }
  };

  const handleBiometricToggle = async (checked: boolean) => {
    const ok = await toggleBiometric(checked);
    if (ok) {
      toast.success(checked ? 'Биометрия включена' : 'Биометрия отключена');
    } else {
      toast.error('Биометрическая аутентификация недоступна на этом устройстве');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'set_new': return 'Придумайте ПИН-код (4 цифры)';
      case 'confirm_new': return 'Повторите ПИН-код';
      case 'verify_old': return 'Введите текущий ПИН-код';
      case 'change_new': return 'Введите новый ПИН-код';
      case 'change_confirm': return 'Повторите новый ПИН-код';
      default: return '';
    }
  };

  const getHandler = () => {
    switch (step) {
      case 'set_new': return handleSetNew;
      case 'confirm_new': return handleConfirmNew;
      case 'verify_old': return hasPinSet && step === 'verify_old' ? confirmRemove : handleVerifyOld;
      case 'change_new': return handleChangeNew;
      case 'change_confirm': return handleChangeConfirm;
      default: return () => {};
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Безопасность входа
        </div>

        {/* PIN Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">ПИН-код</Label>
              <p className="text-xs text-muted-foreground">
                {hasPinSet ? 'Установлен' : 'Не установлен'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPinSet ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStep('verify_old'); setError(''); setCurrentPin(''); }}
                >
                  Изменить
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePin}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setStep('set_new')}>
                Установить
              </Button>
            )}
          </div>
        </div>

        {/* Biometric Toggle */}
        {biometricAvailable && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Face ID / Touch ID</Label>
                <p className="text-xs text-muted-foreground">Быстрый вход по биометрии</p>
              </div>
            </div>
            <Switch
              checked={biometricEnabled}
              onCheckedChange={handleBiometricToggle}
            />
          </div>
        )}

        {/* OTP Input for PIN setup/change/verify */}
        <AnimatePresence mode="wait">
          {step !== 'idle' && (
            <motion.div
              key={step}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t space-y-3">
                <p className="text-sm text-center text-muted-foreground">{getStepTitle()}</p>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={step === 'set_new' || step === 'change_new' ? tempPin : currentPin}
                    onChange={getHandler()}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                {error && (
                  <p className="text-xs text-center text-destructive">{error}</p>
                )}
                <div className="flex justify-center">
                  <Button variant="ghost" size="sm" onClick={reset}>
                    Отмена
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
