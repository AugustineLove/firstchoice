/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  '#f0faf2',
          100: '#d8f3dc',
          200: '#aee5b8',
          300: '#74cf88',
          400: '#52b788',
          500: '#2d9e5f',
          600: '#1a7a46',
          700: '#2d6a4f',
          800: '#1a3d2b',
          900: '#0d1f17',
        },
        accent: {
          DEFAULT: '#f4a261',
          dark: '#e8943a',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}