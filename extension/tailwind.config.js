/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./dist/*.html",
  ],
  theme: {
    extend: {
      colors: {
        "brand-primary": "#4A90E2",
        "brand-secondary": "#50E3C2",
        "background-light": "#F5F5F5",
        "text-primary": "#333333",
      },
    },
  },
  plugins: [],
};
