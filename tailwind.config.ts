import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        serif: ['var(--font-serif)', 'Iowan Old Style', 'Georgia', 'serif'],
      },
      colors: {
        slate: { 850: '#1e293b', 900: '#0f172a' },
        emerald: { 450: '#10b981' },
        // Marketing surface: warm ink rather than blue-black, so the page reads as a printed
        // document instead of a dashboard. Body copy sits on `dim`, labels on `faint`.
        ink: '#0B0B0A',
        ink2: '#131312',
        paper: '#F2EFE7',
        cream: '#EDE8DD',
        dim: '#B5B0A7',
        faint: '#8C877E',
        // Accent. A single saturated hue used for structure (rules, active states, primary
        // actions) keeps the page colourful without turning it into a gradient template.
        jade: '#57B893',
        jadeLight: '#8FD9BE',
        jadeDeep: '#0E2A22',
        // Secondary accents. Used only for structure — section markers, tier bars, numbered
        // lists — so the page carries more than one hue without becoming a rainbow.
        steel: '#7FA6CC',
        clay: '#D08A5C',
      },
    },
  },
  plugins: [],
};

export default config;
