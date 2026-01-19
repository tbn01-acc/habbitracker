import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Loader2, AtSign, Mail, AlertTriangle, MapPin, Briefcase, Phone, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { AvatarGallery } from './AvatarGallery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'student', label: 'Студент' },
  { value: 'entrepreneur', label: 'Предприниматель' },
  { value: 'employee', label: 'Сотрудник' },
  { value: 'freelancer', label: 'Фрилансер' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'developer', label: 'Разработчик' },
  { value: 'designer', label: 'Дизайнер' },
  { value: 'other', label: 'Другое' },
];

const INTEREST_OPTIONS = [
  'Продуктивность', 'Здоровье', 'Спорт', 'Финансы', 'Бизнес',
  'Программирование', 'Дизайн', 'Маркетинг', 'Саморазвитие', 'Медитация',
  'Чтение', 'Путешествия', 'Музыка', 'Кино', 'Игры',
  'Кулинария', 'Языки', 'Наука', 'Искусство', 'Фотография',
];

interface PublicProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentData: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    telegram_username: string | null;
    public_email: string | null;
    dob?: string | null;
    location?: string | null;
    job_title?: string | null;
    status_tag?: string | null;
    interests?: string[] | null;
    expertise?: string | null;
    can_help?: string | null;
    phone?: string | null;
  };
  onUpdate: () => void;
}

