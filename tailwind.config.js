/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-plex-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // SIM-CPL: tinta & kertas untuk struktur, warna hanya untuk status capaian.
        ink: {
          950: '#0e1311',
          900: '#161b19',
          800: '#232a27',
          700: '#39413d',
          600: '#4f5853',
          500: '#646e69',
          400: '#8a938e',
          300: '#b3bab6',
          200: '#d2d8d4',
          100: '#e5e9e6',
          50: '#f2f4f3',
        },
        canvas: '#eef1ef',
        line: { DEFAULT: '#dbe0dd', strong: '#c3cac6' },
        brand: { DEFAULT: '#1d7a52', soft: '#e1f0e8', bright: '#5fcf98' },
        ok: { DEFAULT: '#23804f', fg: '#155c37', bg: '#e3f2e9' },
        warn: { DEFAULT: '#c48a12', fg: '#7a5206', bg: '#fbf1d9' },
        bad: { DEFAULT: '#c8442e', fg: '#9a2d1b', bg: '#fae4df' },
        none: { DEFAULT: '#9aa39f', fg: '#4f5853', bg: '#eef1ef' },

        // Token shadcn (dipakai komponen di src/components/ui).
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 3px)',
      },
      boxShadow: {
        pop: '0 12px 32px -12px rgba(14, 19, 17, 0.28), 0 2px 6px -2px rgba(14, 19, 17, 0.12)',
      },
      maxWidth: { page: '1280px' },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
