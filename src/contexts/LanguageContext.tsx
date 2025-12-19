import { createContext, useContext, ReactNode } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { Language, TranslationKey } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  getLocale: () => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const languageUtils = useLanguage();
  
  return (
    <LanguageContext.Provider value={languageUtils}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export { useLanguage } from '@/hooks/useLanguage';
