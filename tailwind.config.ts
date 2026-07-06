import type { Config } from 'tailwindcss';

// Central design system. Components must reference these tokens, never raw hex.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#17181C',
        card: '#212329',
        border: { DEFAULT: '#2A2C33', strong: '#31333B' },
        text: { DEFAULT: '#ECEDEF', muted: '#8B8D96', dim: '#6E7079' },
        accent: { DEFAULT: '#E7E8EC', ink: '#14151A' },
        profit: '#4ADE9E',
        loss: '#F98080',
        star: '#EAB94D',
        tag: {
          red: '#F87171',
          orange: '#FB923C',
          amber: '#FBBF24',
          green: '#4ADE9E',
          teal: '#2DD4BF',
          blue: '#60A5FA',
          violet: '#A78BFA',
          pink: '#F472B6',
        },
      },
      fontFamily: { sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '14px', input: '10px' },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        pageFade: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out both',
        'page-fade': 'pageFade 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
