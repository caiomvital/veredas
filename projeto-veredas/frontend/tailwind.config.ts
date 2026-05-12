import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          foreground: 'var(--color-secondary-foreground)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-muted)',
          alt: 'var(--color-surface-alt)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        sidebar: {
          bg: 'var(--color-sidebar-bg)',
          text: 'var(--color-sidebar-text)',
          hover: 'var(--color-sidebar-hover)',
          active: 'var(--color-sidebar-active)',
        },
        // ── ZAB Escola ──
        'zab-verde': {
          DEFAULT: '#1B5E20',
          hover: '#2E7D32',
          escuro: '#1B3C1A',
          footer: '#0D1F0E',
          claro: '#E8F5E9',
          'claro-2': '#C8E6C9',
          'claro-3': '#A5D6A7',
        },
        'zab-dourado': {
          DEFAULT: '#B8860B',
          hover: '#A0760A',
          claro: '#FFF8E1',
        },
        'zab-amber': {
          DEFAULT: '#FCD34D',
        },
        'zab-creme': {
          DEFAULT: '#FEFCF3',
        },
        'zab-texto': {
          DEFAULT: '#4B5563',
          claro: '#6B7280',
          escuro: '#1F2937',
        },
        'zab-off-white': {
          DEFAULT: '#F5F5F0',
        },
        'zab-footer': {
          DEFAULT: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [],
}

export default config
