/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e8edff',
          500: '#7c8cff',
          600: '#6575f6',
        },
      },
      boxShadow: {
        soft: '0 20px 60px rgba(99, 102, 241, 0.14)',
      },
    },
  },
  plugins: [],
};