export function PublicProfileEditDialog({
  open,
  onOpenChange,
  userId,
  currentData,
  onUpdate
}: PublicProfileEditDialogProps) {
  const [displayName, setDisplayName] = useState(currentData.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentData.avatar_url || '');
  const [bio, setBio] = useState(currentData.bio || '');
  const [telegramUsername, setTelegramUsername] = useState(currentData.telegram_username || '');
  const [publicEmail, setPublicEmail] = useState(currentData.public_email || '');
  const [dob, setDob] = useState(currentData.dob || '');
  const [location, setLocation] = useState(currentData.location || '');
  const [jobTitle, setJobTitle] = useState(currentData.job_title || '');
  const [statusTag, setStatusTag] = useState(currentData.status_tag || '');
  const [interests, setInterests] = useState<string[]>(currentData.interests || []);
  const [expertise, setExpertise] = useState(currentData.expertise || '');
  const [canHelp, setCanHelp] = useState(currentData.can_help || '');
  const [phone, setPhone] = useState(currentData.phone || '');
  const [showGallery, setShowGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDisplayName(currentData.display_name || '');
      setAvatarUrl(currentData.avatar_url || '');
      setBio(currentData.bio || '');
      setTelegramUsername(currentData.telegram_username || '');
      setPublicEmail(currentData.public_email || '');
      setDob(currentData.dob || '');
      setLocation(currentData.location || '');
      setJobTitle(currentData.job_title || '');
      setStatusTag(currentData.status_tag || '');
      setInterests(currentData.interests || []);
      setExpertise(currentData.expertise || '');
      setCanHelp(currentData.can_help || '');
      setPhone(currentData.phone || '');
    }
  }, [currentData, open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Максимальный размер файла 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      if (avatarUrl?.includes('avatars')) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success('Фото загружено');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 10) {
      setInterests([...interests, interest]);
    } else {
      toast.error('Максимум 10 интересов');
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Имя обязательно для заполнения');
      return;
    }

    const spamPatterns = [
      /http[s]?:\/\//i,
      /www\./i,
      /купи/i,
      /скидк/i,
      /бесплатн/i,
      /заработ/i,
      /казино/i,
      /ставк/i
    ];

    const hasSpam = spamPatterns.some(pattern => 
      pattern.test(bio) || pattern.test(expertise) || pattern.test(canHelp)
    );
    if (hasSpam) {
      toast.error('Описание содержит запрещённый контент');
      return;
    }

    setSaving(true);
    try {
      let cleanTelegram = telegramUsername.trim();
      if (cleanTelegram.startsWith('@')) {
        cleanTelegram = cleanTelegram.slice(1);
      }
      if (cleanTelegram.includes('t.me/')) {
        cleanTelegram = cleanTelegram.split('t.me/')[1];
      }

      const cleanEmail = publicEmail.trim();
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        toast.error('Неверный формат email');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl || null,
          bio: bio.trim() || null,
          telegram_username: cleanTelegram || null,
          public_email: cleanEmail || null,
          dob: dob || null,
          location: location.trim() || null,
          job_title: jobTitle.trim() || null,
          status_tag: statusTag || null,
          interests: interests.length > 0 ? interests : null,
          expertise: expertise.trim() || null,
          can_help: canHelp.trim() || null,
          phone: phone.trim() || null,
          is_public: true, // Always public
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Профиль обновлён');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (displayName || 'U').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать публичный профиль</DialogTitle>
        </DialogHeader>

        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Реклама запрещена. За нарушение — режим "только чтение" на 7 дней, повторно — бан на 30 дней.
          </AlertDescription>
        </Alert>

        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-primary/20 rounded-xl">
              <AvatarImage src={avatarUrl || undefined} className="object-cover rounded-xl" />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl rounded-xl">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowGallery(!showGallery)}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {showGallery && (
            <div className="w-full rounded-lg border border-border">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="upload">Загрузить</TabsTrigger>
                  <TabsTrigger value="gallery">Галерея</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="p-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full h-16 flex flex-col gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span className="text-xs">Выбрать фото</span>
                      </>
                    )}
                  </Button>
                </TabsContent>
                <TabsContent value="gallery" className="p-2">
                  <AvatarGallery
                    selectedAvatar={avatarUrl}
                    onSelect={(url) => {
                      setAvatarUrl(url);
                      setShowGallery(false);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Личное</TabsTrigger>
            <TabsTrigger value="professional">Профессия</TabsTrigger>
            <TabsTrigger value="contacts">Контакты</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName">Имя *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ваше имя"
                maxLength={50}
              />
            </div>

            {/* Profile is always public - info text */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs text-muted-foreground">
                ℹ️ Публичный профиль виден всем пользователям в рейтинге и по ссылке
              </p>
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="dob">Дата рождения</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>


            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Местоположение</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Город, Страна"
                  className="pl-9"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Status Tag */}
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select value={statusTag} onValueChange={setStatusTag}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label>Интересы (до 10)</Label>
              <div className="flex flex-wrap gap-1.5">
                {INTEREST_OPTIONS.map(interest => (
                  <Badge
                    key={interest}
                    variant={interests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-4 py-4">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Должность</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ваша должность"
                  className="pl-9"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Expertise */}
            <div className="space-y-2">
              <Label htmlFor="expertise">Экспертиза</Label>
              <Textarea
                id="expertise"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                placeholder="В чём вы эксперт?"
                className="min-h-[80px]"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">{expertise.length}/300</p>
            </div>

            {/* Can Help */}
            <div className="space-y-2">
              <Label htmlFor="canHelp">Чем могу помочь</Label>
              <Textarea
                id="canHelp"
                value={canHelp}
                onChange={(e) => setCanHelp(e.target.value)}
                placeholder="Как вы можете помочь другим?"
                className="min-h-[80px]"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">{canHelp.length}/300</p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">О себе</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Расскажите о себе (Markdown поддерживается)"
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4 py-4">
            {/* Telegram */}
            <div className="space-y-2">
              <Label htmlFor="telegram">Telegram</Label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="telegram"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="username"
                  className="pl-9"
                  maxLength={32}
                />
              </div>
              <p className="text-xs text-muted-foreground">Введите username без @</p>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email для контактов</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="pl-9"
                  maxLength={100}
                />
              </div>
              <p className="text-xs text-muted-foreground">Виден только PRO-пользователям</p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 123-45-67"
                  className="pl-9"
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-muted-foreground">Виден только PRO-пользователям</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}