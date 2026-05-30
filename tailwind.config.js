/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'context-card-border': 'var(--context-card-border)',
        'blue-900': 'var(--ds-blue-900)',
        'gray-200': 'var(--ds-gray-200)',
        'gray-alpha-100': 'var(--ds-gray-alpha-100)',
        'gray-alpha-300': 'var(--ds-gray-alpha-300)',
        'accents-2': 'var(--accents-2)',
        'red-800': 'var(--ds-red-800)',
        'red-900': 'var(--ds-red-900)',
        'blue-700': 'var(--ds-blue-700)',
        'amber-800': 'var(--ds-amber-800)',
        'amber-850': 'var(--ds-amber-850)',
        'gray-100': 'var(--ds-gray-100)',
        'gray-400': 'var(--ds-gray-400)',
        'gray-700': 'var(--ds-gray-700)',
        'gray-1000': 'var(--ds-gray-1000)',
        'gray-1000-h': 'var(--ds-gray-1000-h)',
        'gray-alpha-200': 'var(--ds-gray-alpha-200)',
        'gray-alpha-400': 'var(--ds-gray-alpha-400)',
        'background-100': 'var(--ds-background-100)',
        'gray-900': 'var(--ds-gray-900)',
        'gray-alpha-500': 'var(--ds-gray-alpha-500)',
        'gray-alpha-600': 'var(--ds-gray-alpha-600)',
        'background-200': 'var(--ds-background-200)',
        'geist-foreground': 'var(--geist-foreground)',
        'red-900-alpha-160': 'var(--ds-red-900-alpha-160)',
        'red-300': 'var(--ds-red-300)',
        'red-500': 'var(--ds-red-500)',
        'error': 'var(--geist-error)',
      },
      boxShadow: {
        'focus-calendar-date': 'var(--ds-focus-calendar-date-ring)',
        'focus-ring': 'var(--ds-focus-ring)',
        'border-small': 'var(--ds-shadow-border-small)',
        'border': 'var(--ds-shadow-border)',
        'border-medium': 'var(--ds-shadow-border-medium)',
        'border-large': 'var(--ds-shadow-border-large)',
        'tooltip': 'var(--ds-shadow-tooltip)',
        'menu': 'var(--ds-shadow-menu)',
        'modal': 'var(--ds-shadow-modal)',
        'fullscreen': 'var(--ds-shadow-fullscreen)',
        'focus-input': 'var(--ds-input-ring)',
        'error-input': 'var(--ds-input-error-ring)',
        'error-input-hover': 'var(--ds-input-error-hover-ring)',
      },
      keyframes: {
        'fade-spin': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' }
        }
      },
      animation: {
        'fade-spin': 'fade-spin 1.2s linear infinite'
      }
    },
  },
  plugins: [],
}