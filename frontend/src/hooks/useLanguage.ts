import { useState, useEffect } from 'react';

type Language = 'id' | 'en';
const LANGUAGE_KEY = 'gajian_aman_language';

export function useLanguage(): Language {
  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem(LANGUAGE_KEY) as Language) || 'id'
  );

  useEffect(() => {
    const handler = (e: Event) => {
      setLanguage((e as CustomEvent<{ language: Language }>).detail.language);
    };
    window.addEventListener('languageChange', handler);
    return () => window.removeEventListener('languageChange', handler);
  }, []);

  return language;
}
