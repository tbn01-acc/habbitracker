import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Github, Eye, EyeOff, Loader2, Gift, ArrowLeft, KeyRound, AlertCircle, Fingerprint, Delete } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useGeoRestriction } from '@/hooks/useGeoRestriction';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast as sonnerToast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset' | 'pin';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  const resetMode = searchParams.get('mode');
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const isRussian = language === 'ru';
  const { 
    user, 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    signInWithGitHub,
    resetPassword,
    updatePassword,
  } = useAuth();
  
  const { hasPinSet, biometricEnabled, verifyPin, verifyBiometric, markVerified, needsLocalAuth } = useLocalAuth();
  const { accessControl, loading: settingsLoading } = useAppSettings();
  const { isRussia: isRussianGeo, loading: geoLoading } = useGeoRestriction();
  const registrationDisabled = !accessControl.registration_enabled;
  const socialLoginAllowed = !isRussianGeo;
  const hasLocalAuth = hasPinSet || biometricEnabled;

  // If user has a Supabase session and local auth is needed, show PIN/biometric as primary
  const userNeedsLocalReauth = !!user && needsLocalAuth();

  useEffect(() => {
    if (user && mode !== 'reset') {
      // If local auth is needed, switch to PIN mode instead of redirecting
      if (needsLocalAuth()) {
        if (hasPinSet && mode !== 'pin') {
          setMode('pin');
        }
        return;
      }
      navigate('/');
    }
  }, [user, navigate, mode, needsLocalAuth, hasPinSet]);

  // If referral code is present, switch to signup mode
  useEffect(() => {
    if (referralCode) {
      setMode('signup');
    }
  }, [referralCode]);

  // Handle reset password mode from URL
  useEffect(() => {
    if (resetMode === 'reset') {
      setMode('reset');
    }
  }, [resetMode]);

  const validateEmail = () => {
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      toast({
        title: t('error'),
        description: isRussian ? 'Введите корректный email' : 'Please enter a valid email',
        variant: 'destructive',
      });
      return false;
    }
  };

  const validatePassword = () => {
    try {
      passwordSchema.parse(password);
      return true;
    } catch {
      toast({
        title: t('error'),
        description: isRussian ? 'Пароль должен содержать минимум 6 символов' : 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!validateEmail() || !validatePassword()) {
          setIsLoading(false);
          return;
        }
        const { error } = await signInWithEmail(email, password);
        if (error) {
          toast({
            title: t('error'),
            description: error.message === 'Invalid login credentials' 
              ? (isRussian ? 'Неверный email или пароль' : 'Invalid email or password')
              : error.message,
            variant: 'destructive',
          });
        }
      } else if (mode === 'signup') {
        // Check if registration is disabled
        if (registrationDisabled) {
          toast({
            title: t('error'),
            description: isRussian ? 'Регистрация временно отключена' : 'Registration is currently disabled',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        if (!validateEmail() || !validatePassword()) {
          setIsLoading(false);
          return;
        }
        const { error } = await signUpWithEmail(email, password, displayName, referralCode || undefined);
        if (error) {
          toast({
            title: t('error'),
            description: error.message.includes('already registered')
              ? (isRussian ? 'Этот email уже зарегистрирован' : 'This email is already registered')
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('success'),
            description: isRussian ? 'Проверьте вашу почту для подтверждения' : 'Check your email to confirm registration',
          });
        }
      } else if (mode === 'forgot') {
        if (!validateEmail()) {
          setIsLoading(false);
          return;
        }
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: t('error'),
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('success'),
            description: isRussian ? 'Ссылка для сброса пароля отправлена на вашу почту' : 'Password reset link sent to your email',
          });
          setMode('login');
        }
      } else if (mode === 'reset') {
        if (!validatePassword()) {
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast({
            title: t('error'),
            description: isRussian ? 'Пароли не совпадают' : 'Passwords do not match',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        const { error } = await updatePassword(password);
        if (error) {
          toast({
            title: t('error'),
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('success'),
            description: isRussian ? 'Пароль успешно изменён' : 'Password successfully changed',
          });
          navigate('/');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleGitHubLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGitHub();
    if (error) {
      toast({
        title: t('error'),
        description: error.message,
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handlePinDigit = useCallback((digit: string) => {
    if (pinInput.length >= 4) return;
    const newPin = pinInput + digit;
    setPinInput(newPin);
    setPinError(false);

    if (newPin.length === 4) {
      setIsLoading(true);
      verifyPin(newPin).then(ok => {
        setIsLoading(false);
        if (ok) {
          markVerified();
          navigate('/');
        } else {
          setPinError(true);
          setPinInput('');
          sonnerToast.error(isRussian ? 'Неверный ПИН-код' : 'Incorrect PIN');
        }
      });
    }
  }, [pinInput, verifyPin, markVerified, navigate, isRussian]);

  const handlePinDelete = useCallback(() => {
    setPinInput(p => p.slice(0, -1));
    setPinError(false);
  }, []);

  const handleBiometricLogin = useCallback(async () => {
    setIsLoading(true);
    const ok = await verifyBiometric();
    setIsLoading(false);
    if (ok) {
      markVerified();
      navigate('/');
    } else {
      sonnerToast.error(isRussian ? 'Биометрическая аутентификация не удалась' : 'Biometric authentication failed');
    }
  }, [verifyBiometric, markVerified, navigate, isRussian]);

  const getTitle = () => {
    switch (mode) {
      case 'login': return t('signIn');
      case 'signup': return t('signUp');
      case 'forgot': return isRussian ? 'Восстановление пароля' : 'Password Recovery';
      case 'reset': return isRussian ? 'Новый пароль' : 'New Password';
      case 'pin': return isRussian ? 'Вход по ПИН-коду' : 'PIN Login';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return t('welcomeBack');
      case 'signup': return t('createAccount');
      case 'forgot': return isRussian ? 'Введите email для сброса пароля' : 'Enter your email to reset password';
      case 'reset': return isRussian ? 'Придумайте новый пароль' : 'Create a new password';
      case 'pin': return isRussian ? 'Введите 4-значный ПИН-код' : 'Enter your 4-digit PIN';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
          {/* Back button for forgot/reset/pin modes */}
          {(mode === 'forgot' || mode === 'reset' || mode === 'pin') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setMode('login'); setPinInput(''); setPinError(false); }}
              className="mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              {isRussian ? 'Назад' : 'Back'}
            </Button>
          )}

          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            {getTitle()}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {getSubtitle()}
          </p>

          {/* Referral Badge */}
          {referralCode && mode === 'signup' && (
            <div className="flex items-center justify-center gap-2 mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <Gift className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-500 font-medium">
                {isRussian ? 'Вы приглашены по реферальной ссылке!' : 'You were invited by a friend!'}
              </span>
            </div>
          )}

          {/* PIN Login Mode */}
          {mode === 'pin' && (
            <div className="flex flex-col items-center">
              {/* PIN dots */}
              <div className="flex gap-4 mb-8">
                {[0, 1, 2, 3].map(i => (
                  <motion.div
                    key={i}
                    animate={pinError ? { x: [0, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      pinInput.length > i
                        ? pinError
                          ? 'bg-destructive border-destructive'
                          : 'bg-primary border-primary'
                        : 'border-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {['1','2','3','4','5','6','7','8','9'].map(d => (
                  <button
                    key={d}
                    onClick={() => handlePinDigit(d)}
                    disabled={isLoading}
                    className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center text-xl font-semibold text-foreground transition-all"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={biometricEnabled ? handleBiometricLogin : undefined}
                  disabled={!biometricEnabled || isLoading}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    biometricEnabled ? 'bg-muted hover:bg-muted/80 active:scale-95' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <Fingerprint className="w-6 h-6 text-primary" />
                </button>
                <button
                  onClick={() => handlePinDigit('0')}
                  disabled={isLoading}
                  className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center text-xl font-semibold text-foreground transition-all"
                >
                  0
                </button>
                <button
                  onClick={handlePinDelete}
                  disabled={isLoading}
                  className="w-14 h-14 rounded-full bg-muted hover:bg-muted/80 active:scale-95 flex items-center justify-center transition-all"
                >
                  <Delete className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Back to email - only show if no forced local reauth */}
              {!userNeedsLocalReauth && (
                <button
                  onClick={() => { setMode('login'); setPinInput(''); }}
                  className="text-sm text-primary hover:underline"
                >
                  {isRussian ? 'Войти по email и паролю' : 'Sign in with email & password'}
                </button>
              )}
              {userNeedsLocalReauth && biometricEnabled && (
                <Button
                  variant="outline"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                  className="gap-2 mt-2"
                >
                  <Fingerprint className="w-4 h-4" />
                  {isRussian ? 'Войти с Face ID / Touch ID' : 'Sign in with Face ID / Touch ID'}
                </Button>
              )}
            </div>
          )}

          {/* Main auth form (not shown in pin mode) */}
          {mode !== 'pin' && (
            <>
              {/* Social Login Buttons - only for login/signup, hidden for Russian users */}
              {(mode === 'login' || mode === 'signup') && socialLoginAllowed && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Button
                      variant="outline"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGitHubLogin}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Github className="w-5 h-5 mr-2" />
                      GitHub
                    </Button>
                  </div>

                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card text-muted-foreground">{t('orContinueWith')}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Info banner for Russian users */}
              {(mode === 'login' || mode === 'signup') && !socialLoginAllowed && !geoLoading && (
                <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-muted border border-border">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    {isRussian
                      ? 'Для пользователей из РФ доступна авторизация только по email и паролю в соответствии с требованиями о хранении персональных данных (152-ФЗ).'
                      : 'Users from Russia can only sign in with email and password due to data residency requirements.'}
                  </span>
                </div>
              )}

              {/* Email Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      key="displayName"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Label htmlFor="displayName">{t('displayName')}</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="displayName"
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={isRussian ? 'Ваше имя' : 'Your name'}
                          className="pl-10"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode !== 'reset' && (
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                {mode !== 'forgot' && (
                  <div>
                    <Label htmlFor="password">{mode === 'reset' ? (isRussian ? 'Новый пароль' : 'New Password') : t('password')}</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'reset' && (
                  <div>
                    <Label htmlFor="confirmPassword">{isRussian ? 'Подтвердите пароль' : 'Confirm Password'}</Label>
                    <div className="relative mt-1">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Forgot password link */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-primary hover:underline"
                    >
                      {isRussian ? 'Забыли пароль?' : 'Forgot password?'}
                    </button>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {mode === 'login' && t('signIn')}
                  {mode === 'signup' && t('signUp')}
                  {mode === 'forgot' && (isRussian ? 'Отправить ссылку' : 'Send Reset Link')}
                  {mode === 'reset' && (isRussian ? 'Сохранить пароль' : 'Save Password')}
                </Button>
              </form>

              {/* PIN / Biometric login buttons - only when user has no active session */}
              {mode === 'login' && hasLocalAuth && !userNeedsLocalReauth && (
                <div className="mt-4 flex flex-col gap-2">
                  <div className="relative mb-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-card text-muted-foreground">
                        {isRussian ? 'или' : 'or'}
                      </span>
                    </div>
                  </div>
                  {hasPinSet && (
                    <Button
                      variant="outline"
                      onClick={() => setMode('pin')}
                      className="w-full gap-2"
                    >
                      <KeyRound className="w-4 h-4" />
                      {isRussian ? 'Войти по ПИН-коду' : 'Sign in with PIN'}
                    </Button>
                  )}
                  {biometricEnabled && (
                    <Button
                      variant="outline"
                      onClick={handleBiometricLogin}
                      disabled={isLoading}
                      className="w-full gap-2"
                    >
                      <Fingerprint className="w-4 h-4" />
                      {isRussian ? 'Войти с Face ID / Touch ID' : 'Sign in with Face ID / Touch ID'}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Toggle login/signup */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              {/* Registration disabled warning */}
              {registrationDisabled && mode === 'signup' && (
                <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">
                    {isRussian ? 'Регистрация временно отключена' : 'Registration is currently disabled'}
                  </span>
                </div>
              )}
              
              <p className="text-center text-sm text-muted-foreground mt-6">
                {mode === 'login' ? t('noAccount') : t('hasAccount')}{' '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary hover:underline font-medium"
                  disabled={registrationDisabled && mode === 'login'}
                >
                  {mode === 'login' ? t('signUp') : t('signIn')}
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}