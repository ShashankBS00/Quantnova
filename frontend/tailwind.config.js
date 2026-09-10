/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          base: "#5b6178",
          surface: "#ffffff",
          border: "#e4e7f2",
          accent: "#d97706",
        }
      }
    },
  },
  plugins: [],
}