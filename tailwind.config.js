const { platformSelect } = require("nativewind/theme");

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
      fontFamily: {
        heading: platformSelect({
          ios: "SF Pro Rounded",
          default: "System",
        }),
      },
      colors: {
        brand: {
          DEFAULT: "#10B981",
          dark: "#059669",
          light: "#D1FAE5",
        },
        semantic: {
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
        neutral: {
          text: "#0F172A",
          secondary: "#64748B",
          tertiary: "#94A3B8",
          border: "#E2E8F0",
          surface: "#F1F5F9",
          bg: "#F8FAFC",
        },
      },
      fontSize: {
        "page-title": ["28px", { lineHeight: "34px", fontWeight: "700" }],
        "key-number": ["32px", { lineHeight: "38px", fontWeight: "700" }],
        "section-heading": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "card-title": ["16px", { lineHeight: "22px", fontWeight: "600" }],
        body: ["15px", { lineHeight: "22px", fontWeight: "400" }],
        metadata: ["13px", { lineHeight: "18px", fontWeight: "400" }],
        overline: [
          "11px",
          { lineHeight: "14px", fontWeight: "600", letterSpacing: "0.1em" },
        ],
        badge: ["11px", { lineHeight: "14px", fontWeight: "500" }],
      },
      boxShadow: {
        DEFAULT:
          "0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.04)",
        md: "0px 4px 8px rgba(0, 0, 0, 0.08), 0px 2px 4px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px",
        card: "12px",
        "card-lg": "16px",
      },
    },
  },
  plugins: [],
};
