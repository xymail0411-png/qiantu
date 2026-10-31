/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF8',
        card: '#FFFFFF',
        primary: '#6C63FF',
        expense: '#FF6B6B',
        income: '#51CF66',
        text: '#2D2D2D',
        sub: '#999999',
        border: '#F0F0F0',
      },
    },
  },
  plugins: [],
}
