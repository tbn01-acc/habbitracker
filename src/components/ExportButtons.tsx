import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/contexts/LanguageContext';

interface ExportButtonsProps {
  onExportCSV: () => void;
  onExportPDF: () => void;
  accentColor?: string;
}

export function ExportButtons({ onExportCSV, onExportPDF, accentColor }: ExportButtonsProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="w-9 h-9"
          style={accentColor ? { color: accentColor } : undefined}
        >
          <Download className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onExportCSV} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          {t('exportToCsv')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
          <FileText className="w-4 h-4 mr-2" />
          {t('exportToPdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
