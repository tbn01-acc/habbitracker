import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Share2, Copy, Check, QrCode, 
  MessageCircle, Send, Link2, Users, ExternalLink, TrendingUp, DollarSign
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAffiliateV2 } from '@/hooks/useAffiliateV2';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ReferralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReferralModal({ open, onOpenChange }: ReferralModalProps) {
  const { language } = useTranslation();
  const { profile, user } = useAuth();
  const { stats: affiliateStats, isPro } = useAffiliateV2();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('qr');

  const isRussian = language === 'ru';
  const referralCode = profile?.referral_code || '';
  const referralLink = referralCode ? `https://top-focus.ru/auth?ref=${referralCode}` : '';

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(isRussian ? '🎉 Скопировано!' : '🎉 Copied!');
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8b5cf6', '#a855f7', '#c084fc'],
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRussian ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  const shareText = isRussian
    ? `🚀 Присоединяйся к Top-Focus — приложению для продуктивности и баланса жизни! Регистрируйся по моей ссылке: ${referralLink}`
    : `🚀 Join Top-Focus — the app for productivity and life balance! Sign up with my link: ${referralLink}`;

  const handleShare = async (platform: 'telegram' | 'whatsapp' | 'native') => {
    switch (platform) {
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Top-Focus',
              text: shareText,
              url: referralLink,
            });
          } catch (err) {
            // User cancelled
          }
        } else {
          handleCopy(referralLink);
        }
        break;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="!max-w-[calc(100vw-2rem)] sm:!max-w-md p-0 gap-0 overflow-hidden box-border">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full overflow-hidden"
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-white flex items-center gap-2 text-lg">
                    <Users className="w-5 h-5 shrink-0" />
                    {isRussian ? 'Пригласить друзей' : 'Invite Friends'}
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="p-4 space-y-4 overflow-hidden">
                {/* User Stats — real data from useAffiliateV2 */}
                {user && affiliateStats && (
                  <div className="grid grid-cols-3 gap-2 overflow-hidden">
                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-3 text-center border border-green-500/20">
                      <Users className="w-4 h-4 mx-auto mb-1 text-green-500" />
                      <div className="text-xl font-bold text-foreground">{affiliateStats.totalReferrals}</div>
                      <div className="text-[10px] text-muted-foreground">{isRussian ? 'Всего' : 'Total'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-3 text-center border border-amber-500/20">
                      <TrendingUp className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                      <div className="text-xl font-bold text-foreground">{affiliateStats.activeReferrals}</div>
                      <div className="text-[10px] text-muted-foreground">{isRussian ? 'Активных' : 'Active'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-3 text-center border border-purple-500/20">
                      <DollarSign className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                      <div className="text-xl font-bold text-foreground">
                        {affiliateStats.totalEarned > 0 ? `${affiliateStats.totalEarned.toLocaleString()}₽` : `${affiliateStats.commissionL1Percent}%`}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {affiliateStats.totalEarned > 0
                          ? (isRussian ? 'Заработано' : 'Earned')
                          : (isRussian ? 'Комиссия' : 'Commission')}
                      </div>
                    </div>
                  </div>
                )}

                {referralCode ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-2 w-full">
                      <TabsTrigger value="qr">
                        <QrCode className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="share">
                        <Share2 className="w-4 h-4" />
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="qr" className="mt-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center"
                      >
                        <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                          <QRCodeSVG 
                            value={referralLink} 
                            size={160}
                            level="H"
                            includeMargin
                          />
                        </div>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          {isRussian 
                            ? 'Покажите QR-код другу для быстрой регистрации'
                            : 'Show QR code to friend for quick signup'}
                        </p>
                        
                        {/* Referral Code */}
                        <div className="w-full p-3 rounded-lg bg-muted flex items-center justify-between">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {isRussian ? 'Ваш код' : 'Your code'}
                            </div>
                            <div className="font-mono font-bold text-lg text-foreground">
                              {referralCode}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(referralCode)}
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="share" className="mt-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {/* Link */}
                        <div className="p-2.5 rounded-lg bg-muted overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex-1 text-xs font-mono truncate text-foreground min-w-0">
                              {referralLink}
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={() => handleCopy(referralLink)}
                            >
                              {copied ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Share Buttons — inline row */}
                        <div className="flex gap-2 min-w-0">
                          <Button
                            variant="outline"
                            className="flex-1 min-w-0 gap-1 h-10 px-2"
                            onClick={() => handleShare('telegram')}
                          >
                            <Send className="w-4 h-4 shrink-0 text-[#0088cc]" />
                            <span className="text-xs truncate">Telegram</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 min-w-0 gap-1 h-10 px-2"
                            onClick={() => handleShare('whatsapp')}
                          >
                            <MessageCircle className="w-4 h-4 shrink-0 text-[#25D366]" />
                            <span className="text-xs truncate">WhatsApp</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 min-w-0 gap-1 h-10 px-2"
                            onClick={() => handleShare('native')}
                          >
                            <Share2 className="w-4 h-4 shrink-0 text-primary" />
                            <span className="text-xs truncate">{isRussian ? 'Ещё' : 'More'}</span>
                          </Button>
                        </div>

                        {/* Copy Full Message */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => handleCopy(shareText)}
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          <span className="truncate">{isRussian ? 'Скопировать сообщение' : 'Copy message'}</span>
                        </Button>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {isRussian 
                        ? 'Войдите в аккаунт, чтобы получить реферальную ссылку' 
                        : 'Sign in to get your referral link'}
                    </p>
                    <Button 
                      className="mt-3" 
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate('/auth');
                      }}
                    >
                      {isRussian ? 'Войти' : 'Sign In'}
                    </Button>
                  </div>
                )}

                {/* Link to full page */}
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/partner-program');
                  }}
                >
                  {isRussian ? 'Подробнее о программе' : 'Learn more'}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}