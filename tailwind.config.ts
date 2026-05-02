import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        slate: { 850: '#1e293b', 900: '#0f172a' },
        emerald: { 450: '#10b981' },
      },
    },
  },
  plugins: [],
};

export default config;
