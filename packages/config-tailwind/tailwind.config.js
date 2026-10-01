/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#0F172A',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#060B14',
        },
        royal: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        dommia: {
          gray: '#F8FAFC',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          accent: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        card: '0 4px 20px -2px rgb(0 0 0 / 0.05), 0 2px 6px -1px rgb(0 0 0 / 0.02)',
        'card-hover': '0 12px 30px -4px rgb(0 0 0 / 0.08), 0 4px 12px -2px rgb(0 0 0 / 0.04)',
        'glow-blue': '0 0 24px -4px rgba(37, 99, 235, 0.35)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 24px -4px rgba(239, 68, 68, 0.35)',
        'dark-card': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scale-in 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [],
};
