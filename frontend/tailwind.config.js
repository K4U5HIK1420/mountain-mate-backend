/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        mountainGreen: '#064e3b',
        deepForest: '#022c22',
        goldenSun: '#f59e0b',
        snowWhite: '#f8fafc',
      },
      backgroundImage: {
        'hero-gradient': "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }
    },
  },
  plugins: [],
}