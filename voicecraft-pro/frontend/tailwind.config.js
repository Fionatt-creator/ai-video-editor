/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          dark: '#1a1a1a',
          light: '#f5f5f5',
          blue: '#1e3a5f',
        }
      }
    },
  },
  plugins: [],
}