/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
      colors: {
        'rich-black': '#000000',
        'oxford-blue': '#121212',
        'yinmn-blue': '#333333',
        'verdigris': '#757575',
        'fluorescent-cyan': '#000000', // Mapping to black/white to avoid cyan leaks
        'paper-white': '#F5F5F5',
      }
  },
  plugins: [],
}
