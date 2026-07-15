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
        // ── Loyalty Centre design tokens ──────────────────────────────────
        ink: {
          DEFAULT: '#0C0907',
          2: '#131009',
          3: '#1A1410',
        },
        cream: {
          DEFAULT: '#F0E8D8',
          2: '#C8B898',
        },
        amber: {
          DEFAULT: '#FF4F00',
          soft: '#FF7033',
          pale: 'rgba(255,79,0,0.08)',
        },
        muted: {
          DEFAULT: '#7A6A54',
          2: '#5A4A38',
        },
        tier: {
          bronze: '#CD7F32',
          silver: '#A8B8C8',
          gold:   '#E8C840',
        },
        // Keep orange scale for the sticky header gradient
        orange: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      fontFamily: {
        serif:   ['Cormorant Garamond', 'Georgia', 'serif'],
        mono:    ['DM Mono', 'Courier New', 'monospace'],
        sans:    ['Lato', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.35s ease forwards',
        'pulse-slow': 'pulse-slow 2s ease-in-out infinite',
        'bounce-once':'bounceOnce 0.45s ease-out',
        'shake':      'shake 0.45s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.85' },
        },
        bounceOnce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
      },
    },
  },
  plugins: [],
}
