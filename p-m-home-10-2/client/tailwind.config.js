/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Map Tailwind classes to CSS variables for theming
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-fg)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-fg)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-fg)',
        },
        border: 'var(--border)',
        ring: 'var(--ring)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-fg)',
        },
        secondary: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--fg)',
        },
        destructive: {
          DEFAULT: 'var(--danger)',
          foreground: 'var(--danger-fg)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-fg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-fg)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-fg)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        'card': '1rem',
        'card-sm': '0.75rem',
      },
      boxShadow: {
        'header': '0 1px 3px 0 rgb(0 0 0 / 0.05)',
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
};
