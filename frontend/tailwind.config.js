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
          base: "#5d5f68ff",
          surface: "#12141a",
          border: "#1f232d",
          accent: "#f59e0b",
        }
      }
    },
  },
  plugins: [],
}

