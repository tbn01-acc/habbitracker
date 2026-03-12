import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Lock, Palette, Star, Sun, Moon } from 'lucide-react';
import { CustomTheme } from '@/hooks/useCustomTheme';
import { useTranslation } from '@/contexts/LanguageContext';

interface ThemePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  theme: CustomTheme | null;
  isOwned: boolean;
  isActive: boolean;
  onApply: () => void;
}

export function ThemePreviewDialog({
  open,
  onOpenChange,
  theme,
  isOwned,
  isActive,
  onApply,
}: ThemePreviewDialogProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';

  if (!theme) return null;

  // Generate preview colors from CSS variables
  const getPreviewColor = (cssVar: string) => {
    const value = theme.cssVariables[cssVar];
    if (!value) return '#888';
    if (value.startsWith('linear-gradient')) return value;
    return `hsl(${value})`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {isRussian ? `Тема "${theme.name}"` : `Theme "${theme.name}"`}
            {theme.isDark ? (
              <Moon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Sun className="h-4 w-4 text-yellow-500" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Theme Preview Card */}
          <div
            className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: getPreviewColor('--background'),
              border: `1px solid ${getPreviewColor('--border')}`,
            }}
          >
            {/* Glass effect overlay */}
            <div
              className="absolute inset-0 backdrop-blur-sm"
              style={{
                background: `linear-gradient(135deg, 
                  ${getPreviewColor('--card')}80 0%, 
                  ${getPreviewColor('--card')}40 100%)`,
              }}
            />

            <div className="relative space-y-3">
              {/* Sample header */}
              <div className="flex items-center justify-between">
                <div
                  className="text-lg font-bold"
                  style={{ color: getPreviewColor('--foreground') }}
                >
                  ТопФокус
                </div>
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                  style={{
                    background: getPreviewColor('--primary'),
                    color: getPreviewColor('--primary-foreground'),
                  }}
                >
                  <Star className="h-3 w-3" />
                  128
                </div>
              </div>

              {/* Sample cards */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: getPreviewColor('--card'),
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ color: getPreviewColor('--muted-foreground') }}
                  >
                    {isRussian ? 'Привычки' : 'Habits'}
                  </div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: getPreviewColor('--foreground') }}
                  >
                    5/7
                  </div>
                </div>
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: getPreviewColor('--secondary'),
                  }}
                >
                  <div
                    className="text-xs mb-1"
                    style={{ color: getPreviewColor('--muted-foreground') }}
                  >
                    {isRussian ? 'Задачи' : 'Tasks'}
                  </div>
                  <div
                    className="text-xl font-bold"
                    style={{ color: getPreviewColor('--foreground') }}
                  >
                    12
                  </div>
                </div>
              </div>

              {/* Sample button */}
              <div
                className="rounded-lg p-2 text-center text-sm font-medium"
                style={{
                  background: getPreviewColor('--gradient-primary'),
                  color: getPreviewColor('--primary-foreground'),
                }}
              >
                {isRussian ? 'Кнопка действия' : 'Action Button'}
              </div>

              {/* Accent element */}
              <div
                className="h-1 rounded-full"
                style={{
                  background: getPreviewColor('--accent'),
                }}
              />
            </div>
          </div>

          {/* Color palette preview */}
          <div className="flex gap-2 justify-center">
            {['--primary', '--accent', '--secondary', '--muted'].map((varName) => (
              <div
                key={varName}
                className="w-8 h-8 rounded-full shadow-md"
                style={{ background: getPreviewColor(varName) }}
                title={varName.replace('--', '')}
              />
            ))}
          </div>

          {/* Status badges */}
          <div className="flex items-center justify-center gap-2">
            <Badge variant={theme.isDark ? 'secondary' : 'outline'}>
              {theme.isDark
                ? isRussian
                  ? 'Тёмная'
                  : 'Dark'
                : isRussian
                ? 'Светлая'
                : 'Light'}
            </Badge>
            <Badge variant="outline" className="bg-primary/10">
              Aqua Glass Material
            </Badge>
          </div>

          {/* Action button */}
          {isOwned ? (
            <Button
              onClick={onApply}
              className="w-full"
              variant={isActive ? 'secondary' : 'default'}
            >
              {isActive ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {isRussian ? 'Активна' : 'Active'}
                </>
              ) : (
                <>
                  <Palette className="h-4 w-4 mr-2" />
                  {isRussian ? 'Применить тему' : 'Apply Theme'}
                </>
              )}
            </Button>
          ) : (
            <Button disabled className="w-full" variant="outline">
              <Lock className="h-4 w-4 mr-2" />
              {isRussian ? 'Купите в магазине' : 'Purchase in Shop'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
