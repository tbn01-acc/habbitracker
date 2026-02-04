import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, User, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contact, SPHERES, getSphereName } from '@/types/sphere';

interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (contact: Contact) => void;
  contact?: Contact | null;
  prefillSphereId?: number | null;
}

interface DeviceContact {
  name?: string;
  tel?: string[];
  email?: string[];
}

export function ContactDialog({ 
  open, 
  onClose, 
  onSave, 
  contact, 
  prefillSphereId 
}: ContactDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [sphereIds, setSphereIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasContactsApi, setHasContactsApi] = useState(false);

  useEffect(() => {
    // Check if Contact Picker API is available
    setHasContactsApi('contacts' in navigator && 'ContactsManager' in window);
  }, []);

  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setPhone(contact.phone || '');
      setEmail(contact.email || '');
      setDescription(contact.description || '');
      // Load sphere associations
      loadContactSpheres(contact.id);
    } else {
      resetForm();
      if (prefillSphereId) {
        setSphereIds([prefillSphereId]);
      }
    }
  }, [contact, open, prefillSphereId]);

  const loadContactSpheres = async (contactId: string) => {
    if (!user) return;
    
    const { data } = await supabase
      .from('contact_spheres')
      .select('sphere_id')
      .eq('contact_id', contactId)
      .eq('user_id', user.id);
    
    if (data) {
      setSphereIds(data.map(cs => cs.sphere_id));
    }
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setDescription('');
    setSphereIds([]);
  };

  const handleImportFromDevice = async () => {
    try {
      // @ts-ignore - Contact Picker API
      const supported = 'contacts' in navigator && 'ContactsManager' in window;
      
      if (!supported) {
        toast.error(isRussian ? 'Ваш браузер не поддерживает импорт контактов' : 'Contact import not supported');
        return;
      }

      // @ts-ignore - Contact Picker API
      const contacts: DeviceContact[] = await navigator.contacts.select(
        ['name', 'tel', 'email'],
        { multiple: false }
      );

      if (contacts && contacts.length > 0) {
        const deviceContact = contacts[0];
        setName(deviceContact.name || '');
        setPhone(deviceContact.tel?.[0] || '');
        setEmail(deviceContact.email?.[0] || '');
        toast.success(isRussian ? 'Контакт импортирован' : 'Contact imported');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error importing contact:', err);
        toast.error(isRussian ? 'Ошибка при импорте контакта' : 'Error importing contact');
      }
    }
  };

  const handleSphereChange = (sphereId: number) => {
    setSphereIds(prev => {
      if (prev.includes(sphereId)) {
        return prev.filter(id => id !== sphereId);
      }
      return [...prev, sphereId];
    });
  };

  const handleSave = async () => {
    if (!name.trim() || !user) return;

    setSaving(true);
    try {
      let savedContact: Contact;

      if (contact) {
        // Update existing
        const { data, error } = await supabase
          .from('contacts')
          .update({
            name: name.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            description: description.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', contact.id)
          .select()
          .single();

        if (error) throw error;
        savedContact = data;

        // Update sphere associations
        await supabase
          .from('contact_spheres')
          .delete()
          .eq('contact_id', contact.id)
          .eq('user_id', user.id);

      } else {
        // Create new
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            name: name.trim(),
            phone: phone.trim() || null,
            email: email.trim() || null,
            description: description.trim() || null,
          })
          .select()
          .single();

        if (error) throw error;
        savedContact = data;
      }

      // Add sphere associations
      if (sphereIds.length > 0) {
        const sphereInserts = sphereIds.map(sphereId => ({
          contact_id: savedContact.id,
          sphere_id: sphereId,
          user_id: user.id,
        }));

        await supabase.from('contact_spheres').insert(sphereInserts);
      }

      onSave(savedContact);
      toast.success(isRussian ? 'Контакт сохранен' : 'Contact saved');
      onClose();
    } catch (err) {
      console.error('Error saving contact:', err);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const labels = {
    title: { ru: contact ? 'Редактировать контакт' : 'Новый контакт', en: contact ? 'Edit Contact' : 'New Contact' },
    name: { ru: 'Имя', en: 'Name' },
    phone: { ru: 'Телефон', en: 'Phone' },
    email: { ru: 'Email', en: 'Email' },
    description: { ru: 'Описание', en: 'Description' },
    spheres: { ru: 'Сферы жизни', en: 'Life Spheres' },
    importDevice: { ru: 'Импорт с устройства', en: 'Import from device' },
    save: { ru: 'Сохранить', en: 'Save' },
    cancel: { ru: 'Отмена', en: 'Cancel' },
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{labels.title[language]}</DialogTitle>
        </DialogHeader>

        {/* Import from device button */}
        {hasContactsApi && (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleImportFromDevice}
          >
            <Smartphone className="w-4 h-4" />
            {labels.importDevice[language]}
          </Button>
        )}

        {/* Name */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4" />
            {labels.name[language]} *
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isRussian ? 'Иван Иванов' : 'John Doe'}
            className="bg-background"
          />
        </div>

        {/* Phone */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4" />
            {labels.phone[language]}
          </Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 900 123-45-67"
            className="bg-background"
          />
        </div>

        {/* Email */}
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4" />
            {labels.email[language]}
          </Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="bg-background"
          />
        </div>

        {/* Description */}
        <div>
          <Label className="mb-2 block">{labels.description[language]}</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isRussian ? 'Заметки о контакте...' : 'Notes about contact...'}
            rows={2}
            className="bg-background"
          />
        </div>

        {/* Sphere Selector - Multiple Selection */}
        {user && (
          <div>
            <Label className="mb-2 block">{labels.spheres[language]}</Label>
            <MultiSphereSelector 
              selectedIds={sphereIds} 
              onChange={handleSphereChange} 
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {labels.cancel[language]}
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSave}
            disabled={!name.trim() || saving}
          >
            {saving ? '...' : labels.save[language]}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Multi-select sphere component
function MultiSphereSelector({ 
  selectedIds, 
  onChange 
}: { 
  selectedIds: number[]; 
  onChange: (id: number) => void;
}) {
  const { language } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2">
      {SPHERES.filter((s: any) => s.group_type !== 'system').map((sphere: any) => {
        const isSelected = selectedIds.includes(sphere.id);
        return (
          <button
            key={sphere.id}
            type="button"
            onClick={() => onChange(sphere.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
              isSelected 
                ? 'text-white' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            style={isSelected ? { backgroundColor: sphere.color } : undefined}
          >
            <span>{sphere.icon}</span>
            <span>{getSphereName(sphere, language)}</span>
          </button>
        );
      })}
    </div>
  );
}
