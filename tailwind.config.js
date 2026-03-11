/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Warm, friendly palette (Duolingo-lite direction)
        primary: {
          50: "#fef3e2",
          100: "#fde4b9",
          200: "#fcd48c",
          300: "#fbc35f",
          400: "#fab63d",
          500: "#f9a825", // main primary
          600: "#f59b20",
          700: "#ef8a19",
          800: "#e97a13",
          900: "#df5f0a",
        },
        surface: {
          50: "#fefdfb",
          100: "#fdf9f3",
          200: "#faf3e8",
        },
        accent: {
          500: "#66bb6a", // friendly green for success states
        },
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
