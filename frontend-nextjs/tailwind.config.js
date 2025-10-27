/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#6C63FF', // لون مميز قريب من هوستنجر
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};
