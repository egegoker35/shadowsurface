'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative w-14 h-8 rounded-full bg-slate-800 dark:bg-slate-700 border border-slate-600 dark:border-slate-500 transition-colors duration-300 flex items-center px-1"
      aria-label="Toggle theme"
    >
      <div
        className={`w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center text-xs transition-transform duration-300 ${
          theme === 'dark' ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? '🌙' : '☀️'}
      </div>
    </button>
  );
}
