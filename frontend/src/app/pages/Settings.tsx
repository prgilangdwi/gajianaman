import { useState, useEffect } from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useDarkMode } from '@/hooks/useDarkMode';
import { cn } from '@/lib/utils';

type Language = 'id' | 'en';

const LANGUAGE_KEY = 'gajian_aman_language';

export default function Settings() {
  const { isDarkMode, mounted, toggleDarkMode } = useDarkMode();
  const [language, setLanguage] = useState<Language>('id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null;
    setLanguage(stored || 'id');
    setIsLoading(false);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(LANGUAGE_KEY, lang);
    // Trigger app-wide language change (to be implemented with i18n)
    window.dispatchEvent(new CustomEvent('languageChange', { detail: { language: lang } }));
  };

  const translations = {
    id: {
      title: 'Pengaturan',
      darkMode: 'Mode Gelap',
      darkModeDesc: 'Gunakan tema gelap untuk melindungi mata Anda',
      language: 'Bahasa',
      languageDesc: 'Pilih bahasa antarmuka',
      indonesian: 'Indonesia',
      english: 'English',
      on: 'Aktif',
      off: 'Matikan',
    },
    en: {
      title: 'Settings',
      darkMode: 'Dark Mode',
      darkModeDesc: 'Use dark theme to protect your eyes',
      language: 'Language',
      languageDesc: 'Select your interface language',
      indonesian: 'Indonesia',
      english: 'English',
      on: 'On',
      off: 'Off',
    },
  };

  const t = translations[language];

  if (isLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-[var(--color-content-secondary)]">
          Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[var(--color-content-primary)]">
          {t.title}
        </h1>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Dark Mode Section */}
        <div className="rounded-lg border border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)] p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
 <Moon className="size-5 text-[var(--color-brand-primary)]" />
                ) : (
 <Sun className="size-5 text-[var(--color-brand-primary)]" />
                )}
                <h2 className="text-lg font-semibold text-[var(--color-content-primary)]">
                  {t.darkMode}
                </h2>
              </div>
              <p className="text-sm text-[var(--color-content-secondary)]">
                {t.darkModeDesc}
              </p>
            </div>
            <Button
              onClick={toggleDarkMode}
              variant={isDarkMode ? 'default' : 'outline'}
              className={cn(
                'transition-colors',
                isDarkMode
                  ? 'bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white'
                  : 'border-[var(--color-border-neutral)] text-[var(--color-content-primary)]'
              )}
            >
              {isDarkMode ? t.on : t.off}
            </Button>
          </div>
        </div>

        {/* Language Section */}
        <div className="rounded-lg border border-[var(--color-border-neutral)] bg-[var(--color-bg-elevated)] p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
 <Globe className="size-5 text-[var(--color-brand-primary)]" />
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-content-primary)]">
                  {t.language}
                </h2>
                <p className="text-sm text-[var(--color-content-secondary)]">
                  {t.languageDesc}
                </p>
              </div>
            </div>

            {/* Language Options */}
            <div className="flex gap-3">
              {(['id', 'en'] as const).map((lang) => (
                <Button
                  key={lang}
                  onClick={() => handleLanguageChange(lang)}
                  variant={language === lang ? 'default' : 'outline'}
                  className={cn(
                    'transition-colors',
                    language === lang
                      ? 'bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-dark)] text-white'
                      : 'border-[var(--color-border-neutral)] text-[var(--color-content-primary)]'
                  )}
                >
                  {lang === 'id' ? t.indonesian : t.english}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
