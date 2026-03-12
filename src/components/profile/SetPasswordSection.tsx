import { useState } from 'react';
import { Lock, Eye, EyeOff, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';

export function SetPasswordSection() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (password.length < 6) {
      toast.error(isRussian ? 'Пароль должен содержать минимум 6 символов' : 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error(isRussian ? 'Пароли не совпадают' : 'Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(isRussian ? 'Пароль успешно установлен! Теперь вы можете входить по email и паролю.' : 'Password set! You can now sign in with email and password.');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">
            {isRussian ? 'Назначение пароля' : 'Set Password'}
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          {isRussian
            ? 'Установите пароль, чтобы входить как через Google, так и по email/паролю.'
            : 'Set a password to sign in with both Google and email/password.'}
        </p>
        <div className="space-y-2">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder={isRussian ? 'Новый пароль' : 'New password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={isRussian ? 'Подтвердите пароль' : 'Confirm password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !password || !confirmPassword}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isRussian ? 'Сохранить пароль' : 'Save Password'}
        </Button>
      </CardContent>
    </Card>
  );
}
