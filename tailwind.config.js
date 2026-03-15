/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': '#0a0a0f',
        'bg-card': 'rgba(255, 255, 255, 0.03)',
        'border-custom': 'rgba(255, 255, 255, 0.1)',
        'primary': '#667eea',
        'primary-dark': '#764ba2',
        'success': '#10b981',
        'text-muted': 'rgba(255, 255, 255, 0.5)',
      },
    },
  },
  plugins: [],
}
