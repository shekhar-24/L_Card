/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#fff6fb',
        blush: '#ff7aa8',
        gold: '#ffd36e',
      },
      fontFamily: {
        display: ['Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', 'Palatino', 'serif'],
        body: ['Avenir Next', 'Segoe UI', 'Trebuchet MS', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
