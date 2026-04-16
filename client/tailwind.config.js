/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        prime: {
          bg:      '#080E14',
          surface: '#0F1923',
          hover:   '#16212E',
          card:    '#111D28',
          blue:    '#00B4FF',
          cyan:    '#00D4FF',
          purple:  '#7C3AED',
          text:    '#FFFFFF',
          subtext: '#6B8499',
          muted:   '#3A4E5E',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient-x': 'linear-gradient(to right, #080E14 0%, #080E1480 55%, transparent 100%)',
        'hero-gradient-y': 'linear-gradient(to top, #080E14 0%, #080E1499 20%, transparent 50%)',
        'card-shine':      'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
        'blue-glow':       'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,180,255,0.15) 0%, transparent 70%)',
        'purple-glow':     'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)',
      },
      boxShadow: {
        'card':        '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hover':  '0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,180,255,0.25)',
        'glow-blue':   '0 0 30px rgba(0,180,255,0.35), 0 0 60px rgba(0,180,255,0.15)',
        'glow-sm':     '0 0 12px rgba(0,180,255,0.4)',
        'navbar':      '0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.4)',
      },
      borderColor: {
        'glass': 'rgba(255,255,255,0.07)',
        'glass-hover': 'rgba(255,255,255,0.14)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'fade-up':    'fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-up':   'slideUp 0.4s ease-out',
        'shimmer':    'shimmer 1.8s infinite',
        'float':      'float 3s ease-in-out infinite',
        'pulse-blue': 'pulseBlue 2s ease-in-out infinite',
        'spin-slow':  'spin 4s linear infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        pulseBlue: { '0%,100%': { boxShadow: '0 0 12px rgba(0,180,255,0.3)' }, '50%': { boxShadow: '0 0 28px rgba(0,180,255,0.6)' } },
      },
    },
  },
  plugins: [],
};
