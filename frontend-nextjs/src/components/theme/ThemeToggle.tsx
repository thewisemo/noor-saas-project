'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/cn';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="h-9 w-16 animate-pulse rounded-full border border-gray-300/40 dark:border-white/10 bg-white/20 dark:bg-white/5" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'flex items-center justify-between rounded-full px-3 py-1 text-xs font-semibold transition',
        'border border-gray-200/70 dark:border-white/10 shadow-sm',
        isDark ? 'bg-white/5 text-white' : 'bg-white text-gray-700'
      )}
      aria-label="تبديل الثيم"
    >
      <span>{isDark ? 'وضع فاتح' : 'وضع داكن'}</span>
      <span
        className={cn(
          'ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.6rem]',
          isDark ? 'bg-white text-gray-900' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white'
        )}
      >
        {isDark ? '☾' : '☀︎'}
      </span>
    </button>
  );
}

