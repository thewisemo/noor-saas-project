'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light';
const STORAGE_KEY = 'noor-theme';

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'dark';
    applyTheme(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTheme = (next: ThemeMode) => {
    setMode(next);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('theme-dark', 'theme-light');
      root.classList.add(next === 'light' ? 'theme-light' : 'theme-dark');
    }
    localStorage.setItem(STORAGE_KEY, next);
  };

  const toggle = () => {
    applyTheme(mode === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-full border border-gray-700/60 bg-transparent px-3 py-1.5 text-xs text-gray-300 shadow-inner hover:border-accent hover:text-white transition"
    >
      {mode === 'dark' ? 'وضع فاتح' : 'وضع داكن'}
    </button>
  );
}

