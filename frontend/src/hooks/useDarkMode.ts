import { useEffect, useState } from 'react';

const DARK_MODE_KEY = 'gajian_aman_darkmode';

type DarkModePreference = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  // Initialize dark mode on mount
  useEffect(() => {
    // Get stored preference
    const stored = localStorage.getItem(DARK_MODE_KEY) as DarkModePreference | null;

    let shouldBeDark = false;
    if (stored === 'dark') {
      shouldBeDark = true;
    } else if (stored === 'light') {
      shouldBeDark = false;
    } else {
      // Use system preference (default)
      shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    setIsDarkMode(shouldBeDark);
    applyDarkMode(shouldBeDark);
    setMounted(true);
  }, []);

  // Listen to system preference changes when using 'system' mode
  useEffect(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY) as DarkModePreference | null;

    // Only listen if user hasn't explicitly set a preference
    if (stored !== 'light' && stored !== 'dark') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
        applyDarkMode(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    applyDarkMode(newValue);
    localStorage.setItem(DARK_MODE_KEY, newValue ? 'dark' : 'light');
  };

  const setSystemPreference = () => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(systemDark);
    applyDarkMode(systemDark);
    localStorage.removeItem(DARK_MODE_KEY);
  };

  return {
    isDarkMode,
    mounted,
    toggleDarkMode,
    setSystemPreference,
  };
}

// Helper function to apply dark mode to the document
function applyDarkMode(dark: boolean) {
  const html = document.documentElement;
  if (dark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}
