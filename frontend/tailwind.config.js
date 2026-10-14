/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: '#00E5FF',
          blueHover: '#38EDFF',
          blueDark: '#0099B8',
          yellow: '#FFE600',
          yellowHover: '#FFF04D',
          yellowDark: '#D4BE00',
        },
        brand: {
          bg: '#0A0F1D',
          surface: '#11192E',
          surfaceHover: '#16223D',
          border: '#1E2D4A',
          borderActive: '#00E5FF',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        flyToCart: {
          '0%': { transform: 'scale(1) translate(0, 0)', opacity: '1' },
          '50%': { transform: 'scale(1.3) translate(var(--tw-translate-x, 150px), var(--tw-translate-y, -250px))', opacity: '0.9' },
          '100%': { transform: 'scale(0.3) translate(var(--tw-translate-x, 300px), var(--tw-translate-y, -500px))', opacity: '0' },
        },
        cartBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.35)' },
        },
      },
      animation: {
        flyToCart: 'flyToCart 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        cartBounce: 'cartBounce 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}
