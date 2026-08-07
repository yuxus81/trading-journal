import type { Config } from 'tailwindcss';

// Central design system. Components must reference these tokens, never raw hex.
//
// Colour discipline (the reason this journal does not look generic):
//   • Neutrals carry the layout — background, surfaces, text, borders.
//   • `profit` / `loss` are SEMANTIC and reserved for money outcomes only.
//   • `brand` (violet) means "you are here / this is selected" — never a P&L.
//   • `tag-*` are identity colours the user assigns to setups, assets, news.
// Nothing else gets colour. That keeps the monochrome character while every
// coloured pixel still carries meaning.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0E11',
        card: '#15171C',
        // One step above the card: popovers, hovered rows, inset wells.
        raised: '#1B1E25',
        border: { DEFAULT: '#24262E', strong: '#343741' },
        // `dim` is lighter than it looks like it should be on purpose: at
        // #71747E it only reached 3.9:1 on the card surface, below the 4.5:1
        // needed for the small labels it is used for.
        text: { DEFAULT: '#EDEEF1', muted: '#9A9DA7', dim: '#82858D' },
        // The white "ink" button stays the primary CTA — it is the one thing
        // brighter than the data.
        accent: { DEFAULT: '#E7E8EC', ink: '#0D0E11' },
        brand: { DEFAULT: '#8B85EA', bright: '#ABA4FF', deep: '#5B54B8' },
        profit: { DEFAULT: '#3ED598', deep: '#1E7A55' },
        loss: { DEFAULT: '#F87171', deep: '#8E3436' },
        star: '#EAB94D',
        tag: {
          red: '#F87171',
          orange: '#FB923C',
          amber: '#FBBF24',
          green: '#3ED598',
          teal: '#2DD4BF',
          blue: '#60A5FA',
          violet: '#A78BFA',
          pink: '#F472B6',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        // Tabular figures for every number that sits in a column.
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '14px', input: '10px' },
      boxShadow: {
        pop: '0 16px 40px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
        lift: '0 8px 24px -12px rgba(0,0,0,0.8)',
      },
      transitionTimingFunction: {
        // One easing for the whole app: fast out, soft settle.
        out: 'cubic-bezier(0.22,1,0.36,1)',
      },
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
        riseIn: {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        popIn: {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulseDot: {
          '0%,100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to: { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out both',
        'page-fade': 'pageFade 0.4s cubic-bezier(0.22,1,0.36,1) both',
        'slide-in-right': 'slideInRight 0.25s cubic-bezier(0.22,1,0.36,1) both',
        'rise-in': 'riseIn 0.42s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'popIn 0.16s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-dot': 'pulseDot 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
