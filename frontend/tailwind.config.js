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
        /* Legacy brand tokens (authenticated app) */
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        /* Peerity core brand palette */
        peerity: {
          50:  '#FEFFFF',   /* near-white page background */
          100: '#DEF2F1',   /* light teal tint — card fills, badge bg, active pills */
          200: '#BEE3DB',   /* soft teal border */
          300: '#89D2CE',   /* subtle accent */
          400: '#5EC0BA',   /* mid-light teal */
          500: '#3AAFA9',   /* mid teal / secondary brand */
          600: '#3AAFA9',   /* CTA hover / focus rings */
          700: '#2B7A78',   /* primary dark teal */
          800: '#2B7A78',   /* primary dark teal — headings, buttons, icons */
          900: '#1d5553',   /* darkest — high-contrast text on light bg, button hover */
          950: '#143c3a',   /* deep contrast */
        },
      },
      fontFamily: {
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
