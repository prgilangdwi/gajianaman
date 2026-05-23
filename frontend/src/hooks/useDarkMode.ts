import { useEffect, useState } from 'react';

const DARK_MODE_KEY = 'gajian_aman_darkmode';

type DarkModePreference = 'light' | 'dark';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem(DARK_MODE_KEY) as DarkModePreference | null;

    const shouldBeDark = stored === 'dark';

    setIsDarkMode(shouldBeDark);
    applyDarkMode(shouldBeDark);
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    const newValue = !isDarkMode;
    setIsDarkMode(newValue);
    applyDarkMode(newValue);
    localStorage.setItem(DARK_MODE_KEY, newValue ? 'dark' : 'light');
  };

  return {
    isDarkMode,
    mounted,
    toggleDarkMode,
  };
}

function applyDarkMode(dark: boolean) {
  const html = document.documentElement;
  if (dark) {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
}
