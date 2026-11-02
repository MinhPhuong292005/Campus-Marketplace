/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Ghi đè hệ thống mã màu theo Design Tokens của Campus Marketplace
        campus: {
          blue: {
            50: 'hsl(var(--color-primary-50) / <alpha-value>)',
            100: 'hsl(var(--color-primary-100) / <alpha-value>)',
            500: 'hsl(var(--color-primary-500) / <alpha-value>)',
            600: 'hsl(var(--color-primary-600) / <alpha-value>)',
            700: 'hsl(var(--color-primary-700) / <alpha-value>)',
          },
          emerald: {
            50: 'hsl(var(--color-secondary-50) / <alpha-value>)',
            500: 'hsl(var(--color-secondary-500) / <alpha-value>)',
            600: 'hsl(var(--color-secondary-600) / <alpha-value>)',
          },
          amber: {
            50: 'hsl(var(--color-accent-amber-50) / <alpha-value>)',
            500: 'hsl(var(--color-accent-amber-500) / <alpha-value>)',
          },
          purple: {
            50: 'hsl(var(--color-accent-purple-50) / <alpha-value>)',
            500: 'hsl(var(--color-accent-purple-500) / <alpha-value>)',
          },
          pink: {
            50: 'hsl(var(--color-accent-pink-50) / <alpha-value>)',
            500: 'hsl(var(--color-accent-pink-500) / <alpha-value>)',
          },
          surface: {
            light: 'hsl(var(--color-surface-light) / <alpha-value>)',
            dark: 'hsl(var(--color-surface-dark) / <alpha-value>)',
          },
          bg: {
            light: 'hsl(var(--color-bg-light) / <alpha-value>)',
            dark: 'hsl(var(--color-bg-dark) / <alpha-value>)',
          }
        },
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Be Vietnam Pro"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'campus': '14px',
      }
    },
  },
  plugins: [],
}
