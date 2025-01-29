/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'corporate': {
          'primary': '#BB001E',
          'text': '#DF0024',
        }
      }
    },
  },
  plugins: [],
};