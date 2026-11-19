/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
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
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'bounce-slight': {
          '0%, 100%': { transform: 'translateY(-5%)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        }
      },
      animation: {
        'fade-spin': 'fade-spin 1.2s linear infinite',
        wiggle: 'wiggle 1s ease-in-out infinite',
        'bounce-slight': 'bounce-slight 1s infinite',
      }
    },
  },
  plugins: [],
}