import { useState, useEffect } from 'react';

const STORAGE_KEY = 'e-stitch-landing-theme';
type Theme = 'light' | 'dark';

function getStored(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch (_) {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getStored());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
  }, [theme]);

  const setTheme = (next: Theme) => setThemeState(next);
  const toggle = () => setThemeState((t) => (t === 'light' ? 'dark' : 'light'));

  return { theme, setTheme, toggle, isDark: theme === 'dark' };
}
