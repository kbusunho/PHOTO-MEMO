/** @type {import('tailwindcss').Config} */
export default {
  // 👇 1. 이 줄을 추가합니다.
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}