/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FFF8F0',
        card: '#FFFFFF',
        primary: '#FF9B9B',
        'primary-dark': '#FF7EB3',
        'primary-light': '#FFB5B5',
        expense: '#FF7EB3',
        income: '#7FD8A8',
        text: '#5D4E37',
        sub: '#A89B8C',
        border: '#F0E6D8',
        coral: {
          DEFAULT: '#FF9B9B',
          light: '#FFB5B5',
          dark: '#FF7EB3',
        },
        lavender: {
          DEFAULT: '#B8A9FF',
          light: '#D4C9FF',
        },
        mint: {
          DEFAULT: '#7FD8A8',
          light: '#A8E6C3',
        },
        cream: {
          DEFAULT: '#FFF8F0',
          dark: '#FFF0E0',
        },
        warm: {
          yellow: '#FFD93D',
          blue: '#A8D8EA',
        },
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(255,155,155,0.12)',
        'cute': '0 6px 24px rgba(184,169,255,0.15)',
        'warm': '0 4px 16px rgba(255,155,155,0.10)',
      },
    },
  },
  plugins: [],
}
