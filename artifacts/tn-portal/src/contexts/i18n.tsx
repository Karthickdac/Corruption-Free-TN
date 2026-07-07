import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isTa: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app-lang');
    return (saved === 'en' || saved === 'ta') ? saved : 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  const t = (key: TranslationKey) => {
    return translations[lang][key] || translations['en'][key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, isTa: lang === 'ta' }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
