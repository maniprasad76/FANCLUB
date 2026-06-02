/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F0F0F0",
        foreground: "#121212",
        "primary-red": "#D02020",
        "primary-blue": "#1040C0",
        "primary-yellow": "#F0C020",
        border: "#121212",
        muted: "#E0E0E0",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        sm: "4px 4px 0px 0px black",
        md: "6px 6px 0px 0px black",
        lg: "8px 8px 0px 0px black",
      },
      borderWidth: {
        '2': '2px',
        '4': '4px',
      }
    },
  },
  plugins: [],
}
