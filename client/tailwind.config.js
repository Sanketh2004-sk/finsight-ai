/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        darkCard: '#121824',
        glassBg: 'rgba(18, 24, 36, 0.65)',
        glassBorder: 'rgba(255, 255, 255, 0.06)',
        accentPrimary: '#6366f1',
        accentSecondary: '#4f46e5',
        textMuted: '#8f9cae',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
