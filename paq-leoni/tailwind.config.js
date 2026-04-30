/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'ripple': 'ripple 0.6s linear',
        'spin-slow': 'spin 1s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
       colors: {
        leoniBlue: "#005baa",
        leoniDark: "#0b1220",
        leoniGray: "#1f2937",
         red: "#c8102e",
          dark: "#1a2332",
          gray: "#f4f6f8",
      }
    },
  },
  plugins: [],
}

