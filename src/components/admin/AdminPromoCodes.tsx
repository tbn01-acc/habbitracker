import { useState, useCallback } from 'react';
import { Ticket, Search, Trash2, Copy, Wand2, FileText, Download, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePromoCodes } from '@/hooks/usePromoCodes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

interface UserOption {
  user_id: string;
  display_name: string | null;
}

interface PromoLog {
  id: string;
  code: string;
  action: string;
  discount_percent: number;
  bonus_stars: number;
  bonus_days: number;
  max_uses: number | null;
  valid_until: string | null;
  referrer_user_id: string | null;
  referrer_level: string | null;
  created_by: string;
  created_at: string;
  description: string | null;
}

export function AdminPromoCodes() {
  const { user } = useAuth();
  const { promoCodes, loading: promoLoading, createPromoCode, deletePromoCode, togglePromoCode, refetch } = usePromoCodes();

  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [newBonusStars, setNewBonusStars] = useState('');
  const [newBonusDays, setNewBonusDays] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedReferrer, setSelectedReferrer] = useState('');
  const [referrerLevel, setReferrerLevel] = useState('');

  const [userSearch, setUserSearch] = useState('');
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<PromoLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [creating, setCreating] = useState(false);

  const isRussian = true; // Admin panel is in Russian

  // Generate unique promo code
  const generateUniqueCode = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TF-';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    // Add timestamp suffix for uniqueness
    code += '-' + Date.now().toString(36).toUpperCase().slice(-3);
    setNewCode(code);
  }, []);

  // Search users for referrer binding
  const searchUsers = useCallback(async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setUserOptions([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const { data } = await supabase
        .from('public_profiles')
        .select('user_id, display_name')
        .ilike('display_name', `%${query}%`)
        .limit(10);
      setUserOptions((data as UserOption[]) || []);
    } catch {
      setUserOptions([]);
    } finally {
      setSearchingUsers(false);
    }
  }, []);

  // Create promo code with referrer + log
  const handleCreate = async () => {
    if (!newCode || !user) return;
    setCreating(true);
    try {
      // Check uniqueness
      const { data: existing } = await supabase
        .from('promo_codes')
        .select('id')
        .eq('code', newCode.toUpperCase())
        .maybeSingle();

      if (existing) {
        toast.error('Промо-код с таким именем уже существует');
        setCreating(false);
        return;
      }

      const insertData: Record<string, unknown> = {
        code: newCode.toUpperCase(),
        discount_percent: parseInt(newDiscount) || 0,
        bonus_stars: parseInt(newBonusStars) || 0,
        bonus_days: parseInt(newBonusDays) || 0,
        valid_until: newValidUntil || null,
        max_uses: newMaxUses ? parseInt(newMaxUses) : null,
        description: newDescription || null,
        created_by: user.id,
        referrer_user_id: selectedReferrer || null,
        referrer_level: referrerLevel || null,
      };

      const { data: created, error } = await supabase
        .from('promo_codes')
        .insert({
          code: newCode.toUpperCase(),
          discount_percent: parseInt(newDiscount) || 0,
          bonus_stars: parseInt(newBonusStars) || 0,
          bonus_days: parseInt(newBonusDays) || 0,
          valid_until: newValidUntil || null,
          max_uses: newMaxUses ? parseInt(newMaxUses) : null,
          description: newDescription || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update referrer fields (not in generated types yet)
      if (selectedReferrer && (created as any)?.id) {
        await supabase
          .from('promo_codes')
          .update({ referrer_user_id: selectedReferrer, referrer_level: referrerLevel || null } as any)
          .eq('id', (created as any).id);
      }

      // Write log
      await supabase.from('promo_code_logs').insert({
        promo_code_id: (created as any).id,
        action: 'created',
        code: newCode.toUpperCase(),
        discount_percent: parseInt(newDiscount) || 0,
        bonus_stars: parseInt(newBonusStars) || 0,
        bonus_days: parseInt(newBonusDays) || 0,
        max_uses: newMaxUses ? parseInt(newMaxUses) : null,
        valid_until: newValidUntil || null,
        referrer_user_id: selectedReferrer || null,
        referrer_level: referrerLevel || null,
        created_by: user.id,
        description: newDescription || null,
      });

      toast.success('Промо-код создан');
      refetch();

      // Reset form
      setNewCode('');
      setNewDiscount('');
      setNewValidUntil('');
      setNewMaxUses('');
      setNewBonusStars('');
      setNewBonusDays('');
      setNewDescription('');
      setSelectedReferrer('');
      setReferrerLevel('');
      setUserSearch('');
      setUserOptions([]);
    } catch (err: any) {
      console.error(err);
      toast.error('Ошибка создания промо-кода');
    } finally {
      setCreating(false);
    }
  };

  // Fetch logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_code_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLogs((data as PromoLog[]) || []);
    } catch {
      toast.error('Ошибка загрузки логов');
    } finally {
      setLogsLoading(false);
    }
  };

  const openLogs = () => {
    setLogsOpen(true);
    fetchLogs();
  };

  // Export helpers
  const logsToText = (logs: PromoLog[]) => {
    return logs.map(l =>
      `[${format(new Date(l.created_at), 'dd.MM.yyyy HH:mm')}] ${l.action.toUpperCase()} | Код: ${l.code} | Скидка: ${l.discount_percent}% | ⭐${l.bonus_stars} | +${l.bonus_days}дн | Макс: ${l.max_uses ?? '∞'} | До: ${l.valid_until ? format(new Date(l.valid_until), 'dd.MM.yyyy') : '—'} | Реферер: ${l.referrer_user_id?.slice(0, 8) || '—'} | Уровень: ${l.referrer_level || '—'}`
    ).join('\n');
  };

  const exportTXT = () => {
    const blob = new Blob([logsToText(logs)], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, 'promo-codes-log.txt');
  };

  const exportCSV = () => {
    const header = 'Дата,Действие,Код,Скидка%,Звёзды,Дни,Макс,Действует до,Реферер,Уровень\n';
    const rows = logs.map(l =>
      `${format(new Date(l.created_at), 'dd.MM.yyyy HH:mm')},${l.action},${l.code},${l.discount_percent},${l.bonus_stars},${l.bonus_days},${l.max_uses ?? ''},${l.valid_until ? format(new Date(l.valid_until), 'dd.MM.yyyy') : ''},${l.referrer_user_id?.slice(0, 8) || ''},${l.referrer_level || ''}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
    downloadBlob(blob, 'promo-codes-log.csv');
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Лог промо-кодов', 14, 15);
    doc.setFontSize(8);
    let y = 25;
    logs.forEach((l, i) => {
      if (y > 190) { doc.addPage(); y = 15; }
      const line = `${format(new Date(l.created_at), 'dd.MM.yyyy HH:mm')} | ${l.code} | -${l.discount_percent}% | ⭐${l.bonus_stars} | +${l.bonus_days}дн | Макс: ${l.max_uses ?? '∞'} | Реферер: ${l.referrer_user_id?.slice(0, 8) || '—'}`;
      doc.text(line, 14, y);
      y += 5;
    });
    doc.save('promo-codes-log.pdf');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Код скопирован');
  };

  const selectedReferrerName = userOptions.find(u => u.user_id === selectedReferrer)?.display_name;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-purple-500" />
              Промо-коды
            </div>
            <Button variant="outline" size="sm" onClick={openLogs} className="gap-1">
              <FileText className="w-3.5 h-3.5" />
              Лог
            </Button>
          </CardTitle>
          <CardDescription>Создание и управление промо-кодами с привязкой к партнёру</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code + Generate */}
          <div className="flex gap-2">
            <Input
              placeholder="Код (напр. TF-PARTNER1)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={generateUniqueCode} title="Сгенерировать уникальный код">
              <Wand2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Discount + Stars + Days */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Скидка %</Label>
              <Input type="number" value={newDiscount} onChange={e => setNewDiscount(e.target.value)} min="0" max="100" />
            </div>
            <div>
              <Label className="text-xs">⭐ Звёзды</Label>
              <Input type="number" value={newBonusStars} onChange={e => setNewBonusStars(e.target.value)} min="0" />
            </div>
            <div>
              <Label className="text-xs">+ Дни</Label>
              <Input type="number" value={newBonusDays} onChange={e => setNewBonusDays(e.target.value)} min="0" />
            </div>
          </div>

          {/* Valid until + Max uses */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Действует до</Label>
              <Input type="date" value={newValidUntil} onChange={e => setNewValidUntil(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Макс. исп.</Label>
              <Input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} min="1" />
            </div>
          </div>

          {/* Referrer search */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Привязать к партнёру (рефереру)
            </Label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Поиск по имени..."
                value={userSearch}
                onChange={e => searchUsers(e.target.value)}
              />
            </div>
            {userOptions.length > 0 && (
              <div className="mt-1 border rounded-md max-h-32 overflow-y-auto bg-popover">
                {userOptions.map(u => (
                  <button
                    key={u.user_id}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${selectedReferrer === u.user_id ? 'bg-primary/10 font-medium' : ''}`}
                    onClick={() => {
                      setSelectedReferrer(u.user_id);
                      setUserSearch(u.display_name || u.user_id.slice(0, 8));
                      setUserOptions([]);
                    }}
                  >
                    {u.display_name || u.user_id.slice(0, 8)}
                    <span className="text-xs text-muted-foreground ml-2">ID: {u.user_id.slice(0, 8)}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedReferrer && (
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  Партнёр: {selectedReferrerName || selectedReferrer.slice(0, 8)}
                </Badge>
                <button className="text-xs text-destructive hover:underline" onClick={() => { setSelectedReferrer(''); setUserSearch(''); }}>
                  Убрать
                </button>
              </div>
            )}
          </div>

          {/* Referrer Level */}
          {selectedReferrer && (
            <div>
              <Label className="text-xs">Уровень партнёра</Label>
              <Select value={referrerLevel} onValueChange={setReferrerLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Выбрать уровень" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_free">Уровень 1 FREE</SelectItem>
                  <SelectItem value="1_pro">Уровень 1 PRO</SelectItem>
                  <SelectItem value="2_free">Уровень 2 FREE</SelectItem>
                  <SelectItem value="2_pro">Уровень 2 PRO</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div>
            <Label className="text-xs">Описание (опционально)</Label>
            <Input value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Промо для партнёра X" />
          </div>

          <Button className="w-full" disabled={!newCode || creating} onClick={handleCreate}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Создать промо-код
          </Button>

          {/* Existing codes list */}
          {promoLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : promoCodes.length > 0 ? (
            <ScrollArea className="max-h-[350px]">
              <div className="space-y-2">
                {promoCodes.map(code => (
                  <div key={code.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono font-bold text-sm">{code.code}</p>
                        <Badge variant="outline" className="text-xs">-{code.discount_percent}%</Badge>
                        {(code as any).referrer_user_id && (
                          <Badge variant="secondary" className="text-[10px]">
                            👤 Партнёр
                          </Badge>
                        )}
                        {(code as any).referrer_level && (
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {(code as any).referrer_level}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Исп: {code.current_uses}{code.max_uses !== null ? `/${code.max_uses}` : ''}
                        {code.valid_until && <> • до {format(new Date(code.valid_until), 'dd.MM.yyyy')}</>}
                        {code.bonus_stars > 0 && <> • ⭐{code.bonus_stars}</>}
                        {code.bonus_days > 0 && <> • +{code.bonus_days}дн</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyCode(code.code)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Switch checked={code.is_active} onCheckedChange={(v) => togglePromoCode(code.id, v)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deletePromoCode(code.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm">Нет промо-кодов</div>
          )}
        </CardContent>
      </Card>

      {/* Logs Dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Лог создания промо-кодов
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={exportTXT} className="gap-1">
              <Download className="w-3.5 h-3.5" /> TXT
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1">
              <Download className="w-3.5 h-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            {logsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Нет записей</div>
            ) : (
              <div className="space-y-2 pr-2">
                {logs.map(log => (
                  <div key={log.id} className="p-3 rounded-lg border bg-card text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold">{log.code}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 space-x-2">
                      <span>-{log.discount_percent}%</span>
                      {log.bonus_stars > 0 && <span>⭐{log.bonus_stars}</span>}
                      {log.bonus_days > 0 && <span>+{log.bonus_days}дн</span>}
                      {log.max_uses && <span>Макс: {log.max_uses}</span>}
                      {log.valid_until && <span>до {format(new Date(log.valid_until), 'dd.MM.yyyy')}</span>}
                      {log.referrer_level && <span className="capitalize">Ур: {log.referrer_level}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
