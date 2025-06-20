/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Changed to 'Kanit' with appropriate fallback
        headline: ['Kanit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}