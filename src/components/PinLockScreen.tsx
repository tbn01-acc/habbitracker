import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Delete, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { toast } from 'sonner';

interface PinLockScreenProps {
  onVerified: () => void;
}

export function PinLockScreen({ onVerified }: PinLockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { hasPinSet, biometricEnabled, verifyPin, verifyBiometric } = useLocalAuth();

  const handleDigit = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4 && hasPinSet) {
      setIsVerifying(true);
      verifyPin(newPin).then(ok => {
        setIsVerifying(false);
        if (ok) {
          onVerified();
        } else {
          setError(true);
          setPin('');
          toast.error('Неверный ПИН-код');
        }
      });
    }
  }, [pin, hasPinSet, verifyPin, onVerified]);

  const handleDelete = useCallback(() => {
    setPin(p => p.slice(0, -1));
    setError(false);
  }, []);

  const handleBiometric = useCallback(async () => {
    setIsVerifying(true);
    const ok = await verifyBiometric();
    setIsVerifying(false);
    if (ok) {
      onVerified();
    } else {
      toast.error('Биометрическая аутентификация не удалась');
    }
  }, [verifyBiometric, onVerified]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center max-w-xs w-full"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-xl font-bold text-foreground mb-2">TopFocus</h1>
        <p className="text-sm text-muted-foreground mb-8">Введите ПИН-код для входа</p>

        {/* PIN dots */}
        <div className="flex gap-4 mb-8">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={error ? { x: [0, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > i
                  ? error
                    ? 'bg-destructive border-destructive'
                    : 'bg-primary border-primary'
                  : 'border-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {digits.map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              disabled={isVerifying}
              className="w-16 h-16 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center text-xl font-semibold text-foreground transition-all"
            >
              {d}
            </button>
          ))}
          {/* Bottom row: biometric, 0, delete */}
          <button
            onClick={biometricEnabled ? handleBiometric : undefined}
            disabled={!biometricEnabled || isVerifying}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              biometricEnabled ? 'bg-muted hover:bg-muted/80 active:scale-95' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Fingerprint className="w-6 h-6 text-primary" />
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={isVerifying}
            className="w-16 h-16 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center text-xl font-semibold text-foreground transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isVerifying}
            className="w-16 h-16 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center transition-all"
          >
            <Delete className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Biometric button if available but no PIN */}
        {biometricEnabled && !hasPinSet && (
          <Button variant="outline" onClick={handleBiometric} disabled={isVerifying} className="gap-2">
            <Fingerprint className="w-4 h-4" />
            Войти с Face ID / Touch ID
          </Button>
        )}
      </motion.div>
    </div>
  );
}
